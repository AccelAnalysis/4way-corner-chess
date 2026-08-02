import { errorResponse, ok, readJson, requireString } from '../../../../src/server/http';
import { requireFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { ensureUserProfile, recordPendingCheckout } from '../../../../src/server/profile';
import { getStripeClient } from '../../../../src/server/stripe';
import { getCoinPack } from '../../../../src/shop/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function applicationOrigin(request) {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const origin = configured || new URL(request.url).origin;
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid APP_BASE_URL.');
  return url.origin;
}

export async function POST(request) {
  try {
    const claims = await requireFirebaseUser(request);
    const body = await readJson(request);
    const pack = getCoinPack(body.packId);
    if (!pack) {
      return Response.json({ ok: false, error: { code: 'PACK_NOT_FOUND', message: 'That Kani Coin pack does not exist.' } }, { status: 404 });
    }
    const checkoutId = requireString(body.checkoutId, 'checkoutId', { min: 8, max: 80 }).replace(/[^a-zA-Z0-9_-]/g, '');
    const origin = applicationOrigin(request);
    const { db } = getFirebaseAdmin();
    await ensureUserProfile(db, claims);

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: claims.uid,
      customer_email: claims.isAnonymous ? undefined : claims.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pack.priceCents,
          product_data: {
            name: `Kani ${pack.name}`,
            description: pack.description,
            metadata: { packId: pack.id, coins: String(pack.coins) },
          },
        },
      }],
      metadata: {
        uid: claims.uid,
        packId: pack.id,
        coins: String(pack.coins),
        checkoutId,
        environment: 'test',
      },
      payment_intent_data: {
        metadata: {
          uid: claims.uid,
          packId: pack.id,
          coins: String(pack.coins),
          checkoutId,
        },
      },
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cancel`,
      submit_type: 'pay',
    }, {
      idempotencyKey: `kani:${claims.uid}:${checkoutId}`,
    });

    await recordPendingCheckout(db, claims, session, pack);
    return ok({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    return errorResponse(error);
  }
}

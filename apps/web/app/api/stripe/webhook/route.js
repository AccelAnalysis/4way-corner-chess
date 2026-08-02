import { FieldValue } from 'firebase-admin/firestore';
import { errorResponse, ok } from '../../../../src/server/http';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { fulfillStripeCheckout } from '../../../../src/server/profile';
import { getStripeClient, getStripeWebhookSecret } from '../../../../src/server/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) return Response.json({ ok: false, error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature.' } }, { status: 400 });

    const payload = await request.text();
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
    const { db } = getFirebaseAdmin();

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.payment_status === 'paid') await fulfillStripeCheckout(db, session);
    } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await db.collection('stripeCheckoutSessions').doc(session.id).set({
        status: event.type === 'checkout.session.expired' ? 'expired' : 'failed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return ok({ received: true });
  } catch (error) {
    if (error?.type === 'StripeSignatureVerificationError') {
      return Response.json({ ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid Stripe signature.' } }, { status: 400 });
    }
    return errorResponse(error);
  }
}

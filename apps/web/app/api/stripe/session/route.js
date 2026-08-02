import { ApiError, errorResponse, ok } from '../../../../src/server/http';
import { requireFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const claims = await requireFirebaseUser(request);
    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId || !sessionId.startsWith('cs_')) throw new ApiError(400, 'INVALID_SESSION_ID', 'A valid Checkout Session ID is required.');
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection('stripeCheckoutSessions').doc(sessionId).get();
    if (!snapshot.exists) throw new ApiError(404, 'SESSION_NOT_FOUND', 'The Kani checkout record was not found.');
    const data = snapshot.data();
    if (data.uid !== claims.uid) throw new ApiError(403, 'SESSION_FORBIDDEN', 'This checkout belongs to another player.');
    return ok({
      session: {
        id: sessionId,
        status: data.status,
        packId: data.packId,
        coins: data.coins,
        amountPaid: data.amountPaid || null,
        currency: data.currency || 'usd',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

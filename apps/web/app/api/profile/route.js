import { errorResponse, ok } from '../../../src/server/http';
import { requireFirebaseUser } from '../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../src/firebase/admin';
import { getUserProfile } from '../../../src/server/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const claims = await requireFirebaseUser(request);
    const { db } = getFirebaseAdmin();
    const profile = await getUserProfile(db, claims);
    return ok({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}

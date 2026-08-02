import { errorResponse, ok, readJson } from '../../../../src/server/http';
import { requireRegisteredFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { createRoom } from '../../../../src/server/rooms';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function POST(request) { try { const claims = await requireRegisteredFirebaseUser(request, 'Online rooms'); const body = await readJson(request); const { db } = getFirebaseAdmin(); return ok(await createRoom(db, claims, body)); } catch (error) { return errorResponse(error); } }

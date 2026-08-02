import { errorResponse, ok, readJson } from '../../../../src/server/http';
import { requireRegisteredFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { setRoomReady } from '../../../../src/server/rooms';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function POST(request) { try { const claims = await requireRegisteredFirebaseUser(request, 'Online rooms'); const body = await readJson(request); const { db } = getFirebaseAdmin(); return ok(await setRoomReady(db, claims, body.roomCode, body.ready)); } catch (error) { return errorResponse(error); } }

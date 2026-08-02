import { errorResponse, ok, readJson } from '../../../../src/server/http';
import { requireFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { timeoutRoomTurn } from '../../../../src/server/rooms';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function POST(request) { try { const claims = await requireFirebaseUser(request); const body = await readJson(request); const { db } = getFirebaseAdmin(); return ok(await timeoutRoomTurn(db, claims, body.roomCode, body.expectedVersion)); } catch (error) { return errorResponse(error); } }

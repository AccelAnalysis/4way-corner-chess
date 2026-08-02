import { errorResponse, ok, readJson, requireString } from '../../../../src/server/http';
import { requireRegisteredFirebaseUser } from '../../../../src/server/firebase-auth';
import { getFirebaseAdmin } from '../../../../src/firebase/admin';
import { ensureUserProfile, equipShopItem } from '../../../../src/server/profile';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function POST(request) { try { const claims = await requireRegisteredFirebaseUser(request, 'Saved cosmetics'); const body = await readJson(request); const itemId = requireString(body.itemId, 'itemId', { min: 3, max: 80 }); const { db } = getFirebaseAdmin(); await ensureUserProfile(db, claims); return ok(await equipShopItem(db, claims, itemId)); } catch (error) { return errorResponse(error); } }

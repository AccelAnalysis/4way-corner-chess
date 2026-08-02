import { ApiError } from './http';
import { getFirebaseAdmin } from '../firebase/admin';

export async function requireFirebaseUser(request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in before using this feature.');
  }

  let admin;
  try {
    admin = getFirebaseAdmin();
  } catch (error) {
    if (error?.code === 'FIREBASE_ADMIN_NOT_CONFIGURED') {
      throw new ApiError(503, 'FIREBASE_NOT_CONFIGURED', 'Online services are not configured on this deployment.');
    }
    throw error;
  }

  try {
    const decoded = await admin.auth.verifyIdToken(match[1], true);
    return {
      ...decoded,
      uid: decoded.uid,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
    };
  } catch {
    throw new ApiError(401, 'INVALID_AUTH_TOKEN', 'The Firebase session is invalid or expired.');
  }
}

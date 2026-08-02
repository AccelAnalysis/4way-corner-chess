import { ApiError } from './http';

const LOOKUP_ENDPOINT = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';
const INVALID_TOKEN_CODES = new Set([
  'INVALID_ID_TOKEN',
  'TOKEN_EXPIRED',
  'CREDENTIAL_TOO_OLD_LOGIN_AGAIN',
  'USER_DISABLED',
  'USER_NOT_FOUND',
]);

function firebaseWebApiKey() {
  return process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
}

async function lookupFirebaseAccount(idToken) {
  const apiKey = firebaseWebApiKey();
  if (!apiKey) {
    throw new ApiError(503, 'FIREBASE_NOT_CONFIGURED', 'Firebase Authentication is not configured on this deployment.');
  }

  let response;
  try {
    response = await fetch(`${LOOKUP_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(503, 'FIREBASE_AUTH_UNAVAILABLE', 'Firebase Authentication could not be reached.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firebaseCode = String(payload?.error?.message || '').split(' : ')[0];
    if (INVALID_TOKEN_CODES.has(firebaseCode)) {
      throw new ApiError(401, 'INVALID_AUTH_TOKEN', 'The Firebase session is invalid or expired.');
    }
    throw new ApiError(503, 'FIREBASE_AUTH_UNAVAILABLE', 'Firebase Authentication rejected the server verification request.');
  }

  const account = payload.users?.[0];
  if (!account || account.disabled) {
    throw new ApiError(401, 'INVALID_AUTH_TOKEN', 'The Firebase session is invalid or expired.');
  }
  return account;
}

export async function requireFirebaseUser(request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Sign in before using this feature.');
  }

  const account = await lookupFirebaseAccount(match[1]);
  const providers = Array.isArray(account.providerUserInfo) ? account.providerUserInfo : [];
  const isAnonymous = !account.email && !account.phoneNumber && providers.length === 0 && account.customAuth !== true;

  return {
    uid: account.localId,
    email: account.email || null,
    name: account.displayName || null,
    email_verified: Boolean(account.emailVerified),
    isAnonymous,
    providerIds: providers.map((provider) => provider.providerId).filter(Boolean),
  };
}

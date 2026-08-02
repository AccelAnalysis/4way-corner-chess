import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let cachedAdmin = null;

function decodeServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;

  const normalize = (value) => {
    if (!value || typeof value !== 'object') return value;
    return {
      projectId: value.projectId || value.project_id,
      clientEmail: value.clientEmail || value.client_email,
      privateKey: String(value.privateKey || value.private_key || '').replace(/\\n/g, '\n'),
    };
  };

  if (raw) return normalize(JSON.parse(raw));
  if (encoded) return normalize(JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')));

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };
  return null;
}

export function getFirebaseAdmin() {
  if (cachedAdmin) return cachedAdmin;

  const serviceAccount = decodeServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const allowApplicationDefault = process.env.FIREBASE_USE_APPLICATION_DEFAULT === 'true';

  if (!serviceAccount && !allowApplicationDefault) {
    const error = new Error('Firebase Admin credentials are not configured.');
    error.code = 'FIREBASE_ADMIN_NOT_CONFIGURED';
    throw error;
  }

  const app = getApps()[0] || initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });

  const firestore = getFirestore(app);
  firestore.settings({ ignoreUndefinedProperties: true });

  cachedAdmin = {
    app,
    auth: getAuth(app),
    db: firestore,
  };
  return cachedAdmin;
}

export function firebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 ||
    (
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) ||
    process.env.FIREBASE_USE_APPLICATION_DEFAULT === 'true'
  );
}

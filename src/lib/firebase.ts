import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as Record<string, any>).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
];
export const CALENDAR_SCOPES = WORKSPACE_SCOPES; // Backward compatibility

// Pure Google Auth Provider for Artists & Users (no intrusive calendar permissions)
export const googleAuthProvider = new GoogleAuthProvider();
export const googleProvider = googleAuthProvider; // Backward compatibility

// Google Workspace OAuth Provider for 171 Studio Master (Gmail automation & Calendar sync)
export const googleWorkspaceProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => googleWorkspaceProvider.addScope(scope));
export const googleCalendarProvider = googleWorkspaceProvider; // Backward compatibility

// In-memory token cache for Google Workspace Calendar integration
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  // Silently ignore expected offline or unauthenticated initial probe warnings
  if (
    errMessage.includes('the client is offline') || 
    errMessage.includes('Missing or insufficient permissions') ||
    errMessage.includes('permission-denied')
  ) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.debug('Firestore Notice: ', JSON.stringify(errInfo));
}

// Test connection on startup per skill guideline
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'cms'));
  } catch {
    // Graceful offline fallback
  }
}
testConnection();

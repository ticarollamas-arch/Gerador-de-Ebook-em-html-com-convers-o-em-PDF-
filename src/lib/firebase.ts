import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';

// Default fallback config or loaded from firebase-applet-config.json
let firebaseConfig: any = {
  apiKey: "AIzaSyDummyKeyForPlaceholderConfig",
  authDomain: "applet-placeholder.firebaseapp.com",
  projectId: "applet-placeholder",
};

try {
  // Dynamically import config if exists
  const configModule = (import.meta as any).glob('/firebase-applet-config.json', { eager: true });
  const keys = Object.keys(configModule);
  if (keys.length > 0) {
    firebaseConfig = (configModule[keys[0]] as any).default || configModule[keys[0]];
  }
} catch (e) {
  console.log('Firebase config file pending setup.');
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedToken = () => cachedAccessToken;

export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

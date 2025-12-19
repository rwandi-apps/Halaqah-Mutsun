import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase config
 * Vite WAJIB pakai import.meta.env
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Validasi minimal config
 */
const isConfigValid =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
} else {
  console.warn('[Firebase] Missing environment variables. Running in demo mode.');
}

export { db, auth };
export const isFirebaseEnabled = isConfigValid && !!app;

/**
 * Optional init log
 */
export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(
      `[Firebase] Connected to project: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`
    );
  } else {
    console.warn('[Firebase] Firebase disabled (demo mode)');
  }
};

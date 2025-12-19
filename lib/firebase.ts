import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Firebase config (VITE)
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
 * Validasi ENV (WAJIB import.meta.env)
 */
const isConfigValid =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

/**
 * Init Firebase (safe)
 */
const app = isConfigValid
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : undefined;

export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;

export const isFirebaseEnabled = isConfigValid && !!app;

/**
 * Optional log
 */
export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(
      `[Firebase] Connected to project: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`
    );
  } else {
    console.warn('[Firebase] Firebase disabled. Check .env');
  }
};

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Vite HARUS pakai import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validasi minimal
const isConfigValid =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app;

try {
  if (isConfigValid) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } else {
    console.warn('[Firebase] Config tidak lengkap');
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
}

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const isFirebaseEnabled = !!app;

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(
      `[Firebase] Active Project: ${firebaseConfig.projectId}`
    );
  } else {
    console.error(
      '[Firebase] Firebase disabled — cek Vercel Environment Variables'
    );
  }
};

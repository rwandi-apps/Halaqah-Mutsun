
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Menggunakan process.env (Vercel akan menginjeksi ini secara otomatis)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Validasi minimal
const isConfigValid = !!process.env.VITE_FIREBASE_API_KEY && !!process.env.VITE_FIREBASE_PROJECT_ID;

let app;
try {
  app = isConfigValid 
    ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
    : undefined;
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const isFirebaseEnabled = !!app;

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(`[Firebase] Active Project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  } else {
    console.error("[Firebase] Config missing! Check Vercel Environment Variables.");
  }
};

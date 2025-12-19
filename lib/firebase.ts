
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


const isConfigValid = !!process.env.VITE_FIREBASE_API_KEY && !!process.env.VITE_FIREBASE_PROJECT_ID;

const app = isConfigValid 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) 
  : undefined;

export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const isFirebaseEnabled = isConfigValid && !!app;

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    // Fix: Updated to use process.env for consistency across the file.
    console.log(`[Firebase] Connected to: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  } else {
    console.warn("[Firebase] Configuration missing or invalid. Check your .env file.");
  }
};

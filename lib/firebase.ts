
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Prioritize Environment Variables (Production), fallback to hardcoded (Dev/Demo)
const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY") || "AIzaSyBRI2q9e5mCx9yHod6pP18WS7M2LIcAoPQ",
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || "halaqah-sdq.firebaseapp.com",
  projectId: getEnv("FIREBASE_PROJECT_ID") || "halaqah-sdq",
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || "halaqah-sdq.firebasestorage.app",
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || "240288935730",
  appId: getEnv("FIREBASE_APP_ID") || "1:240288935730:web:f15aeeb395a721fe7bf12b"
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

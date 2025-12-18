import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Helper to safely access environment variables in Browser (Vite) or Node
const getEnv = (key: string) => {
  // 1. Try Vite (import.meta.env) with VITE_ prefix
  // We use a safe check for import.meta to avoid errors in environments where it might strictly fail
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}

  // 2. Try Node/Next.js (process.env)
  // CRITICAL: We must check if 'process' is defined before accessing it to avoid ReferenceError in Vite
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[`NEXT_PUBLIC_${key}`]) {
        return process.env[`NEXT_PUBLIC_${key}`];
      }
      if (process.env[key]) {
        return process.env[key];
      }
    }
  } catch (e) {}

  return "";
};

// Prioritize Environment Variables (Production), fallback to hardcoded (Dev/Demo)
const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY") || "AIzaSyBRI2q9e5mCx9yHod6pP18WS7M2LIcAoPQ",
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || "halaqah-sdq.firebaseapp.com",
  projectId: getEnv("FIREBASE_PROJECT_ID") || "halaqah-sdq",
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || "halaqah-sdq.firebasestorage.app",
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || "240288935730",
  appId: getEnv("FIREBASE_APP_ID") || "1:240288935730:web:f15aeeb395a721fe7bf12b"
};

// Check if config is valid
export const isFirebaseEnabled = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY";

let app;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseEnabled) {
  try {
    // Prevent multiple initializations
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Fallback to avoid crash
    auth = undefined;
    db = undefined;
  }
} else {
  console.warn("Firebase Config is using placeholders. App is running in pure Demo Mode.");
}

export { auth, db };

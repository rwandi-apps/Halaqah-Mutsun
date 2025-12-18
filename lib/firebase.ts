import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Menggunakan import.meta.env dengan prefix VITE_ agar terbaca di production (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Cek ketersediaan konfigurasi di browser
const isConfigValid = !!import.meta.env.VITE_FIREBASE_API_KEY && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isConfigValid) {
  try {
    // Singleton pattern untuk mencegah double initialization
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
}

export { db, auth };
export const isFirebaseEnabled = isConfigValid && !!app;

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(`[Firebase] Active: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}`);
  } else {
    console.warn("[Firebase] Config missing. Check Vercel Environment Variables.");
  }
};
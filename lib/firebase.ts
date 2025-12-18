import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Konfigurasi Firebase menggunakan environment variables.
 * Pastikan variabel ini didefinisikan di environment.
 */
// Fixed: Switched from import.meta.env to process.env to resolve TypeScript 'ImportMeta' property errors
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Fixed: Switched from import.meta.env to process.env to resolve TypeScript 'ImportMeta' property errors
// Cek apakah konfigurasi minimal tersedia
const isConfigValid = !!process.env.VITE_FIREBASE_API_KEY && !!process.env.VITE_FIREBASE_PROJECT_ID;

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (isConfigValid) {
  // Pola Singleton: Gunakan app yang sudah ada jika tersedia, jika tidak buat baru.
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn("Firebase Configuration is missing. Please check your .env.local file.");
}

export { db, auth };
export const isFirebaseEnabled = isConfigValid;

/**
 * Fungsi inisialisasi untuk dipanggil saat aplikasi start.
 */
export const initFirebase = () => {
  if (isFirebaseEnabled) {
    // Fixed: Switched from import.meta.env to process.env to resolve TypeScript 'ImportMeta' property errors
    console.log(`[Firebase] Initialized for project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  } else {
    console.warn("[Firebase] Running in restricted/demo mode (Missing Credentials)");
  }
};
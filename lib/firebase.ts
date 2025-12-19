
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Vite membutuhkan import.meta.env agar variabel tersedia di browser
// @ts-ignore - Menghindari error TS jika tipe env tidak didefinisikan
const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Validasi apakah config berhasil dimuat
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app;
try {
  if (isConfigValid) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
} catch (e) {
  console.error("[Firebase] Initialization Error:", e);
}

export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const isFirebaseEnabled = !!app;

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log(`[Firebase] Terhubung ke Project: ${firebaseConfig.projectId}`);
  } else {
    console.error("[Firebase] Konfigurasi Gagal! Pastikan Environment Variables di Vercel sudah benar (VITE_ prefix).");
  }
};

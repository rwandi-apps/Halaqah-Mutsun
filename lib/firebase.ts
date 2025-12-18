
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Safety check untuk mencegah crash jika env belum tersedia
// Fixed: Using process.env instead of import.meta.env to resolve TS error
const getEnv = (key: string) => {
  try {
    return (process.env as any)[key] || "";
  } catch (e) {
    return "";
  }
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

const isConfigValid = !!getEnv('VITE_FIREBASE_API_KEY') && !!getEnv('VITE_FIREBASE_PROJECT_ID');

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isConfigValid) {
  try {
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
    console.log(`[Firebase] Connected to: ${getEnv('VITE_FIREBASE_PROJECT_ID')}`);
  } else {
    console.warn("[Firebase] Config missing. Realtime features might be disabled.");
  }
};

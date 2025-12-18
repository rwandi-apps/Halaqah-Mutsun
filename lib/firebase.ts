import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const isFirebaseEnabled = false;

// We initialize even if disabled to avoid crash on import in skeleton mode
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log("Firebase Initialized");
  } else {
    console.log("Firebase config not found, running in demo mode.");
  }
};
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyBRI2q9e5mCx9yHod6pP18WS7M2LIcAoPQ",
  authDomain: "halaqah-sdq.firebaseapp.com",
  projectId: "halaqah-sdq",
  storageBucket: "halaqah-sdq.firebasestorage.app",
  messagingSenderId: "240288935730",
  appId: "1:240288935730:web:f15aeeb395a721fe7bf12b"
};

export const isFirebaseEnabled = true;

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const initFirebase = () => {
  if (isFirebaseEnabled) {
    console.log("Firebase Initialized with production config.");
  } else {
    console.log("Firebase config not found, running in demo mode.");
  }
};
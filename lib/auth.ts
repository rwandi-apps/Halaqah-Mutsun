import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '../types';

/**
 * Real Firebase Sign In
 * Authenticates user and fetches profile data from Firestore 'users' collection.
 */
export const login = async (email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error("Firebase Auth is not initialized");

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const firebaseUser = userCredential.user;

  // Attempt to fetch profile details (Role, Name, etc.) from Firestore
  try {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: data.name || firebaseUser.displayName || 'User SDQ',
        role: (data.role as Role) || 'GURU',
        nickname: data.nickname || '',
      };
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
  }

  // Fallback if firestore document doesn't exist yet
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || 'User SDQ',
    role: 'GURU'
  };
};

/**
 * Demo Mode Login
 * Used for local testing without Firebase connectivity.
 */
export const mockLogin = async (email: string, role: Role): Promise<User> => {
  return { 
    id: `mock-${role.toLowerCase()}`, 
    email: email || `demo@sdq.com`, 
    name: `Ustadz ${role === 'GURU' ? 'Ahmad' : 'Umar'} (Demo)`, 
    role 
  };
};

/**
 * Sign Out from Firebase
 */
export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
};
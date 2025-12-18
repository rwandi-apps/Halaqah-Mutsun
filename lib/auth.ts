import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from './firebase';
import { User, Role } from '../types';

// Login function: Authenticates with Auth, then fetches Role from Firestore 'users' collection
export const login = async (email: string, password: string): Promise<User> => {
  if (!isFirebaseEnabled || !auth) {
    throw new Error("Koneksi ke Firebase gagal. Cek konfigurasi API Key.");
  }

  try {
    // 1. Authenticate with Email/Password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Fetch User Profile & Role from Firestore
    // Assuming you have a collection 'users' where document ID = UID
    let userData: any = {};
    let userRole: Role = 'GURU'; // Default role if not found

    if (db) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          userData = userDoc.data();
          userRole = (userData.role as Role) || 'GURU';
        } else {
          console.warn("User document not found in Firestore. Using auth profile.");
        }
      } catch (dbError) {
        console.error("Firestore Error (ignoring for login):", dbError);
        // Continue login even if DB fetch fails (e.g. permission issues), use defaults
      }
    }

    return {
      id: firebaseUser.uid,
      name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      role: userRole,
    };

  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  if (auth) {
    await firebaseSignOut(auth);
  }
};

// Mock fallback for Demo purposes
export const mockLogin = async (email: string, role: Role): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { 
    id: 'mock-id-' + Math.floor(Math.random() * 1000), 
    name: role === 'KOORDINATOR' ? 'Demo Koordinator' : 'Demo Guru', 
    email, 
    role 
  };
};

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '../types';

export const login = async (email: string, password: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase not initialized');
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = cred.user;

  const userRef = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error('Akun belum didaftarkan oleh admin');
  }

  const data = snap.data();

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: data.name || 'User SDQ',
    nickname: data.nickname || '',
    role: data.role as Role,
  };
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

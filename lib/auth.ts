import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Role } from '../types';

export const login = async (email: string, pass: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase belum siap');
  }

  // 1. Login ke Firebase Auth
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = cred.user;

  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  // 2. JIKA BELUM ADA DI FIRESTORE → BUATKAN
  if (!snap.exists()) {
    const newUser: User = {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || 'Guru SDQ',
      role: 'GURU',
      createdAt: new Date().toISOString(),
    };

    await setDoc(ref, {
      ...newUser,
      createdAt: serverTimestamp(),
    });

    return newUser;
  }

  // 3. Jika SUDAH ADA → PAKAI DATA FIRESTORE
  const data = snap.data();

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: data.name,
    nickname: data.nickname || '',
    role: data.role as Role,
  };
};

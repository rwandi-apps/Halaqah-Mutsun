
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

const STORAGE_KEY = 'sdq_auth_user';

export const simpleLogin = async (email: string, pass: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error("Firebase belum terkonfigurasi dengan benar di environment variables.");
  }

  try {
    // 1. Login menggunakan Firebase Authentication asli
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const firebaseUser = userCredential.user;

    // 2. Ambil data tambahan (role, nickname) dari Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let userDocSnap = await getDoc(userDocRef);

    let userData = userDocSnap.exists() ? userDocSnap.data() : null;

    // 3. Jika dokumen di Firestore belum ada, buatkan default (agar tidak error)
    if (!userData) {
      const defaultData = {
        name: firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email,
        role: 'GURU', // Default role jika belum diatur
        nickname: email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, defaultData);
      userData = defaultData;
    }

    const authenticatedUser: User = {
      id: firebaseUser.uid,
      name: userData.name || 'User',
      email: firebaseUser.email || '',
      role: userData.role || 'GURU',
      nickname: userData.nickname || userData.name,
      ...(userData.teacherId ? { teacherId: userData.teacherId } : { teacherId: firebaseUser.uid })
    } as any;

    // Simpan ke localStorage agar sesi tetap ada setelah refresh
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    
    return authenticatedUser;
  } catch (error: any) {
    console.error("Login Error:", error.code, error.message);
    
    // Mapping error Firebase ke bahasa Indonesia
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
      throw new Error("Email tidak terdaftar atau format salah.");
    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error("Password salah.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Koneksi internet bermasalah.");
    }
    
    throw new Error(error.message || "Gagal masuk ke sistem.");
  }
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
};

export const simpleLogout = async () => {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem(STORAGE_KEY);
};

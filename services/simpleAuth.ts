
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

const STORAGE_KEY = 'sdq_auth_user';

/**
 * Fungsi Login Utama
 */
export const simpleLogin = async (email: string, pass: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error("Firebase belum terhubung. Periksa konfigurasi API Key Anda.");
  }

  try {
    // 1. Verifikasi Email & Password di Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const firebaseUser = userCredential.user;

    // 2. Cari data tambahan (Role) di Firestore collection 'users'
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    let finalUser: User;

    if (userDocSnap.exists()) {
      // Jika user sudah terdaftar di Firestore
      const data = userDocSnap.data();
      finalUser = {
        id: firebaseUser.uid,
        name: data.name || firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email || email,
        role: data.role || 'GURU', // Default jika field role kosong
        nickname: data.nickname || data.name || email.split('@')[0],
        teacherId: data.teacherId || firebaseUser.uid
      } as any;
    } else {
      // Jika login sukses tapi dokumen Firestore belum ada (biasanya user baru dibuat di Auth Console)
      // Kita buatkan otomatis profil default sebagai GURU
      const defaultProfile = {
        name: firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email,
        role: 'GURU', 
        nickname: email.split('@')[0],
        teacherId: firebaseUser.uid,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, defaultProfile);
      
      finalUser = {
        id: firebaseUser.uid,
        ...defaultProfile
      } as any;
    }

    // Simpan ke localStorage agar tidak perlu login ulang saat refresh
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUser));
    return finalUser;

  } catch (error: any) {
    console.error("Auth Error:", error.code);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error("Email atau password salah.");
    } else if (error.code === 'auth/user-not-found') {
      throw new Error("Akun tidak ditemukan.");
    }
    throw new Error("Gagal masuk: " + error.message);
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
  if (auth) await signOut(auth);
  localStorage.removeItem(STORAGE_KEY);
};

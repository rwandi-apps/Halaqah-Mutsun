
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

const STORAGE_KEY = 'sdq_auth_user';

/**
 * Fungsi Login Utama
 * Mendukung Firebase Auth dengan fallback pencarian di Firestore 'users'
 */
export const simpleLogin = async (email: string, pass: string): Promise<User> => {
  if (!db) {
    throw new Error("Firebase Firestore belum terhubung. Periksa konfigurasi Anda.");
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    let firebaseUser: any = null;
    let authSuccess = false;

    // 1. Coba Login via Firebase Auth jika tersedia
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        firebaseUser = userCredential.user;
        authSuccess = true;
      } catch (authError: any) {
        console.warn("Firebase Auth failed, checking Firestore fallback...", authError.code);
        // Jika password salah (auth/wrong-password atau auth/invalid-credential), 
        // kita tetap lanjut ke pengecekan Firestore untuk "Master Password" sdq123
        if (authError.code !== 'auth/user-not-found' && 
            authError.code !== 'auth/wrong-password' && 
            authError.code !== 'auth/invalid-credential') {
          throw authError;
        }
      }
    }

    // 2. Cari data di Firestore collection 'users' berdasarkan EMAIL
    // Ini penting karena ID dokumen di Firestore mungkin bukan UID Auth (jika ditambah manual oleh koordinator)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail));
    const querySnapshot = await getDocs(q);

    let finalUser: User | null = null;

    if (!querySnapshot.empty) {
      // User ditemukan di Firestore
      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      
      // Jika Auth gagal, cek apakah menggunakan Master Password "sdq123"
      if (!authSuccess && pass !== 'sdq123') {
        throw new Error("Email atau password salah.");
      }

      finalUser = {
        id: authSuccess ? firebaseUser.uid : userDoc.id,
        name: data.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: data.role || 'GURU',
        nickname: data.nickname || data.name || cleanEmail.split('@')[0],
        teacherId: data.teacherId || userDoc.id
      } as User;

      // Jika login via Auth sukses tapi ID dokumen berbeda, kita bisa update atau biarkan
      // Untuk kemudahan, kita simpan UID Auth ke dalam data jika belum ada
      if (authSuccess && userDoc.id !== firebaseUser.uid) {
        // Opsional: Migrasi ID dokumen ke UID Auth agar lebih konsisten
        // await setDoc(doc(db, 'users', firebaseUser.uid), { ...data, authUid: firebaseUser.uid });
      }
    } else {
      // User TIDAK ditemukan di Firestore
      if (authSuccess) {
        // Jika Auth sukses tapi Firestore kosong, buatkan profil default
        const defaultProfile = {
          name: firebaseUser.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'GURU', 
          nickname: cleanEmail.split('@')[0],
          teacherId: firebaseUser.uid,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
        
        finalUser = {
          id: firebaseUser.uid,
          ...defaultProfile
        } as User;
      } else {
        // Auth gagal dan Firestore juga tidak ada
        throw new Error("Akun tidak ditemukan. Pastikan email sudah didaftarkan oleh Koordinator.");
      }
    }

    if (!finalUser) throw new Error("Gagal mengidentifikasi pengguna.");

    // Simpan ke localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUser));
    return finalUser;

  } catch (error: any) {
    console.error("Auth Error:", error.message);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error("Email atau password salah.");
    }
    throw error;
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

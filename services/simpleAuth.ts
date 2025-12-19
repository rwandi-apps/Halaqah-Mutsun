
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

const STORAGE_KEY = 'sdq_auth_user';

export const simpleLogin = async (email: string, pass: string): Promise<User> => {
  if (!db) throw new Error("Database tidak terhubung. Periksa koneksi internet.");

  // Query ke collection users berdasarkan email
  const q = query(collection(db, 'users'), where('email', '==', email.trim()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Email tidak terdaftar.");
  }

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();

  // Validasi password (plain text sesuai permintaan)
  if (userData.password !== pass) {
    throw new Error("Password salah.");
  }

  // Format data user
  const authenticatedUser: User = {
    id: userDoc.id,
    name: userData.name || 'User',
    email: userData.email,
    role: userData.role || 'GURU',
    nickname: userData.nickname || userData.name,
    // Kita simpan teacherId jika ada (khusus guru)
    ...(userData.teacherId ? { teacherId: userData.teacherId } : { teacherId: userDoc.id })
  } as any;

  // Simpan ke localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
  
  return authenticatedUser;
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

export const simpleLogout = () => {
  localStorage.removeItem(STORAGE_KEY);
};

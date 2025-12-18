
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from './lib/firebase';
import { Layout } from './app/layout';
import LoginPage from './app/(auth)/login/page';
import CoordinatorDashboard from './app/coordinator/dashboard/page';
import CoordinatorGuruPage from './app/coordinator/guru/page';
import CoordinatorTeacherDetail from './app/coordinator/guru/[id]/page';
import CoordinatorSiswaPage from './app/coordinator/siswa/page';
import CoordinatorKelasPage from './app/coordinator/kelas/page';
import GuruDashboard from './app/guru/dashboard/page';
import GuruHalaqahPage from './app/guru/halaqah/page';
import GuruLaporanPage from './app/guru/laporan/page';
import GuruViewReportPage from './app/guru/view-report/page';
import { User, Role } from './types';
import { logout } from './lib/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!db) return;
          
          const uid = firebaseUser.uid;
          const userDocRef = doc(db, 'users', uid);
          const docSnap = await getDoc(userDocRef);
          
          let finalUserData: any = null;

          if (docSnap.exists()) {
            finalUserData = docSnap.data();
          } else {
            // JIKA UID TIDAK DITEMUKAN: Cari berdasarkan email (Data yang diinput koordinator)
            const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const oldDoc = querySnapshot.docs[0];
              const oldData = oldDoc.data();
              const oldId = oldDoc.id;

              // --- PROSES MIGRASI OTOMATIS ---
              // 1. Pindahkan data profil ke ID baru (UID)
              await setDoc(userDocRef, { ...oldData, id: uid });
              
              // 2. Jika ID lama berbeda dengan UID, update semua siswa & hapus doc lama
              if (oldId !== uid) {
                const batch = writeBatch(db);
                
                // Cari semua siswa yang terikat ke ID lama
                const siswaQuery = query(collection(db, 'siswa'), where('teacherId', '==', oldId));
                const siswaSnap = await getDocs(siswaQuery);
                siswaSnap.forEach((sDoc) => {
                  batch.update(doc(db, 'siswa', sDoc.id), { teacherId: uid });
                });

                // Cari semua laporan yang terikat ke ID lama
                const laporanQuery = query(collection(db, 'laporan'), where('teacherId', '==', oldId));
                const laporanSnap = await getDocs(laporanQuery);
                laporanSnap.forEach((lDoc) => {
                  batch.update(doc(db, 'laporan', lDoc.id), { teacherId: uid });
                });

                // Hapus dokumen user dengan ID lama (docID acak)
                batch.delete(doc(db, 'users', oldId));
                
                await batch.commit();
                console.log(`[Migration] Migrated data from ${oldId} to ${uid}`);
              }
              finalUserData = oldData;
            }
          }

          if (finalUserData) {
            setUser({
              id: uid, // Selalu gunakan UID Auth sebagai ID di aplikasi
              name: finalUserData.name || 'User',
              email: firebaseUser.email || '',
              role: (finalUserData.role as Role) || 'GURU',
              nickname: finalUserData.nickname || '',
            });
          }
        } catch (error) {
          console.error("Error identifying user:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: User) => setUser(loggedInUser);
  const handleLogout = async () => { await logout(); setUser(null); };
  const handleSwitchRole = (role: Role) => user && setUser({ ...user, role });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace /> : <LoginPage onLogin={handleLogin} />
        } />

        <Route element={<Layout user={user} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />}>
          <Route path="/coordinator/dashboard" element={user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru" element={user?.role === 'KOORDINATOR' ? <CoordinatorGuruPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru/:id" element={user?.role === 'KOORDINATOR' ? <CoordinatorTeacherDetail /> : <Navigate to="/login" />} />
          <Route path="/coordinator/siswa" element={user?.role === 'KOORDINATOR' ? <CoordinatorSiswaPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/kelas" element={user?.role === 'KOORDINATOR' ? <CoordinatorKelasPage /> : <Navigate to="/login" />} />
          <Route path="/guru/dashboard" element={user?.role === 'GURU' ? <GuruDashboard teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/halaqah" element={user?.role === 'GURU' ? <GuruHalaqahPage teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/laporan" element={user?.role === 'GURU' ? <GuruLaporanPage teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/view-report" element={user?.role === 'GURU' ? <GuruViewReportPage teacherId={user.id} /> : <Navigate to="/login" />} />
        </Route>

        <Route path="*" element={<Navigate to={user?.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

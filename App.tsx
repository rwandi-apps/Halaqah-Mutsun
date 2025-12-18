
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          let userData: any = docSnap.exists() ? docSnap.data() : null;
          
          if (!userData && firebaseUser.email) {
            const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) userData = querySnapshot.docs[0].data();
          }

          setUser({
            id: firebaseUser.uid,
            name: userData?.name || firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: (userData?.role as Role) || 'GURU',
            nickname: userData?.nickname || '',
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
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
          {/* Coordinator Routes */}
          <Route path="/coordinator/dashboard" element={user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru" element={user?.role === 'KOORDINATOR' ? <CoordinatorGuruPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru/:id" element={user?.role === 'KOORDINATOR' ? <CoordinatorTeacherDetail /> : <Navigate to="/login" />} />
          <Route path="/coordinator/siswa" element={user?.role === 'KOORDINATOR' ? <CoordinatorSiswaPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/kelas" element={user?.role === 'KOORDINATOR' ? <CoordinatorKelasPage /> : <Navigate to="/login" />} />
          {/* Placeholder untuk route yang belum ada agar tidak memicu fallback global */}
          <Route path="/coordinator/reports" element={<div className="p-8">Fitur Pantau Laporan Segera Hadir</div>} />
          <Route path="/coordinator/evaluations" element={<div className="p-8">Fitur Input Evaluasi Segera Hadir</div>} />

          {/* Guru Routes */}
          <Route path="/guru/dashboard" element={user?.role === 'GURU' ? <GuruDashboard teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/halaqah" element={user?.role === 'GURU' ? <GuruHalaqahPage teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/laporan" element={user?.role === 'GURU' ? <GuruLaporanPage teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/view-report" element={user?.role === 'GURU' ? <GuruViewReportPage teacherId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/evaluation" element={<div className="p-8">Fitur Evaluasi Segera Hadir</div>} />
          <Route path="/guru/grades" element={<div className="p-8">Fitur Nilai Rapor Segera Hadir</div>} />
          <Route path="/guru/rapor" element={<div className="p-8">Fitur Rapor Segera Hadir</div>} />
        </Route>

        <Route path="*" element={<Navigate to={user?.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

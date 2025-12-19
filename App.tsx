import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, writeBatch } from 'firebase/firestore';
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
    if (!isFirebaseEnabled || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const uid = firebaseUser.uid;
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);

        let data: any = null;

        if (snap.exists()) {
          data = snap.data();
        } else {
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const qs = await getDocs(q);

          if (!qs.empty) {
            const oldDoc = qs.docs[0];
            data = oldDoc.data();

            const batch = writeBatch(db);
            batch.set(userRef, { ...data, id: uid });

            const siswaQ = query(collection(db, 'siswa'), where('teacherId', '==', oldDoc.id));
            const siswaSnap = await getDocs(siswaQ);
            siswaSnap.forEach(s => batch.update(doc(db, 'siswa', s.id), { teacherId: uid }));

            const lapQ = query(collection(db, 'laporan'), where('teacherId', '==', oldDoc.id));
            const lapSnap = await getDocs(lapQ);
            lapSnap.forEach(l => batch.update(doc(db, 'laporan', l.id), { teacherId: uid }));

            batch.delete(doc(db, 'users', oldDoc.id));
            await batch.commit();
          }
        }

        if (!data?.role) throw new Error('Role tidak ditemukan');

        setUser({
          id: uid,
          name: data.name ?? 'User',
          email: firebaseUser.email ?? '',
          role: data.role as Role,
          nickname: data.nickname ?? '',
        });
      } catch (e) {
        console.error(e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user
              ? <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace />
              : <LoginPage onLogin={setUser} />
          }
        />

        {user && (
          <Route element={<Layout user={user} onLogout={async () => { await logout(); setUser(null); }} />}>
            {/* KOORDINATOR */}
            <Route path="/coordinator/dashboard" element={user.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/login" />} />
            <Route path="/coordinator/guru" element={user.role === 'KOORDINATOR' ? <CoordinatorGuruPage /> : <Navigate to="/login" />} />
            <Route path="/coordinator/guru/:id" element={user.role === 'KOORDINATOR' ? <CoordinatorTeacherDetail /> : <Navigate to="/login" />} />
            <Route path="/coordinator/siswa" element={user.role === 'KOORDINATOR' ? <CoordinatorSiswaPage /> : <Navigate to="/login" />} />
            <Route path="/coordinator/kelas" element={user.role === 'KOORDINATOR' ? <CoordinatorKelasPage /> : <Navigate to="/login" />} />

            {/* GURU */}
            <Route path="/guru/dashboard" element={user.role === 'GURU' ? <GuruDashboard teacherId={user.id} /> : <Navigate to="/login" />} />
            <Route path="/guru/halaqah" element={user.role === 'GURU' ? <GuruHalaqahPage teacherId={user.id} /> : <Navigate to="/login" />} />
            <Route path="/guru/laporan" element={user.role === 'GURU' ? <GuruLaporanPage teacherId={user.id} /> : <Navigate to="/login" />} />
            <Route path="/guru/view-report" element={user.role === 'GURU' ? <GuruViewReportPage teacherId={user.id} /> : <Navigate to="/login" />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Layout } from './app/layout';
import LoginPage from './app/(auth)/login/page';
import GuruDashboard from './app/guru/dashboard/page';
import CoordinatorDashboard from './app/coordinator/dashboard/page';
import { User, Role } from './types';
import { logout } from './lib/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async fbUser => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: data.name,
        nickname: data.nickname || '',
        role: data.role as Role,
      });

      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          user
            ? <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} />
            : <LoginPage onLogin={setUser} />
        } />

        <Route element={<Layout user={user} onLogout={logout} />}>
          <Route path="/guru/dashboard" element={user?.role === 'GURU' ? <GuruDashboard /> : <Navigate to="/login" />} />
          <Route path="/coordinator/dashboard" element={user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/login" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

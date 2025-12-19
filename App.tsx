
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { getStoredUser, simpleLogout } from './services/simpleAuth';

function App() {
  // Ambil user langsung dari localStorage saat init
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    simpleLogout();
    setUser(null);
  };

  const handleSwitchRole = (role: Role) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('sdq_auth_user', JSON.stringify(updatedUser));
    }
  };

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
          user ? (
            <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        } />

        <Route element={<Layout user={user} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />}>
          {/* Routes Koordinator */}
          <Route path="/coordinator/dashboard" element={user?.role === 'KOORDINATOR' ? <CoordinatorDashboard /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru" element={user?.role === 'KOORDINATOR' ? <CoordinatorGuruPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/guru/:id" element={user?.role === 'KOORDINATOR' ? <CoordinatorTeacherDetail /> : <Navigate to="/login" />} />
          <Route path="/coordinator/siswa" element={user?.role === 'KOORDINATOR' ? <CoordinatorSiswaPage /> : <Navigate to="/login" />} />
          <Route path="/coordinator/kelas" element={user?.role === 'KOORDINATOR' ? <CoordinatorKelasPage /> : <Navigate to="/login" />} />
          
          {/* Routes Guru - Menggunakan ID/teacherId dari user object */}
          <Route path="/guru/dashboard" element={user?.role === 'GURU' ? <GuruDashboard teacherId={(user as any).teacherId || user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/halaqah" element={user?.role === 'GURU' ? <GuruHalaqahPage teacherId={(user as any).teacherId || user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/laporan" element={user?.role === 'GURU' ? <GuruLaporanPage teacherId={(user as any).teacherId || user.id} /> : <Navigate to="/login" />} />
          <Route path="/guru/view-report" element={user?.role === 'GURU' ? <GuruViewReportPage teacherId={(user as any).teacherId || user.id} /> : <Navigate to="/login" />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={
          <Navigate to={user ? (user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard') : '/login'} replace />
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;

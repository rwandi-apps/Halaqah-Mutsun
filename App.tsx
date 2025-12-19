
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './app/layout';
import LoginPage from './app/(auth)/login/page';
import CoordinatorDashboard from './app/coordinator/dashboard/page';
import CoordinatorGuruPage from './app/coordinator/guru/page';
import CoordinatorTeacherDetail from './app/coordinator/guru/[id]/page';
import CoordinatorSiswaPage from './app/coordinator/siswa/page';
import CoordinatorKelasPage from './app/coordinator/kelas/page';
import CoordinatorReportsPage from './app/coordinator/reports/page';
import GuruDashboard from './app/guru/dashboard/page';
import GuruHalaqahPage from './app/guru/halaqah/page';
import GuruLaporanPage from './app/guru/laporan/page';
import GuruViewReportPage from './app/guru/view-report/page';
import { getStoredUser, simpleLogout } from './services/simpleAuth';
import { User, Role } from './types';

function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());

  const handleLogin = (newUser: User) => {
    setUser(newUser);
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

  return (
    <HashRouter>
      <Routes>
        {/* Halaman Login */}
        <Route path="/login" element={
          !user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />
        } />

        {/* Jalur Terproteksi */}
        <Route element={<Layout user={user} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />}>
          <Route path="/" element={
            user?.role === 'KOORDINATOR' 
              ? <Navigate to="/coordinator/dashboard" replace /> 
              : <Navigate to="/guru/dashboard" replace />
          } />
          
          {/* Routes Koordinator */}
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/guru" element={<CoordinatorGuruPage />} />
          <Route path="/coordinator/guru/:id" element={<CoordinatorTeacherDetail />} />
          <Route path="/coordinator/siswa" element={<CoordinatorSiswaPage />} />
          <Route path="/coordinator/kelas" element={<CoordinatorKelasPage />} />
          <Route path="/coordinator/reports" element={<CoordinatorReportsPage />} />
          
          {/* Routes Guru */}
          <Route path="/guru/dashboard" element={<GuruDashboard teacherId={(user as any)?.teacherId || user?.id} />} />
          <Route path="/guru/halaqah" element={<GuruHalaqahPage teacherId={(user as any)?.teacherId || user?.id} />} />
          <Route path="/guru/laporan" element={<GuruLaporanPage teacherId={(user as any)?.teacherId || user?.id} />} />
          <Route path="/guru/view-report" element={<GuruViewReportPage teacherId={(user as any)?.teacherId || user?.id} />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;


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
import GuruEvaluationPage from './app/guru/evaluation/page';
import GuruGradesPage from './app/guru/grades/page';
import GuruRaporPage from './app/guru/rapor/page';
import { getStoredUser, simpleLogout } from './services/simpleAuth';
import { User } from './types';

function App() {
  // Mengambil user dari storage saat pertama kali load
  const [user, setUser] = useState<User | null>(getStoredUser());

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      await simpleLogout();
      setUser(null);
    } catch (error) {
      console.error("Gagal logout:", error);
      // Tetap paksa hapus state jika terjadi error network
      setUser(null);
    }
  };

  return (
    <HashRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={
          !user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />
        } />

        {/* Protected Routes */}
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          
          {/* ROOT REDIRECTOR */}
          <Route path="/" element={
            user?.role === 'KOORDINATOR' 
              ? <Navigate to="/coordinator/dashboard" replace /> 
              : <Navigate to="/guru/dashboard" replace />
          } />
          
          {/* Coordinator Pages */}
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          <Route path="/coordinator/guru" element={<CoordinatorGuruPage />} />
          <Route path="/coordinator/guru/:id" element={<CoordinatorTeacherDetail />} />
          <Route path="/coordinator/siswa" element={<CoordinatorSiswaPage />} />
          <Route path="/coordinator/kelas" element={<CoordinatorKelasPage />} />
          <Route path="/coordinator/reports" element={<CoordinatorReportsPage />} />
          
          {/* Guru Pages */}
          <Route path="/guru/dashboard" element={<GuruDashboard teacherId={user?.id} />} />
          <Route path="/guru/halaqah" element={<GuruHalaqahPage teacherId={user?.id} />} />
          <Route path="/guru/laporan" element={<GuruLaporanPage teacherId={user?.id} />} />
          <Route path="/guru/view-report" element={<GuruViewReportPage teacherId={user?.id} />} />
          <Route path="/guru/evaluation" element={<GuruEvaluationPage />} />
          <Route path="/guru/grades" element={<GuruGradesPage />} />
          <Route path="/guru/rapor" element={<GuruRaporPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;


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
import CoordinatorRaporPage from './app/coordinator/rapor/page';
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
  // DISABLING LOGIN: Menginisialisasi user otomatis sebagai GURU jika storage kosong
  const [user, setUser] = useState<User | null>(getStoredUser() || {
    id: 'u2',
    name: 'Ust. Hasan (Auto-Login)',
    nickname: 'Ustadz Hasan',
    email: 'guru@sdq.com',
    role: 'GURU'
  });

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      await simpleLogout();
      setUser(null);
    } catch (error) {
      console.error("Gagal logout:", error);
      setUser(null);
    }
  };

  return (
    <HashRouter>
      <Routes>
        {/* Login Page - Tetap ada rutenya tapi user otomatis redirect ke "/" jika sudah set user */}
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
          <Route path="/coordinator/rapor" element={<CoordinatorRaporPage />} />
          
          {/* Guru Pages */}
          <Route path="/guru/dashboard" element={<GuruDashboard teacherId={user?.id} />} />
          <Route path="/guru/halaqah" element={<GuruHalaqahPage teacherId={user?.id} />} />
          <Route path="/guru/laporan" element={<GuruLaporanPage teacherId={user?.id} />} />
          <Route path="/guru/view-report" element={<GuruViewReportPage teacherId={user?.id} />} />
          <Route path="/guru/evaluation" element={<GuruEvaluationPage />} />
          <Route path="/guru/grades" element={<GuruGradesPage teacherId={user?.id} />} />
          {/* Pass user.name for signature requirements */}
          <Route path="/guru/rapor" element={<GuruRaporPage teacherId={user?.id} teacherName={user?.name} />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

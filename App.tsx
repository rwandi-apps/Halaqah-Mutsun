
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './app/layout';
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
import { User, Role } from './types';

function App() {
  // Set user default ke Koordinator agar tidak perlu login
  const [user, setUser] = useState<User | null>({
    id: 'admin-1',
    name: 'Admin SDQ',
    nickname: 'Admin',
    email: 'admin@sdq.com',
    role: 'KOORDINATOR'
  });

  const handleLogout = () => {
    // Logout sementara hanya mengosongkan user
    setUser(null);
  };

  const handleSwitchRole = (role: Role) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <HashRouter>
      <Routes>
        {/* Redirect root ke dashboard yang sesuai role */}
        <Route path="/" element={
          user ? (
            <Navigate to={user.role === 'KOORDINATOR' ? '/coordinator/dashboard' : '/guru/dashboard'} replace />
          ) : (
            <div className="flex items-center justify-center h-screen">
              <p className="text-gray-500">Aplikasi dalam mode pengelolaan. <button onClick={() => window.location.reload()} className="text-primary-600 underline">Refresh</button></p>
            </div>
          )
        } />

        <Route element={<Layout user={user} onLogout={handleLogout} onSwitchRole={handleSwitchRole} />}>
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

        {/* Catch-all redirect ke root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

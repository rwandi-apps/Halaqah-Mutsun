import React, { useState } from 'react';
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
import CoordinatorEvaluationsPage from './app/coordinator/evaluations/page';
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
  const [user, setUser] = useState<User | null>(getStoredUser());'
  });

  const handleLogin = (newUser: User) => {
  setUser(newUser);
  localStorage.setItem('sdq_user', JSON.stringify(newUser));
  };

  const handleLogout = async () => {
  try {
    await simpleLogout();
  } finally {
    localStorage.removeItem('sdq_user');
    setUser(null);
  }
};

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />} />

        <Route path="/*" element={
           <Layout user={user} onLogout={handleLogout}>
             <Routes>
                <Route path="/" element={
                  user?.role === 'KOORDINATOR' 
                    ? <Navigate to="/coordinator/dashboard" replace /> 
                    : <Navigate to="/guru/dashboard" replace />
                  } 
                />
                
                <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
                <Route path="/coordinator/guru" element={<CoordinatorGuruPage />} />
                <Route path="/coordinator/guru/:id" element={<CoordinatorTeacherDetail />} />
                <Route path="/coordinator/siswa" element={<CoordinatorSiswaPage />} />
                <Route path="/coordinator/kelas" element={<CoordinatorKelasPage />} />
                <Route path="/coordinator/reports" element={<CoordinatorReportsPage />} />
                <Route path="/coordinator/rapor" element={<CoordinatorRaporPage />} />
                <Route path="/coordinator/evaluations" element={<CoordinatorEvaluationsPage />} />
                
                <Route path="/guru/dashboard" element={<GuruDashboard teacherId={user?.id} />} />
                <Route path="/guru/halaqah" element={<GuruHalaqahPage teacherId={user?.id} />} />
                <Route path="/guru/laporan" element={<GuruLaporanPage teacherId={user?.id} />} />
                <Route path="/guru/view-report" element={<GuruViewReportPage teacherId={user?.id} />} />
                <Route path="/guru/evaluation" element={<GuruEvaluationPage teacherId={user?.id} />} />
                <Route path="/guru/grades" element={<GuruGradesPage teacherId={user?.id} />} />
                <Route path="/guru/rapor" element={<GuruRaporPage teacherId={user?.id} teacherName={user?.name} />} />

                <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
           </Layout>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;

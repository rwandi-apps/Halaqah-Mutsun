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
import CoordinatorEvaluationsPage from './app/coordinator/evaluations/page';
import CoordinatorTransitionPage from './app/coordinator/transition/page';
import { CoordinatorSetoranGuruPage } from './app/coordinator/setoran-guru/page';
import GuruDashboard from './app/guru/dashboard/page';
import GuruHalaqahPage from './app/guru/halaqah/page';
import GuruLaporanPage from './app/guru/laporan/page';
import GuruViewReportPage from './app/guru/view-report/page';
import GuruEvaluationPage from './app/guru/evaluation/page';
import GuruGradesPage from './app/guru/grades/page';
import GuruRaporPage from './app/guru/rapor/page';
import { GuruSetoranPage } from './app/guru/setoran-guru/page';
import PublicMonitoringSabakPage from './app/public/monitoring-sabak/page';
import YayasanDashboard from './app/yayasan/dashboard/page';
import YayasanLihatGuruPage from './app/yayasan/lihat-guru/page';
import YayasanSetoranGuruPage from './app/yayasan/setoran-guru/page';
import { getStoredUser, simpleLogout } from './services/simpleAuth';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [previewTeacher, setPreviewTeacher] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sdq_preview_teacher');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePreviewChange = () => {
      try {
        const stored = localStorage.getItem('sdq_preview_teacher');
        setPreviewTeacher(stored ? JSON.parse(stored) : null);
      } catch {
        setPreviewTeacher(null);
      }
    };

    window.addEventListener('sdq_preview_change', handlePreviewChange);
    return () => window.removeEventListener('sdq_preview_change', handlePreviewChange);
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sdq_preview_teacher');
      await simpleLogout();
      setUser(null);
    } catch (error) {
      console.error("Gagal logout:", error);
      setUser(null);
    }
  };

  const isYayasan = user?.role === 'YAYASAN' || user?.role === 'yayasan';
  const isCoordinator = user?.role === 'KOORDINATOR' || user?.role === 'koordinator';

  // ID Guru yang digunakan saat merender tampilan Guru (bisa milik guru itu sendiri atau preview teacher dari Yayasan)
  const effectiveTeacherId = previewTeacher?.id || previewTeacher?.teacherId || user?.teacherId || user?.id;
  const effectiveTeacherName = previewTeacher?.name || user?.name;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" replace />} />
        <Route path="/public/monitoring-sabak" element={<PublicMonitoringSabakPage />} />

        <Route path="/*" element={
           <Layout user={user} onLogout={handleLogout}>
             <Routes>
                <Route path="/" element={
                  isYayasan 
                    ? <Navigate to="/yayasan/dashboard" replace /> 
                    : isCoordinator 
                      ? <Navigate to="/coordinator/dashboard" replace /> 
                      : <Navigate to="/guru/dashboard" replace />
                  } 
                />
                
                {/* Routes Yayasan */}
                <Route path="/yayasan/dashboard" element={<YayasanDashboard />} />
                <Route path="/yayasan/lihat-guru" element={<YayasanLihatGuruPage />} />
                <Route path="/yayasan/setoran-guru" element={<YayasanSetoranGuruPage />} />

                {/* Routes Koordinator */}
                <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
                <Route path="/coordinator/guru" element={<CoordinatorGuruPage />} />
                <Route path="/coordinator/guru/:id" element={<CoordinatorTeacherDetail />} />
                <Route path="/coordinator/siswa" element={<CoordinatorSiswaPage />} />
                <Route path="/coordinator/kelas" element={<CoordinatorKelasPage />} />
                <Route path="/coordinator/reports" element={<CoordinatorReportsPage />} />
                <Route path="/coordinator/rapor" element={<CoordinatorRaporPage />} />
                <Route path="/coordinator/evaluations" element={<CoordinatorEvaluationsPage />} />
                <Route path="/coordinator/transition" element={<CoordinatorTransitionPage />} />
                <Route path="/coordinator/setoran-guru" element={<CoordinatorSetoranGuruPage />} />
                
                {/* Routes Guru (Dapat diakses langsung oleh Guru, atau di-preview oleh Yayasan) */}
                <Route path="/guru/dashboard" element={<GuruDashboard teacherId={effectiveTeacherId} />} />
                <Route path="/guru/halaqah" element={<GuruHalaqahPage teacherId={effectiveTeacherId} />} />
                <Route path="/guru/laporan" element={<GuruLaporanPage teacherId={effectiveTeacherId} />} />
                <Route path="/guru/view-report" element={<GuruViewReportPage teacherId={effectiveTeacherId} />} />
                <Route path="/guru/evaluation" element={<GuruEvaluationPage teacherId={effectiveTeacherId} />} />
                <Route path="/guru/grades" element={<GuruGradesPage teacherId={effectiveTeacherId} />} />
                <Route path="/guru/rapor" element={<GuruRaporPage teacherId={effectiveTeacherId} teacherName={effectiveTeacherName} />} />
                <Route path="/guru/setoran-guru" element={<GuruSetoranPage teacherId={effectiveTeacherId} />} />

                <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
           </Layout>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;

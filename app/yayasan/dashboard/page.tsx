import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Eye, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { Student, User } from '../../../types';

export default function YayasanDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalHalaqahs: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalSetoranTuntas: 0,
    averageAttendance: 0
  });
  const [teachersList, setTeachersList] = useState<User[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYayasanStats();
  }, []);

  const loadYayasanStats = async () => {
    setLoading(true);
    try {
      if (!db) return;

      // Fetch Students
      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData: Student[] = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      // Fetch Teachers
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData: User[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      const teachers = usersData.filter(u => u.role === 'GURU' || u.role === 'guru');

      // Fetch Setoran Sabak
      const setoranSnap = await getDocs(collection(db, 'setoran_sabak'));
      const setoranDocs = setoranSnap.docs.map(d => d.data());
      const tuntasCount = setoranDocs.filter(s => s.status === 'Tuntas').length;

      // Unique Classes & Halaqahs
      const uniqueClasses = new Set(studentsData.map(s => s.className).filter(Boolean));
      const uniqueHalaqahs = new Set(studentsData.map(s => s.teacherId || s.halaqahId).filter(Boolean));

      // Calculate Attendance Average
      const totalAtt = studentsData.reduce((acc, s) => acc + (s.attendance || 100), 0);
      const avgAtt = studentsData.length > 0 ? Math.round(totalAtt / studentsData.length) : 100;

      setStats({
        totalClasses: uniqueClasses.size || 12,
        totalHalaqahs: uniqueHalaqahs.size || teachers.length || 8,
        totalTeachers: teachers.length,
        totalStudents: studentsData.length,
        totalSetoranTuntas: tuntasCount,
        averageAttendance: avgAtt
      });

      setTeachersList(teachers);
      setRecentStudents(studentsData.slice(0, 5));
    } catch (err) {
      console.error("Error loading Yayasan Stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Building2 size={320} />
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} /> Panel Eksekutif Yayasan
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Dashboard Pengawasan Yayasan SDQ
          </h1>
          <p className="text-slate-300 leading-relaxed text-sm">
            Selamat datang di Sistem Monitoring Terpadu. Anda memiliki akses pengawasan menyeluruh terhadap perkembangan tahfizh, kinerja guru, data kelas, serta rekapitulasi capaian hafalan siswa secara real-time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/yayasan/lihat-guru')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Eye size={16} /> Lihat Sebagai Guru
            </button>
            <button
              onClick={() => navigate('/coordinator/reports')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/20"
            >
              <BarChart3 size={16} /> Pantau Perkembangan
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Eksekutif Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Jumlah Kelas</p>
            <p className="text-2xl font-black text-gray-800">{loading ? '...' : stats.totalClasses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Jumlah Halaqah</p>
            <p className="text-2xl font-black text-gray-800">{loading ? '...' : stats.totalHalaqahs}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Jumlah Guru</p>
            <p className="text-2xl font-black text-gray-800">{loading ? '...' : stats.totalTeachers}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Siswa</p>
            <p className="text-2xl font-black text-gray-800">{loading ? '...' : stats.totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Menu Utama Akses Cepat */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="text-amber-500" size={20} />
          Navigasi Pengawasan Yayasan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/yayasan/lihat-guru')}
            className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:border-amber-400 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold group-hover:scale-110 transition-transform">
                <Eye size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                Lihat Sebagai Guru
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pratinjau tampilan dan menu yang dilihat oleh guru tertentu tanpa perlu logout dari sesi Yayasan. Mode ini aman dan bersifat read-only.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-extrabold text-amber-600 uppercase tracking-wider">
              <span>Buka Pilih Guru</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/coordinator/reports')}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:border-blue-400 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Monitoring Tahfizh
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Pantau progres setoran sabaq harian, murojaah, dan laporan bulanan seluruh halaqah dan siswa di sekolah.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider">
              <span>Buka Laporan</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/coordinator/dashboard')}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:border-purple-400 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Dashboard Koordinator
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tinjau statistik supervisi keseluruhan, grafik kelulusan target, serta analisis evaluasi tingkat sekolah.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <span>Lihat Supervisi</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Data Guru & Info Keamanan Mode Read-Only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-gray-900">Daftar Guru / Musyrif Active</h3>
              <p className="text-xs text-gray-400">Pilih guru untuk melihat aplikasi dari perspektif halaqah mereka.</p>
            </div>
            <button 
              onClick={() => navigate('/yayasan/lihat-guru')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Lihat Semua ({teachersList.length})
            </button>
          </div>

          <div className="space-y-3">
            {teachersList.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Memuat daftar guru...</p>
            ) : (
              teachersList.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl hover:bg-gray-100/80 transition-all border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {t.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('sdq_preview_teacher', JSON.stringify(t));
                      window.dispatchEvent(new Event('sdq_preview_change'));
                      navigate('/guru/dashboard');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    <Eye size={14} /> Lihat Tampilan
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security & Access Box */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/70 p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">Mode Pratinjau Terisolasi</h4>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Ketika Anda menggunakan fitur <strong>"Lihat Sebagai Guru"</strong>, akun Yayasan tidak pernah mengubah password atau sesi autentikasi. Sesi login Yayasan tetap aktif sepenuhnya.
            </p>
          </div>
          <div className="space-y-2 text-xs text-amber-900/90 font-medium border-t border-amber-200/50 pt-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Akses View-Only / Read-Only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Tombol Ubah/Simpan Dinonaktifkan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Pindah Tampilan Tanpa Relogin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Users, Eye, Search, GraduationCap, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { User, Student } from '../../../types';

export default function YayasanLihatGuruPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachersData();
  }, []);

  const loadTeachersData = async () => {
    setLoading(true);
    try {
      if (!db) return;

      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData: User[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      const guruList = usersData.filter(u => u.role === 'GURU' || u.role === 'guru' || u.teacherId);

      const studentsSnap = await getDocs(collection(db, 'students'));
      const studentsData: Student[] = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));

      setTeachers(guruList);
      setStudents(studentsData);
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectTeacher = (teacher: User) => {
    localStorage.setItem('sdq_preview_teacher', JSON.stringify(teacher));
    window.dispatchEvent(new Event('sdq_preview_change'));
    navigate('/guru/dashboard');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={() => navigate('/yayasan/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 mb-2 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard Yayasan
          </button>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
            <Users className="text-amber-500" size={28} />
            Pilih Guru untuk Pratinjau
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Pilih salah satu Ustadz/Ustadzah untuk melihat seluruh halaman dan menu aplikasi dari sudut pandang beliau dalam mode Read-Only.
          </p>
        </div>
      </div>

      {/* Mode Preview Info Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs shadow-sm">
        <ShieldAlert size={20} className="text-amber-600 shrink-0" />
        <div>
          <span className="font-bold">Mode Pratinjau Terisolasi:</span> Mengakses halaman guru melalui menu ini tidak akan mengeluarkan (logout) akun Yayasan Anda dan tidak memerlukan kata sandi guru.
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
        <Search className="text-gray-400 shrink-0" size={18} />
        <input 
          type="text"
          placeholder="Cari nama Ustadz / Ustadzah atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm font-medium outline-none bg-transparent"
        />
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm font-semibold">
          Memuat data guru...
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm font-semibold bg-white rounded-2xl border border-gray-100">
          Tidak ada data guru yang ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((t) => {
            const teacherStudents = students.filter(s => s.teacherId === t.id || s.teacherId === t.teacherId);
            
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                      {t.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-base truncate">{t.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{t.email}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100">
                        Guru / Musyrif
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-gray-400" />
                      <span>Siswa Bimbingan</span>
                    </div>
                    <span className="font-bold text-gray-800">{teacherStudents.length} Siswa</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectTeacher(t)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye size={16} /> Lihat Sebagai Guru
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

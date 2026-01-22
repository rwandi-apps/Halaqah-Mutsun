import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Student } from '../../../../types';
import { getTeacherById, getStudentsByTeacher } from '../../../../services/firestoreService';
import { Button } from '../../../../components/Button';
import { StatCard } from '../../../../components/StatCard';
import { ArrowLeft, Users, Star, BookOpen, UserCheck, BadgeCheck } from 'lucide-react';

const CoordinatorTeacherDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setIsLoading(true);
        const [teacherData, studentsData] = await Promise.all([
          getTeacherById(id),
          getStudentsByTeacher(id)
        ]);
        setTeacher(teacherData || null);
        setStudents(studentsData);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data guru...</div>;
  if (!teacher) return <div className="p-8 text-center text-red-500">Data guru tidak ditemukan.</div>;

  // Defensive values
  const name = teacher.name || "Tanpa Nama";
  const nickname = teacher.nickname || name;
  const initial = nickname.length > 0 ? nickname.charAt(0).toUpperCase() : "?";
  const role = teacher.role || "GURU";

  const avgAttendance = students.length 
    ? Math.round(students.reduce((acc, s) => acc + (s.attendance || 0), 0) / students.length)
    : 0;

  const avgBehavior = students.length
    ? (students.reduce((acc, s) => acc + (s.behaviorScore || 0), 0) / students.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/coordinator/guru')}
          className="flex items-center text-gray-500 hover:text-primary-600 mb-4 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> Kembali ke Data Guru
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${role === 'KOORDINATOR' ? 'bg-purple-600 text-white' : 'bg-primary-600 text-white'}`}>
               {initial}
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h2 className="text-2xl font-bold text-gray-900">{nickname}</h2>
                 {role === 'KOORDINATOR' && <BadgeCheck className="text-purple-600" />}
               </div>
               <p className="text-gray-500">{teacher.email} • {role === 'KOORDINATOR' ? 'Koordinator' : 'Guru Halaqah'}</p>
               {nickname !== name && <p className="text-xs text-gray-400 mt-1">{name}</p>}
             </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Kirim Pesan</Button>
            <Button variant="secondary">Edit Profil</Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Siswa" value={students.length} icon={Users} color="bg-blue-50/50" />
        <StatCard title="Rata-rata Kehadiran" value={`${avgAttendance}%`} icon={UserCheck} trend={avgAttendance > 90 ? "Sangat Baik" : "Perlu ditingkatkan"} />
        <StatCard title="Nilai Perilaku Rata-rata" value={avgBehavior} icon={Star} color="bg-yellow-50/50" />
        <StatCard title="Total Hafalan (Juz)" value="N/A" icon={BookOpen} color="bg-primary-50/50" />
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Daftar Siswa Binaan</h3>
          <Button variant="outline" className="text-xs py-1.5 h-8">Download Excel</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold">
              <tr>
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">Kelas</th>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">Capaian Saat Ini</th>
                <th className="px-6 py-3">Kehadiran</th>
                <th className="px-6 py-3">Perilaku</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-3">{student.className}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {student.memorizationTarget}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{student.currentProgress}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${(student.attendance || 0) < 80 ? 'text-red-600' : 'text-green-600'}`}>
                          {student.attendance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-gray-700 font-medium ml-1">{student.behaviorScore}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Belum ada data siswa untuk guru ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorTeacherDetail;
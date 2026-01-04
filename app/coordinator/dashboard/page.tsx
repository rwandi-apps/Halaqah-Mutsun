
import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/Button';
import { getAllTeachers, getAllStudents, getPerformancePerClass, getLatestTeacherActivities } from '../../../services/firestoreService';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Building2,
  Clock,
  BookOpen,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const DashboardStatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}> = ({ title, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const AccountabilityCard: React.FC<{
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = ({ label, count, icon: Icon, color, bgColor }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between min-w-[160px]">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColor} ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-xs font-semibold ${color}`}>{label}</p>
        <p className="text-xl font-bold text-gray-800">{count}</p>
      </div>
    </div>
  </div>
);

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalHalaqah: 0,
    averageAttendance: 0
  });

  const [performanceData, setPerformanceData] = useState<{label: string, value: number}[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [teachers, students, perf, acts] = await Promise.all([
          getAllTeachers(),
          getAllStudents(),
          getPerformancePerClass(),
          getLatestTeacherActivities(5)
        ]);
        
        // Calculate basic stats
        const totalTeachers = teachers.filter(u => u.role === 'GURU').length;
        const totalStudents = students.length;
        const totalHalaqah = teachers.filter(u => u.role === 'GURU').length;
        
        const averageAttendance = students.length > 0 
          ? Math.round(students.reduce((acc, s) => acc + (s.attendance || 0), 0) / students.length)
          : 0;

        setStats({
          totalTeachers,
          totalStudents,
          totalHalaqah,
          averageAttendance
        });

        setPerformanceData(perf);
        setActivities(acts);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Koordinator</h2>
          <p className="text-gray-500 mt-1">Pantau performa sekolah dan aktivitas guru secara global.</p>
        </div>
        <Button className="shadow-lg shadow-primary-500/30" onClick={() => window.location.hash = '#/coordinator/evaluations'}>
          + Input Evaluasi Bulanan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Statistik Sekolah</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardStatCard 
            title="Total Guru Aktif"
            value={`${stats.totalTeachers} Orang`}
            icon={Users}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <DashboardStatCard 
            title="Total Siswa"
            value={`${stats.totalStudents} Siswa`}
            icon={GraduationCap}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <DashboardStatCard 
            title="Total Halaqah"
            value={`${stats.totalHalaqah} Kelas`}
            icon={Building2}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <DashboardStatCard 
            title="Rata-rata Kehadiran"
            value={`${stats.averageAttendance}%`}
            icon={TrendingUp}
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
          />
        </div>
      </div>

      {/* Accountability Status */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Status Akuntabilitas Guru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AccountabilityCard label="Belum Dibaca" count={0} icon={Clock} color="text-gray-500" bgColor="bg-gray-100" />
          <AccountabilityCard label="Sudah Dibaca" count={0} icon={BookOpen} color="text-yellow-600" bgColor="bg-yellow-50" />
          <AccountabilityCard label="Sedang Berjalan" count={0} icon={Settings} color="text-blue-500" bgColor="bg-blue-50" />
          <AccountabilityCard label="Selesai" count={0} icon={CheckCircle} color="text-green-500" bgColor="bg-green-50" />
          <AccountabilityCard label="Butuh Diskusi" count={0} icon={AlertCircle} color="text-red-500" bgColor="bg-red-50" />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Performa Rata-rata Per Halaqah</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
             {isLoading ? (
               <Loader2 size={32} className="animate-spin text-primary-500" />
             ) : performanceData.length > 0 ? (
               <div className="flex items-end gap-4 w-full h-full px-8 pb-4">
                 {performanceData.map((data, i) => (
                   <div key={i} className="flex-1 bg-primary-100 rounded-t-lg relative group transition-all hover:bg-primary-300" style={{ height: `${data.value}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">{data.value}%</span>
                      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-primary-700 font-bold truncate px-1">
                        {data.label}
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center">
                 <p className="text-sm">Belum ada data performa dari rapor semester.</p>
               </div>
             )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Aktivitas Guru Terbaru</h3>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            ) : activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold shrink-0 border border-primary-100">
                    {act.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{act.teacherName}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{act.actionDescription}</p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {act.time} WIB
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">Belum ada aktivitas guru tercatat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

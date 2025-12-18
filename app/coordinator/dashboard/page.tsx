import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/Button';
import { getAllTeachers, getAllStudents } from '../../../services/firestoreService';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Building2,
  Clock,
  BookOpen,
  Settings,
  CheckCircle,
  AlertCircle
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

  useEffect(() => {
    const loadStats = async () => {
      const teachers = await getAllTeachers();
      const students = await getAllStudents();
      
      // Calculate stats
      const totalTeachers = teachers.length;
      const totalStudents = students.length;
      const totalHalaqah = teachers.length; // Assuming 1 active halaqah per teacher for demo
      
      // Calculate average attendance
      const averageAttendance = students.length > 0 
        ? Math.round(students.reduce((acc, s) => acc + (s.attendance || 0), 0) / students.length)
        : 0;

      setStats({
        totalTeachers,
        totalStudents,
        totalHalaqah,
        averageAttendance
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Koordinator</h2>
          <p className="text-gray-500 mt-1">Pantau performa sekolah dan aktivitas guru secara global.</p>
        </div>
        <Button className="shadow-lg shadow-primary-500/30">
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

      {/* Accountability Status (Mocked for Demo as not fully implemented in backend yet) */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Status Akuntabilitas Guru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AccountabilityCard label="Belum Dibaca" count={1} icon={Clock} color="text-gray-500" bgColor="bg-gray-100" />
          <AccountabilityCard label="Sudah Dibaca" count={1} icon={BookOpen} color="text-yellow-600" bgColor="bg-yellow-50" />
          <AccountabilityCard label="Sedang Berjalan" count={2} icon={Settings} color="text-blue-500" bgColor="bg-blue-50" />
          <AccountabilityCard label="Selesai" count={1} icon={CheckCircle} color="text-green-500" bgColor="bg-green-50" />
          <AccountabilityCard label="Butuh Diskusi" count={0} icon={AlertCircle} color="text-red-500" bgColor="bg-red-50" />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Performa Rata-rata Per Halaqah</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
             <div className="flex items-end gap-4 w-full h-full px-8 pb-4">
               {/* Visual Mock Bars */}
               <div className="w-1/4 bg-blue-100 h-[60%] rounded-t-lg relative group">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">60%</span>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500">Kelas 1</div>
               </div>
               <div className="w-1/4 bg-blue-200 h-[80%] rounded-t-lg relative group">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">80%</span>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500">Kelas 2</div>
               </div>
               <div className="w-1/4 bg-blue-300 h-[75%] rounded-t-lg relative group">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">75%</span>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500">Kelas 3</div>
               </div>
               <div className="w-1/4 bg-blue-400 h-[90%] rounded-t-lg relative group">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">90%</span>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-500">Kelas 4</div>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Aktivitas Guru Terbaru</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">UH</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ustadz Hasan</p>
                <p className="text-sm text-gray-500 mt-1">Menginput Laporan Bulanan - Ahmad Fulan</p>
                <p className="text-xs text-gray-400 mt-1">2 jam yang lalu</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold shrink-0">UA</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ustadz Arif</p>
                <p className="text-sm text-gray-500 mt-1">Menyelesaikan setoran Budi Santoso</p>
                <p className="text-xs text-gray-400 mt-1">5 jam yang lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Button } from '../components/UIComponents';
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

export const CoordinatorDashboard: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Koordinator</h2>
          <p className="text-gray-500 mt-1">Pantau performa sekolah dan aktivitas musyrif secara global.</p>
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
            value="5 Orang"
            icon={Users}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <DashboardStatCard 
            title="Total siswa"
            value="135 Siswa"
            icon={GraduationCap}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <DashboardStatCard 
            title="Total Halaqah"
            value="15 Kelas"
            icon={Building2}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <DashboardStatCard 
            title="Rata-rata Capaian"
            value="82%"
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
          <AccountabilityCard label="Belum Dibaca" count={1} icon={Clock} color="text-gray-500" bgColor="bg-gray-100" />
          <AccountabilityCard label="Sudah Dibaca" count={1} icon={BookOpen} color="text-yellow-600" bgColor="bg-yellow-50" />
          <AccountabilityCard label="Sedang Berjalan" count={1} icon={Settings} color="text-blue-500" bgColor="bg-blue-50" />
          <AccountabilityCard label="Selesai" count={1} icon={CheckCircle} color="text-green-500" bgColor="bg-green-50" />
          <AccountabilityCard label="Butuh Diskusi" count={1} icon={AlertCircle} color="text-red-500" bgColor="bg-red-50" />
        </div>
      </div>

      {/* Bottom Section: Performance Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Performa Rata-rata Per Halaqah</h3>
          <div className="relative h-64 w-full flex items-end justify-between gap-4 px-4 border-b border-l border-gray-200">
             {/* Simple visual mock of a bar chart */}
             <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-[#0ea5e9] h-40 rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">85%</div>
                </div>
                <span className="text-xs text-gray-500 text-center">Utsman bin Affan</span>
             </div>
             <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-gray-100 h-32 rounded-t-sm opacity-80 group-hover:bg-[#0ea5e9] transition-colors relative"></div>
                <span className="text-xs text-gray-500 text-center">Ali bin Abi Thalib</span>
             </div>
             <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-gray-100 h-48 rounded-t-sm opacity-80 group-hover:bg-[#0ea5e9] transition-colors relative"></div>
                <span className="text-xs text-gray-500 text-center">Umar bin Khattab</span>
             </div>
             <div className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-gray-100 h-36 rounded-t-sm opacity-80 group-hover:bg-[#0ea5e9] transition-colors relative"></div>
                <span className="text-xs text-gray-500 text-center">Abu Bakar</span>
             </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Aktivitas Guru Terbaru</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                AB
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ustadz Abdullah</p>
                <p className="text-sm text-gray-500 mt-1">Menginput Laporan Bulanan (Utsman bin Affan)</p>
                <p className="text-xs text-gray-400 mt-2">2 jam yang lalu</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                UH
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ustadz Hasan</p>
                <p className="text-sm text-gray-500 mt-1">Menambahkan catatan evaluasi untuk <span className="text-gray-800 font-medium">Ahmad Fulan</span></p>
                <p className="text-xs text-gray-400 mt-2">5 jam yang lalu</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold shrink-0">
                UA
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ustadz Arif</p>
                <p className="text-sm text-gray-500 mt-1">Menyelesaikan target setoran hafalan kelas 4B</p>
                <p className="text-xs text-gray-400 mt-2">1 hari yang lalu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, BookOpen, FileText, Eye, LogOut, ShieldCheck, FileCheck } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const SidebarYayasan: React.FC<SidebarProps> = ({ onLogout, onCloseMobile }) => {
  const navItems = [
    { type: 'section', label: 'EKSEKUTIF' },
    { to: "/yayasan/dashboard", icon: LayoutDashboard, label: "Dashboard Yayasan" },
    { to: "/coordinator/dashboard", icon: ShieldCheck, label: "Tampilan Koordinator" },
    { to: "/yayasan/lihat-guru", icon: Eye, label: "Lihat sebagai Guru" },
    
    { type: 'section', label: 'MONITORING & DATA' },
    { to: "/coordinator/reports", icon: FileText, label: "Monitoring Tahfizh" },
    { to: "/coordinator/guru", icon: Users, label: "Data Guru" },
    { to: "/coordinator/kelas", icon: BookOpen, label: "Data Kelas & Halaqah" },
    { to: "/coordinator/siswa", icon: GraduationCap, label: "Data Siswa" },
    { to: "/coordinator/rapor", icon: FileCheck, label: "Pantau Rapor Siswa" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col h-screen overflow-hidden border-r border-slate-800">
      <div className="h-20 flex flex-col justify-center px-6 shrink-0 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/30 font-bold text-xs">SDQ</span>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase text-amber-400">YAYASAN SDQ</h1>
            <p className="text-[10px] text-slate-400">Super Admin Monitoring</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div key={index} className="px-3 pt-5 pb-1.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                onClick={onCloseMobile}
                className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all mb-1 group text-slate-300 hover:bg-slate-800 hover:text-white ${isActive ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} className="shrink-0 text-amber-400/80 group-hover:text-amber-400" />}
                  <span className="font-medium text-xs tracking-wide">{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/30">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-semibold">
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarYayasan;

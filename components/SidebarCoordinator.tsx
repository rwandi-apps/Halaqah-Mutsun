
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, BookOpen, FileText, ClipboardList, LogOut, FileCheck, Sparkles } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const SidebarCoordinator: React.FC<SidebarProps> = ({ onLogout, onCloseMobile }) => {
  const navItems = [
    { type: 'section', label: 'UTAMA' },
    { to: "/coordinator/dashboard", icon: LayoutDashboard, label: "Dashboard Utama" },
    
    { type: 'section', label: 'DATA MASTER' },
    { to: "/coordinator/guru", icon: Users, label: "Data Guru" },
    { to: "/coordinator/siswa", icon: GraduationCap, label: "Data Siswa" },
    { to: "/coordinator/kelas", icon: BookOpen, label: "Data Kelas & Halaqah" },
    
    { type: 'section', label: 'SUPERVISI' },
    { to: "/coordinator/reports", icon: FileText, label: "Pantau Laporan" },
    { to: "/coordinator/rapor", icon: FileCheck, label: "Pantau Rapor" },
    { to: "/coordinator/evaluations", icon: Sparkles, label: "Input Evaluasi AI" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-primary-700 text-white flex flex-col h-screen overflow-hidden">
      <div className="h-20 flex items-center px-6 shrink-0 border-b border-primary-600/50">
        <h1 className="text-xl font-bold tracking-wide uppercase">ADMIN SDQ</h1>
      </div>
      <div className="px-4 py-2 flex-1 overflow-hidden">
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div key={index} className="px-3 pt-4 pb-2">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.label}</p>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1 group
                  ${isActive ? 'bg-primary-600' : 'text-white/80 hover:bg-primary-600'}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} />}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-primary-600/50">
         <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-primary-600 transition-colors">
           <LogOut size={20} />
           <span className="font-medium text-sm">Keluar</span>
         </button>
      </div>
    </aside>
  );
};

export default SidebarCoordinator;

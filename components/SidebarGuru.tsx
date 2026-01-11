
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList, BarChart2, BookOpen, LogOut, ChevronDown } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const SidebarGuru: React.FC<SidebarProps> = ({ onLogout, onCloseMobile }) => {
  const navItems = [
    { type: 'section', label: 'UTAMA' },
    { to: "/guru/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/guru/halaqah", icon: Users, label: "Halaqah" },
    
    { type: 'section', label: 'LAPORAN' },
    { to: "/guru/laporan", icon: FileText, label: "Input Laporan" },
    { to: "/guru/view-report", icon: ClipboardList, label: "Lihat Laporan" },
    
    { type: 'section', label: 'EVALUASI' },
    { to: "/guru/evaluation", icon: BarChart2, label: "Evaluasi & Tindak Lanjut" },
    { to: "/guru/grades", icon: BookOpen, label: "Input Nilai Rapor", hasDropdown: true },
    { to: "/guru/rapor", icon: FileText, label: "Rapor", hasDropdown: true },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-[#0f4c75] text-white flex flex-col h-screen overflow-hidden">
      <div className="h-20 flex items-center px-6 shrink-0">
        <h1 className="text-xl font-bold tracking-wide uppercase">HALAQAH SDQ</h1>
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
                className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1 group text-white/80 hover:bg-white/10 ${isActive ? 'bg-white/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} />}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.hasDropdown && <ChevronDown size={14} className="text-white/50" />}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-white/5">
         <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors">
           <LogOut size={20} />
           <span className="font-medium text-sm">Keluar</span>
         </button>
      </div>
    </aside>
  );
};

export default SidebarGuru;

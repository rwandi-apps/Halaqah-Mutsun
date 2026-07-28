
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList, BarChart2, BookOpen, LogOut, ChevronDown, BookmarkCheck, Sparkles } from 'lucide-react';
import { getStoredUser } from '../services/simpleAuth';

interface SidebarProps {
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const SidebarGuru: React.FC<SidebarProps> = ({ onLogout, onCloseMobile }) => {
  const currentUser = getStoredUser();

  const isAssistant = useMemo(() => {
    if (!currentUser) return false;
    const nameStr = (currentUser.name || '').toLowerCase();
    const nicknameStr = (currentUser.nickname || '').toLowerCase();
    const emailStr = (currentUser.email || '').toLowerCase();
    const roleStr = (currentUser.role || '').toUpperCase();

    if (roleStr === 'KOORDINATOR' || roleStr === 'YAYASAN') return true;
    return nameStr.includes('bagas') || nicknameStr.includes('bagas') || emailStr.includes('bagas') || emailStr === 'fauzipasha08@gmail.com';
  }, [currentUser]);

  const navItems = [
    { type: 'section', label: 'UTAMA' },
    { to: "/guru/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/guru/halaqah", icon: Users, label: "Halaqah" },
    
    { type: 'section', label: 'LAPORAN' },
    { to: "/guru/laporan", icon: FileText, label: "Input Laporan" },
    { to: "/guru/view-report", icon: ClipboardList, label: "Lihat Laporan" },
    ...(isAssistant ? [{ to: "/guru/setoran-guru", icon: BookmarkCheck, label: "Setoran Guru" }] : []),
    
    { type: 'section', label: 'EVALUASI' },
    { to: "/guru/evaluation", icon: BarChart2, label: "Evaluasi & Tindak Lanjut" },
    { to: "/guru/grades", icon: BookOpen, label: "Input Nilai Rapor", hasDropdown: true },
    { to: "/guru/rapor", icon: FileText, label: "Rapor", hasDropdown: true },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-emerald-600 via-teal-700 to-emerald-900 text-white flex flex-col h-screen overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="h-20 flex items-center justify-center px-5 shrink-0 border-b border-white/15 bg-white/10 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white leading-tight">SDQ Mutiara Sunnah</h1>
            <span className="inline-block bg-amber-300 text-emerald-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
              Portal Guru
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="px-3.5 py-3 flex-1 overflow-y-auto custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div key={index} className="px-3 pt-3.5 pb-1">
                  <p className="text-[10px] font-black text-amber-200/90 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {item.label}
                  </p>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                onClick={onCloseMobile}
                className={({ isActive }) => 
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all mb-1 group text-white/90 hover:bg-white/20 hover:text-white ${
                    isActive 
                      ? 'bg-white/25 text-white font-extrabold shadow-sm border-l-4 border-amber-300 pl-3' 
                      : 'font-medium hover:pl-4'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} className="shrink-0 text-amber-200 group-hover:text-amber-300 transition-colors" />}
                  <span className="text-xs">{item.label}</span>
                </div>
                {item.hasDropdown && <ChevronDown size={14} className="text-white/60" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-3.5 mt-auto border-t border-white/15 bg-black/10">
         <button 
           onClick={onLogout} 
           className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-rose-500/80 transition-all font-bold text-xs"
         >
           <LogOut size={18} />
           <span>Keluar</span>
         </button>
      </div>
    </aside>
  );
};

export default SidebarGuru;

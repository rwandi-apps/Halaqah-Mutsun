import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  BarChart2,
  BookOpen,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
  onCloseMobile: () => void;
}

export const SidebarGuru: React.FC<SidebarProps> = ({
  onLogout,
  onCloseMobile,
}) => {
  const navItems = [
    { type: "section", label: "UTAMA" },
    { to: "/guru/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/guru/halaqah", icon: Users, label: "Halaqah" },

    { type: "section", label: "LAPORAN" },
    { to: "/guru/laporan", icon: FileText, label: "Input Laporan" },
    { to: "/guru/view-report", icon: ClipboardList, label: "Lihat Laporan" },

    { type: "section", label: "EVALUASI" },
    { to: "/guru/evaluation", icon: BarChart2, label: "Evaluasi & Tindak Lanjut" },
    { to: "/guru/grades", icon: BookOpen, label: "Input Nilai Rapor" },
    { to: "/guru/rapor", icon: FileText, label: "Rapor" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-[#0f4c75] text-white flex flex-col h-screen">
      <div className="h-20 flex items-center px-6">
        <h1 className="text-xl font-bold uppercase">HALAQAH SDQ</h1>
      </div>

      <nav className="px-4 flex-1 space-y-1">
        {navItems.map((item, i) => {
          if (item.type === "section") {
            return (
              <p
                key={i}
                className="px-3 pt-4 pb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest"
              >
                {item.label}
              </p>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to!}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `
                flex items-center justify-between px-3 py-2.5 rounded-lg mb-1
                transition-colors
                ${isActive ? "bg-white/10" : "hover:bg-white/10"}
              `
              }
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronDown size={14} className="opacity-40" />
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10"
        >
          <LogOut size={18} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarGuru;

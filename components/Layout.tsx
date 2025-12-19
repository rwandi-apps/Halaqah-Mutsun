
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  ClipboardList,
  FileText,
  BarChart2,
  Bell,
  ChevronDown
} from 'lucide-react';
import LogoSDQ from './LogoSDQ';
import Button from './Button';
import { User, Role } from '../types';

interface LayoutProps {
  user?: User | null;
  onLogout?: () => void;
  children?: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout = () => {}, 
  children,
  sidebar,
  title
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const isCoordinator = user?.role === 'KOORDINATOR';

  const navItems = isCoordinator ? [
    { to: "/coordinator/dashboard", icon: LayoutDashboard, label: "Dashboard Utama" },
    { to: "/coordinator/guru", icon: Users, label: "Data Guru" },
    { to: "/coordinator/siswa", icon: GraduationCap, label: "Data Siswa" },
    { to: "/coordinator/kelas", icon: BookOpen, label: "Data Kelas & Halaqah" },
    { type: 'header', label: 'SUPERVISI' },
    { to: "/coordinator/reports", icon: FileText, label: "Pantau Laporan" },
    { to: "/coordinator/evaluations", icon: ClipboardList, label: "Input Evaluasi" },
  ] : [
    { to: "/guru/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/guru/halaqah", icon: Users, label: "Halaqah" },
    { to: "/guru/laporan", icon: FileText, label: "Input Laporan" },
    { to: "/guru/view-report", icon: ClipboardList, label: "Lihat Laporan" },
    { to: "/guru/evaluation", icon: BarChart2, label: "Evaluasi & Tindak Lanjut" },
    { to: "/guru/grades", icon: BookOpen, label: "Input Nilai Rapor", hasDropdown: true },
    { to: "/guru/rapor", icon: FileText, label: "Rapor", hasDropdown: true },
  ];

  const sidebarBg = isCoordinator ? 'bg-primary-700' : 'bg-[#0f4c75]'; 
  const sidebarHover = isCoordinator ? 'hover:bg-primary-600' : 'hover:bg-white/10';
  const sidebarActive = isCoordinator ? 'bg-primary-600' : 'bg-white/10';
  const logoText = isCoordinator ? "ADMIN SDQ" : "HALAQAH SDQ";

  if (!user && !children && !sidebar) return null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 ${sidebarBg} text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebar ? sidebar : (
          <>
            <div className="h-20 flex items-center px-6">
              <h1 className="text-xl font-bold tracking-wide uppercase">{logoText}</h1>
            </div>

            <div className="px-4 py-2 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
              <nav className="space-y-1">
                {navItems.map((item, index) => {
                  if (item.type === 'header') {
                    return (
                      <div key={index} className="px-3 pt-6 pb-2">
                         <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{item.label}</p>
                      </div>
                    );
                  }
                  
                  if (!item.to) return null;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to.split('/').length === 2}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center justify-between px-3 py-3 rounded-lg transition-colors mb-1 group
                        ${isActive ? sidebarActive : `text-white/80 ${sidebarHover}`}
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            {item.icon && <item.icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />}
                            <span className="font-medium text-sm">{item.label}</span>
                          </div>
                          {item.hasDropdown && <ChevronDown size={16} className="text-white/50" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
              
              <div className="mt-8 px-3">
                 <button 
                   onClick={onLogout}
                   className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 ${sidebarHover} transition-colors`}
                 >
                   <LogOut size={20} />
                   <span className="font-medium text-sm">Keluar</span>
                 </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {title && <h2 className="text-lg font-bold text-gray-800 hidden md:block">{title}</h2>}
          </div>

          <div className="flex items-center gap-6">
             {user && (
               <div className={`hidden md:block px-3 py-1 rounded-full text-xs font-semibold text-white ${isCoordinator ? 'bg-primary-500' : 'bg-green-500'}`}>
                 {isCoordinator ? 'Koordinator' : 'Guru'}
               </div>
             )}
             
             <button className="relative text-gray-500 hover:text-gray-700">
               <Bell size={22} />
               <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
             </button>

             {user && (
               <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${isCoordinator ? 'bg-primary-600' : 'bg-purple-600'}`}>
                    {user.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-gray-800 leading-none mb-1">{user.name}</p>
                    <p className="text-xs text-gray-500">{isCoordinator ? 'Koordinator Tahfizh' : 'Musyrif Halaqah'}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 hidden md:block" />
               </div>
             )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;

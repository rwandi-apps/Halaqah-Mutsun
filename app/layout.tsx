import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, Mail, ChevronDown, Eye, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { SidebarCoordinator } from '../components/SidebarCoordinator';
import { SidebarGuru } from '../components/SidebarGuru';
import { SidebarYayasan } from '../components/SidebarYayasan';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [previewTeacher, setPreviewTeacher] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sdq_preview_teacher');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePreviewChange = () => {
      try {
        const stored = localStorage.getItem('sdq_preview_teacher');
        setPreviewTeacher(stored ? JSON.parse(stored) : null);
      } catch {
        setPreviewTeacher(null);
      }
    };

    window.addEventListener('sdq_preview_change', handlePreviewChange);
    return () => window.removeEventListener('sdq_preview_change', handlePreviewChange);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isYayasan = user.role === 'YAYASAN' || user.role === 'yayasan';
  const isCoordinator = user.role === 'KOORDINATOR' || user.role === 'koordinator';
  
  // Handling exit preview mode for Yayasan
  const handleExitPreview = () => {
    localStorage.removeItem('sdq_preview_teacher');
    setPreviewTeacher(null);
    window.dispatchEvent(new Event('sdq_preview_change'));
    navigate('/yayasan/dashboard');
  };

  // Determine current active display name & role title
  const activeUser = (isYayasan && previewTeacher) ? previewTeacher : user;
  const displayName = activeUser.nickname || activeUser.name;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mode Pratinjau Banner untuk Yayasan */}
      {isYayasan && previewTeacher && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between shadow-lg z-50 font-medium text-xs lg:text-sm shrink-0 border-b border-amber-500">
          <div className="flex items-center gap-2.5">
            <span className="p-1 bg-amber-800/60 rounded-lg shrink-0">
              <Eye size={18} className="animate-pulse text-amber-200" />
            </span>
            <span>
              <strong className="uppercase tracking-wider">👁️ Mode Pratinjau (Read-Only)</strong> — Sedang melihat sebagai Guru: <strong className="underline decoration-amber-300 underline-offset-2">{previewTeacher.name}</strong>
            </span>
          </div>
          <button 
            onClick={handleExitPreview}
            className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard Yayasan
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Dynamic based on Role & Preview State */}
        <div className={`
          fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {isYayasan && !previewTeacher ? (
            <SidebarYayasan onLogout={onLogout} onCloseMobile={() => setSidebarOpen(false)} />
          ) : isCoordinator ? (
            <SidebarCoordinator onLogout={onLogout} onCloseMobile={() => setSidebarOpen(false)} />
          ) : (
            <SidebarGuru onLogout={onLogout} onCloseMobile={() => setSidebarOpen(false)} />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {/* Judul Aplikasi untuk Mobile */}
              <h1 className="text-lg font-bold text-gray-800 lg:hidden">SDQ Portal</h1>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className={`hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${
                isYayasan 
                  ? 'bg-amber-600' 
                  : isCoordinator 
                    ? 'bg-primary-600' 
                    : 'bg-guru-700'
              }`}>
                {isYayasan ? (previewTeacher ? 'Yayasan (Pratinjau Guru)' : 'Yayasan') : isCoordinator ? 'Koordinator' : 'Guru'}
              </div>
               
              <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                <Mail size={22} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-gray-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                  isYayasan ? 'bg-amber-600' : isCoordinator ? 'bg-primary-600' : 'bg-purple-600'
                }`}>
                  {initials}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-gray-800 leading-none mb-1">{displayName}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">
                    {isYayasan 
                      ? (previewTeacher ? `Melihat Sebagai: ${previewTeacher.name}` : 'Super Admin Yayasan') 
                      : isCoordinator 
                        ? 'Manajemen Tahfizh' 
                        : 'Guru Halaqah'}
                  </p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </div>
            </div>
          </header>

          {/* Page Content Outlet */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

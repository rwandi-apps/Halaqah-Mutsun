import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown } from 'lucide-react';
import { User, Role } from '../types';
import { SidebarCoordinator } from '../components/SidebarCoordinator';
import { SidebarGuru } from '../components/SidebarGuru';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  onSwitchRole: (role: Role) => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, onSwitchRole }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // FIX: Jangan return null, tapi Redirect ke /login jika user tidak ada (logout)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isCoordinator = user.role === 'KOORDINATOR';

  // Use Nickname if available, otherwise name
  const displayName = user.nickname || user.name;
  
  // Get initials from display name
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dynamic based on Role */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {isCoordinator ? (
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
            
            {/* Demo Toggle Visual */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>Demo:</span>
              <div className="bg-gray-100 rounded-lg p-1 flex">
                 <button 
                   onClick={() => onSwitchRole('KOORDINATOR')}
                   className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${isCoordinator ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                 >
                   Admin
                 </button>
                 <button 
                   onClick={() => onSwitchRole('GURU')}
                   className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!isCoordinator ? 'bg-[#0e7490] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                 >
                   Guru
                 </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className={`hidden md:block px-3 py-1 rounded-full text-xs font-semibold text-white ${isCoordinator ? 'bg-primary-500' : 'bg-green-500'}`}>
               {isCoordinator ? 'Koordinator' : 'Guru'}
             </div>
             
             <button className="relative text-gray-500 hover:text-gray-700">
               <Bell size={22} />
               <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
             </button>

             <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${isCoordinator ? 'bg-primary-600' : 'bg-purple-600'}`}>
                  {initials}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-gray-800 leading-none mb-1">{displayName}</p>
                  <p className="text-xs text-gray-500">{isCoordinator ? 'Koordinator Tahfizh' : 'Guru Halaqah'}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
             </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
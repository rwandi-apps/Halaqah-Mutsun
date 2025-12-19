import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown } from 'lucide-react';
import { User } from '../types';
import { SidebarCoordinator } from '../components/SidebarCoordinator';
import { SidebarGuru } from '../components/SidebarGuru';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isCoordinator = user.role === 'KOORDINATOR';
  const displayName = user.nickname || user.name;

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`fixed z-30 w-64 h-full lg:static transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {isCoordinator ? (
          <SidebarCoordinator onLogout={onLogout} onCloseMobile={() => setOpen(false)} />
        ) : (
          <SidebarGuru onLogout={onLogout} onCloseMobile={() => setOpen(false)} />
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b flex items-center justify-between px-6">
          <button className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>

          <div className="flex items-center gap-6">
            <Bell />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold ${isCoordinator ? 'bg-primary-600' : 'bg-purple-600'}`}>
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="font-bold">{displayName}</p>
                <p className="text-xs text-gray-500">{isCoordinator ? 'Koordinator' : 'Guru'}</p>
              </div>
              <ChevronDown className="hidden md:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

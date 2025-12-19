import { Outlet, Navigate } from 'react-router-dom';
import { User } from '../types';

export function Layout({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-800 text-white p-4">
        <p className="font-bold">{user.nickname || user.name}</p>
        <button onClick={onLogout} className="mt-4 text-sm underline">
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

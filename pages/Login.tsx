import React, { useState } from 'react';
import { LogoSDQ, Button } from '../components/UIComponents';
import { login } from '../services/mockBackend';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('GURU');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In a real app, password would be checked here
      const user = await login(email || 'demo@sdq.com', role);
      if (user) {
        onLogin(user);
      }
    } catch (error) {
      console.error(error);
      alert('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-center mb-8">
          <LogoSDQ className="scale-125" />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Selamat Datang</h2>
        <p className="text-center text-gray-500 mb-8">Silakan masuk untuk melanjutkan akses halaqah.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peran (Role)</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('GURU')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  role === 'GURU' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                Guru / Ustadz
              </button>
              <button
                type="button"
                onClick={() => setRole('KOORDINATOR')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  role === 'KOORDINATOR' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                Koordinator
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="nama@sekolah.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="pass" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="pass"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
            />
          </div>

          <Button type="submit" className="w-full py-3" isLoading={isLoading}>
            Masuk Sekarang
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Untuk demo: Masukkan email bebas & pilih role.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
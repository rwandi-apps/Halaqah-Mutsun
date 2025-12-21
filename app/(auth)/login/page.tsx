import React, { useState } from 'react';
import LogoSDQ from '../../../components/LogoSDQ';
import { User } from '../../../types';
import { simpleLogin } from '../../../services/simpleAuth';
import { AlertCircle, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Mohon isi email dan password.');
      }

      const user = await simpleLogin(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email atau password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=2070&auto=format&fit=crop"
          alt="Al-Quran Background"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-teal-800/60 to-gray-900" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[400px] px-6 flex flex-col items-center">

        <div className="mb-8 flex justify-center drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
  <LogoSDQ className="h-28 w-auto" />
</div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-white text-2xl font-bold tracking-tight">
            Halaqah SDQ Mutiara Sunnah
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Sistem Informasi Tahfizh & Mutaba’ah
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/90 text-white text-xs rounded-xl flex items-start gap-3 w-full shadow-lg">
            <AlertCircle size={18} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-8">

          {/* Email */}
          <div className="relative border-b border-white/30 focus-within:border-white transition">
            <Mail
              size={18}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-7 pr-2 py-3 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm"
            />
          </div>

          {/* Password */}
          <div className="relative border-b border-white/30 focus-within:border-white transition">
            <Lock
              size={18}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-7 pr-2 py-3 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm"
            />
          </div>

          {/* Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-3/4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-full shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-12 text-white/20 text-[10px] tracking-widest uppercase">
          Halaqah SDQ Manager © 2025
        </p>
      </div>
    </div>
  );
}

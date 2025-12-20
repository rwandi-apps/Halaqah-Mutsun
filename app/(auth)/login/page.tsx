
import React, { useState } from 'react';
import LogoSDQ from '../../../components/LogoSDQ';
import { User } from '../../../types';
import { simpleLogin } from '../../../services/simpleAuth';
import { AlertCircle, User as UserIcon, Lock } from 'lucide-react';

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
        throw new Error("Mohon isi email dan password.");
      }
      
      const user = await simpleLogin(email, password);
      onLogin(user);
      
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Gagal masuk. Periksa email/password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      {/* Background Image - Quran with Purple & Teal Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=80&w=2070&auto=format&fit=crop" 
          alt="Al-Quran Background" 
          className="w-full h-full object-cover opacity-50"
        />
        {/* Perpaduan Ungu (primary-900) dan Tosca (guru-700) */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/70 via-guru-700/60 to-gray-900" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[400px] px-6 flex flex-col items-center">
        
        {/* Logo Area */}
        <div className="mb-10 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-3xl shadow-2xl">
          <LogoSDQ />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-bold tracking-tight">Halaqah SDQ Mutiara Sunnah</h2>
          <p className="text-blue-100/70 text-sm">Sistem Informasi Tahfizh & Mutaba'ah</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/90 backdrop-blur-md border border-red-400 text-white text-sm rounded-2xl flex items-start gap-3 w-full shadow-lg animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-guru-500 transition-colors pointer-events-none">
                <UserIcon size={20} strokeWidth={1.5} />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-guru-400 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:outline-none shadow-xl transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-guru-500 transition-colors pointer-events-none">
                <Lock size={20} strokeWidth={1.5} />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-guru-400 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:outline-none shadow-xl transition-all"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-guru-700 hover:bg-guru-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Masuk Sistem"}
          </button>
        </form>

        <p className="mt-8 text-white/40 text-xs">
          Halaqah SDQ Manager &copy; 2025
        </p>
      </div>
    </div>
  );
}

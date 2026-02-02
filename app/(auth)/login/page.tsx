
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
        <div className="text-center mb-10">
          <h2 className="text-white text-2xl font-bold tracking-tight">Laporan Semester</h2>
          <p className="text-blue-100/60 text-sm mt-1">Masuk untuk mengelola halaqah</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/90 backdrop-blur-md border border-red-400 text-white text-xs rounded-xl flex items-start gap-3 w-full shadow-lg animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Email Input - Underline Style */}
          <div className="relative group border-b border-white/20 focus-within:border-white transition-colors duration-300">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors pointer-events-none">
                <Mail size={20} strokeWidth={1.5} />
            </div>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-8 pr-2 py-3 bg-transparent text-white placeholder:text-white/30 focus:outline-none transition-all text-sm"
            />
          </div>

          {/* Password Input - Underline Style */}
          <div className="relative group border-b border-white/20 focus-within:border-white transition-colors duration-300">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors pointer-events-none">
                <Lock size={20} strokeWidth={1.5} />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-8 pr-2 py-3 bg-transparent text-white placeholder:text-white/30 focus:outline-none transition-all text-sm"
            />
          </div>

          {/* Submit Button - Smaller & Compact */}
          <div className="flex justify-center pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-3/4 py-2.5 bg-guru-700 hover:bg-guru-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Masuk Sistem"}
            </button>
          </div>
        </form>

        <p className="mt-12 text-white/20 text-[10px] tracking-widest uppercase font-medium">
          Halaqah SDQ Manager &copy; 2024
        </p>
      </div>
    </div>
  );
}

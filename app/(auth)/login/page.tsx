
import React, { useState } from 'react';
// Fix: Use default imports instead of named imports for LogoSDQ and Button
import LogoSDQ from '../../../components/LogoSDQ';
import Button from '../../../components/Button';
import { login, mockLogin } from '../../../lib/auth';
import { User, Role } from '../../../types';
import { isFirebaseEnabled } from '../../../lib/firebase';
import { AlertCircle, CheckCircle, User as UserIcon, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Jika Firebase Config ada, matikan Demo Mode secara default.
  // Jika tidak ada config, paksa nyalakan Demo Mode.
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseEnabled);
  const [demoRole, setDemoRole] = useState<Role>('GURU');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user: User;

      if (isDemoMode) {
        // Login Simulasi (Demo)
        user = await mockLogin(email || 'demo@sdq.com', demoRole);
      } else {
        // Login Asli (Firebase)
        if (!email || !password) {
          throw new Error("Mohon isi email dan password.");
        }
        user = await login(email, password);
      }

      onLogin(user);
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Terjemahkan Error Firebase ke Bahasa Indonesia
      let msg = "Gagal masuk. Periksa koneksi atau hubungi admin.";
      const code = err.code || '';
      
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = "Email atau password salah. Silakan coba lagi.";
      } else if (code === 'auth/too-many-requests') {
        msg = "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.";
      } else if (code === 'auth/network-request-failed') {
        msg = "Gagal terhubung ke server. Periksa koneksi internet Anda.";
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop" 
          alt="Building Background" 
          className="w-full h-full object-cover opacity-90"
        />
        {/* Gradient Overlay for better text visibility if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-gray-900/40" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[400px] px-6 flex flex-col items-center">
        
        {/* Logo Area - Wrapped for visibility */}
        <div className="mb-10 scale-110 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-2xl">
          <LogoSDQ />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-100/90 backdrop-blur-md border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3 w-full shadow-lg animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Connection Status Indicator */}
        {!isDemoMode && isFirebaseEnabled && (
           <div className="mb-6 p-2 bg-green-500/80 backdrop-blur text-white text-xs rounded-full px-4 flex gap-2 justify-center items-center shadow-lg">
             <CheckCircle size={14} />
             <span>Sistem Terhubung ke Server</span>
           </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors pointer-events-none">
                <UserIcon size={20} strokeWidth={1.5} />
            </div>
            <input
              type="email"
              required={!isDemoMode}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-primary-300 rounded-full text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 shadow-xl transition-all"
            />
          </div>

          {/* Password Input (Hidden in Demo if desired, but kept for UI consistency) */}
          {(!isDemoMode || isDemoMode) && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors pointer-events-none">
                  <Lock size={20} strokeWidth={1.5} />
              </div>
              <input
                type="password"
                required={!isDemoMode}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-primary-300 rounded-full text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 shadow-xl transition-all"
              />
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#0047AB] hover:bg-[#003380] text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              isDemoMode ? "Masuk Dashboard (Demo)" : "Masuk Dashboard"
            )}
          </button>
        </form>

        {/* Demo Mode Controls (Styled Cleanly) */}
        {isDemoMode && (
           <div className="mt-8 bg-white/90 backdrop-blur-md p-5 rounded-2xl w-full shadow-2xl border border-white/20">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Pilih Peran Simulasi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDemoRole('GURU')}
                  className={`p-2.5 rounded-xl text-sm font-semibold transition-all ${
                    demoRole === 'GURU' 
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Guru
                </button>
                <button
                  type="button"
                  onClick={() => setDemoRole('KOORDINATOR')}
                  className={`p-2.5 rounded-xl text-sm font-semibold transition-all ${
                    demoRole === 'KOORDINATOR' 
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Koordinator
                </button>
              </div>
           </div>
        )}

        {/* Switch to/from Demo Mode */}
        {isFirebaseEnabled && (
          <button 
            type="button" 
            onClick={() => {
              setIsDemoMode(!isDemoMode);
              setError("");
            }}
            className="mt-6 text-xs font-medium text-white/80 hover:text-white bg-black/20 hover:bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm transition-all"
          >
            {isDemoMode ? "Switch to Real Login" : "Switch to Demo Mode"}
          </button>
        )}
      </div>
    </div>
  );
}

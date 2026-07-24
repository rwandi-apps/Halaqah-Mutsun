import React, { useState } from 'react';
import { MonitoringSetoranSabak } from '../../coordinator/reports/MonitoringSetoranSabak';
import { Share2, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';

export default function PublicMonitoringSabakPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/public/monitoring-sabak`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      {/* Top Header Banner for Public View */}
      <header className="bg-primary-900 text-white shadow-md sticky top-0 z-50 border-b border-primary-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-800 border border-primary-700 flex items-center justify-center text-primary-200 shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm uppercase tracking-wide">Monitoring Setoran Sabaq</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={10} /> Link Publik
                </span>
              </div>
              <p className="text-[11px] text-primary-200">SD Al Qur'an — Halaman Mutabaah Setoran Sabaq</p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 border border-emerald-500"
          >
            {copied ? (
              <>
                <CheckCircle2 size={15} className="text-white" />
                <span>Link Disalin!</span>
              </>
            ) : (
              <>
                <Share2 size={15} />
                <span>Salin Link Halaman Ini</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <MonitoringSetoranSabak />
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-12">
        <p className="font-semibold">SD Al Qur'an — Sistem Mutabaah & Monitoring Setoran Sabaq</p>
      </footer>
    </div>
  );
}

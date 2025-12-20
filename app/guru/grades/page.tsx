
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../../../components/Button';

export default function GuruGradesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50"></div>

        {/* Ilustrasi Islami Sederhana: Mushaf Al-Qur'an */}
        <div className="mb-10 flex justify-center relative">
          <div className="relative z-10 w-28 h-28 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] border border-emerald-50 flex items-center justify-center text-emerald-600 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <BookOpen size={56} strokeWidth={1.2} />
          </div>
          <div className="absolute -top-4 -right-2 z-20">
            <div className="bg-amber-100/80 backdrop-blur-sm p-2 rounded-2xl border border-amber-200 text-amber-600 shadow-sm animate-pulse">
              <Sparkles size={24} />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-[0.2em] mb-8 border border-emerald-100/50 shadow-inner">
          Dalam Pengembangan
        </div>

        {/* Judul Utama */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
          Fitur Evaluasi Sedang Dalam Pengembangan
        </h2>

        {/* Subjudul Islami */}
        <p className="text-sm text-gray-500 leading-relaxed mb-10 px-4">
          InsyaAllah fitur ini sedang dipersiapkan untuk mendukung proses pembinaan santri secara lebih optimal.
        </p>

        {/* Pesan Motivatif Islami Singkat */}
        <div className="relative py-6 px-6 mb-10 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-100/50">
          <p className="text-xs italic text-emerald-700 font-semibold tracking-wide">
            "Setiap kebaikan memiliki waktu terbaiknya."
          </p>
        </div>

        {/* Tombol Navigasi */}
        <div className="px-2">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/guru/dashboard')}
            className="w-full py-5 rounded-[1.25rem] border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-sm group font-bold text-sm"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

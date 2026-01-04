
import React, { useEffect, useState } from 'react';
import { HalaqahEvaluation } from '../../../types';
import { subscribeToEvaluationsByTeacher } from '../../../services/firestoreService';
import { 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  Target, 
  Lightbulb, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  ChevronRight,
  // Added Zap icon import
  Zap
} from 'lucide-react';

export default function GuruEvaluationPage({ teacherId }: { teacherId?: string }) {
  const [evaluation, setEvaluation] = useState<HalaqahEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToEvaluationsByTeacher(teacherId, (evals) => {
      if (evals.length > 0) {
        const sorted = evals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setEvaluation(sorted[0]);
      } else {
        setEvaluation(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [teacherId]);

  // Fungsi Helper untuk mengubah teks panjang AI menjadi Poin-Poin
  const renderAsList = (text: string) => {
    if (!text) return null;
    // Split berdasarkan titik atau baris baru, hapus ruang kosong, ambil yang panjangnya memadai
    const points = text.split(/[.\n]/).filter(p => p.trim().length > 5);
    
    return (
      <ul className="space-y-3">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3 items-start group">
            <div className="mt-1.5 shrink-0">
               <ChevronRight size={14} className="text-primary-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="text-gray-700 leading-relaxed text-[13px] sm:text-sm font-medium">
              {point.trim()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 gap-4">
        <Loader2 size={48} className="text-primary-500 animate-spin" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Menganalisis Laporan...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Belum Ada Evaluasi</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">Koordinator belum mempublikasikan evaluasi untuk periode ini. Mohon periksa kembali nanti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 px-2 sm:px-4">
      
      {/* Header Section */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Status: Terpublikasi</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Evaluasi {evaluation.period}</h2>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
          <BookOpen size={16} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">Halaqah SDQ</span>
        </div>
      </div>

      {/* 1. INSIGHT UTAMA (Paling Menonjol) */}
      <div className="bg-blue-50 rounded-[2.5rem] p-6 sm:p-8 border border-blue-100 shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm">
            <Lightbulb size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Insight Utama</h3>
            <p className="text-[10px] font-bold text-blue-500 uppercase">Ringkasan Performa Halaqah</p>
          </div>
        </div>
        <div className="bg-white/60 p-5 rounded-3xl border border-blue-100/50">
          {renderAsList(evaluation.insightUtama)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. KENDALA TERINDIKASI */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-orange-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Kendala Terdeteksi</h3>
          </div>
          <div className="px-1">
            {evaluation.kendalaTerindikasi ? renderAsList(evaluation.kendalaTerindikasi) : (
              <p className="text-xs text-gray-400 italic">Tidak ada kendala kritis terdeteksi.</p>
            )}
          </div>
        </div>

        {/* 3. TARGET BULAN DEPAN */}
        <div className="bg-amber-50 rounded-[2.5rem] p-6 border border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-white text-amber-600 rounded-xl shadow-sm">
              <Target size={20} />
            </div>
            <h3 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Target Mendatang</h3>
          </div>
          <div className="bg-amber-600/90 p-5 rounded-3xl text-white text-center shadow-lg shadow-amber-500/20">
            <p className="text-[18px] font-black tracking-tight leading-tight">
              {evaluation.targetBulanDepan}
            </p>
          </div>
        </div>
      </div>

      {/* 4. TINDAK LANJUT */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-primary-50 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
            <Zap size={20} />
          </div>
          <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Langkah Tindak Lanjut</h3>
        </div>
        <div className="bg-primary-50/30 p-5 rounded-3xl border border-primary-100/30">
          {renderAsList(evaluation.tindakLanjut)}
        </div>
      </div>

      {/* 5. PESAN PERSONAL KOORDINATOR */}
      {evaluation.catatanKoordinator && (
        <div className="bg-emerald-600 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-100">Pesan dari Koordinator</h3>
          </div>
          <p className="text-sm font-bold leading-relaxed italic opacity-90 pl-2 border-l-2 border-emerald-400">
            "{evaluation.catatanKoordinator}"
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 flex justify-between items-center px-6 text-gray-400">
        <span className="text-[9px] font-bold uppercase tracking-widest">
          Diterbitkan: {new Date(evaluation.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </span>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Terverifikasi Sistem</span>
        </div>
      </div>
    </div>
  );
}

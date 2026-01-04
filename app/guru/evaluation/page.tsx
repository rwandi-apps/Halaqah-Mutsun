
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
  Zap,
  PauseCircle,
  RefreshCcw,
  ClipboardCheck,
  Check,
  MessageCircle,
  Info
} from 'lucide-react';

export default function GuruEvaluationPage({ teacherId }: { teacherId?: string }) {
  const [evaluation, setEvaluation] = useState<HalaqahEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk interaksi UI
  const [teacherStatus, setTeacherStatus] = useState('belum');
  const [isReadConfirmed, setIsReadConfirmed] = useState(false);

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

  const renderAsList = (text: string) => {
    if (!text) return null;
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

      {/* 1. INSIGHT UTAMA */}
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

      {/* 4. TINDAK LANJUT KOORDINATOR */}
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

      {/* NEW: KONFIRMASI PEMAHAMAN EVALUASI */}
      <div className={`rounded-[2rem] p-5 sm:p-6 transition-all duration-300 border ${isReadConfirmed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <button 
              onClick={() => setIsReadConfirmed(!isReadConfirmed)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isReadConfirmed ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white border-gray-200 hover:border-primary-300'}`}
            >
              {isReadConfirmed && <Check size={14} className="text-white" />}
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[13px] sm:text-sm font-bold transition-colors ${isReadConfirmed ? 'text-emerald-800' : 'text-gray-700'}`}>
                Saya telah membaca dan memahami evaluasi ini
              </span>
              {isReadConfirmed && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 rounded-full shrink-0">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Evaluasi telah dipahami</span>
                </div>
              )}
            </div>
            {!isReadConfirmed && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-50">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] sm:text-[11px] font-medium text-blue-600/80 leading-relaxed">
                  Silakan luangkan waktu untuk membaca evaluasi agar tindak lanjut terhadap santri dapat dilakukan dengan optimal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. RESPONS & TINDAK LANJUT GURU */}
      <div className={`transition-all duration-500 ${!isReadConfirmed ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="bg-slate-50 rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white text-slate-600 rounded-xl shadow-sm">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Respon & Tindak Lanjut Guru</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Update status pelaksanaan untuk koordinasi</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status Selection Buttons */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-3 ml-1 italic leading-relaxed">
                Silakan pilih status pelaksanaan tindak lanjut berdasarkan kondisi halaqah saat ini:
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'belum', label: 'Belum Dilaksanakan', icon: PauseCircle, color: 'text-slate-400' },
                  { id: 'proses', label: 'Sedang Dilaksanakan', icon: RefreshCcw, color: 'text-blue-500' },
                  { id: 'selesai', label: 'Sudah Dilaksanakan', icon: CheckCircle2, color: 'text-emerald-500' },
                  { id: 'diskusi', label: 'Butuh Diskusi / Konsultasi', icon: MessageSquare, color: 'text-amber-500' },
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setTeacherStatus(status.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      teacherStatus === status.id 
                        ? 'border-primary-500 bg-primary-50/50 ring-4 ring-primary-500/5' 
                        : 'border-white bg-white hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <status.icon size={18} className={status.color} />
                      <span className={`text-[13px] font-bold ${teacherStatus === status.id ? 'text-primary-700' : 'text-slate-600'}`}>
                        {status.label}
                      </span>
                    </div>
                    {teacherStatus === status.id && (
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Guru Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Catatan Guru (Opsional)
              </label>
              <div className="relative">
                <textarea
                  className="w-full p-5 bg-white border-2 border-white rounded-[2rem] text-sm font-medium focus:border-primary-200 outline-none h-32 transition-all shadow-sm placeholder:text-slate-300"
                  placeholder="Contoh: Terdapat beberapa kondisi santri atau kendala teknis yang perlu dibahas bersama koordinator..."
                ></textarea>
                <div className="absolute bottom-4 right-5 opacity-20">
                  <MessageCircle size={20} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              onClick={() => alert("Respon Anda berhasil disimpan. Koordinator akan segera meninjau status halaqah Anda.")}
              className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-lg active:scale-95"
            >
              Simpan Respon Guru
            </button>
          </div>
        </div>
      </div>

      {/* 6. PESAN PERSONAL KOORDINATOR */}
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

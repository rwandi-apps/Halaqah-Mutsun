
import React, { useEffect, useState } from 'react';
import { HalaqahEvaluation } from '../../../types';
import { getLatestEvaluationForTeacher } from '../../../services/firestoreService';
import { BookOpen, Sparkles, MessageSquare, Target, Zap, AlertCircle } from 'lucide-react';

export default function GuruEvaluationPage({ teacherId }: { teacherId?: string }) {
  const [evaluation, setEvaluation] = useState<HalaqahEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teacherId) {
      getLatestEvaluationForTeacher(teacherId).then(data => {
        setEvaluation(data);
        setIsLoading(false);
      });
    }
  }, [teacherId]);

  if (isLoading) return <div className="p-8 text-center text-gray-400">Memuat evaluasi...</div>;

  if (!evaluation) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Evaluasi</h3>
          <p className="text-sm text-gray-500">Evaluasi dari koordinator untuk halaqah Anda belum tersedia untuk periode ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative bg-white rounded-[2.5rem] shadow-xl shadow-primary-500/5 border border-primary-50 overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-10 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-primary-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-100">Evaluasi & Arahan Pembinaan</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Halaqah {evaluation.period}</h2>
              <p className="text-primary-100/80 text-sm font-medium">Berdasarkan data performa dan laporan bulanan ustadz.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
               <BookOpen size={32} className="text-white" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 sm:p-12 space-y-10">
          
          {/* Section 1: Insight Utama */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Zap size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Insight Utama</h3>
             </div>
             <div className="bg-emerald-50/30 p-6 rounded-[1.5rem] border border-emerald-100/50 leading-relaxed text-gray-700 font-medium">
                {evaluation.insightUtama}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 2: Kendala */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Kendala Terindikasi</h3>
               </div>
               <div className="p-1 text-sm text-gray-600 leading-relaxed italic">
                  {evaluation.kendalaTerindikasi}
               </div>
            </div>

            {/* Section 3: Target */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Target size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Target Bulan Depan</h3>
               </div>
               <div className="bg-blue-600 p-6 rounded-[1.5rem] text-white shadow-lg shadow-blue-500/20">
                  <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Capaian Minimum:</p>
                  <p className="text-xl font-black">{evaluation.targetBulanDepan}</p>
               </div>
            </div>
          </div>

          {/* Section 4: Tindak Lanjut */}
          <div className="pt-6 border-t border-gray-100">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Tindak Lanjut & Arahan</h3>
             </div>
             <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 leading-relaxed text-gray-700">
                {evaluation.tindakLanjut}
             </div>
          </div>

          {/* Signature / Footer */}
          <div className="flex justify-between items-center pt-8">
             <div className="text-xs text-gray-400 font-medium">
                Dibuat pada: {new Date(evaluation.createdAt).toLocaleDateString('id-ID')}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Koordinator Tahfizh</p>
                <div className="h-px w-24 bg-primary-100 ml-auto mb-2"></div>
                <p className="text-sm font-bold text-gray-900">SDQ Mutiara Sunnah</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

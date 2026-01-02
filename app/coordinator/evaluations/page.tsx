
import React, { useState, useEffect } from 'react';
import { User, Report, HalaqahEvaluation } from '../../../types';
import { getAllTeachers, getReportsByTeacher, saveHalaqahEvaluation, getHalaqahEvaluation } from '../../../services/firestoreService';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../../components/Button';
import { Sparkles, Save, User as UserIcon, Calendar, ClipboardList, AlertCircle, CheckCircle, MessageSquarePlus } from 'lucide-react';

export default function CoordinatorEvaluationsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Desember');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [evaluation, setEvaluation] = useState<Partial<HalaqahEvaluation>>({
    insightUtama: '',
    kendalaTerindikasi: '',
    tindakLanjut: '',
    targetBulanDepan: '',
    catatanKoordinator: ''
  });

  const months = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"];

  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
    });
  }, []);

  useEffect(() => {
    if (selectedTeacherId && selectedMonth) {
      loadDataAndExistingEval();
    }
  }, [selectedTeacherId, selectedMonth]);

  const loadDataAndExistingEval = async () => {
    setIsLoading(true);
    try {
      const [teacherReports, existingEval] = await Promise.all([
        getReportsByTeacher(selectedTeacherId),
        getHalaqahEvaluation(selectedTeacherId, `${selectedMonth} 2025`)
      ]);
      
      setReports(teacherReports.filter(r => r.month === selectedMonth));
      
      if (existingEval) {
        setEvaluation(existingEval);
      } else {
        setEvaluation({
          insightUtama: '',
          kendalaTerindikasi: '',
          tindakLanjut: '',
          targetBulanDepan: '',
          catatanKoordinator: ''
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (reports.length === 0) {
      alert("Tidak ada data laporan guru bulan ini untuk dianalisis.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Persiapkan data ringkas untuk prompt
      const contextData = reports.map(r => 
        `- Santri: ${r.studentName}, Capaian: ${r.tahfizh.individual}, Catatan Guru: ${r.notes}`
      ).join('\n');

      const internalPrompt = `
        TUGAS: Anda adalah Koordinator Tahfizh Senior yang sedang mengevaluasi Guru Halaqah.
        DATA HALAQAH (Bulan: ${selectedMonth}):
        ${contextData}

        INSTRUKSI OUTPUT (WAJIB):
        1. Fokus pada performa KELOMPOK (Halaqah), bukan per individu santri.
        2. Gunakan bahasa pembinaan yang memotivasi, santun, dan berwibawa.
        3. Format HARUS JSON murni tanpa markdown.
        4. Field JSON: 
           - insightUtama: Rangkuman progres kolektif bulan ini.
           - kendalaTerindikasi: Pola kendala yang terlihat dari catatan guru.
           - tindakLanjut: Arahan konkret untuk ustadz perbaiki di bulan depan.
           - targetBulanDepan: Rekomendasi target capaian minimal.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: internalPrompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.7 
        }
      });

      const result = JSON.parse(response.text || '{}');
      setEvaluation(prev => ({ 
        ...prev, 
        ...result,
        catatanKoordinator: prev.catatanKoordinator || '' // Biarkan manual
      }));
      
    } catch (error) {
      console.error(error);
      alert("AI Gagal menganalisis. Mohon coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeacherId) return;
    setIsSaving(true);
    try {
      await saveHalaqahEvaluation({
        teacherId: selectedTeacherId,
        period: `${selectedMonth} 2025`,
        academicYear: '2025/2026',
        insightUtama: evaluation.insightUtama || '',
        kendalaTerindikasi: evaluation.kendalaTerindikasi || '',
        tindakLanjut: evaluation.tindakLanjut || '',
        targetBulanDepan: evaluation.targetBulanDepan || '',
        catatanKoordinator: evaluation.catatanKoordinator || ''
      });
      alert("Evaluasi telah terbit dan dapat dilihat oleh Guru!");
    } catch (e) {
      alert("Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Evaluasi & Tindak Lanjut</h2>
          <p className="text-gray-500 mt-1">Supervisi performa halaqah secara bulanan.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Pilih Guru Halaqah</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none">
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Bulan Laporan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none">
              {months.map(m => <option key={m} value={m}>{m} 2025</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Referensi Data Guru (Visual only) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><ClipboardList size={18} className="text-primary-500"/> Laporan Guru</h3>
               <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{reports.length} Santri</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Memuat data halaqah...</div>
              ) : reports.length > 0 ? (
                reports.map(r => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary-200 transition-all">
                    <p className="font-bold text-gray-900 text-xs mb-1">{r.studentName}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       {r.tahfizh.individual}
                    </div>
                    <p className="text-[11px] text-gray-400 italic leading-relaxed">"{r.notes || 'N/A'}"</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 p-10 text-center">
                   <AlertCircle size={40} className="opacity-20" />
                   <p className="text-xs font-medium">Pilih guru dan periode untuk menganalisis data.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Workspace Evaluasi Koordinator */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-primary-100 overflow-hidden">
            <div className="bg-gradient-to-br from-white to-primary-50/30 p-6 sm:p-8 border-b border-primary-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <MessageSquarePlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Review Pembinaan</h3>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Halaqah {selectedMonth} 2025</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || reports.length === 0} 
                className="group flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-95"
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />}
                {isGenerating ? "Menganalisis..." : "Generate AI"}
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:20px_20px]">
              
              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">1. Insight Utama</label>
                    <textarea value={evaluation.insightUtama} onChange={e => setEvaluation({...evaluation, insightUtama: e.target.value})} className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all shadow-sm" placeholder="Rangkuman performa kolektif..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">2. Kendala Terindikasi</label>
                    <textarea value={evaluation.kendalaTerindikasi} onChange={e => setEvaluation({...evaluation, kendalaTerindikasi: e.target.value})} className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all shadow-sm" placeholder="Masalah yang sering muncul..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">3. Arahan & Tindak Lanjut</label>
                    <textarea value={evaluation.tindakLanjut} onChange={e => setEvaluation({...evaluation, tindakLanjut: e.target.value})} className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all shadow-sm" placeholder="Instruksi untuk Ustadz..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">4. Target Bulan Depan</label>
                    <textarea value={evaluation.targetBulanDepan} onChange={e => setEvaluation({...evaluation, targetBulanDepan: e.target.value})} className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all shadow-sm" placeholder="Capaian minimal berikutnya..." />
                 </div>
              </div>

              {/* Manual Field (Human Input Only) */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   5. Catatan Khusus Koordinator (Pesan Personal)
                </label>
                <textarea 
                  value={evaluation.catatanKoordinator} 
                  onChange={e => setEvaluation({...evaluation, catatanKoordinator: e.target.value})} 
                  className="w-full p-5 bg-emerald-50/30 border-2 border-emerald-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none h-24 placeholder:text-emerald-300" 
                  placeholder="Contoh: 'Ustadz, semangat ya. Pekan depan saya akan visitasi ke halaqah antum...'" 
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
               <Button 
                onClick={handleSave} 
                isLoading={isSaving} 
                disabled={!selectedTeacherId || !evaluation.insightUtama} 
                className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/20"
               >
                 <Save size={18} className="mr-2" /> Publikasikan Evaluasi ke Guru
               </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
             <CheckCircle size={14} className="text-emerald-500" />
             Evaluasi akan muncul di dashboard ustadz secara otomatis
          </div>
        </div>
      </div>
    </div>
  );
}

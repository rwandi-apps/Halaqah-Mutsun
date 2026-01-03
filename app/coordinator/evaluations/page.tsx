
import React, { useState, useEffect } from 'react';
import { User, Report, HalaqahEvaluation } from '../../../types';
import { getAllTeachers, getReportsByTeacher, saveHalaqahEvaluation, getHalaqahEvaluation } from '../../../services/firestoreService';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../../components/Button';
import { Sparkles, Save, User as UserIcon, Calendar, ClipboardList, AlertCircle, CheckCircle, MessageSquarePlus, Filter } from 'lucide-react';

export default function CoordinatorEvaluationsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [selectedPeriod, setSelectedPeriod] = useState('Desember');
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
  const semesters = ["Ganjil", "Genap"];

  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
    });
  }, []);

  // Reset period selection when type changes
  useEffect(() => {
    if (reportType === 'Laporan Semester') {
      setSelectedPeriod('Ganjil');
    } else {
      setSelectedPeriod('Desember');
    }
  }, [reportType]);

  useEffect(() => {
    if (selectedTeacherId && selectedPeriod) {
      loadDataAndExistingEval();
    }
  }, [selectedTeacherId, selectedPeriod, reportType]);

  const loadDataAndExistingEval = async () => {
    setIsLoading(true);
    try {
      const periodLabel = reportType === 'Laporan Semester' 
        ? `Semester ${selectedPeriod} 2025/2026`
        : `${selectedPeriod} 2025`;

      const [teacherReports, existingEval] = await Promise.all([
        getReportsByTeacher(selectedTeacherId),
        getHalaqahEvaluation(selectedTeacherId, periodLabel)
      ]);
      
      // Filter reports by Type and Month/Semester
      setReports(teacherReports.filter(r => r.type === reportType && r.month === selectedPeriod));
      
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
      alert("Tidak ada data laporan guru pada periode ini untuk dianalisis.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contextData = reports.map(r => 
        `- Santri: ${r.studentName}, Capaian: ${r.tahfizh.individual}, Catatan Guru: ${r.notes}`
      ).join('\n');

      const internalPrompt = `
        TUGAS: Anda adalah Koordinator Tahfizh Senior yang sedang mengevaluasi Guru Halaqah.
        TIPE EVALUASI: ${reportType}
        PERIODE: ${selectedPeriod}
        
        DATA PERFORMA HALAQAH:
        ${contextData}

        INSTRUKSI OUTPUT (WAJIB):
        1. Analisis tren perkembangan halaqah selama ${reportType === 'Laporan Semester' ? 'satu semester' : 'satu bulan'} terakhir.
        2. Fokus pada performa KELOMPOK (Halaqah), bukan per individu santri.
        3. Gunakan bahasa pembinaan yang memotivasi, santun, dan berwibawa.
        4. Format HARUS JSON murni tanpa markdown.
        5. Field JSON: 
           - insightUtama: Rangkuman progres kolektif periode ini.
           - kendalaTerindikasi: Pola kendala yang terlihat dari catatan guru.
           - tindakLanjut: Arahan konkret untuk ustadz perbaiki di periode mendatang.
           - targetBulanDepan: Rekomendasi target capaian minimal untuk ${reportType === 'Laporan Semester' ? 'Semester depan' : 'Bulan depan'}.
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
        catatanKoordinator: prev.catatanKoordinator || ''
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
      const periodLabel = reportType === 'Laporan Semester' 
        ? `Semester ${selectedPeriod} 2025/2026`
        : `${selectedPeriod} 2025`;

      await saveHalaqahEvaluation({
        teacherId: selectedTeacherId,
        period: periodLabel,
        academicYear: '2025/2026',
        insightUtama: evaluation.insightUtama || '',
        kendalaTerindikasi: evaluation.kendalaTerindikasi || '',
        tindakLanjut: evaluation.tindakLanjut || '',
        targetBulanDepan: evaluation.targetBulanDepan || '',
        catatanKoordinator: evaluation.catatanKoordinator || ''
      });
      alert(`Evaluasi ${reportType} telah terbit!`);
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
          <p className="text-gray-500 mt-1">Supervisi performa halaqah secara periodik menggunakan kecerdasan buatan.</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tipe Laporan</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none">
              <option value="Laporan Bulanan">Laporan Bulanan</option>
              <option value="Laporan Semester">Laporan Semester</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periode</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none">
              {reportType === 'Laporan Semester' 
                ? semesters.map(s => <option key={s} value={s}>Semester {s}</option>)
                : months.map(m => <option key={m} value={m}>{m} 2025</option>)
              }
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Referensi Data Guru */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><ClipboardList size={18} className="text-primary-500"/> Data {reportType}</h3>
               <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full">{reports.length} Data</span>
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
                    <p className="text-[11px] text-gray-400 italic leading-relaxed">"{r.notes || 'Tanpa catatan'}"</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 p-10 text-center">
                   <AlertCircle size={40} className="opacity-20" />
                   <p className="text-xs font-medium">Data {reportType} untuk {selectedPeriod} tidak ditemukan.</p>
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
                  <h3 className="font-bold text-gray-800">Evaluasi Pembinaan</h3>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                    {reportType} - {selectedPeriod}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || reports.length === 0} 
                className="group flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20 active:scale-95"
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />}
                {isGenerating ? "Menganalisis..." : "Analisis AI"}
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">1. Insight Utama</label>
                    <textarea value={evaluation.insightUtama} onChange={e => setEvaluation({...evaluation, insightUtama: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all" placeholder="Tinjauan progres halaqah..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">2. Kendala Terindikasi</label>
                    <textarea value={evaluation.kendalaTerindikasi} onChange={e => setEvaluation({...evaluation, kendalaTerindikasi: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all" placeholder="Masalah yang terdeteksi..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">3. Arahan & Tindak Lanjut</label>
                    <textarea value={evaluation.tindakLanjut} onChange={e => setEvaluation({...evaluation, tindakLanjut: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all" placeholder="Instruksi perbaikan untuk Ustadz..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">4. Target Berikutnya</label>
                    <textarea value={evaluation.targetBulanDepan} onChange={e => setEvaluation({...evaluation, targetBulanDepan: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:border-primary-500 outline-none h-28 transition-all" placeholder="KPI atau target capaian minimal..." />
                 </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   5. Catatan Khusus Koordinator (Pesan Personal)
                </label>
                <textarea 
                  value={evaluation.catatanKoordinator} 
                  onChange={e => setEvaluation({...evaluation, catatanKoordinator: e.target.value})} 
                  className="w-full p-5 bg-emerald-50/30 border-2 border-emerald-100 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none h-24" 
                  placeholder="Contoh: Pesan langsung untuk memotivasi ustadz..." 
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
               <Button 
                onClick={handleSave} 
                isLoading={isSaving} 
                disabled={!selectedTeacherId || !evaluation.insightUtama} 
                className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em]"
               >
                 <Save size={18} className="mr-2" /> Publikasikan Evaluasi Periodik
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

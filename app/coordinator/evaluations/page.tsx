
import React, { useState, useEffect } from 'react';
import { User, Report, HalaqahEvaluation } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher, saveHalaqahEvaluation, getHalaqahEvaluation } from '../../../services/firestoreService';
import { Button } from '../../../components/Button';
import { Sparkles, Save, User as UserIcon, Calendar, ClipboardList, AlertCircle, MessageSquarePlus, Filter, Loader2 } from 'lucide-react';

export default function CoordinatorEvaluationsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [selectedPeriod, setSelectedPeriod] = useState('Desember');
  const [allTeacherReports, setAllTeacherReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
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

  useEffect(() => {
    getAllTeachers().then(data => {
      setTeachers(data.filter(u => u.role === 'GURU'));
    });
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setAllTeacherReports(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedTeacherId]);

  useEffect(() => {
    const filtered = allTeacherReports.filter(r => {
      const typeMatch = r.type.toLowerCase().includes(reportType.toLowerCase().replace('laporan ', ''));
      const periodMatch = r.month === selectedPeriod;
      return typeMatch && periodMatch;
    });
    setFilteredReports(filtered);
    if (selectedTeacherId && selectedPeriod) loadExistingEvaluation();
  }, [allTeacherReports, reportType, selectedPeriod, selectedTeacherId]);

  const loadExistingEvaluation = async () => {
    const periodLabel = reportType === 'Laporan Semester' ? `Semester ${selectedPeriod} 2025/2026` : `${selectedPeriod} 2025`;
    const existingEval = await getHalaqahEvaluation(selectedTeacherId, periodLabel);
    if (existingEval) setEvaluation(existingEval);
  };

  const handleGenerateAI = async () => {
    if (filteredReports.length === 0) {
      alert(`Tidak ada data laporan santri untuk dianalisis pada periode ${selectedPeriod}.`);
      return;
    }

    setIsGenerating(true);
    try {
      // Format data tabel mentah menjadi string deskriptif untuk AI
      const contextData = filteredReports.map((r, i) => 
        `${i+1}. Nama: ${r.studentName}, Sabaq: ${r.tahfizh.individual}, Catatan Guru: ${r.notes || 'Nihil'}`
      ).join('\n');

      const response = await fetch('/api/ai-evaluasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          period: selectedPeriod,
          contextData
        })
      });

      const result = await response.json();

      if (result.error) throw new Error(result.error);

      // Mapping hasil AI ke state evaluation
      setEvaluation(prev => ({
        ...prev,
        insightUtama: result.insightUtama || '',
        kendalaTerindikasi: result.kendalaTerindikasi || '',
        tindakLanjut: result.tindakLanjut || '',
        targetBulanDepan: result.targetBulanDepan || ''
      }));
      
    } catch (error: any) {
      console.error(error);
      alert("Gagal memproses AI: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTeacherId) return;
    setIsSaving(true);
    try {
      const periodLabel = reportType === 'Laporan Semester' ? `Semester ${selectedPeriod} 2025/2026` : `${selectedPeriod} 2025`;
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
      alert(`Evaluasi Halaqah berhasil dipublikasikan.`);
    } catch (e) {
      alert("Gagal menyimpan ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Workspace Analisis AI</h2>
          <p className="text-gray-500 mt-1">Gunakan kecerdasan buatan untuk mengulas laporan guru secara objektif.</p>
        </div>
      </div>

      {/* Kontrol Filter */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Guru Halaqah</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Laporan</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              <option value="Laporan Bulanan">Laporan Bulanan</option>
              <option value="Laporan Semester">Laporan Semester</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Periode</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              {reportType === 'Laporan Semester' 
                ? ["Ganjil", "Genap"].map(s => <option key={s} value={s}>Semester {s}</option>)
                : ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m} 2025</option>)
              }
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Data Input */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 h-[600px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><ClipboardList size={18} className="text-primary-500"/> Data Input Guru</h3>
               <span className="text-[10px] font-black bg-primary-600 text-white px-3 py-1.5 rounded-full uppercase">{filteredReports.length} Laporan</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <Loader2 size={32} className="text-primary-500 animate-spin" />
                </div>
              ) : filteredReports.length > 0 ? (
                filteredReports.map(r => (
                  <div key={r.id} className="p-4 bg-white rounded-2xl border-2 border-gray-50 hover:border-primary-100 transition-all">
                    <p className="font-black text-gray-900 text-xs uppercase mb-1">{r.studentName}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">Sabaq: {r.tahfizh.individual}</p>
                    {r.notes && <p className="text-[10px] text-primary-600 italic mt-1">"{r.notes}"</p>}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 p-10 text-center">
                   <AlertCircle size={32} className="opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Pilih Guru & Periode<br/>Untuk Memuat Data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Output AI */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] shadow-xl border border-primary-100 overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-primary-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tighter">Hasil Analisis AI</h3>
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{reportType} - {selectedPeriod}</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || filteredReports.length === 0} 
                className="flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? "Menganalisis..." : "Generate AI"}
              </button>
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Insight Performa Kolektif</label>
                    <textarea value={evaluation.insightUtama} onChange={e => setEvaluation({...evaluation, insightUtama: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 outline-none h-40 transition-all shadow-inner" placeholder="AI akan menganalisis tren..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Kendala Terindikasi</label>
                    <textarea value={evaluation.kendalaTerindikasi} onChange={e => setEvaluation({...evaluation, kendalaTerindikasi: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 outline-none h-40 transition-all shadow-inner" placeholder="AI akan mendeteksi hambatan..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Rekomendasi Tindak Lanjut</label>
                    <textarea value={evaluation.tindakLanjut} onChange={e => setEvaluation({...evaluation, tindakLanjut: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 outline-none h-40 transition-all shadow-inner" placeholder="AI akan menyarankan langkah..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">Target Capaian Mendatang</label>
                    <textarea value={evaluation.targetBulanDepan} onChange={e => setEvaluation({...evaluation, targetBulanDepan: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 outline-none h-40 transition-all shadow-inner" placeholder="AI akan merumuskan target..." />
                 </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-4">
                   <MessageSquarePlus size={16} /> Pesan Tambahan Koordinator (Manual)
                </label>
                <textarea 
                  value={evaluation.catatanKoordinator} 
                  onChange={e => setEvaluation({...evaluation, catatanKoordinator: e.target.value})} 
                  className="w-full p-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2.5rem] text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 outline-none h-32" 
                  placeholder="Berikan motivasi khusus untuk Guru..." 
                />
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
               <Button 
                onClick={handleSave} 
                isLoading={isSaving} 
                disabled={!selectedTeacherId || !evaluation.insightUtama} 
                className="w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary-500/20"
               >
                 <Save size={20} className="mr-2" /> Publikasikan Evaluasi ke Guru
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

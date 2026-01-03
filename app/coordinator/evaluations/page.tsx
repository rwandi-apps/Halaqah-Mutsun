
import React, { useState, useEffect } from 'react';
import { User, Report, HalaqahEvaluation } from '../../../types';
import { getAllTeachers, getReportsByTeacher, saveHalaqahEvaluation, getHalaqahEvaluation } from '../../../services/firestoreService';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../../components/Button';
import { Sparkles, Save, User as UserIcon, Calendar, ClipboardList, AlertCircle, CheckCircle, MessageSquarePlus, Filter, ChevronRight } from 'lucide-react';

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

  // Update pilihan periode default saat tipe laporan berubah
  useEffect(() => {
    if (reportType === 'Laporan Semester') {
      setSelectedPeriod('Ganjil');
    } else {
      setSelectedPeriod('Desember');
    }
  }, [reportType]);

  // Load data laporan & data evaluasi yang sudah tersimpan
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
      
      // Filter laporan berdasarkan tipe dan bulan/semester
      // Logika: field 'month' di koleksi 'laporan' menyimpan nama bulan atau nama semester
      const filtered = teacherReports.filter(r => 
        r.type === reportType && r.month === selectedPeriod
      );
      setReports(filtered);
      
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
      alert(`Data ${reportType} untuk ${selectedPeriod} tidak ditemukan. Pastikan Guru sudah menginput laporan.`);
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Persiapkan data kontekstual yang kaya untuk AI
      const contextData = reports.map(r => 
        `- Nama: ${r.studentName}, Sabaq: ${r.tahfizh.individual}, Tilawah: ${r.tilawah.individual}, Catatan Guru: ${r.notes}`
      ).join('\n');

      const internalPrompt = `
        TUGAS: Anda adalah Koordinator Tahfizh Senior. Berikan analisis pembinaan untuk Guru Halaqah.
        JENIS EVALUASI: ${reportType}
        PERIODE: ${selectedPeriod}
        
        DATA DATA LAPORAN GURU:
        ${contextData}

        INSTRUKSI KHUSUS:
        1. Jika ini evaluasi SEMESTER, fokus pada pencapaian jangka panjang dan stabilitas hafalan.
        2. Jika ini evaluasi BULANAN, fokus pada ritme setoran mingguan.
        3. Gunakan bahasa yang "mengayomi" ustadz/ustadzah.
        4. Output HARUS JSON murni (insightUtama, kendalaTerindikasi, tindakLanjut, targetBulanDepan).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: internalPrompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.8
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
      alert("Gagal memproses analisis AI.");
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
      alert(`Evaluasi ${reportType} berhasil dipublikasikan.`);
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Supervisi & Evaluasi AI</h2>
          <p className="text-gray-500 mt-1">Gunakan kecerdasan buatan untuk mengulas laporan guru secara mendalam.</p>
        </div>
      </div>

      {/* Input Selection Panel */}
      <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Pilih Guru</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              <option value="">-- Pilih Guru Halaqah --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Tipe Laporan</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              <option value="Laporan Bulanan">Laporan Bulanan</option>
              <option value="Laporan Semester">Laporan Semester</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">3. Periode</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all">
              {reportType === 'Laporan Semester' 
                ? semesters.map(s => <option key={s} value={s}>Semester {s}</option>)
                : months.map(m => <option key={m} value={m}>{m} 2025</option>)
              }
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Data Laporan (Source Data) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 h-[650px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><ClipboardList size={18} className="text-primary-500"/> Sumber Data</h3>
               <span className="text-[10px] font-black bg-primary-600 text-white px-2.5 py-1 rounded-full uppercase">{reports.length} Santri</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                   <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Data...</p>
                </div>
              ) : reports.length > 0 ? (
                reports.map(r => (
                  <div key={r.id} className="p-4 bg-white rounded-2xl border-2 border-gray-50 hover:border-primary-100 transition-all shadow-sm">
                    <p className="font-bold text-gray-900 text-xs mb-2 uppercase tracking-tight">{r.studentName}</p>
                    <div className="space-y-1.5 mb-3">
                       <div className="flex items-center gap-2 text-[10px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                          <span className="font-black">Tahfizh:</span> {r.tahfizh.individual}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                          <span className="font-black">Tilawah:</span> {r.tilawah.individual}
                       </div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                       <p className="text-[10px] text-gray-400 italic leading-relaxed">"{r.notes || 'Guru tidak meninggalkan catatan khusus.'}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-10 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <AlertCircle size={32} className="opacity-20" />
                   </div>
                   <div>
                      <p className="text-xs font-black uppercase text-gray-400">Data Kosong</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-1">Guru belum mengirim {reportType} untuk periode ini.</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Workspace Evaluasi (AI Workspace) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-primary-100 overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 border-b border-primary-50 flex justify-between items-center bg-[radial-gradient(#ede9fe_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Analisis Pembinaan</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">
                    <span>{reportType}</span>
                    <ChevronRight size={10} />
                    <span>{selectedPeriod}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || reports.length === 0} 
                className="group flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all disabled:opacity-50 shadow-lg shadow-primary-500/20"
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Sparkles size={16} />}
                {isGenerating ? "Berpikir..." : "Mulai Analisis AI"}
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">1. Insight Performa</label>
                    <textarea value={evaluation.insightUtama} onChange={e => setEvaluation({...evaluation, insightUtama: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-32 transition-all shadow-inner" placeholder="Tinjauan umum pencapaian halaqah..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">2. Kendala Terdeteksi</label>
                    <textarea value={evaluation.kendalaTerindikasi} onChange={e => setEvaluation({...evaluation, kendalaTerindikasi: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-32 transition-all shadow-inner" placeholder="Pola masalah yang ditemukan AI..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">3. Arahan & Tindak Lanjut</label>
                    <textarea value={evaluation.tindakLanjut} onChange={e => setEvaluation({...evaluation, tindakLanjut: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-32 transition-all shadow-inner" placeholder="Instruksi konkret untuk ustadz..." />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-widest ml-1">4. Target Periode Depan</label>
                    <textarea value={evaluation.targetBulanDepan} onChange={e => setEvaluation({...evaluation, targetBulanDepan: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-32 transition-all shadow-inner" placeholder="KPI atau capaian minimal selanjutnya..." />
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">
                   <MessageSquarePlus size={16} />
                   5. Pesan Personal Koordinator (Manual)
                </label>
                <textarea 
                  value={evaluation.catatanKoordinator} 
                  onChange={e => setEvaluation({...evaluation, catatanKoordinator: e.target.value})} 
                  className="w-full p-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none h-28 placeholder:text-emerald-300" 
                  placeholder="Ketik pesan khusus atau motivasi langsung untuk Ustadz di sini..." 
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
               <Button 
                onClick={handleSave} 
                isLoading={isSaving} 
                disabled={!selectedTeacherId || !evaluation.insightUtama} 
                className="w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/20"
               >
                 <Save size={20} className="mr-2" /> Publikasikan Evaluasi ke Guru
               </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 justify-center text-[9px] font-black text-gray-400 uppercase tracking-[0.25em]">
             <CheckCircle size={14} className="text-emerald-500" />
             Evaluasi yang disimpan akan langsung muncul di dashboard guru
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { User, Report, HalaqahEvaluation } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher, saveHalaqahEvaluation, getHalaqahEvaluation } from '../../../services/firestoreService';
import { GoogleGenAI } from "@google/genai";
import { Button } from '../../../components/Button';
import { Sparkles, Save, User as UserIcon, Calendar, ClipboardList, AlertCircle, CheckCircle, MessageSquarePlus, Filter, ChevronRight, Loader2 } from 'lucide-react';

export default function CoordinatorEvaluationsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [selectedPeriod, setSelectedPeriod] = useState('Desember');
  
  const [allTeacherReports, setAllTeacherReports] = useState<Report[]>([]); // Data mentah dari subscription
  const [filteredReports, setFilteredReports] = useState<Report[]>([]); // Data yang sudah difilter untuk UI
  
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

  // 1. Load Daftar Guru
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
    });
  }, []);

  // 2. Real-time Subscription untuk Laporan Guru
  useEffect(() => {
    if (!selectedTeacherId) {
      setAllTeacherReports([]);
      return;
    }

    setIsLoading(true);
    // Berlangganan ke seluruh laporan guru yang dipilih (tanpa filter firestore agar fleksibel di client)
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setAllTeacherReports(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTeacherId]);

  // 3. Logic Filter Local (Reaktif terhadap Perubahan UI)
  useEffect(() => {
    const filtered = allTeacherReports.filter(r => {
      // Normalisasi perbandingan tipe (agar "Semester" cocok dengan "Laporan Semester")
      const typeMatch = r.type.toLowerCase().includes(reportType.toLowerCase().replace('laporan ', '')) || 
                        reportType.toLowerCase().includes(r.type.toLowerCase().replace('laporan ', ''));
      
      const periodMatch = r.month === selectedPeriod;
      
      return typeMatch && periodMatch;
    });

    setFilteredReports(filtered);
    
    // Reset atau Load existing evaluation untuk periode ini
    if (selectedTeacherId && selectedPeriod) {
      loadExistingEvaluation();
    }
  }, [allTeacherReports, reportType, selectedPeriod, selectedTeacherId]);

  // 4. Update default period saat tipe laporan berubah
  useEffect(() => {
    if (reportType === 'Laporan Semester') {
      setSelectedPeriod('Ganjil');
    } else {
      setSelectedPeriod('Desember');
    }
  }, [reportType]);

  const loadExistingEvaluation = async () => {
    const periodLabel = reportType === 'Laporan Semester' 
      ? `Semester ${selectedPeriod} 2025/2026`
      : `${selectedPeriod} 2025`;

    const existingEval = await getHalaqahEvaluation(selectedTeacherId, periodLabel);
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
  };

  const handleGenerateAI = async () => {
    if (filteredReports.length === 0) {
      alert(`Tidak ada data ${reportType} untuk dianalisis.`);
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contextData = filteredReports.map(r => 
        `- Santri: ${r.studentName}, Sabaq: ${r.tahfizh.individual}, Catatan Guru: ${r.notes}`
      ).join('\n');

      const internalPrompt = `
        TUGAS: Analisis Laporan Halaqah ${reportType} periode ${selectedPeriod}.
        DATA:
        ${contextData}

        INSTRUKSI:
        1. Buat rangkuman evaluasi kolektif (Halaqah).
        2. Gunakan bahasa pembinaan Islami yang formal dan memotivasi.
        3. Output harus JSON: insightUtama, kendalaTerindikasi, tindakLanjut, targetBulanDepan.
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
      setEvaluation(prev => ({ ...prev, ...result }));
      
    } catch (error) {
      console.error(error);
      alert("Gagal memproses AI.");
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
      alert(`Evaluasi ${reportType} berhasil disimpan.`);
    } catch (e) {
      alert("Gagal menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500 px-4 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Evaluasi Halaqah Terpadu</h2>
          <p className="text-gray-500 mt-1">Supervisi performa guru melalui data laporan dan analisis AI.</p>
        </div>
      </div>

      {/* Selector Panel */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Guru Halaqah</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Tipe Penilaian</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              <option value="Laporan Bulanan">Laporan Bulanan</option>
              <option value="Laporan Semester">Laporan Semester</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">3. Periode</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
              {reportType === 'Laporan Semester' 
                ? semesters.map(s => <option key={s} value={s}>Semester {s}</option>)
                : months.map(m => <option key={m} value={m}>{m} 2025</option>)
              }
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Sumber Data (Panel Kiri) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 h-[650px] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                 <ClipboardList size={18} className="text-primary-500"/> Data Input Guru
               </h3>
               <span className="text-[10px] font-black bg-primary-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
                 {filteredReports.length} Data
               </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                   <Loader2 size={32} className="text-primary-500 animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Menghubungkan...</p>
                </div>
              ) : filteredReports.length > 0 ? (
                filteredReports.map(r => (
                  <div key={r.id} className="p-4 bg-white rounded-2xl border-2 border-gray-50 hover:border-primary-200 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{r.studentName}</p>
                      <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{r.month}</span>
                    </div>
                    <div className="space-y-1 mb-3">
                       <div className="flex items-center gap-2 text-[10px] text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="font-black opacity-60">Sabaq:</span> {r.tahfizh.individual}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <span className="font-black opacity-60">Tilawah:</span> {r.tilawah.individual}
                       </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 group-hover:bg-primary-50/30 transition-colors">
                       <p className="text-[10px] text-gray-400 italic leading-relaxed">"{r.notes || 'Catatan nihil.'}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-10 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                      <AlertCircle size={32} className="opacity-20" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-black uppercase text-gray-800">Data Tidak Ditemukan</p>
                      <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                        Guru belum mengirim <strong>{reportType}</strong> <br/> untuk periode <strong>{selectedPeriod}</strong>.
                      </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace AI Evaluasi (Panel Kanan) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[3rem] shadow-xl border border-primary-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-primary-50 flex justify-between items-center bg-[radial-gradient(#ede9fe_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tighter">Workspace Analisis</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1">
                    <span className="bg-primary-50 px-2 py-0.5 rounded-lg">{reportType}</span>
                    <ChevronRight size={12} className="opacity-40" />
                    <span className="bg-primary-50 px-2 py-0.5 rounded-lg">{selectedPeriod}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || filteredReports.length === 0} 
                className="group flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all disabled:opacity-30 shadow-2xl shadow-primary-500/40 active:scale-95"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? "Menganalisis..." : "Generate AI"}
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] ml-1">1. Insight Kolektif</label>
                    <textarea value={evaluation.insightUtama} onChange={e => setEvaluation({...evaluation, insightUtama: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-40 transition-all shadow-inner placeholder:text-gray-300" placeholder="AI akan merangkum progres di sini..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] ml-1">2. Pola Masalah</label>
                    <textarea value={evaluation.kendalaTerindikasi} onChange={e => setEvaluation({...evaluation, kendalaTerindikasi: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-40 transition-all shadow-inner placeholder:text-gray-300" placeholder="AI akan mendeteksi pola kendala..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] ml-1">3. Instruksi Pembinaan</label>
                    <textarea value={evaluation.tindakLanjut} onChange={e => setEvaluation({...evaluation, tindakLanjut: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-40 transition-all shadow-inner placeholder:text-gray-300" placeholder="Langkah konkret untuk Ustadz..." />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] ml-1">4. Target Berikutnya</label>
                    <textarea value={evaluation.targetBulanDepan} onChange={e => setEvaluation({...evaluation, targetBulanDepan: e.target.value})} className="w-full p-5 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none h-40 transition-all shadow-inner placeholder:text-gray-300" placeholder="KPI minimum periode depan..." />
                 </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-4">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                   5. Sentuhan Personal Koordinator (Manual)
                </label>
                <textarea 
                  value={evaluation.catatanKoordinator} 
                  onChange={e => setEvaluation({...evaluation, catatanKoordinator: e.target.value})} 
                  className="w-full p-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-[2.5rem] text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 outline-none h-32 placeholder:text-emerald-200" 
                  placeholder="Ketik pesan motivasi khusus untuk Ustadz..." 
                />
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
               <Button 
                onClick={handleSave} 
                isLoading={isSaving} 
                disabled={!selectedTeacherId || !evaluation.insightUtama} 
                className="w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary-500/20 active:scale-95"
               >
                 <Save size={20} className="mr-2" /> Publikasikan Evaluasi Ke Guru
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

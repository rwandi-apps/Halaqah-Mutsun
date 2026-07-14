
import React, { useEffect, useState, useMemo, useId } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, Trophy, X, ChevronRight, Share2, Copy } from 'lucide-react';
import { 
  subscribeToStudentsByTeacher, 
  subscribeToReportsByTeacher 
} from '../../../services/firestoreService';
import { generateStudentEvaluation } from '../../../services/geminiService';
import { calculateSDQProgress, SDQProgressResult, extractClassLevel } from '../../../services/sdqTargets';
import { Student, Report } from '../../../types';
import { SURAH_LIST } from '../../../services/mockBackend';

interface GuruDashboardProps {
  teacherId?: string;
}

interface StudentWithProgress extends Student {
  progressStats: SDQProgressResult;
  latestNotes?: string;
}

/**
 * Creative Infographic Magenta-style Circular Progress Component (as requested in the image)
 */
const PixarCircularGauge = ({ percentage }: { percentage: number }) => {
  const uId = useId();
  const cleanId = uId.replace(/:/g, '');
  const gradId = `magenta-grad-${cleanId}`;
  const filterId = `shadow-filter-${cleanId}`;
  
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 drop-shadow-md">
      {/* Outer 3D Shadow Plate */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-100 to-white shadow-[0_4px_10px_rgba(0,0,0,0.08),_inset_0_2px_4px_rgba(255,255,255,1)] border border-gray-100"></div>
      
      <svg viewBox="0 0 60 60" className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90 relative z-10">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="30%" stopColor="#ec4899" />
            <stop offset="70%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#a21caf" />
          </linearGradient>
          {/* Subtle drop shadow filter for active progress arc to look 3D */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#86198f" floodOpacity="0.4" />
          </filter>
        </defs>
        {/* Track circle (semi-transparent pale fuchsia) */}
        <circle cx="30" cy="30" r={radius} stroke="#fae8ff" strokeWidth="6" fill="transparent" opacity="0.5" />
        
        {/* Active progress circle (beautiful fuchsia gradient with 3D drop shadow) */}
        <circle 
          cx="30" 
          cy="30" 
          r={radius} 
          stroke={`url(#${gradId})`} 
          strokeWidth="6" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          filter={`url(#${filterId})`}
          className="transition-all duration-1000 ease-out" 
        />
      </svg>
      
      {/* Inner Central White badge with glossy gradient & pink drop shadow */}
      <div className="absolute inset-[11px] rounded-full bg-gradient-to-b from-white to-[#fdf2f8] flex flex-col items-center justify-center z-20 shadow-[0_4px_10px_rgba(217,70,239,0.15),_inset_0_2px_4px_rgba(255,255,255,0.9)] border border-pink-100/50">
        <span className="text-[14px] sm:text-[16px] font-black text-[#86198f] tracking-tighter leading-none flex items-baseline">
          {safePercentage}<span className="text-[8px] sm:text-[9px] text-[#db2777] font-extrabold ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
};

const PixarLinearBar = ({ percentage, colorClass }: { percentage: number, colorClass: string }) => (
  <div className="w-full h-4 sm:h-5 bg-gray-100 rounded-full p-[3px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-1000 relative shadow-sm ${colorClass}`} style={{ width: `${Math.min(percentage, 100)}%` }}>
      <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/30 rounded-t-full"></div>
    </div>
  </div>
);

export default function GuruDashboard({ teacherId }: GuruDashboardProps) {
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawReports, setRawReports] = useState<Report[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProgress | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    const unsubStudents = subscribeToStudentsByTeacher(teacherId, setRawStudents);
    const unsubReports = subscribeToReportsByTeacher(teacherId, setRawReports);
    return () => { unsubStudents(); unsubReports(); };
  }, [teacherId]);

  const studentsWithProgress = useMemo(() => {
    return rawStudents.map(student => {
      const studentReports = rawReports.filter(r => r.studentId === student.id);
      studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latestReport = studentReports[0];
      const level = extractClassLevel(student.className);
      
      let progressString = student.currentProgress || "-";
      
      if (latestReport) {
        if (level === 1) {
          // KOREKSI: Untuk Kelas 1, progres terbaru HANYA diambil dari Tilawah Individual (Iqra)
          // Engine sdqTargets akan otomatis mendeteksi jika isinya Al-Quran (100%)
          progressString = latestReport.tilawah?.individual || progressString;
        } else {
          // Kelas 2-6: Gunakan Tahfizh Individual
          progressString = latestReport.tahfizh?.individual || progressString;
        }
      }

      const effectiveData = {
        ...student,
        totalHafalan: latestReport?.totalHafalan || student.totalHafalan || { juz: 0, pages: 0, lines: 0 },
        currentProgress: progressString
      };

      return {
        ...student,
        latestNotes: latestReport?.notes || "",
        progressStats: calculateSDQProgress(effectiveData)
      } as StudentWithProgress;
    }).sort((a, b) => b.progressStats.percentage - a.progressStats.percentage);
  }, [rawStudents, rawReports]);

  const metrics = useMemo(() => {
    const total = studentsWithProgress.length;
    const completed = studentsWithProgress.filter(s => s.progressStats.percentage >= 100).length;
    const onTrack = studentsWithProgress.filter(s => s.progressStats.percentage >= 80 && s.progressStats.percentage < 100).length;
    const needsAttention = studentsWithProgress.filter(s => s.progressStats.percentage < 50).length;
    return { total, completed, onTrack, needsAttention };
  }, [studentsWithProgress]);

  const handleGenerateEvaluation = async (student: StudentWithProgress) => {
    setIsGenerating(true);
    try {
      const result = await generateStudentEvaluation(student, student.latestNotes);
      setAiEvaluation(result);
    } catch (e) {
      alert("Gagal generate evaluasi AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!aiEvaluation || !selectedStudent) return;
    const text = `*LAPORAN EVALUASI HALAQAH SDQ*\n*Nama:* ${selectedStudent.name}\n*Bulan:* ${new Date().toLocaleString('id-ID', { month: 'long' })}\n\n${aiEvaluation}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = () => {
    if (!aiEvaluation) return;
    navigator.clipboard.writeText(aiEvaluation);
    alert("Teks berhasil disalin.");
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 px-2 sm:px-0">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dashboard Halaqah</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Pantau target siswa Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 sm:p-6 rounded-2xl shadow-lg shadow-indigo-500/20 text-white group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1 opacity-80">Total Siswa</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.total}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-emerald-50 uppercase tracking-widest mb-1 opacity-80">Tercapai</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-blue-50 uppercase tracking-widest mb-1 opacity-80">On Track</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.onTrack}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-rose-500/20 text-white group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-orange-50 uppercase tracking-widest mb-1 opacity-80">Perhatian</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.needsAttention}</p>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 sm:p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500 sm:w-5 sm:h-5" />
          <h3 className="font-bold text-gray-800 uppercase tracking-tight text-sm sm:text-base">Capaian Target Kelas</h3>
        </div>
        
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          {studentsWithProgress.length > 0 ? (
            studentsWithProgress.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="group cursor-pointer bg-white active:bg-gray-50 hover:bg-gray-50/50 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-3xl transition-all duration-300 border border-gray-50 hover:border-gray-100 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <PixarCircularGauge percentage={student.progressStats.percentage} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${student.progressStats.badgeBg} ${student.progressStats.badgeText}`}>
                          {student.progressStats.statusText}
                        </span>
                        {student.progressStats.percentage >= 100 && <Trophy size={12} className="text-yellow-500 animate-bounce" />}
                      </div>
                      <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-base sm:text-lg truncate">
                        {student.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 mt-0.5 truncate">
                        Posisi: <span className="text-gray-700">{student.progressStats.label}</span>
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Semester</p>
                    <p className="text-sm font-black text-gray-800">
                      {student.progressStats.classLevel === 1 ? "Iqra 6 Hal 31" : `${student.progressStats.target} ${student.progressStats.unit}`}
                    </p>
                  </div>
                </div>
                <PixarLinearBar percentage={student.progressStats.percentage} colorClass={student.progressStats.colorClass} />
                <div className="flex justify-between items-center sm:hidden mt-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.progressStats.label}</p>
                  <div className="flex items-center gap-1 text-primary-500 font-black uppercase text-[9px]">Detail <ChevronRight size={10} /></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada data siswa ditemukan.</div>
          )}
        </div>
      </div>

      {/* MODAL EVALUASI - Diperbarui ke Lebar Penuh (Drawer) untuk Mobile */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
             {/* Header */}
             <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <Sparkles size={14} className="text-primary-500" />
                   <h3 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Evaluasi Naratif</h3>
                 </div>
                 <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wide opacity-70">{selectedStudent.name} • {selectedStudent.className}</p>
               </div>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
                  <X size={20} className="text-gray-600 sm:w-6 sm:h-6" />
               </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-white">
               {!aiEvaluation ? (
                 <div className="h-full flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 sm:w-28 sm:h-28 bg-primary-50 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mb-6 text-primary-600 border border-primary-100 shadow-inner">
                      <Sparkles size={40} className="sm:w-16 sm:h-16 animate-pulse" />
                   </div>
                   <h4 className="text-lg sm:text-xl font-black text-gray-800 mb-3">Siap Generate Evaluasi?</h4>
                   <p className="text-sm sm:text-base text-gray-500 mb-10 max-w-xs mx-auto font-medium leading-relaxed">
                     AI akan menyusun kalimat naratif yang personal untuk Ayah dan Bunda berdasarkan capaian <span className="font-black text-primary-600">{selectedStudent.progressStats.percentage}%</span> bulan ini.
                   </p>
                   <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating} className="w-full sm:w-auto px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">
                      Mulai Analisis AI
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                   <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                      <Trophy size={18} className="text-emerald-500 shrink-0" />
                      <p className="text-[11px] font-bold text-emerald-800">Evaluasi naratif berhasil dibuat! Silakan tinjau dan bagikan.</p>
                   </div>
                   
                   <div className="bg-gray-50/80 p-6 sm:p-8 rounded-[2rem] text-[13px] sm:text-[15px] whitespace-pre-wrap leading-relaxed font-medium text-gray-700 shadow-inner border border-gray-100 relative">
                     {aiEvaluation}
                     <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Copy size={16} />
                     </button>
                   </div>
                 </div>
               )}
             </div>

             {/* Footer Actions */}
             {aiEvaluation && (
               <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 shrink-0 pb-10 sm:pb-8">
                 <Button 
                   onClick={shareToWhatsApp} 
                   className="flex-1 py-4 sm:py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 text-white"
                 >
                   <Share2 size={18} className="mr-2" /> Kirim ke WhatsApp
                 </Button>
                 <div className="flex gap-2 sm:gap-3">
                    <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="flex-1 py-4 sm:py-5 border-gray-200 rounded-2xl font-bold text-xs bg-white">Ulangi</Button>
                    <Button variant="secondary" className="flex-1 py-4 sm:py-5 border-gray-200 rounded-2xl font-bold text-xs bg-white" onClick={() => setSelectedStudent(null)}>Tutup</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

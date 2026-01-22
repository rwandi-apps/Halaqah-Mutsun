
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, Trophy, X, ChevronRight } from 'lucide-react';
import { 
  subscribeToStudentsByTeacher, 
  subscribeToReportsByTeacher 
} from '../../../services/firestoreService';
import { generateStudentEvaluation } from '../../../services/geminiService';
import { calculateSDQProgress, SDQProgressResult, extractClassLevel } from '../../../services/sdqTargets';
import { Student, Report } from '../../../types';

interface GuruDashboardProps {
  teacherId?: string;
}

interface StudentWithProgress extends Student {
  progressStats: SDQProgressResult;
}

/**
 * 3D Pixar-style Circular Progress Component V2
 * Enhanced with SVG Gradients and Glossy finish.
 */
const PixarCircularGauge = ({ percentage }: { percentage: number }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (safePercentage / 100) * circumference;

  // Determine gradient ID based on percentage
  const gradientId = percentage >= 100 ? "grad-success" : percentage >= 80 ? "grad-primary" : percentage >= 50 ? "grad-warn" : "grad-danger";

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 drop-shadow-md">
      {/* 3D Plastic Base with Inner Shadow */}
      <div className="absolute inset-0 rounded-full bg-white shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)] border-4 border-gray-50"></div>
      
      {/* Progress Ring */}
      <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90 relative z-10">
        <defs>
          <linearGradient id="grad-success" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="grad-warn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="grad-danger" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#f3f4f6"
          strokeWidth="7"
          fill="transparent"
        />
        {/* Progress Value */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="7"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Glossy Center Text */}
      <div className="absolute inset-[10px] rounded-full bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center z-20 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-white">
        <span className="text-[14px] sm:text-[16px] font-black text-gray-800 leading-none">
          {safePercentage}<span className="text-[8px] sm:text-[9px] text-gray-400">%</span>
        </span>
      </div>
    </div>
  );
};

/**
 * 3D Pixar-style Linear Progress Bar Component
 */
const PixarLinearBar = ({ percentage, colorClass }: { percentage: number, colorClass: string }) => {
  // Convert generic color class to specific hex/gradient approximation for inline style if needed, 
  // currently using the class provided by service but wrapping in 3D container.
  
  return (
    <div className="w-full h-4 sm:h-5 bg-gray-100 rounded-full p-[3px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 relative shadow-sm ${colorClass}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      >
        {/* Glossy Highlights */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/30 rounded-t-full"></div>
      </div>
    </div>
  );
};

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
    return () => {
      unsubStudents();
      unsubReports();
    };
  }, [teacherId]);

  const studentsWithProgress = useMemo(() => {
    return rawStudents.map(student => {
      const studentReports = rawReports.filter(r => r.studentId === student.id);
      studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const latestReport = studentReports[0];

      // Deteksi Level Kelas
      const level = extractClassLevel(student.className);
      
      // Tentukan sumber data progress string (string "Iqra' 1: 5...")
      let progressString = student.currentProgress || "-";
      
      if (latestReport) {
        if (level === 1) {
          // Untuk Kelas 1, prioritas ambil dari Tilawah (karena Iqra biasanya diinput di tilawah)
          // Jika tilawah kosong, cek tahfizh, lalu fallback ke student master
          progressString = latestReport.tilawah?.individual || latestReport.tahfizh?.individual || progressString;
        } else {
          // Untuk Kelas > 1, prioritas Tahfizh (Juz/Surah)
          progressString = latestReport.tahfizh?.individual || progressString;
        }
      }

      const effectiveData = {
        ...student,
        // Pastikan totalHafalan diambil dari laporan terbaru jika ada
        totalHafalan: latestReport?.totalHafalan || student.totalHafalan || { juz: 0, pages: 0, lines: 0 },
        // Kirim string yang sudah dipilih ke kalkulator
        currentProgress: progressString
      };

      return {
        ...student,
        progressStats: calculateSDQProgress(effectiveData)
      };
    }).sort((a, b) => b.progressStats.percentage - a.progressStats.percentage); // Sort by highest progress
  }, [rawStudents, rawReports]);

  const metrics = useMemo(() => {
    const total = studentsWithProgress.length;
    const completed = studentsWithProgress.filter(s => s.progressStats.percentage >= 100).length;
    const onTrack = studentsWithProgress.filter(s => s.progressStats.percentage >= 80 && s.progressStats.percentage < 100).length;
    const needsAttention = studentsWithProgress.filter(s => s.progressStats.percentage < 50).length;
    return { total, completed, onTrack, needsAttention };
  }, [studentsWithProgress]);

  const handleGenerateEvaluation = async (student: Student) => {
    setIsGenerating(true);
    try {
      const result = await generateStudentEvaluation(student);
      setAiEvaluation(result);
    } catch (e) {
      alert("Gagal generate evaluasi AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 px-2 sm:px-0">
      <div className="flex justify-between items-center mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Dashboard Halaqah</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Pantau target siswa Anda.</p>
        </div>
      </div>

      {/* Summary Cards with Gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Siswa - Purple Gradient */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 sm:p-6 rounded-2xl shadow-lg shadow-indigo-500/20 text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1 opacity-80 group-hover:opacity-100">Total Siswa</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.total}</p>
        </div>
        
        {/* Tercapai - Emerald Gradient */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-emerald-50 uppercase tracking-widest mb-1 opacity-80 group-hover:opacity-100">Tercapai</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.completed}</p>
        </div>
        
        {/* On Track - Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-blue-50 uppercase tracking-widest mb-1 opacity-80 group-hover:opacity-100">On Track</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.onTrack}</p>
        </div>
        
        {/* Perhatian - Rose Gradient */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-4 sm:p-6 rounded-2xl shadow-lg shadow-rose-500/20 text-white transition-all duration-300 hover:scale-[1.03] active:scale-95 group border border-white/10">
          <p className="text-[9px] sm:text-[10px] font-bold text-orange-50 uppercase tracking-widest mb-1 opacity-80 group-hover:opacity-100">Perhatian</p>
          <p className="text-2xl sm:text-4xl font-black drop-shadow-sm">{metrics.needsAttention}</p>
        </div>
      </div>

      {/* Class Progress Widget Section */}
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
                {/* Responsive Header Container */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* circular progress Pixar Style */}
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

                {/* horizontal linear Pixar Style */}
                <PixarLinearBar 
                  percentage={student.progressStats.percentage} 
                  colorClass={student.progressStats.colorClass} 
                />
                
                {/* Mobile-only Current Achievement Text */}
                <div className="flex justify-between items-center sm:hidden mt-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {student.progressStats.label}
                  </p>
                  <div className="flex items-center gap-1 text-primary-500">
                    <span className="text-[9px] font-black uppercase tracking-widest">Detail</span>
                    <ChevronRight size={12} />
                  </div>
                </div>

                <div className="hidden sm:flex justify-center mt-4">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-500">
                    <Sparkles size={12} className="text-primary-500" />
                    <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest">Evaluasi AI</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada data siswa ditemukan.</div>
          )}
        </div>
      </div>

      {/* AI Evaluation Modal - Responsive sizing */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] max-w-lg w-full p-6 sm:p-10 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
             <div className="flex justify-between items-start mb-6 sm:mb-8">
               <div>
                 <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tighter">Evaluasi Siswa</h3>
                 <p className="text-xs sm:text-sm text-gray-500 font-bold">{selectedStudent.name}</p>
               </div>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl sm:rounded-2xl transition-all">
                  <X size={18} className="text-gray-600 sm:w-5 sm:h-5" />
               </button>
             </div>
             
             {!aiEvaluation ? (
               <div className="text-center pb-8 sm:pb-0">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-50 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 sm:mb-6 text-primary-600 border border-primary-100 shadow-inner">
                    <Sparkles size={32} className="sm:w-10 sm:h-10 animate-pulse" />
                 </div>
                 <p className="text-xs sm:text-sm text-gray-600 mb-8 sm:mb-10 font-medium leading-relaxed px-4">
                   Ingin membuat evaluasi naratif otomatis berdasarkan capaian <span className="font-black text-primary-600">{selectedStudent.progressStats.percentage}%</span> bulan ini?
                 </p>
                 <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating} className="w-full py-4 sm:py-5 rounded-[1rem] sm:rounded-[1.25rem] text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">
                    Buat Evaluasi AI
                 </Button>
               </div>
             ) : (
               <div className="space-y-6 pb-8 sm:pb-0">
                 <div className="bg-gray-50 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[50vh] sm:max-h-[40vh] overflow-y-auto custom-scrollbar font-medium text-gray-700 shadow-inner border border-gray-100">
                   {aiEvaluation}
                 </div>
                 <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs">Ulangi</Button>
                   <Button className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs" onClick={() => setSelectedStudent(null)}>Tutup</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

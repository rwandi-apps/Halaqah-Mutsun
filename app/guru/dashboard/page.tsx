
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, Trophy, X, ChevronRight } from 'lucide-react';
import { 
  subscribeToStudentsByTeacher, 
  subscribeToReportsByTeacher 
} from '../../../services/firestoreService';
import { generateStudentEvaluation } from '../../../services/geminiService';
import { calculateSDQProgress, SDQProgressResult } from '../../../services/sdqTargets';
import { Student, Report } from '../../../types';

interface GuruDashboardProps {
  teacherId?: string;
}

interface StudentWithProgress extends Student {
  progressStats: SDQProgressResult;
}

/**
 * 3D Pixar-style Circular Progress Component
 * Optimized for mobile with consistent sizing.
 */
const PixarCircularGauge = ({ percentage }: { percentage: number }) => {
  const getActiveColor = (p: number) => {
    if (p >= 90) return '#22c55e'; // Green
    if (p >= 75) return '#a3e635'; // Yellow-green
    if (p >= 50) return '#facc15'; // Yellow
    if (p >= 25) return '#f97316'; // Orange
    return '#f87171'; // Soft red
  };

  const activeColor = getActiveColor(percentage);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
      {/* 3D Plastic Base */}
      <div className="absolute inset-0 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.1)] border-2 border-white"></div>
      
      {/* Progress Ring */}
      <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90 relative z-10 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.05)]">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={activeColor}
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Inner Percentage (Plastic Surface) */}
      <div className="absolute inset-[6px] sm:inset-[8px] rounded-full bg-white flex items-center justify-center z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-50">
        <span className="text-[11px] sm:text-[13px] font-black tracking-tighter" style={{ color: activeColor }}>
          {percentage}<span className="text-[7px] sm:text-[8px] ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
};

/**
 * 3D Pixar-style Linear Progress Bar Component
 * Featuring a thicker, more touch-friendly track for mobile.
 */
const PixarLinearBar = ({ percentage }: { percentage: number }) => {
  const getActiveColor = (p: number) => {
    if (p >= 90) return '#22c55e';
    if (p >= 75) return '#a3e635';
    if (p >= 50) return '#facc15';
    if (p >= 25) return '#f97316';
    return '#f87171';
  };

  const activeColor = getActiveColor(percentage);

  return (
    <div className="w-full h-4 sm:h-5 bg-white rounded-full p-[3px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 relative shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: activeColor }}
      >
        {/* Glossy Highlights */}
        <div className="absolute top-[10%] left-[2%] right-[2%] h-[35%] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[0.5px]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-black/10 rounded-b-full"></div>
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

      const effectiveData = {
        ...student,
        totalHafalan: latestReport?.totalHafalan || { juz: 0, pages: 0, lines: 0 },
        currentProgress: latestReport?.tahfizh?.individual?.split(' - ')[1] || "-"
      };

      return {
        ...student,
        progressStats: calculateSDQProgress(effectiveData)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
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
                      <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-base sm:text-lg truncate">
                        {student.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Target: {student.progressStats.target} {student.progressStats.unit}
                        </p>
                        <span className="inline-flex sm:hidden items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[8px] font-black text-gray-500 uppercase">
                          {student.progressStats.statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100">
                      {student.progressStats.statusText}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                      Capai: <span className="text-gray-900">{student.progressStats.current}</span> {student.progressStats.unit}
                    </p>
                  </div>
                </div>

                {/* horizontal linear Pixar Style */}
                <PixarLinearBar percentage={student.progressStats.percentage} />
                
                {/* Mobile-only Current Achievement Text */}
                <div className="flex justify-between items-center sm:hidden mt-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Capaian: <span className="text-gray-900">{student.progressStats.current}</span> {student.progressStats.unit}
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


import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, Trophy } from 'lucide-react';
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
 * Komponen Circular Gauge Premium dengan Efek Glow & Depth
 */
const CircularGauge = ({ percentage, colorClass }: { percentage: number; colorClass: string }) => {
  const getColor = () => {
    if (colorClass.includes('green')) return { hex: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
    if (colorClass.includes('blue')) return { hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
    if (colorClass.includes('orange')) return { hex: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    if (colorClass.includes('red')) return { hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
    return { hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' };
  };

  const { hex, glow } = getColor();
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      {/* Background Outer Ring with Depth */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2a2a2a] to-[#121212] shadow-[4px_4px_10px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.05)] border border-[#333]"></div>
      
      {/* SVG Progress with Neon Glow */}
      <svg className="w-16 h-16 transform -rotate-90 relative z-10 drop-shadow-[0_0_5px_var(--glow-color)]" style={{ '--glow-color': glow } as any}>
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#1a1a1a"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke={hex}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Inner Face - Glassmorphism */}
      <div className="absolute inset-[6px] rounded-full bg-gradient-to-tr from-[#1a1a1a] to-[#252525] flex flex-col items-center justify-center z-20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] border border-[#333]/50">
        <span className="text-[12px] font-black tracking-tighter" style={{ color: hex }}>
          {percentage}<span className="text-[7px] ml-0.5 opacity-80">%</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Komponen Glossy Progress Bar Hyper-Realistic
 */
const GlossyProgressBar = ({ percentage, colorClass }: { percentage: number; colorClass: string }) => {
  return (
    <div className="w-full h-5 bg-[#121212] rounded-full p-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] border border-[#2a2a2a] overflow-hidden relative">
      <div 
        className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${colorClass} shadow-[0_0_15px_rgba(0,0,0,0.3)]`} 
        style={{ width: `${Math.min(percentage, 100)}%` }}
      >
        {/* Main Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20"></div>
        
        {/* Center Light Streak */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        {/* Animated Shine Effect */}
        <div className="absolute inset-0 animate-shimmer pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent w-[50%] -skew-x-12"></div>
        
        {/* Micro Texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:4px_4px]"></div>
      </div>
      
      {/* Styles for the shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite ease-in-out;
        }
      `}</style>
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Halaqah</h2>
          <p className="text-gray-500 mt-1">Kelola halaqah dan pantau perkembangan siswa Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Siswa</p>
          <p className="text-3xl font-bold text-gray-800">{metrics.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-green-500 uppercase tracking-wider">Target Tercapai</p>
          <p className="text-3xl font-bold text-green-600">{metrics.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">On Track</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.onTrack}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Perlu Perhatian</p>
          <p className="text-3xl font-bold text-red-500">{metrics.needsAttention}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800">Capaian Target Kelas</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {studentsWithProgress.length > 0 ? (
            studentsWithProgress.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="group cursor-pointer bg-white hover:bg-gray-50 p-5 rounded-3xl transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-6">
                    <CircularGauge 
                      percentage={student.progressStats.percentage} 
                      colorClass={student.progressStats.colorClass} 
                    />
                    
                    <div>
                      <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-lg">{student.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                          Target: {student.progressStats.target} {student.progressStats.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border-2 shadow-sm ${
                      student.progressStats.percentage >= 100 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : student.progressStats.percentage >= 80 
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : student.progressStats.percentage >= 50
                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {student.progressStats.statusText}
                    </span>
                    <p className="text-[11px] font-bold text-gray-500 mt-2 uppercase tracking-widest">
                      Capaian: <span className="text-gray-900">{student.progressStats.current}</span> {student.progressStats.unit}
                    </p>
                  </div>
                </div>

                <GlossyProgressBar 
                  percentage={student.progressStats.percentage} 
                  colorClass={student.progressStats.colorClass} 
                />
                
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-500">
                    <Sparkles size={12} className="text-primary-600 animate-pulse" />
                    <span className="text-[10px] text-primary-600 font-black uppercase tracking-widest">Detail Evaluasi AI</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">Belum ada data siswa untuk ID guru ini.</div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-10 shadow-2xl animate-in zoom-in duration-300 border border-white/20">
             <div className="flex justify-between items-start mb-10">
               <div>
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Evaluasi Perkembangan</h3>
                 <p className="text-sm text-gray-500 font-bold mt-1">{selectedStudent.name}</p>
               </div>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all active:scale-90">
                  <X size={20} className="text-gray-600" />
               </button>
             </div>
             
             {!aiEvaluation ? (
               <div className="text-center">
                 <div className="w-24 h-24 bg-primary-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-primary-600 shadow-inner border border-primary-100">
                    <Sparkles size={48} className="animate-pulse" />
                 </div>
                 <p className="text-gray-600 mb-10 font-medium leading-relaxed px-4">
                   Kecerdasan Buatan akan menganalisis data capaian <span className="font-black text-primary-600">{selectedStudent.progressStats.percentage}%</span> santri untuk memberikan saran bimbingan yang tepat.
                 </p>
                 <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating} className="w-full py-5 text-base rounded-3xl shadow-xl shadow-primary-500/20 font-black tracking-widest uppercase">
                    Mulai Analisis AI
                 </Button>
               </div>
             ) : (
               <div className="space-y-8">
                 <div className="bg-gray-50 p-8 rounded-[2rem] text-sm whitespace-pre-wrap leading-loose max-h-[45vh] overflow-y-auto custom-scrollbar font-medium text-gray-700 shadow-inner border border-gray-100">
                   {aiEvaluation}
                 </div>
                 <div className="flex gap-4">
                   <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="flex-1 py-4 rounded-2xl font-bold">Ulangi</Button>
                   <Button className="flex-1 py-4 rounded-2xl font-bold" onClick={() => setSelectedStudent(null)}>Selesai</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

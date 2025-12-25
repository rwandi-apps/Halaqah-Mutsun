
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
 * Komponen Circular Gauge seperti Screenshot 1
 */
const CircularGauge = ({ percentage, colorClass }: { percentage: number; colorClass: string }) => {
  // Mapping tailwind color classes to actual hex/rgb for the gauge
  const getColor = () => {
    if (colorClass.includes('green')) return '#22c55e';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('red')) return '#ef4444';
    return '#6366f1';
  };

  const color = getColor();
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      {/* Background Circle / Outer Ring */}
      <div className="absolute inset-0 rounded-full bg-[#1a1a1a] shadow-inner"></div>
      
      {/* SVG Gauge */}
      <svg className="w-14 h-14 transform -rotate-90 relative z-10">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="#333"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Inner Circle Content */}
      <div className="absolute inset-2 rounded-full bg-[#2a2a2a] flex flex-col items-center justify-center z-20 shadow-lg border border-[#333]">
        <span className="text-[11px] font-black leading-none" style={{ color }}>
          {percentage}<span className="text-[7px] ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Komponen Glossy Progress Bar seperti Screenshot 2
 */
const GlossyProgressBar = ({ percentage, colorClass }: { percentage: number; colorClass: string }) => {
  return (
    <div className="w-full bg-[#1a1a1a] h-3.5 rounded-full p-[2px] shadow-inner border border-[#333] overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${colorClass}`} 
        style={{ width: `${Math.min(percentage, 100)}%` }}
      >
        {/* Glossy Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/10"></div>
        {/* Top Highlight Shine */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 blur-[1px]"></div>
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
        
        <div className="p-6 space-y-8">
          {studentsWithProgress.length > 0 ? (
            studentsWithProgress.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="group cursor-pointer hover:bg-gray-50/50 p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-5">
                    {/* Gauge Tampilan Baru */}
                    <CircularGauge 
                      percentage={student.progressStats.percentage} 
                      colorClass={student.progressStats.colorClass} 
                    />
                    
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{student.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Target: {student.progressStats.target} {student.progressStats.unit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${
                      student.progressStats.percentage >= 100 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {student.progressStats.statusText}
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">
                      Capaian: {student.progressStats.current} {student.progressStats.unit}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Tampilan Baru (Glossy) */}
                <GlossyProgressBar 
                  percentage={student.progressStats.percentage} 
                  colorClass={student.progressStats.colorClass} 
                />
                
                <p className="text-[9px] text-primary-500 font-bold uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 text-center">
                  Klik untuk evaluasi AI <Sparkles size={10} className="inline ml-1"/>
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">Belum ada data siswa untuk ID guru ini.</div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Evaluasi Santri</h3>
                 <p className="text-sm text-gray-500 font-medium">{selectedStudent.name}</p>
               </div>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} className="text-gray-500" />
               </button>
             </div>
             
             {!aiEvaluation ? (
               <div className="text-center py-6">
                 <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary-600 shadow-sm border border-primary-100">
                    <Sparkles size={40} />
                 </div>
                 <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                   Generate narasi evaluasi perkembangan santri berbasis data capaian <span className="font-bold text-primary-600">{selectedStudent.progressStats.percentage}%</span> bulan ini.
                 </p>
                 <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating} className="w-full py-4 text-base rounded-2xl">
                    Generate Evaluasi Sekarang
                 </Button>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto custom-scrollbar font-medium text-gray-700 shadow-inner">
                   {aiEvaluation}
                 </div>
                 <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="flex-1 py-4 rounded-2xl">Ulangi</Button>
                   <Button className="flex-1 py-4 rounded-2xl" onClick={() => setSelectedStudent(null)}>Tutup</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

// Global X variable was not defined in the scope, adding it for the close button
function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

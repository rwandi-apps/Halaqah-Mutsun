
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, Trophy, X } from 'lucide-react';
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
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      {/* 3D Plastic Base */}
      <div className="absolute inset-0 rounded-full bg-white shadow-[0_6px_12px_rgba(0,0,0,0.1),inset_0_-3px_6px_rgba(0,0,0,0.1)] border-2 border-white"></div>
      
      {/* Progress Ring */}
      <svg className="w-16 h-16 transform -rotate-90 relative z-10 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.1)]">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#f1f5f9"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="32"
          cy="32"
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
      <div className="absolute inset-[8px] rounded-full bg-white flex items-center justify-center z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-gray-50">
        <span className="text-[13px] font-black tracking-tighter" style={{ color: activeColor }}>
          {percentage}<span className="text-[8px] ml-0.5">%</span>
        </span>
      </div>
    </div>
  );
};

/**
 * 3D Pixar-style Linear Progress Bar Component
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
    <div className="w-full h-4 bg-white rounded-full p-[3px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 relative shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: activeColor }}
      >
        {/* Glossy Highlights */}
        <div className="absolute top-[10%] left-[2%] right-[2%] h-[30%] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[0.5px]"></div>
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Halaqah</h2>
          <p className="text-gray-500 mt-1">Pantau perkembangan target santri Anda.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Santri</p>
          <p className="text-3xl font-black text-gray-800">{metrics.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Target Tercapai</p>
          <p className="text-3xl font-black text-green-600">{metrics.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">On Track</p>
          <p className="text-3xl font-black text-blue-600">{metrics.onTrack}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Perlu Perhatian</p>
          <p className="text-3xl font-black text-red-500">{metrics.needsAttention}</p>
        </div>
      </div>

      {/* Class Progress Widget Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800 uppercase tracking-tight">Capaian Target Kelas</h3>
        </div>
        
        <div className="p-8 space-y-6">
          {studentsWithProgress.length > 0 ? (
            studentsWithProgress.map((student) => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="group cursor-pointer bg-white hover:bg-gray-50/50 p-6 rounded-3xl transition-all duration-300 border border-gray-50 hover:border-gray-100 hover:shadow-md"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-6">
                    {/* circular progress Pixar Style */}
                    <PixarCircularGauge percentage={student.progressStats.percentage} />
                    
                    <div>
                      <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-lg">{student.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Target: {student.progressStats.target} {student.progressStats.unit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
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
                
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 duration-500">
                    <Sparkles size={12} className="text-primary-500" />
                    <span className="text-[9px] text-primary-500 font-black uppercase tracking-widest">Evaluasi AI</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">Belum ada data santri ditemukan.</div>
          )}
        </div>
      </div>

      {/* AI Evaluation Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-10 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-8">
               <div>
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Evaluasi Santri</h3>
                 <p className="text-sm text-gray-500 font-bold">{selectedStudent.name}</p>
               </div>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
                  <X size={20} className="text-gray-600" />
               </button>
             </div>
             
             {!aiEvaluation ? (
               <div className="text-center">
                 <div className="w-20 h-20 bg-primary-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-primary-600 border border-primary-100 shadow-inner">
                    <Sparkles size={40} className="animate-pulse" />
                 </div>
                 <p className="text-gray-600 mb-10 font-medium leading-relaxed">
                   Ingin membuat evaluasi naratif otomatis berdasarkan capaian <span className="font-black text-primary-600">{selectedStudent.progressStats.percentage}%</span> bulan ini?
                 </p>
                 <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating} className="w-full py-5 rounded-[1.25rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">
                    Buat Evaluasi AI
                 </Button>
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="bg-gray-50 p-6 rounded-[1.5rem] text-sm whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto custom-scrollbar font-medium text-gray-700 shadow-inner border border-gray-100">
                   {aiEvaluation}
                 </div>
                 <div className="flex gap-3">
                   <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="flex-1 py-4 rounded-2xl font-bold">Ulangi</Button>
                   <Button className="flex-1 py-4 rounded-2xl font-bold" onClick={() => setSelectedStudent(null)}>Tutup</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

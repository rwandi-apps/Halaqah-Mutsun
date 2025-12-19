
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

export default function GuruDashboard({ teacherId }: GuruDashboardProps) {
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawReports, setRawReports] = useState<Report[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProgress | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Gunakan teacherId dari props untuk realtime listener
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
        totalHafalan: latestReport?.totalHafalan || student.totalHafalan || { juz: 0, pages: 0, lines: 0 },
        currentProgress: latestReport?.tahfizh?.individual?.split(' - ')[1] || student.currentProgress
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Halaqah</h2>
          <p className="text-gray-500">ID Guru: <span className="font-mono text-xs">{teacherId}</span></p>
        </div>
        {/* Tombol Input Laporan dihapus sesuai permintaan */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Siswa</p>
          <p className="text-3xl font-bold text-gray-800">{metrics.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-green-500 uppercase">Target Tercapai</p>
          <p className="text-3xl font-bold text-green-600">{metrics.completed}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-blue-500 uppercase">On Track</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.onTrack}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold text-red-500 uppercase">Perlu Perhatian</p>
          <p className="text-3xl font-bold text-red-500">{metrics.needsAttention}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                className="group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${student.progressStats.colorClass}`}>
                      {student.progressStats.percentage}%
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">Target: {student.progressStats.target} {student.progressStats.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${student.progressStats.percentage >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {student.progressStats.statusText}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Capaian: {student.progressStats.current} {student.progressStats.unit}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${student.progressStats.colorClass}`} 
                    style={{ width: `${Math.min(student.progressStats.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">Belum ada data siswa untuk ID guru ini.</div>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-in zoom-in duration-200">
             <div className="flex justify-between items-start mb-6">
               <h3 className="text-xl font-bold">Evaluasi: {selectedStudent.name}</h3>
               <button onClick={() => { setSelectedStudent(null); setAiEvaluation(null); }} className="text-gray-400 hover:text-gray-600">×</button>
             </div>
             
             {!aiEvaluation ? (
               <div className="text-center">
                 <Sparkles size={48} className="mx-auto text-primary-600 mb-4" />
                 <p className="text-gray-600 mb-6">Generate narasi evaluasi perkembangan santri berbasis data capaian {selectedStudent.progressStats.percentage}%.</p>
                 <Button onClick={() => handleGenerateEvaluation(selectedStudent)} isLoading={isGenerating}>Generate Evaluasi</Button>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{aiEvaluation}</div>
                 <Button variant="secondary" onClick={() => setAiEvaluation(null)} className="w-full">Ulangi</Button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

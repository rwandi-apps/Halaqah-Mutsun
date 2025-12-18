import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/Button';
import { Sparkles, CheckCircle, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
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

// Extend type untuk UI
interface StudentWithProgress extends Student {
  progressStats: SDQProgressResult;
}

export default function GuruDashboard({ teacherId = '1' }: GuruDashboardProps) {
  // State terpisah untuk raw data
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawReports, setRawReports] = useState<Report[]>([]);
  
  // State final yang digabung (Derived State)
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProgress | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    onTrack: 0,
    offTrack: 0,
    completed: 0
  });

  // 1. Subscribe to STUDENTS & REPORTS
  useEffect(() => {
    if (!teacherId) return;

    // Listener 1: Data Siswa (Nama, Kelas, dll)
    const unsubStudents = subscribeToStudentsByTeacher(teacherId, (data) => {
      setRawStudents(data);
    });

    // Listener 2: Data Laporan (Sumber kebenaran untuk progress)
    const unsubReports = subscribeToReportsByTeacher(teacherId, (data) => {
      setRawReports(data);
    });

    return () => {
      unsubStudents();
      unsubReports();
    };
  }, [teacherId]);

  // 2. MERGE LOGIC (Recalculate when either Students or Reports change)
  useEffect(() => {
    // Gabungkan data siswa dengan laporan terbarunya
    const processedData = rawStudents.map(student => {
      // Cari laporan milik siswa ini
      const studentReports = rawReports.filter(r => r.studentId === student.id);
      
      // Sort laporan berdasarkan tanggal terbaru (descending)
      studentReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      
      const latestReport = studentReports[0];

      // LOGIKA KUNCI:
      const calculatedTotalHafalan = latestReport?.totalHafalan 
        ? latestReport.totalHafalan 
        : (student.totalHafalan || { juz: 0, pages: 0, lines: 0 });

      // Buat objek siswa "virtual" dengan data hafalan yang sudah di-override
      const studentWithLatestData = {
        ...student,
        totalHafalan: calculatedTotalHafalan,
        currentProgress: latestReport 
          ? (latestReport.tahfizh?.individual?.split(' - ')[1] || latestReport.tahfizh?.individual || student.currentProgress) 
          : student.currentProgress
      };

      const stats = calculateSDQProgress(studentWithLatestData);
      
      return {
        ...student,
        totalHafalan: calculatedTotalHafalan,
        progressStats: stats
      };
    });

    // Sorting: Berdasarkan Kelas (1-6), lalu Nama
    processedData.sort((a, b) => {
      const levelDiff = a.progressStats.classLevel - b.progressStats.classLevel;
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });

    setStudents(processedData);

    // Hitung Metrics
    const total = processedData.length;
    const completed = processedData.filter(s => s.progressStats.percentage >= 100).length;
    const onTrack = processedData.filter(s => s.progressStats.percentage >= 80 && s.progressStats.percentage < 100).length;
    const offTrack = processedData.filter(s => s.progressStats.percentage < 50).length;

    setMetrics({
      totalStudents: total,
      onTrack,
      offTrack,
      completed
    });

  }, [rawStudents, rawReports]);

  const handleGenerateEvaluation = async (student: Student) => {
    setIsGenerating(true);
    setAiEvaluation(null);
    try {
      const result = await generateStudentEvaluation(student);
      setAiEvaluation(result);
    } catch (e) {
      console.error(e);
      alert("Gagal generate evaluasi");
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setAiEvaluation(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ahlan wa Sahlan, Ustadz!</h2>
          <p className="text-gray-500 mt-1">Pantau capaian target kurikulum SDQ siswa Anda.</p>
        </div>
        <Button className="shadow-lg shadow-primary-500/30">
          + Input Laporan
        </Button>
      </div>

      {/* Main Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-gray-100">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Total Siswa</p>
                <p className="text-3xl font-bold text-gray-800">{metrics.totalStudents}</p>
              </div>
              <div>
                <p className="text-green-600 text-xs uppercase tracking-wider font-semibold mb-1">Target Tercapai</p>
                <p className="text-3xl font-bold text-green-600">{metrics.completed}</p>
              </div>
              <div>
                <p className="text-blue-600 text-xs uppercase tracking-wider font-semibold mb-1">Hampir Tercapai</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.onTrack}</p>
              </div>
              <div>
                <p className="text-red-500 text-xs uppercase tracking-wider font-semibold mb-1">Perlu Perhatian</p>
                <p className="text-3xl font-bold text-red-500">{metrics.offTrack}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WIDGET UTAMA: Capaian Total Hafalan */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                Capaian Target Kelas
              </h3>
              <p className="text-xs text-gray-500 mt-1">Berdasarkan standar kurikulum SDQ (Iqra / Juz)</p>
            </div>
            <div className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
              Real-time
            </div>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar">
            {students.length > 0 ? (
              students.map((student) => (
                <div key={student.id} onClick={() => setSelectedStudent(student)} className="cursor-pointer group hover:bg-gray-50 p-3 rounded-lg -mx-3 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      {/* Percent Badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${student.progressStats.colorClass} shadow-sm`}>
                        {student.progressStats.percentage}%
                      </div>
                      
                      {/* Name & Class Logic Display */}
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 group-hover:text-primary-600 transition-colors">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          {/* SHOW THE CALCULATED CLASS LEVEL */}
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium border border-gray-200">
                            Kelas {student.progressStats.classLevel}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-600">
                            Target: <span className="font-bold text-gray-800">{student.progressStats.target} {student.progressStats.unit}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Detail Badge */}
                    <div className="text-right">
                       <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                         student.progressStats.percentage >= 100 ? 'bg-green-100 text-green-700' :
                         student.progressStats.percentage >= 80 ? 'bg-blue-100 text-blue-700' :
                         student.progressStats.percentage >= 50 ? 'bg-orange-100 text-orange-700' :
                         'bg-red-100 text-red-700'
                       }`}>
                         {student.progressStats.statusText}
                       </span>
                       <div className="text-[10px] text-gray-500 mt-1">
                         {student.progressStats.current} / {student.progressStats.target} {student.progressStats.unit}
                       </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2 relative">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${student.progressStats.colorClass}`} 
                      style={{ width: `${Math.min(student.progressStats.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                      {student.currentProgress && student.currentProgress !== '-' ? `Posisi: ${student.currentProgress}` : 'Belum ada data posisi'}
                    </p>
                    <p className="text-[10px] text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Sparkles size={10} /> Klik untuk evaluasi AI
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">Belum ada data siswa.</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Widget: Legend & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Keterangan Warna</h3>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-sm text-gray-600">100% (Target Tercapai)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-sm text-gray-600">80-99% (Hampir Tercapai)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                 <span className="text-sm text-gray-600">50-79% (Perlu Dorongan)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <span className="text-sm text-gray-600">0-49% (Tertinggal)</span>
               </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
               <h4 className="font-bold text-gray-800 mb-2 text-sm">Target Resmi SDQ</h4>
               <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                 <li><span className="font-bold text-gray-700">Kelas 1:</span> Iqra 6 Jilid (Smt 1)</li>
                 <li><span className="font-bold text-gray-700">Kelas 2:</span> 1 Juz</li>
                 <li><span className="font-bold text-gray-700">Kelas 3:</span> 3 Juz</li>
                 <li><span className="font-bold text-gray-700">Kelas 4:</span> 4 Juz</li>
                 <li><span className="font-bold text-gray-700">Kelas 5-6:</span> 5 Juz</li>
               </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Evaluasi Siswa</h3>
                <p className="text-sm text-gray-500">{selectedStudent.name} - Kelas {selectedStudent.progressStats.classLevel}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                 <h4 className="font-bold text-blue-800 mb-2 text-sm">Status Target Kurikulum</h4>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">Target: {selectedStudent.progressStats.target} {selectedStudent.progressStats.unit}</span>
                    <span className="font-bold text-blue-900">{selectedStudent.progressStats.percentage}% ({selectedStudent.progressStats.statusText})</span>
                 </div>
                 <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className={`h-2 rounded-full ${selectedStudent.progressStats.colorClass}`} style={{ width: `${Math.min(selectedStudent.progressStats.percentage, 100)}%` }}></div>
                 </div>
              </div>

              {!aiEvaluation ? (
                <div className="text-center py-8">
                  <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Generate Evaluasi Naratif</h4>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
                    AI akan membuat deskripsi evaluasi berdasarkan capaian {selectedStudent.progressStats.percentage}% dan perilaku siswa.
                  </p>
                  <Button 
                    onClick={() => handleGenerateEvaluation(selectedStudent)} 
                    isLoading={isGenerating}
                    className="px-8"
                  >
                    Buat Evaluasi
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm">
                      {aiEvaluation}
                    </pre>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setAiEvaluation(null)}>
                      Ulangi
                    </Button>
                    <Button onClick={() => alert("Fitur simpan PDF akan segera hadir!")}>
                      Simpan Laporan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
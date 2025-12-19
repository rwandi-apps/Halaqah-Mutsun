
import React, { useEffect, useState } from 'react';
import { Button } from '../components/UIComponents';
import { Sparkles, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getStudentsByTeacher } from '../services/firestoreService';
import { generateStudentEvaluation } from '../services/geminiService';
import { Student } from '../types';

interface GuruDashboardProps {
  teacherId?: string;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({ teacherId = '1' }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getStudentsByTeacher(teacherId).then(setStudents);
  }, [teacherId]);

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
          <p className="text-gray-500 mt-1">Kelola halaqah dan pantau perkembangan siswa Anda.</p>
        </div>
        {/* Tombol Input Laporan dihapus */}
      </div>

      {/* Main Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col justify-center items-center text-center">
           <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-6">Rangkuman Capaian Hafalan Bulan Ini</h3>
           
           <div className="mb-2">
             <span className="text-green-600 font-bold text-lg mb-1 block">Melebihi Target</span>
             <span className="text-6xl font-bold text-[#0e7490]">2</span>
           </div>
           <p className="text-gray-500">Siswa</p>
        </div>

        {/* Right: Breakdown List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col justify-center">
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700 font-medium">Mencapai Target</span>
                </div>
                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm">1 orang</span>
             </div>
             
             <div className="h-px bg-gray-100 w-full"></div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-500" size={24} />
                  <span className="text-gray-700 font-medium">Belum Mencapai Target</span>
                </div>
                <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full text-sm">1 orang</span>
             </div>

             <div className="h-px bg-gray-100 w-full"></div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-[#0e7490]" size={24} />
                  <span className="text-gray-700 font-medium">Murojaah</span>
                </div>
                <span className="text-[#0e7490] font-bold bg-cyan-50 px-3 py-1 rounded-full text-sm">1 orang</span>
             </div>
           </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Bars */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Capaian Total Hafalan Berdasarkan Target Kelas</h3>
          <div className="space-y-6">
            {students.slice(0, 3).map((student, idx) => (
              <div key={student.id} onClick={() => setSelectedStudent(student)} className="cursor-pointer group">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">{student.name}</h4>
                    <p className="text-xs text-gray-500">({student.memorizationTarget})</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {idx === 0 ? '100%' : idx === 1 ? '100%' : '80%'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${idx === 2 ? 'bg-yellow-400' : 'bg-green-500'}`} 
                    style={{ width: idx === 2 ? '80%' : '100%' }}
                  ></div>
                </div>
                <p className="text-xs text-primary-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Klik untuk evaluasi AI <Sparkles size={12} className="inline"/>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="mb-4">
             <h3 className="font-bold text-gray-800">Tren Sabaq Per Siswa (Halaman)</h3>
             <p className="text-xs text-gray-500">Arahkan kursor ke nama siswa untuk melihat detail.</p>
          </div>
          <div className="flex-1 flex items-end justify-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200 relative overflow-hidden">
             {/* Mock Area Chart */}
             <svg viewBox="0 0 400 200" className="w-full h-full text-[#0e7490] opacity-20" preserveAspectRatio="none">
               <path d="M0,200 L0,150 C50,130 100,160 150,140 C200,120 250,130 300,100 C350,70 400,90 400,50 L400,200 Z" fill="currentColor" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-gray-400 text-sm font-medium">Chart Visualization Placeholder</span>
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
                <h3 className="text-xl font-bold text-gray-900">Evaluasi Santri</h3>
                <p className="text-sm text-gray-500">{selectedStudent.name} - Kelas {selectedStudent.className}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!aiEvaluation ? (
                <div className="text-center py-12">
                  <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Generate Evaluasi dengan AI</h4>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Gemini akan menganalisis data hafalan, kehadiran, and perilaku santri untuk membuat laporan naratif yang personal.
                  </p>
                  <Button 
                    onClick={() => handleGenerateEvaluation(selectedStudent)} 
                    isLoading={isGenerating}
                    className="px-8"
                  >
                    Mulai Generate
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3">
                    <div className="shrink-0 text-green-600 mt-1">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-800">Evaluasi Berhasil Dibuat</h5>
                      <p className="text-sm text-green-700">Silakan review hasil evaluasi di bawah ini sebelum disimpan atau dibagikan.</p>
                    </div>
                  </div>
                  
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
};

export default GuruDashboard;

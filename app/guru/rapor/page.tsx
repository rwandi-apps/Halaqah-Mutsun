
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, getSemesterReport, deleteSemesterReport } from '../../../services/firestoreService';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { FileText, Printer, ArrowLeft, Search, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';

export default function GuruRaporPage({ teacherId, teacherName }: { teacherId?: string, teacherName?: string }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [viewingReport, setViewingReport] = useState<SemesterReport | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Tahun ajaran default untuk pencarian rapor
  const DEFAULT_YEAR = '2025 / 2026';

  useEffect(() => {
    if (teacherId) {
      getStudentsByTeacher(teacherId).then(data => {
        setStudents(data);
        setFilteredStudents(data);
      });
    }
  }, [teacherId]);

  useEffect(() => {
    setFilteredStudents(students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, students]);

  const handleViewReport = async (student: Student, index: number) => {
    setIsLoading(true);
    const report = await getSemesterReport(student.id, DEFAULT_YEAR, 'Ganjil');
    if (report) {
      setViewingReport(report);
      setSelectedStudent(student);
      setCurrentIndex(index);
    } else {
      alert(`Data rapor belum diinput untuk ${student.name} pada tahun ajaran ${DEFAULT_YEAR}.`);
    }
    setIsLoading(false);
  };

  const handleEditReport = (student: Student) => {
    navigate('/guru/grades', { state: { studentId: student.id } });
  };

  const handleDeleteReport = async (student: Student) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus rapor ${student.name}?`)) return;
    setIsLoading(true);
    try {
      await deleteSemesterReport(student.id, DEFAULT_YEAR, 'Ganjil');
      alert("Rapor berhasil dihapus.");
      setViewingReport(null);
      setSelectedStudent(null);
    } catch (e) {
      alert("Gagal menghapus rapor.");
    } finally {
      setIsLoading(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredStudents.length - 1) {
      const nextIdx = currentIndex + 1;
      handleViewReport(filteredStudents[nextIdx], nextIdx);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      handleViewReport(filteredStudents[prevIdx], prevIdx);
    }
  };

  const getPredikatLetter = (letter: string) => {
    if (letter === 'A') return 'Mumtaz';
    if (letter === 'B') return 'Jayyid Jiddan';
    if (letter === 'C') return 'Jayyid';
    return '-';
  };

  const getPredikatScore = (score: number) => {
    if (score === 100) return "Mumtaz Murtafi'";
    if (score >= 90) return "Mumtaz";
    if (score >= 80) return "Jayyid Jiddan";
    if (score >= 70) return "Jayyid";
    if (score >= 60) return "Maqbul";
    return "Rosib";
  };

  /**
   * Cleans teacher name from titles like Ust., Ustadz, etc.
   */
  const cleanTeacherName = (name: string = '') => {
    return name.replace(/^(Ust\.|Ustadz|Ustadzah|Uzh\.|Ust)\s+/i, '').trim();
  };

  // Logic to determine format
  const level = selectedStudent ? extractClassLevel(selectedStudent.className) : 0;
  const isDescriptionFormat = level >= 1 && level <= 3;

  if (viewingReport && selectedStudent) {
    const signatureName = cleanTeacherName(teacherName);

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20 print:p-0 print:m-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
           <button onClick={() => { setViewingReport(null); setSelectedStudent(null); }} className="flex items-center text-gray-500 hover:text-primary-600 font-bold">
             <ArrowLeft size={20} className="mr-2"/> Kembali
           </button>

           <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
              <button onClick={goToPrev} disabled={currentIndex === 0} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div className="px-4 text-sm font-bold text-gray-700 border-x">
                {selectedStudent.name} ({currentIndex + 1}/{filteredStudents.length})
              </div>
              <button onClick={goToNext} disabled={currentIndex === filteredStudents.length - 1} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors">
                <ChevronRight size={24} />
              </button>
           </div>

           <div className="flex gap-2">
             <Button variant="outline" onClick={() => handleEditReport(selectedStudent)} className="text-blue-600"><Edit2 size={16}/></Button>
             <Button variant="danger" onClick={() => handleDeleteReport(selectedStudent)}><Trash2 size={16}/></Button>
             <Button onClick={() => window.print()} className="bg-emerald-600"><Printer size={18} className="mr-2"/> Cetak</Button>
           </div>
        </div>

        {/* --- PDF CONTENT (A4 Optimized) --- */}
        <div className="bg-white p-12 sm:p-16 shadow-2xl border border-gray-100 mx-auto w-full max-w-[210mm] print:shadow-none print:border-none print:p-0 print:mx-0 min-h-[297mm] font-serif text-gray-900 overflow-hidden">
           
           {isDescriptionFormat ? (
             /* FORMAT DESKRIPSI (KELAS 1-3) */
             <div className="space-y-6">
                <div className="text-center space-y-1 mb-10">
                   <h1 className="text-xl font-bold uppercase tracking-widest">Laporan Perkembangan Belajar</h1>
                   <h2 className="text-2xl font-black uppercase">SDQ Mutiara Sunnah</h2>
                   <h3 className="text-lg font-bold uppercase pt-1">Tahun Pelajaran {viewingReport.academicYear.replace(/\s/g, '')}</h3>
                </div>

                {/* Header Information: Stacked Vertically for Class 1-3 as requested */}
                <div className="space-y-1 text-sm font-bold mb-8">
                   <div className="flex"><span className="w-32">Nama Siswa</span><span className="mr-2">:</span><span className="uppercase">{selectedStudent.name}</span></div>
                   <div className="flex"><span className="w-32">Kelas</span><span className="mr-2">:</span><span className="uppercase">{selectedStudent.className}</span></div>
                   <div className="flex"><span className="w-32">Semester</span><span className="mr-2">:</span><span>{viewingReport.semester}</span></div>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="font-bold mb-2 uppercase">A. Tahfizh</h4>
                      <div className="border-2 border-gray-900 p-6 min-h-[220px] text-sm leading-relaxed text-justify">
                         {viewingReport.narrativeTahfizh}
                      </div>
                   </div>

                   <div>
                      <h4 className="font-bold mb-2 uppercase">B. Tilawah</h4>
                      <div className="border-2 border-gray-900 p-6 min-h-[220px] text-sm leading-relaxed text-justify">
                         {viewingReport.narrativeTilawah}
                      </div>
                   </div>
                </div>

                <div className="mt-10 text-sm font-bold">
                   <div className="text-right mb-16">
                      Bogor, {viewingReport.dateHijri || '... Hijriah'}<br/>
                      {viewingReport.dateStr || '... Masehi'}
                   </div>
                   <div className="grid grid-cols-2 text-center">
                      <div>
                         <p className="mb-24">Orang Tua/Wali</p>
                         <p className="border-b border-gray-900 inline-block w-48"></p>
                      </div>
                      <div>
                         <p className="mb-24">Pengampu Al Qur'an</p>
                         <p className="font-bold border-b border-gray-900 inline-block w-48 uppercase">{signatureName}</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             /* FORMAT TABEL (KELAS 4-6) */
             <div className="space-y-6">
                <div className="text-center space-y-1 mb-10">
                   <h1 className="text-xl font-bold uppercase tracking-widest">Laporan Penilaian Al-Quran</h1>
                   <h2 className="text-2xl font-black uppercase">SDQ Mutiara Sunnah</h2>
                   <h3 className="text-lg font-bold uppercase pt-1">Tahun Pelajaran {viewingReport.academicYear.replace(/\s/g, '')}</h3>
                </div>

                {/* Header Information: 4-6 Parallel layout kept as original, fixed NISN row alignment */}
                <div className="grid grid-cols-2 gap-x-8 mb-8 text-[13px] font-bold text-gray-800">
                   <div className="space-y-1">
                      <div className="flex"><span className="w-32">Nama Siswa</span><span className="mr-2">:</span><span className="uppercase">{selectedStudent.name}</span></div>
                      {/* NISN Sejajar (one line, no cut) */}
                      <div className="flex whitespace-nowrap"><span className="w-32 shrink-0">Nomor Induk / NISN</span><span className="mr-2">:</span><span>{selectedStudent.nis || '-'} / {selectedStudent.nisn || '-'}</span></div>
                      <div className="flex"><span className="w-32">Target Hafalan</span><span className="mr-2">:</span><span>{viewingReport.targetHafalan}</span></div>
                   </div>
                   <div className="space-y-1">
                      <div className="flex"><span className="w-32">Kelas</span><span className="mr-2">:</span><span className="uppercase">{selectedStudent.className}</span></div>
                      <div className="flex"><span className="w-32">Semester</span><span className="mr-2">:</span><span>{viewingReport.semester}</span></div>
                      <div className="flex"><span className="w-32">Tahun Ajaran</span><span className="mr-2">:</span><span>{viewingReport.academicYear}</span></div>
                   </div>
                </div>

                <table className="w-full border-2 border-gray-900 text-center text-[13px] font-bold">
                   <thead className="bg-gray-100"><tr className="border-b-2 border-gray-900"><th className="py-2 w-12 border-r-2 border-gray-900">No</th><th className="py-2 border-r-2 border-gray-900 px-4 text-left">Aspek Penilaian</th><th className="py-2 w-40 border-r-2 border-gray-900">Prestasi</th><th className="py-2 w-40">Predikat</th></tr></thead>
                   <tbody>
                      {[
                         { id: 1, label: 'Adab di Halaqah', val: viewingReport.assessments.adab },
                         { id: 2, label: 'Muroja\'ah', val: viewingReport.assessments.murojaah },
                         { id: 3, label: 'Tajwid', val: viewingReport.assessments.tajwid },
                         { id: 4, label: 'Makharijul Huruf', val: viewingReport.assessments.makharij },
                         { id: 5, label: 'Pencapaian Target Hafalan', val: viewingReport.assessments.pencapaianTarget + '%' },
                      ].map((item, idx) => (
                         <tr key={idx} className="border-b border-gray-900"><td className="py-2 border-r-2 border-gray-900">{item.id}</td><td className="py-2 border-r-2 border-gray-900 px-4 text-left">{item.label}</td><td className="py-2 border-r-2 border-gray-900">{item.val}</td><td className="py-2">{typeof item.val === 'string' && item.val.includes('%') ? (parseInt(item.val) >= 100 ? 'Mumtaz' : 'Hampir Tuntas') : getPredikatLetter(item.val as string)}</td></tr>
                      ))}
                   </tbody>
                </table>

                <table className="w-full border-2 border-gray-900 text-center text-[13px] font-bold">
                   <thead className="bg-gray-100"><tr className="border-b-2 border-gray-900"><th className="py-2 w-12 border-r-2 border-gray-900">No</th><th className="py-2 border-r-2 border-gray-900 px-4 text-left">Ujian-ujian</th><th className="py-2 w-40 border-r-2 border-gray-900">Angka</th><th className="py-2 w-40">Predikat</th></tr></thead>
                   <tbody>
                      <tr className="border-b border-gray-900"><td className="py-2 border-r-2 border-gray-900">1</td><td className="py-2 border-r-2 border-gray-900 px-4 text-left">UTS</td><td className="py-2 border-r-2 border-gray-900">{viewingReport.exams.uts}</td><td className="py-2">{getPredikatScore(viewingReport.exams.uts)}</td></tr>
                      <tr className="border-b-2 border-gray-900"><td className="py-2 border-r-2 border-gray-900">2</td><td className="py-2 border-r-2 border-gray-900 px-4 text-left">UAS</td><td className="py-2 border-r-2 border-gray-900">{viewingReport.exams.uas}</td><td className="py-2">{getPredikatScore(viewingReport.exams.uas)}</td></tr>
                   </tbody>
                </table>

                <div className="border-2 border-gray-900 p-4">
                  <h4 className="text-xs font-bold uppercase mb-2">Status Hafalan Siswa</h4>
                  <div className="grid grid-cols-1 gap-1 text-[12px]">
                    <div className="flex"><span className="w-32">Dimiliki</span><span className="mr-2">:</span><span>{viewingReport.statusHafalan.dimiliki.jumlah} {viewingReport.statusHafalan.dimiliki.rincian}</span></div>
                    <div className="flex"><span className="w-32">Mutqin</span><span className="mr-2">:</span><span>{viewingReport.statusHafalan.mutqin.jumlah} {viewingReport.statusHafalan.mutqin.rincian}</span></div>
                    <div className="flex"><span className="w-32">Semester Ini</span><span className="mr-2">:</span><span>{viewingReport.statusHafalan.semesterIni.jumlah} {viewingReport.statusHafalan.semesterIni.rincian}</span></div>
                  </div>
                </div>

                <div className="mt-10 text-sm font-bold">
                   <div className="text-right mb-16">Bogor, {viewingReport.dateHijri}<br/>{viewingReport.dateStr}</div>
                   <div className="grid grid-cols-2 text-center">
                      <div><p className="mb-20">Orang Tua/Wali</p><p className="border-b border-gray-900 inline-block w-48"></p></div>
                      <div><p className="mb-20">Wali Kelas</p><p className="font-bold border-b border-gray-900 inline-block w-48 uppercase">{signatureName}</p></div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Rapor</h2>
          <p className="text-gray-500 mt-1">Format deskripsi untuk kelas 1-3 dan format tabel untuk kelas 4-6.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none bg-transparent text-sm"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student, index) => (
          <div key={student.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg">{student.name.charAt(0)}</div>
               <div>
                  <h3 className="font-bold text-gray-900">{student.name}</h3>
                  <p className="text-xs text-gray-500">{student.className}</p>
               </div>
            </div>
            <div className="flex gap-2">
               <Button onClick={() => handleViewReport(student, index)} variant="secondary" className="flex-1 text-xs uppercase tracking-widest font-bold">
                 <FileText size={16} className="mr-1"/> Lihat Rapor
               </Button>
               <button onClick={() => handleEditReport(student)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-100"><Edit2 size={16} /></button>
               <button onClick={() => handleDeleteReport(student)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-100"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

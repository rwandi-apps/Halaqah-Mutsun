
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, getSemesterReport, deleteSemesterReport } from '../../../services/firestoreService';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { FileText, Printer, ArrowLeft, Search, ChevronLeft, ChevronRight, Edit2, Trash2, CalendarDays } from 'lucide-react';

interface GuruRaporProps {
  teacherId?: string;
  teacherName?: string;
}

const GuruRaporPage: React.FC<GuruRaporProps> = ({ teacherId, teacherName }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  
  // STATE: Pilihan Semester
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  
  const [viewingReport, setViewingReport] = useState<SemesterReport | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const DEFAULT_YEAR = '2025 / 2026';

  // HELPER: Sanitasi Tahun
  const getCleanYear = (year: string) => year.replace(/[\s/]/g, '');

  // HELPER: Mengubah Teks menjadi Title Case (Huruf Besar di Awal Kata)
  const toTitleCase = (str: string = '') => {
    return str
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
    const cleanYear = getCleanYear(DEFAULT_YEAR);
    const report = await getSemesterReport(student.id, cleanYear, selectedSemester);
    
    if (report) {
      setViewingReport(report);
      setSelectedStudent(student);
      setCurrentIndex(index);
    } else {
      alert(`Data rapor ${selectedSemester} belum diinput untuk ${student.name} pada tahun ajaran ${DEFAULT_YEAR}.`);
    }
    setIsLoading(false);
  };

  const handleEditReport = (student: Student) => {
    navigate('/guru/grades', { state: { studentId: student.id, semester: selectedSemester } });
  };

  const handleDeleteReport = async (student: Student) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus rapor ${selectedSemester} ${student.name}?`)) return;
    
    setIsLoading(true);
    try {
      const cleanYear = getCleanYear(DEFAULT_YEAR);
      await deleteSemesterReport(student.id, cleanYear, selectedSemester);
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

  const cleanTeacherName = (name: string = '') => {
    return name.replace(/^(Ust\.|Ustadz|Ustadzah|Uzh\.|Ust)\s+/i, '').trim();
  };

  const level = selectedStudent ? extractClassLevel(selectedStudent.className) : 0;
  const isDescriptionFormat = level >= 1 && level <= 3;

  // VIEW MODE: Rapor Detail
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
              <div className="px-4 text-sm font-bold text-gray-700 border-x text-center min-w-[200px]">
                {toTitleCase(selectedStudent.name)} <br/>
                <span className="text-[10px] text-primary-600 uppercase tracking-widest">{viewingReport.semester}</span>
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

        {/* PAPER CONTAINER - Font Arial */}
        <div 
          className="bg-white p-12 sm:p-16 shadow-2xl border border-gray-100 mx-auto w-full max-w-[210mm] print:shadow-none print:border-none print:p-0 print:mx-0 min-h-[297mm] text-gray-900 overflow-hidden"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
           
           {isDescriptionFormat ? (
             /* FORMAT KELAS 1-3: DESKRIPSI */
             <div className="space-y-6">
                <div className="text-center space-y-1 mb-10">
                   <h1 className="text-xl font-bold uppercase tracking-widest">Laporan Perkembangan Belajar</h1>
                   <h2 className="text-2xl font-black uppercase">SDQ Mutiara Sunnah</h2>
                   <h3 className="text-lg font-bold uppercase pt-1">Tahun Pelajaran {viewingReport.academicYear.replace(/\s/g, '')}</h3>
                </div>
                
                {/* HEADER INFO: DESKRIPSI */}
                <div className="flex justify-between items-start mb-10 text-sm">
                   <div className="space-y-1.5 flex-1">
                      <div className="grid grid-cols-[140px_20px_1fr]">
                        <span className="font-bold">Nama Siswa</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{toTitleCase(selectedStudent.name)}</span>
                      </div>
                      <div className="grid grid-cols-[140px_20px_1fr]">
                        <span className="font-bold">Kelas</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{toTitleCase(selectedStudent.className)}</span>
                      </div>
                   </div>
                   <div className="space-y-1.5 ml-auto text-right min-w-[200px]">
                      <div className="grid grid-cols-[100px_20px_1fr] text-left">
                        <span className="font-bold">Semester</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{viewingReport.semester}</span>
                      </div>
                   </div>
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
                   <div className="text-right mb-16">Bogor, {viewingReport.dateHijri || '... Hijriah'}<br/>{viewingReport.dateStr || '... Masehi'}</div>
                   <div className="grid grid-cols-2 text-center">
                      <div><p className="mb-24">Orang Tua/Wali</p><p className="border-b border-gray-900 inline-block w-48"></p></div>
                      <div><p className="mb-24">Pengampu Al Qur'an</p><p className="font-bold border-b border-gray-900 inline-block w-48 uppercase">{signatureName}</p></div>
                   </div>
                </div>
             </div>
           ) : (
             /* FORMAT KELAS 4-6: TABEL */
             <div className="space-y-6">
                <div className="text-center space-y-1 mb-10">
                   <h1 className="text-xl font-bold uppercase tracking-widest">Laporan Penilaian Al-Quran</h1>
                   <h2 className="text-2xl font-black uppercase">SDQ Mutiara Sunnah</h2>
                   <h3 className="text-lg font-bold uppercase pt-1">Tahun Pelajaran {viewingReport.academicYear.replace(/\s/g, '')}</h3>
                </div>

                {/* HEADER INFO: TABEL (ALIGNMENT FIXED) */}
                <div className="flex justify-between items-start mb-8 text-[13px] leading-relaxed">
                   <div className="space-y-1.5 flex-1 max-w-[55%]">
                      <div className="grid grid-cols-[140px_20px_1fr]">
                        <span className="font-bold">Nama Siswa</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{toTitleCase(selectedStudent.name)}</span>
                      </div>
                      <div className="grid grid-cols-[140px_20px_1fr]">
                        <span className="font-bold">Nomor Induk / NISN</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{selectedStudent.nis || '-'} / {selectedStudent.nisn || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[140px_20px_1fr]">
                        <span className="font-bold">Kelas</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{toTitleCase(selectedStudent.className)}</span>
                      </div>
                   </div>

                   <div className="space-y-1.5 shrink-0 ml-auto min-w-[260px]">
                      <div className="grid grid-cols-[110px_20px_1fr]">
                        <span className="font-bold">Tahun Ajaran</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{viewingReport.academicYear}</span>
                      </div>
                      <div className="grid grid-cols-[110px_20px_1fr]">
                        <span className="font-bold">Semester</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{viewingReport.semester}</span>
                      </div>
                      <div className="grid grid-cols-[110px_20px_1fr]">
                        <span className="font-bold">Target Hafalan</span>
                        <span className="font-bold">:</span>
                        <span className="font-bold">{viewingReport.targetHafalan}</span>
                      </div>
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

                <table className="w-full border-2 border-gray-900 text-center text-[12px] font-bold border-collapse">
                   <thead>
                      <tr className="border-b-2 border-gray-900">
                         <th colSpan={5} className="py-2 uppercase">Status Hafalan Siswa</th>
                      </tr>
                      <tr className="bg-gray-50 border-b-2 border-gray-900">
                         <th className="py-2 w-10 border-r-2 border-gray-900">No</th>
                         <th className="py-2 text-left px-4 border-r-2 border-gray-900">Kategori</th>
                         <th className="py-2 w-40 border-r-2 border-gray-900">Jumlah</th>
                         <th className="py-2 w-40 border-r-2 border-gray-900">Rincian</th>
                         <th className="py-2 w-32">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {[
                         { id: 1, label: 'Total Hafalan Dimiliki', key: 'dimiliki' },
                         { id: 2, label: 'Hafalan Mutqin', key: 'mutqin' },
                         { id: 3, label: 'Hafalan Semester Ini', key: 'semesterIni' },
                      ].map((item, idx) => (
                         <tr key={idx} className="border-b border-gray-900 last:border-b-0">
                            <td className="py-2 border-r-2 border-gray-900">{item.id}</td>
                            <td className="py-2 text-left px-4 border-r-2 border-gray-900">{item.label}</td>
                            <td className="py-2 border-r-2 border-gray-900">{(viewingReport.statusHafalan as any)[item.key].jumlah}</td>
                            <td className="py-2 border-r-2 border-gray-900">{(viewingReport.statusHafalan as any)[item.key].rincian}</td>
                            <td className="py-2">{(viewingReport.statusHafalan as any)[item.key].status}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                {/* KOLOM CATATAN WALI KELAS (DITAMBAHKAN) */}
                <div className="border-2 border-gray-900 p-4">
                  <h4 className="font-bold text-[13px] border-b border-gray-900 pb-1 mb-2 uppercase">Catatan Wali Kelas:</h4>
                  <p className="text-xs leading-relaxed italic font-bold">"{viewingReport.notes || '-'}"</p>
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

  // LIST MODE: Daftar Siswa
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Arsip Rapor Semester</h2>
          <p className="text-gray-500 text-sm mt-1">Pilih periode dan lihat capaian penilaian Al-Quran santri.</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/5 transition-all">
          <Search className="text-gray-400 shrink-0" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama siswa..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="flex-1 outline-none bg-transparent text-sm font-bold"
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl shrink-0">
          <button 
            onClick={() => setSelectedSemester('Ganjil')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedSemester === 'Ganjil' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Ganjil
          </button>
          <button 
            onClick={() => setSelectedSemester('Genap')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedSemester === 'Genap' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Genap
          </button>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-2xl border border-primary-100">
           <CalendarDays className="text-primary-500" size={18} />
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-primary-400 uppercase tracking-widest leading-none">Tahun Ajaran</span>
              <span className="text-xs font-black text-primary-700 leading-tight">{DEFAULT_YEAR}</span>
           </div>
        </div>
      </div>

      {/* Grid Kartu Siswa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sinkronisasi Database...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student, index) => (
            <div key={student.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 flex items-center justify-center font-black text-xl shadow-inner border border-white">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-black text-gray-900 uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                          {toTitleCase(student.name)}
                       </h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {toTitleCase(student.className)}
                       </p>
                    </div>
                 </div>
                 <span className="px-2 py-1 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400 border border-gray-100 uppercase tracking-widest">
                   ID: {student.id.substring(0, 4)}
                 </span>
              </div>

              <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50">
                 <Button 
                   onClick={() => handleViewReport(student, index)} 
                   variant="secondary" 
                   className="flex-1 text-[10px] uppercase tracking-widest font-black h-12 rounded-xl bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100 transition-all"
                 >
                   <FileText size={16} className="mr-2"/> Lihat Rapor
                 </Button>
                 <button 
                   onClick={() => handleEditReport(student)} 
                   className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-100 transition-all shadow-sm active:scale-90"
                   title="Edit Rapor"
                 >
                   <Edit2 size={18} />
                 </button>
                 <button 
                   onClick={() => handleDeleteReport(student)} 
                   className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-100 transition-all shadow-sm active:scale-90"
                   title="Hapus Rapor"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
             <Search size={40} className="mx-auto text-gray-200 mb-4" />
             <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Siswa tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuruRaporPage;

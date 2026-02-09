
import React, { useEffect, useState, useMemo } from 'react';
import { Student, SemesterReport, User } from '../../../types';
import { getAllStudents, getAllTeachers, getAllSemesterReports } from '../../../services/firestoreService';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Search, Filter, FileText, User as UserIcon, BookOpen, ArrowLeft, Printer, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/Button';

export default function CoordinatorRaporPage() {
  const [reports, setReports] = useState<SemesterReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Pratinjau Rapor
  const [viewingReport, setViewingReport] = useState<SemesterReport | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('Semua');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [allReports, allStudents, allTeachers] = await Promise.all([
      getAllSemesterReports(),
      getAllStudents(),
      getAllTeachers()
    ]);
    setReports(allReports);
    setStudents(allStudents);
    setTeachers(allTeachers);
    setIsLoading(false);
  };

  const getStudentInfo = (id: string) => students.find(s => s.id === id);
  const getTeacherInfo = (id: string) => teachers.find(t => t.id === id);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const student = getStudentInfo(r.studentId);
      const matchesSearch = !search || 
                            student?.name.toLowerCase().includes(search.toLowerCase()) || 
                            student?.className.toLowerCase().includes(search.toLowerCase());
      const matchesYear = filterYear === 'Semua' || r.academicYear === filterYear;
      return matchesSearch && matchesYear;
    });
  }, [reports, students, search, filterYear]);

  // --- HELPER UNTUK VIEW RAPOR ---
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

  const handleOpenDetail = (report: SemesterReport) => {
    const student = getStudentInfo(report.studentId);
    setViewingReport(report);
    setViewingStudent(student || null);
  };

  // --- VIEW MODE: PRATINJAU RAPOR ---
  if (viewingReport && viewingStudent) {
    const teacher = getTeacherInfo(viewingReport.teacherId);
    const signatureName = cleanTeacherName(teacher?.nickname || teacher?.name || 'Wali Kelas');
    const level = extractClassLevel(viewingStudent.className);
    const isDescriptionFormat = level >= 1 && level <= 3;

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden px-2">
           <button 
             onClick={() => { setViewingReport(null); setViewingStudent(null); }} 
             className="flex items-center text-gray-500 hover:text-primary-600 font-bold transition-colors"
           >
             <ArrowLeft size={20} className="mr-2"/> Kembali ke Daftar
           </button>
           
           <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-gray-400 uppercase">Status Monitoring</p>
                <p className="text-xs font-bold text-emerald-600 uppercase">Rapor Terverifikasi</p>
             </div>
             <Button onClick={() => window.print()} className="bg-emerald-600 shadow-lg shadow-emerald-500/20">
               <Printer size={18} className="mr-2"/> Cetak Rapor
             </Button>
           </div>
        </div>

        {/* PAPER CONTENT */}
        <div className="bg-white p-10 sm:p-16 shadow-2xl border border-gray-100 mx-auto w-full max-w-[210mm] print:shadow-none print:border-none print:p-0 print:mx-0 min-h-[297mm] font-serif text-gray-900 overflow-hidden relative">
           
           {/* Watermark Koordinator (Hanya terlihat di layar, hilang saat print) */}
           <div className="absolute top-10 right-10 border-2 border-primary-100 px-3 py-1 rounded text-[10px] font-black text-primary-200 uppercase tracking-widest print:hidden">
             Coordinator View
           </div>

           {isDescriptionFormat ? (
             /* FORMAT KELAS 1-3: DESKRIPSI */
             <div className="space-y-6">
                <div className="text-center space-y-1 mb-10">
                   <h1 className="text-xl font-bold uppercase tracking-widest">Laporan Perkembangan Belajar</h1>
                   <h2 className="text-2xl font-black uppercase">SDQ Mutiara Sunnah</h2>
                   <h3 className="text-lg font-bold uppercase pt-1">Tahun Pelajaran {viewingReport.academicYear.replace(/\s/g, '')}</h3>
                </div>
                <div className="space-y-1 text-sm font-bold mb-8">
                   <div className="flex"><span className="w-32">Nama Siswa</span><span className="mr-2">:</span><span className="uppercase">{viewingStudent.name}</span></div>
                   <div className="flex"><span className="w-32">Kelas</span><span className="mr-2">:</span><span className="uppercase">{viewingStudent.className}</span></div>
                   <div className="flex"><span className="w-32">Semester</span><span className="mr-2">:</span><span>{viewingReport.semester}</span></div>
                </div>
                <div className="space-y-6">
                   <div>
                      <h4 className="font-bold mb-2 uppercase">A. Tahfizh</h4>
                      <div className="border-2 border-gray-900 p-6 min-h-[220px] text-sm leading-relaxed text-justify">
                         {viewingReport.narrativeTahfizh || "Belum ada deskripsi tahfizh."}
                      </div>
                   </div>
                   <div>
                      <h4 className="font-bold mb-2 uppercase">B. Tilawah</h4>
                      <div className="border-2 border-gray-900 p-6 min-h-[220px] text-sm leading-relaxed text-justify">
                         {viewingReport.narrativeTilawah || "Belum ada deskripsi tilawah."}
                      </div>
                   </div>
                </div>
                <div className="mt-10 text-sm font-bold">
                   <div className="text-right mb-16">Bogor, {viewingReport.dateHijri}<br/>{viewingReport.dateStr}</div>
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

                <div className="grid grid-cols-2 gap-x-12 mb-8 text-[13px] font-bold text-gray-800">
                   <div className="space-y-1">
                      <div className="flex"><span className="w-40 shrink-0">Nama Siswa</span><span className="mr-2">:</span><span className="uppercase">{viewingStudent.name}</span></div>
                      <div className="flex whitespace-nowrap"><span className="w-40 shrink-0">Nomor Induk / NISN</span><span className="mr-2">:</span><span>{viewingStudent.nis || '-'} / {viewingStudent.nisn || '-'}</span></div>
                      <div className="flex"><span className="w-40 shrink-0">Kelas</span><span className="mr-2">:</span><span className="uppercase">{viewingStudent.className}</span></div>
                   </div>
                   <div className="space-y-1">
                      <div className="flex"><span className="w-32 shrink-0">Tahun Ajaran</span><span className="mr-2">:</span><span>{viewingReport.academicYear}</span></div>
                      <div className="flex"><span className="w-32 shrink-0">Semester</span><span className="mr-2">:</span><span>{viewingReport.semester}</span></div>
                      <div className="flex"><span className="w-32 shrink-0">Target Hafalan</span><span className="mr-2">:</span><span>{viewingReport.targetHafalan}</span></div>
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

                {/* Status Hafalan Snapshot */}
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

                {/* Catatan Motivasi Wali Kelas */}
                <div className="border-2 border-gray-900 p-4">
                  <h4 className="font-bold text-[13px] border-b border-gray-900 pb-1 mb-2">CATATAN WALI KELAS:</h4>
                  <p className="text-xs leading-relaxed italic">"{viewingReport.notes || '-'}"</p>
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

  // --- LIST MODE: MONITORING TABEL ---
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Pantau Rapor Semester</h2>
          <p className="text-gray-500 text-sm mt-1">Supervisi status pengisian rapor seluruh jenjang secara global.</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-primary-50 rounded-2xl border border-primary-100">
           <GraduationCap className="text-primary-500" size={20} />
           <p className="text-xs font-black text-primary-700 uppercase tracking-widest">Global Monitoring Mode</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau kelas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none text-sm font-bold transition-all"
          />
        </div>
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-6 py-3 border-2 border-gray-50 rounded-2xl bg-gray-50 text-xs font-black uppercase tracking-widest outline-none focus:border-primary-500 transition-all cursor-pointer"
        >
          <option value="Semua">Semua Tahun</option>
          <option value="2024 / 2025">2024 / 2025</option>
          <option value="2025 / 2026">2025 / 2026</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-primary-900 text-white text-[10px] uppercase font-black tracking-widest">
                <th className="px-6 py-5 border-r border-white/10 w-12 text-center">NO</th>
                <th className="px-6 py-5 border-r border-white/10">NAMA SISWA</th>
                <th className="px-6 py-5 border-r border-white/10">KELAS</th>
                <th className="px-6 py-5 border-r border-white/10">WALI KELAS (GURU)</th>
                <th className="px-6 py-5 border-r border-white/10">PERIODE</th>
                <th className="px-6 py-5 border-r border-white/10 text-center">UTS / UAS</th>
                <th className="px-6 py-5 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Database Rapor...</p>
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => {
                  const student = getStudentInfo(report.studentId);
                  const teacher = getTeacherInfo(report.teacherId);
                  return (
                    <tr key={idx} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-6 py-5 text-center text-gray-400 font-bold border-r border-gray-50">{idx + 1}</td>
                      <td className="px-6 py-5 font-black text-gray-900 uppercase border-r border-gray-50 group-hover:text-primary-600 transition-colors">
                        {student?.name || 'Siswa Dihapus'}
                      </td>
                      <td className="px-6 py-5 border-r border-gray-50">
                        <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black uppercase text-gray-500">
                           {student?.className || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5 border-r border-gray-50">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-600">
                               {(teacher?.nickname || teacher?.name || '?').charAt(0)}
                            </div>
                            <span className="font-bold text-gray-700 text-xs">{teacher?.nickname || teacher?.name || '-'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 border-r border-gray-50">
                         <p className="text-[10px] font-black text-gray-400 leading-none mb-1">{report.academicYear}</p>
                         <p className="text-xs font-bold text-primary-700 uppercase tracking-tighter">{report.semester}</p>
                      </td>
                      <td className="px-6 py-5 text-center border-r border-gray-50">
                        <div className="flex items-center justify-center gap-2">
                           <span className="w-8 py-1 bg-emerald-50 text-emerald-700 rounded font-black text-xs border border-emerald-100">{report.exams.uts}</span>
                           <span className="text-gray-300">/</span>
                           <span className="w-8 py-1 bg-blue-50 text-blue-700 rounded font-black text-xs border border-blue-100">{report.exams.uas}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => handleOpenDetail(report)} 
                          className="px-4 py-2 bg-white hover:bg-primary-600 hover:text-white border-2 border-primary-100 hover:border-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 mx-auto"
                        >
                          <FileText size={14}/> Detail Rapor
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-32 text-center">
                    <div className="max-w-xs mx-auto">
                      <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Rapor Tidak Ditemukan</p>
                      <p className="text-xs text-gray-400 mt-2">Belum ada wali kelas yang menginput rapor untuk kriteria pencarian ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Statistics Footer */}
        {filteredReports.length > 0 && (
          <div className="bg-primary-50 px-6 py-4 flex justify-between items-center border-t border-primary-100">
             <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">
               TOTAL: {filteredReports.length} RAPOR TERINPUT
             </p>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-bold text-gray-600 uppercase">UTS</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-[10px] font-bold text-gray-600 uppercase">UAS</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

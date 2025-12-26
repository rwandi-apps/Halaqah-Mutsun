
import React, { useEffect, useState } from 'react';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, getSemesterReport } from '../../../services/firestoreService';
import { Button } from '../../../components/Button';
import { FileText, Printer, ArrowLeft, Search, GraduationCap } from 'lucide-react';
import LogoSDQ from '../../../components/LogoSDQ';

export default function GuruRaporPage({ teacherId = 'u2' }: { teacherId?: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [viewingReport, setViewingReport] = useState<SemesterReport | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (teacherId) getStudentsByTeacher(teacherId).then(setStudents);
  }, [teacherId]);

  useEffect(() => {
    setFilteredStudents(students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, students]);

  const handleViewReport = async (student: Student) => {
    setIsLoading(true);
    const report = await getSemesterReport(student.id, '2023 / 2024', 'Ganjil');
    if (report) {
      setViewingReport(report);
      setSelectedStudent(student);
    } else {
      alert("Data rapor belum diinput untuk siswa ini. Silakan input di menu 'Input Nilai Rapor'.");
    }
    setIsLoading(false);
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

  if (viewingReport && selectedStudent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0">
        <div className="flex justify-between items-center print:hidden">
           <button onClick={() => setViewingReport(null)} className="flex items-center text-gray-500 hover:text-primary-600 font-bold">
             <ArrowLeft size={20} className="mr-2"/> Kembali ke Daftar
           </button>
           <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">
             <Printer size={18} className="mr-2"/> Cetak Rapor
           </Button>
        </div>

        {/* RAPOR PREVIEW - PDF STYLE */}
        <div className="bg-white p-12 sm:p-16 shadow-2xl border border-gray-100 mx-auto w-full max-w-[210mm] print:shadow-none print:border-none print:p-8 min-h-[297mm]">
           {/* Header Sekolah */}
           <div className="flex justify-between items-start mb-8">
              <div className="w-24 h-24">
                 <img src="https://images.unsplash.com/photo-1584551271411-c9143997ce1d?w=100&h=100&fit=crop" alt="SDQ Logo" className="w-full h-full object-contain grayscale" />
              </div>
              <div className="text-center flex-1 pr-24">
                 <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-1">Laporan Penilaian Al-Quran</h1>
                 <h2 className="text-2xl font-black uppercase text-gray-900">SDQ Mutiara Sunnah</h2>
              </div>
           </div>

           {/* Info Siswa */}
           <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm font-bold text-gray-800">
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Nama Siswa</span>
                 <span className="mr-2">:</span>
                 <span className="uppercase">{selectedStudent.name}</span>
              </div>
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Tahun Ajaran</span>
                 <span className="mr-2">:</span>
                 <span>{viewingReport.academicYear}</span>
              </div>
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Nomor Induk / NISN</span>
                 <span className="mr-2">:</span>
                 <span>{selectedStudent.nis || '-'} / {selectedStudent.nisn || '-'}</span>
              </div>
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Semester</span>
                 <span className="mr-2">:</span>
                 <span>{viewingReport.semester}</span>
              </div>
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Kelas</span>
                 <span className="mr-2">:</span>
                 <span className="uppercase">{selectedStudent.className}</span>
              </div>
              <div className="flex border-b border-gray-100 pb-1">
                 <span className="w-36">Target Hafalan</span>
                 <span className="mr-2">:</span>
                 <span>{viewingReport.targetHafalan}</span>
              </div>
           </div>

           {/* Tabel Aspek Penilaian */}
           <div className="mb-8">
              <table className="w-full border-2 border-gray-900 text-center text-sm font-bold">
                 <thead className="bg-gray-200">
                    <tr className="border-b-2 border-gray-900">
                       <th className="py-2 w-12 border-r-2 border-gray-900">No</th>
                       <th className="py-2 border-r-2 border-gray-900 px-4 text-left">Aspek Penilaian</th>
                       <th className="py-2 w-40 border-r-2 border-gray-900">Prestasi</th>
                       <th className="py-2 w-40">Predikat</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[
                       { id: 1, label: 'Adab di Halaqah', val: viewingReport.assessments.adab },
                       { id: 2, label: 'Muroja\'ah', val: viewingReport.assessments.murojaah },
                       { id: 3, label: 'Tajwid', val: viewingReport.assessments.tajwid },
                       { id: 4, label: 'Makharijul Huruf', val: viewingReport.assessments.makharij },
                    ].map((item, idx) => (
                       <tr key={idx} className="border-b border-gray-900">
                          <td className="py-2 border-r-2 border-gray-900">{item.id}</td>
                          <td className="py-2 border-r-2 border-gray-900 px-4 text-left">{item.label}</td>
                          <td className="py-2 border-r-2 border-gray-900">{item.val}</td>
                          <td className="py-2">{getPredikatLetter(item.val)}</td>
                       </tr>
                    ))}
                    <tr className="border-b-2 border-gray-900">
                       <td className="py-2 border-r-2 border-gray-900">5</td>
                       <td className="py-2 border-r-2 border-gray-900 px-4 text-left">Pencapaian Target Hafalan</td>
                       <td className="py-2 border-r-2 border-gray-900">{viewingReport.assessments.pencapaianTarget}%</td>
                       <td className="py-2">{viewingReport.assessments.pencapaianTarget >= 100 ? 'Mumtaz' : 'Hampir Tuntas'}</td>
                    </tr>
                 </tbody>
              </table>
           </div>

           {/* Tabel Ujian */}
           <div className="mb-8">
              <table className="w-full border-2 border-gray-900 text-center text-sm font-bold">
                 <thead className="bg-gray-200">
                    <tr className="border-b-2 border-gray-900">
                       <th className="py-2 w-12 border-r-2 border-gray-900">No</th>
                       <th className="py-2 border-r-2 border-gray-900 px-4 text-left">Ujian-ujian</th>
                       <th className="py-2 w-40 border-r-2 border-gray-900">Angka</th>
                       <th className="py-2 w-40">Predikat</th>
                    </tr>
                 </thead>
                 <tbody>
                    <tr className="border-b border-gray-900">
                       <td className="py-2 border-r-2 border-gray-900">1</td>
                       <td className="py-2 border-r-2 border-gray-900 px-4 text-left">Ujian Tengah Semester (UTS)</td>
                       <td className="py-2 border-r-2 border-gray-900">{viewingReport.exams.uts}</td>
                       <td className="py-2">{getPredikatScore(viewingReport.exams.uts)}</td>
                    </tr>
                    <tr className="border-b-2 border-gray-900">
                       <td className="py-2 border-r-2 border-gray-900">2</td>
                       <td className="py-2 border-r-2 border-gray-900 px-4 text-left">Ujian Akhir Semester (UAS)</td>
                       <td className="py-2 border-r-2 border-gray-900">{viewingReport.exams.uas}</td>
                       <td className="py-2">{getPredikatScore(viewingReport.exams.uas)}</td>
                    </tr>
                 </tbody>
              </table>
           </div>

           {/* Status Hafalan */}
           <div className="mb-8">
              <div className="text-center font-bold text-sm mb-2 uppercase tracking-wide">Status Hafalan Siswa</div>
              <table className="w-full border-2 border-gray-900 text-center text-sm font-bold">
                 <thead className="bg-gray-200">
                    <tr className="border-b-2 border-gray-900">
                       <th className="py-2 w-12 border-r-2 border-gray-900">No</th>
                       <th className="py-2 border-r-2 border-gray-900 px-4 text-left">Kategori</th>
                       <th className="py-2 border-r-2 border-gray-900">Jumlah</th>
                       <th className="py-2 border-r-2 border-gray-900">Rincian</th>
                       <th className="py-2">Status</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[
                       { id: 1, label: 'Total Hafalan Dimiliki', data: viewingReport.statusHafalan.dimiliki },
                       { id: 2, label: 'Hafalan Mutqin', data: viewingReport.statusHafalan.mutqin },
                       { id: 3, label: 'Hafalan Semester Ini', data: viewingReport.statusHafalan.semesterIni },
                    ].map((item, idx) => (
                       <tr key={idx} className="border-b border-gray-900 last:border-b-2">
                          <td className="py-2 border-r-2 border-gray-900">{item.id}</td>
                          <td className="py-2 border-r-2 border-gray-900 px-4 text-left">{item.label}</td>
                          <td className="py-2 border-r-2 border-gray-900">{item.data.jumlah}</td>
                          <td className="py-2 border-r-2 border-gray-900">{item.data.rincian}</td>
                          <td className="py-2 uppercase">{item.data.status}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Catatan */}
           <div className="mb-12">
              <div className="text-center font-bold text-sm mb-2 uppercase tracking-wide">Catatan</div>
              <div className="border-2 border-gray-900 p-6 text-center text-sm italic font-medium leading-relaxed">
                 {viewingReport.notes}
                 <div className="mt-4 not-italic font-bold">
                    خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ( البخاري)<br/>
                    "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengamalkannya." (HR. Bukhori)
                 </div>
              </div>
           </div>

           {/* Tanda Tangan */}
           <div className="text-sm font-bold text-gray-900">
              <div className="text-right mb-12">
                 Bogor, {viewingReport.dateHijri}<br/>
                 {viewingReport.dateStr}
              </div>
              <div className="grid grid-cols-2 gap-40 text-center">
                 <div>
                    <div className="mb-20">Orang Tua/Wali</div>
                    <div className="border-b border-gray-900 mx-12"></div>
                 </div>
                 <div>
                    <div className="mb-20">Wali Kelas</div>
                    <div className="border-b border-gray-900 mx-12"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Rapor</h2>
          <p className="text-gray-500 mt-1">Lihat dan cetak rapor semester santri.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Cari nama santri..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none bg-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <div>
                   <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{student.name}</h3>
                   <p className="text-xs text-gray-500 font-medium">{student.className}</p>
                </div>
             </div>
             
             <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                   <span>ID / NIS</span>
                   <span className="text-gray-900">{student.nis || '-'}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                   <span>Target</span>
                   <span className="text-gray-900">{student.memorizationTarget}</span>
                </div>
             </div>

             <Button 
               onClick={() => handleViewReport(student)} 
               variant="secondary" 
               className="w-full font-bold text-xs uppercase tracking-widest border-primary-100 text-primary-600 hover:bg-primary-50"
             >
               <FileText size={16} /> Lihat Rapor Semester
             </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

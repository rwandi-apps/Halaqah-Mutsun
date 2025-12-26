
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, saveSemesterReport, getSemesterReport } from '../../../services/firestoreService';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { Save, BookOpen, ClipboardCheck, GraduationCap, User, FileText, Info } from 'lucide-react';

export default function GuruGradesPage({ teacherId }: { teacherId?: string }) {
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [report, setReport] = useState<SemesterReport>({
    studentId: '',
    teacherId: teacherId || '',
    academicYear: '2025 / 2026',
    semester: 'Ganjil',
    targetHafalan: '10 Halaman',
    dateStr: '',
    dateHijri: '',
    assessments: { adab: 'B', murojaah: 'B', tajwid: 'B', makharij: 'A', pencapaianTarget: 85 },
    exams: { uts: 80, uas: 80 },
    statusHafalan: {
      dimiliki: { jumlah: '', rincian: '', status: '' },
      mutqin: { jumlah: '', rincian: '', status: '' },
      semesterIni: { jumlah: '', rincian: '', status: '' }
    },
    narrativeTahfizh: '',
    narrativeTilawah: '',
    notes: ''
  });

  useEffect(() => {
    if (teacherId) {
      getStudentsByTeacher(teacherId).then(data => {
        setStudents(data);
        const stateId = location.state?.studentId;
        if (stateId) handleStudentChange(stateId, data);
      });
    }
  }, [teacherId, location]);

  const handleStudentChange = async (id: string, currentStudents?: Student[]) => {
    if (!id) {
      setSelectedStudent(null);
      return;
    }
    
    const student = (currentStudents || students).find(s => s.id === id);
    setSelectedStudent(student || null);
    
    setIsLoading(true);
    const existing = await getSemesterReport(id, report.academicYear, report.semester);
    if (existing) {
      setReport(existing);
    } else {
      setReport(prev => ({
        ...prev,
        studentId: id,
        teacherId: teacherId || '',
        narrativeTahfizh: `Alhamdulillah, Ananda ${student?.name || ''} dalam pelajaran tahfizh menunjukkan perkembangan yang menggembirakan...`,
        narrativeTilawah: `Alhamdulillah atas taufik dari Allah, pada semester ${report.semester.toLowerCase()} ini capaian kompetensi ananda ${student?.name || ''} dalam mata pelajaran Tilawah menunjukkan perkembangan yang sangat menggembirakan...`,
        notes: `Tingkatkan kembali semangat Ananda ${student?.name || ''} dalam menghafal serta memuroja'ah hafalan. Semoga Allah selalu memberikan kemudahan.`
      }));
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!selectedStudent) return alert("Pilih siswa!");
    setIsSaving(true);
    try {
      await saveSemesterReport({ ...report, studentId: selectedStudent.id, teacherId: teacherId || '' });
      alert("Data rapor berhasil disimpan.");
    } catch (e) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const classLevel = selectedStudent ? extractClassLevel(selectedStudent.className) : 0;
  const isDescriptionFormat = classLevel >= 1 && classLevel <= 3;

  const getPredikatLetter = (letter: string) => {
    if (letter === 'A') return 'Mumtaz';
    if (letter === 'B') return 'Jayyid Jiddan';
    if (letter === 'C') return 'Jayyid';
    return '-';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap className="text-primary-600" /> Input Nilai Rapor Semester
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Pilih Siswa ({students.length})</label>
            <select 
              value={selectedStudent?.id || ''} 
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Tahun Ajaran</label>
            <select 
              value={report.academicYear} 
              onChange={e => setReport({...report, academicYear: e.target.value})} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="2024 / 2025">2024 / 2025</option>
              <option value="2025 / 2026">2025 / 2026</option>
              <option value="2026 / 2027">2026 / 2027</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Semester</label>
            <select value={report.semester} onChange={e => setReport({...report, semester: e.target.value as any})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>

        {selectedStudent && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 text-blue-700 text-xs font-bold">
            <Info size={16} />
            Siswa Kelas {classLevel}. Menggunakan format: {isDescriptionFormat ? 'RAPOR DESKRIPSI' : 'RAPOR TABEL'}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : selectedStudent && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {isDescriptionFormat ? (
            /* FORMAT DESKRIPSI (KELAS 1-3) */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">A. Perkembangan Tahfizh</h3>
                </div>
                <div className="p-6">
                   <textarea 
                     value={report.narrativeTahfizh}
                     onChange={e => setReport({...report, narrativeTahfizh: e.target.value})}
                     className="w-full p-4 border border-gray-200 rounded-xl text-sm h-48 focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                     placeholder="Tuliskan perkembangan hafalan siswa..."
                   />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary-600" />
                  <h3 className="font-bold text-gray-800 text-sm uppercase">B. Perkembangan Tilawah</h3>
                </div>
                <div className="p-6">
                   <textarea 
                     value={report.narrativeTilawah}
                     onChange={e => setReport({...report, narrativeTilawah: e.target.value})}
                     className="w-full p-4 border border-gray-200 rounded-xl text-sm h-48 focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                     placeholder="Tuliskan perkembangan tilawah siswa..."
                   />
                </div>
              </div>
            </div>
          ) : (
            /* FORMAT TABEL (KELAS 4-6) */
            <>
              {/* Aspek Penilaian */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-primary-600" />
                  <h3 className="font-bold text-gray-800 text-sm">ASPEK PENILAIAN (A/B/C)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'adab', label: 'Adab di Halaqah' },
                    { id: 'murojaah', label: 'Muroja\'ah' },
                    { id: 'tajwid', label: 'Tajwid' },
                    { id: 'makharij', label: 'Makharijul Huruf' },
                  ].map(item => (
                    <div key={item.id}>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{item.label}</label>
                      <div className="flex items-center gap-3">
                        <select 
                          value={(report.assessments as any)[item.id]} 
                          onChange={e => setReport({...report, assessments: {...report.assessments, [item.id]: e.target.value}})}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                        <span className="text-[10px] font-bold text-gray-400 italic shrink-0 w-20">{getPredikatLetter((report.assessments as any)[item.id])}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Target Hafalan</label>
                    <input type="text" value={report.targetHafalan} onChange={e => setReport({...report, targetHafalan: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Pencapaian Target (%)</label>
                    <input type="number" value={report.assessments.pencapaianTarget} onChange={e => setReport({...report, assessments: {...report.assessments, pencapaianTarget: parseInt(e.target.value) || 0}})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Ujian */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary-600" />
                  <h3 className="font-bold text-gray-800 text-sm">UJIAN-UJIAN (ANGKA 0-100)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ujian Tengah Semester (UTS)</label>
                    <input type="number" value={report.exams.uts} onChange={e => setReport({...report, exams: {...report.exams, uts: parseInt(e.target.value) || 0}})} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ujian Akhir Semester (UAS)</label>
                    <input type="number" value={report.exams.uas} onChange={e => setReport({...report, exams: {...report.exams, uas: parseInt(e.target.value) || 0}})} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                </div>
              </div>

              {/* Status Hafalan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <User size={18} className="text-primary-600" />
                  <h3 className="font-bold text-gray-800 text-sm">STATUS HAFALAN SISWA</h3>
                </div>
                <div className="p-6 space-y-4">
                  {['dimiliki', 'mutqin', 'semesterIni'].map(k => (
                    <div key={k} className="grid grid-cols-4 gap-4 items-center">
                       <p className="text-xs font-bold text-gray-600 uppercase">{k}</p>
                       <input value={(report.statusHafalan as any)[k].jumlah} onChange={e => setReport({...report, statusHafalan: {...report.statusHafalan, [k]: {...(report.statusHafalan as any)[k], jumlah: e.target.value}}})} className="col-span-1 p-2 border rounded-lg text-xs" placeholder="Jumlah" />
                       <input value={(report.statusHafalan as any)[k].rincian} onChange={e => setReport({...report, statusHafalan: {...report.statusHafalan, [k]: {...(report.statusHafalan as any)[k], rincian: e.target.value}}})} className="col-span-2 p-2 border rounded-lg text-xs" placeholder="Rincian" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Catatan & Footer (Shared) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Catatan Wali Kelas</label>
            <textarea 
              value={report.notes}
              onChange={e => setReport({...report, notes: e.target.value})}
              rows={4}
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tanggal (Masehi)</label>
                <input type="text" placeholder="Contoh: 22 Desember 2025" value={report.dateStr} onChange={e => setReport({...report, dateStr: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tanggal (Hijriah)</label>
                <input type="text" placeholder="Contoh: 01 Jumadil Akhir 1447 H" value={report.dateHijri} onChange={e => setReport({...report, dateHijri: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} isLoading={isSaving} className="w-full py-4 rounded-2xl shadow-xl shadow-primary-500/20 font-bold">
            <Save size={20} /> Simpan Seluruh Data Rapor
          </Button>
        </div>
      )}
    </div>
  );
}

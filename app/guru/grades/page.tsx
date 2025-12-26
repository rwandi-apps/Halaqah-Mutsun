
import React, { useEffect, useState } from 'react';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, saveSemesterReport, getSemesterReport } from '../../../services/firestoreService';
import { Button } from '../../../components/Button';
import { Save, User, BookOpen, ClipboardCheck, GraduationCap } from 'lucide-react';

export default function GuruGradesPage({ teacherId }: { teacherId?: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State - Tahun Ajaran mulai 2025 / 2026
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
    notes: ''
  });

  useEffect(() => {
    if (teacherId) {
      getStudentsByTeacher(teacherId).then(data => {
        setStudents(data);
      });
    }
  }, [teacherId]);

  const handleStudentChange = async (id: string) => {
    setSelectedStudentId(id);
    if (!id) return;
    
    setIsLoading(true);
    const existing = await getSemesterReport(id, report.academicYear, report.semester);
    if (existing) {
      setReport(existing);
    } else {
      const student = students.find(s => s.id === id);
      setReport(prev => ({
        ...prev,
        studentId: id,
        teacherId: teacherId || '',
        notes: `Tingkatkan kembali semangat Ananda ${student?.name || ''} dalam menghafal serta memuroja'ah hafalan. Semoga Allah selalu memberikan kemudahan kepada Ananda dalam mempelajari dan menghafal Al-Qur'an serta mengamalkannya dalam kehidupan sehari-hari.`
      }));
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!selectedStudentId) return alert("Pilih siswa!");
    setIsSaving(true);
    try {
      await saveSemesterReport({ ...report, studentId: selectedStudentId, teacherId: teacherId || '' });
      alert("Data rapor berhasil disimpan.");
    } catch (e) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
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
              value={selectedStudentId} 
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Tahun Ajaran</label>
            <input type="text" value={report.academicYear} onChange={e => setReport({...report, academicYear: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Semester</label>
            <select value={report.semester} onChange={e => setReport({...report, semester: e.target.value as any})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : selectedStudentId && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
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
                <div className="flex items-center gap-3">
                  <input type="number" value={report.exams.uts} onChange={e => setReport({...report, exams: {...report.exams, uts: parseInt(e.target.value) || 0}})} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  <span className="text-xs font-semibold text-primary-600">{getPredikatScore(report.exams.uts)}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ujian Akhir Semester (UAS)</label>
                <div className="flex items-center gap-3">
                  <input type="number" value={report.exams.uas} onChange={e => setReport({...report, exams: {...report.exams, uas: parseInt(e.target.value) || 0}})} className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  <span className="text-xs font-semibold text-primary-600">{getPredikatScore(report.exams.uas)}</span>
                </div>
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
              {[
                { id: 'dimiliki', label: 'Total Hafalan Dimiliki' },
                { id: 'mutqin', label: 'Hafalan Mutqin' },
                { id: 'semesterIni', label: 'Hafalan Semester Ini' },
              ].map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <p className="text-xs font-bold text-gray-700">{item.label}</p>
                  </div>
                  <input 
                    placeholder="Jumlah (misal: 1 Juz 3 Hal)" 
                    value={(report.statusHafalan as any)[item.id].jumlah}
                    onChange={e => setReport({...report, statusHafalan: {...report.statusHafalan, [item.id]: {...(report.statusHafalan as any)[item.id], jumlah: e.target.value}}})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                  <input 
                    placeholder="Rincian (misal: Juz 30 dan 29)" 
                    value={(report.statusHafalan as any)[item.id].rincian}
                    onChange={e => setReport({...report, statusHafalan: {...report.statusHafalan, [item.id]: {...(report.statusHafalan as any)[item.id], rincian: e.target.value}}})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Catatan & Footer */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Catatan Guru</label>
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

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Student, SemesterReport } from '../../../types';
import { getStudentsByTeacher, saveSemesterReport, getSemesterReport } from '../../../services/firestoreService';
import { improveReportRedaction, improveTeacherNotes } from '../../../services/geminiService';
import { extractClassLevel } from '../../../services/sdqTargets';
import { Button } from '../../../components/Button';
import { Save, BookOpen, ClipboardCheck, GraduationCap, User, FileText, Info, Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface GuruGradesProps {
  teacherId?: string;
}

const GuruGradesPage: React.FC<GuruGradesProps> = ({ teacherId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState<{ [key: string]: boolean }>({});

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
      dimiliki: { jumlah: '', rincian: '', status: 'Cukup Baik' },
      mutqin: { jumlah: '', rincian: '', status: 'Cukup Baik' },
      semesterIni: { jumlah: '', rincian: '', status: 'Baik' }
    },
    narrativeTahfizh: '',
    narrativeTilawah: '',
    notes: ''
  });

  useEffect(() => {
    if (teacherId) {
      getStudentsByTeacher(teacherId).then(data => {
        setStudents(data);
        const state = location.state as any;
        const stateId = state?.studentId;
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
        narrativeTahfizh: '',
        narrativeTilawah: '',
        notes: `Tingkatkan kembali semangat Ananda ${student?.name || ''} dalam menghafal serta memuroja'ah hafalan. Semoga Allah selalu memberikan kemudahan.`
      }));
    }
    setIsLoading(false);
  };

  const handleRefineLanguage = async (field: 'narrativeTahfizh' | 'narrativeTilawah' | 'notes') => {
    const text = (report as any)[field];
    if (!text || text.trim().length < 10) {
      alert("Silakan tulis deskripsi minimal satu kalimat terlebih dahulu.");
      return;
    }

    setIsRefining(prev => ({ ...prev, [field]: true }));
    try {
      let refinedText = "";
      if (field === 'notes') {
        refinedText = await improveTeacherNotes(text);
      } else {
        refinedText = await improveReportRedaction(text);
      }
      setReport(prev => ({ ...prev, [field]: refinedText }));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsRefining(prev => ({ ...prev, [field]: false }));
    }
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
            <select value={report.semester} onChange={e => setReport({...report, semester: e.target.value as any})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
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
            <div className="space-y-6">
              {/* Narasi Tahfizh */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400" /> A. Tahfizh
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleRefineLanguage('narrativeTahfizh')} isLoading={isRefining['narrativeTahfizh']} className="text-[10px] uppercase font-black tracking-widest bg-white h-7">
                    <Sparkles size={12} className="mr-1 text-primary-500" /> AI Refine
                  </Button>
                </div>
                <textarea 
                  value={report.narrativeTahfizh} 
                  onChange={e => setReport({...report, narrativeTahfizh: e.target.value})} 
                  className="w-full p-6 h-48 outline-none text-sm leading-relaxed text-gray-700 resize-none" 
                  placeholder="Deskripsikan perkembangan hafalan siswa..." 
                />
              </div>

              {/* Narasi Tilawah */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400" /> B. Tilawah
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => handleRefineLanguage('narrativeTilawah')} isLoading={isRefining['narrativeTilawah']} className="text-[10px] uppercase font-black tracking-widest bg-white h-7">
                    <Sparkles size={12} className="mr-1 text-primary-500" /> AI Refine
                  </Button>
                </div>
                <textarea 
                  value={report.narrativeTilawah} 
                  onChange={e => setReport({...report, narrativeTilawah: e.target.value})} 
                  className="w-full p-6 h-48 outline-none text-sm leading-relaxed text-gray-700 resize-none" 
                  placeholder="Deskripsikan perkembangan tilawah siswa..." 
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               {/* Format Tabel (Kelas 4-6) */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Penilaian Aspek Al-Quran</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {[
                       { label: 'Adab di Halaqah', key: 'adab' },
                       { label: 'Muroja\'ah', key: 'murojaah' },
                       { label: 'Tajwid', key: 'tajwid' },
                       { label: 'Makharijul Huruf', key: 'makharij' },
                     ].map((item) => (
                       <div key={item.key}>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{item.label}</label>
                          <select 
                            value={(report.assessments as any)[item.key]}
                            onChange={e => setReport({...report, assessments: { ...report.assessments, [item.key]: e.target.value }})}
                            className="w-full p-2 border rounded-lg text-sm"
                          >
                             <option value="A">A (Mumtaz)</option>
                             <option value="B">B (Jayyid Jiddan)</option>
                             <option value="C">C (Jayyid)</option>
                             <option value="D">D (Maqbul)</option>
                          </select>
                       </div>
                     ))}
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pencapaian Target (%)</label>
                       <input 
                         type="number" 
                         value={report.assessments.pencapaianTarget} 
                         onChange={e => setReport({...report, assessments: { ...report.assessments, pencapaianTarget: parseInt(e.target.value) || 0 }})} 
                         className="w-full p-2 border rounded-lg text-sm"
                       />
                     </div>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Nilai Ujian</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nilai UTS</label>
                       <input type="number" value={report.exams.uts} onChange={e => setReport({...report, exams: { ...report.exams, uts: parseInt(e.target.value) || 0 }})} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nilai UAS</label>
                       <input type="number" value={report.exams.uas} onChange={e => setReport({...report, exams: { ...report.exams, uas: parseInt(e.target.value) || 0 }})} className="w-full p-2 border rounded-lg text-sm" />
                     </div>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Status Hafalan</h3>
                  <div className="space-y-4">
                     {/* Loop untuk status hafalan fields */}
                     {[
                       { key: 'dimiliki', label: 'Total Hafalan Dimiliki' },
                       { key: 'mutqin', label: 'Hafalan Mutqin' },
                       { key: 'semesterIni', label: 'Hafalan Semester Ini' },
                     ].map((group) => (
                       <div key={group.key} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-black uppercase text-gray-400 mb-2">{group.label}</p>
                          <div className="grid grid-cols-3 gap-2">
                             <input placeholder="Jumlah (mis: 1 Juz)" value={(report.statusHafalan as any)[group.key].jumlah} onChange={e => setReport({...report, statusHafalan: { ...report.statusHafalan, [group.key]: { ...(report.statusHafalan as any)[group.key], jumlah: e.target.value } }})} className="p-2 border rounded text-xs" />
                             <input placeholder="Rincian (mis: Juz 30)" value={(report.statusHafalan as any)[group.key].rincian} onChange={e => setReport({...report, statusHafalan: { ...report.statusHafalan, [group.key]: { ...(report.statusHafalan as any)[group.key], rincian: e.target.value } }})} className="p-2 border rounded text-xs" />
                             <input placeholder="Status (mis: Baik)" value={(report.statusHafalan as any)[group.key].status} onChange={e => setReport({...report, statusHafalan: { ...report.statusHafalan, [group.key]: { ...(report.statusHafalan as any)[group.key], status: e.target.value } }})} className="p-2 border rounded text-xs" />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
          
          {/* Bagian Catatan Walikelas (Common) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-400" /> Catatan Wali Kelas
              </h3>
              <Button variant="outline" size="sm" onClick={() => handleRefineLanguage('notes')} isLoading={isRefining['notes']} className="text-[10px] uppercase font-black tracking-widest bg-white h-7">
                <Sparkles size={12} className="mr-1 text-primary-500" /> AI Refine
              </Button>
            </div>
            <textarea 
              value={report.notes} 
              onChange={e => setReport({...report, notes: e.target.value})} 
              className="w-full p-6 h-32 outline-none text-sm leading-relaxed text-gray-700 resize-none" 
              placeholder="Berikan catatan motivasi untuk siswa..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tanggal Rapor (Masehi)</label>
               <input type="text" placeholder="Bogor, 20 Desember 2025" value={report.dateStr} onChange={e => setReport({...report, dateStr: e.target.value})} className="w-full p-3 border rounded-xl text-sm" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tanggal Rapor (Hijriah)</label>
               <input type="text" placeholder="20 Jumadil Akhir 1447 H" value={report.dateHijri} onChange={e => setReport({...report, dateHijri: e.target.value})} className="w-full p-3 border rounded-xl text-sm" />
             </div>
          </div>

          <Button onClick={handleSave} isLoading={isSaving} className="w-full py-4 rounded-xl shadow-lg font-bold uppercase tracking-widest text-xs">
            <Save size={18} className="mr-2" /> Simpan Rapor Semester
          </Button>

        </div>
      )}
    </div>
  );
};

export default GuruGradesPage;
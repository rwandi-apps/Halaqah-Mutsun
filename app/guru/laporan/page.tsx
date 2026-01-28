
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Student, Report } from '../../../types';
import { getStudentsByTeacher, saveSDQReport, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SURAH_LIST } from '../../../services/mockBackend';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Button } from '../../../components/Button';
import { BookOpen, Book, Plus, Minus, UserCheck, Loader2, Users, Star, Heart, AlertTriangle, Edit3 } from 'lucide-react';

interface GuruLaporanPageProps {
  teacherId?: string;
}

const IQRA_VOLUMES = ["Iqra' 1", "Iqra' 2", "Iqra' 3", "Iqra' 4", "Iqra' 5", "Iqra' 6"];
const MONTH_LIST = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"];
const ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"];

const CounterInput = ({ label, value, onChange, min = 0 }: { label?: string, value: number | string, onChange: (v: number | string) => void, min?: number }) => {
  const handleDec = () => { const current = typeof value === 'number' ? value : 0; onChange(Math.max(min, current - 1)); };
  const handleInc = () => { const current = typeof value === 'number' ? value : 0; onChange(current + 1); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; onChange(val === '' ? '' : parseInt(val) || 0); };
  return (
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      <button type="button" onClick={handleDec} className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm"><Minus size={14} /></button>
      <input type="number" min={min} value={value} onChange={handleChange} placeholder="0" className="w-12 text-center font-bold border border-gray-100 py-1.5 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-sm" />
      <button type="button" onClick={handleInc} className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 shadow-sm"><Plus size={14} /></button>
      {label && <span className="text-[10px] text-gray-400 ml-0.5 font-medium uppercase">{label}</span>}
    </div>
  );
};

const SourceSelect = ({ value, onChange, method, placeholder = 'Pilih...' }: { value: string, onChange: (v: string) => void, method: 'Al-Quran' | 'Iqra', placeholder?: string }) => (
  <div className="flex-1">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 sm:h-10 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-xs sm:text-sm truncate shadow-sm">
      <option value="">{placeholder}</option>
      {method === 'Al-Quran' ? SURAH_LIST.map((s, i) => <option key={s} value={s}>{i + 1}. {s}</option>) : IQRA_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  </div>
);

const InputRow = ({ label, children, badge }: { label: string, children?: React.ReactNode, badge?: string }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <div className="flex justify-between items-center px-1">
      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {badge && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Total: {badge}</span>}
    </div>
    <div className="flex flex-row items-center gap-2">{children}</div>
  </div>
);

const GuruLaporanPage: React.FC<GuruLaporanPageProps> = ({ teacherId = '1' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]); // Untuk cek duplikat
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingReportId, setExistingReportId] = useState<string | null>(null);

  // Form State
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [studentId, setStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [month, setMonth] = useState('Desember');
  
  const [tahfizhIndiv, setTahfizhIndiv] = useState({ fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tilawahIndiv, setTilawahIndiv] = useState({ method: 'Al-Quran' as 'Al-Quran' | 'Iqra', fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tahfizhKlas, setTahfizhKlas] = useState({ fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tilawahKlas, setTilawahKlas] = useState({ method: 'Al-Quran' as 'Al-Quran' | 'Iqra', fs: '', fv: '' as any, ts: '', tv: '' as any });
  
  const [attendance, setAttendance] = useState<number>(100);
  const [behaviorScore, setBehaviorScore] = useState<number>(10);
  const [baselineJuz, setBaselineJuz] = useState<number | string>(0);
  const [baselinePages, setBaselinePages] = useState<number | string>(0);
  const [baselineLines, setBaselineLines] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  const safeNum = (val: any) => (val === '' ? 0 : Number(val));

  // 1. Initial Load & Subscription
  useEffect(() => {
    if (!teacherId) return;
    getStudentsByTeacher(teacherId).then(setStudents);
    const unsub = subscribeToReportsByTeacher(teacherId, (data) => {
      setAllReports(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [teacherId]);

  // 2. Helper untuk Memecah String Hafalan ("Surah: 1 - Surah: 5")
  const decomposeRange = (range: string | undefined) => {
    const defaultVal = { fs: '', fv: '' as any, ts: '', tv: '' as any };
    if (!range || range === '-') return defaultVal;
    
    try {
      const parts = range.split(' - ');
      if (parts.length < 2) return defaultVal;

      const parsePart = (p: string) => {
        const match = p.match(/^(.*?):\s*(\d+)$/);
        if (match) return { s: match[1].trim(), v: parseInt(match[2]) };
        return { s: p.trim(), v: '' };
      };

      const start = parsePart(parts[0]);
      const end = parsePart(parts[1]);

      return { fs: start.s, fv: start.v, ts: end.s, tv: end.v };
    } catch (e) {
      return defaultVal;
    }
  };

  // 3. Handle Navigation State (Mode Edit dari Luar)
  useEffect(() => {
    const state = location.state as { editReportId?: string, reportData?: Report };
    if (state?.reportData) {
      const r = state.reportData;
      setStudentId(r.studentId);
      setMonth(r.month);
      setAcademicYear(r.academicYear || '2025/2026');
      setReportType(r.type);
      setAttendance(r.attendance || 100);
      setBehaviorScore(r.behaviorScore || 10);
      setNotes(r.notes || '');
      setBaselineJuz(r.totalHafalan?.juz || 0);
      setBaselinePages(r.totalHafalan?.pages || 0);
      setBaselineLines(r.totalHafalan?.lines || 0);

      // Decompose Ranges
      setTahfizhIndiv(decomposeRange(r.tahfizh.individual));
      setTilawahIndiv({ ...decomposeRange(r.tilawah.individual), method: r.tilawah.method as any || 'Al-Quran' });
      setTahfizhKlas(decomposeRange(r.tahfizh.classical));
      setTilawahKlas({ ...decomposeRange(r.tilawah.classical), method: r.tilawah.method as any || 'Al-Quran' });

      setIsEditMode(true);
      setExistingReportId(r.id);
    }
  }, [location.state]);

  // 4. Deteksi Duplikat Otomatis saat ganti Siswa/Periode
  const duplicateReport = useMemo(() => {
    if (!studentId || !month || !academicYear || isEditMode) return null;
    return allReports.find(r => 
      r.studentId === studentId && 
      r.month === month && 
      r.academicYear === academicYear &&
      r.type === reportType
    );
  }, [studentId, month, academicYear, reportType, allReports, isEditMode]);

  // Fungsi untuk memuat data dari duplikat yang ditemukan
  const loadFromExisting = (rep: Report) => {
    setTahfizhIndiv(decomposeRange(rep.tahfizh.individual));
    setTilawahIndiv({ ...decomposeRange(rep.tilawah.individual), method: rep.tilawah.method as any || 'Al-Quran' });
    setAttendance(rep.attendance || 100);
    setBehaviorScore(rep.behaviorScore || 10);
    setNotes(rep.notes || '');
    setBaselineJuz(rep.totalHafalan?.juz || 0);
    setBaselinePages(rep.totalHafalan?.pages || 0);
    setBaselineLines(rep.totalHafalan?.lines || 0);
    setExistingReportId(rep.id);
    setIsEditMode(true);
  };

  const getResultText = (data: any, method: string, mode: 'tahfizh' | 'tilawah') => {
    if (!data.fs || !data.ts) return '';
    const res = SDQQuranEngine.calculate(data.fs, safeNum(data.fv), data.ts, safeNum(data.tv), mode);
    if (!res.valid) return '';
    return method === 'Iqra' ? `${res.pages} Hal` : `${res.pages} Hal ${res.lines} Baris`;
  };

  const handleSave = async () => {
    if (!studentId) return alert("Pilih siswa.");
    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const tfRes = getResultText(tahfizhIndiv, 'Al-Quran', 'tahfizh');
      const tlRes = getResultText(tilawahIndiv, tilawahIndiv.method, 'tilawah');
      
      const fmt = (s: string, v: any) => (s ? `${s}: ${v === '' ? '-' : v}` : '-');
      const makeRange = (data: any) => (!data.fs && !data.ts ? '-' : `${fmt(data.fs, data.fv)} - ${fmt(data.ts, data.tv)}`);
      
      await saveSDQReport({
        studentId, 
        studentName: selectedStudent.name, 
        teacherId: teacherId || '', 
        className: selectedStudent.className, 
        type: reportType, 
        month, 
        academicYear, 
        date: new Date().toISOString().split('T')[0], 
        evaluation: '',
        attendance: attendance,
        behaviorScore: behaviorScore,
        tilawah: { method: tilawahIndiv.method, individual: makeRange(tilawahIndiv), classical: makeRange(tilawahKlas), result: tlRes || "-" },
        tahfizh: { individual: makeRange(tahfizhIndiv), classical: makeRange(tahfizhKlas), result: tfRes || "-" },
        totalHafalan: { juz: safeNum(baselineJuz), pages: safeNum(baselinePages), lines: safeNum(baselineLines) },
        notes
      });
      
      alert(isEditMode ? "Laporan berhasil diperbarui!" : "Laporan berhasil disimpan!");
      
      // Reset after success if not intentional multi-edit
      if (!isEditMode) {
        setStudentId('');
        setTahfizhIndiv({ fs: '', fv: '', ts: '', tv: '' });
        setTilawahIndiv({ method: 'Al-Quran', fs: '', fv: '', ts: '', tv: '' });
        setNotes('');
      } else {
        setIsEditMode(false);
        setExistingReportId(null);
        navigate('/guru/view-report'); // Kembali ke list setelah edit
      }
      
    } catch (e) { alert("Gagal menyimpan laporan."); } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Laporan Halaqah' : 'Input Laporan Halaqah'}
        </h2>
        {isEditMode && (
          <button 
            onClick={() => { setIsEditMode(false); setStudentId(''); }}
            className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100"
          >
            Batal Edit
          </button>
        )}
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateReport && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Laporan Sudah Ada</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Ananda <span className="font-bold">{duplicateReport.studentName}</span> sudah memiliki laporan untuk periode <span className="font-bold">{month} {academicYear}</span>. 
              Gunakan tombol di samping jika ingin mengubah data lama.
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100"
            onClick={() => loadFromExisting(duplicateReport)}
          >
            <Edit3 size={14} className="mr-1"/> Edit Data Lama
          </Button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="p-2 border rounded-xl bg-white text-sm">{ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="p-2 border rounded-xl bg-white text-sm"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-2 border rounded-xl bg-white text-sm">
          {reportType === 'Laporan Semester' ? ["Ganjil", "Genap"].map(s => <option key={s} value={s}>Semester {s}</option>) : MONTH_LIST.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* KLASIKAL SECTION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-2 text-blue-600"><Users size={20}/><h3 className="font-bold text-gray-800 text-sm uppercase">Capaian Klasikal (Kelompok)</h3></div>
          <p className="text-[10px] text-gray-400 italic -mt-4">Data ini tidak akan hilang setelah simpan, gunakan untuk satu sesi halaqah.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2"><Book size={16} /> Tahfizh Klasikal</h4>
              <InputRow label="DARI" badge={getResultText(tahfizhKlas, 'Al-Quran', 'tahfizh')}>
                <SourceSelect value={tahfizhKlas.fs} onChange={(v) => setTahfizhKlas({...tahfizhKlas, fs: v, ts: v})} method="Al-Quran" />
                <CounterInput label="Ayat" value={tahfizhKlas.fv} onChange={(v) => setTahfizhKlas({...tahfizhKlas, fv: v, tv: v})} />
              </InputRow>
              <InputRow label="SAMPAI">
                <SourceSelect value={tahfizhKlas.ts} onChange={(v) => setTahfizhKlas({...tahfizhKlas, ts: v})} method="Al-Quran" />
                <CounterInput label="Ayat" value={tahfizhKlas.tv} onChange={(v) => setTahfizhKlas({...tahfizhKlas, tv: v})} />
              </InputRow>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2"><BookOpen size={16} /> Tilawah Klasikal</h4>
              <div className="flex gap-2"><button onClick={() => setTilawahKlas({...tilawahKlas, method: 'Al-Quran'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahKlas.method === 'Al-Quran' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahKlas({...tilawahKlas, method: 'Iqra'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahKlas.method === 'Iqra' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>IQRA'</button></div>
              <InputRow label="DARI" badge={getResultText(tilawahKlas, tilawahKlas.method, 'tilawah')}>
                <SourceSelect value={tilawahKlas.fs} onChange={(v) => setTilawahKlas({...tilawahKlas, fs: v, ts: v})} method={tilawahKlas.method} />
                <CounterInput label={tilawahKlas.method === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahKlas.fv} onChange={(v) => setTilawahKlas({...tilawahKlas, fv: v, tv: v})} />
              </InputRow>
              <InputRow label="SAMPAI">
                <SourceSelect value={tilawahKlas.ts} onChange={(v) => setTilawahKlas({...tilawahKlas, ts: v})} method={tilawahKlas.method} />
                <CounterInput label={tilawahKlas.method === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahKlas.tv} onChange={(v) => setTilawahKlas({...tilawahKlas, tv: v})} />
              </InputRow>
            </div>
          </div>
        </div>

        {/* INDIVIDU SECTION */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 border-t-4 transition-all duration-500 ${isEditMode ? 'border-t-orange-500 shadow-orange-500/10' : 'border-t-emerald-500'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 mb-2 ${isEditMode ? 'text-orange-600' : 'text-emerald-600'}`}>
              {isEditMode ? <Edit3 size={20}/> : <UserCheck size={20}/>}
              <h3 className="font-bold text-gray-800 text-sm uppercase">
                {isEditMode ? 'Data Update Siswa' : 'Capaian Individu Siswa'}
              </h3>
            </div>
            {isEditMode && <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded">MODE EDIT AKTIF</span>}
          </div>
          
          <select 
            value={studentId} 
            onChange={(e) => { setStudentId(e.target.value); if(isEditMode) setIsEditMode(false); }} 
            className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-white text-sm"
          >
            <option value="">-- Pilih Siswa --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-1">Kehadiran (Bulan Ini)</label>
              <div className="relative">
                <select
                  value={attendance}
                  onChange={(e) => setAttendance(parseInt(e.target.value))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm font-medium"
                >
                  <option value={100}>Sangat Rajin (Selalu Hadir)</option>
                  <option value={90}>Baik (Ada Izin/Sakit)</option>
                  <option value={80}>Cukup (Beberapa Kali Absen)</option>
                  <option value={60}>Perlu Perhatian (Sering Absen)</option>
                </select>
                <Heart size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" fill="currentColor" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-1">Adab di Halaqah</label>
              <div className="relative">
                <select
                  value={behaviorScore}
                  onChange={(e) => setBehaviorScore(parseInt(e.target.value))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm font-medium"
                >
                  <option value={10}>Mumtaz (Sangat Baik & Teladan)</option>
                  <option value={9}>Jayyid Jiddan (Baik Sekali)</option>
                  <option value={8}>Jayyid (Baik)</option>
                  <option value={7}>Maqbul (Cukup)</option>
                  <option value={6}>Perlu Bimbingan (Kurang)</option>
                </select>
                <Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 pointer-events-none" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2"><Book size={16} /> Tahfizh Individu</h4>
              <InputRow label="DARI" badge={getResultText(tahfizhIndiv, 'Al-Quran', 'tahfizh')}>
                <SourceSelect value={tahfizhIndiv.fs} onChange={(v) => setTahfizhIndiv({...tahfizhIndiv, fs: v, ts: v})} method="Al-Quran" />
                <CounterInput label="Ayat" value={tahfizhIndiv.fv} onChange={(v) => setTahfizhIndiv({...tahfizhIndiv, fv: v, tv: v})} />
              </InputRow>
              <InputRow label="SAMPAI">
                <SourceSelect value={tahfizhIndiv.ts} onChange={(v) => setTahfizhIndiv({...tahfizhIndiv, ts: v})} method="Al-Quran" />
                <CounterInput label="Ayat" value={tahfizhIndiv.tv} onChange={(v) => setTahfizhIndiv({...tahfizhIndiv, tv: v})} />
              </InputRow>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2"><BookOpen size={16} /> Tilawah Individu</h4>
              <div className="flex gap-2"><button onClick={() => setTilawahIndiv({...tilawahIndiv, method: 'Al-Quran'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahIndiv.method === 'Al-Quran' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahIndiv({...tilawahIndiv, method: 'Iqra'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahIndiv.method === 'Iqra' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>IQRA'</button></div>
              <InputRow label="DARI" badge={getResultText(tilawahIndiv, tilawahIndiv.method, 'tilawah')}>
                <SourceSelect value={tilawahIndiv.fs} onChange={(v) => setTilawahIndiv({...tilawahIndiv, fs: v, ts: v})} method={tilawahIndiv.method} />
                <CounterInput label={tilawahIndiv.method === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahIndiv.fv} onChange={(v) => setTilawahIndiv({...tilawahIndiv, fv: v, tv: v})} />
              </InputRow>
              <InputRow label="SAMPAI">
                <SourceSelect value={tilawahIndiv.ts} onChange={(v) => setTilawahIndiv({...tilawahIndiv, ts: v})} method={tilawahIndiv.method} />
                <CounterInput label={tilawahIndiv.method === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahIndiv.tv} onChange={(v) => setTilawahIndiv({...tilawahIndiv, tv: v})} />
              </InputRow>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
          <h4 className="font-bold text-emerald-800 text-xs mb-4 uppercase tracking-widest">Akumulasi Hafalan (Total Siswa)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Juz</p><CounterInput value={baselineJuz} onChange={setBaselineJuz} /></div>
            <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Hal</p><CounterInput value={baselinePages} onChange={setBaselinePages} /></div>
            <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Baris</p><CounterInput value={baselineLines} onChange={setBaselineLines} /></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Catatan Guru</h4>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan perkembangan..." className="w-full h-20 p-4 border border-gray-200 rounded-2xl outline-none text-sm"></textarea>
        </div>
      </div>
      <Button 
        onClick={handleSave} 
        className={`w-full py-4 rounded-2xl shadow-lg font-bold ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : ''}`} 
        isLoading={isSaving} 
        disabled={!studentId || (!!duplicateReport && !isEditMode)}
      >
        {isEditMode ? 'Simpan Perubahan Laporan' : 'Simpan Laporan & Lanjut'}
      </Button>
    </div>
  );
}
export default GuruLaporanPage;

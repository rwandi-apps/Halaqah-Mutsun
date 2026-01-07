
import React, { useEffect, useState, useMemo } from 'react';
import { Student, HalaqahMonthlyReport } from '../../../types';
import { getStudentsByTeacher, saveSDQReport, saveHalaqahMonthlyReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { SURAH_LIST } from '../../../services/mockBackend';
import { calculateHafalan } from '../../../services/quranMapping';
import { Button } from '../../../components/Button';
import { BookOpen, Book, Plus, Minus, Database, UserCheck, Heart, Layers, AlertCircle, Info } from 'lucide-react';

interface GuruLaporanPageProps {
  teacherId?: string;
}

const IQRA_JILIDS = [1, 2, 3, 4, 5, 6];
const IQRA_VOLUMES = ["Iqra' 1", "Iqra' 2", "Iqra' 3", "Iqra' 4", "Iqra' 5", "Iqra' 6"];

const CounterInput = ({ 
  label, 
  value, 
  onChange, 
  min = 0 
}: { 
  label?: string, 
  value: number | string, 
  onChange: (v: number) => void, 
  min?: number 
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      <button 
        type="button"
        onClick={() => onChange(Math.max(min, Number(value) - 1))} 
        className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
      >
        <Minus size={14} />
      </button>
      <input 
        type="number" 
        min={min} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value) || min)} 
        className="w-12 text-center font-bold border border-gray-100 py-1.5 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm shadow-sm" 
      />
      <button 
        type="button"
        onClick={() => onChange(Number(value) + 1)} 
        className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
      >
        <Plus size={14} />
      </button>
      {label && <span className="text-[10px] text-gray-400 ml-0.5 font-medium uppercase">{label}</span>}
    </div>
  );
};

const SourceSelect = ({ value, onChange, method, placeholder = 'Pilih...' }: { value: string, onChange: (v: string) => void, method: 'Al-Quran' | 'Iqra', placeholder?: string }) => (
  <div className="flex-1">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 sm:h-10 px-3 sm:px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-xs sm:text-sm truncate shadow-sm">
      <option value="">{placeholder}</option>
      {method === 'Al-Quran' ? (
        SURAH_LIST.map((s, index) => <option key={s} value={s}>{index + 1}. {s}</option>)
      ) : (
        IQRA_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)
      )}
    </select>
  </div>
);

const InputRow = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="space-y-1.5 sm:space-y-2">
    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</p>
    <div className="flex flex-row items-center gap-2">{children}</div>
  </div>
);

export default function GuruLaporanPage({ teacherId = '1' }: GuruLaporanPageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [studentId, setStudentId] = useState('');
  const [month, setMonth] = useState('Desember');
  
  // -- STATE KLASIKAL (Shared) --
  const [klasikalTahfizh, setKlasikalTahfizh] = useState({
    from: { surah: 'An-Naba\'', ayah: 1 },
    to: { surah: 'An-Naba\'', ayah: 40 }
  });
  const [klasikalTilawah, setKlasikalTilawah] = useState({
    type: 'quran' as 'quran' | 'iqra',
    from: { surah: 'Al-Baqarah', ayah: 1, jilid: 1, halaman: 1 },
    to: { surah: 'Al-Baqarah', ayah: 20, jilid: 1, halaman: 10 }
  });

  // -- STATE INDIVIDUAL (Per Siswa) --
  const [attendance, setAttendance] = useState<number>(100);
  const [behaviorScore, setBehaviorScore] = useState<number>(10);
  const [tilawahMethod, setTilawahMethod] = useState<'Al-Quran' | 'Iqra'>('Al-Quran');
  const [tilawahFromSurah, setTilawahFromSurah] = useState(''); 
  const [tilawahFromVerse, setTilawahFromVerse] = useState<number | string>(''); 
  const [tilawahToSurah, setTilawahToSurah] = useState('');
  const [tilawahToVerse, setTilawahToVerse] = useState<number | string>(''); 
  const [tilawahTotal, setTilawahTotal] = useState({ pages: 0, lines: 0 });
  const [tahfizhFromSurah, setTahfizhFromSurah] = useState(''); 
  const [tahfizhFromVerse, setTahfizhFromVerse] = useState<number | string>(''); 
  const [tahfizhToSurah, setTahfizhToSurah] = useState('');
  const [tahfizhToVerse, setTahfizhToVerse] = useState<number | string>(''); 
  const [tahfizhTotal, setTahfizhTotal] = useState({ pages: 0, lines: 0 });
  const [baselineJuz, setBaselineJuz] = useState<number | string>(0);
  const [baselinePages, setBaselinePages] = useState<number | string>(0);
  const [baselineLines, setBaselineLines] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  // Validasi Klasikal
  const validation = useMemo(() => {
    const checkQuranRange = (fromS: string, fromA: number, toS: string, toA: number) => {
      const startIdx = SURAH_LIST.indexOf(fromS);
      const endIdx = SURAH_LIST.indexOf(toS);
      if (endIdx < startIdx) return false;
      if (endIdx === startIdx && toA < fromA) return false;
      return true;
    };
    const isTahfizhValid = checkQuranRange(klasikalTahfizh.from.surah, klasikalTahfizh.from.ayah, klasikalTahfizh.to.surah, klasikalTahfizh.to.ayah);
    const isTilawahValid = klasikalTilawah.type === 'quran' 
      ? checkQuranRange(klasikalTilawah.from.surah || '', klasikalTilawah.from.ayah || 0, klasikalTilawah.to.surah || '', klasikalTilawah.to.ayah || 0)
      : ((klasikalTilawah.to.jilid || 0) > (klasikalTilawah.from.jilid || 0) || ((klasikalTilawah.to.jilid || 0) === (klasikalTilawah.from.jilid || 0) && (klasikalTilawah.to.halaman || 0) >= (klasikalTilawah.from.halaman || 0)));
    return { allValid: isTahfizhValid && isTilawahValid };
  }, [klasikalTahfizh, klasikalTilawah]);

  useEffect(() => {
    const loadKlasikal = async () => {
      if (!teacherId || !month) return;
      const existing = await getHalaqahMonthlyReport(teacherId, month);
      if (existing) {
        setKlasikalTahfizh(existing.klasikal.tahfizh);
        setKlasikalTilawah({
          type: existing.klasikal.tilawah.type,
          from: { ...klasikalTilawah.from, ...existing.klasikal.tilawah.from },
          to: { ...klasikalTilawah.to, ...existing.klasikal.tilawah.to }
        });
      }
    };
    loadKlasikal();
  }, [teacherId, month]);

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);
    getStudentsByTeacher(teacherId).then(data => { setStudents(data); setIsLoading(false); });
  }, [teacherId]);

  const safeNum = (val: string | number) => (typeof val === 'number' ? val : 0);

  useEffect(() => {
    const result = calculateHafalan(tilawahFromSurah, safeNum(tilawahFromVerse), tilawahToSurah, safeNum(tilawahToVerse));
    setTilawahTotal(result);
  }, [tilawahMethod, tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse]);

  useEffect(() => {
    const result = calculateHafalan(tahfizhFromSurah, safeNum(tahfizhFromVerse), tahfizhToSurah, safeNum(tahfizhToVerse));
    setTahfizhTotal(result);
  }, [tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse]);

  const handleSave = async () => {
    if (!studentId) { alert("Mohon pilih siswa terlebih dahulu."); return; }
    if (!validation.allValid) { alert("Rentang klasikal tidak valid."); return; }
    
    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return;
    
    setIsSaving(true);
    try {
      // 1. Simpan Data Klasikal
      await saveHalaqahMonthlyReport({
        halaqahId: teacherId || '',
        teacherId: teacherId || '',
        period: month,
        academicYear: '2025/2026',
        klasikal: {
          tahfizh: klasikalTahfizh,
          tilawah: {
            type: klasikalTilawah.type,
            from: klasikalTilawah.type === 'quran' ? { surah: klasikalTilawah.from.surah, ayah: klasikalTilawah.from.ayah } : { jilid: klasikalTilawah.from.jilid, halaman: klasikalTilawah.from.halaman },
            to: klasikalTilawah.type === 'quran' ? { surah: klasikalTilawah.to.surah, ayah: klasikalTilawah.to.ayah } : { jilid: klasikalTilawah.to.jilid, halaman: klasikalTilawah.to.halaman },
          }
        }
      });

      // 2. Simpan Data Individu
      const fmt = (surah: string, verse: number | string) => {
        if (!surah) return '-';
        return `${surah}: ${(typeof verse === 'string' && verse === '') ? '-' : verse}`;
      };
      const makeRange = (fs: string, fv: number | string, ts: string, tv: number | string) => {
        if (!fs && !ts) return '-';
        return `${fmt(fs, fv)} - ${fmt(ts, tv)}`;
      };

      await saveSDQReport({
        studentId, studentName: selectedStudent.name, teacherId: teacherId || '', className: selectedStudent.className, 
        type: reportType, month, academicYear: '2025/2026', date: new Date().toISOString().split('T')[0], evaluation: '',
        attendance, behaviorScore,
        tilawah: { method: tilawahMethod, individual: makeRange(tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse) },
        tahfizh: { individual: makeRange(tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse) },
        totalHafalan: reportType === 'Laporan Semester' ? { juz: safeNum(baselineJuz), pages: safeNum(baselinePages), lines: safeNum(baselineLines) } : undefined, 
        notes
      });

      alert("Laporan berhasil disimpan!");
      setNotes('');
    } catch (error) { console.error(error); alert("Gagal menyimpan."); } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center px-1"><h2 className="text-2xl font-bold text-gray-900">Input Laporan Halaqah</h2></div>
      
      {/* 0. FILTER PERIODE & TIPE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Periode Laporan</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm">{(["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m} 2025/2026</option>))}</select></div>
        <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Tipe Laporan</label><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester (Individu)</option></select></div>
      </div>

      {/* 1. SECTION KLASIKAL (Shared) */}
      <div className="bg-white rounded-[2rem] shadow-sm border-2 border-primary-50 overflow-hidden">
        <div className="bg-primary-50 px-6 py-4 flex items-center justify-between border-b border-primary-100">
           <div className="flex items-center gap-3"><Layers className="text-primary-600" /><div><h3 className="font-bold text-primary-900 text-sm uppercase">Capaian Klasikal Halaqah</h3><p className="text-[10px] text-primary-600 font-medium italic">Berlaku untuk seluruh anggota halaqah periode {month}</p></div></div>
           <span className="bg-white text-primary-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-primary-100 shadow-sm">Global Data</span>
        </div>
        <div className="p-6 space-y-10">
           {/* Tahfizh Klasikal */}
           <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2"><Book size={14} className="text-emerald-500" /> Tahfizh Klasikal</h4>
              <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                 <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Dari</p>
                    <div className="flex gap-2">
                       <select value={klasikalTahfizh.from.surah} onChange={e => setKlasikalTahfizh({...klasikalTahfizh, from: {...klasikalTahfizh.from, surah: e.target.value}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">{SURAH_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                       <CounterInput label="Ayat" value={klasikalTahfizh.from.ayah} onChange={v => setKlasikalTahfizh({...klasikalTahfizh, from: {...klasikalTahfizh.from, ayah: v}})} />
                    </div>
                 </div>
                 <div className="hidden md:block pb-3 text-gray-300 font-bold">sampai</div>
                 <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Sampai</p>
                    <div className="flex gap-2">
                       <select value={klasikalTahfizh.to.surah} onChange={e => setKlasikalTahfizh({...klasikalTahfizh, to: {...klasikalTahfizh.to, surah: e.target.value}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">{SURAH_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                       <CounterInput label="Ayat" value={klasikalTahfizh.to.ayah} onChange={v => setKlasikalTahfizh({...klasikalTahfizh, to: {...klasikalTahfizh.to, ayah: v}})} />
                    </div>
                 </div>
              </div>
           </div>
           {/* Tilawah Klasikal */}
           <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"><h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} className="text-blue-500" /> Tilawah Klasikal</h4>
                 <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button type="button" onClick={() => setKlasikalTilawah({...klasikalTilawah, type: 'quran'})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${klasikalTilawah.type === 'quran' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Al-Qur'an</button>
                    <button type="button" onClick={() => setKlasikalTilawah({...klasikalTilawah, type: 'iqra'})} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${klasikalTilawah.type === 'iqra' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Iqra'</button>
                 </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100 transition-all">
                 {klasikalTilawah.type === 'quran' ? (
                    <>
                      <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Dari</p>
                        <div className="flex gap-2">
                          <select value={klasikalTilawah.from.surah} onChange={e => setKlasikalTilawah({...klasikalTilawah, from: {...klasikalTilawah.from, surah: e.target.value}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">{SURAH_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                          <CounterInput label="Ayat" value={klasikalTilawah.from.ayah || 1} onChange={v => setKlasikalTilawah({...klasikalTilawah, from: {...klasikalTilawah.from, ayah: v}})} />
                        </div>
                      </div>
                      <div className="hidden md:block pb-3 text-gray-300 font-bold">sampai</div>
                      <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Sampai</p>
                        <div className="flex gap-2">
                          <select value={klasikalTilawah.to.surah} onChange={e => setKlasikalTilawah({...klasikalTilawah, to: {...klasikalTilawah.to, surah: e.target.value}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">{SURAH_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select>
                          <CounterInput label="Ayat" value={klasikalTilawah.to.ayah || 1} onChange={v => setKlasikalTilawah({...klasikalTilawah, to: {...klasikalTilawah.to, ayah: v}})} />
                        </div>
                      </div>
                    </>
                 ) : (
                    <>
                      <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Dari</p>
                        <div className="flex gap-2">
                          <select value={klasikalTilawah.from.jilid} onChange={e => setKlasikalTilawah({...klasikalTilawah, from: {...klasikalTilawah.from, jilid: parseInt(e.target.value)}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">{IQRA_JILIDS.map(j => <option key={j} value={j}>Iqra' {j}</option>)}</select>
                          <CounterInput label="Hal" value={klasikalTilawah.from.halaman || 1} onChange={v => setKlasikalTilawah({...klasikalTilawah, from: {...klasikalTilawah.from, halaman: v}})} />
                        </div>
                      </div>
                      <div className="hidden md:block pb-3 text-gray-300 font-bold">sampai</div>
                      <div className="flex-1 space-y-2"><p className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Sampai</p>
                        <div className="flex gap-2">
                          <select value={klasikalTilawah.to.jilid} onChange={e => setKlasikalTilawah({...klasikalTilawah, to: {...klasikalTilawah.to, jilid: parseInt(e.target.value)}})} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">{IQRA_JILIDS.map(j => <option key={j} value={j}>Iqra' {j}</option>)}</select>
                          <CounterInput label="Hal" value={klasikalTilawah.to.halaman || 1} onChange={v => setKlasikalTilawah({...klasikalTilawah, to: {...klasikalTilawah.to, halaman: v}})} />
                        </div>
                      </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* 2. SECTION INDIVIDUAL (WAJIB ADA) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 border-t-4 border-t-emerald-500">
        <div className="flex items-center gap-2 mb-2"><UserCheck className="text-emerald-600" /><h3 className="font-bold text-gray-800 text-sm uppercase">Capaian Individu Siswa</h3></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Pilih Siswa</label><select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"><option value="">-- Pilih Siswa --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kehadiran</label><select value={attendance} onChange={e => setAttendance(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm bg-white"><option value={97}>Sangat Baik</option><option value={90}>Baik</option><option value={80}>Cukup</option><option value={60}>Perhatian</option></select></div>
             <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adab</label><select value={behaviorScore} onChange={e => setBehaviorScore(Number(e.target.value))} className="w-full p-2 border rounded-lg text-sm bg-white"><option value={10}>Sangat Baik</option><option value={8}>Baik</option><option value={6}>Pembinaan</option></select></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
          {/* Tahfizh Individu */}
          <div className="space-y-4">
            <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-emerald-700">Setoran Sabaq Individu</h4><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Total: {tahfizhTotal.pages} Hal</span></div>
            <InputRow label="DARI"><SourceSelect value={tahfizhFromSurah} onChange={(v) => {setTahfizhFromSurah(v); if(!tahfizhToSurah) setTahfizhToSurah(v);}} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhFromVerse} onChange={setTahfizhFromVerse} /></InputRow>
            <InputRow label="SAMPAI"><SourceSelect value={tahfizhToSurah} onChange={setTahfizhToSurah} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhToVerse} onChange={setTahfizhToVerse} /></InputRow>
          </div>
          {/* Tilawah Individu */}
          <div className="space-y-4">
            <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-blue-700">Tilawah Individu</h4><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Total: {tilawahTotal.pages} Hal</span></div>
            <div className="flex gap-2"><button onClick={() => setTilawahMethod('Al-Quran')} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahMethod === 'Al-Quran' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahMethod('Iqra')} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahMethod === 'Iqra' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>IQRA'</button></div>
            <InputRow label="DARI"><SourceSelect value={tilawahFromSurah} onChange={(v) => {setTilawahFromSurah(v); if(!tilawahToSurah) setTilawahToSurah(v);}} method={tilawahMethod} /><CounterInput label={tilawahMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahFromVerse} onChange={setTilawahFromVerse} /></InputRow>
            <InputRow label="SAMPAI"><SourceSelect value={tilawahToSurah} onChange={setTilawahToSurah} method={tilawahMethod} /><CounterInput label={tilawahMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahToVerse} onChange={setTilawahToVerse} /></InputRow>
          </div>
        </div>

        {reportType === 'Laporan Semester' && (
          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-4"><Database size={16} className="text-emerald-600"/><h4 className="font-bold text-emerald-800 text-xs">Akumulasi Akhir Semester</h4></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Juz</p><CounterInput value={baselineJuz} onChange={setBaselineJuz} /></div>
              <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Hal</p><CounterInput value={baselinePages} onChange={setBaselinePages} /></div>
              <div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Baris</p><CounterInput value={baselineLines} onChange={setBaselineLines} /></div>
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-gray-50"><label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Catatan Perkembangan Individu</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tuliskan catatan khusus untuk siswa ini..." className="w-full h-24 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm placeholder:text-gray-300 shadow-sm"></textarea></div>
      </div>

      <div className="px-2"><Button onClick={handleSave} className="w-full py-4 rounded-2xl shadow-lg shadow-primary-500/20 font-bold" isLoading={isSaving} disabled={!validation.allValid || !studentId}>Simpan Laporan Sekarang</Button></div>
    </div>
  );
}

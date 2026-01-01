
import React, { useEffect, useState } from 'react';
import { Student } from '../../../types';
import { getStudentsByTeacher, addReport } from '../../../services/firestoreService';
import { SURAH_LIST } from '../../../services/mockBackend';
import { calculateHafalan } from '../../../services/quranMapping';
import { Button } from '../../../components/Button';
import { BookOpen, Book, Plus, Minus, Database } from 'lucide-react';

interface GuruLaporanPageProps {
  teacherId?: string;
}

const IQRA_VOLUMES = ["Iqra' 1", "Iqra' 2", "Iqra' 3", "Iqra' 4", "Iqra' 5", "Iqra' 6"];

// Helper Component for Counter Input
const CounterInput = ({ 
  label, 
  value, 
  onChange, 
  min = 0 
}: { 
  label?: string, 
  value: number | string, 
  onChange: (v: number | string) => void, 
  min?: number 
}) => {
  const handleDecrement = () => {
    if (typeof value === 'string') onChange(min);
    else onChange(Math.max(min, Number(value) - 1));
  };
  const handleIncrement = () => {
    if (typeof value === 'string') onChange(min + 1);
    else onChange(Number(value) + 1);
  };
  return (
    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
      <button onClick={handleDecrement} className="w-8 h-9 sm:h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm" type="button"><Minus size={14} /></button>
      <input type="number" min={min} value={value} placeholder="-" onChange={(e) => { const val = e.target.value; if (val === '') onChange(''); else { const num = parseInt(val); if (!isNaN(num)) onChange(num); } }} className="w-10 sm:w-14 text-center font-bold border border-gray-100 py-1.5 sm:py-2 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-gray-300 text-sm sm:text-base shadow-sm" />
      <button onClick={handleIncrement} className="w-8 h-9 sm:h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm" type="button"><Plus size={14} /></button>
      {label && <span className="text-[10px] sm:text-xs text-gray-400 ml-0.5 font-medium">{label}</span>}
    </div>
  );
};

const SourceSelect = ({ value, onChange, method }: { value: string, onChange: (v: string) => void, method: 'Al-Quran' | 'Iqra' }) => (
  <div className="flex-1">
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 sm:h-10 px-3 sm:px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-xs sm:text-sm truncate shadow-sm">
      <option value="">{method === 'Al-Quran' ? 'Pilih Surah...' : 'Pilih Jilid...'}</option>
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
  
  const [tilawahMethod, setTilawahMethod] = useState<'Al-Quran' | 'Iqra'>('Al-Quran');
  const [tilawahFromSurah, setTilawahFromSurah] = useState(''); 
  const [tilawahFromVerse, setTilawahFromVerse] = useState<number | string>(''); 
  const [tilawahToSurah, setTilawahToSurah] = useState('');
  const [tilawahToVerse, setTilawahToVerse] = useState<number | string>(''); 
  const [tilawahTotal, setTilawahTotal] = useState({ pages: 0, lines: 0 });
  
  const [tilawahKlasikalMethod, setTilawahKlasikalMethod] = useState<'Al-Quran' | 'Iqra'>('Al-Quran');
  const [tilawahKlasikalFromSurah, setTilawahKlasikalFromSurah] = useState('');
  const [tilawahKlasikalFromVerse, setTilawahKlasikalFromVerse] = useState<number | string>(''); 
  const [tilawahKlasikalToSurah, setTilawahKlasikalToSurah] = useState('');
  const [tilawahKlasikalToVerse, setTilawahKlasikalToVerse] = useState<number | string>(''); 
  const [tilawahKlasikalTotal, setTilawahKlasikalTotal] = useState({ pages: 0, lines: 0 });

  const [tahfizhFromSurah, setTahfizhFromSurah] = useState(''); 
  const [tahfizhFromVerse, setTahfizhFromVerse] = useState<number | string>(''); 
  const [tahfizhToSurah, setTahfizhToSurah] = useState('');
  const [tahfizhToVerse, setTahfizhToVerse] = useState<number | string>(''); 
  const [tahfizhTotal, setTahfizhTotal] = useState({ pages: 0, lines: 0 });

  const [tahfizhKlasikalFromSurah, setTahfizhKlasikalFromSurah] = useState('');
  const [tahfizhKlasikalFromVerse, setTahfizhKlasikalFromVerse] = useState<number | string>(''); 
  const [tahfizhKlasikalToSurah, setTahfizhKlasikalToSurah] = useState('');
  const [tahfizhKlasikalToVerse, setTahfizhKlasikalToVerse] = useState<number | string>(''); 
  const [tahfizhKlasikalTotal, setTahfizhKlasikalTotal] = useState({ pages: 0, lines: 0 });

  const [baselineJuz, setBaselineJuz] = useState<number | string>(0);
  const [baselinePages, setBaselinePages] = useState<number | string>(0);
  const [baselineLines, setBaselineLines] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!teacherId) return;
      setIsLoading(true);
      try { const data = await getStudentsByTeacher(teacherId); setStudents(data); } finally { setIsLoading(false); }
    };
    loadData();
  }, [teacherId]);

  const safeNum = (val: string | number) => (typeof val === 'number' ? val : 0);

  // Kalkulasi Tilawah
  useEffect(() => {
    const result = calculateHafalan(tilawahFromSurah, safeNum(tilawahFromVerse), tilawahToSurah, safeNum(tilawahToVerse));
    setTilawahTotal(result);
  }, [tilawahMethod, tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse]);

  // Kalkulasi Tilawah Klasikal
  useEffect(() => {
    const result = calculateHafalan(tilawahKlasikalFromSurah, safeNum(tilawahKlasikalFromVerse), tilawahKlasikalToSurah, safeNum(tilawahKlasikalToVerse));
    setTilawahKlasikalTotal(result);
  }, [tilawahKlasikalMethod, tilawahKlasikalFromSurah, tilawahKlasikalFromVerse, tilawahKlasikalToSurah, tilawahKlasikalToVerse]);

  // Kalkulasi Tahfizh
  useEffect(() => {
    const result = calculateHafalan(tahfizhFromSurah, safeNum(tahfizhFromVerse), tahfizhToSurah, safeNum(tahfizhToVerse));
    setTahfizhTotal(result);
  }, [tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse]);

  // Kalkulasi Tahfizh Klasikal
  useEffect(() => {
    const result = calculateHafalan(tahfizhKlasikalFromSurah, safeNum(tahfizhKlasikalFromVerse), tahfizhKlasikalToSurah, safeNum(tahfizhKlasikalToVerse));
    setTahfizhKlasikalTotal(result);
  }, [tahfizhKlasikalFromSurah, tahfizhKlasikalFromVerse, tahfizhKlasikalToSurah, tahfizhKlasikalToVerse]);

  const handleSave = async () => {
    if (!studentId) { alert("Mohon pilih siswa terlebih dahulu."); return; }
    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return;
    const fmt = (surah: string, verse: number | string) => {
        if (!surah) return '-';
        return `${surah}: ${(typeof verse === 'string' && verse === '') ? '-' : verse}`;
    };
    const makeRange = (fs: string, fv: number | string, ts: string, tv: number | string) => {
        if (!fs && !ts) return '-';
        return `${fmt(fs, fv)} - ${fmt(ts, tv)}`;
    };
    setIsSaving(true);
    try {
      await addReport({
        studentId, studentName: selectedStudent.name, teacherId, className: selectedStudent.className, type: reportType, month, academicYear: '2025/2026', date: new Date().toISOString().split('T')[0], evaluation: '',
        tilawah: { method: tilawahMethod, individual: makeRange(tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse), classical: makeRange(tilawahKlasikalFromSurah, tilawahKlasikalFromVerse, tilawahKlasikalToSurah, tilawahKlasikalToVerse) },
        tahfizh: { individual: makeRange(tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse), classical: makeRange(tahfizhKlasikalFromSurah, tahfizhKlasikalFromVerse, tahfizhKlasikalToSurah, tahfizhKlasikalToVerse) },
        totalHafalan: reportType === 'Laporan Semester' ? { juz: safeNum(baselineJuz), pages: safeNum(baselinePages), lines: safeNum(baselineLines) } : undefined, 
        notes
      });
      alert("Laporan berhasil disimpan!");
    } catch (error) { console.error(error); alert("Gagal menyimpan laporan."); } finally { setIsSaving(false); }
  };

  const formatTotal = (total: { pages: number, lines: number }, method: string) => {
    if (method === 'Iqra') return `Total: ${total.pages} Halaman`;
    return `Total: ${total.pages} Hal ${total.lines} Baris`;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data siswa...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center px-1"><h2 className="text-2xl font-bold text-gray-900">Input Laporan</h2></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Tipe Laporan</label><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select></div>
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nama Siswa</label><select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"><option value="">-- Pilih Siswa --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.className}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Periode</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm">{reportType === 'Laporan Semester' ? (<><option value="Ganjil">Semester Ganjil</option><option value="Genap">Semester Genap</option></>) : (["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m}</option>))}</select></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
          <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2"><Book className="text-emerald-600" size={20} /><h3 className="font-bold text-emerald-700">Capaian Tahfizh</h3></div>
          <div className="p-5 sm:p-6 space-y-6">
            {reportType === 'Laporan Semester' && (
              <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50"><div className="flex items-center gap-2 mb-4"><Database size={16} className="text-emerald-600"/><h4 className="font-bold text-emerald-800 text-xs">Akumulasi Awal Semester</h4></div><div className="grid grid-cols-3 gap-2"><div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Juz</p><CounterInput value={baselineJuz} onChange={setBaselineJuz} /></div><div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Hal</p><CounterInput value={baselinePages} onChange={setBaselinePages} /></div><div className="text-center"><p className="text-[9px] font-bold text-emerald-600 mb-1 uppercase">Baris</p><CounterInput value={baselineLines} onChange={setBaselineLines} /></div></div></div>
            )}
            <div className="space-y-4"><div className="flex justify-between items-center mb-1"><h4 className="text-xs font-bold text-gray-800 border-l-4 border-emerald-500 pl-2">Individual (Sabaq)</h4><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{formatTotal(tahfizhTotal, 'Al-Quran')}</span></div><InputRow label="DARI"><SourceSelect value={tahfizhFromSurah} onChange={(v) => {setTahfizhFromSurah(v); if(!tahfizhToSurah) setTahfizhToSurah(v);}} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhFromVerse} onChange={setTahfizhFromVerse} /></InputRow><InputRow label="SAMPAI"><SourceSelect value={tahfizhToSurah} onChange={setTahfizhToSurah} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhToVerse} onChange={setTahfizhToVerse} /></InputRow></div>
            <div className="h-px bg-gray-50"></div>
            <div className="space-y-4"><div className="flex justify-between items-center mb-1"><h4 className="text-xs font-bold text-gray-800 border-l-4 border-emerald-300 pl-2">Klasikal</h4><span className="text-[10px] font-bold text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded">{formatTotal(tahfizhKlasikalTotal, 'Al-Quran')}</span></div><InputRow label="DARI"><SourceSelect value={tahfizhKlasikalFromSurah} onChange={(v) => {setTahfizhKlasikalFromSurah(v); if(!tahfizhKlasikalToSurah) setTahfizhKlasikalToSurah(v);}} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhKlasikalFromVerse} onChange={setTahfizhKlasikalFromVerse} /></InputRow><InputRow label="SAMPAI"><SourceSelect value={tahfizhKlasikalToSurah} onChange={setTahfizhKlasikalToSurah} method="Al-Quran" /><CounterInput label="Ayat" value={tahfizhKlasikalToVerse} onChange={setTahfizhKlasikalToVerse} /></InputRow></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
          <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex items-center gap-2"><BookOpen className="text-blue-600" size={20} /><h3 className="font-bold text-blue-700">Capaian Tilawah</h3></div>
          <div className="p-5 sm:p-6 space-y-6">
            <div className="space-y-4"><div className="flex justify-between items-center mb-1"><h4 className="text-xs font-bold text-gray-800 border-l-4 border-blue-500 pl-2">Individual</h4><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formatTotal(tilawahTotal, tilawahMethod)}</span></div><div className="flex gap-1.5 mb-2"><button onClick={() => setTilawahMethod('Al-Quran')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${tilawahMethod === 'Al-Quran' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahMethod('Iqra')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${tilawahMethod === 'Iqra' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-400'}`}>IQRA'</button></div><InputRow label="DARI"><SourceSelect value={tilawahFromSurah} onChange={(v) => {setTilawahFromSurah(v); if(!tilawahToSurah) setTilawahToSurah(v);}} method={tilawahMethod} /><CounterInput label={tilawahMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahFromVerse} onChange={setTilawahFromVerse} /></InputRow><InputRow label="SAMPAI"><SourceSelect value={tilawahToSurah} onChange={setTilawahToSurah} method={tilawahMethod} /><CounterInput label={tilawahMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahToVerse} onChange={setTilawahToVerse} /></InputRow></div>
            <div className="h-px bg-gray-50"></div>
            <div className="space-y-4"><div className="flex justify-between items-center mb-1"><h4 className="text-xs font-bold text-gray-800 border-l-4 border-blue-300 pl-2">Klasikal</h4><span className="text-[10px] font-bold text-blue-500 bg-blue-50/50 px-2 py-0.5 rounded">{formatTotal(tilawahKlasikalTotal, tilawahKlasikalMethod)}</span></div><div className="flex gap-1.5 mb-2"><button onClick={() => setTilawahKlasikalMethod('Al-Quran')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${tilawahKlasikalMethod === 'Al-Quran' ? 'bg-blue-400 text-white shadow-sm' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahKlasikalMethod('Iqra')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${tilawahKlasikalMethod === 'Iqra' ? 'bg-blue-400 text-white shadow-sm' : 'bg-gray-50 text-gray-400'}`}>IQRA'</button></div><InputRow label="DARI"><SourceSelect value={tilawahKlasikalFromSurah} onChange={(v) => {setTilawahKlasikalFromSurah(v); if(!tilawahKlasikalToSurah) setTilawahKlasikalToSurah(v);}} method={tilawahKlasikalMethod} /><CounterInput label={tilawahKlasikalMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahKlasikalFromVerse} onChange={setTilawahKlasikalFromVerse} /></InputRow><InputRow label="SAMPAI"><SourceSelect value={tilawahKlasikalToSurah} onChange={setTilawahKlasikalToSurah} method={tilawahKlasikalMethod} /><CounterInput label={tilawahKlasikalMethod === 'Al-Quran' ? 'Ayat' : 'Hal'} value={tilawahKlasikalToVerse} onChange={setTilawahKlasikalToVerse} /></InputRow></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Catatan Perkembangan</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tuliskan catatan perkembangan hafalan siswa bulan ini..." className="w-full h-28 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm placeholder:text-gray-300 shadow-sm"></textarea></div>
      <div className="px-2"><Button onClick={handleSave} className="w-full py-4 rounded-2xl shadow-lg shadow-primary-500/20 font-bold" isLoading={isSaving}>Simpan Laporan Sekarang</Button></div>
    </div>
  );
}

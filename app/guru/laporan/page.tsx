
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

// Helper Component for Counter Input - FIXED UI FOR MOBILE
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
    if (typeof value === 'string') {
      onChange(min);
    } else {
      onChange(Math.max(min, value - 1));
    }
  };

  const handleIncrement = () => {
    if (typeof value === 'string') {
      onChange(min + 1);
    } else {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button 
        onClick={handleDecrement}
        className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
        type="button"
      >
        <Minus size={16} className="sm:w-3.5 sm:h-3.5" />
      </button>
      
      <input
        type="number"
        min={min}
        value={value}
        placeholder="-"
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            onChange('');
          } else {
            const num = parseInt(val);
            if (!isNaN(num)) onChange(num);
          }
        }}
        className="w-12 sm:w-16 text-center font-bold border border-gray-200 py-2 sm:py-1.5 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300 text-base sm:text-sm"
      />
      
      <button 
        onClick={handleIncrement}
        className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
        type="button"
      >
        <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
      </button>
      
      {label && <span className="hidden sm:inline text-xs text-gray-400 ml-1">{label}</span>}
    </div>
  );
};

// Helper for Surah/Volume Selector
const SourceSelect = ({ 
  value, 
  onChange, 
  label, 
  method 
}: { 
  value: string, 
  onChange: (v: string) => void, 
  label: string,
  method: 'Al-Quran' | 'Iqra'
}) => (
  <div className="flex-1">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white text-sm"
    >
      <option value="">{method === 'Al-Quran' ? 'Pilih Surah...' : 'Pilih Jilid...'}</option>
      {method === 'Al-Quran' ? (
        SURAH_LIST.map((s, index) => (
          <option key={s} value={s}>{index + 1}. {s}</option>
        ))
      ) : (
        IQRA_VOLUMES.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))
      )}
    </select>
  </div>
);

export default function GuruLaporanPage({ teacherId = '1' }: GuruLaporanPageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [studentId, setStudentId] = useState('');
  const [month, setMonth] = useState('Desember');
  
  // Tilawah State (Individual)
  const [tilawahMethod, setTilawahMethod] = useState<'Al-Quran' | 'Iqra'>('Al-Quran');
  const [tilawahFromSurah, setTilawahFromSurah] = useState(''); 
  const [tilawahFromVerse, setTilawahFromVerse] = useState<number | string>(''); 
  const [tilawahToSurah, setTilawahToSurah] = useState('');
  const [tilawahToVerse, setTilawahToVerse] = useState<number | string>(''); 
  const [tilawahTotal, setTilawahTotal] = useState({ pages: 0, lines: 0 });
  
  // Tilawah State (Klasikal)
  const [tilawahKlasikalMethod, setTilawahKlasikalMethod] = useState<'Al-Quran' | 'Iqra'>('Al-Quran');
  const [tilawahKlasikalFromSurah, setTilawahKlasikalFromSurah] = useState('');
  const [tilawahKlasikalFromVerse, setTilawahKlasikalFromVerse] = useState<number | string>(''); 
  const [tilawahKlasikalToSurah, setTilawahKlasikalToSurah] = useState('');
  const [tilawahKlasikalToVerse, setTilawahKlasikalToVerse] = useState<number | string>(''); 
  const [tilawahKlasikalTotal, setTilawahKlasikalTotal] = useState({ pages: 0, lines: 0 });

  // Tahfizh State
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

  // Baseline Data
  const [baselineJuz, setBaselineJuz] = useState<number | string>(0);
  const [baselinePages, setBaselinePages] = useState<number | string>(0);
  const [baselineLines, setBaselineLines] = useState<number | string>(0);

  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!teacherId) return;
      setIsLoading(true);
      try {
        const data = await getStudentsByTeacher(teacherId);
        setStudents(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [teacherId]);

  useEffect(() => {
    if (reportType === 'Laporan Semester') {
      setMonth('Ganjil');
    } else {
      setMonth('Desember');
    }
  }, [reportType]);

  useEffect(() => {
    setTilawahFromSurah('');
    setTilawahToSurah('');
    setTilawahFromVerse('');
    setTilawahToVerse('');
  }, [tilawahMethod]);

  useEffect(() => {
    setTilawahKlasikalFromSurah('');
    setTilawahKlasikalToSurah('');
    setTilawahKlasikalFromVerse('');
    setTilawahKlasikalToVerse('');
  }, [tilawahKlasikalMethod]);

  const safeNum = (val: string | number) => (typeof val === 'number' ? val : 0);

  useEffect(() => {
    const result = calculateHafalan(
      tilawahFromSurah, safeNum(tilawahFromVerse), 
      tilawahToSurah, safeNum(tilawahToVerse)
    );
    setTilawahTotal(result);
  }, [tilawahMethod, tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse]);

  useEffect(() => {
    const result = calculateHafalan(
      tilawahKlasikalFromSurah, safeNum(tilawahKlasikalFromVerse), 
      tilawahKlasikalToSurah, safeNum(tilawahKlasikalToVerse)
    );
    setTilawahKlasikalTotal(result);
  }, [tilawahKlasikalFromSurah, tilawahKlasikalFromVerse, tilawahKlasikalToSurah, tilawahKlasikalToVerse]);

  // FIX: Menggunakan tahfizhToVerse untuk ayat akhir (Sampai Ayat)
  useEffect(() => {
    const result = calculateHafalan(
      tahfizhFromSurah, safeNum(tahfizhFromVerse), 
      tahfizhToSurah, safeNum(tahfizhToVerse)
    );
    setTahfizhTotal(result);
  }, [tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse]);

  useEffect(() => {
    const result = calculateHafalan(
      tahfizhKlasikalFromSurah, safeNum(tahfizhKlasikalFromVerse), 
      tahfizhKlasikalToSurah, safeNum(tahfizhKlasikalToVerse)
    );
    setTahfizhKlasikalTotal(result);
  }, [tahfizhKlasikalFromSurah, tahfizhKlasikalFromVerse, tahfizhKlasikalToSurah, tahfizhKlasikalToVerse]);

  const handleTilawahFromSurahChange = (val: string) => {
    setTilawahFromSurah(val);
    setTilawahToSurah(val);
  };
  const handleTilawahFromVerseChange = (val: number | string) => {
    setTilawahFromVerse(val);
    setTilawahToVerse(val);
  };

  const handleTilawahKlasikalFromSurahChange = (val: string) => {
    setTilawahKlasikalFromSurah(val);
    setTilawahKlasikalToSurah(val);
  };
  const handleTilawahKlasikalFromVerseChange = (val: number | string) => {
    setTilawahKlasikalFromVerse(val);
    setTilawahKlasikalToVerse(val);
  };

  const handleTahfizhFromSurahChange = (val: string) => {
    setTahfizhFromSurah(val);
    setTahfizhToSurah(val);
  };
  const handleTahfizhFromVerseChange = (val: number | string) => {
    setTahfizhFromVerse(val);
    setTahfizhToVerse(val);
  };

  const handleTahfizhKlasikalFromSurahChange = (val: string) => {
    setTahfizhKlasikalFromSurah(val);
    setTahfizhKlasikalToSurah(val);
  };
  const handleTahfizhKlasikalFromVerseChange = (val: number | string) => {
    setTahfizhKlasikalFromVerse(val);
    setTahfizhKlasikalToVerse(val);
  };

  const handleSave = async () => {
    if (!studentId) {
      alert("Mohon pilih siswa terlebih dahulu.");
      return;
    }

    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return;

    const fmt = (surah: string, verse: number | string) => {
        if (!surah) return '-';
        return `${surah}: ${(typeof verse === 'string' && verse === '') ? '-' : verse}`;
    };

    const makeRange = (fromSurah: string, fromVerse: number | string, toSurah: string, toVerse: number | string) => {
        if (!fromSurah && !toSurah) return '-';
        return `${fmt(fromSurah, fromVerse)} - ${fmt(toSurah, toVerse)}`;
    };

    setIsSaving(true);
    try {
      await addReport({
        studentId,
        studentName: selectedStudent.name,
        teacherId,
        className: selectedStudent.className,
        type: reportType,
        month,
        academicYear: '2025/2026',
        date: new Date().toISOString().split('T')[0],
        evaluation: '',
        tilawah: {
          method: tilawahMethod,
          individual: makeRange(tilawahFromSurah, tilawahFromVerse, tilawahToSurah, tilawahToVerse),
          classical: makeRange(tilawahKlasikalFromSurah, tilawahKlasikalFromVerse, tilawahKlasikalToSurah, tilawahKlasikalToVerse)
        },
        tahfizh: {
          individual: makeRange(tahfizhFromSurah, tahfizhFromVerse, tahfizhToSurah, tahfizhToVerse),
          classical: makeRange(tahfizhKlasikalFromSurah, tahfizhKlasikalFromVerse, tahfizhKlasikalToSurah, tahfizhKlasikalToVerse)
        },
        totalHafalan: reportType === 'Laporan Semester' ? {
          juz: safeNum(baselineJuz),
          pages: safeNum(baselinePages),
          lines: safeNum(baselineLines)
        } : undefined, 
        notes
      });
      
      alert("Laporan berhasil disimpan ke database!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  const getLabel = (method: string) => method === 'Al-Quran' ? 'Ayat' : 'Hal';
  const formatTotal = (total: { pages: number, lines: number }) => `Total: ${total.pages} Halaman ${total.lines} Baris`;

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat data siswa...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Input Laporan</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Laporan</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="Laporan Bulanan">Laporan Bulanan</option>
              <option value="Laporan Semester">Laporan Semester</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
            <select 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              {reportType === 'Laporan Semester' ? (
                <>
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </>
              ) : (
                <>
                  <option value="Juli">Juli</option>
                  <option value="Agustus">Agustus</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                  <option value="November">November</option>
                  <option value="Desember">Desember</option>
                  <option value="Januari">Januari</option>
                  <option value="Februari">Februari</option>
                  <option value="Maret">Maret</option>
                  <option value="April">April</option>
                  <option value="Mei">Mei</option>
                  <option value="Juni">Juni</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
          Tahun Ajaran: 2025/2026 <span className="mx-2 text-gray-300">|</span> Periode: <span className="text-gray-900 font-medium">{month}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden">
          <div className="bg-teal-50 px-6 py-4 border-b border-teal-100 flex items-center gap-2">
            <Book className="text-teal-600" size={20} />
            <h3 className="font-bold text-teal-700">Capaian Tahfizh</h3>
          </div>
          <div className="p-6 space-y-8">
            {reportType === 'Laporan Semester' && (
              <div className="bg-teal-50/60 p-4 sm:p-5 rounded-xl border border-teal-200 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-teal-100 text-teal-700 rounded-lg shrink-0"><Database size={18} /></div>
                  <div>
                    <h4 className="font-bold text-teal-800 text-sm">Total Hafalan Akumulasi</h4>
                    <p className="text-[10px] sm:text-xs text-teal-600 mt-1">Gunakan ini untuk menetapkan data awal semester.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-6 sm:gap-4 mt-6">
                   <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center bg-white/40 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <span className="text-[10px] font-bold text-teal-700 sm:mb-2 uppercase tracking-widest sm:text-center px-2">Juz</span>
                      <CounterInput value={baselineJuz} onChange={setBaselineJuz} />
                   </div>
                   <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center bg-white/40 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <span className="text-[10px] font-bold text-teal-700 sm:mb-2 uppercase tracking-widest sm:text-center px-2">Hal</span>
                      <CounterInput value={baselinePages} onChange={setBaselinePages} />
                   </div>
                   <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center bg-white/40 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <span className="text-[10px] font-bold text-teal-700 sm:mb-2 uppercase tracking-widest sm:text-center px-2">Baris</span>
                      <CounterInput value={baselineLines} onChange={setBaselineLines} />
                   </div>
                </div>
              </div>
            )}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 border-l-4 border-teal-600 pl-3"><h4 className="font-bold text-gray-800">Capaian Periode Ini</h4></div>
                <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-2 py-1 rounded-md font-medium">{formatTotal(tahfizhTotal)}</span>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="DARI" value={tahfizhFromSurah} onChange={handleTahfizhFromSurahChange} method="Al-Quran" />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label="Ayat" value={tahfizhFromVerse} onChange={handleTahfizhFromVerseChange} />
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="SAMPAI" value={tahfizhToSurah} onChange={setTahfizhToSurah} method="Al-Quran" />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label="Ayat" value={tahfizhToVerse} onChange={setTahfizhToVerse} />
                   </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-100"></div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 border-l-4 border-teal-600 pl-3">
                  <h4 className="font-bold text-gray-800">Metode Klasikal</h4>
                </div>
                <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-2 py-1 rounded-md font-medium">{formatTotal(tahfizhKlasikalTotal)}</span>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="DARI" value={tahfizhKlasikalFromSurah} onChange={handleTahfizhKlasikalFromSurahChange} method="Al-Quran" />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label="Ayat" value={tahfizhKlasikalFromVerse} onChange={handleTahfizhKlasikalFromVerseChange} />
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="SAMPAI" value={tahfizhKlasikalToSurah} onChange={setTahfizhKlasikalToSurah} method="Al-Quran" />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label="Ayat" value={tahfizhKlasikalToVerse} onChange={setTahfizhKlasikalToVerse} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center gap-2">
            <BookOpen className="text-orange-500" size={20} />
            <h3 className="font-bold text-orange-600">Capaian Tilawah</h3>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 border-l-4 border-primary-600 pl-3"><h4 className="font-bold text-gray-800">Metode Individual</h4></div>
                <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-2 py-1 rounded-md font-medium">{formatTotal(tilawahTotal)}</span>
              </div>
              <div className="flex gap-2 mb-6">
                 <button onClick={() => setTilawahMethod('Al-Quran')} className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-medium transition-all ${tilawahMethod === 'Al-Quran' ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Al-Qur'an</button>
                 <button onClick={() => setTilawahMethod('Iqra')} className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-medium transition-all ${tilawahMethod === 'Iqra' ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Iqra'</button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="DARI" value={tilawahFromSurah} onChange={handleTilawahFromSurahChange} method={tilawahMethod} />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label={getLabel(tilawahMethod)} value={tilawahFromVerse} onChange={handleTilawahFromVerseChange} />
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="SAMPAI" value={tilawahToSurah} onChange={setTilawahToSurah} method={tilawahMethod} />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label={getLabel(tilawahMethod)} value={tilawahToVerse} onChange={setTilawahToVerse} />
                   </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-100"></div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 border-l-4 border-primary-600 pl-3"><h4 className="font-bold text-gray-800">Metode Klasikal</h4></div>
                <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-xs px-2 py-1 rounded-md font-medium">{formatTotal(tilawahKlasikalTotal)}</span>
              </div>
              <div className="flex gap-2 mb-6">
                 <button onClick={() => setTilawahKlasikalMethod('Al-Quran')} className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-medium transition-all ${tilawahKlasikalMethod === 'Al-Quran' ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Al-Qur'an</button>
                 <button onClick={() => setTilawahKlasikalMethod('Iqra')} className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg font-medium transition-all ${tilawahKlasikalMethod === 'Iqra' ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>Iqra'</button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="DARI" value={tilawahKlasikalFromSurah} onChange={handleTilawahKlasikalFromSurahChange} method={tilawahKlasikalMethod} />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label={getLabel(tilawahKlasikalMethod)} value={tilawahKlasikalFromVerse} onChange={handleTilawahKlasikalFromVerseChange} />
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                   <SourceSelect label="SAMPAI" value={tilawahKlasikalToSurah} onChange={setTilawahKlasikalToSurah} method={tilawahKlasikalMethod} />
                   <div className="flex justify-end sm:mb-0.5">
                      <CounterInput label={getLabel(tilawahKlasikalMethod)} value={tilawahKlasikalToVerse} onChange={setTilawahKlasikalToVerse} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Catatan Tambahan</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan perkembangan siswa..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-base"
        ></textarea>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="w-full sm:w-auto px-8 py-3" isLoading={isSaving}>Simpan Laporan</Button>
      </div>
    </div>
  );
}

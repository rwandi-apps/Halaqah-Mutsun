
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Student, Report } from '../../../types';
import { getStudentsByTeacher, saveSDQReport } from '../../../services/firestoreService';
import { SURAH_LIST } from '../../../services/mockBackend';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Button } from '../../../components/Button';
import { BookOpen, Book, Plus, Minus, UserCheck, Loader2, Users } from 'lucide-react';

interface GuruLaporanPageProps {
  teacherId?: string;
}

const Iqra_VOLUMES = ["Iqra' 1", "Iqra' 2", "Iqra' 3", "Iqra' 4", "Iqra' 5", "Iqra' 6"];
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
      {method === 'Al-Quran' ? SURAH_LIST.map((s, i) => <option key={s} value={s}>{i + 1}. {s}</option>) : Iqra_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
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
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reportType, setReportType] = useState('Laporan Bulanan');
  const [studentId, setStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [month, setMonth] = useState('Desember');
  
  const [tahfizhIndiv, setTahfizhIndiv] = useState({ fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tilawahIndiv, setTilawahIndiv] = useState({ method: 'Al-Quran' as 'Al-Quran' | 'Iqra', fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tahfizhKlas, setTahfizhKlas] = useState({ fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [tilawahKlas, setTilawahKlas] = useState({ method: 'Al-Quran' as 'Al-Quran' | 'Iqra', fs: '', fv: '' as any, ts: '', tv: '' as any });
  const [baselineJuz, setBaselineJuz] = useState<number | string>(0);
  const [baselinePages, setBaselinePages] = useState<number | string>(0);
  const [baselineLines, setBaselineLines] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  const safeNum = (val: any) => (val === '' ? 0 : Number(val));

  useEffect(() => {
    if (!teacherId) return;
    getStudentsByTeacher(teacherId).then(data => { setStudents(data); setIsLoading(false); });
  }, [teacherId]);

  const getResultText = (data: any, method: string) => {
    if (!data.fs || !data.ts) return '';
    const res = SDQQuranEngine.calculate(data.fs, safeNum(data.fv), data.ts, safeNum(data.tv));
    if (!res.valid) return '';
    return method === 'Iqra' ? `${res.pages} Hal` : `${res.pages} Hal ${res.lines} Baris`;
  };

  const handleSave = async () => {
    if (!studentId) return alert("Pilih siswa.");
    const selectedStudent = students.find(s => s.id === studentId);
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const tfRes = getResultText(tahfizhIndiv, 'Al-Quran');
      const tlRes = getResultText(tilawahIndiv, tilawahIndiv.method);
      const fmt = (s: string, v: any) => (s ? `${s}: ${v === '' ? '-' : v}` : '-');
      const makeRange = (data: any) => (!data.fs && !data.ts ? '-' : `${fmt(data.fs, data.fv)} - ${fmt(data.ts, data.tv)}`);
      await saveSDQReport({
        studentId, studentName: selectedStudent.name, teacherId: teacherId || '', className: selectedStudent.className, 
        type: reportType, month, academicYear, date: new Date().toISOString().split('T')[0], evaluation: '',
        attendance: 100, behaviorScore: 10,
        tilawah: { method: tilawahIndiv.method, individual: makeRange(tilawahIndiv), classical: makeRange(tilawahKlas), result: tlRes || "-" },
        tahfizh: { individual: makeRange(tahfizhIndiv), classical: makeRange(tahfizhKlas), result: tfRes || "-" },
        totalHafalan: { juz: safeNum(baselineJuz), pages: safeNum(baselinePages), lines: safeNum(baselineLines) },
        notes
      });
      alert("Laporan berhasil disimpan!");
      navigate('/guru/view-report');
    } catch (e) { alert("Gagal."); } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-2">
      <h2 className="text-2xl font-bold text-gray-900">Input Laporan Halaqah</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="p-2 border rounded-xl bg-white text-sm">{ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="p-2 border rounded-xl bg-white text-sm"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-2 border rounded-xl bg-white text-sm">
          {reportType === 'Laporan Semester' ? ["Ganjil", "Genap"].map(s => <option key={s} value={s}>Semester {s}</option>) : MONTH_LIST.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* KLASIKAL SECTION (DI ATAS) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-2 text-blue-600"><Users size={20}/><h3 className="font-bold text-gray-800 text-sm uppercase">Capaian Klasikal (Kelompok)</h3></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2"><Book size={16} /> Tahfizh Klasikal</h4>
              <InputRow label="DARI" badge={getResultText(tahfizhKlas, 'Al-Quran')}>
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
              <div className="flex gap-2"><button onClick={() => setTilawahKlas({...tilawahKlas, method: 'Al-Quran'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahKlas.method === 'Al-Quran' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahKlas({...tilawahKlas, method: 'Iqra'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahKlas.method === 'Iqra' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>Iqra'</button></div>
              <InputRow label="DARI" badge={getResultText(tilawahKlas, tilawahKlas.method)}>
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-2 text-emerald-600"><UserCheck size={20}/><h3 className="font-bold text-gray-800 text-sm uppercase">Capaian Individu Siswa</h3></div>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-white text-sm"><option value="">-- Pilih Siswa --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2"><Book size={16} /> Tahfizh Individu</h4>
              <InputRow label="DARI" badge={getResultText(tahfizhIndiv, 'Al-Quran')}>
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
              <div className="flex gap-2"><button onClick={() => setTilawahIndiv({...tilawahIndiv, method: 'Al-Quran'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahIndiv.method === 'Al-Quran' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>AL-QUR'AN</button><button onClick={() => setTilawahIndiv({...tilawahIndiv, method: 'Iqra'})} className={`flex-1 py-1 text-[9px] font-bold rounded-lg ${tilawahIndiv.method === 'Iqra' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>Iqra'</button></div>
              <InputRow label="DARI" badge={getResultText(tilawahIndiv, tilawahIndiv.method)}>
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
      <Button onClick={handleSave} className="w-full py-4 rounded-2xl shadow-lg font-bold" isLoading={isSaving} disabled={!studentId}>Simpan Laporan Lengkap</Button>
    </div>
  );
}
export default GuruLaporanPage;

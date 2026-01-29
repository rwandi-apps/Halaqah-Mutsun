import React, { useEffect, useMemo, useState } from 'react';
import { Report, User } from '../../../types';
import {
  getAllTeachers,
  subscribeToReportsByTeacher
} from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ACADEMIC_YEARS = ['2023/2024', '2024/2025', '2025/2026'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatRange = (raw?: string) => {
  if (!raw || raw === '-') return '-';
  return raw.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
};

const getResult = (r: Report, key: 'tilawah' | 'tahfizh') => {
  const stored = r[key]?.result;
  if (stored && stored !== '-') return stored;

  const range = formatRange(r[key]?.individual);
  if (range === '-') return '-';

  const res = SDQQuranEngine.parseAndCalculate(range, key);
  if (!res.valid) return '-';
  return res.isIqra
    ? `${res.pages} Hal`
    : `${res.pages} Hal ${res.lines} Baris`;
};

const statusBadge = (r: Report) => {
  const res = getResult(r, 'tahfizh');
  const m = res.match(/(\d+)\s*Hal/);
  const h = m ? parseInt(m[1]) : 0;

  if (h >= 2) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 font-black text-[8px]">
        <CheckCircle2 size={10}/> TERCAPAI
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-orange-500 font-black text-[8px]">
      <AlertCircle size={10}/> BELUM
    </span>
  );
};

const totalHafalan = (t: any) => {
  if (!t) return '-';
  const arr = [];
  if (t.juz) arr.push(`${t.juz} Juz`);
  if (t.pages) arr.push(`${t.pages} Hal`);
  if (t.lines) arr.push(`${t.lines} Baris`);
  return arr.join(' ') || '-';
};

export default function CoordinatorViewReportPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState('2025/2026');
  const [type, setType] = useState<'Bulanan' | 'Semester'>('Bulanan');
  const [month, setMonth] = useState('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [search, setSearch] = useState('');

  /** LOAD GURU */
  useEffect(() => {
    getAllTeachers().then(d => {
      const g = d.filter(u => u.role === 'GURU');
      setTeachers(g);
      if (g.length) setTeacherId(g[0].id);
    });
  }, []);

  /** LOAD LAPORAN */
  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    return subscribeToReportsByTeacher(teacherId, d => {
      setReports(d);
      setLoading(false);
    });
  }, [teacherId]);

  /** FILTER FINAL */
  const filtered = useMemo(() => {
    let r = reports.filter(x => x.academicYear === year);

    if (type === 'Bulanan') {
      r = r.filter(x => x.type === 'Laporan Bulanan');
      if (month) r = r.filter(x => x.month === month);
    } else {
      r = r.filter(x => x.type === 'Laporan Semester');
      r = r.filter(x => x.month === semester);
    }

    if (search) {
      r = r.filter(x =>
        x.studentName.toLowerCase().includes(search.toLowerCase())
      );
    }

    return r;
  }, [reports, year, type, month, semester, search]);

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-black uppercase">Monitoring Laporan Guru</h2>

      {/* FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border">
        <select value={teacherId} onChange={e => setTeacherId(e.target.value)}>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.nickname || t.name}
            </option>
          ))}
        </select>

        <select value={year} onChange={e => setYear(e.target.value)}>
          {ACADEMIC_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>

        <select
          value={type}
          onChange={e => {
            setType(e.target.value as any);
            setMonth('');
          }}
        >
          <option>Bulanan</option>
          <option>Semester</option>
        </select>

        {type === 'Bulanan' ? (
          <select value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        ) : (
          <select value={semester} onChange={e => setSemester(e.target.value as any)}>
            <option>Ganjil</option>
            <option>Genap</option>
          </select>
        )}

        <div className="relative col-span-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari siswa..."
            className="pl-7 w-full"
          />
        </div>
      </div>

      {/* TABLE — IDENTIK GURU */}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="bg-[#155e75] text-white uppercase font-black text-center">
              <th rowSpan={2}>No</th>
              <th rowSpan={2} className="text-left">Nama</th>
              <th rowSpan={2}>Hadir</th>
              <th rowSpan={2}>Sikap</th>
              <th rowSpan={2}>Total Hafalan</th>
              <th colSpan={3}>Tilawah</th>
              <th colSpan={3}>Tahfizh</th>
              <th rowSpan={2}>Ket</th>
              <th rowSpan={2}>Catatan</th>
            </tr>
            <tr className="bg-[#155e75] text-white">
              <th>Klasikal</th>
              <th>Individual</th>
              <th>Hasil</th>
              <th>Klasikal</th>
              <th>Individual</th>
              <th>Hasil</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className="p-12 text-center"><Loader2 className="animate-spin mx-auto"/></td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td>{i + 1}</td>
                <td className="font-black uppercase">{r.studentName}</td>
                <td>{r.attendance}%</td>
                <td>{r.behaviorScore}</td>
                <td>{totalHafalan(r.totalHafalan)}</td>
                <td>{formatRange(r.tilawah?.classical)}</td>
                <td>{formatRange(r.tilawah?.individual)}</td>
                <td className="font-black text-blue-600">{getResult(r,'tilawah')}</td>
                <td>{formatRange(r.tahfizh?.classical)}</td>
                <td>{formatRange(r.tahfizh?.individual)}</td>
                <td className="font-black text-emerald-600">{getResult(r,'tahfizh')}</td>
                <td>{statusBadge(r)}</td>
                <td className="italic max-w-[200px] truncate">{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !filtered.length && (
          <p className="p-6 text-center text-gray-400">Tidak ada data</p>
        )}
      </div>
    </div>
  );
}

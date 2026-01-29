import React, { useEffect, useMemo, useState } from 'react';
import { Report, User } from '../../../types';
import {
  getAllTeachers,
  subscribeToReportsByTeacher
} from '../../../services/firestoreService';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

type ReportType = 'BULANAN' | 'SEMESTER';

const formatTotalHafalan = (t: any) => {
  if (!t) return '-';
  const arr = [];
  if (t.juz) arr.push(`${t.juz} Juz`);
  if (t.pages) arr.push(`${t.pages} Hal`);
  if (t.lines) arr.push(`${t.lines} Baris`);
  return arr.join(' ') || '-';
};

const formatRange = (v?: string) => {
  if (!v) return '-';
  return v.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
};

export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [reports, setReports] = useState<Report[]>([]);

  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [reportType, setReportType] = useState<ReportType>('BULANAN');
  const [month, setMonth] = useState('');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap' | ''>('');
  const [search, setSearch] = useState('');

  /** LOAD GURU */
  useEffect(() => {
    getAllTeachers().then(res => {
      const g = res.filter(u => u.role === 'GURU');
      setTeachers(g);
      if (g.length) setSelectedTeacherId(g[0].id);
    });
  }, []);

  /** LOAD LAPORAN */
  useEffect(() => {
    if (!selectedTeacherId) return;
    return subscribeToReportsByTeacher(selectedTeacherId, setReports);
  }, [selectedTeacherId]);

  /** FILTER */
  const filtered = useMemo(() => {
    let r = reports.filter(x => x.academicYear === academicYear);

    if (reportType === 'BULANAN') {
      r = r.filter(x => x.type === 'Laporan Bulanan');
      if (month) r = r.filter(x => x.month === month);
    }

    if (reportType === 'SEMESTER') {
      r = r.filter(x => x.type === 'Laporan Semester');
      if (semester) r = r.filter(x => x.month === semester);
    }

    if (search) {
      r = r.filter(x =>
        x.studentName.toLowerCase().includes(search.toLowerCase())
      );
    }

    return r;
  }, [reports, academicYear, reportType, month, semester, search]);

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-black uppercase">Monitoring Laporan Guru</h2>

      {/* FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-white p-3 border rounded">
        <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.nickname || t.name}
            </option>
          ))}
        </select>

        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} />

        <select
          value={reportType}
          onChange={e => {
            setReportType(e.target.value as any);
            setMonth('');
            setSemester('');
          }}
        >
          <option value="BULANAN">Bulanan</option>
          <option value="SEMESTER">Semester</option>
        </select>

        {reportType === 'BULANAN' ? (
          <select value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        ) : (
          <select value={semester} onChange={e => setSemester(e.target.value as any)}>
            <option value="">Pilih Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        )}

        <input
          placeholder="Cari siswa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE — PERSIS GURU */}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="bg-[#155e75] text-white uppercase font-black text-center">
              <th rowSpan={2}>No</th>
              <th rowSpan={2} className="text-left">Nama Siswa</th>
              <th rowSpan={2}>Hadir</th>
              <th rowSpan={2}>Sikap</th>
              <th rowSpan={2}>Jml Hafalan</th>
              <th colSpan={3}>Tilawah</th>
              <th colSpan={3}>Tahfizh</th>
              <th rowSpan={2}>Ket</th>
              <th rowSpan={2}>Catatan</th>
            </tr>
            <tr className="bg-[#155e75] text-white text-center">
              <th>Klasikal</th>
              <th>Individual</th>
              <th>Hasil</th>
              <th>Klasikal</th>
              <th>Individual</th>
              <th>Hasil</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="text-center">{i + 1}</td>
                <td className="font-black uppercase">{r.studentName}</td>
                <td className="text-center">{r.attendance}%</td>
                <td className="text-center">{r.behaviorScore}</td>
                <td>{formatTotalHafalan(r.totalHafalan)}</td>

                <td>{formatRange(r.tilawah?.classical)}</td>
                <td>{formatRange(r.tilawah?.individual)}</td>
                <td className="font-black">{r.tilawah?.result || '-'}</td>

                <td>{formatRange(r.tahfizh?.classical)}</td>
                <td>{formatRange(r.tahfizh?.individual)}</td>
                <td className="font-black">{r.tahfizh?.result || '-'}</td>

                <td>-</td>
                <td className="italic max-w-[220px] truncate">{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <p className="p-4 text-center text-gray-400">Tidak ada laporan</p>
        )}
      </div>
    </div>
  );
}

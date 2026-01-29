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

const formatTotalHafalan = (total: any) => {
  if (!total) return '-';
  const arr = [];
  if (total.juz) arr.push(`${total.juz} Juz`);
  if (total.pages) arr.push(`${total.pages} Hal`);
  if (total.lines) arr.push(`${total.lines} Baris`);
  return arr.join(' ');
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
      const gurus = res.filter(u => u.role === 'GURU');
      setTeachers(gurus);
      if (gurus.length) setSelectedTeacherId(gurus[0].id);
    });
  }, []);

  /** LOAD LAPORAN (REAL FIRESTORE) */
  useEffect(() => {
    if (!selectedTeacherId) return;
    return subscribeToReportsByTeacher(
      selectedTeacherId,
      data => setReports(data)
    );
  }, [selectedTeacherId]);

  /** FILTER */
  const filtered = useMemo(() => {
    let r = [...reports];

    r = r.filter(x => x.academicYear === academicYear);

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
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Monitoring Laporan Guru</h2>

      {/* FILTER */}
      <div className="grid md:grid-cols-6 gap-2 bg-white p-3 border rounded">
        <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.nickname || t.name}</option>
          ))}
        </select>

        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} />

        <select value={reportType} onChange={e => {
          setReportType(e.target.value as any);
          setMonth('');
          setSemester('');
        }}>
          <option value="BULANAN">Bulanan</option>
          <option value="SEMESTER">Semester</option>
        </select>

        {reportType === 'BULANAN' && (
          <select value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        )}

        {reportType === 'SEMESTER' && (
          <select value={semester} onChange={e => setSemester(e.target.value as any)}>
            <option value="">Pilih Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        )}

        <input placeholder="Cari siswa..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* TABLE – SAMA DENGAN GURU */}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-xs">
          <thead className="bg-teal-700 text-white">
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Hadir</th>
              <th>Sikap</th>
              <th>Tilawah Klasikal</th>
              <th>Tilawah Individu</th>
              <th>Tahfizh Klasikal</th>
              <th>Tahfizh Individu</th>
              <th>Total Hafalan</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td>{i + 1}</td>
                <td className="font-bold">{r.studentName}</td>
                <td>{r.attendance}%</td>
                <td>{r.behaviorScore}</td>
                <td>{r.tilawah?.classical || '-'}</td>
                <td>{r.tilawah?.individual || '-'}</td>
                <td>{r.tahfizh?.classical || '-'}</td>
                <td>{r.tahfizh?.individual || '-'}</td>
                <td>{formatTotalHafalan(r.totalHafalan)}</td>
                <td className="italic">{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <p className="p-4 text-center text-gray-400">
            Tidak ada laporan
          </p>
        )}
      </div>
    </div>
  );
}

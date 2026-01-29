import React, { useEffect, useMemo, useState } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

type ReportType = 'BULANAN' | 'SEMESTER';

const formatTotalHafalan = (total: any) => {
  if (!total) return '-';
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  return parts.join(' ') || '0';
};

export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [reports, setReports] = useState<Report[]>([]);

  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [reportType, setReportType] = useState<ReportType>('BULANAN');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap' | ''>('');
  const [search, setSearch] = useState('');

  /** ======================
   * LOAD TEACHERS
   ======================= */
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      if (onlyTeachers.length) setSelectedTeacherId(onlyTeachers[0].id);
    });
  }, []);

  /** ======================
   * SUBSCRIBE REPORTS
   ======================= */
  useEffect(() => {
    if (!selectedTeacherId) return;

    const unsub = subscribeToReportsByTeacher(selectedTeacherId, data => {
      setReports(data);
    });

    return () => unsub();
  }, [selectedTeacherId]);

  /** ======================
   * FILTER LOGIC (FINAL & BENAR)
   ======================= */
  const filteredReports = useMemo(() => {
    let result = [...reports];

    // 1️⃣ Tahun Ajaran (WAJIB)
    result = result.filter(r => r.academicYear === academicYear);

    // 2️⃣ Tipe Laporan
    if (reportType === 'BULANAN') {
      result = result.filter(r => r.type === 'Laporan Bulanan');

      if (selectedMonth) {
        result = result.filter(r => r.month === selectedMonth);
      }
    }

    if (reportType === 'SEMESTER') {
      result = result.filter(r => r.type === 'Laporan Semester');

      if (selectedSemester) {
        result = result.filter(r => r.month === selectedSemester);
      }
    }

    // 3️⃣ Search siswa
    if (search) {
      result = result.filter(r =>
        r.studentName.toLowerCase().includes(search.toLowerCase())
      );
    }

    return result;
  }, [
    reports,
    academicYear,
    reportType,
    selectedMonth,
    selectedSemester,
    search
  ]);

  /** ======================
   * ENGINE RESULT
   ======================= */
  const getResult = (report: Report, category: 'tahfizh' | 'tilawah') => {
    if (report[category]?.result) return report[category].result;

    const res = SDQQuranEngine.parseAndCalculate(
      report[category]?.individual || ''
    );

    return res.valid ? `${res.pages} Hal ${res.lines} Baris` : '-';
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Monitoring Laporan Guru</h2>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border">

        <select
          value={selectedTeacherId}
          onChange={e => setSelectedTeacherId(e.target.value)}
          className="p-2 border rounded"
        >
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.nickname || t.name}
            </option>
          ))}
        </select>

        <input
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          placeholder="2025/2026"
          className="p-2 border rounded"
        />

        <select
          value={reportType}
          onChange={e => {
            setReportType(e.target.value as ReportType);
            setSelectedMonth('');
            setSelectedSemester('');
          }}
          className="p-2 border rounded"
        >
          <option value="BULANAN">Bulanan</option>
          <option value="SEMESTER">Semester</option>
        </select>

        {reportType === 'BULANAN' && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}

        {reportType === 'SEMESTER' && (
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value as any)}
            className="p-2 border rounded"
          >
            <option value="">Pilih Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-teal-700 text-white">
            <tr>
              <th className="p-2">No</th>
              <th className="p-2 text-left">Nama</th>
              <th className="p-2">Hafalan</th>
              <th className="p-2">Tilawah</th>
              <th className="p-2">Tahfizh</th>
              <th className="p-2 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 text-center">{i + 1}</td>
                <td className="p-2 font-bold uppercase">{r.studentName}</td>
                <td className="p-2 text-center">{formatTotalHafalan(r.totalHafalan)}</td>
                <td className="p-2 text-center">{getResult(r, 'tilawah')}</td>
                <td className="p-2 text-center">{getResult(r, 'tahfizh')}</td>
                <td className="p-2 italic text-gray-600">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredReports.length && (
          <p className="text-center p-6 text-gray-400">
            Tidak ada laporan sesuai filter
          </p>
        )}
      </div>
    </div>
  );
}

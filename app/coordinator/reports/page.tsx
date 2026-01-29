import React, { useEffect, useState } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';

/* =======================
   CONST
======================= */
const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const formatTotalHafalan = (total: any) => {
  if (!total) return '-';
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  return parts.length > 0 ? parts.join(' ') : '0 Juz';
};

/* =======================
   COMPONENT
======================= */
export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);

  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [reportType, setReportType] = useState<'SEMESTER' | 'BULANAN'>('SEMESTER');
  const [semester, setSemester] = useState<'GANJIL' | 'GENAP' | ''>('');
  const [month, setMonth] = useState<number | ''>('');

  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /* =======================
     LOAD GURU
  ======================= */
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      if (onlyTeachers.length > 0) {
        setSelectedTeacherId(onlyTeachers[0].id);
      }
    });
  }, []);

  /* =======================
     LOAD REPORT PER GURU
  ======================= */
  useEffect(() => {
    if (!selectedTeacherId) return;

    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, data => {
      setReports(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTeacherId]);

  /* =======================
     FILTER LOGIC
  ======================= */
  useEffect(() => {
    let result = [...reports];

    if (academicYear) {
      result = result.filter(r => r.academicYear === academicYear);
    }

    if (reportType === 'SEMESTER' && semester) {
      result = result.filter(r => r.semester === semester);
    }

    if (reportType === 'BULANAN' && month) {
      result = result.filter(r => {
        const d = r.createdAt?.toDate?.();
        return d && d.getMonth() + 1 === month;
      });
    }

    if (search) {
      result = result.filter(r =>
        r.studentName.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredReports(result);
  }, [reports, academicYear, reportType, semester, month, search]);

  /* =======================
     AI RESULT
  ======================= */
  const getResult = (report: Report, category: 'tahfizh' | 'tilawah') => {
    if (report[category]?.result) return report[category].result;
    const res = SDQQuranEngine.parseAndCalculate(report[category]?.individual || '');
    return res.valid ? `${res.pages}H ${res.lines}B` : '-';
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <h2 className="text-2xl font-bold text-gray-900">
        Pantau Laporan Guru
      </h2>

      {/* ================= FILTER ================= */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-3 text-sm">
        {/* Tahun Ajaran */}
        <select
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="2025/2026">2025/2026</option>
          <option value="2024/2025">2024/2025</option>
        </select>

        {/* Tipe Laporan */}
        <select
          value={reportType}
          onChange={e => {
            setReportType(e.target.value as any);
            setSemester('');
            setMonth('');
          }}
          className="p-2 border rounded-lg"
        >
          <option value="SEMESTER">Semester</option>
          <option value="BULANAN">Bulanan</option>
        </select>

        {/* Semester / Bulan */}
        {reportType === 'SEMESTER' && (
          <select
            value={semester}
            onChange={e => setSemester(e.target.value as any)}
            className="p-2 border rounded-lg"
          >
            <option value="">Pilih Semester</option>
            <option value="GANJIL">Ganjil</option>
            <option value="GENAP">Genap</option>
          </select>
        )}

        {reportType === 'BULANAN' && (
          <select
            value={month}
            onChange={e => setMonth(e.target.value ? Number(e.target.value) : '')}
            className="p-2 border rounded-lg"
          >
            <option value="">Pilih Bulan</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}

        {/* Guru */}
        <select
          value={selectedTeacherId}
          onChange={e => setSelectedTeacherId(e.target.value)}
          className="p-2 border rounded-lg bg-white"
        >
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.nickname || t.name}
            </option>
          ))}
        </select>

        {/* Cari Siswa */}
        <input
          type="text"
          placeholder="Cari Siswa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 border rounded-lg"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-[10px] uppercase font-bold tracking-wider text-center">
                <th className="px-3 py-3">No</th>
                <th className="px-3 py-3 text-left">Nama Siswa</th>
                <th className="px-3 py-3">Jml Hafalan</th>
                <th className="px-3 py-3">Tilawah</th>
                <th className="px-3 py-3">Hasil TL</th>
                <th className="px-3 py-3">Tahfizh</th>
                <th className="px-3 py-3">Hasil TF</th>
                <th className="px-3 py-3 text-left">Catatan</th>
              </tr>
            </thead>

            <tbody className="divide-y text-[11px]">
              {filteredReports.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{i + 1}</td>
                  <td className="px-3 py-2 font-bold uppercase">{r.studentName}</td>
                  <td className="px-3 py-2 text-center font-bold text-teal-700">
                    {formatTotalHafalan(r.totalHafalan)}
                  </td>
                  <td className="px-3 py-2 text-center">{r.tilawah?.individual}</td>
                  <td className="px-3 py-2 text-center font-bold text-blue-600">
                    {getResult(r, 'tilawah')}
                  </td>
                  <td className="px-3 py-2 text-center">{r.tahfizh?.individual}</td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-600">
                    {getResult(r, 'tahfizh')}
                  </td>
                  <td className="px-3 py-2 italic text-gray-500 truncate max-w-[220px]">
                    {r.notes}
                  </td>
                </tr>
              ))}

              {!isLoading && filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">
                    Tidak ada laporan sesuai filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

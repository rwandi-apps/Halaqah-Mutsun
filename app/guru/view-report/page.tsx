import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report, HalaqahMonthlyReport } from '../../../types';
import {
  subscribeToReportsByTeacher,
  deleteReport,
  getHalaqahMonthlyReport
} from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import {
  Search, Edit2, Trash2, FileSpreadsheet,
  CheckCircle2, AlertCircle, Calendar,
  Filter, BookOpen, Loader2
} from 'lucide-react';
import { Button } from '../../../components/Button';
import * as XLSX from 'xlsx';

interface GuruViewReportPageProps {
  teacherId?: string;
}

const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

/* ======================================================
   🔒 ENGINE-SAFE NORMALIZATION (FINAL)
====================================================== */
const normalizeRangeInput = (raw?: string): string | null => {
  if (!raw || typeof raw !== 'string') return null;

  let s = raw
    .replace(/^[:\s]+/, '')
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/:\s+/g, ':')
    .replace(/\s+/g, ' ')
    .trim();

  // Tolak Iqra
  if (/iqra/i.test(s)) return null;

  // Fix "Surah:1 - 40" → "Surah:1 - Surah:40"
  if (/^[^:]+:\d+\s*-\s*\d+$/.test(s)) {
    const [surah, rest] = s.split(':');
    const [a, b] = rest.split('-').map(v => v.trim());
    s = `${surah}:${a} - ${surah}:${b}`;
  }

  return s;
};

/* ======================================================
   🎯 DISPLAY HASIL ENGINE (0 = VALID)
====================================================== */
const getCalculationDisplay = (raw?: string) => {
  const normalized = normalizeRangeInput(raw);
  if (!normalized) return "-";

  const result = calculateFromRangeString(normalized);
  if (!result.valid) return "-";

  return `${result.pages} Halaman ${result.lines} Baris`;
};

/* ======================================================
   🏷 STATUS BADGE
====================================================== */
const getStatusBadge = (raw?: string, reportType?: string) => {
  const normalized = normalizeRangeInput(raw);
  if (!normalized) {
    return <span className="text-[10px] font-black text-orange-500">BELUM TERCAPAI</span>;
  }

  const result = calculateFromRangeString(normalized);
  const targetPages = reportType === 'Laporan Semester' ? 10 : 2;

  if (result.valid && result.pages >= targetPages) {
    return (
      <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px]">
        <CheckCircle2 size={12}/> TERCAPAI
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-orange-500 font-black text-[10px]">
      <AlertCircle size={12}/> BELUM TERCAPAI
    </div>
  );
};

/* ======================================================
   🧠 DISPLAY RANGE (UI ONLY)
====================================================== */
const formatCompactRangeString = (s?: string) => {
  if (!s || s === '-') return '-';
  return s.replace(/\s+/g, ' ').trim();
};

/* ======================================================
   📦 MAIN COMPONENT
====================================================== */
const GuruViewReportPage: React.FC<GuruViewReportPageProps> = ({ teacherId = '1' }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [klasikalMap, setKlasikalMap] = useState<Record<string, HalaqahMonthlyReport>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('2025/2026');
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterMonth, setFilterMonth] = useState('Desember');
  const [filterSemester, setFilterSemester] = useState('Ganjil');

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);

    const unsub = subscribeToReportsByTeacher(teacherId, async data => {
      setReports(data);

      const months = [...new Set(data.map(d => d.month))];
      const map: Record<string, HalaqahMonthlyReport> = {};
      for (const m of months) {
        const k = await getHalaqahMonthlyReport(teacherId, m);
        if (k) map[m] = k;
      }
      setKlasikalMap(map);
      setIsLoading(false);
    });

    return () => unsub();
  }, [teacherId]);

  useEffect(() => {
    let r = reports;

    if (search) r = r.filter(x =>
      x.studentName.toLowerCase().includes(search.toLowerCase())
    );

    r = r.filter(x =>
      x.academicYear?.replace(/\s/g, '') === filterYear.replace(/\s/g, '')
    );

    r = r.filter(x => x.type === filterType);

    r = filterType === 'Laporan Bulanan'
      ? r.filter(x => x.month === filterMonth)
      : r.filter(x => x.month === filterSemester);

    setFilteredReports(r);
  }, [search, filterYear, filterType, filterMonth, filterSemester, reports]);

  return (
    <div className="space-y-6 px-2 pb-12">
      <h2 className="text-2xl font-black uppercase">Arsip Laporan</h2>

      <div className="bg-white rounded-2xl overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-teal-700 text-white">
            <tr>
              <th>Nama</th>
              <th>Tilawah Hasil</th>
              <th>Tahfizh Hasil</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="py-20 text-center">
                <Loader2 className="animate-spin mx-auto"/>
              </td></tr>
            ) : filteredReports.map(r => {
              const klasikal = klasikalMap[r.month]?.klasikal;

              const tilawahRange =
                r.tilawah.individual && r.tilawah.individual !== '-'
                  ? r.tilawah.individual
                  : klasikal?.tilawah;

              const tahfizhRange =
                r.tahfizh.individual && r.tahfizh.individual !== '-'
                  ? r.tahfizh.individual
                  : klasikal?.tahfizh;

              return (
                <tr key={r.id} className="border-b">
                  <td className="font-black">{r.studentName}</td>
                  <td>{getCalculationDisplay(tilawahRange)}</td>
                  <td>{getCalculationDisplay(tahfizhRange)}</td>
                  <td>{getStatusBadge(tahfizhRange, r.type)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuruViewReportPage;

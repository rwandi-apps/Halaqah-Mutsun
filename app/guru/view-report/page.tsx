
import React, { useEffect, useState } from 'react';
import { Report, HalaqahMonthlyReport } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Edit2, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import * as XLSX from 'xlsx';

interface GuruViewReportPageProps {
  teacherId?: string;
}

// Helper: Format Total Hafalan Adaptif (Juz + Halaman)
const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const parts = [];
  if (j > 0) parts.push(`${j} Juz`);
  if (p > 0) parts.push(`${p} Hal`);
  return parts.length > 0 ? parts.join(' ') : '0 Juz'; 
};

// Helper: Format data klasikal objek ke string sederhana
const formatKlasikalDisplay = (klasikal?: HalaqahMonthlyReport['klasikal'], type: 'tahfizh' | 'tilawah' = 'tahfizh') => {
  if (!klasikal) return "-";
  if (type === 'tahfizh') {
    const { from, to } = klasikal.tahfizh;
    return from.surah === to.surah 
      ? `${from.surah}: ${from.ayah}-${to.ayah}`
      : `${from.surah}:${from.ayah} - ${to.surah}:${to.ayah}`;
  } else {
    const { from, to, type: tType } = klasikal.tilawah;
    if (tType === 'quran') {
      return from.surah === to.surah 
        ? `${from.surah}: ${from.ayah}-${to.ayah}`
        : `${from.surah}:${from.ayah} - ${to.surah}:${to.ayah}`;
    } else {
      return from.jilid === to.jilid 
        ? `Iqra ${from.jilid}: ${from.halaman}-${to.halaman}`
        : `Iqra ${from.jilid}:${from.halaman} - ${to.jilid}:${to.halaman}`;
    }
  }
};

const getCalculationDisplay = (rangeStr: string | undefined) => {
  if (!rangeStr || rangeStr === '-' || rangeStr === '') return "-";
  const result = calculateFromRangeString(rangeStr);
  if (result.pages > 0) return `${result.pages} Hal`;
  if (result.lines > 0) return `${result.lines} Brs`;
  return "0 Brs";
};

const getStatusBadge = (rangeStr: string | undefined, reportType: string) => {
  if (!rangeStr || rangeStr === '-') return <span className="text-[10px] font-bold text-orange-500">BELUM TERCAPAI</span>;
  const result = calculateFromRangeString(rangeStr);
  const targetPages = reportType === 'Laporan Semester' ? 10 : 2; 
  if (result.pages >= targetPages) return <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-[10px]"><CheckCircle2 size={12}/> TERCAPAI</div>;
  return <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-[10px]"><AlertCircle size={12}/> {result.pages}/{targetPages} HAL</div>;
};

export default function GuruViewReportPage({ teacherId = '1' }: GuruViewReportPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [klasikalMap, setKlasikalMap] = useState<Record<string, HalaqahMonthlyReport>>({});
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(teacherId, async (data) => {
      setReports(data);
      const periods = Array.from(new Set(data.map(r => r.month)));
      const maps: Record<string, HalaqahMonthlyReport> = {};
      for (const p of periods) {
        const k = await getHalaqahMonthlyReport(teacherId, p);
        if (k) maps[p] = k;
      }
      setKlasikalMap(maps);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [teacherId]);

  useEffect(() => {
    let result = reports;
    if (search) {
      result = result.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterMonth !== 'Semua') result = result.filter(r => r.month === filterMonth);
    setFilteredReports(result);
  }, [search, filterMonth, reports]);

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return;
    const exportData = filteredReports.map((report, idx) => {
      const klasikal = klasikalMap[report.month];
      return {
        "No": idx + 1,
        "Nama Siswa": report.studentName,
        "Bulan": report.month,
        "Total Hafalan": formatTotalHafalan(report.totalHafalan),
        "Tahfizh Klasikal": formatKlasikalDisplay(klasikal?.klasikal, 'tahfizh'),
        "Tahfizh Individu": report.tahfizh.individual,
        "Tilawah Klasikal": formatKlasikalDisplay(klasikal?.klasikal, 'tilawah'),
        "Tilawah Individu": report.tilawah.individual,
        "Catatan": report.notes
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_Halaqah_Siswa.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arsip Laporan Siswa</h2>
          <p className="text-gray-500 mt-1">Daftar perkembangan setoran per siswa.</p>
        </div>
        <Button variant="secondary" onClick={handleExportExcel}>
          <FileSpreadsheet size={18} className="mr-2"/> Export Excel
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" 
          />
        </div>
        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(e.target.value)} 
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none"
        >
          <option value="Semua">Semua Bulan</option>
          {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              {/* Baris 1: Kolom Utama */}
              <tr className="bg-[#0e7490] text-white text-[11px] uppercase font-bold tracking-wider text-center">
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Nama Siswa</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Jml Hafalan</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b border-white/10">Tilawah</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b border-white/10">Tahfizh</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Keterangan</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Catatan</th>
                <th rowSpan={2} className="px-4 py-3">Aksi</th>
              </tr>
              {/* Baris 2: Sub-Kolom Tilawah & Tahfizh */}
              <tr className="bg-[#155e75] text-white text-[9px] uppercase font-bold tracking-wider text-center">
                <th className="px-2 py-2 border-r border-white/10">Klasikal</th>
                <th className="px-2 py-2 border-r border-white/10">Individual</th>
                <th className="px-2 py-2 border-r border-white/20">Hasil</th>
                <th className="px-2 py-2 border-r border-white/10">Klasikal</th>
                <th className="px-2 py-2 border-r border-white/10">Individual</th>
                <th className="px-2 py-2 border-r border-white/20">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {isLoading ? (
                <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500">Memuat laporan...</td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const klasikal = klasikalMap[report.month];
                  const klasikalTahfizhStr = formatKlasikalDisplay(klasikal?.klasikal, 'tahfizh');
                  const klasikalTilawahStr = formatKlasikalDisplay(klasikal?.klasikal, 'tilawah');
                  
                  // Gunakan data individual jika ada, jika tidak gunakan data klasikal untuk perhitungan "Hasil"
                  const effectiveTahfizhRange = (report.tahfizh.individual && report.tahfizh.individual !== '-') ? report.tahfizh.individual : klasikalTahfizhStr;
                  const effectiveTilawahRange = (report.tilawah.individual && report.tilawah.individual !== '-') ? report.tilawah.individual : klasikalTilawahStr;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{report.studentName}</div>
                        <div className="text-[9px] text-primary-500 font-bold uppercase">{report.month}</div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 text-center font-bold text-teal-700">
                        {formatTotalHafalan(report.totalHafalan)}
                      </td>
                      {/* TILAWAH */}
                      <td className="px-2 py-3 border-r border-gray-50 text-center text-gray-500 italic">{klasikalTilawahStr}</td>
                      <td className="px-2 py-3 border-r border-gray-50 text-center font-medium text-gray-800">{report.tilawah.individual || "-"}</td>
                      <td className="px-2 py-3 border-r border-gray-100 text-center font-bold text-blue-600 bg-blue-50/30">{getCalculationDisplay(effectiveTilawahRange)}</td>
                      
                      {/* TAHFIZH */}
                      <td className="px-2 py-3 border-r border-gray-50 text-center text-gray-500 italic">{klasikalTahfizhStr}</td>
                      <td className="px-2 py-3 border-r border-gray-50 text-center font-medium text-gray-800">{report.tahfizh.individual || "-"}</td>
                      <td className="px-2 py-3 border-r border-gray-100 text-center font-bold text-emerald-600 bg-emerald-50/30">{getCalculationDisplay(effectiveTahfizhRange)}</td>
                      
                      {/* STATUS & NOTES */}
                      <td className="px-4 py-3 border-r border-gray-100 text-center">
                        {getStatusBadge(effectiveTahfizhRange, report.type)}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 min-w-[150px]">
                        <div className="text-gray-500 italic max-w-[200px] whitespace-normal line-clamp-2">"{report.notes || "-"}"</div>
                      </td>
                      
                      {/* AKSI */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                           <button onClick={() => alert("Gunakan menu Input Nilai Rapor untuk edit detail semester")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                           <button onClick={() => deleteReport(report.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-400 italic">Tidak ada laporan ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

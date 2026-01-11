
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report, HalaqahMonthlyReport } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Edit2, Trash2, FileSpreadsheet, CheckCircle2, AlertCircle, Calendar, Filter, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import * as XLSX from 'xlsx';

interface GuruViewReportPageProps {
  teacherId?: string;
}

const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Helper: Format Rentang Surat (Compact Mode)
const formatCompactRangeString = (rangeStr: string | undefined) => {
  if (!rangeStr || rangeStr === '-' || rangeStr.trim() === '') return "-";
  
  const parts = rangeStr.split(' - ');
  if (parts.length !== 2) return rangeStr;

  const parse = (s: string) => {
    const match = s.match(/^(.*?):?\s*(.*)$/);
    if (match) return { surah: match[1].trim(), ayah: match[2].trim() };
    return null;
  };

  const start = parse(parts[0].trim());
  const end = parse(parts[1].trim());

  if (start && end && start.surah === end.surah) {
    return `${start.surah}: ${start.ayah}–${end.ayah}`;
  }

  return rangeStr;
};

// Helper: Format Total Hafalan Adaptif
const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const parts = [];
  if (j > 0) parts.push(`${j} Juz`);
  if (p > 0) parts.push(`${p} Hal`);
  return parts.length > 0 ? parts.join(' ') : '0 Juz'; 
};

// Logika Kompatibilitas Data Klasikal (String vs Object) + Formatter Compact
const formatKlasikalDisplay = (klasikal: any, type: 'tahfizh' | 'tilawah' = 'tahfizh') => {
  if (!klasikal) return { text: "-", isNew: false };
  
  if (typeof klasikal === 'string') {
    return { text: formatCompactRangeString(klasikal), isNew: false };
  }

  if (typeof klasikal === 'object') {
    const target = type === 'tahfizh' ? klasikal.tahfizh : klasikal.tilawah;
    if (!target) return { text: "-", isNew: false };
    if (typeof target === 'string') return { text: formatCompactRangeString(target), isNew: false };

    try {
      const { from, to } = target;
      if (!from || !to) return { text: "-", isNew: false };
      
      let formattedText = "";
      const startV = from.ayah !== undefined ? from.ayah : from.halaman;
      const endV = to.ayah !== undefined ? to.ayah : to.halaman;

      if (target.type === 'iqra' || (from.jilid !== undefined && from.jilid !== null)) {
        formattedText = from.jilid === to.jilid 
          ? `Iqra ${from.jilid}: ${startV}–${endV}` 
          : `Iqra ${from.jilid}:${startV} – ${to.jilid}:${endV}`;
      } else {
        formattedText = from.surah === to.surah 
          ? `${from.surah}: ${startV}–${endV}` 
          : `${from.surah}:${startV} – ${to.surah}:${endV}`;
      }
      return { text: formattedText, isNew: true };
    } catch (e) { return { text: "-", isNew: false }; }
  }
  return { text: "-", isNew: false };
};

/**
 * UI FIX: Menampilkan hasil perhitungan engine dengan format absolut.
 * Aturan: Angka 0 adalah nilai sah dan wajib ditampilkan.
 */
const getCalculationDisplay = (rangeStr: string | undefined) => {
  if (!rangeStr || rangeStr === '-' || rangeStr.trim() === '' || rangeStr.trim() === 'Belum Ada') {
    return "-";
  }
  
  const result = calculateFromRangeString(rangeStr);
  
  // Jika engine menyatakan tidak valid, baru tampilkan dash
  if (!result.valid) {
    return "-";
  }

  // Format HARUS lengkap: "{pages} Halaman {lines} Baris"
  // JANGAN gunakan conditional rendering (result.pages > 0) karena akan menghilangkan angka 0
  return `${result.pages} Halaman ${result.lines} Baris`;
};

// Helper: Teks Keterangan Tanpa Angka (Neutral & Pembinaan)
const getStatusBadge = (rangeStr: string | undefined, reportType: string) => {
  if (!rangeStr || rangeStr === '-') return <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-tighter">BELUM TERCAPAI</span>;
  
  const result = calculateFromRangeString(rangeStr);
  const targetPages = reportType === 'Laporan Semester' ? 10 : 2; 

  if (result.pages >= targetPages) {
    return <div className="flex items-center justify-center gap-1 text-emerald-600 font-extrabold text-[10px] tracking-tighter uppercase"><CheckCircle2 size={12}/> TERCAPAI</div>;
  }
  
  return <div className="flex items-center justify-center gap-1 text-orange-500 font-extrabold text-[10px] tracking-tighter uppercase"><AlertCircle size={12}/> BELUM TERCAPAI</div>;
};

const GuruViewReportPage: React.FC<GuruViewReportPageProps> = ({ teacherId = '1' }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [klasikalMap, setKlasikalMap] = useState<Record<string, HalaqahMonthlyReport>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('2025/2026');
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterMonth, setFilterMonth] = useState('Desember');
  const [filterSemester, setFilterSemester] = useState('Ganjil');

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
    if (search) result = result.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()));
    
    result = result.filter(r => {
        const rYear = r.academicYear?.replace(/\s/g, '');
        const fYear = filterYear.replace(/\s/g, '');
        return rYear === fYear;
    });

    result = result.filter(r => r.type === filterType);

    if (filterType === 'Laporan Bulanan') {
      result = result.filter(r => r.month === filterMonth);
    } else {
      result = result.filter(r => r.month === filterSemester);
    }

    setFilteredReports(result);
  }, [search, filterYear, filterType, filterMonth, filterSemester, reports]);

  const handleEditReport = (report: Report) => {
    navigate('/guru/laporan', { state: { editReportId: report.id, reportData: report } });
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return;
    const exportData = filteredReports.map((report, idx) => {
      const klasikalData = klasikalMap[report.month]?.klasikal;
      const tRes = formatKlasikalDisplay(klasikalData || report.tahfizh.classical, 'tahfizh');
      const lRes = formatKlasikalDisplay(klasikalData || report.tilawah.classical, 'tilawah');
      
      const tahfizhSource = (report.tahfizh.individual && report.tahfizh.individual !== '-' && report.tahfizh.individual.trim() !== '') ? report.tahfizh.individual : tRes.text;
      const tahfizhCalc = calculateFromRangeString(tahfizhSource);
      const tahfizhHasil = tahfizhCalc.valid ? `${tahfizhCalc.pages} Halaman ${tahfizhCalc.lines} Baris` : '-';

      return {
        "No": idx + 1,
        "Nama Siswa": report.studentName,
        "Tahun Ajaran": report.academicYear,
        "Periode": report.month,
        "Total Hafalan": formatTotalHafalan(report.totalHafalan),
        "Tahfizh Klasikal": tRes.text,
        "Tahfizh Individu": formatCompactRangeString(report.tahfizh.individual),
        "Hasil Tahfizh": tahfizhHasil,
        "Tilawah Klasikal": lRes.text,
        "Tilawah Individu": formatCompactRangeString(report.tilawah.individual),
        "Catatan": report.notes
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_${filterType.replace(/\s/g, '_')}_${filterYear.replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Arsip Laporan</h2>
          <p className="text-gray-500 text-sm font-medium">Riwayat setoran dan capaian target santri.</p>
        </div>
        <Button variant="secondary" onClick={handleExportExcel} className="shadow-sm border-gray-200">
          <FileSpreadsheet size={18} className="mr-2 text-emerald-600"/> Export ke Excel
        </Button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Calendar size={12} /> Tahun Ajaran</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">{ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Filter size={12} /> Jenis Laporan</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><BookOpen size={12} /> {filterType === 'Laporan Bulanan' ? 'Pilih Bulan' : 'Pilih Semester'}</label>
            {filterType === 'Laporan Bulanan' ? (
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
            ) : (
              <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none"><option value="Ganjil">Semester 1 (Ganjil)</option><option value="Genap">Semester 2 (Genap)</option></select>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Search size={12} /> Cari Santri</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input type="text" placeholder="Ketik nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-[11px] uppercase font-black tracking-wider text-center">
                <th rowSpan={2} className="px-4 py-4 border-r border-white/10">Nama Siswa</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-white/10">Jml Hafalan</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/10 border-b border-white/10">Tilawah</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/10 border-b border-white/10">Tahfizh</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-white/10">Keterangan</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-white/10">Catatan</th>
                <th rowSpan={2} className="px-4 py-4">Aksi</th>
              </tr>
              <tr className="bg-[#155e75] text-white text-[9px] uppercase font-black tracking-widest text-center">
                <th className="px-2 py-3 border-r border-white/5">Klasikal</th>
                <th className="px-2 py-3 border-r border-white/5">Individual</th>
                <th className="px-2 py-3 border-r border-white/10">Hasil</th>
                <th className="px-2 py-3 border-r border-white/5">Klasikal</th>
                <th className="px-2 py-3 border-r border-white/5">Individual</th>
                <th className="px-2 py-3 border-r border-white/10">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {isLoading ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center"><Loader2 size={32} className="text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const globalKlasikal = klasikalMap[report.month]?.klasikal;
                  const resTahfizh = formatKlasikalDisplay(globalKlasikal || report.tahfizh.classical, 'tahfizh');
                  const resTilawah = formatKlasikalDisplay(globalKlasikal || report.tilawah.classical, 'tilawah');
                  
                  const compactIndividualTahfizh = formatCompactRangeString(report.tahfizh.individual);
                  const compactIndividualTilawah = formatCompactRangeString(report.tilawah.individual);

                  const effectiveTahfizhRange = (report.tahfizh.individual && report.tahfizh.individual !== '-') ? report.tahfizh.individual : resTahfizh.text;
                  const effectiveTilawahRange = (report.tilawah.individual && report.tilawah.individual !== '-') ? report.tilawah.individual : resTilawah.text;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-4 border-r border-gray-50">
                        <div className="font-black text-gray-900 uppercase">{report.studentName}</div>
                      </td>
                      <td className="px-4 py-4 border-r border-gray-50 text-center font-black text-teal-700 bg-teal-50/20">{formatTotalHafalan(report.totalHafalan)}</td>
                      
                      {/* TILAWAH */}
                      <td className="px-2 py-4 border-r border-gray-50 text-center text-gray-400 italic font-medium whitespace-normal min-w-[100px]">{resTilawah.text}</td>
                      <td className="px-2 py-4 border-r border-gray-50 text-center font-bold text-gray-700">{compactIndividualTilawah}</td>
                      <td className="px-2 py-4 border-r border-gray-50 text-center font-black text-blue-600 bg-blue-50/30">{getCalculationDisplay(effectiveTilawahRange)}</td>
                      
                      {/* TAHFIZH */}
                      <td className="px-2 py-4 border-r border-gray-50 text-center text-gray-400 italic font-medium whitespace-normal min-w-[100px]">{resTahfizh.text}</td>
                      <td className="px-2 py-4 border-r border-gray-50 text-center font-bold text-gray-700">{compactIndividualTahfizh}</td>
                      <td className="px-2 py-4 border-r border-gray-50 text-center font-black text-emerald-600 bg-emerald-50/30">{getCalculationDisplay(effectiveTahfizhRange)}</td>
                      
                      {/* STATUS & NOTES */}
                      <td className="px-4 py-4 border-r border-gray-50 text-center">{getStatusBadge(effectiveTahfizhRange, report.type)}</td>
                      <td className="px-4 py-4 border-r border-gray-50 min-w-[150px]"><div className="text-gray-500 italic max-w-[200px] whitespace-normal line-clamp-2 leading-relaxed">"{report.notes || "-"}</div></td>
                      
                      {/* AKSI */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                           <button onClick={() => handleEditReport(report)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100" title="Edit Laporan"><Edit2 size={14} /></button>
                           <button onClick={() => { if(confirm("Hapus laporan ini?")) deleteReport(report.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100" title="Hapus Laporan"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={11} className="px-6 py-24 text-center text-gray-400 uppercase tracking-widest font-black text-xs italic">Data Laporan Tidak Ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GuruViewReportPage;

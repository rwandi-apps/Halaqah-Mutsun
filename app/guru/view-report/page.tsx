import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Report, HalaqahMonthlyReport } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Edit2, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const normalizeRangeInput = (raw: string | undefined): string => {
  if (!raw || typeof raw !== 'string') return "";
  // Membersihkan karakter aneh dan menormalisasi tanda hubung
  return raw.replace(/^[:\s]+/, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
};

const getCalculationDisplay = (rangeStr: string | undefined) => {
  const cleanRange = normalizeRangeInput(rangeStr);
  if (!cleanRange || cleanRange === '-' || cleanRange === '' || cleanRange === 'Belum Ada') return "-";
  
  const result = SDQQuranEngine.parseAndCalculate(cleanRange);
  if (!result.valid) return "-";
  
  if (result.isIqra) return result.pages > 0 ? `${result.pages} Hal` : "0 Hal";
  
  // Format xH yB
  const h = result.pages;
  const b = result.lines;
  return `${h}H ${b}B`;
};

const getStatusBadge = (rangeStr: string | undefined) => {
  const clean = normalizeRangeInput(rangeStr);
  if (!clean || clean === '-' || clean === '') return <span className="text-gray-300">-</span>;
  const result = SDQQuranEngine.parseAndCalculate(clean);
  if (!result.valid) return <span className="text-gray-300">-</span>;
  
  // Target: 2 Halaman (30 Baris)
  const isReached = result.pages >= 2 || (result.pages === 1 && result.lines >= 15) || result.totalLines >= 30;

  if (isReached) {
    return <span className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase"><CheckCircle2 size={12}/> TERCAPAI</span>;
  }
  return <span className="flex items-center gap-1 text-orange-500 font-black text-[9px] uppercase"><AlertCircle size={12}/> BELUM</span>;
};

const formatTotalHafalan = (total: any) => {
  if (!total) return "0 Juz";
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  if (total.lines > 0) parts.push(`${total.lines} Brs`);
  return parts.length > 0 ? parts.join(' ') : "0 Juz";
};

const formatKlasikalDisplay = (klasikal: any, type: 'tahfizh' | 'tilawah' = 'tahfizh') => {
  if (!klasikal) return "-";
  const target = type === 'tahfizh' ? klasikal.tahfizh : klasikal.tilawah;
  if (!target || typeof target === 'string') return target || "-";
  const { from, to } = target;
  const startV = from.ayah !== undefined ? from.ayah : from.halaman;
  const endV = to.ayah !== undefined ? to.ayah : to.halaman;
  if (target.type === 'iqra' || from.jilid !== undefined) {
    return from.jilid === to.jilid ? `Iqra ${from.jilid}:${startV}-${endV}` : `Iqra ${from.jilid}:${startV}-Iqra ${to.jilid}:${endV}`;
  }
  return from.surah === to.surah ? `${from.surah}:${startV}-${endV}` : `${from.surah}:${startV}-${to.surah}:${endV}`;
};

const GuruViewReportPage: React.FC<{ teacherId?: string }> = ({ teacherId = '1' }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [klasikalMap, setKlasikalMap] = useState<Record<string, HalaqahMonthlyReport>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('2025/2026');
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterMonth, setFilterMonth] = useState('Desember');

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
    let result = reports.filter(r => r.type === filterType);
    
    // Filter Bulan jika Bulanan
    if (filterType === 'Laporan Bulanan') {
      result = result.filter(r => r.month === filterMonth);
    }

    // Filter Cari Siswa
    if (searchTerm.trim() !== '') {
      result = result.filter(r => 
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(result);
  }, [filterYear, filterType, filterMonth, searchTerm, reports]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus laporan ini secara permanen?")) {
      await deleteReport(id);
    }
  };

  const handleEdit = (report: Report) => {
    navigate('/guru/laporan', { state: { editReportId: report.id, reportData: report } });
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase px-1">Arsip Laporan</h2>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama Siswa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500">{ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#155e75] text-white text-[10px] uppercase font-black tracking-wider text-center">
                <th className="px-4 py-4 border-r border-white/10 w-10">NO</th>
                <th className="px-4 py-4 border-r border-white/10 text-left">NAMA SISWA</th>
                <th className="px-4 py-4 border-r border-white/10">JUMLAH HAFALAN</th>
                <th className="px-4 py-4 border-r border-white/10">INDIVIDUAL (TAHFIZH)</th>
                <th className="px-4 py-4 border-r border-white/10">HASIL</th>
                <th className="px-4 py-4 border-r border-white/10">KLASIKAL</th>
                <th className="px-4 py-4 border-r border-white/10">INDIVIDUAL (TILAWAH)</th>
                <th className="px-4 py-4 border-r border-white/10">HASIL</th>
                <th className="px-4 py-4 border-r border-white/10">KETERANGAN</th>
                <th className="px-4 py-4 border-r border-white/10 text-left">CATATAN</th>
                <th className="px-4 py-4">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10px]">
              {isLoading ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center"><Loader2 size={32} className="text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => {
                  const globalKlasikal = klasikalMap[report.month]?.klasikal;
                  const indivTahfizh = normalizeRangeInput(report.tahfizh.individual);
                  const indivTilawah = normalizeRangeInput(report.tilawah.individual);
                  const klasikalDisp = formatKlasikalDisplay(globalKlasikal || report.tahfizh.classical, 'tahfizh');

                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-center border-r font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-4 font-black text-gray-900 border-r uppercase">{report.studentName}</td>
                      <td className="px-4 py-4 text-center border-r font-black text-[#155e75] bg-gray-50/30">
                        {formatTotalHafalan(report.totalHafalan)}
                      </td>
                      <td className="px-4 py-4 text-center border-r font-bold">{indivTahfizh || "-"}</td>
                      <td className="px-4 py-4 text-center border-r font-black text-emerald-600 bg-emerald-50/20">
                        {getCalculationDisplay(indivTahfizh)}
                      </td>
                      <td className="px-4 py-4 text-center border-r italic text-gray-400">
                        {klasikalDisp}
                      </td>
                      <td className="px-4 py-4 text-center border-r font-bold">{indivTilawah || "-"}</td>
                      <td className="px-4 py-4 text-center border-r font-black text-blue-600 bg-blue-50/20">
                        {getCalculationDisplay(indivTilawah)}
                      </td>
                      <td className="px-4 py-4 text-center border-r">
                        {getStatusBadge(indivTahfizh)}
                      </td>
                      <td className="px-4 py-4 border-r italic text-gray-500 max-w-[150px] truncate" title={report.notes}>
                        {report.notes || "-"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(report)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90" title="Edit"><Edit2 size={14}/></button>
                          <button onClick={() => handleDelete(report.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90" title="Hapus"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={11} className="px-6 py-24 text-center text-gray-400 uppercase italic font-bold tracking-widest">Data Tidak Ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuruViewReportPage;


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
  return raw.replace(/^[:\s]+/, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
};

const getStoredOrCalculatedResult = (report: Report, category: 'tahfizh' | 'tilawah') => {
  const target = report[category];
  if (target.result && target.result !== '-' && target.result !== '0H 0B') return target.result;
  const cleanRange = normalizeRangeInput(target.individual);
  if (!cleanRange || cleanRange === '-' || cleanRange === '' || cleanRange === 'Belum Ada') return "-";
  const result = SDQQuranEngine.parseAndCalculate(cleanRange);
  if (!result.valid) return "-";
  return result.isIqra ? `${result.pages} Hal` : `${result.pages}H ${result.lines}B`;
};

const getStatusBadge = (report: Report) => {
  const resultStr = getStoredOrCalculatedResult(report, 'tahfizh');
  if (resultStr === '-') return <span className="text-gray-300">-</span>;
  const pageMatch = resultStr.match(/(\d+)\s*(H|Hal)/);
  const h = pageMatch ? parseInt(pageMatch[1]) : 0;
  if (h >= 2) return <span className="flex items-center gap-1 text-emerald-600 font-black text-[8px] uppercase"><CheckCircle2 size={10}/> TERCAPAI</span>;
  return <span className="flex items-center gap-1 text-orange-500 font-black text-[8px] uppercase"><AlertCircle size={10}/> BELUM</span>;
};

const formatTotalHafalan = (total: any) => {
  if (!total) return "0 Juz";
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  if (total.lines > 0) parts.push(`${total.lines} Brs`);
  return parts.length > 0 ? parts.join(' ') : "0 Juz";
};

const GuruViewReportPage: React.FC<{ teacherId?: string }> = ({ teacherId = '1' }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('2025/2026');
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterMonth, setFilterMonth] = useState('Desember');

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(teacherId, (data) => {
      setReports(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [teacherId]);

  useEffect(() => {
    let result = reports.filter(r => r.type === filterType);
    if (filterType === 'Laporan Bulanan') result = result.filter(r => r.month === filterMonth);
    if (searchTerm.trim() !== '') result = result.filter(r => r.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredReports(result);
  }, [filterYear, filterType, filterMonth, searchTerm, reports]);

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Arsip Laporan</h2>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cari Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"/></div>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">{ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none"><option value="Laporan Bulanan">Laporan Bulanan</option><option value="Laporan Semester">Laporan Semester</option></select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#155e75] text-white text-[9px] uppercase font-black tracking-wider text-center">
                <th className="px-3 py-4 border-r border-white/10 w-10">NO</th>
                <th className="px-3 py-4 border-r border-white/10 text-left">NAMA SISWA</th>
                <th className="px-3 py-4 border-r border-white/10">JUMLAH HAFALAN</th>
                <th className="px-3 py-4 border-r border-white/10 bg-emerald-700/30">INDIV (TF)</th>
                <th className="px-3 py-4 border-r border-white/10 bg-emerald-700/50">HASIL</th>
                <th className="px-3 py-4 border-r border-white/10">KLASIKAL (TF)</th>
                <th className="px-3 py-4 border-r border-white/10 bg-blue-700/30">INDIV (TL)</th>
                <th className="px-3 py-4 border-r border-white/10 bg-blue-700/50">HASIL</th>
                <th className="px-3 py-4 border-r border-white/10">KLASIKAL (TL)</th>
                <th className="px-3 py-4 border-r border-white/10">KET</th>
                <th className="px-3 py-4">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[9px]">
              {isLoading ? (
                <tr><td colSpan={11} className="px-6 py-20 text-center"><Loader2 size={32} className="text-primary-500 animate-spin mx-auto" /></td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-4 text-center border-r font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-4 font-black text-gray-900 border-r uppercase">{report.studentName}</td>
                    <td className="px-3 py-4 text-center border-r font-black text-[#155e75]">{formatTotalHafalan(report.totalHafalan)}</td>
                    <td className="px-3 py-4 text-center border-r font-bold">{normalizeRangeInput(report.tahfizh.individual) || "-"}</td>
                    <td className="px-3 py-4 text-center border-r font-black text-emerald-600 bg-emerald-50/20">{getStoredOrCalculatedResult(report, 'tahfizh')}</td>
                    <td className="px-3 py-4 text-center border-r text-gray-400 italic">{normalizeRangeInput(report.tahfizh.classical) || "-"}</td>
                    <td className="px-3 py-4 text-center border-r font-bold">{normalizeRangeInput(report.tilawah.individual) || "-"}</td>
                    <td className="px-3 py-4 text-center border-r font-black text-blue-600 bg-blue-50/20">{getStoredOrCalculatedResult(report, 'tilawah')}</td>
                    <td className="px-3 py-4 text-center border-r text-gray-400 italic">{normalizeRangeInput(report.tilawah.classical) || "-"}</td>
                    <td className="px-3 py-4 text-center border-r">{getStatusBadge(report)}</td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => navigate('/guru/laporan', { state: { editReportId: report.id, reportData: report } })} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 size={12}/></button>
                        <button onClick={() => deleteReport(report.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded-md"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={11} className="px-6 py-24 text-center text-gray-400 uppercase italic font-bold">Data Tidak Ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuruViewReportPage;

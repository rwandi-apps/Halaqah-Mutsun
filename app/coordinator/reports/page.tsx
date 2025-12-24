
import React, { useEffect, useState } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Download, User as UserIcon, BookOpen, Layers } from 'lucide-react';
import { Button } from '../../../components/Button';

// Helper: Format Total Hafalan Adaptif (Juz + Halaman)
const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const l = Number(total.lines || 0);

  const parts = [];
  if (j > 0) parts.push(`${j} Juz`);
  if (p > 0) parts.push(`${p} Halaman`);
  
  if (parts.length === 0 && l > 0) return `${l} Baris`;
  
  return parts.length > 0 ? parts.join(' ') : '0 Juz'; 
};

export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      if (onlyTeachers.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(onlyTeachers[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setReports(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedTeacherId]);

  useEffect(() => {
    let result = reports;
    if (search) {
      result = result.filter(r => 
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (r.className || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterMonth !== 'Semua') result = result.filter(r => r.month === filterMonth);
    if (filterType !== 'Semua') result = result.filter(r => r.type === filterType);
    setFilteredReports(result);
  }, [search, filterMonth, filterType, reports]);

  const formatRangeDisplay = (rangeStr: string | undefined) => {
    if (!rangeStr || rangeStr === '-' || rangeStr.trim() === '') return "-";
    const parts = rangeStr.split(' - ');
    if (parts.length !== 2) return rangeStr;
    const startPart = parts[0].trim();
    const endPart = parts[1].trim();
    const parse = (s: string) => {
      const match = s.match(/^(.*)[:\s]+(\d+)$/);
      if (match) return { surah: match[1].trim(), ayat: match[2] };
      return null;
    };
    const startObj = parse(startPart);
    const endObj = parse(endPart);
    if (startObj && endObj) {
      if (startObj.surah === endObj.surah) return `${startObj.surah}: ${startObj.ayat}-${endObj.ayat}`;
      return `${startPart} - ${endPart}`;
    }
    return rangeStr;
  };

  const getCalculationDisplay = (rangeStr: string | undefined) => {
    if (!rangeStr || rangeStr === '-' || rangeStr === '') return "-";
    const result = calculateFromRangeString(rangeStr);
    if (result.pages > 0) return `${result.pages} Halaman`;
    if (result.lines > 0) return `${result.lines} Baris`;
    return "0 Baris";
  };

  const getStatusBadge = (rangeStr: string | undefined, reportType: string) => {
    if (!rangeStr || rangeStr === '-') return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Belum Tercapai</span>;
    const result = calculateFromRangeString(rangeStr);
    const targetPages = reportType === 'Laporan Semester' ? 10 : 2; 
    if (result.pages > targetPages) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Melebihi Target</span>;
    if (result.pages === targetPages) return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">Tercapai</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Belum Tercapai</span>;
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ["No", "Nama Siswa", "Kelas", "Jml Hafalan", "Tilawah Klasikal", "Tilawah Individual", "Hasil Tilawah", "Tahfizh Klasikal", "Tahfizh Individual", "Hasil Tahfizh", "Status", "Catatan"];
    const rows = filteredReports.map((r, i) => {
      const tilawahSource = (r.tilawah.individual && r.tilawah.individual !== '-' && r.tilawah.individual.trim() !== '') ? r.tilawah.individual : r.tilawah.classical;
      const tahfizhSource = (r.tahfizh.individual && r.tahfizh.individual !== '-' && r.tahfizh.individual.trim() !== '') ? r.tahfizh.individual : r.tahfizh.classical;
      return [
        i + 1, r.studentName, r.className || '', formatTotalHafalan(r.totalHafalan), r.tilawah.classical, r.tilawah.individual, getCalculationDisplay(tilawahSource), r.tahfizh.classical, r.tahfizh.individual, getCalculationDisplay(tahfizhSource), "Status", r.notes
      ].map(v => `"${v}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Supervisi_Laporan_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 px-2">
        <div><h2 className="text-2xl font-bold text-gray-900">Pantau Laporan Guru</h2><p className="text-gray-500 mt-1">Supervisi laporan perkembangan halaqah secara mendalam.</p></div>
        <Button variant="secondary" onClick={handleExportCSV}><Download size={18} className="mr-2" /> Export CSV</Button>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-2">
        <div className="relative"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Pilih Guru</label><div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"><option value="">-- Pilih Guru --</option>{teachers.map(t => (<option key={t.id} value={t.id}>{t.nickname || t.name}</option>))}</select></div></div>
        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Cari Siswa</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" /></div></div>
        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Bulan</label><select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"><option value="Semua">Semua Bulan</option>{["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => (<option key={m} value={m}>{m}</option>))}</select></div>
        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tipe</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"><option value="Semua">Semua Tipe</option><option value="Laporan Bulanan">Bulanan</option><option value="Laporan Semester">Semester</option></select></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-xs uppercase font-bold tracking-wider text-center">
                <th rowSpan={2} className="px-4 py-3 w-10 border-r border-white/20">No</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20 text-left min-w-[200px]">Nama Siswa</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20 w-32">Jml Hafalan</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b">Tilawah</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b">Tahfizh</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Status</th>
                <th rowSpan={2} className="px-4 py-3 min-w-[200px]">Catatan Perkembangan</th>
              </tr>
              <tr className="bg-[#0e7490] text-white text-[10px] uppercase font-bold tracking-wider text-center">
                <th className="px-3 py-2 border-r border-white/10 bg-[#155e75]">Klasikal</th>
                <th className="px-3 py-2 border-r border-white/10 bg-[#155e75]">Individual</th>
                <th className="px-3 py-2 border-r border-white/20 bg-[#155e75]">Hasil</th>
                <th className="px-3 py-2 border-r border-white/10 bg-[#155e75]">Klasikal</th>
                <th className="px-3 py-2 border-r border-white/10 bg-[#155e75]">Individual</th>
                <th className="px-3 py-2 border-r border-white/20 bg-[#155e75]">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (<tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500">Memuat data supervisi...</td></tr>) : filteredReports.length > 0 ? (filteredReports.map((report, idx) => {
                  const tilawahSource = (report.tilawah.individual && report.tilawah.individual !== '-' && report.tilawah.individual.trim() !== '') ? report.tilawah.individual : report.tilawah.classical;
                  const tahfizhSource = (report.tahfizh.individual && report.tahfizh.individual !== '-' && report.tahfizh.individual.trim() !== '') ? report.tahfizh.individual : report.tahfizh.classical;
                  return (
                    <tr key={report.id} className={`hover:bg-gray-50/50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 align-middle border-r border-gray-50"><div className="font-bold text-gray-900">{report.studentName}</div><div className="text-[10px] text-gray-400">{report.className}</div></td>
                      <td className="px-4 py-3 text-center align-middle font-bold text-teal-700 bg-teal-50/30 border-r border-gray-50">{formatTotalHafalan(report.totalHafalan)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 border-r border-gray-50">{formatRangeDisplay(report.tilawah.classical)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 font-medium border-r border-gray-50">{formatRangeDisplay(report.tilawah.individual)}</td>
                      <td className="px-3 py-3 text-center align-middle font-bold text-gray-800 text-xs bg-gray-50 border-r border-gray-100">{getCalculationDisplay(tilawahSource)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 border-r border-gray-50">{formatRangeDisplay(report.tahfizh.classical)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 font-medium border-r border-gray-50">{formatRangeDisplay(report.tahfizh.individual)}</td>
                      <td className="px-3 py-3 text-center align-middle font-bold text-gray-800 text-xs bg-gray-50 border-r border-gray-100">{getCalculationDisplay(tahfizhSource)}</td>
                      <td className="px-4 py-3 text-center align-middle border-r border-gray-50">{getStatusBadge(tahfizhSource, report.type)}</td>
                      <td className="px-4 py-3 align-middle max-w-[250px] overflow-hidden text-ellipsis" title={report.notes}><div className="text-xs text-gray-500 italic truncate">{report.notes || "-"}</div></td>
                    </tr>
                  );
                })) : (<tr><td colSpan={11} className="px-6 py-16 text-center text-gray-400">Pilih guru dan periode untuk memantau laporan.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest"><div className="flex gap-4"><span className="flex items-center gap-1"><BookOpen size={12} className="text-primary-500"/> Data Individual</span><span className="flex items-center gap-1"><Layers size={12} className="text-teal-600"/> Data Klasikal</span></div><span>Menampilkan {filteredReports.length} Laporan</span></div>
      </div>
    </div>
  );
}

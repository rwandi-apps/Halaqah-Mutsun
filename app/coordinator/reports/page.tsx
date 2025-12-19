
import React, { useEffect, useState } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Download, Filter, User as UserIcon, BookOpen, Layers } from 'lucide-react';
import { Button } from '../../../components/Button';

// Helper: Format Total Hafalan Adaptif
const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const l = Number(total.lines || 0);
  if (j > 0) return `${j} Juz`;
  if (p > 0) return `${p} Hal`;
  if (l > 0) return `${l} Baris`;
  return '-'; 
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

  // Load list guru untuk dropdown
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      if (onlyTeachers.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(onlyTeachers[0].id);
      }
    });
  }, []);

  // Listen laporan berdasarkan guru yang dipilih
  useEffect(() => {
    if (!selectedTeacherId) return;
    setIsLoading(true);

    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setReports(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedTeacherId]);

  // Filtering logic
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

  const getCalculationDisplay = (rangeStr: string | undefined) => {
    if (!rangeStr || rangeStr === '-' || rangeStr === '') return "-";
    const result = calculateFromRangeString(rangeStr);
    if (result.pages > 0) return `${result.pages} Hal`;
    if (result.lines > 0) return `${result.lines} Baris`;
    return "0 Baris";
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;
    const headers = ["No", "Nama Siswa", "Kelas", "Total Hafalan", "Tilawah Indiv", "Tilawah Klasik", "Tahfizh Indiv", "Tahfizh Klasik", "Catatan"];
    const rows = filteredReports.map((r, i) => [
      i + 1, r.studentName, r.className || '', formatTotalHafalan(r.totalHafalan),
      r.tilawah.individual, r.tilawah.classical, r.tahfizh.individual, r.tahfizh.classical, r.notes
    ].map(v => `"${v}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Supervisi_${selectedTeacherId}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pantau Laporan Guru</h2>
          <p className="text-gray-500 mt-1">Supervisi laporan perkembangan halaqah secara mendalam.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download size={18} className="mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-2">
        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Pilih Guru</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.nickname || t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Cari Siswa</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Nama siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Bulan</label>
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Semua">Semua Bulan</option>
            {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tipe</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Laporan Bulanan">Bulanan</option>
            <option value="Laporan Semester">Semester</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              {/* Header Group Utama */}
              <tr className="bg-primary-700 text-white text-[10px] uppercase font-bold tracking-wider text-center">
                <th rowSpan={2} className="px-3 py-4 w-10 border-r border-white/20">No</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-white/20 text-left min-w-[180px]">Nama Siswa</th>
                <th rowSpan={2} className="px-3 py-4 border-r border-white/20 w-24">Hafalan</th>
                <th colSpan={4} className="px-4 py-2 border-r border-white/20 border-b border-white/10 bg-primary-800/50">Tilawah</th>
                <th colSpan={4} className="px-4 py-2 border-r border-white/20 border-b border-white/10 bg-primary-900/50">Tahfizh</th>
                <th rowSpan={2} className="px-4 py-4 min-w-[200px]">Catatan Perkembangan</th>
              </tr>
              {/* Sub-Header Detail */}
              <tr className="bg-primary-800 text-white text-[8px] uppercase font-bold tracking-wider text-center">
                {/* Tilawah */}
                <th className="px-2 py-2 border-r border-white/10">Indiv: Materi</th>
                <th className="px-2 py-2 border-r border-white/20">Indiv: Hasil</th>
                <th className="px-2 py-2 border-r border-white/10 italic bg-primary-900/20">Klasik: Materi</th>
                <th className="px-2 py-2 border-r border-white/20 italic bg-primary-900/20">Klasik: Hasil</th>
                {/* Tahfizh */}
                <th className="px-2 py-2 border-r border-white/10">Indiv: Materi</th>
                <th className="px-2 py-2 border-r border-white/20">Indiv: Hasil</th>
                <th className="px-2 py-2 border-r border-white/10 italic bg-primary-900/40">Klasik: Materi</th>
                <th className="px-2 py-2 border-r border-white/20 italic bg-primary-900/40">Klasik: Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {isLoading ? (
                <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500 font-medium italic text-sm">Menghubungkan ke database...</td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => (
                  <tr key={report.id} className={`hover:bg-gray-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-3 py-3 text-center text-gray-400 font-mono text-[10px]">{idx + 1}</td>
                    <td className="px-4 py-3 align-middle border-r border-gray-100">
                      <div className="font-bold text-gray-900">{report.studentName}</div>
                      <div className="text-[9px] text-gray-400">{report.className}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-primary-700 bg-primary-50/30 border-r border-gray-100">
                      {formatTotalHafalan(report.totalHafalan)}
                    </td>
                    
                    {/* Tilawah Data */}
                    <td className="px-2 py-3 text-center text-gray-600 truncate max-w-[100px] border-r border-gray-50">{report.tilawah.individual || '-'}</td>
                    <td className="px-2 py-3 text-center font-bold text-gray-800 bg-gray-50/50 border-r border-gray-100">{getCalculationDisplay(report.tilawah.individual)}</td>
                    <td className="px-2 py-3 text-center text-gray-500 italic bg-blue-50/20 border-r border-gray-50">{report.tilawah.classical || '-'}</td>
                    <td className="px-2 py-3 text-center font-bold text-blue-800 bg-blue-50/40 border-r border-gray-100">{getCalculationDisplay(report.tilawah.classical)}</td>

                    {/* Tahfizh Data */}
                    <td className="px-2 py-3 text-center text-gray-600 truncate max-w-[100px] border-r border-gray-50">{report.tahfizh.individual || '-'}</td>
                    <td className="px-2 py-3 text-center font-bold text-gray-800 bg-gray-50/50 border-r border-gray-100">{getCalculationDisplay(report.tahfizh.individual)}</td>
                    <td className="px-2 py-3 text-center text-teal-600 italic bg-teal-50/20 border-r border-gray-50">{report.tahfizh.classical || '-'}</td>
                    <td className="px-2 py-3 text-center font-bold text-teal-800 bg-teal-50/40 border-r border-gray-100">{getCalculationDisplay(report.tahfizh.classical)}</td>

                    <td className="px-4 py-3 align-middle">
                      <div className="text-[10px] text-gray-500 italic line-clamp-1 max-w-[200px]" title={report.notes}>
                        {report.notes || "Tidak ada catatan."}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={12} className="px-6 py-16 text-center text-gray-400 text-sm font-medium">Pilih guru dan periode untuk melihat detail supervisi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
           <div className="flex gap-4">
              <span className="flex items-center gap-1"><BookOpen size={10} className="text-primary-500"/> Data Individual</span>
              <span className="flex items-center gap-1"><Layers size={10} className="text-teal-600"/> Data Klasikal</span>
           </div>
           <span>Total: {filteredReports.length} Laporan Ditemukan</span>
        </div>
      </div>
    </div>
  );
}

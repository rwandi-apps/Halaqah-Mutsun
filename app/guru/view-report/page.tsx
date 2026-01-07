
import React, { useEffect, useState } from 'react';
import { Report, HalaqahMonthlyReport } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { Search, Download, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/Button';
import * as XLSX from 'xlsx';

interface GuruViewReportPageProps {
  teacherId?: string;
}

const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const parts = [];
  if (j > 0) parts.push(`${j} Juz`);
  if (p > 0) parts.push(`${p} Halaman`);
  return parts.length > 0 ? parts.join(' ') : '0 Juz'; 
};

// Helper: Format data klasikal objek ke string untuk tampilan tabel sederhana
const formatKlasikalDisplay = (klasikal?: HalaqahMonthlyReport['klasikal']) => {
  if (!klasikal) return null;
  const { tahfizh, tilawah } = klasikal;
  const tahfizhStr = `${tahfizh.from.surah}:${tahfizh.from.ayah}-${tahfizh.to.ayah}`;
  let tilawahStr = "";
  if (tilawah.type === 'quran') {
    tilawahStr = `${tilawah.from.surah}:${tilawah.from.ayah}-${tilawah.to.ayah}`;
  } else {
    tilawahStr = `Iqra' ${tilawah.from.jilid}:${tilawah.from.halaman}-${tilawah.to.halaman}`;
  }
  return { tahfizh: tahfizhStr, tilawah: tilawahStr, tilawahType: tilawah.type };
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
      const kDisplay = formatKlasikalDisplay(klasikal?.klasikal);
      return {
        "No": idx + 1,
        "Nama Siswa": report.studentName,
        "Bulan": report.month,
        "Total Hafalan": formatTotalHafalan(report.totalHafalan),
        "Tahfizh Individu": report.tahfizh.individual,
        "Tilawah Individu": report.tilawah.individual,
        "Tahfizh Klasikal": kDisplay?.tahfizh || '-',
        "Tilawah Klasikal": kDisplay?.tilawah || '-',
        "Catatan": report.notes
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_Halaqah.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-bold text-gray-900">Arsip Laporan</h2>
        <Button variant="secondary" onClick={handleExportExcel}><FileSpreadsheet size={18} className="mr-2"/> Export Excel</Button>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mx-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none" />
        </div>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none">
          <option value="Semua">Semua Bulan</option>
          {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-xs uppercase font-bold tracking-wider">
                <th className="px-4 py-3 border-r border-white/20">Nama Siswa / Periode</th>
                <th className="px-4 py-3 border-r border-white/20">Klasikal Halaqah</th>
                <th className="px-4 py-3 border-r border-white/20">Individu (Sabaq)</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Memuat laporan...</td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const klasikal = klasikalMap[report.month];
                  const kDisplay = formatKlasikalDisplay(klasikal?.klasikal);
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4"><div className="font-bold text-gray-900">{report.studentName}</div><div className="text-[10px] font-bold text-primary-500 uppercase">{report.month}</div></td>
                      <td className="px-4 py-4 bg-primary-50/30">
                        {kDisplay ? (
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-emerald-700 uppercase">TH: {kDisplay.tahfizh}</p>
                             <p className="text-[10px] font-bold text-blue-700 uppercase">TL: {kDisplay.tilawah}</p>
                          </div>
                        ) : <span className="text-[10px] text-gray-400 italic">Data klasikal tidak ada</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-700 text-[11px] mb-1 uppercase">TH: {report.tahfizh.individual}</div>
                        <div className="text-[10px] text-gray-500 italic max-w-xs whitespace-normal truncate">"{report.notes}"</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                           <button onClick={() => alert("Edit")} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                           <button onClick={() => deleteReport(report.id)} className="text-red-600 p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">Tidak ada laporan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

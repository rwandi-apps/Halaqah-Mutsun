
import React, { useEffect, useState } from 'react';
import { Report, HalaqahMonthlyReport } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, updateReport, getHalaqahMonthlyReport } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Download, Edit2, Trash2, X, FileSpreadsheet, Book, BookOpen, Database, Layers } from 'lucide-react';
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

// Helper: Format data klasikal objek ke string untuk tampilan tabel
const formatKlasikalDisplay = (klasikal?: HalaqahMonthlyReport['klasikal']) => {
  if (!klasikal) return null;
  
  const { tahfizh, tilawah } = klasikal;
  
  const tahfizhStr = tahfizh.from.surah === tahfizh.to.surah 
    ? `${tahfizh.from.surah}: ${tahfizh.from.ayah}-${tahfizh.to.ayah}`
    : `${tahfizh.from.surah}: ${tahfizh.from.ayah} - ${tahfizh.to.surah}: ${tahfizh.to.ayah}`;
    
  let tilawahStr = "";
  if (tilawah.type === 'quran') {
    tilawahStr = tilawah.from.surah === tilawah.to.surah
      ? `${tilawah.from.surah}: ${tilawah.from.ayah}-${tilawah.to.ayah}`
      : `${tilawah.from.surah}: ${tilawah.from.ayah} - ${tilawah.to.surah}: ${tilawah.to.ayah}`;
  } else {
    tilawahStr = tilawah.from.jilid === tilawah.to.jilid
      ? `Iqra' ${tilawah.from.jilid}: ${tilawah.from.halaman}-${tilawah.to.halaman}`
      : `Iqra' ${tilawah.from.jilid}: ${tilawah.from.halaman} - Iqra' ${tilawah.to.jilid}: ${tilawah.to.halaman}`;
  }
  
  return { tahfizh: tahfizhStr, tilawah: tilawahStr, tilawahType: tilawah.type };
};

export default function GuruViewReportPage({ teacherId = '1' }: GuruViewReportPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [klasikalMap, setKlasikalMap] = useState<Record<string, HalaqahMonthlyReport>>({});
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    setIsLoading(true);

    const unsubscribe = subscribeToReportsByTeacher(teacherId, async (data) => {
      setReports(data);
      
      // Load relevant klasikal data
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
      result = result.filter(r => 
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (r.className || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterMonth !== 'Semua') result = result.filter(r => r.month === filterMonth);
    if (filterType !== 'Semua') result = result.filter(r => r.type === filterType);
    setFilteredReports(result);
  }, [search, filterMonth, filterType, reports]);

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return;
    const exportData = filteredReports.map((report, idx) => {
      const klasikal = klasikalMap[report.month];
      const kDisplay = formatKlasikalDisplay(klasikal?.klasikal);
      return {
        "No": idx + 1,
        "Nama Siswa": report.studentName,
        "Bulan": report.month,
        "Jumlah Hafalan": formatTotalHafalan(report.totalHafalan),
        "Klasikal Tahfizh": kDisplay?.tahfizh || '-',
        "Klasikal Tilawah": kDisplay?.tilawah || '-',
        "Individu Tahfizh": report.tahfizh.individual,
        "Catatan Individu": report.notes
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_SDQ");
    XLSX.writeFile(workbook, `Laporan_Halaqah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-[95%] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900">Arsip Laporan</h2></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div className="flex gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none">
            <option value="Semua">Semua Bulan</option>
            {["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <Button variant="secondary" onClick={handleExportExcel}><FileSpreadsheet size={18} /></Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">{report.studentName}</div>
                        <div className="text-[10px] font-bold text-primary-500 uppercase">{report.month} 2025/2026</div>
                      </td>
                      <td className="px-4 py-4 bg-primary-50/30">
                        {kDisplay ? (
                          <div className="space-y-1">
                             <p className="text-[10px] font-bold text-emerald-700 uppercase">Tahfizh: {kDisplay.tahfizh}</p>
                             <div className="h-px bg-primary-100 my-1"></div>
                             <p className="text-[10px] font-bold text-blue-700 uppercase">Tilawah ({kDisplay.tilawahType}): {kDisplay.tilawah}</p>
                          </div>
                        ) : <span className="text-[10px] text-gray-400 italic">Data klasikal belum diinput</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-700 text-[11px] mb-1 uppercase">Tahfizh: {report.tahfizh.individual}</div>
                        <div className="text-[10px] text-gray-500 italic max-w-xs whitespace-normal">"{report.notes}"</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                           <button onClick={() => alert("Edit Individu")} className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
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

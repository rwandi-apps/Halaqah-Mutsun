
import React, { useEffect, useState } from 'react';
import { Report } from '../../../types';
import { subscribeToReportsByTeacher, deleteReport, updateReport } from '../../../services/firestoreService';
import { calculateFromRangeString } from '../../../services/quranMapping';
import { Search, Download, Edit2, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/Button';
import * as XLSX from 'xlsx';

interface GuruViewReportPageProps {
  teacherId?: string;
}

// Helper: Format Total Hafalan Adaptif (Juz > Halaman > Baris)
const formatTotalHafalan = (total: { juz: number; pages: number; lines: number } | undefined) => {
  if (!total) return '-';
  
  const j = Number(total.juz || 0);
  const p = Number(total.pages || 0);
  const l = Number(total.lines || 0);

  if (j > 0) return `${j} Juz`;
  if (p > 0) return `${p} Halaman`;
  if (l > 0) return `${l} Baris`;
  
  return '-'; 
};

export default function GuruViewReportPage({ teacherId = '1' }: GuruViewReportPageProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modals
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // USE REALTIME LISTENER HERE
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
    let result = reports;

    if (search) {
      result = result.filter(r => 
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (r.className || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterMonth !== 'Semua') {
      result = result.filter(r => r.month === filterMonth);
    }

    if (filterType !== 'Semua') {
      result = result.filter(r => r.type === filterType);
    }

    setFilteredReports(result);
  }, [search, filterMonth, filterType, reports]);

  // Helper to format range string nicely
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
      if (startObj.surah === endObj.surah) {
        return `${startObj.surah}: ${startObj.ayat}-${endObj.ayat}`;
      } else {
        return `${startPart} - ${endPart}`;
      }
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

  const getStatusBadge = (rangeStr: string | undefined) => {
    if (!rangeStr || rangeStr === '-') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
          Belum Tercapai
        </span>
      );
    }

    const result = calculateFromRangeString(rangeStr);
    const targetPages = 1; 

    if (result.pages >= targetPages) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
          Tercapai
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
          Belum Tercapai
        </span>
      );
    }
  };

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return;

    // Persiapkan data untuk export Excel
    const exportData = filteredReports.map((report, idx) => ({
      "No": idx + 1,
      "Nama Siswa": report.studentName,
      "Kelas": report.className || '',
      "Jumlah Hafalan": formatTotalHafalan(report.totalHafalan),
      "Tilawah Individual": report.tilawah.individual,
      "Tilawah Klasikal": report.tilawah.classical,
      "Hasil Tilawah": getCalculationDisplay(report.tilawah.individual !== '-' ? report.tilawah.individual : report.tilawah.classical),
      "Tahfizh Individual": report.tahfizh.individual,
      "Tahfizh Klasikal": report.tahfizh.classical,
      "Hasil Tahfizh": getCalculationDisplay(report.tahfizh.individual !== '-' ? report.tahfizh.individual : report.tahfizh.classical),
      "Catatan": report.notes
    }));

    // Generate workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Halaqah");

    // Tulis file
    const fileName = `Laporan_Halaqah_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus laporan ini? Data yang dihapus tidak dapat dikembalikan.")) return;
    
    setIsDeleting(true);
    try {
      await deleteReport(reportId);
    } catch (error) {
      alert("Gagal menghapus laporan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (report: Report) => {
    setEditingReport({ ...report });
    setIsEditModalOpen(true);
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setIsLoading(true);
    try {
      await updateReport(editingReport.id, {
        notes: editingReport.notes,
        tilawah: editingReport.tilawah,
        tahfizh: editingReport.tahfizh
      });
      setIsEditModalOpen(false);
      setEditingReport(null);
    } catch (error) {
      alert("Gagal memperbarui laporan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[95%] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lihat Laporan</h2>
          <p className="text-gray-500 mt-1">Arsip laporan perkembangan siswa.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0">
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
          >
            <option value="Semua">Semua Bulan</option>
            <option value="Desember">Desember</option>
            <option value="November">November</option>
            <option value="Oktober">Oktober</option>
            <option value="September">September</option>
            <option value="Agustus">Agustus</option>
            <option value="Juli">Juli</option>
          </select>

          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px]"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="Laporan Bulanan">Bulanan</option>
            <option value="Laporan Semester">Semester</option>
          </select>

          <Button variant="secondary" className="whitespace-nowrap flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleExportExcel}>
            <FileSpreadsheet size={18} /> Export Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#0e7490] text-white text-xs uppercase font-bold tracking-wider text-center">
                <th rowSpan={2} className="px-4 py-3 w-10 border-r border-white/20">No</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20 text-left min-w-[200px]">Nama Siswa</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20 w-32">Jml Hafalan</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b">Tilawah</th>
                <th colSpan={3} className="px-4 py-3 border-r border-white/20 border-b">Tahfizh</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20">Status</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-white/20 min-w-[200px]">Catatan</th>
                <th rowSpan={2} className="px-4 py-3">Aksi</th>
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
              {isLoading ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-gray-500">Memuat laporan...</td></tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => {
                  const tilawahSource = (report.tilawah.individual && report.tilawah.individual !== '-' && report.tilawah.individual.trim() !== '') 
                    ? report.tilawah.individual 
                    : report.tilawah.classical;

                  const tahfizhSource = (report.tahfizh.individual && report.tahfizh.individual !== '-' && report.tahfizh.individual.trim() !== '')
                    ? report.tahfizh.individual
                    : report.tahfizh.classical;

                  return (
                    <tr key={report.id} className={`hover:bg-gray-50/50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 align-middle"><span className="font-bold text-gray-900">{report.studentName}</span></td>
                      <td className="px-4 py-3 text-center align-middle font-bold text-teal-700 bg-teal-50/30">{formatTotalHafalan(report.totalHafalan)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600">{formatRangeDisplay(report.tilawah.classical)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 font-medium">{formatRangeDisplay(report.tilawah.individual)}</td>
                      <td className="px-3 py-3 text-center align-middle font-bold text-gray-800 text-xs bg-gray-50">{getCalculationDisplay(tilawahSource)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600">{formatRangeDisplay(report.tahfizh.classical)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs text-gray-600 font-medium">{formatRangeDisplay(report.tahfizh.individual)}</td>
                      <td className="px-3 py-3 text-center align-middle font-bold text-gray-800 text-xs bg-gray-50">{getCalculationDisplay(tahfizhSource)}</td>
                      <td className="px-4 py-3 text-center align-middle">{getStatusBadge(tahfizhSource)}</td>
                      <td className="px-4 py-3 align-middle max-w-[250px] overflow-hidden text-ellipsis" title={report.notes}>
                        <div className="text-xs text-gray-500 italic truncate">{report.notes || "-"}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(report)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Laporan"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Laporan"
                            disabled={isDeleting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={13} className="px-6 py-16 text-center text-gray-400">Belum ada laporan ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
             <span>Menampilkan {filteredReports.length} dari {reports.length} laporan</span>
             <div className="flex gap-2">
               <button disabled className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed">Previous</button>
               <button disabled className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-400 cursor-not-allowed">Next</button>
             </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Edit Laporan: {editingReport.studentName}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateReport} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Tahfizh Individual</h4>
                  <input 
                    type="text" 
                    value={editingReport.tahfizh.individual}
                    onChange={(e) => setEditingReport({
                      ...editingReport,
                      tahfizh: { ...editingReport.tahfizh, individual: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Surah: Ayat - Surah: Ayat"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Tilawah Individual</h4>
                  <input 
                    type="text" 
                    value={editingReport.tilawah.individual}
                    onChange={(e) => setEditingReport({
                      ...editingReport,
                      tilawah: { ...editingReport.tilawah, individual: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Surah: Ayat - Surah: Ayat"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Catatan Perkembangan</h4>
                  <textarea 
                    value={editingReport.notes}
                    onChange={(e) => setEditingReport({ ...editingReport, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                    placeholder="Tulis catatan..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

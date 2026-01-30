
import React, { useEffect, useState, useMemo } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Loader2, AlertCircle, CheckCircle2, Filter, Calendar, Users, BookOpen } from 'lucide-react';

const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const SEMESTERS = ["Ganjil", "Genap"];

// --- HELPER FUNCTIONS (Identical to Guru View) ---

const formatRangeDisplay = (raw: string | undefined): string => {
  if (!raw || typeof raw !== 'string' || raw === '-') return "-";
  const clean = raw.replace(/^[:\s]+/, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const parts = clean.split(' - ');
  if (parts.length === 2) {
    const p1 = parts[0].split(':');
    const p2 = parts[1].split(':');
    if (p1.length === 2 && p2.length === 2) {
      const s1 = p1[0].trim(), s2 = p2[0].trim(), a1 = p1[1].trim(), a2 = p2[1].trim();
      if (s1 === s2) return `${s1}: ${a1}-${a2}`;
    }
  }
  return clean;
};

const getStoredOrCalculatedResult = (report: Report, category: 'tahfizh' | 'tilawah') => {
  const target = report[category];
  if (target.result && target.result !== '-' && target.result !== '0H 0B') {
    if (target.result.includes('Hal') || target.result.includes('Baris')) return target.result;
    return target.result.replace(/(\d+)\s*H/gi, '$1 Hal').replace(/(\d+)\s*B/gi, '$1 Baris');
  }
  const cleanRange = formatRangeDisplay(target.individual);
  if (cleanRange === '-') return "-";
  const result = SDQQuranEngine.parseAndCalculate(cleanRange, category);
  if (!result.valid) return "-";
  return result.isIqra ? `${result.pages} Hal` : `${result.pages} Hal ${result.lines} Baris`;
};

const getStatusBadge = (report: Report) => {
  const resultStr = getStoredOrCalculatedResult(report, 'tahfizh');
  if (resultStr === '-') return <span className="text-gray-300">-</span>;
  const pageMatch = resultStr.match(/(\d+)\s*Hal/);
  const h = pageMatch ? parseInt(pageMatch[1]) : 0;
  if (h >= 2) return <span className="flex items-center gap-1 text-emerald-600 font-black text-[8px] uppercase"><CheckCircle2 size={10}/> TERCAPAI</span>;
  return <span className="flex items-center gap-1 text-orange-500 font-black text-[8px] uppercase"><AlertCircle size={10}/> BELUM</span>;
};

const formatTotalHafalan = (total: any) => {
  if (!total) return "0 Juz";
  const parts = [];
  if (total.juz > 0) parts.push(`${total.juz} Juz`);
  if (total.pages > 0) parts.push(`${total.pages} Hal`);
  return parts.length > 0 ? parts.join(' ') : "0 Juz";
};

// --- MAIN COMPONENT ---

export default function CoordinatorReportsPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [filterYear, setFilterYear] = useState('2025/2026');
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterPeriod, setFilterPeriod] = useState('Desember');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Initial Load: Ambil daftar Guru
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
      // Jangan set default teacher agar user memilih
    });
  }, []);

  // 2. Subscription: Pantau laporan berdasarkan guru terpilih
  useEffect(() => {
    if (!selectedTeacherId) {
      setReports([]);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToReportsByTeacher(selectedTeacherId, (data) => {
      setReports(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedTeacherId]);

  // 3. Logic Filter di Client-Side (Agar cepat)
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesType = r.type === filterType;
      const matchesPeriod = r.month === filterPeriod;
      const matchesYear = r.academicYear === filterYear;
      const matchesSearch = searchTerm === '' || r.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesPeriod && matchesYear && matchesSearch;
    });
  }, [reports, filterType, filterPeriod, filterYear, searchTerm]);

  // 4. Handle change tipe laporan (reset period)
  const handleTypeChange = (type: string) => {
    setFilterType(type);
    setFilterPeriod(type === 'Laporan Semester' ? 'Ganjil' : 'Desember');
  };

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Monitoring Laporan Halaqah</h2>
          <p className="text-gray-500 text-sm">Supervisi capaian tilawah dan tahfizh seluruh guru secara real-time.</p>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Filter Guru (Primary) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Musyrif/ah</label>
          <div className="relative group">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
            <select 
              value={selectedTeacherId} 
              onChange={(e) => setSelectedTeacherId(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              <option value="">-- Pilih Guru --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.nickname || t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Filter Tahun */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none"
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Filter Tipe */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Laporan</label>
          <select 
            value={filterType} 
            onChange={e => handleTypeChange(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none"
          >
            <option value="Laporan Bulanan">Laporan Bulanan</option>
            <option value="Laporan Semester">Laporan Semester</option>
          </select>
        </div>

        {/* Filter Periode Dinamis */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {filterType === 'Laporan Semester' ? 'Pilih Semester' : 'Pilih Bulan'}
          </label>
          <select 
            value={filterPeriod} 
            onChange={e => setFilterPeriod(e.target.value)} 
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none"
          >
            {filterType === 'Laporan Semester' 
              ? SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)
              : MONTHS.map(m => <option key={m} value={m}>{m}</option>)
            }
          </select>
        </div>

        {/* Search Siswa */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cari Siswa</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Nama..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              {/* Row 1 Header - Indigo Theme */}
              <tr className="bg-primary-900 text-white text-[9px] uppercase font-black tracking-wider text-center">
                <th rowSpan={2} className="px-3 py-4 border-r border-white/10 w-10">NO</th>
                <th rowSpan={2} className="px-3 py-4 border-r border-white/10 text-left">NAMA SISWA</th>
                <th rowSpan={2} className="px-3 py-4 border-r border-white/10">JML HAFALAN</th>
                <th colSpan={3} className="px-3 py-2 border-r border-white/10 bg-indigo-800">TILAWAH</th>
                <th colSpan={3} className="px-3 py-2 border-r border-white/10 bg-violet-800">TAHFIZH</th>
                <th rowSpan={2} className="px-3 py-4 border-r border-white/10">KET</th>
                <th rowSpan={2} className="px-3 py-4">CATATAN GURU</th>
              </tr>
              {/* Row 2 Header */}
              <tr className="bg-primary-900 text-white text-[8px] uppercase font-black tracking-wider text-center border-t border-white/10">
                <th className="px-2 py-2 border-r border-white/10 bg-indigo-700/50">KLASIKAL</th>
                <th className="px-2 py-2 border-r border-white/10 bg-indigo-700/50">INDIVIDUAL</th>
                <th className="px-2 py-2 border-r border-white/10 bg-indigo-700">HASIL</th>
                <th className="px-2 py-2 border-r border-white/10 bg-violet-700/50">KLASIKAL</th>
                <th className="px-2 py-2 border-r border-white/10 bg-violet-700/50">INDIVIDUAL</th>
                <th className="px-2 py-2 border-r border-white/10 bg-violet-700">HASIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10px]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <Loader2 size={32} className="text-primary-500 animate-spin mx-auto" />
                    <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat Data Laporan...</p>
                  </td>
                </tr>
              ) : !selectedTeacherId ? (
                <tr>
                  <td colSpan={11} className="px-6 py-24 text-center text-gray-400 uppercase italic font-bold">
                    Silakan Pilih Guru Terlebih Dahulu
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, idx) => (
                  <tr key={report.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-3 py-4 text-center border-r font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-4 font-black text-gray-900 border-r uppercase">{report.studentName}</td>
                    <td className="px-3 py-4 text-center border-r font-black text-primary-700 bg-primary-50/10">
                      {formatTotalHafalan(report.totalHafalan)}
                    </td>
                    <td className="px-2 py-4 text-center border-r text-gray-400 italic">
                      {formatRangeDisplay(report.tilawah.classical)}
                    </td>
                    <td className="px-2 py-4 text-center border-r font-bold text-gray-700">
                      {formatRangeDisplay(report.tilawah.individual)}
                    </td>
                    <td className="px-2 py-4 text-center border-r font-black text-indigo-600 bg-indigo-50/30">
                      {getStoredOrCalculatedResult(report, 'tilawah')}
                    </td>
                    <td className="px-2 py-4 text-center border-r text-gray-400 italic">
                      {formatRangeDisplay(report.tahfizh.classical)}
                    </td>
                    <td className="px-2 py-4 text-center border-r font-bold text-gray-700">
                      {formatRangeDisplay(report.tahfizh.individual)}
                    </td>
                    <td className="px-2 py-4 text-center border-r font-black text-violet-600 bg-violet-50/30">
                      {getStoredOrCalculatedResult(report, 'tahfizh')}
                    </td>
                    <td className="px-3 py-4 text-center border-r">
                      {getStatusBadge(report)}
                    </td>
                    <td className="px-3 py-4 italic text-gray-500 truncate max-w-[200px]" title={report.notes}>
                      {report.notes || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-24 text-center text-gray-400 uppercase italic font-bold">
                    Data Laporan Tidak Ditemukan Untuk Periode Ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      {selectedTeacherId && !isLoading && (
        <div className="flex justify-between items-center px-4 py-2 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">
            Menampilkan {filteredReports.length} Laporan Siswa
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-bold text-gray-600 uppercase">Tercapai Target</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-orange-500" />
               <span className="text-[10px] font-bold text-gray-600 uppercase">Belum Tercapai</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

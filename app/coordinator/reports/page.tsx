
import React, { useEffect, useState, useMemo } from 'react';
import { Report, User } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Loader2, AlertCircle, CheckCircle2, Filter, Calendar, Users, BookOpen, Heart, Star } from 'lucide-react';
import { MonitoringSetoranSabak } from './MonitoringSetoranSabak';

const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  if (month >= 6) { // July or later
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

const INITIAL_AY = getCurrentAcademicYear();
const ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"];
if (!ACADEMIC_YEARS.includes(INITIAL_AY)) {
  ACADEMIC_YEARS.push(INITIAL_AY);
}
const MONTHS = ["Juli", "Agustus", "September", "Oktober", "November", "Desember", "Januari", "Februari", "Maret", "April", "Mei", "Juni"];
const SEMESTERS = ["Ganjil", "Genap"];

// --- HELPER FUNCTIONS ---

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
  const [activeTab, setActiveTab] = useState<'laporan' | 'sabak'>('laporan');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [filterYear, setFilterYear] = useState(INITIAL_AY);
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterPeriod, setFilterPeriod] = useState('Juli');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNonactive, setShowNonactive] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(u => u.role === 'GURU');
      setTeachers(onlyTeachers);
    });
  }, []);

  // Filter teachers based on active/inactive status
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => showNonactive || t.status !== 'Nonaktif' || t.id === selectedTeacherId);
  }, [teachers, showNonactive, selectedTeacherId]);

  // 2. Subscription
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

  // 3. Filter Logic
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesType = r.type === filterType;
      const matchesPeriod = r.month === filterPeriod;
      const matchesYear = r.academicYear === filterYear;
      const matchesSearch = searchTerm === '' || r.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesPeriod && matchesYear && matchesSearch;
    });
  }, [reports, filterType, filterPeriod, filterYear, searchTerm]);

  const handleTypeChange = (type: string) => {
    setFilterType(type);
    setFilterPeriod(type === 'Laporan Semester' ? 'Ganjil' : 'Juli');
  };

  return (
    <div className="space-y-6 max-full mx-auto pb-12 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Pantau Laporan</h2>
          <p className="text-gray-500 text-sm">Supervisi real-time capaian laporan bulanan, semester, dan setoran sabak seluruh siswa.</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('laporan')}
          className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 ${
            activeTab === 'laporan'
              ? 'border-primary-600 text-primary-700 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Laporan Halaqah
        </button>
        <button
          onClick={() => setActiveTab('sabak')}
          className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 ${
            activeTab === 'sabak'
              ? 'border-primary-600 text-primary-700 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Monitoring Setoran Sabak
        </button>
      </div>

      {activeTab === 'laporan' ? (
        <>
          {/* FILTERS */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Musyrif/ah</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">-- Pilih Guru --</option>
                  {filteredTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nickname || t.name} {t.status === 'Nonaktif' ? '(Nonaktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-1.5 mt-1 ml-1 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showNonactive} 
                  onChange={(e) => setShowNonactive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-primary-600 focus:ring-primary-500 border-gray-200 cursor-pointer"
                />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tampilkan Guru Nonaktif</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none">
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe</label>
              <select value={filterType} onChange={e => handleTypeChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none">
                <option value="Laporan Bulanan">Laporan Bulanan</option>
                <option value="Laporan Semester">Laporan Semester</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Periode</label>
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold outline-none">
                {filterType === 'Laporan Semester' ? SEMESTERS.map(s => <option key={s} value={s}>{s}</option>) : MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cari Siswa</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-primary-900 text-white text-[9px] uppercase font-black tracking-wider text-center">
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10 w-10">NO</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10 text-left">NAMA SISWA</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10">JML HAFALAN</th>
                    <th colSpan={3} className="px-3 py-2 border-r border-white/10 bg-indigo-800">TILAWAH</th>
                    <th colSpan={3} className="px-3 py-2 border-r border-white/10 bg-violet-800">TAHFIZH</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10">HADIR</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10">ADAB</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-white/10">KET</th>
                    <th rowSpan={2} className="px-3 py-4">CATATAN</th>
                  </tr>
                  <tr className="bg-primary-900 text-white text-[8px] uppercase font-black tracking-wider text-center border-t border-white/10">
                    <th className="px-2 py-2 border-r border-white/10 bg-indigo-700/50">KLASIKAL</th>
                    <th className="px-2 py-2 border-r border-white/10 bg-indigo-700/50">INDIV</th>
                    <th className="px-2 py-2 border-r border-white/10 bg-indigo-700">HASIL</th>
                    <th className="px-2 py-2 border-r border-white/10 bg-violet-700/50">KLASIKAL</th>
                    <th className="px-2 py-2 border-r border-white/10 bg-violet-700/50">INDIV</th>
                    <th className="px-2 py-2 border-r border-white/10 bg-violet-700">HASIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[10px]">
                  {isLoading ? (
                    <tr><td colSpan={13} className="px-6 py-20 text-center"><Loader2 size={32} className="text-primary-500 animate-spin mx-auto" /></td></tr>
                  ) : filteredReports.length > 0 ? (
                    filteredReports.map((report, idx) => (
                      <tr key={report.id} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-3 py-4 text-center border-r font-bold text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-4 font-black text-gray-900 border-r uppercase">{report.studentName}</td>
                        <td className="px-3 py-4 text-center border-r font-black text-primary-700 bg-primary-50/10">{formatTotalHafalan(report.totalHafalan)}</td>
                        <td className="px-2 py-4 text-center border-r text-gray-400 italic">{formatRangeDisplay(report.tilawah.classical)}</td>
                        <td className="px-2 py-4 text-center border-r font-bold">{formatRangeDisplay(report.tilawah.individual)}</td>
                        <td className="px-2 py-4 text-center border-r font-black text-indigo-600 bg-indigo-50/30">{getStoredOrCalculatedResult(report, 'tilawah')}</td>
                        <td className="px-2 py-4 text-center border-r text-gray-400 italic">{formatRangeDisplay(report.tahfizh.classical)}</td>
                        <td className="px-2 py-4 text-center border-r font-bold">{formatRangeDisplay(report.tahfizh.individual)}</td>
                        <td className="px-2 py-4 text-center border-r font-black text-violet-600 bg-violet-50/30">{getStoredOrCalculatedResult(report, 'tahfizh')}</td>
                        {/* KOLOM BARU */}
                        <td className="px-3 py-4 text-center border-r font-black text-blue-600 bg-blue-50/10">{report.attendance || 0}%</td>
                        <td className="px-3 py-4 text-center border-r font-black text-amber-600 bg-amber-50/10">{report.behaviorScore || 0}/10</td>
                        <td className="px-3 py-4 text-center border-r">{getStatusBadge(report)}</td>
                        <td className="px-3 py-4 italic text-gray-500 truncate max-w-[150px]" title={report.notes}>{report.notes || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={13} className="px-6 py-24 text-center text-gray-400 italic font-bold uppercase">Data Tidak Ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <MonitoringSetoranSabak />
      )}
    </div>
  );
}

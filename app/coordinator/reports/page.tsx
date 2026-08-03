
import React, { useEffect, useState, useMemo } from 'react';
import { Report, User, Student } from '../../../types';
import { getAllTeachers, subscribeToReportsByTeacher, isHalaqahTeacher, subscribeToAllStudents, subscribeToAllReports } from '../../../services/firestoreService';
import { SDQQuranEngine } from '../../../services/tahfizh/engine';
import { Search, Loader2, AlertCircle, CheckCircle2, Filter, Calendar, Users, BookOpen, Heart, Star, AlertTriangle, XCircle, CheckCircle, ChevronRight, Eye } from 'lucide-react';
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [filterYear, setFilterYear] = useState(INITIAL_AY);
  const [filterType, setFilterType] = useState('Laporan Bulanan');
  const [filterPeriod, setFilterPeriod] = useState('Juli');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNonactive, setShowNonactive] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'unfilled' | 'incomplete' | 'complete'>('all');

  // 1. Initial Load & Subscriptions
  useEffect(() => {
    setIsLoading(true);
    getAllTeachers().then(data => {
      const onlyTeachers = data.filter(isHalaqahTeacher);
      setTeachers(onlyTeachers);
    });

    const unsubStudents = subscribeToAllStudents(data => {
      setAllStudents(data);
      setIsLoading(false);
    });

    const unsubReports = subscribeToAllReports(data => {
      setAllReports(data);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubReports();
    };
  }, []);

  // Filter teachers based on active/inactive status
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => showNonactive || t.status !== 'Nonaktif' || t.id === selectedTeacherId);
  }, [teachers, showNonactive, selectedTeacherId]);

  const handleTypeChange = (type: string) => {
    setFilterType(type);
    setFilterPeriod(type === 'Laporan Semester' ? 'Ganjil' : 'Juli');
  };

  // Compute status summary for each teacher/halaqah
  const halaqahSummaries = useMemo(() => {
    return filteredTeachers.map(teacher => {
      // Find students belonging to this teacher
      const teacherStudents = allStudents.filter(
        s => s.teacherId === teacher.id && s.status !== 'Mutasi/Keluar' && s.status !== 'Alumni/Lulus'
      );
      const totalStudents = teacherStudents.length;

      // Find reports for this teacher/students for selected filters
      const teacherReports = allReports.filter(r => 
        (r.teacherId === teacher.id || teacherStudents.some(s => s.id === r.studentId)) &&
        r.type === filterType &&
        r.month === filterPeriod &&
        (r.academicYear ? r.academicYear === filterYear : true)
      );

      const reportMap = new Map<string, Report>();
      teacherReports.forEach(r => {
        if (r.studentId) reportMap.set(r.studentId, r);
      });

      let filledCount = 0;
      teacherStudents.forEach(s => {
        if (reportMap.has(s.id)) filledCount++;
      });

      const missingCount = Math.max(0, totalStudents - filledCount);

      let status: 'complete' | 'incomplete' | 'unfilled' | 'empty' = 'complete';
      if (totalStudents === 0) {
        status = 'empty';
      } else if (filledCount === 0) {
        status = 'unfilled';
      } else if (filledCount < totalStudents) {
        status = 'incomplete';
      } else {
        status = 'complete';
      }

      return {
        teacher,
        teacherStudents,
        teacherReports,
        reportMap,
        totalStudents,
        filledCount,
        missingCount,
        status
      };
    });
  }, [filteredTeachers, allStudents, allReports, filterType, filterPeriod, filterYear]);

  // Overall statistics for dashboard
  const summaryStats = useMemo(() => {
    let totalHalaqah = 0;
    let complete = 0;
    let incomplete = 0;
    let unfilled = 0;

    halaqahSummaries.forEach(h => {
      if (h.totalStudents > 0) {
        totalHalaqah++;
        if (h.status === 'complete') complete++;
        else if (h.status === 'incomplete') incomplete++;
        else if (h.status === 'unfilled') unfilled++;
      }
    });

    return { totalHalaqah, complete, incomplete, unfilled };
  }, [halaqahSummaries]);

  // Filtered halaqah cards based on status tab
  const filteredHalaqahCards = useMemo(() => {
    return halaqahSummaries.filter(h => {
      if (h.totalStudents === 0) return false;
      if (summaryFilter === 'unfilled') return h.status === 'unfilled';
      if (summaryFilter === 'incomplete') return h.status === 'incomplete';
      if (summaryFilter === 'complete') return h.status === 'complete';
      return true;
    });
  }, [halaqahSummaries, summaryFilter]);

  // Display table rows (combines students with reports to highlight missing ones)
  const tableRows = useMemo(() => {
    if (selectedTeacherId) {
      const summary = halaqahSummaries.find(h => h.teacher.id === selectedTeacherId);
      if (!summary) return [];

      const { teacherStudents, reportMap } = summary;
      return teacherStudents
        .filter(s => searchTerm === '' || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(s => {
          const rep = reportMap.get(s.id) || null;
          return {
            studentId: s.id,
            studentName: s.name,
            totalHafalan: rep ? rep.totalHafalan : s.totalHafalan,
            report: rep,
            isFilled: !!rep,
            studentObj: s
          };
        });
    } else {
      if (searchTerm.trim() !== '') {
        return allStudents
          .filter(s => s.status !== 'Mutasi/Keluar' && s.status !== 'Alumni/Lulus')
          .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(s => {
            const teacherSummary = halaqahSummaries.find(h => h.teacher.id === s.teacherId);
            const rep = teacherSummary ? teacherSummary.reportMap.get(s.id) || null : null;
            return {
              studentId: s.id,
              studentName: s.name,
              totalHafalan: rep ? rep.totalHafalan : s.totalHafalan,
              report: rep,
              isFilled: !!rep,
              studentObj: s
            };
          });
      } else {
        return allReports
          .filter(r => r.type === filterType && r.month === filterPeriod && (r.academicYear ? r.academicYear === filterYear : true))
          .map(r => ({
            studentId: r.studentId,
            studentName: r.studentName,
            totalHafalan: r.totalHafalan,
            report: r,
            isFilled: true,
            studentObj: null
          }));
      }
    }
  }, [selectedTeacherId, halaqahSummaries, allStudents, allReports, filterType, filterPeriod, filterYear, searchTerm]);

  return (
    <div className="space-y-6 max-full mx-auto pb-12 px-2 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Pantau Laporan</h2>
          <p className="text-gray-500 text-sm">Supervisi real-time kelengkapan laporan halaqah bulanan, semester, dan setoran sabaq seluruh siswa.</p>
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
          Monitoring Setoran Sabaq
        </button>
      </div>

      {activeTab === 'laporan' ? (
        <>
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setSummaryFilter('all')}
              className={`p-4 rounded-2xl text-left transition-all duration-200 border shadow-sm ${
                summaryFilter === 'all' 
                  ? 'bg-gradient-to-br from-slate-800 to-indigo-900 text-white border-indigo-500 ring-4 ring-indigo-200' 
                  : 'bg-gradient-to-br from-slate-700 to-indigo-800 text-white border-slate-600 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Total Halaqah</p>
                <Users size={18} className="text-indigo-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{summaryStats.totalHalaqah}</span>
                <span className="text-xs text-indigo-200 font-bold">Kelompok</span>
              </div>
            </button>

            <button 
              onClick={() => setSummaryFilter('complete')}
              className={`p-4 rounded-2xl text-left transition-all duration-200 border shadow-sm ${
                summaryFilter === 'complete' 
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 ring-4 ring-emerald-200' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-200" /> 🟢 Lengkap (100%)
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{summaryStats.complete}</span>
                <span className="text-xs text-emerald-100 font-bold">Halaqah</span>
              </div>
            </button>

            <button 
              onClick={() => setSummaryFilter('incomplete')}
              className={`p-4 rounded-2xl text-left transition-all duration-200 border shadow-sm ${
                summaryFilter === 'incomplete' 
                  ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white border-amber-500 ring-4 ring-amber-200' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-200" /> 🟡 Belum Lengkap
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{summaryStats.incomplete}</span>
                <span className="text-xs text-amber-100 font-bold">Halaqah</span>
              </div>
            </button>

            <button 
              onClick={() => setSummaryFilter('unfilled')}
              className={`p-4 rounded-2xl text-left transition-all duration-200 border shadow-sm ${
                summaryFilter === 'unfilled' 
                  ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500 ring-4 ring-rose-200' 
                  : 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
                  <XCircle size={14} className="text-rose-200" /> 🔴 Belum Isi
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{summaryStats.unfilled}</span>
                <span className="text-xs text-rose-100 font-bold">Halaqah</span>
              </div>
            </button>
          </div>

          {/* HALAQAH MONITORING GRID */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <Users size={16} className="text-primary-600" />
                  Status Pengisian ({filterType} - {filterPeriod} {filterYear})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Klik pada salah satu halaqah untuk melihat rincian pengisian per siswa secara langsung.
                </p>
              </div>

              {/* FILTER TABS */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-stretch sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setSummaryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${summaryFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Semua ({summaryStats.totalHalaqah})
                </button>
                <button
                  onClick={() => setSummaryFilter('unfilled')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${summaryFilter === 'unfilled' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-600 hover:bg-rose-50'}`}
                >
                  🔴 Belum Isi ({summaryStats.unfilled})
                </button>
                <button
                  onClick={() => setSummaryFilter('incomplete')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${summaryFilter === 'incomplete' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-600 hover:bg-amber-50'}`}
                >
                  🟡 Belum Lengkap ({summaryStats.incomplete})
                </button>
                <button
                  onClick={() => setSummaryFilter('complete')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${summaryFilter === 'complete' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-600 hover:bg-emerald-50'}`}
                >
                  🟢 Lengkap ({summaryStats.complete})
                </button>
              </div>
            </div>

            {/* CARDS GRID */}
            {filteredHalaqahCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredHalaqahCards.map(h => {
                  const isSelected = selectedTeacherId === h.teacher.id;
                  const pct = h.totalStudents > 0 ? Math.round((h.filledCount / h.totalStudents) * 100) : 0;

                  return (
                    <div 
                      key={h.teacher.id}
                      onClick={() => setSelectedTeacherId(isSelected ? '' : h.teacher.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-primary-50/80 border-primary-500 ring-2 ring-primary-500 shadow-md' 
                          : h.status === 'unfilled'
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:shadow-2xs'
                          : h.status === 'incomplete'
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:shadow-2xs'
                          : 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-black text-gray-900 text-xs tracking-tight uppercase truncate">
                            {h.teacher.nickname || h.teacher.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-gray-500">
                            {h.teacherStudents[0]?.className ? `Kelas ${h.teacherStudents[0].className}` : 'Musyrif/ah Halaqah'}
                          </p>
                        </div>

                        {h.status === 'complete' && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            🟢 Lengkap ({h.filledCount}/{h.totalStudents})
                          </span>
                        )}
                        {h.status === 'incomplete' && (
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                            🟡 Kurang {h.missingCount} Siswa ({h.filledCount}/{h.totalStudents})
                          </span>
                        )}
                        {h.status === 'unfilled' && (
                          <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-300 shrink-0">
                            🔴 Belum Isi (0/{h.totalStudents})
                          </span>
                        )}
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500">Progres Terisi</span>
                          <span className={h.status === 'complete' ? 'text-emerald-700' : h.status === 'incomplete' ? 'text-amber-700' : 'text-rose-700'}>
                            {h.filledCount} / {h.totalStudents} Siswa ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              h.status === 'complete' ? 'bg-emerald-500' : h.status === 'incomplete' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-primary-700">
                        <span>{isSelected ? '✓ Sedang Dilihat' : 'Lihat Rincian Siswa'}</span>
                        <ChevronRight size={14} className={`transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-500">Tidak ada halaqah yang sesuai dengan filter kriteria ini.</p>
              </div>
            )}
          </div>

          {/* FILTERS */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Musyrif/ah</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">-- Semua Guru / Pilih Guru --</option>
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
            {!selectedTeacherId && !searchTerm && (
              <div className="p-3 bg-blue-50/80 border-b border-blue-100 text-blue-800 text-xs font-semibold flex items-center justify-between px-6">
                <span>💡 Menampilkan daftar laporan yang telah diisi. Pilih guru di atas atau klik kartu halaqah untuk melihat siswa yang belum diisi.</span>
              </div>
            )}
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
                  ) : tableRows.length > 0 ? (
                    tableRows.map((row, idx) => {
                      const report = row.report;

                      if (row.isFilled && report) {
                        return (
                          <tr key={report.id || idx} className="hover:bg-primary-50/30 transition-colors">
                            <td className="px-3 py-4 text-center border-r font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-4 font-black text-gray-900 border-r uppercase">{report.studentName}</td>
                            <td className="px-3 py-4 text-center border-r font-black text-primary-700 bg-primary-50/10">{formatTotalHafalan(report.totalHafalan)}</td>
                            <td className="px-2 py-4 text-center border-r text-gray-400 italic">{formatRangeDisplay(report.tilawah?.classical)}</td>
                            <td className="px-2 py-4 text-center border-r font-bold">{formatRangeDisplay(report.tilawah?.individual)}</td>
                            <td className="px-2 py-4 text-center border-r font-black text-indigo-600 bg-indigo-50/30">{getStoredOrCalculatedResult(report, 'tilawah')}</td>
                            <td className="px-2 py-4 text-center border-r text-gray-400 italic">{formatRangeDisplay(report.tahfizh?.classical)}</td>
                            <td className="px-2 py-4 text-center border-r font-bold">{formatRangeDisplay(report.tahfizh?.individual)}</td>
                            <td className="px-2 py-4 text-center border-r font-black text-violet-600 bg-violet-50/30">{getStoredOrCalculatedResult(report, 'tahfizh')}</td>
                            <td className="px-3 py-4 text-center border-r font-black text-blue-600 bg-blue-50/10">{report.attendance || 0}%</td>
                            <td className="px-3 py-4 text-center border-r font-black text-amber-600 bg-amber-50/10">{report.behaviorScore || 0}/10</td>
                            <td className="px-3 py-4 text-center border-r">{getStatusBadge(report)}</td>
                            <td className="px-3 py-4 italic text-gray-500 truncate max-w-[150px]" title={report.notes}>{report.notes || "-"}</td>
                          </tr>
                        );
                      } else {
                        // Student report NOT filled
                        return (
                          <tr key={row.studentId || idx} className="bg-rose-50/40 hover:bg-rose-50 transition-colors">
                            <td className="px-3 py-4 text-center border-r font-bold text-rose-400">{idx + 1}</td>
                            <td className="px-3 py-4 font-black text-gray-900 border-r uppercase flex items-center justify-between gap-2">
                              <span>{row.studentName}</span>
                              <span className="text-[9px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.5 rounded">Belum Diisi</span>
                            </td>
                            <td className="px-3 py-4 text-center border-r font-bold text-gray-400">{formatTotalHafalan(row.totalHafalan)}</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-2 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-3 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-3 py-4 text-center border-r text-gray-300">-</td>
                            <td className="px-3 py-4 text-center border-r">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 justify-center">
                                <XCircle size={10}/> BELUM DIISI
                              </span>
                            </td>
                            <td className="px-3 py-4 italic text-rose-500 font-semibold truncate max-w-[150px]">Laporan belum dimasukkan guru</td>
                          </tr>
                        );
                      }
                    })
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

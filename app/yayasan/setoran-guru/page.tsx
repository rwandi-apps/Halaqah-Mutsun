import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  BookmarkCheck, 
  RotateCcw, 
  Users, 
  Search, 
  Calendar, 
  TrendingUp, 
  Award, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Filter,
  ArrowUpRight,
  FileText,
  UserCheck
} from 'lucide-react';
import { SetoranGuru, User } from '../../../types';
import { subscribeToAllSetoranGuru, getAllTeachers } from '../../../services/firestoreService';
import { getTeacherGender } from '../../../services/sdqTargets';

export default function YayasanSetoranGuruPage() {
  const [setoranList, setSetoranList] = useState<SetoranGuru[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'Semua' | 'Ikhwan' | 'Akhwat'>('Semua');
  const [filterTeacherId, setFilterTeacherId] = useState('Semua');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Semua');

  // Teacher Map for fast lookup
  const teacherMap = useMemo(() => {
    const map = new Map<string, User>();
    teachers.forEach(t => map.set(t.id, t));
    return map;
  }, [teachers]);

  // Grouped Teachers
  const groupedTeachers = useMemo(() => {
    const ikhwan = teachers.filter(t => getTeacherGender(t) === 'Ikhwan');
    const akhwat = teachers.filter(t => getTeacherGender(t) === 'Akhwat');
    return { ikhwan, akhwat };
  }, [teachers]);

  // Load teachers list (termasuk Guru Halaqah, Guru Umum, Staff, & Admin)
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await getAllTeachers();
        const guruList = list.filter(t => t.status !== 'Nonaktif');
        setTeachers(guruList);
      } catch (err) {
        console.error('Failed to load teachers:', err);
      }
    };
    loadTeachers();
  }, []);

  // Real-time subscription to setoran guru
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllSetoranGuru((data) => {
      setSetoranList(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered list
  const filteredSetoran = useMemo(() => {
    return setoranList.filter(item => {
      const teacherObj = teacherMap.get(item.guruId);
      const gender = getTeacherGender(teacherObj || item.guruNama);

      const matchGender = filterGender === 'Semua' || gender === filterGender;
      const matchSearch = (item.guruNama || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.surah || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.surahSampai || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchTeacher = filterTeacherId === 'Semua' || item.guruId === filterTeacherId;
      const matchJenis = filterJenis === 'Semua' || item.jenisSetoran === filterJenis;
      
      let matchMonth = true;
      if (selectedMonth !== 'Semua' && item.tanggal) {
        const monthStr = item.tanggal.substring(0, 7); // YYYY-MM
        matchMonth = monthStr === selectedMonth;
      }

      return matchGender && matchSearch && matchTeacher && matchJenis && matchMonth;
    });
  }, [setoranList, searchTerm, filterGender, filterTeacherId, filterJenis, selectedMonth, teacherMap]);

  // Executive KPI Stats
  const stats = useMemo(() => {
    const totalSetoran = setoranList.length;
    const totalZiyadah = setoranList.filter(s => s.jenisSetoran === 'Ziyadah').length;
    const totalMurojaah = setoranList.filter(s => s.jenisSetoran === 'Murojaah').length;

    // Teachers who have submitted at least once
    const activeTeacherIds = new Set(setoranList.map(s => s.guruId).filter(Boolean));
    const totalTeachers = teachers.length;
    const activeTeachersCount = activeTeacherIds.size;
    const participationRate = totalTeachers > 0 ? Math.round((activeTeachersCount / totalTeachers) * 100) : 0;

    return {
      totalSetoran,
      totalZiyadah,
      totalMurojaah,
      totalTeachers,
      activeTeachersCount,
      participationRate
    };
  }, [setoranList, teachers]);

  // Teacher Progress Summary Table
  const teacherSummaries = useMemo(() => {
    return teachers.map(teacher => {
      const teacherLogs = setoranList.filter(s => s.guruId === teacher.id);
      const ziyadahLogs = teacherLogs.filter(s => s.jenisSetoran === 'Ziyadah');
      const murojaahLogs = teacherLogs.filter(s => s.jenisSetoran === 'Murojaah');

      // Sort logs descending by date
      teacherLogs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      ziyadahLogs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      murojaahLogs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

      const latestZiyadah = ziyadahLogs[0];
      const latestMurojaah = murojaahLogs[0];
      const latestLog = teacherLogs[0];

      return {
        teacher,
        totalCount: teacherLogs.length,
        ziyadahCount: ziyadahLogs.length,
        murojaahCount: murojaahLogs.length,
        latestLogDate: latestLog ? latestLog.tanggal : null,
        latestZiyadah: latestZiyadah 
          ? (latestZiyadah.surahSampai && latestZiyadah.surahSampai !== latestZiyadah.surah 
              ? `${latestZiyadah.surah} s/d ${latestZiyadah.surahSampai}` 
              : `${latestZiyadah.surah}: ${latestZiyadah.ayatDari}-${latestZiyadah.ayatSampai}`) 
          : '-',
        latestMurojaah: latestMurojaah 
          ? (latestMurojaah.surahSampai && latestMurojaah.surahSampai !== latestMurojaah.surah 
              ? `${latestMurojaah.surah} s/d ${latestMurojaah.surahSampai}` 
              : `${latestMurojaah.surah}: ${latestMurojaah.ayatDari}-${latestMurojaah.ayatSampai}`) 
          : '-',
      };
    }).sort((a, b) => b.totalCount - a.totalCount);
  }, [teachers, setoranList]);

  // Export / Print Summary
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
          <Award size={320} />
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} /> Monitoring Program Setoran Guru SDQ
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Resumen & Progress Program Setoran Guru
          </h1>
          <p className="text-slate-300 leading-relaxed text-xs lg:text-sm">
            Pantau keaktifan, rekapitulasi capaian hafalan baru (Ziyadah), dan pengulangan (Murojaah) seluruh Ustadz & Ustadzah SDQ Mutiara Sunnah secara langsung.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handlePrintSummary}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Download size={16} /> Cetak / Export Resumen
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Setoran</p>
            <p className="text-2xl font-black text-gray-800">{isLoading ? '...' : stats.totalSetoran}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Seluruh Catatan Guru</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <BookmarkCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ziyadah (Baru)</p>
            <p className="text-2xl font-black text-emerald-600">{isLoading ? '...' : stats.totalZiyadah}</p>
            <p className="text-[10px] text-emerald-600/80 font-semibold mt-0.5">Setoran Hafalan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <RotateCcw size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Murojaah</p>
            <p className="text-2xl font-black text-purple-600">{isLoading ? '...' : stats.totalMurojaah}</p>
            <p className="text-[10px] text-purple-600/80 font-semibold mt-0.5">Pengulangan Hafalan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Guru Aktif Menyetor</p>
            <p className="text-2xl font-black text-amber-600">
              {isLoading ? '...' : `${stats.activeTeachersCount} / ${stats.totalTeachers}`}
            </p>
            <p className="text-[10px] text-amber-700 font-bold mt-0.5">Partisipasi: {stats.participationRate}%</p>
          </div>
        </div>
      </div>

      {/* Progress & Rekapitulasi Per Guru */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              Rekapitulasi Capaian Setoran Per Ustadz / Ustadzah
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">
              Ringkasan progres jumlah setoran, Ziyadah terakhir, dan Murojaah terakhir tiap guru.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Nama Ustadz / Ustadzah</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Total Setoran</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Ziyadah</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Murojaah</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Ziyadah Terakhir</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Murojaah Terakhir</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teacherSummaries.map(({ teacher, totalCount, ziyadahCount, murojaahCount, latestZiyadah, latestMurojaah }) => (
                <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                        {teacher.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{teacher.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{teacher.nickname || 'Musyrif / Guru SDQ'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-800">
                      {totalCount} Kali
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700">
                      {ziyadahCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700">
                      {murojaahCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-800">
                    {latestZiyadah !== '-' ? (
                      <span className="text-emerald-700 font-bold">{latestZiyadah}</span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-gray-800">
                    {latestMurojaah !== '-' ? (
                      <span className="text-purple-700 font-bold">{latestMurojaah}</span>
                    ) : (
                      <span className="text-gray-400 italic">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setFilterTeacherId(teacher.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold rounded-lg transition-colors"
                      title="Filter log setoran guru ini"
                    >
                      Filter Log <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Riwayat Setoran Guru */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Log Detail Riwayat Setoran Guru
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">
              Daftar seluruh transaksi setoran hafalan ustadz / ustadzah secara terperinci.
            </p>
          </div>
          {filterTeacherId !== 'Semua' && (
            <button
              onClick={() => setFilterTeacherId('Semua')}
              className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors self-start md:self-auto"
            >
              Reset Filter Guru
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-4">
          {/* Category Tabs Switcher */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterGender('Semua')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filterGender === 'Semua' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Users size={15} />
              Semua Guru ({setoranList.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterGender('Ikhwan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filterGender === 'Ikhwan' 
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300' 
                  : 'bg-blue-50/60 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Guru Ikhwan / Ustadz
            </button>

            <button
              type="button"
              onClick={() => setFilterGender('Akhwat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filterGender === 'Akhwat' 
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300' 
                  : 'bg-purple-50/60 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Guru Akhwat / Ustadzah
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari guru, surah, catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Guru */}
            <div>
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="Semua">Semua Guru ({teachers.length})</option>
                {groupedTeachers.ikhwan.length > 0 && (
                  <optgroup label="--- GURU IKHWAN (USTADZ) ---">
                    {groupedTeachers.ikhwan.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
                {groupedTeachers.akhwat.length > 0 && (
                  <optgroup label="--- GURU AKHWAT (USTADZAH) ---">
                    {groupedTeachers.akhwat.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Filter Jenis */}
            <div>
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="Semua">Semua Jenis Setoran</option>
                <option value="Ziyadah">Ziyadah</option>
                <option value="Murojaah">Murojaah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm font-semibold">Memuat data setoran guru...</p>
            </div>
          ) : filteredSetoran.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm font-semibold">Tidak ada data setoran guru ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter pilihan Anda</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Ustadz / Ustadzah</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Jenis Setoran</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Surah & Ayat</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">Catatan</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSetoran.map((item) => {
                  const teacherObj = teacherMap.get(item.guruId);
                  const gender = getTeacherGender(teacherObj || item.guruNama);
                  const isIkhwan = gender === 'Ikhwan';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-900">
                        <span>{item.guruNama}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.jenisSetoran === 'Ziyadah' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                        }`}>
                          {item.jenisSetoran}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-extrabold text-gray-800">
                        {item.surahSampai && item.surahSampai !== item.surah ? (
                          <span>
                            {item.surah} <span className="text-gray-500 font-normal">(Ayat {item.ayatDari})</span> <span className="text-amber-600 font-bold">s/d</span> {item.surahSampai} <span className="text-gray-500 font-normal">(Ayat {item.ayatSampai})</span>
                          </span>
                        ) : (
                          <span>
                            {item.surah} <span className="text-gray-500 font-normal">(Ayat {item.ayatDari} - {item.ayatSampai})</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-medium max-w-xs truncate">
                        {item.catatan || '-'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} /> Tuntas
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  FileText,
  BookmarkCheck,
  RotateCcw,
  Users
} from 'lucide-react';
import { SetoranGuru, User } from '../../../types';
import { 
  subscribeToAllSetoranGuru,
  subscribeToSetoranGuruByTeacher,
  addSetoranGuru, 
  updateSetoranGuru, 
  deleteSetoranGuru,
  getAllTeachers
} from '../../../services/firestoreService';
import { QURAN_SURAHS } from '../../../services/surahData';
import { getStoredUser } from '../../../services/simpleAuth';

interface GuruSetoranPageProps {
  teacherId?: string;
}

export const GuruSetoranPage: React.FC<GuruSetoranPageProps> = ({ teacherId }) => {
  const currentUser = getStoredUser();
  const actualTeacherId = teacherId || currentUser?.id || '';
  const actualTeacherName = currentUser?.name || 'Guru';

  // Check if current user is Ust. Bagas or Koordinator/Yayasan (Assistant Role)
  const isAssistant = useMemo(() => {
    if (!currentUser) return false;
    const nameStr = (currentUser.name || '').toLowerCase();
    const nicknameStr = (currentUser.nickname || '').toLowerCase();
    const emailStr = (currentUser.email || '').toLowerCase();
    const roleStr = (currentUser.role || '').toUpperCase();

    if (roleStr === 'KOORDINATOR' || roleStr === 'YAYASAN') return true;
    return nameStr.includes('bagas') || nicknameStr.includes('bagas') || emailStr.includes('bagas');
  }, [currentUser]);

  const [setoranList, setSetoranList] = useState<SetoranGuru[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(actualTeacherId);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisSetoran, setJenisSetoran] = useState<'Ziyadah' | 'Murojaah'>('Ziyadah');
  const [surahName, setSurahName] = useState('Al-Fatihah');
  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(7);
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('Semua');

  // Load current surah's max verses for dynamic validation & UI hints
  const selectedSurahInfo = useMemo(() => {
    return QURAN_SURAHS.find(s => s.nama === surahName) || { nama: 'Al-Fatihah', jumlahAyat: 7 };
  }, [surahName]);

  // Adjust ayatSampai when surahName changes to keep it valid
  useEffect(() => {
    if (selectedSurahInfo) {
      setAyatDari(1);
      setAyatSampai(selectedSurahInfo.jumlahAyat);
    }
  }, [surahName, selectedSurahInfo]);

  // Load all teachers for selection
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await getAllTeachers();
        const guruList = list.filter(t => t.role?.toUpperCase() === 'GURU' || t.teacherId);
        setTeachers(guruList);
      } catch (err) {
        console.error('Failed to load teachers for setoran guru dropdown', err);
      }
    };
    loadTeachers();
  }, []);

  // Subscribe to real-time teacher submissions (all setoran for Ust. Bagas/Koordinator, own setoran for regular guru)
  useEffect(() => {
    setIsLoading(true);
    let unsubscribe: () => void = () => {};

    if (isAssistant) {
      unsubscribe = subscribeToAllSetoranGuru((data) => {
        setSetoranList(data);
        setIsLoading(false);
      });
    } else {
      if (actualTeacherId) {
        unsubscribe = subscribeToSetoranGuruByTeacher(actualTeacherId, (data) => {
          setSetoranList(data);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }

    return () => unsubscribe();
  }, [actualTeacherId, isAssistant]);

  // Statistics
  const stats = useMemo(() => {
    const total = setoranList.length;
    const ziyadah = setoranList.filter(s => s.jenisSetoran === 'Ziyadah').length;
    const murojaah = setoranList.filter(s => s.jenisSetoran === 'Murojaah').length;
    return { total, ziyadah, murojaah };
  }, [setoranList]);

  // Filtered List
  const filteredSetoran = useMemo(() => {
    return setoranList.filter(item => {
      const matchSearch = item.surah.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.guruNama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchJenis = filterJenis === 'Semua' || item.jenisSetoran === filterJenis;
      const matchTeacher = !isAssistant || filterTeacherId === 'Semua' || item.guruId === filterTeacherId;
      return matchSearch && matchJenis && matchTeacher;
    });
  }, [setoranList, searchTerm, filterJenis, filterTeacherId, isAssistant]);

  // Form Reset
  const resetForm = () => {
    setSelectedTeacherId(actualTeacherId);
    setTanggal(new Date().toISOString().split('T')[0]);
    setJenisSetoran('Ziyadah');
    setSurahName('Al-Fatihah');
    setAyatDari(1);
    setAyatSampai(7);
    setCatatan('');
    setErrorMsg('');
    setEditingId(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: SetoranGuru) => {
    setErrorMsg('');
    setEditingId(item.id || null);
    setSelectedTeacherId(item.guruId || actualTeacherId);
    setTanggal(item.tanggal);
    setJenisSetoran(item.jenisSetoran === 'Murojaah' ? 'Murojaah' : 'Ziyadah');
    setSurahName(item.surah);
    setAyatDari(item.ayatDari);
    setAyatSampai(item.ayatSampai);
    setCatatan(item.catatan || '');
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTeacherId) {
      setErrorMsg('Pilih guru yang menyetorkan hafalan');
      return;
    }

    if (!tanggal) {
      setErrorMsg('Tanggal harus diisi');
      return;
    }

    if (ayatDari <= 0 || ayatSampai <= 0) {
      setErrorMsg('Nomor ayat harus bernilai positif');
      return;
    }

    if (ayatDari > ayatSampai) {
      setErrorMsg('Ayat dari tidak boleh lebih besar dari ayat sampai');
      return;
    }

    if (ayatSampai > selectedSurahInfo.jumlahAyat) {
      setErrorMsg(`Surah ${surahName} hanya memiliki maksimal ${selectedSurahInfo.jumlahAyat} ayat`);
      return;
    }

    // Determine target teacher name
    const targetTeacherObj = teachers.find(t => t.id === selectedTeacherId || t.teacherId === selectedTeacherId);
    const targetTeacherName = targetTeacherObj 
      ? (targetTeacherObj.nickname || targetTeacherObj.name)
      : (selectedTeacherId === actualTeacherId ? actualTeacherName : 'Guru');

    const payload: Omit<SetoranGuru, 'id' | 'createdAt' | 'updatedAt'> = {
      tanggal,
      guruId: selectedTeacherId,
      guruNama: targetTeacherName,
      surah: surahName,
      ayatDari,
      ayatSampai,
      jenisSetoran,
      status: 'Tuntas',
      catatan: catatan.trim() ? catatan.trim() : ''
    };

    try {
      if (editingId) {
        await updateSetoranGuru(editingId, payload);
        setSuccessMsg('Setoran berhasil diperbarui!');
      } else {
        await addSetoranGuru(payload);
        setSuccessMsg('Setoran baru berhasil disimpan!');
      }
      setIsModalOpen(false);
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error saving setoran guru:', err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data setoran');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data setoran ini?')) {
      try {
        await deleteSetoranGuru(id);
        setSuccessMsg('Setoran berhasil dihapus!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal menghapus data setoran');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Setoran Hafalan Guru</h2>
          <p className="text-xs text-gray-500 font-medium">Log bimbingan dan capaian hafalan pribadi Ustadz / Ustadzah (Ziyadah & Murojaah)</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-[#0f4c75] hover:bg-[#1f5f8a] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} /> Tambah Setoran
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Assistant Badge Notice */}
      {isAssistant && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-bold text-[10px] uppercase">Akses Asisten</span>
          <span>Mode Asisten Setoran Guru: Anda memiliki wewenang untuk mencatat dan mengelola setoran hafalan seluruh Ustadz & Ustadzah.</span>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0f4c75] shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Setoran</p>
            <p className="text-xl font-black text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <BookmarkCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ziyadah</p>
            <p className="text-xl font-black text-emerald-600">{stats.ziyadah}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <RotateCcw size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Murojaah</p>
            <p className="text-xl font-black text-purple-600">{stats.murojaah}</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className={`grid grid-cols-1 ${isAssistant ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={isAssistant ? "Cari guru, surah, catatan..." : "Cari surah, catatan..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Guru (Khusus Ust. Bagas / Koordinator) */}
          {isAssistant && (
            <div>
              <select
                value={filterTeacherId}
                onChange={(e) => setFilterTeacherId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
              >
                <option value="Semua">Semua Guru (Ustadz/Ustadzah)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nickname || t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Jenis */}
          <div>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
            >
              <option value="Semua">Semua Jenis Setoran</option>
              <option value="Ziyadah">Ziyadah</option>
              <option value="Murojaah">Murojaah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <BookOpen className="animate-pulse mb-3 text-gray-300" size={32} />
            <span className="text-sm font-semibold">Memuat data setoran...</span>
          </div>
        ) : filteredSetoran.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <FileText className="mb-3 text-gray-300" size={36} />
            <span className="text-sm font-semibold">Belum ada riwayat setoran</span>
            <span className="text-xs text-gray-400 mt-1">Klik tombol "Tambah Setoran" untuk menginput hafalan baru</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Guru</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Surah & Ayat</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSetoran.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      {item.guruNama}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                        ${item.jenisSetoran === 'Ziyadah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}
                      `}>
                        {item.jenisSetoran}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-gray-400" />
                        <span>{item.surah}</span>
                        <span className="text-xs text-gray-400 font-medium">Ayat {item.ayatDari} - {item.ayatSampai}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium max-w-xs truncate">
                      {item.catatan || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                          title="Ubah Data"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden transform scale-100 transition-all flex flex-col my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">
                  {editingId ? 'Edit Setoran' : 'Tambah Setoran Hafalan'}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Pencatatan Capaian Hafalan Guru</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Guru Selection Dropdown (Khusus Ust. Bagas / Koordinator) */}
              {isAssistant && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Pilih Guru yang Menyetor
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all font-semibold"
                  >
                    <option value={actualTeacherId}>
                      {actualTeacherName} (Saya Sendiri)
                    </option>
                    {teachers
                      .filter(t => t.id !== actualTeacherId)
                      .map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.nickname || teacher.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Tanggal Setoran</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
                  />
                </div>

                {/* Jenis Setoran */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Jenis Setoran</label>
                  <select
                    value={jenisSetoran}
                    onChange={(e) => setJenisSetoran(e.target.value as 'Ziyadah' | 'Murojaah')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
                  >
                    <option value="Ziyadah">Ziyadah</option>
                    <option value="Murojaah">Murojaah</option>
                  </select>
                </div>
              </div>

              {/* Surah Name Dropdown */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Surah</label>
                <select
                  value={surahName}
                  onChange={(e) => setSurahName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all search-select-fallback"
                >
                  {QURAN_SURAHS.map((surah) => (
                    <option key={surah.nomor} value={surah.nama}>
                      {surah.nomor}. {surah.nama} ({surah.jumlahAyat} ayat)
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayat Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Dari Ayat</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ayatDari}
                    onChange={(e) => setAyatDari(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Sampai Ayat</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ayatSampai}
                    onChange={(e) => setAyatSampai(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Keterangan / Catatan Tambahan</label>
                <textarea
                  placeholder="Contoh: Lancar, Tajwid bagus, dsb."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c75] focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs uppercase tracking-wider font-extrabold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs uppercase tracking-wider font-extrabold text-white bg-[#0f4c75] hover:bg-[#1f5f8a] rounded-xl shadow-md transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuruSetoranPage;



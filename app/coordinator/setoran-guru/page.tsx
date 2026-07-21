import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X,
  Users,
  Check,
  XOctagon,
  FileText
} from 'lucide-react';
import { SetoranGuru, User } from '../../../types';
import { 
  subscribeToAllSetoranGuru, 
  addSetoranGuru, 
  updateSetoranGuru, 
  deleteSetoranGuru,
  getAllTeachers
} from '../../../services/firestoreService';
import { QURAN_SURAHS } from '../../../services/surahData';

export const CoordinatorSetoranGuruPage: React.FC = () => {
  const [setoranList, setSetoranList] = useState<SetoranGuru[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenisSetoran, setJenisSetoran] = useState<'Ziyadah' | 'Murojaah' | 'Sabaq' | 'Sabki' | 'Manzil'>('Ziyadah');
  const [surahName, setSurahName] = useState('Al-Fatihah');
  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(7);
  const [status, setStatus] = useState<'Tuntas' | 'Belum Tuntas' | 'Menunggu Verifikasi'>('Menunggu Verifikasi');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterJenis, setFilterJenis] = useState('Semua');

  // Load current surah's max verses for validation
  const selectedSurahInfo = useMemo(() => {
    return QURAN_SURAHS.find(s => s.nama === surahName) || { nama: 'Al-Fatihah', jumlahAyat: 7 };
  }, [surahName]);

  // Adjust ayat range when surah changes
  useEffect(() => {
    if (selectedSurahInfo) {
      setAyatDari(1);
      setAyatSampai(selectedSurahInfo.jumlahAyat);
    }
  }, [surahName, selectedSurahInfo]);

  // Fetch teachers for dropdowns
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const list = await getAllTeachers();
        // Only keep teachers with role 'GURU'
        setTeachers(list.filter(t => t.role === 'GURU'));
      } catch (err) {
        console.error('Failed to load teachers', err);
      }
    };
    loadTeachers();
  }, []);

  // Subscribe to real-time setoran of ALL teachers
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllSetoranGuru((data) => {
      setSetoranList(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Stats Board
  const stats = useMemo(() => {
    const total = setoranList.length;
    const tuntas = setoranList.filter(s => s.status === 'Tuntas').length;
    const pending = setoranList.filter(s => s.status === 'Menunggu Verifikasi').length;
    const belum = setoranList.filter(s => s.status === 'Belum Tuntas').length;
    return { total, tuntas, pending, belum };
  }, [setoranList]);

  // Filtered List
  const filteredSetoran = useMemo(() => {
    return setoranList.filter(item => {
      const matchSearch = item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.surah.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchTeacher = filterTeacherId === 'Semua' || item.guruId === filterTeacherId;
      const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;
      const matchJenis = filterJenis === 'Semua' || item.jenisSetoran === filterJenis;
      return matchSearch && matchTeacher && matchStatus && matchJenis;
    });
  }, [setoranList, searchTerm, filterTeacherId, filterStatus, filterJenis]);

  // Form Reset
  const resetForm = () => {
    setSelectedTeacherId(teachers[0]?.id || '');
    setTanggal(new Date().toISOString().split('T')[0]);
    setJenisSetoran('Ziyadah');
    setSurahName('Al-Fatihah');
    setAyatDari(1);
    setAyatSampai(7);
    setStatus('Menunggu Verifikasi');
    setCatatan('');
    setErrorMsg('');
    setEditingId(null);
  };

  // Open Modal Add
  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (item: SetoranGuru) => {
    setErrorMsg('');
    setEditingId(item.id || null);
    setSelectedTeacherId(item.guruId);
    setTanggal(item.tanggal);
    setJenisSetoran(item.jenisSetoran);
    setSurahName(item.surah);
    setAyatDari(item.ayatDari);
    setAyatSampai(item.ayatSampai);
    setStatus(item.status);
    setCatatan(item.catatan || '');
    setIsModalOpen(true);
  };

  // Verify / Quick Change Status
  const handleVerifyStatus = async (id: string, newStatus: 'Tuntas' | 'Belum Tuntas') => {
    try {
      await updateSetoranGuru(id, { status: newStatus });
      setSuccessMsg(`Status setoran berhasil diubah menjadi ${newStatus}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memverifikasi setoran');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTeacherId) {
      setErrorMsg('Ustadz/Ustadzah harus dipilih');
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

    const tUser = teachers.find(t => t.id === selectedTeacherId);
    if (!tUser) {
      setErrorMsg('Ustadz/Ustadzah tidak valid');
      return;
    }

    const payload: Omit<SetoranGuru, 'id' | 'createdAt' | 'updatedAt'> = {
      tanggal,
      guruId: selectedTeacherId,
      guruNama: tUser.name,
      surah: surahName,
      ayatDari,
      ayatSampai,
      jenisSetoran,
      status,
      catatan: catatan.trim() || undefined
    };

    try {
      if (editingId) {
        await updateSetoranGuru(editingId, payload);
        setSuccessMsg('Setoran guru berhasil diperbarui!');
      } else {
        await addSetoranGuru(payload);
        setSuccessMsg('Setoran guru baru berhasil disimpan!');
      }
      setIsModalOpen(false);
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat menyimpan data setoran');
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data setoran guru ini?')) {
      try {
        await deleteSetoranGuru(id);
        setSuccessMsg('Setoran guru berhasil dihapus!');
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
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Monitoring Setoran Guru</h2>
          <p className="text-xs text-gray-500 font-medium">Evaluasi, input, dan verifikasi kelulusan setoran hafalan Ustadz / Ustadzah</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} /> Input Setoran Guru
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary-700 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Setoran</p>
            <p className="text-xl font-black text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tuntas</p>
            <p className="text-xl font-black text-emerald-600">{stats.tuntas}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Menunggu</p>
            <p className="text-xl font-black text-amber-600">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Belum Tuntas</p>
            <p className="text-xl font-black text-rose-600">{stats.belum}</p>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama guru, surah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Guru */}
          <div>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            >
              <option value="Semua">Semua Guru</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tuntas">Tuntas</option>
              <option value="Belum Tuntas">Belum Tuntas</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            </select>
          </div>

          {/* Filter Jenis */}
          <div>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            >
              <option value="Semua">Semua Jenis Setoran</option>
              <option value="Ziyadah">Ziyadah</option>
              <option value="Murojaah">Murojaah</option>
              <option value="Sabaq">Sabaq</option>
              <option value="Sabki">Sabki</option>
              <option value="Manzil">Manzil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Clock className="animate-spin mb-3 text-gray-300" size={32} />
            <span className="text-sm font-semibold">Memuat riwayat setoran guru...</span>
          </div>
        ) : filteredSetoran.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <FileText className="mb-3 text-gray-300" size={36} />
            <span className="text-sm font-semibold">Tidak ada data setoran guru ditemukan</span>
            <span className="text-xs text-gray-400 mt-1">Coba sesuaikan filter atau tambahkan input baru</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Guru</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Surah & Ayat</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Verifikasi & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSetoran.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs uppercase shadow-sm">
                          {item.guruNama.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-none">{item.guruNama}</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-1">Ustadz/Ustadzah</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                        ${item.jenisSetoran === 'Ziyadah' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                        ${item.jenisSetoran === 'Murojaah' ? 'bg-purple-50 text-purple-700 border border-purple-100' : ''}
                        ${item.jenisSetoran === 'Sabaq' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : ''}
                        ${item.jenisSetoran === 'Sabki' ? 'bg-teal-50 text-teal-700 border border-teal-100' : ''}
                        ${item.jenisSetoran === 'Manzil' ? 'bg-orange-50 text-orange-700 border border-orange-100' : ''}
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
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                        ${item.status === 'Tuntas' ? 'bg-emerald-50 text-emerald-700' : ''}
                        ${item.status === 'Belum Tuntas' ? 'bg-rose-50 text-rose-700' : ''}
                        ${item.status === 'Menunggu Verifikasi' ? 'bg-amber-50 text-amber-700' : ''}
                      `}>
                        {item.status === 'Tuntas' && <CheckCircle2 size={12} />}
                        {item.status === 'Menunggu Verifikasi' && <Clock size={12} />}
                        {item.status === 'Belum Tuntas' && <AlertTriangle size={12} />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Verifications */}
                        {item.status === 'Menunggu Verifikasi' && (
                          <>
                            <button
                              onClick={() => handleVerifyStatus(item.id!, 'Tuntas')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                              title="Tandai Tuntas / Lulus"
                            >
                              <Check size={14} className="stroke-[3]" />
                            </button>
                            <button
                              onClick={() => handleVerifyStatus(item.id!, 'Belum Tuntas')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                              title="Tandai Belum Tuntas / Ulang"
                            >
                              <XOctagon size={14} className="stroke-[3]" />
                            </button>
                          </>
                        )}
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
                  {editingId ? 'Edit Setoran Guru' : 'Input Setoran Guru'}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Formulir Koordinasi Capaian Hafalan Guru</p>
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

              {/* Select Teacher */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Ustadz / Ustadzah</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                  disabled={editingId !== null}
                >
                  <option value="" disabled>Pilih Guru...</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Tanggal Setoran</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Jenis Setoran */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Jenis Setoran</label>
                  <select
                    value={jenisSetoran}
                    onChange={(e) => setJenisSetoran(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                  >
                    <option value="Ziyadah">Ziyadah</option>
                    <option value="Murojaah">Murojaah</option>
                    <option value="Sabaq">Sabaq</option>
                    <option value="Sabki">Sabki</option>
                    <option value="Manzil">Manzil</option>
                  </select>
                </div>
              </div>

              {/* Surah Name Dropdown */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Surah</label>
                <select
                  value={surahName}
                  onChange={(e) => setSurahName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all search-select-fallback"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Status Setoran */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Status Kelulusan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                >
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi (Pending)</option>
                  <option value="Tuntas">Tuntas (Lulus)</option>
                  <option value="Belum Tuntas">Belum Tuntas (Ulangi)</option>
                </select>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Keterangan / Catatan Tambahan</label>
                <textarea
                  placeholder="Contoh: Lancar, Tajwid bagus, dsb."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all resize-none"
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
                  className="px-5 py-2.5 text-xs uppercase tracking-wider font-extrabold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-md transition-all"
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

export default CoordinatorSetoranGuruPage;

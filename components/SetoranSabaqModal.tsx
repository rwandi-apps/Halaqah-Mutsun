import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertCircle, Calendar, BookOpen, FileText, Loader2, Search } from 'lucide-react';
import { Student, SetoranSabaq, User } from '../types';
import { QURAN_MAPPING } from '../services/quranMapping';
import { 
  subscribeToSetoranSabaqByStudent, 
  addSetoranSabaq, 
  updateSetoranSabaq, 
  deleteSetoranSabaq,
  updateStudent
} from '../services/firestoreService';
import { Button } from './Button';

// Helper to get initial surah based on student current memorization progress
const getInitialSurah = (studentObj: any): string => {
  if (!studentObj) return 'Al-Fatihah';
  const sabaq = studentObj.sabaqDisplay || '';
  const progress = studentObj.currentProgress || '';
  const currentJuz = studentObj.currentJuzDisplay || '';

  const findSurahInString = (str: string): string | null => {
    if (!str || str === '-' || str.toLowerCase() === 'belum ada') return null;
    
    const normalizedStr = str.toLowerCase().replace(/['`’]/g, "'");
    const sortedSurahs = [...QURAN_MAPPING].sort((a, b) => b.surah.length - a.surah.length);
    
    for (const q of sortedSurahs) {
      const normalizedSurah = q.surah.toLowerCase().replace(/['`’]/g, "'");
      if (normalizedStr.includes(normalizedSurah)) {
        return q.surah;
      }
    }
    
    const parts = str.split(/[:\-]/);
    for (const part of parts) {
      const trimmedPart = part.trim().toLowerCase().replace(/['`’]/g, "'");
      for (const q of sortedSurahs) {
        const normalizedSurah = q.surah.toLowerCase().replace(/['`’]/g, "'");
        if (trimmedPart === normalizedSurah || normalizedSurah.includes(trimmedPart) || trimmedPart.includes(normalizedSurah)) {
          return q.surah;
        }
      }
    }
    
    return null;
  };

  let found = findSurahInString(sabaq);
  if (found) return found;

  found = findSurahInString(progress);
  if (found) return found;

  found = findSurahInString(currentJuz);
  if (found) return found;

  return 'Al-Fatihah';
};

interface SetoranSabaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student & { totalHafalanDisplay?: string; currentJuzDisplay?: string; sabaqDisplay?: string; targetBaris?: number };
  currentUser: User | null;
  onSaveSuccess?: () => void;
}

export const SetoranSabaqModal: React.FC<SetoranSabaqModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onSaveSuccess
}) => {
  const [history, setHistory] = useState<SetoranSabaq[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSurah, setSelectedSurah] = useState<string>(() => getInitialSurah(student));
  const [surahSearch, setSurahSearch] = useState<string>(selectedSurah);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState<boolean>(false);

  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(1);
  const [jumlahBaris, setJumlahBaris] = useState<number>(student.targetBaris || 10);
  const [hariSetor, setHariSetor] = useState<string[]>(['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
  const [targetBaris, setTargetBaris] = useState<number>(student.targetBaris || 10);
  const [catatan, setCatatan] = useState<string>('');

  // Delete confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Dynamic max ayah based on selected surah
  const [maxAyah, setMaxAyah] = useState<number>(7);

  // Keep search input in sync with selected surah when selectedSurah changes
  useEffect(() => {
    setSurahSearch(selectedSurah);
  }, [selectedSurah]);

  // Set initial surah when the modal opens or student changes
  useEffect(() => {
    if (isOpen && !editingId && !showForm) {
      const initial = getInitialSurah(student);
      setSelectedSurah(initial);
      setSurahSearch(initial);
    }
  }, [isOpen, student.id]);

  // Find max ayah for current surah
  useEffect(() => {
    const quranEntry = QURAN_MAPPING.find(q => q.surah.toLowerCase() === selectedSurah.toLowerCase());
    if (quranEntry) {
      setMaxAyah(quranEntry.end);
    }
  }, [selectedSurah]);

  // Subscribe to real-time setoran sabaq history
  useEffect(() => {
    if (!isOpen || !student.id) return;

    setIsLoadingHistory(true);
    const unsubscribe = subscribeToSetoranSabaqByStudent(student.id, (data) => {
      setHistory(data);
      setIsLoadingHistory(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, student.id]);

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().split('T')[0]);
    setSelectedSurah(getInitialSurah(student));
    setAyatDari(1);
    setAyatSampai(1);
    setJumlahBaris(student.targetBaris || 10);
    setHariSetor(['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
    setTargetBaris(student.targetBaris || 10);
    setCatatan('');
    setShowForm(true);
  };

  const handleOpenEditForm = (item: SetoranSabaq) => {
    setEditingId(item.id || null);
    setTanggal(item.tanggal);
    setSelectedSurah(item.surah);
    setAyatDari(item.ayatDari);
    setAyatSampai(item.ayatSampai);
    setJumlahBaris(item.jumlahBaris || 10);
    setHariSetor(item.hariSetor || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
    setTargetBaris(item.targetBaris || student.targetBaris || 10);
    setCatatan(item.catatan || '');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Sesi guru tidak ditemukan. Silakan login kembali.");
      return;
    }

    const dari = Number(ayatDari);
    const sampai = Number(ayatSampai);

    if (isNaN(dari) || dari <= 0) {
      alert("Ayat Dari harus diisi dengan angka positif.");
      return;
    }
    if (isNaN(sampai) || sampai <= 0) {
      alert("Ayat Sampai harus diisi dengan angka positif.");
      return;
    }
    if (dari > sampai) {
      alert("Ayat Dari tidak boleh lebih besar dari Ayat Sampai.");
      return;
    }
    if (dari > maxAyah) {
      alert(`Ayat Dari tidak boleh melebihi jumlah ayat di surah ${selectedSurah} (${maxAyah} ayat).`);
      return;
    }
    if (sampai > maxAyah) {
      alert(`Ayat Sampai tidak boleh melebihi jumlah ayat di surah ${selectedSurah} (${maxAyah} ayat).`);
      return;
    }

    const isReadOnlyMode = currentUser?.role === 'YAYASAN' || currentUser?.role === 'yayasan';

    if (isReadOnlyMode) {
      alert("Mode Pratinjau (Read-Only): Akun Yayasan hanya dapat melihat data dan tidak dapat menambah atau mengubah setoran.");
      return;
    }

    setIsSubmitting(true);
    try {
      const guruNama = currentUser.nickname || currentUser.name || "Guru";
      const isTargetAchieved = jumlahBaris >= targetBaris;
      const status: 'Tuntas' | 'Belum Tuntas' = isTargetAchieved ? 'Tuntas' : 'Belum Tuntas';

      const payload = {
        tanggal,
        guruId: currentUser.id,
        guruNama,
        halaqahId: student.className, // Class name behaves as halaqah identifier in this system
        halaqahNama: student.className,
        siswaId: student.id,
        namaSiswa: student.name,
        surah: selectedSurah,
        ayatDari: dari,
        ayatSampai: sampai,
        jumlahBaris: Number(jumlahBaris) || 0,
        hariSetor,
        targetBaris,
        status,
        catatan: catatan.trim()
      };

      if (editingId) {
        await updateSetoranSabaq(editingId, payload);
      } else {
        await addSetoranSabaq(payload);
      }

      // Update student's sabaq terakhir in Firestore
      await updateStudent(student.id, {
        currentProgress: `${selectedSurah}: ${sampai}`
      });

      // Call callback to notify parent component to refresh data
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Reset form states
      setAyatDari(sampai + 1 > maxAyah ? maxAyah : sampai + 1);
      setAyatSampai(sampai + 1 > maxAyah ? maxAyah : sampai + 1);
      setCatatan('');
      
      if (editingId) {
        setShowForm(false);
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error saving setoran sabaq:", err);
      alert("Gagal menyimpan setoran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isReadOnlyMode = currentUser?.role === 'YAYASAN' || currentUser?.role === 'yayasan';
    if (isReadOnlyMode) {
      alert("Mode Pratinjau (Read-Only): Akun Yayasan tidak dapat menghapus data.");
      return;
    }
    try {
      await deleteSetoranSabaq(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting setoran sabaq:", err);
      alert("Gagal menghapus setoran. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f4c75] to-[#3282b8] text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold">Input & Detail Setoran Sabaq Pekanan</h3>
            <p className="text-white/80 text-xs mt-1">
              Catatan setoran sabaq pekanan siswa untuk monitoring progres halaqah.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/90 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Identitas Siswa */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Nama Siswa</p>
              <p className="font-bold text-gray-900 text-sm truncate" title={student.name}>{student.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Kelas / Halaqah</p>
              <p className="font-semibold text-gray-800 text-sm">{student.className}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Hafalan</p>
              <p className="font-semibold text-[#0e7490] text-sm">{student.totalHafalanDisplay || "0 Juz"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Sedang Menghafal</p>
              <p className="font-semibold text-gray-800 text-sm">{student.currentJuzDisplay || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Target Pekanan</p>
              <p className="font-bold text-emerald-700 text-sm">{student.targetBaris || 10} Baris/Pekan</p>
            </div>
          </div>

          {/* Form Tambah/Edit (Collapsible) */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-sky-50/50 border border-sky-100 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                <h4 className="font-bold text-[#0f4c75] text-sm flex items-center gap-1.5">
                  <BookOpen size={16} />
                  {editingId ? "Edit Setoran Sabaq Pekanan" : "Form Setoran Sabaq Pekanan Baru"}
                </h4>
                <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-medium">
                  Sabaq Terakhir: {student.sabaqDisplay || "-"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Tanggal / Pekan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Pekan Tanggal
                  </label>
                  <input 
                    type="date" 
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white font-semibold"
                  />
                </div>

                {/* Surah (Searchable Combobox) */}
                <div className="space-y-1.5 relative" id="surah-autocomplete-container">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <BookOpen size={14} className="text-gray-400" /> Surah
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={surahSearch}
                      onChange={(e) => {
                        setSurahSearch(e.target.value);
                        setIsSurahDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsSurahDropdownOpen(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsSurahDropdownOpen(false);
                          const match = QURAN_MAPPING.find(q => q.surah.toLowerCase() === surahSearch.trim().toLowerCase());
                          if (match) {
                            setSelectedSurah(match.surah);
                            setSurahSearch(match.surah);
                          } else {
                            setSurahSearch(selectedSurah);
                          }
                        }, 200);
                      }}
                      placeholder="Ketik nama surah..."
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white pr-8 font-semibold text-gray-800"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Search size={14} />
                    </div>
                  </div>

                  {isSurahDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-50">
                      {(() => {
                        const normalizedSearch = surahSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const filtered = normalizedSearch === '' 
                          ? QURAN_MAPPING 
                          : QURAN_MAPPING.filter(q => {
                              const normalizedSurah = q.surah.toLowerCase().replace(/[^a-z0-9]/g, '');
                              return normalizedSurah.includes(normalizedSearch);
                            });

                        if (filtered.length > 0) {
                          return filtered.map((q) => (
                            <button
                              key={q.surah}
                              type="button"
                              onMouseDown={() => {
                                setSelectedSurah(q.surah);
                                setSurahSearch(q.surah);
                                setIsSurahDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-sky-50 transition-colors flex justify-between items-center ${
                                selectedSurah === q.surah ? 'bg-sky-50 text-sky-700 font-bold' : 'text-gray-700'
                              }`}
                            >
                              <span>{q.surah}</span>
                              <span className="text-[10px] text-gray-400 font-medium">{q.end} Ayat</span>
                            </button>
                          ));
                        } else {
                          return (
                            <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                              Surah tidak ditemukan
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                {/* Ayat Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Ayat Dari</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      max={maxAyah}
                      value={ayatDari === 0 ? '' : ayatDari}
                      onChange={(e) => setAyatDari(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Sampai</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      max={maxAyah}
                      value={ayatSampai === 0 ? '' : ayatSampai}
                      onChange={(e) => setAyatSampai(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Capaian Baris & Hari Setor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Capaian Baris (Pekan Ini)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={jumlahBaris}
                      onChange={(e) => setJumlahBaris(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white font-bold text-gray-900"
                    />
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">/ {targetBaris} Target Baris</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Hari Setor Dalam Pekan Ini</label>
                  <div className="flex gap-1.5 pt-0.5">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum'].map((day) => {
                      const isSelected = hariSetor.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (hariSetor.length > 1) {
                                setHariSetor(hariSetor.filter(h => h !== day));
                              }
                            } else {
                              setHariSetor([...hariSetor, day]);
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <FileText size={14} className="text-gray-400" /> Catatan Pekanan (Opsional)
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Sangat lancar, tajwid makhraj konsisten, dll."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelForm}
                  className="text-xs py-2 px-4 border-gray-300 text-gray-700 hover:bg-gray-100 font-bold"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="text-xs bg-[#0f4c75] hover:bg-[#1b4f72] text-white py-2 px-5 flex items-center gap-1 font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Setoran Pekanan"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Riwayat Setoran Sabaq Pekanan */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <BookOpen size={18} className="text-[#0f4c75]" />
                  <span>Riwayat Setoran Sabaq Pekanan</span>
                  <span className="text-xs font-bold text-[#0e7490] bg-cyan-50 border border-cyan-100 px-2.5 py-0.5 rounded-full">
                    {history.length} Pekan Recorded
                  </span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Catatan pencapaian setoran sabaq berbasis pekanan (1 record per pekan).
                </p>
              </div>

              {!showForm && (
                <Button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="text-xs bg-[#0f4c75] hover:bg-[#1b4f72] text-white py-2 px-3.5 flex items-center gap-1.5 rounded-lg shadow-xs font-bold self-start sm:self-auto"
                >
                  <Plus size={14} />
                  Tambah Pekan Setoran
                </Button>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-gray-400" />
                <span className="text-xs font-semibold">Memuat riwayat setoran pekanan...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, index) => {
                  const isCompleted = item.status === 'Tuntas';
                  const isNoNew = item.noNewMemorization;
                  const target = item.targetBaris || student.targetBaris || 10;
                  const achieved = item.jumlahBaris || 0;
                  const pct = Math.min(100, Math.round((achieved / target) * 100));

                  const formattedDate = new Date(item.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });

                  const allDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

                  return (
                    <div 
                      key={item.id || index}
                      className="bg-white border border-gray-200 hover:border-sky-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
                    >
                      {/* Card Header: Week Info, Status & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-black text-gray-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Calendar size={13} className="text-[#0f4c75]" />
                            Pekan: {formattedDate}
                          </span>

                          {isNoNew ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              🟢 {item.memorizationReason || "Murajaah"}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isCompleted 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isCompleted ? <Check size={12} className="stroke-[3]" /> : <AlertCircle size={12} className="stroke-[3]" />}
                              {item.status}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                              <span className="text-[10px] text-red-600 font-bold px-1">Yakin hapus?</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id!)}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-0.5 px-2 rounded transition-colors"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-0.5 px-2 rounded transition-colors"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(item)}
                                className="p-1.5 text-gray-500 hover:text-[#0ea5e9] hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                                title="Edit Pekan Setoran"
                              >
                                <Pencil size={14} />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id || null)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Pekan Setoran"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body: Surah/Ayat Range & Baris Target */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Column 1: Surah & Ayat */}
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pencapaian Surah & Ayat</p>
                          {isNoNew ? (
                            <p className="text-sm font-semibold text-gray-500 italic">
                              Tidak ada penambahan hafalan pekan ini ({item.memorizationReason || 'Murajaah'})
                            </p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-gray-900 text-sm">
                                {item.surah}
                                {item.surahSampai && item.surahSampai !== item.surah ? ` — ${item.surahSampai}` : ''}
                              </span>
                              <span className="text-xs font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                                Ayat {item.ayatDari} - {item.ayatSampai}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Baris Meter */}
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-500">Capaian Baris:</span>
                            <span className={pct >= 100 ? 'text-emerald-700' : 'text-amber-700'}>
                              {achieved} / {target} Baris ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hari Setor Badges & Notes */}
                      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-slate-100">
                        {/* Hari Setor Chips */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Hari Setor:</span>
                          <div className="flex gap-1">
                            {allDays.map((day) => {
                              const active = item.hariSetor?.includes(day);
                              return (
                                <span
                                  key={day}
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    active
                                      ? 'bg-sky-600 text-white font-black'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {day}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Guru & Note */}
                        <div className="flex items-center gap-3 text-gray-500 text-xs">
                          {item.catatan && (
                            <span className="italic max-w-[250px] truncate text-gray-600" title={item.catatan}>
                              💬 "{item.catatan}"
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-gray-400">
                            Guru: {item.guruNama || 'Guru'}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <BookOpen size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-xs font-bold">Belum ada riwayat setoran Sabaq pekanan untuk siswa ini.</p>
                <p className="text-gray-400 text-[11px] mt-1">Klik "Tambah Pekan Setoran" di atas untuk menambahkan catatan pekanan baru.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <Button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-2.5 px-5"
          >
            Selesai & Tutup
          </Button>
        </div>

      </div>
    </div>
  );
};

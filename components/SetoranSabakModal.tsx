import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Check, AlertCircle, Calendar, BookOpen, FileText, Loader2, Search } from 'lucide-react';
import { Student, SetoranSabak, User } from '../types';
import { QURAN_MAPPING } from '../services/quranMapping';
import { 
  subscribeToSetoranSabakByStudent, 
  addSetoranSabak, 
  updateSetoranSabak, 
  deleteSetoranSabak,
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

interface SetoranSabakModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student & { totalHafalanDisplay?: string; currentJuzDisplay?: string };
  currentUser: User | null;
  onSaveSuccess?: () => void;
}

export const SetoranSabakModal: React.FC<SetoranSabakModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onSaveSuccess
}) => {
  const [history, setHistory] = useState<SetoranSabak[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSurah, setSelectedSurah] = useState<string>(() => getInitialSurah(student));
  const [surahSearch, setSurahSearch] = useState<string>(selectedSurah);
  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState<boolean>(false);

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
  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(1);
  const [status, setStatus] = useState<'Tuntas' | 'Belum Tuntas'>('Tuntas');
  const [catatan, setCatatan] = useState<string>('');

  // Delete confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Dynamic max ayah based on selected surah
  const [maxAyah, setMaxAyah] = useState<number>(7);

  // Find max ayah for current surah
  useEffect(() => {
    const quranEntry = QURAN_MAPPING.find(q => q.surah.toLowerCase() === selectedSurah.toLowerCase());
    if (quranEntry) {
      setMaxAyah(quranEntry.end);
    }
  }, [selectedSurah]);

  // Subscribe to real-time setoran sabak history
  useEffect(() => {
    if (!isOpen || !student.id) return;

    setIsLoadingHistory(true);
    const unsubscribe = subscribeToSetoranSabakByStudent(student.id, (data) => {
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
    setStatus('Tuntas');
    setCatatan('');
    setShowForm(true);
  };

  const handleOpenEditForm = (item: SetoranSabak) => {
    setEditingId(item.id || null);
    setTanggal(item.tanggal);
    setSelectedSurah(item.surah);
    setAyatDari(item.ayatDari);
    setAyatSampai(item.ayatSampai);
    setStatus(item.status);
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

    setIsSubmitting(true);
    try {
      const guruNama = currentUser.nickname || currentUser.name || "Guru";
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
        status,
        catatan: catatan.trim()
      };

      if (editingId) {
        await updateSetoranSabak(editingId, payload);
      } else {
        await addSetoranSabak(payload);
      }

      // Update student's sabaq terakhir in Firestore
      await updateStudent(student.id, {
        currentProgress: `${selectedSurah} : ${sampai}`
      });

      // Call callback to notify parent component to refresh data
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Reset form states but keep date and surah for rapid data input if desired
      setAyatDari(sampai + 1 > maxAyah ? maxAyah : sampai + 1);
      setAyatSampai(sampai + 1 > maxAyah ? maxAyah : sampai + 1);
      setCatatan('');
      
      // Auto-focus back to form or toggle form visibility if user wants to close it
      if (editingId) {
        // If it was an edit, close the form
        setShowForm(false);
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error saving setoran sabak:", err);
      alert("Gagal menyimpan setoran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSetoranSabak(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting setoran sabak:", err);
      alert("Gagal menghapus setoran. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f4c75] to-[#3282b8] text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold">Input Setoran Sabaq</h3>
            <p className="text-white/80 text-xs mt-1">
              Catatan setoran harian siswa untuk monitoring progres halaqah.
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
            <div className="col-span-2 md:col-span-1 flex items-center md:justify-end">
              {!showForm && (
                <Button 
                  onClick={handleOpenAddForm}
                  className="w-full md:w-auto bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold py-2 px-3.5 flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Tambah Setoran
                </Button>
              )}
            </div>
          </div>

          {/* Form Tambah/Edit (Collapsible) */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-sky-50/50 border border-sky-100 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                <h4 className="font-bold text-[#0f4c75] text-sm flex items-center gap-1.5">
                  <BookOpen size={16} />
                  {editingId ? "Edit Setoran Sabaq" : "Form Setoran Sabaq Baru"}
                </h4>
                <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-medium">
                  Sabaq Terakhir: {student.sabaqDisplay || "-"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Tanggal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" /> Tanggal Setoran
                  </label>
                  <input 
                    type="date" 
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white"
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
                          // Revert if not exact match or find the closest match
                          const match = QURAN_MAPPING.find(q => q.surah.toLowerCase() === surahSearch.trim().toLowerCase());
                          if (match) {
                            setSelectedSurah(match.surah);
                            setSurahSearch(match.surah);
                          } else {
                            // Reset to previous selected
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

                {/* Ayat Range & Status */}
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#0ea5e9] outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <FileText size={14} className="text-gray-400" /> Catatan Tambahan (Opsional)
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Lancar, tajwid perlu ditingkatkan, dll."
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
                  className="text-xs py-2 px-4 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="text-xs bg-[#0f4c75] hover:bg-[#1b4f72] text-white py-2 px-5 flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Setoran"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Riwayat Setoran */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <span>Riwayat Setoran Sabaq</span>
              <span className="text-xs font-normal text-gray-500">
                ({history.length} setoran tercatat)
              </span>
            </h4>

            {isLoadingHistory ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-gray-400" />
                <span className="text-xs">Memuat riwayat setoran...</span>
              </div>
            ) : history.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-gray-500">
                    <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Tanggal Setoran</th>
                        <th className="px-6 py-3 font-semibold">Surah</th>
                        <th className="px-6 py-3 font-semibold">Ayat</th>
                        <th className="px-6 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 font-semibold">Catatan</th>
                        <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                            {item.surah}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                            Ayat {item.ayatDari} - {item.ayatSampai}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'Tuntas' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status === 'Tuntas' ? (
                                <Check size={10} className="stroke-[3]" />
                              ) : (
                                <AlertCircle size={10} className="stroke-[3]" />
                              )}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 max-w-[200px] truncate text-gray-600" title={item.catatan}>
                            {item.catatan || "-"}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right">
                            {confirmDeleteId === item.id ? (
                              <div className="flex justify-end gap-1.5 items-center">
                                <span className="text-[10px] text-red-600 font-bold">Hapus?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id!)}
                                  className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md transition-colors"
                                >
                                  Ya
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-md transition-colors"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditForm(item)}
                                  className="p-1 text-gray-400 hover:text-[#0ea5e9] rounded transition-colors"
                                  title="Edit Setoran"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id || null)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Hapus Setoran"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <BookOpen size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-xs">Belum ada riwayat setoran Sabaq untuk siswa ini.</p>
                <p className="text-gray-400 text-[10px] mt-1">Gunakan tombol "Tambah Setoran" di atas untuk mencatat setoran baru.</p>
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

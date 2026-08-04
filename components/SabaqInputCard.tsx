import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Check, Edit3, Save, ArrowDown, Target, BookOpen, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Student, SetoranSabaq, User } from '../types';
import { QURAN_MAPPING, calculateHafalan } from '../services/quranMapping';
import { addSetoranSabaq, updateSetoranSabaq, updateStudent } from '../services/firestoreService';

const HARI_LIST = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

export interface SabaqInputCardProps {
  student: Student & { 
    totalHafalanDisplay?: string; 
    currentJuzDisplay?: string; 
    sabaqDisplay?: string;
  };
  index: number;
  totalStudents: number;
  currentUser: User | null;
  tanggal: string; // YYYY-MM-DD
  latestSetoranFromPrevWeek?: SetoranSabaq | null;
  existingSetoranThisWeek?: SetoranSabaq | null;
  onSavedSuccess: () => void;
  onNextCard?: (currentIndex: number) => void;
  isActive?: boolean;
}

export const SabaqInputCard = forwardRef<HTMLDivElement, SabaqInputCardProps>(({
  student,
  index,
  totalStudents,
  currentUser,
  tanggal,
  latestSetoranFromPrevWeek,
  existingSetoranThisWeek,
  onSavedSuccess,
  onNextCard,
  isActive = false
}, ref) => {
  // Target Baris (default 10 baris if not set)
  const [targetBaris, setTargetBaris] = useState<number>(() => {
    return student.targetBaris || 10;
  });
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>(String(targetBaris));

  // Form Fields
  const [noNewMemorization, setNoNewMemorization] = useState<boolean>(false);
  const [memorizationReason, setMemorizationReason] = useState<string>('');
  const [isMultiSurah, setIsMultiSurah] = useState<boolean>(false);
  const [surah, setSurah] = useState<string>('Al-Fatihah');
  const [surahSampai, setSurahSampai] = useState<string>('Al-Fatihah');
  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(1);
  const [jumlahBaris, setJumlahBaris] = useState<number>(0);
  const [selectedHari, setSelectedHari] = useState<string[]>([]);
  const [catatan, setCatatan] = useState<string>('');

  // UI & Saved State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Max ayah for chosen surahs
  const [maxAyahFrom, setMaxAyahFrom] = useState<number>(7);
  const [maxAyahTo, setMaxAyahTo] = useState<number>(7);

  // Synchronize max ayah whenever surah or surahSampai changes
  useEffect(() => {
    const q1 = QURAN_MAPPING.find(m => m.surah.toLowerCase() === surah.toLowerCase());
    setMaxAyahFrom(q1 ? q1.end : 286);

    const targetTo = isMultiSurah ? surahSampai : surah;
    const q2 = QURAN_MAPPING.find(m => m.surah.toLowerCase() === targetTo.toLowerCase());
    setMaxAyahTo(q2 ? q2.end : 286);
  }, [surah, surahSampai, isMultiSurah]);

  // AUTO-FILL logic on mount or data change
  useEffect(() => {
    if (existingSetoranThisWeek) {
      // Existing record for this date/week
      const isNoNew = Boolean(existingSetoranThisWeek.noNewMemorization);
      setNoNewMemorization(isNoNew);
      setMemorizationReason(existingSetoranThisWeek.memorizationReason || '');
      setSurah(existingSetoranThisWeek.surah || 'Al-Fatihah');
      const endSur = existingSetoranThisWeek.surahSampai || existingSetoranThisWeek.surah || 'Al-Fatihah';
      setSurahSampai(endSur);
      setIsMultiSurah(Boolean(existingSetoranThisWeek.surahSampai && existingSetoranThisWeek.surahSampai !== existingSetoranThisWeek.surah));
      setAyatDari(existingSetoranThisWeek.ayatDari || 1);
      setAyatSampai(existingSetoranThisWeek.ayatSampai || 1);
      if (isNoNew) {
        setJumlahBaris(0);
        setSelectedHari([]);
      } else {
        if (existingSetoranThisWeek.jumlahBaris !== undefined) {
          setJumlahBaris(existingSetoranThisWeek.jumlahBaris);
        } else {
          setJumlahBaris(0);
        }
        setSelectedHari(existingSetoranThisWeek.hariSetor || []);
      }
      setCatatan(existingSetoranThisWeek.catatan || '');
      if (existingSetoranThisWeek.targetBaris) {
        setTargetBaris(existingSetoranThisWeek.targetBaris);
        setCustomTargetInput(String(existingSetoranThisWeek.targetBaris));
      }
      setIsSaved(true);
      setIsEditing(false);
      setSavedDocId(existingSetoranThisWeek.id || null);

      const ts = existingSetoranThisWeek.updatedAt || existingSetoranThisWeek.createdAt;
      if (ts) {
        if (ts instanceof Date) setLastSavedTime(ts);
        else if (typeof ts === 'string' || typeof ts === 'number') setLastSavedTime(new Date(ts));
        else if (typeof ts === 'object' && ts.seconds) setLastSavedTime(new Date(ts.seconds * 1000));
      } else {
        setLastSavedTime(null);
      }
    } else if (latestSetoranFromPrevWeek) {
      // Auto-fill from previous week's setoran
      setNoNewMemorization(false);
      setMemorizationReason('');
      const prevStartSurah = latestSetoranFromPrevWeek.surah;
      const prevEndSurah = latestSetoranFromPrevWeek.surahSampai || prevStartSurah;
      const prevEndAyat = latestSetoranFromPrevWeek.ayatSampai;
      const q = QURAN_MAPPING.find(m => m.surah.toLowerCase() === prevEndSurah.toLowerCase());
      const maxAy = q ? q.end : 286;

      let nextSurah = prevEndSurah;
      let nextStartAyat = prevEndAyat + 1;

      if (nextStartAyat > maxAy) {
        // Find next surah in Quran order
        const currIndex = QURAN_MAPPING.findIndex(m => m.surah.toLowerCase() === prevEndSurah.toLowerCase());
        if (currIndex >= 0 && currIndex < QURAN_MAPPING.length - 1) {
          nextSurah = QURAN_MAPPING[currIndex + 1].surah;
          nextStartAyat = 1;
        } else {
          nextStartAyat = maxAy;
        }
      }

      const defaultEndAyat = Math.min(nextStartAyat + 5, QURAN_MAPPING.find(m => m.surah.toLowerCase() === nextSurah.toLowerCase())?.end || 286);
      
      setSurah(nextSurah);
      setSurahSampai(nextSurah);
      setIsMultiSurah(false);
      setAyatDari(nextStartAyat);
      setAyatSampai(defaultEndAyat);
      setJumlahBaris(0);
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setIsEditing(false);
      setSavedDocId(null);
      setLastSavedTime(null);
    } else if (student.sabaqDisplay && student.sabaqDisplay !== '-' && student.sabaqDisplay !== 'Belum Ada') {
      // Parse from student.sabaqDisplay (e.g. "Al-Mulk: 14")
      setNoNewMemorization(false);
      setMemorizationReason('');
      const match = student.sabaqDisplay.match(/^(.+?)\s*[:\-–]\s*(\d+)$/i);
      if (match) {
        const parsedSurah = match[1].trim();
        const parsedAyat = parseInt(match[2].trim(), 10) || 1;
        const qEntry = QURAN_MAPPING.find(m => m.surah.toLowerCase() === parsedSurah.toLowerCase());
        if (qEntry) {
          const nextAy = Math.min(parsedAyat + 1, qEntry.end);
          const endAy = Math.min(nextAy + 5, qEntry.end);
          setSurah(qEntry.surah);
          setSurahSampai(qEntry.surah);
          setIsMultiSurah(false);
          setAyatDari(nextAy);
          setAyatSampai(endAy);
          setJumlahBaris(0);
        } else {
          setSurah('Al-Fatihah');
          setSurahSampai('Al-Fatihah');
          setIsMultiSurah(false);
          setAyatDari(1);
          setAyatSampai(7);
          setJumlahBaris(0);
        }
      } else {
        setSurah('Al-Fatihah');
        setSurahSampai('Al-Fatihah');
        setIsMultiSurah(false);
        setAyatDari(1);
        setAyatSampai(7);
        setJumlahBaris(0);
      }
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setIsEditing(false);
      setSavedDocId(null);
      setLastSavedTime(null);
    } else {
      // Default initial state
      setNoNewMemorization(false);
      setMemorizationReason('');
      setSurah('Al-Fatihah');
      setSurahSampai('Al-Fatihah');
      setIsMultiSurah(false);
      setAyatDari(1);
      setAyatSampai(7);
      setJumlahBaris(0);
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setIsEditing(false);
      setSavedDocId(null);
      setLastSavedTime(null);
    }
  }, [existingSetoranThisWeek, latestSetoranFromPrevWeek, student]);

  // Toggle day selection
  const toggleHari = (day: string) => {
    if (noNewMemorization || (isSaved && !isEditing)) return;
    if (selectedHari.includes(day)) {
      setSelectedHari(selectedHari.filter(d => d !== day));
    } else {
      setSelectedHari([...selectedHari, day]);
    }
  };

  // Automated Status calculation based on target
  const isTargetAchieved = jumlahBaris >= targetBaris;

  // Save handler
  const handleSave = async (shouldAdvanceNext = false) => {
    if (!currentUser) {
      alert("Sesi login guru tidak ditemukan.");
      return;
    }

    if (noNewMemorization) {
      if (!memorizationReason.trim()) {
        alert("Silakan pilih alasan tidak adanya setoran sabaq.");
        return;
      }
    } else {
      if (ayatDari <= 0 || ayatSampai <= 0) {
        alert("Ayat harus lebih besar dari 0.");
        return;
      }

      if (!isMultiSurah && ayatDari > ayatSampai) {
        alert("Ayat Dari tidak boleh lebih besar dari Ayat Sampai.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const targetEndSurah = isMultiSurah ? surahSampai : surah;
      const guruNama = currentUser.nickname || currentUser.name || "Guru";
      const payload: Omit<SetoranSabaq, 'id' | 'createdAt' | 'updatedAt'> = {
        tanggal,
        guruId: currentUser.id,
        guruNama,
        halaqahId: student.className,
        halaqahNama: student.className,
        siswaId: student.id,
        namaSiswa: student.name,
        surah,
        surahSampai: targetEndSurah,
        ayatDari,
        ayatSampai,
        jumlahBaris: noNewMemorization ? 0 : (Number(jumlahBaris) || 0),
        hariSetor: noNewMemorization ? [] : selectedHari,
        targetBaris,
        status: noNewMemorization ? 'Tuntas' : (isTargetAchieved ? 'Tuntas' : 'Belum Tuntas'),
        noNewMemorization,
        memorizationReason: noNewMemorization ? memorizationReason : null,
        catatan: catatan.trim()
      };

      let docId = savedDocId;
      if (docId) {
        await updateSetoranSabaq(docId, payload);
      } else {
        docId = await addSetoranSabaq(payload);
        setSavedDocId(docId);
      }

      // Update student's sabaq terakhir in Firestore
      if (!noNewMemorization) {
        const progressText = isMultiSurah && surah !== targetEndSurah
          ? `${surah} - ${targetEndSurah}: ${ayatSampai}`
          : `${surah}: ${ayatSampai}`;

        await updateStudent(student.id, {
          currentProgress: progressText,
          targetBaris: targetBaris
        });
      } else {
        await updateStudent(student.id, {
          targetBaris: targetBaris
        });
      }

      setIsSaved(true);
      setIsEditing(false);
      const now = new Date();
      setLastSavedTime(now);

      // Trigger Toast notification
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Trigger flash animation for 500ms
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
      }, 500);

      onSavedSuccess();

      if (shouldAdvanceNext && onNextCard) {
        setTimeout(() => {
          onNextCard(index);
        }, 250);
      }
    } catch (err) {
      console.error("Error saving setoran sabaq card:", err);
      alert("Gagal menyimpan setoran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTarget = () => {
    const val = parseInt(customTargetInput, 10);
    if (!isNaN(val) && val > 0) {
      setTargetBaris(val);
      setIsEditingTarget(false);
    } else {
      alert("Target baris harus berupa angka positif.");
    }
  };

  // Helper for saved timestamp string
  const formatSavedTime = (time: Date | null) => {
    if (!time) return "Disimpan pekan ini";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffSec < 15) {
      return "Disimpan beberapa detik yang lalu";
    } else if (diffSec < 60) {
      return `Disimpan ${diffSec} detik yang lalu`;
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `Disimpan ${mins} menit yang lalu`;
    } else {
      const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `Terakhir disimpan pukul ${timeStr} WIB`;
    }
  };

  // Helper for summary text
  const getSummaryText = () => {
    if (noNewMemorization) {
      return `Tidak Ada Setoran (${memorizationReason || 'Murajaah'})`;
    }
    const endS = isMultiSurah ? surahSampai : surah;
    const surahText = isMultiSurah && surah !== endS
      ? `${surah} ${ayatDari} – ${endS} ${ayatSampai}`
      : `${surah} ${ayatDari}–${ayatSampai}`;
    const barisText = `${jumlahBaris} Baris`;
    return `${surahText} • ${barisText}`;
  };

  const isFormDisabled = isSaved && !isEditing;

  return (
    <div 
      ref={ref}
      id={`student-sabaq-card-${index}`}
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
        isFlashing
          ? 'ring-4 ring-emerald-500 bg-emerald-100 scale-[1.01] border-emerald-400'
          : isActive 
          ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-emerald-100/50' 
          : isSaved 
          ? 'border-emerald-300 bg-emerald-50/20' 
          : 'border-gray-200'
      }`}
    >
      {/* TOAST NOTIFICATION ON SUCCESS */}
      {showToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 font-bold text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Check size={16} className="stroke-[3] bg-white text-emerald-700 rounded-full p-0.5" />
            <span>Setoran berhasil disimpan</span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowToast(false)} 
            className="text-emerald-100 hover:text-white text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER CARD - Slightly more contrasted header when saved */}
      <div className={`p-4 md:p-5 transition-colors ${
        isSaved && !isEditing
          ? 'bg-emerald-50/40'
          : 'bg-white border-b border-gray-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs mt-0.5 sm:mt-0">
              {index + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{student.name}</h3>
                
                {/* BADGE TERSIMPAN (Prominent & Larger) */}
                {isSaved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-lg shadow-2xs border border-emerald-700 animate-in fade-in duration-300">
                    <Check size={14} className="stroke-[3]" /> ✓ Setoran Pekan Ini Sudah Disimpan
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-xs font-semibold text-gray-500">
                  Progress: <span className="text-emerald-700 font-bold">{student.totalHafalanDisplay || student.currentJuzDisplay || "Belum Ada"}</span>
                </p>

                {/* INFORMASI WAKTU PENYIMPANAN */}
                {isSaved && (
                  <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    {formatSavedTime(lastSavedTime)}
                  </span>
                )}
              </div>

              {/* RINGKASAN KECIL SETELAH TERSIMPAN */}
              {isSaved && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 shadow-2xs">
                  <BookOpen size={13} className="text-emerald-600 shrink-0" />
                  <span>{getSummaryText()}</span>
                </div>
              )}
            </div>
          </div>

          {/* TARGET MINGGUAN BADGE & EDIT BUTTON */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {isEditingTarget ? (
              <div className="flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-amber-900 pl-1">Target:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="200"
                  value={customTargetInput}
                  onChange={(e) => setCustomTargetInput(e.target.value)}
                  className="w-14 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-amber-800">Baris</span>
                <button 
                  type="button"
                  onClick={handleSaveTarget}
                  className="p-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  title="Simpan Target"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold flex items-center gap-1">
                  <Target size={14} className="text-emerald-600" />
                  Target Mingguan: <span className="font-black text-emerald-900">{targetBaris} Baris</span>
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    if (isSaved && !isEditing) setIsEditing(true);
                    setIsEditingTarget(true);
                  }} 
                  className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded-md hover:bg-emerald-100 transition-colors ml-1"
                  title="Ubah Target Mingguan"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COMPACT MODE ACTIONS WHEN SAVED */}
        {isSaved && !isEditing && (
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit3 size={15} className="text-emerald-600" />
              ✏ Edit Setoran
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNextCard) {
                  onNextCard(index);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <span>➡ Lanjut ke Siswa Berikutnya</span>
            </button>
          </div>
        )}
      </div>

      {/* EXPANDABLE CARD CONTENT BODY (Shown when not saved or editing) */}
      {(!isSaved || isEditing) && (
        <div className="p-5 md:p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-gray-100">
          {/* NO NEW MEMORIZATION CHECKBOX & REASON */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noNewMemorization}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNoNewMemorization(checked);
                  if (checked) {
                    setJumlahBaris(0);
                    setSelectedHari([]);
                  } else {
                    setJumlahBaris(0);
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800">
                Pekan ini tidak ada setoran sabaq (hafalan baru)
              </span>
            </label>

            {noNewMemorization && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-amber-900">Alasan:</span>
                <select
                  value={memorizationReason}
                  onChange={(e) => setMemorizationReason(e.target.value)}
                  className="bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
                >
                  <option value="">-- Pilih Alasan --</option>
                  <option value="Murajaah">Murajaah</option>
                  <option value="Persiapan Tasmi'">Persiapan Tasmi'</option>
                  <option value="Persiapan Syahadah">Persiapan Syahadah</option>
                  <option value="Tasmi'">Tasmi'</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            )}
          </div>

          {/* INPUT FORM BODY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* INPUT 1: SETORAN SABAQ (Surat & Ayat) - 5 cols */}
            <div className={`md:col-span-5 bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-3 transition-opacity ${noNewMemorization ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-gray-200/60">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <BookOpen size={13} className="text-emerald-600" /> 1. Setoran Sabaq
                </label>

                {/* Toggle Mode */}
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    disabled={noNewMemorization}
                    onClick={() => {
                      setIsMultiSurah(false);
                      setSurahSampai(surah);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      !isMultiSurah
                        ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    1 Surah
                  </button>
                  <button
                    type="button"
                    disabled={noNewMemorization}
                    onClick={() => {
                      setIsMultiSurah(true);
                      const endS = surahSampai || surah;
                      setSurahSampai(endS);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      isMultiSurah
                        ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lintas / Banyak Surah
                  </button>
                </div>
              </div>

              {!isMultiSurah ? (
                /* MODE SATU SURAH */
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 block mb-1">Surat</span>
                    <select 
                      value={surah}
                      disabled={noNewMemorization}
                      onChange={(e) => {
                        const newS = e.target.value;
                        setSurah(newS);
                        setSurahSampai(newS);
                        const q = QURAN_MAPPING.find(m => m.surah.toLowerCase() === newS.toLowerCase());
                        const mAy = q ? q.end : 286;
                        const newDari = 1;
                        const newSampai = Math.min(7, mAy);
                        setAyatDari(newDari);
                        setAyatSampai(newSampai);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {QURAN_MAPPING.map(q => (
                        <option key={q.surah} value={q.surah}>
                          {q.surah} ({q.end} Ayat)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-600 block mb-1">Ayat Dari</span>
                      <input 
                        type="number" 
                        min="1" 
                        max={maxAyahFrom}
                        disabled={noNewMemorization}
                        value={ayatDari === 0 ? '' : ayatDari}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setAyatDari(val);
                          }
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-600 block mb-1">Sampai</span>
                      <input 
                        type="number" 
                        min="1" 
                        max={maxAyahFrom}
                        disabled={noNewMemorization}
                        value={ayatSampai === 0 ? '' : ayatSampai}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setAyatSampai(val);
                          }
                        }}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE LINTAS / BANYAK SURAH */
                <div className="space-y-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/70">
                  <div className="text-[10px] text-emerald-900 font-medium bg-emerald-100/70 p-2 rounded-lg flex items-center gap-1.5">
                    <span className="font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[8px] shrink-0">Lintas Surah</span>
                    <span>Setoran beberapa surat (contoh: An-Nas s/d Al-Ikhlas)</span>
                  </div>

                  {/* DARI SURAH & AYAT */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">Dari Surah</span>
                      <select 
                        value={surah}
                        disabled={noNewMemorization}
                        onChange={(e) => {
                          const newS = e.target.value;
                          setSurah(newS);
                        }}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {QURAN_MAPPING.map(q => (
                          <option key={`from-${q.surah}`} value={q.surah}>
                            {q.surah}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">Ayat</span>
                      <input 
                        type="number" 
                        min="1" 
                        max={maxAyahFrom}
                        disabled={noNewMemorization}
                        value={ayatDari === 0 ? '' : ayatDari}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setAyatDari(val);
                          }
                        }}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* SAMPAI SURAH & AYAT */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">Sampai Surah</span>
                      <select 
                        value={surahSampai}
                        disabled={noNewMemorization}
                        onChange={(e) => {
                          const newS = e.target.value;
                          setSurahSampai(newS);
                        }}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {QURAN_MAPPING.map(q => (
                          <option key={`to-${q.surah}`} value={q.surah}>
                            {q.surah}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">Ayat</span>
                      <input 
                        type="number" 
                        min="1" 
                        max={maxAyahTo}
                        disabled={noNewMemorization}
                        value={ayatSampai === 0 ? '' : ayatSampai}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setAyatSampai(val);
                          }
                        }}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT 2 & 3: JUMLAH BARIS & HARI SETOR - 4 cols */}
            <div className="md:col-span-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100 flex flex-col justify-between space-y-3">
              
              {/* INPUT 2: JUMLAH BARIS */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  2. Jumlah Baris
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="number" 
                    min="0" 
                    max="500"
                    disabled={noNewMemorization}
                    value={noNewMemorization ? 0 : (jumlahBaris === 0 ? '' : jumlahBaris)}
                    onChange={(e) => {
                      if (noNewMemorization) return;
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setJumlahBaris(val);
                      }
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-base font-black outline-none shadow-2xs pr-16 ${
                      noNewMemorization
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <span className="absolute right-3 text-xs font-bold text-gray-400 pointer-events-none">
                    Baris
                  </span>
                </div>
              </div>

              {/* INPUT 3: HARI SETOR */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  3. Hari Setor
                </label>
                <div className="flex items-center gap-1.5">
                  {HARI_LIST.map(day => {
                    const isSelected = !noNewMemorization && selectedHari.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={noNewMemorization}
                        onClick={() => toggleHari(day)}
                        className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-bold border transition-all ${
                          noNewMemorization
                            ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-105'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* INPUT 4 & PROGRESS - 3 cols */}
            <div className="md:col-span-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 flex flex-col justify-between space-y-3">
              
              {/* INPUT 4: STATUS (OTOMATIS) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  4. Status
                </label>
                <div className="mt-0.5">
                  {noNewMemorization ? (
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      🟢 {memorizationReason || "Murajaah"}
                    </div>
                  ) : isTargetAchieved ? (
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      🟢 Target Tercapai
                    </div>
                  ) : (
                    <div className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      🟡 Belum Tercapai
                    </div>
                  )}
                </div>
              </div>

              {/* PROGRESS BAR MINGGUAN / DESKRIPSI TANPA SABAQ */}
              {noNewMemorization ? (
                <div className="mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 leading-snug">
                  Tidak ada target sabaq pekan ini.
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-gray-600">Progress Mingguan</span>
                    <span className="font-black text-emerald-800">{jumlahBaris} / {targetBaris} Baris</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden border border-gray-300/60 p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTargetAchieved ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((jumlahBaris / targetBaris) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* INPUT 5: CATATAN (TEXTAREA KECIL) */}
          <div className="pt-3 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1">
              5. Catatan Guru <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={1}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan jika diperlukan..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-2xs"
            />
          </div>

          {/* TOMBOL AKSI AT BOTTOM OF EXPANDED FORM */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal Edit
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Save size={15} className="text-gray-600" />
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
            >
              <Check size={15} />
              {isSubmitting ? "Menyimpan..." : "Simpan & Berikutnya"}
              <ArrowDown size={14} className="ml-0.5 opacity-80" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

SabaqInputCard.displayName = 'SabaqInputCard';


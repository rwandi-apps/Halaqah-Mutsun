import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Check, Edit3, Save, ArrowDown, Target, BookOpen, Clock, Calendar } from 'lucide-react';
import { Student, SetoranSabak, User } from '../types';
import { QURAN_MAPPING, calculateHafalan } from '../services/quranMapping';
import { addSetoranSabak, updateSetoranSabak, updateStudent } from '../services/firestoreService';

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
  latestSetoranFromPrevWeek?: SetoranSabak | null;
  existingSetoranThisWeek?: SetoranSabak | null;
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
  const [surah, setSurah] = useState<string>('Al-Fatihah');
  const [ayatDari, setAyatDari] = useState<number>(1);
  const [ayatSampai, setAyatSampai] = useState<number>(1);
  const [jumlahBaris, setJumlahBaris] = useState<number>(10);
  const [selectedHari, setSelectedHari] = useState<string[]>([]);
  const [catatan, setCatatan] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  // Max ayah for chosen surah
  const [maxAyah, setMaxAyah] = useState<number>(7);

  // Synchronize max ayah whenever surah changes
  useEffect(() => {
    const q = QURAN_MAPPING.find(m => m.surah.toLowerCase() === surah.toLowerCase());
    if (q) {
      setMaxAyah(q.end);
    } else {
      setMaxAyah(286);
    }
  }, [surah]);

  // AUTO-FILL logic on mount or data change
  useEffect(() => {
    if (existingSetoranThisWeek) {
      // Existing record for this date/week
      setSurah(existingSetoranThisWeek.surah);
      setAyatDari(existingSetoranThisWeek.ayatDari);
      setAyatSampai(existingSetoranThisWeek.ayatSampai);
      if (existingSetoranThisWeek.jumlahBaris !== undefined) {
        setJumlahBaris(existingSetoranThisWeek.jumlahBaris);
      } else {
        const lines = calculateHafalan(existingSetoranThisWeek.surah, existingSetoranThisWeek.ayatDari, existingSetoranThisWeek.surah, existingSetoranThisWeek.ayatSampai).totalLines;
        setJumlahBaris(lines > 0 ? lines : (existingSetoranThisWeek.ayatSampai - existingSetoranThisWeek.ayatDari + 1));
      }
      setSelectedHari(existingSetoranThisWeek.hariSetor || []);
      setCatatan(existingSetoranThisWeek.catatan || '');
      if (existingSetoranThisWeek.targetBaris) {
        setTargetBaris(existingSetoranThisWeek.targetBaris);
        setCustomTargetInput(String(existingSetoranThisWeek.targetBaris));
      }
      setIsSaved(true);
      setSavedDocId(existingSetoranThisWeek.id || null);
    } else if (latestSetoranFromPrevWeek) {
      // Auto-fill from previous week's setoran
      const prevSurah = latestSetoranFromPrevWeek.surah;
      const prevEndAyat = latestSetoranFromPrevWeek.ayatSampai;
      const q = QURAN_MAPPING.find(m => m.surah.toLowerCase() === prevSurah.toLowerCase());
      const maxAy = q ? q.end : 286;

      let nextSurah = prevSurah;
      let nextStartAyat = prevEndAyat + 1;

      if (nextStartAyat > maxAy) {
        // Find next surah in Quran order
        const currIndex = QURAN_MAPPING.findIndex(m => m.surah.toLowerCase() === prevSurah.toLowerCase());
        if (currIndex >= 0 && currIndex < QURAN_MAPPING.length - 1) {
          nextSurah = QURAN_MAPPING[currIndex + 1].surah;
          nextStartAyat = 1;
        } else {
          nextStartAyat = maxAy;
        }
      }

      const defaultEndAyat = Math.min(nextStartAyat + 5, QURAN_MAPPING.find(m => m.surah.toLowerCase() === nextSurah.toLowerCase())?.end || 286);
      
      setSurah(nextSurah);
      setAyatDari(nextStartAyat);
      setAyatSampai(defaultEndAyat);
      
      const calc = calculateHafalan(nextSurah, nextStartAyat, nextSurah, defaultEndAyat).totalLines;
      setJumlahBaris(calc > 0 ? calc : (defaultEndAyat - nextStartAyat + 1));
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setSavedDocId(null);
    } else if (student.sabaqDisplay && student.sabaqDisplay !== '-' && student.sabaqDisplay !== 'Belum Ada') {
      // Parse from student.sabaqDisplay (e.g. "Al-Mulk: 14")
      const match = student.sabaqDisplay.match(/^(.+?)\s*[:\-–]\s*(\d+)$/i);
      if (match) {
        const parsedSurah = match[1].trim();
        const parsedAyat = parseInt(match[2].trim(), 10) || 1;
        const qEntry = QURAN_MAPPING.find(m => m.surah.toLowerCase() === parsedSurah.toLowerCase());
        if (qEntry) {
          const nextAy = Math.min(parsedAyat + 1, qEntry.end);
          const endAy = Math.min(nextAy + 5, qEntry.end);
          setSurah(qEntry.surah);
          setAyatDari(nextAy);
          setAyatSampai(endAy);
          const calc = calculateHafalan(qEntry.surah, nextAy, qEntry.surah, endAy).totalLines;
          setJumlahBaris(calc > 0 ? calc : (endAy - nextAy + 1));
        } else {
          setSurah('Al-Fatihah');
          setAyatDari(1);
          setAyatSampai(7);
          setJumlahBaris(7);
        }
      } else {
        setSurah('Al-Fatihah');
        setAyatDari(1);
        setAyatSampai(7);
        setJumlahBaris(7);
      }
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setSavedDocId(null);
    } else {
      // Default initial state
      setSurah('Al-Fatihah');
      setAyatDari(1);
      setAyatSampai(7);
      setJumlahBaris(7);
      setSelectedHari([]);
      setCatatan('');
      setIsSaved(false);
      setSavedDocId(null);
    }
  }, [existingSetoranThisWeek, latestSetoranFromPrevWeek, student.id, student.sabaqDisplay]);

  // Recalculate estimated lines when Surah, Ayat Dari, or Ayat Sampai change
  const handleAyatChange = (newDari: number, newSampai: number, currentSurah = surah) => {
    setAyatDari(newDari);
    setAyatSampai(newSampai);
    const calculated = calculateHafalan(currentSurah, newDari, currentSurah, newSampai).totalLines;
    if (calculated > 0) {
      setJumlahBaris(calculated);
    } else if (newSampai >= newDari) {
      setJumlahBaris(newSampai - newDari + 1);
    }
  };

  const handleSurahSelect = (newSurah: string) => {
    setSurah(newSurah);
    const q = QURAN_MAPPING.find(m => m.surah.toLowerCase() === newSurah.toLowerCase());
    const mAy = q ? q.end : 286;
    const newDari = 1;
    const newSampai = Math.min(7, mAy);
    setAyatDari(newDari);
    setAyatSampai(newSampai);
    const calculated = calculateHafalan(newSurah, newDari, newSurah, newSampai).totalLines;
    setJumlahBaris(calculated > 0 ? calculated : (newSampai - newDari + 1));
  };

  // Toggle day selection
  const toggleHari = (day: string) => {
    if (selectedHari.includes(day)) {
      setSelectedHari(selectedHari.filter(d => d !== day));
    } else {
      setSelectedHari([...selectedHari, day]);
    }
  };

  // Automated Status calculation based on target
  const isTargetAchieved = jumlahBaris >= targetBaris;
  const statusLabel = isTargetAchieved ? 'Target Tercapai' : 'Belum Tercapai';

  // Save handler
  const handleSave = async (shouldAdvanceNext = false) => {
    if (!currentUser) {
      alert("Sesi login guru tidak ditemukan.");
      return;
    }

    if (ayatDari <= 0 || ayatSampai <= 0) {
      alert("Ayat harus lebih besar dari 0.");
      return;
    }

    if (ayatDari > ayatSampai) {
      alert("Ayat Dari tidak boleh lebih besar dari Ayat Sampai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const guruNama = currentUser.nickname || currentUser.name || "Guru";
      const payload: Omit<SetoranSabak, 'id' | 'createdAt' | 'updatedAt'> = {
        tanggal,
        guruId: currentUser.id,
        guruNama,
        halaqahId: student.className,
        halaqahNama: student.className,
        siswaId: student.id,
        namaSiswa: student.name,
        surah,
        ayatDari,
        ayatSampai,
        jumlahBaris: Number(jumlahBaris) || 0,
        hariSetor: selectedHari,
        targetBaris,
        status: isTargetAchieved ? 'Tuntas' : 'Belum Tuntas',
        catatan: catatan.trim()
      };

      let docId = savedDocId;
      if (docId) {
        await updateSetoranSabak(docId, payload);
      } else {
        docId = await addSetoranSabak(payload);
        setSavedDocId(docId);
      }

      // Update student's sabaq terakhir in Firestore
      await updateStudent(student.id, {
        currentProgress: `${surah}: ${ayatSampai}`,
        targetBaris: targetBaris
      });

      setIsSaved(true);
      onSavedSuccess();

      if (shouldAdvanceNext && onNextCard) {
        setTimeout(() => {
          onNextCard(index);
        }, 150);
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

  return (
    <div 
      ref={ref}
      id={`student-sabaq-card-${index}`}
      className={`bg-white rounded-2xl border transition-all duration-300 p-5 md:p-6 shadow-sm hover:shadow-md ${
        isActive 
          ? 'ring-2 ring-emerald-500 border-emerald-400 shadow-emerald-100/50' 
          : isSaved 
          ? 'border-emerald-200 bg-emerald-50/20' 
          : 'border-gray-200'
      }`}
    >
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{student.name}</h3>
              {isSaved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Check size={12} className="stroke-[3]" /> Tersimpan
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              Progress: <span className="text-emerald-700 font-bold">{student.totalHafalanDisplay || student.currentJuzDisplay || "Belum Ada"}</span>
            </p>
          </div>
        </div>

        {/* TARGET MINGGUAN BADGE & EDIT BUTTON */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
                onClick={() => setIsEditingTarget(true)} 
                className="text-emerald-600 hover:text-emerald-900 p-0.5 rounded-md hover:bg-emerald-100 transition-colors ml-1"
                title="Ubah Target Mingguan"
              >
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INPUT FORM BODY */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
        
        {/* INPUT 1: SETORAN SABAQ (Surat & Ayat) - 5 cols */}
        <div className="md:col-span-5 bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
            <BookOpen size={13} className="text-emerald-600" /> 1. Setoran Sabaq
          </label>
          
          {/* Dropdown Surat */}
          <div>
            <span className="text-[11px] font-semibold text-gray-600 block mb-1">Surat</span>
            <select 
              value={surah}
              onChange={(e) => handleSurahSelect(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
            >
              {QURAN_MAPPING.map(q => (
                <option key={q.surah} value={q.surah}>
                  {q.surah} ({q.end} Ayat)
                </option>
              ))}
            </select>
          </div>

          {/* Ayat Dari & Sampai */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] font-semibold text-gray-600 block mb-1">Ayat Dari</span>
              <input 
                type="number" 
                min="1" 
                max={maxAyah}
                value={ayatDari}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  handleAyatChange(val, Math.max(val, ayatSampai));
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-600 block mb-1">Sampai</span>
              <input 
                type="number" 
                min={ayatDari} 
                max={maxAyah}
                value={ayatSampai}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || ayatDari;
                  handleAyatChange(ayatDari, val);
                }}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center shadow-2xs"
              />
            </div>
          </div>
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
                value={jumlahBaris}
                onChange={(e) => setJumlahBaris(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-base font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs pr-16"
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
                const isSelected = selectedHari.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleHari(day)}
                    className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-bold border transition-all ${
                      isSelected
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
              {isTargetAchieved ? (
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

          {/* PROGRESS BAR MINGGUAN */}
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

        </div>

      </div>

      {/* INPUT 5: CATATAN (TEXTAREA KECIL) */}
      <div className="mt-4 pt-3 border-t border-gray-100">
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

      {/* TOMBOL AKSI AT BOTTOM OF CARD */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave(false)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
        >
          <Save size={15} className="text-gray-600" />
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSave(true)}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
        >
          <Check size={15} />
          {isSubmitting ? "Menyimpan..." : "Simpan & Berikutnya"}
          <ArrowDown size={14} className="ml-0.5 opacity-80" />
        </button>
      </div>

    </div>
  );
});

SabaqInputCard.displayName = 'SabaqInputCard';


import { collection, getDocs, updateDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report } from '../types';

/**
 * MIGRATION SCRIPT
 * Tujuan: Mengonversi Laporan Legacy -> Format Standar Baru
 * Aman dijalankan berulang kali (Idempotent).
 */
export const migrateLegacyReports = async (): Promise<string> => {
  if (!db) throw new Error("Firestore not initialized");

  console.log("🚀 Starting Legacy Migration...");
  
  const reportsRef = collection(db, 'laporan');
  // Ambil semua laporan untuk diperiksa (bisa dioptimasi dengan where('migrated', '!=', true) jika ada index)
  const snapshot = await getDocs(reportsRef);
  
  let batch = writeBatch(db);
  let operationCount = 0;
  let migratedCount = 0;
  const BATCH_LIMIT = 400; // Firestore limit 500

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as any;
    let needsUpdate = false;
    let updates: any = {};

    // 1. Normalize Type
    // Deteksi variasi legacy type: "Semester", "Rapor Semester", dll
    if (data.type !== 'Laporan Bulanan' && data.type !== 'Laporan Semester') {
      if (data.type.toLowerCase().includes('semester')) {
        updates.type = 'Laporan Semester';
        needsUpdate = true;
      }
    }

    // 2. Generate Period Code jika hilang
    if (!data.periodCode) {
      const pCode = generatePeriodCodeForMigration(data.academicYear, data.month, updates.type || data.type);
      if (pCode > 0) {
        updates.periodCode = pCode;
        needsUpdate = true;
      }
    }

    // 3. Normalize Total Hafalan -> Hafalan Range (String SDQ)
    // Legacy biasanya punya object totalHafalan tapi string individualnya kosong/-
    if ((updates.type === 'Laporan Semester' || data.type === 'Laporan Semester')) {
      if (!data.hafalanRange && data.totalHafalan) {
        const j = data.totalHafalan.juz || 0;
        const p = data.totalHafalan.pages || 0;
        updates.hafalanRange = `${j} Juz ${p} Halaman`;
        needsUpdate = true;
      }
    }

    // 4. Mark as Migrated
    if (needsUpdate || !data.migrated) {
      updates.migrated = true;
      updates.updatedAt = new Date().toISOString(); // Timestamp migrasi
      
      const docRef = doc(db, 'laporan', docSnap.id);
      batch.update(docRef, updates);
      operationCount++;
      migratedCount++;
    }

    // Commit batch jika limit tercapai
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  // Commit sisa batch
  if (operationCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Migration Complete. Updated ${migratedCount} documents.`);
  return `Migrasi selesai. ${migratedCount} laporan diperbarui.`;
};

// Helper duplikat dari firestoreService untuk independensi script migrasi
const generatePeriodCodeForMigration = (academicYear: string, period: string, type: string): number => {
  try {
    if (!academicYear) return 0;
    const years = academicYear.replace(/\s/g, '').split(/[\/-]/); // Handle 2024/2025 or 2024-2025
    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);

    if (!startYear || !endYear) return 0;

    const normalizePeriod = (period || '').trim().toLowerCase();
    
    // Logic Semester
    if (type === 'Laporan Semester' || type.toLowerCase().includes('semester')) {
      if (normalizePeriod.includes('ganjil') || normalizePeriod === '1') return (startYear * 100) + 12;
      if (normalizePeriod.includes('genap') || normalizePeriod === '2') return (endYear * 100) + 6;
    }

    // Logic Bulanan
    const monthMap: Record<string, number> = {
      'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6
    };

    const monthIndex = monthMap[normalizePeriod];
    if (!monthIndex) return 0;

    const year = (monthIndex >= 7) ? startYear : endYear;
    return (year * 100) + monthIndex;
  } catch (e) {
    return 0;
  }
};

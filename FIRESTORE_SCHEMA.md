# Desain Database Firestore - Halaqah SDQ

## Ikhtisar Relasi
1. **Users (Guru)** memiliki 1 **Halaqah**.
2. **Kelas** adalah wadah akademik (contoh: "Kelas 1 Abdullah").
3. **Halaqah** adalah kelompok belajar mengaji yang terhubung ke 1 **Kelas** dan 1 **Guru**.
4. **Siswa** terdaftar di 1 **Kelas** dan masuk ke 1 **Halaqah**.
5. **Laporan** & **Evaluasi** merujuk pada **Siswa**.

---

## 1. Collection: `users`
Menyimpan data otentikasi dan profil pengguna.

**Document ID**: `uid` (dari Firebase Auth)

```json
{
  "name": "Ustadz Hasan",
  "email": "hasan@sdq.com",
  "role": "GURU", // 'GURU' | 'KOORDINATOR'
  "createdAt": "2023-12-01T08:00:00Z",
  "photoURL": "https://...",
  "status": "ACTIVE"
}
```

---

## 2. Collection: `kelas`
Data referensi kelas akademik (Formal).

**Document ID**: Auto-generated (misal: `k_001`)

```json
{
  "name": "Kelas 3 Khadijah bintu Khuwailid",
  "level": 3, // Tingkat kelas (1-6)
  "academicYear": "2024/2025",
  "totalStudents": 25
}
```

---

## 3. Collection: `halaqah`
Kelompok belajar mengaji. Satu kelas formal biasanya dibagi menjadi beberapa halaqah.

**Document ID**: Auto-generated (misal: `h_001`)

```json
{
  "name": "Halaqah Ustadz Hasan",
  "teacherId": "uid_user_hasan", // Relasi ke users
  "teacherName": "Ustadz Hasan", // Denormalisasi untuk kemudahan UI
  "classId": "k_001", // Relasi ke kelas formal
  "className": "Kelas 3 Khadijah bintu Khuwailid",
  "academicYear": "2024/2025",
  "studentCount": 12
}
```

---

## 4. Collection: `siswa`
Data utama siswa.

**Document ID**: Auto-generated (misal: `s_001`)

```json
{
  "name": "Ahmad Fulan",
  "nis": "2023001",
  "nisn": "0012345678",
  "gender": "L",
  
  // Relasi
  "classId": "k_001",
  "className": "Kelas 3 Khadijah bintu Khuwailid", // Denormalisasi
  "halaqahId": "h_001",
  "teacherId": "uid_user_hasan", // Denormalisasi untuk query cepat by Guru
  
  // Progress Tracking (Diupdate setiap ada laporan baru)
  "memorizationTarget": "Juz 30",
  "currentProgress": "An-Naba: 1-10",
  "totalHafalan": {
    "juz": 1,
    "pages": 5,
    "lines": 10
  },
  
  // Stats
  "attendance": 95, // Persentase
  "behaviorScore": 9
}
```

---

## 5. Collection: `laporan`
Log harian/bulanan setoran hafalan dan tilawah.

**Document ID**: Auto-generated (misal: `r_001`)

```json
{
  "studentId": "s_001",
  "studentName": "Ahmad Fulan",
  "teacherId": "uid_user_hasan",
  "halaqahId": "h_001",
  
  "type": "Laporan Bulanan", // 'Laporan Bulanan' | 'Laporan Semester'
  "month": "Desember",
  "academicYear": "2024/2025",
  
  "tilawah": {
    "method": "Al-Quran", // 'Al-Quran' | 'Iqra'
    "individual": "Al-Baqarah: 1 - Al-Baqarah: 25",
    "classical": "Al-Fatihah: 1 - Al-Fatihah: 7"
  },
  
  "tahfizh": {
    "individual": "An-Naba: 1 - An-Naba: 20",
    "classical": "An-Naziat: 1 - An-Naziat: 10"
  },
  
  // Snapshot total saat laporan ini dibuat
  "totalHafalan": {
    "juz": 1,
    "pages": 5,
    "lines": 10
  },
  
  "notes": "Bacaan lancar, tajwid perlu diperbaiki.",
  "createdAt": "2023-12-28T10:00:00Z"
}
```

---

## 6. Collection: `evaluasi`
Hasil generate AI atau catatan khusus evaluasi guru.

**Document ID**: Auto-generated (misal: `e_001`)

```json
{
  "studentId": "s_001",
  "teacherId": "uid_user_hasan",
  "date": "2023-12-30",
  "content": "Ananda Ahmad memiliki kemampuan menghafal yang sangat baik...",
  "aiGenerated": true,
  "createdAt": "2023-12-30T14:00:00Z"
}
```
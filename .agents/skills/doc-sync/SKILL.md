---
name: doc-sync
description: SOP dan panduan otomatisasi sinkronisasi dokumen spesifikasi produk (PRD.md) dan arsitektur sistem (architecture.md) dengan perkembangan rilis fitur, skema basis data, dan algoritma terbaru.
---

# Documentation & Specifications Synchronization Skill (PRD & Architecture)

Skill ini memandu pemeliharaan dan sinkronisasi berkala dua dokumen spesifikasi inti proyek:
1. **`PRD.md`** (*Product Requirements Document*): Kontrak kebutuhan fungsional, latar belakang masalah, persona pengguna, matriks regulasi Permenaker 15/2024, dan aturan bisnis.
2. **`architecture.md`** (*System Architecture Document*): Cetak biru arsitektur teknis, diagram Mermaid (alur sistem & sequence ekspor Excel), struktur folder proyek, skema ERD PostgreSQL (termasuk kolom JSONB), dan algoritma kalkulasi/deduplikasi.

Skill ini terintegrasi erat dengan alur rilis **[Changelog Skill](../changelog/SKILL.md)** dan **[GitHub Skill](../github/SKILL.md)**.

---

## 1. Kapan Harus Memperbarui Dokumen (Triggers)

Dokumen `PRD.md` dan `architecture.md` **wajib diperiksa dan diperbarui** setiap kali terjadi kondisi berikut:

| Kondisi / Pemicu | Dampak ke `PRD.md` | Dampak ke `architecture.md` |
| :--- | :--- | :--- |
| **Kenaikan Versi SemVer (`vX.Y.Z`)** | Update header versi dokumen (`Dokumen Versi: X.Y.Z`) | Update header versi dokumen (`Dokumen Versi: X.Y.Z`) |
| **Penambahan Fitur / Modul Baru (`MINOR` - Kode Y)** | Tambahkan modul/kebutuhan fungsional baru (`REQ-XXX-YY`) | Update diagram Mermaid & pohon struktur folder di Bagian 2 |
| **Perubahan Aturan Bisnis / Regulasi (`MAJOR` - Kode X)** | Update Bagian 1, 3, dan Matriks Formula di Bagian 4 | Update algoritma kalkulasi di Bagian 4 |
| **Perubahan Skema Database (Kolom / Tabel Baru)** | Deskripsikan kebutuhan penyimpanan data di modul terkait | Update diagram ERD Mermaid & struktur JSONB di Bagian 3 |
| **Otomasi / Mesin Normalisasi Baru** | Tambahkan spesifikasi logic & guard di Modul Terkait | Tuliskan pseudocode/alur algoritma di Bagian 4 |
| **Penambahan Template Excel / Generator** | Deskripsikan format lampiran baru di Modul Ekspor | Update sequence diagram & daftar template di Bagian 5 |
| **Optimasi Performa / Arsitektur API** | Catat batasan/ekspektasi performa di Kebutuhan Non-Fungsional | Dokumentasikan arsitektur di Bagian 4.4, serta WAJIB catat di `CHANGELOG.md` (⚡ Performa) & `web/lib/changelog-data.ts` (`PERFORMA`) |

---

## 2. Prosedur Pembaruan `PRD.md`

Saat menyunting [PRD.md](file:///c:/Me/Code/rekaptukin/PRD.md), ikuti standar struktur berikut:

1. **Metadata Dokumen**:
   - Pastikan nomor versi selalu selaras dengan rilis mutakhir di [CHANGELOG.md](file:///c:/Me/Code/rekaptukin/CHANGELOG.md) dan `package.json`.
   - Status dokumen: *Disetujui untuk Implementasi & Produksi*.

2. **Latar Belakang & Masalah (Bagian 1)**:
   - Pastikan poin masalah mencakup tantangan teknis mutakhir (misal: proteksi WAF Cloudflare, anomali entri dobel e-Presensi, format lampiran 1:1, dll).
   - Pastikan tujuan produk mencerminkan solusi sistem aktif.

3. **Katalog Kebutuhan Fungsional (Bagian 3)**:
   Gunakan format kode kebutuhan baku `REQ-[MODUL]-[NOMOR]`:
   - `REQ-EXT-XX`: Modul 1 (Chrome Extension Exporter & Preservasi Data Mentah)
   - `REQ-AUTH-XX`: Modul 2 (Autentikasi, Panduan & Distribusi Ekstensi)
   - `REQ-MST-XX`: Modul 3 (Manajemen Master Pegawai & Riwayat Jabatan)
   - `REQ-UPL-XX`: Modul 4 (Upload, Dual-Layer Guard & Smart Merge Conflict Resolution)
   - `REQ-EDT-XX`: Modul 5 (Editor Presensi, Alasan Cuti & Kalkulasi Tukin Interaktif)
   - `REQ-EXP-XX`: Modul 6 (Engine Ekspor Excel 4 Lampiran Nota Dinas)
   - `REQ-CHG-XX`: Modul 7 (Halaman Release Notes / Changelog)
   - `REQ-AUD-XX`: Modul 8 (Pusat Rekap Audit Mutu & Duplikasi Presensi Seluruh Periode)

4. **Matriks Regulasi & Formula (Bagian 4)**:
   - Pertahankan keabsahan tabel nominal tukin 17 kelas jabatan Permenaker 15/2024.
   - Pertahankan matriks predikat evaluasi kinerja (Sangat Baik: 100%, Baik: 100%, Butuh Perbaikan: 85%, Kurang: 60%).

5. **Kebutuhan Non-Fungsional & Desain (Bagian 5)**:
   - Tegaskan kepatuhan estetika *Anti-Slop* (warna korporat Kemnaker Navy Blue `#0A192F`, aksen Teal/Emerald, tanpa gradasi ungu norak).
   - Patuhi batas waktu respons (TTFB cepat, lazy-loading, query paralel).

---

## 3. Prosedur Pembaruan `architecture.md`

Saat menyunting [architecture.md](file:///c:/Me/Code/rekaptukin/architecture.md), ikuti standar teknis berikut:

1. **Diagram Arsitektur Tingkat Tinggi (Mermaid - Bagian 1)**:
   - Tampilkan batas pemisah yang jelas antara:
     - `ClientEnvironment`: Chrome Extension (penarik data mentah) & e-Presensi.
     - `VercelCloud`: Next.js App Router, Pre-upload Scanner, Deduplication Engine, Audit Modal, dan Excel Generator.
     - `DatabaseLayer`: Neon PostgreSQL Serverless Connection Pooler.

2. **Pohon Struktur Proyek (File Tree - Bagian 2)**:
   - Selalu perbarui jika ada folder skill baru, komponen UI baru (`components/`), rute API baru (`api/`), atau template baru (`templates/`).
   - Berikan keterangan singkat di samping nama berkas penting.

3. **Skema Basis Data Relasional (ERD Mermaid - Bagian 3)**:
   - Tampilkan seluruh entitas (`users`, `master_pegawai`, `riwayat_jabatan_pegawai`, `rekap_periode`, `rekap_pegawai`).
   - Sertakan kolom baru (seperti `audit_log jsonb` pada `rekap_periode`).
   - Lampirkan contoh payload JSON struktur kolom JSONB untuk mempermudah pemahaman developer.

4. **Alur Logika & Pseudocode Algoritma (Bagian 4)**:
   - **4.1 Algoritma Smart Merge**: Langkah penanganan konflik saat upload ulang (Merge vs Overwrite).
   - **4.2 Algoritma Auto-Recalculate**: Rumus hitung telat, lupa absen, alpa, komponen kehadiran 30%, kinerja 70%, dan potongan cuti.
   - **4.3 Algoritma Deduplikasi Presensi (`deduplicatePresensiLogs`)**: Hierarki bobot status kehadiran (WFO/WFH 4 > Cuti/Sakit 3 > Alpa 2), aturan penggabungan jam masuk/keluar, dan preservasi alasan cuti.
   - **4.4 Arsitektur Optimasi Performa**: Paralelisasi `Promise.all` dan pemisahan payload ringkasan vs lazy-loading log harian (`harianOnly=true`).

5. **Sequence Diagram Ekspor Excel (Bagian 5)**:
   - Diagram sequence pembacaan buffer template `.xlsx`, injeksi data dinamis, recalculate formula footer, dan streaming file ke klien.

---

## 4. Checklist Pra-Rilis Sinkronisasi Dokumen (Doc-Sync Gate)

Sebelum menandai suatu rilis selesai atau melakukan commit rilis:

- [ ] **Versi Selaras**: Versi di `PRD.md` dan `architecture.md` sudah sama dengan `CHANGELOG.md` dan `package.json`.
- [ ] **Fitur Tercatat di PRD**: Seluruh kemampuan baru yang dibuat sudah memiliki nomor `REQ-XXX-YY` di `PRD.md`.
- [ ] **Struktur Folder Mutakhir**: File atau folder baru di workspace sudah terdaftar di pohon folder `architecture.md`.
- [ ] **Database ERD Akurat**: Kolom baru atau perubahan tipe data di database sudah tercermin di ERD `architecture.md`.
- [ ] **Algoritma Terdokumentasi**: Logika kalkulasi, normalisasi, atau optimasi baru sudah memiliki bagian algoritma di `architecture.md`.
- [ ] **Optimasi Performa Tercatat di Changelog**: Setiap peningkatan performa, pengurangan payload, paralelisasi database, caching, atau lazy-loading WAJIB tercatat di `CHANGELOG.md` (kategori `⚡ Performa`), `web/lib/changelog-data.ts` (`category: 'PERFORMA'`), dan `architecture.md` (Bagian 4.4).

---

## 5. Hubungan dengan Skill Lain

- **[Changelog Skill](../changelog/SKILL.md)**: Menyediakan rincian perubahan versi, tanggal rilis, dan kategori badge yang menjadi dasar pembaruan dokumen.
- **[GitHub Skill](../github/SKILL.md)**: Mengunci rilis git melalui *Pre-Flight Release Gate* di mana sinkronisasi `PRD.md` dan `architecture.md` menjadi salah satu syarat mutlak sebelum tagging rilis.

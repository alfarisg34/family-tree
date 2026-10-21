---
name: github
description: GitHub workflow management, repository synchronization, release tagging, and automated deployment practices for modern web applications.
---

# GitHub Skill: Repository, Commit & Release Management

Skill ini memandu standar alur kerja Git & GitHub untuk repositori **Rekap Tukin & Presensi Dit. Bina PKK Kemnaker RI**. Skill ini bekerja secara **simbiotik dan dua arah** dengan **[Changelog & Release Notes Skill](../changelog/SKILL.md)** untuk menjamin setiap commit, rilis (*release tagging*), riwayat perubahan, dan deployment ke production selalu selaras 1:1, terstruktur, dan dapat diaudit dengan mudah.

---

## 1. Hubungan Simbiotik: GitHub Skill ⟷ Changelog Skill

Keduanya memiliki pembagian peran yang tegas namun saling mengunci (*interlocking*):

| Aspek | Peran Changelog Skill | Peran GitHub Skill |
|---|---|---|
| **Fokus Utama** | *Apa* yang berubah, penentuan versi SemVer, UI badge, dan catatan rilis | *Bagaimana* perubahan di-commit, di-tag, di-push, dan di-deploy ke Vercel |
| **Kriteria Versi** | Matriks keputusan Kode X (MAJOR), Kode Y (MINOR), Kode Z (PATCH) | Penyelarasan format Conventional Commits dengan SemVer rilis |
| **Kategori Perubahan** | 5 Kategori Badge (`✨ FITUR`, `🐛 PERBAIKAN`, `🎨 UI/UX`, dsb.) | Scope & Tipe Commit (`feat`, `fix`, `style`, `perf`, `chore`) |
| **Titik Sinkronisasi** | Penentuan 6 file target yang wajib sinkron sebelum rilis | Pre-Flight Release Gate yang memvalidasi build & git hygiene sebelum push |
| **Publikasi** | Halaman Web `/changelog` & file `CHANGELOG.md` | Git Annotated Tag (`vX.Y.Z`), GitHub Releases, & Vercel Production Deployment |

---

## 2. Penyelarasan Conventional Commits dengan SemVer (Korelasi X, Y, Z)

Setiap commit pada repositori wajib mematuhi spesifikasi [Conventional Commits](https://www.conventionalcommits.org/):
```
<tipe>(<lingkup>): <deskripsi ringkas dalam kalimat aktif>
```

Tipe commit memiliki korelasi langsung dengan kategori pada skill `changelog` dan kenaikan versi SemVer (**Kode X, Y, Z**):

| Tipe Commit | Kategori Changelog | Korelasi SemVer | Definisi & Contoh Pesan Commit |
|---|:---:|:---:|---|
| **`feat!`** / `BREAKING CHANGE:` | `✨ FITUR` / Perubahan Regulasi | **Kode X (MAJOR)** | Perubahan regulasi pokok atau arsitektur yang tidak backward-compatible.<br>`feat(regulasi)!: implementasi skema tukin baru pengganti Permenaker 15/2024` |
| **`feat`** | `✨ FITUR` | **Kode Y (MINOR)** | Penambahan fitur, generator lampiran, atau otomasi baru yang backward-compatible.<br>`feat(export): add Lampiran 4 Master Presensi 1:1 Excel generator` |
| **`fix`** | `🐛 PERBAIKAN` | **Kode Z (PATCH)** | Pembetulan bug formula kalkulasi, toleransi keterlambatan, atau penanganan error.<br>`fix(formulas): koreksi persentase potongan jam pulang kosong` |
| **`style`** | `🎨 UI/UX` | **Kode Z (PATCH)** | Penyesuaian antarmuka, CSS, badge versi (`font-mono`, `whitespace-nowrap`), layout responsif.<br>`style(badge): adjust version pill padding to fit vX.Y.Z cleanly` |
| **`perf`** | `⚡ PERFORMA` | **Kode Z (PATCH)** | Optimasi performa database, batch processing upload, kompresi ZIP ekspor.<br>`perf(upload): batch insert pegawai chunks to speed up ingestion` |
| **`refactor`** | `⚙️ CHORE` / `🐛 PERBAIKAN` | **Kode Z (PATCH)** | Restrukturisasi kode tanpa mengubah fungsionalitas eksternal.<br>`refactor(excel): modularize worksheet styling helper functions` |
| **`docs`** | `📝 DOKUMENTASI` | **Kode Z / No Bump** | Pembaruan dokumentasi, PRD, panduan manual, README.<br>`docs(prd): add REQ-EXT-11 for automatic leave reason extraction` |
| **`chore`** | `⚙️ CHORE` | **Kode Z (PATCH)** | Pembaruan dependensi, release version bump, konfigurasi sistem.<br>`chore(release): bump version to v1.4.0` |

---

## 3. Pre-Flight Release Gate (8-Point Mandatory Checklist)

Sebelum melakukan `git commit` untuk rilis dan `git push origin main`, **WAJIB** mengeksekusi checklist 8 titik ini secara berurutan:

```
[Release Gate Checklist]
  │
  ├── 1. Data Changelog Web (web/lib/changelog-data.ts)
  ├── 2. UI Badge & Display Test (Navbar, Dashboard, Login, Changelog Page)
  ├── 3. Dokumen CHANGELOG.md (Header vX.Y.Z & Kategori Badge)
  ├── 4. Sinkronisasi Dokumen Spesifikasi (PRD.md & architecture.md via doc-sync)
  ├── 5. Chrome Extension Manifests (extension/ & web/extension/ 1:1)
  ├── 6. Package Metadata (package.json & web/package.json)
  ├── 7. Local Build Verification (npm --prefix web run build)
  └── 8. Git Hygiene & Data Privacy Check (git status)
```

### Detail Pengecekan:
1. **Data Changelog Web (`web/lib/changelog-data.ts`)**:
   - Objek rilis terbaru berada pada indeks ke-0 array `CHANGELOG_DATA`.
   - Field `version`, `date`, `type`, `title`, dan `changes` terisi lengkap.
   - `LATEST_VERSION` dan `LATEST_VERSION_LABEL` mengekspor versi baru tersebut.
2. **UI Badges & Display Verification**:
   - Pastikan [Navbar](file:///c:/Me/Code/rekaptukin/web/components/Navbar.tsx), [Dashboard](file:///c:/Me/Code/rekaptukin/web/app/page.tsx), dan [Login](file:///c:/Me/Code/rekaptukin/web/app/login/page.tsx) memakai `LATEST_VERSION_LABEL`.
   - Verifikasi kelas CSS: `font-mono`, `px-2 py-0.5`, `whitespace-nowrap`, `shrink-0` aktif agar badge `vX.Y.Z` tidak terpotong.
3. **Dokumen Root `CHANGELOG.md`**:
   - Header `## [vX.Y.Z] - YYYY-MM-DD` tercantum di bagian teratas.
   - Poin perubahan dikelompokkan dengan ikon kategori (`### ✨ Fitur Baru`, `### 🐛 Perbaikan`, dll).
4. **Dokumen Spesifikasi & Arsitektur (`PRD.md` & `architecture.md`)**:
   - Rujuk panduan **[Doc-Sync Skill](../doc-sync/SKILL.md)**.
   - Pastikan versi di header `PRD.md` dan `architecture.md` cocok dengan `vX.Y.Z`.
   - Seluruh modul baru terdokumentasi di PRD (`REQ-XXX-YY`), dan skema ERD/algoritma mutakhir tercermin di `architecture.md`.
5. **Chrome Extension Manifests (1:1 Synchronized)**:
   - [extension/manifest.json](file:///c:/Me/Code/rekaptukin/extension/manifest.json) bernilai `"version": "X.Y.Z"`.
   - [web/extension/manifest.json](file:///c:/Me/Code/rekaptukin/web/extension/manifest.json) bernilai `"version": "X.Y.Z"`.
6. **Package Metadata**:
   - Root [package.json](file:///c:/Me/Code/rekaptukin/package.json) bernilai `"version": "X.Y.Z"`.
   - Subdirektori [web/package.json](file:///c:/Me/Code/rekaptukin/web/package.json) bernilai `"version": "X.Y.Z"`.
7. **Verifikasi Build Lokal Tanpa Error**:
   - Jalankan perintah build:
     ```bash
     npm --prefix web run build
     ```
   - Status harus `✓ Compiled successfully` tanpa kesalahan kompilasi TypeScript atau rute API.
8. **Git Hygiene & Data Privacy**:
   - Jalankan `git status` untuk memastikan tidak ada file data sensitif (`.env*`, file JSON presensi asli pegawai, atau file `.xlsx` privat) yang ter-stage secara tidak sengaja.

---

## 4. Alur Rilis & Tagging Git Resmi (Official Release Workflow)

Setelah ke-7 titik pada Release Gate lolos uji, jalankan alur rilis berurutan berikut:

### Langkah 1: Staging Perubahan Terkurasi
```bash
git add .
git status
```
*Pastikan hanya file kode sumber, ekstensi, aset, dan dokumentasi yang masuk ke daftar "Changes to be committed".*

### Langkah 2: Commit Rilis Resmi
Gunakan format commit rilis konvensional yang menyebutkan nomor versi SemVer dan judul fokus rilis:
```bash
git commit -m "chore(release): bump version to vX.Y.Z - <Judul Ringkas Rilis>"
```
*Contoh Konkret:*
```bash
git commit -m "chore(release): bump version to v1.4.0 - Lampiran 4 Master Presensi & Leave Reason Extraction"
```

### Langkah 3: Sematkan Annotated Git Tag
Buat git tag bertipe *annotated* (bukan lightweight tag) agar mencatat metadata rilis, nama rilis, dan ringkasan yang sesuai dengan changelog:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: <Ringkasan Fokus Rilis>"
```
*Contoh Konkret:*
```bash
git tag -a v1.4.0 -m "Release v1.4.0: Generator Lampiran 4 dan Otomasi Alasan Cuti"
```

### Langkah 4: Push ke GitHub Remote & Memicu Deployment Vercel
Kirim commit rilis dan git tag baru secara bersamaan ke branch `main`:
```bash
git push origin main --tags
```

---

## 5. Pembuatan GitHub Release Resmi (Release Notes Generator)

Setelah tag ter-push, buat **GitHub Release** resmi pada repositori GitHub agar pengguna atau pengelola dapat mengunduh rilis dan membaca rangkuman perubahan.

### Format Catatan Rilis GitHub (Template Baku):
Gunakan format markdown yang mengadopsi kategori badge dari changelog:

```markdown
## Release vX.Y.Z - <Judul Rilis>

Tanggal Rilis: YYYY-MM-DD
Target Kompatibilitas: Permenaker No. 15 Tahun 2024 / e-Presensi Kemnaker RI

### ✨ Fitur Baru
- **[Modul/Fitur]**: Deskripsi ringkas fungsionalitas baru.

### 🐛 Perbaikan & Presisi Kalkulasi
- **[Kalkulasi/Form]**: Detail perbaikan bug dan dampaknya.

### 🎨 Antarmuka & UX
- **[UI/Badge]**: Penyesuaian tata letak dan kenyamanan visual.

---
**Full Changelog**: https://github.com/alfarisg34/rekaptukin/compare/v<PREVIOUS_VERSION>...vX.Y.Z
```

### Pembuatan Otomatis via GitHub CLI (`gh`):
Jika GitHub CLI tersedia, rilis dapat langsung dipublikasikan dari terminal:
```bash
gh release create vX.Y.Z --title "vX.Y.Z: <Judul Rilis>" --notes-file CHANGELOG.md
```

---

## 6. Alur Hotfix Khusus (Kode Z Cepat)

Jika ditemukan bug mendesak pada lingkungan production yang membutuhkan perbaikan segera tanpa penambahan fitur (Kode Z / PATCH):

1. Buat branch hotfix dari tag rilis terakhir:
   ```bash
   git checkout -b hotfix/vX.Y.(Z+1) vX.Y.Z
   ```
2. Terapkan perbaikan kode (`fix:`).
3. Perbarui `CHANGELOG_DATA` pada `web/lib/changelog-data.ts` dan `CHANGELOG.md` dengan tipe `PATCH`.
4. Jalankan `npm --prefix web run build`.
5. Gabungkan kembali ke `main`:
   ```bash
   git checkout main
   git merge hotfix/vX.Y.(Z+1)
   git tag -a vX.Y.(Z+1) -m "Hotfix vX.Y.(Z+1): <Deskripsi Bug Fix>"
   git push origin main --tags
   ```

---

## 7. Integrasi Otomatis dengan Vercel Deployment & Rollback Traceability

1. **Trigger Otomatis**: Setiap `git push` ke branch `main` secara otomatis memicu pipeline CI/CD di platform Vercel untuk membangun (`npm run build`) dan mendistribusikan aplikasi web ke edge production.
2. **Rollback Traceability**:
   - Jika terjadi regresi atau error di production setelah rilis baru, setiap deployment di Vercel terhubung langsung dengan Commit Hash dan Git Tag `vX.Y.Z`.
   - Admin dapat melakukan **Instant Rollback** melalui Vercel Dashboard langsung ke deployment tag versi sebelumnya yang stabil (misal: kembali dari `v1.4.1` ke `v1.4.0`), sementara tim meneliti changelog untuk menemukan akar masalah.
3. **Audit Trail**: Kolaborasi antara git tag, commit conventional, dan changelog web menyediakan catatan audit yang sah bagi Bagian Kepegawaian Dit. Bina PKK Kemnaker RI.

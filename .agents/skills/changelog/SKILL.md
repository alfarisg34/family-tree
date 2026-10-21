---
name: changelog
description: Professional changelog and release notes generator following semantic versioning, categorized change badges, and timeline-based UI presentation modeled after modern enterprise portals.
---

# Changelog & Release Notes Skill

Skill ini memandu penyusunan, penentuan nomor versi (SemVer `vX.Y.Z`), dan tampilan halaman **Release Notes & Log Versi** agar profesional, terstruktur, serta memastikan **seluruh indikator versi di antarmuka web dan ekstensi** tersinkronisasi secara presisi. Skill ini dirancang terintegrasi erat dan saling melengkapi dengan **[GitHub Skill](../github/SKILL.md)** yang mengatur alur commit, tagging, release gate, dan deployment.

---

## 1. Aturan Penomoran Versi: Kode X, Kode Y, Kode Z (`vX.Y.Z`)

Penomoran versi wajib mematuhi spesifikasi [Semantic Versioning (SemVer 2.0.0)](https://semver.org/) dengan format `vX.Y.Z`:
- **`X`** = **MAJOR**
- **`Y`** = **MINOR**
- **`Z`** = **PATCH**

```
Format:  v  [ X ]  .  [ Y ]  .  [ Z ]
              │         │         │
              │         │         └── PATCH: Bug fix, tweak formula, styling UI, penyesuaian config
              │         └──────────── MINOR: Fitur baru, modul baru, otomasi baru (backward-compatible)
              └────────────────────── MAJOR: Regulasi/kebijakan baru, breaking change skema data/arsitektur
```

### A. Perubahan yang Mengubah Kode `X` (MAJOR — `X.0.0`)
Kode `X` dinaikkan apabila terjadi **perubahan fundamental yang tidak kompatibel ke belakang (breaking changes)** atau **perubahan regulasi hukum utama**.

**Kriteria Pemicu Kenaikan Kode X:**
1. **Pembaruan Regulasi / Dasar Hukum Pokok**:
   - Terbit Peraturan Menteri Ketenagakerjaan (Permenaker) baru yang menggantikan Permenaker No. 15 Tahun 2024.
   - Perubahan rumus dasar tunjangan kinerja (misal bobot 30% Kehadiran & 70% Kinerja dirombak menjadi skema lain).
   - Perubahan struktur kelas jabatan dan tabel nominal tunjangan kinerja secara nasional.
2. **Breaking Changes Skema Data / Basis Data**:
   - Perubahan struktur tabel atau skema JSON presensi yang menyebabkan data periode terdahulu tidak dapat dibaca tanpa proses migrasi khusus.
   - Penghapusan atau perombakan total endpoint API publik internal.
3. **Perombakan Arsitektur Sistem Utama**:
   - Penggantian total framework inti (misal migrasi arsitektur besar-besaran), sistem autentikasi, atau platform database.
4. **Perubahan Format Lembar Kerja Baku**:
   - Format Lampiran 1, 2, 3, 4 diganti dengan format dokumen resmi baru oleh kementerian yang membatalkan format sebelumnya.

> ⚠️ **Aturan Reset**: Setiap kali kode **`X`** bertambah, kode **`Y`** dan **`Z`** **wajib di-reset menjadi `0`** (Contoh: `v1.4.2` ➔ `v2.0.0`).

---

### B. Perubahan yang Mengubah Kode `Y` (MINOR — `X.Y.0`)
Kode `Y` dinaikkan apabila terdapat **penambahan fungsionalitas, fitur, atau modul baru yang tetap kompatibel ke belakang (backward-compatible)**.

**Kriteria Pemicu Kenaikan Kode Y:**
1. **Penambahan Generator Dokumen / Modul Lampiran Baru**:
   - Penambahan generator Lampiran 4 (Master Presensi 1:1) pada `v1.4.0`.
   - Penambahan fitur pembuatan SPTJM otomatis atau dokumen rekapitulasi baru.
2. **Penambahan Fitur Otomasi / Deteksi Cerdas Baru**:
   - Otomatisasi deteksi jam keluar 23.59 sebagai lupa absen pulang pada `v1.3.0`.
   - Penambahan aturan deteksi otomatis status khusus baru (misal WFA, Tugas Belajar, Upacara).
3. **Penambahan Halaman / Modul Antarmuka Baru**:
   - Penambahan halaman Master Pegawai, halaman Audit Log, atau analitik rekap baru.
4. **Peningkatan Fitur Ekstensi Browser**:
   - Penambahan opsi ekstraksi profil lengkap pegawai, mode multi-satker, atau fitur download baru pada ekstensi.
5. **Peningkatan Bundel Ekspor**:
   - Pembaruan ekspor ZIP yang mengemas lampiran baru secara otomatis.

> ⚠️ **Aturan Reset**: Setiap kali kode **`Y`** bertambah, kode **`Z`** **wajib di-reset menjadi `0`** (Contoh: `v1.3.4` ➔ `v1.4.0`).

---

### C. Perubahan yang Mengubah Kode `Z` (PATCH — `X.Y.Z`)
Kode `Z` dinaikkan untuk **perbaikan bug (bug fixes), penyesuaian visual antarmuka, optimasi formula mikro, atau perubahan konfigurasi/default**.

**Kriteria Pemicu Kenaikan Kode Z:**
1. **Perbaikan Bug Kalkulasi / Formula Presensi**:
   - Pembetulan pembulatan nominal rupiah tukin atau uang makan.
   - Perbaikan kalkulasi selisih menit toleransi keterlambatan pada jam tertentu.
   - Penanganan kasus pegawai mutasi, jam kosong, atau format string tanggal anomali.
2. **Penyesuaian Antarmuka Pengguna (UI/UX Bug Fixes & Styling)**:
   - Perbaikan responsive layout pada perangkat mobile.
   - Penyesuaian ukuran dan padding badge versi agar tidak terpotong.
   - Perbaikan kontras warna, micro-interactions, modal dialog, atau typography.
3. **Perubahan Nilai Default Pengaturan**:
   - Mengubah status default checkbox ekstensi dari checked menjadi unchecked (contoh kasus `ambilDetailProfil`).
   - Penyesuaian delay/timeout fetch data di background worker browser.
4. **Pembaruan Data Statis & Typo**:
   - Koreksi salah ketik (typo) pada label, teks panduan, atau nama jabatan pada master data internal.
5. **Penanganan Error & Validasi Form**:
   - Menambahkan alert peringatan saat upload file JSON yang tidak sesuai format.

> 💡 **Aturan Efek**: Kode `Z` hanya bertambah satu tingkat tanpa memengaruhi nilai `X` maupun `Y` (Contoh: `v1.4.0` ➔ `v1.4.1`).

---

### Matriks Keputusan Cepat (SemVer Decision Matrix)

| Jenis Perubahan | X (MAJOR) | Y (MINOR) | Z (PATCH) | Contoh Konkret |
|---|:---:|:---:|:---:|---|
| Pergantian Regulasi Permenaker | ✅ | Reset 0 | Reset 0 | Terbit Permenaker pengganti 15/2024 (`v2.0.0`) |
| Breaking Change Skema JSON/DB | ✅ | Reset 0 | Reset 0 | Struktur database diubah total (`v2.0.0`) |
| Modul Lampiran Baru | ❌ | ✅ | Reset 0 | Rilis Lampiran 4 Master Presensi (`v1.4.0`) |
| Otomasi Logika Deteksi Baru | ❌ | ✅ | Reset 0 | Deteksi Lupa Absen Jam Keluar 23.59 (`v1.3.0`) |
| Ekspor Bundel Baru (.ZIP) | ❌ | ✅ | Reset 0 | Bundel 4 Lampiran sekaligus (`v1.4.0`) |
| Bug Fix Formula / Selisih | ❌ | ❌ | ✅ | Koreksi potongan persen keterlambatan (`v1.4.1`) |
| UI Tweak / Responsive Fix | ❌ | ❌ | ✅ | Penyesuaian badge agar muat `vX.Y.Z` (`v1.4.1`) |
| Ubah Default Checkbox Ekstensi | ❌ | ❌ | ✅ | Checkbox detail profil default unchecked (`v1.4.1`) |
| Typo / Koreksi Teks | ❌ | ❌ | ✅ | Memperbaiki ejaan nama satker di panduan (`v1.4.1`) |

---

## 2. Standar Tampilan Antarmuka untuk Format `vX.Y.Z`

Agar format lengkap **`vX.Y.Z`** (seperti `v1.4.0` atau `v1.12.10`) muat dengan rapi, proporsional, dan tidak merusak tata letak di layar mana pun, terapkan aturan desain antarmuka berikut:

### Aturan Tipografi & Spasi Badge Versi:
1. **Gunakan Font Monospace (`font-mono`)**: Karakter angka monospace memiliki lebar seragam sehingga tidak menyebabkan efek jitter/geser saat angka bertambah.
2. **Gunakan `whitespace-nowrap`**: Mencegah teks versi terpotong atau wrap ke baris baru.
3. **Padding Seimbang (`px-2 py-0.5`)**: Memberikan ruang napas horizontal yang cukup untuk 6 s/d 8 karakter.
4. **Ukuran Teks Proporsional (`text-[10px]` dengan `tracking-tight`)**: Cukup kecil untuk menjadi badge sekunder, namun terbaca tajam dan jelas.
5. **Indikator Wadah (`shrink-0`)**: Tombol atau elemen induk harus memiliki class `shrink-0` agar badge tidak tergencet saat ruang header menyempit di layar kecil.

### Spesifikasi Kelas CSS/Tailwind per Titik Tampilan:

* **Navbar Desktop & Mobile ([web/components/Navbar.tsx](file:///c:/Me/Code/rekaptukin/web/components/Navbar.tsx))**:
  ```tsx
  <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold font-mono tracking-tight bg-blue-500/25 text-blue-300 rounded-full border border-blue-400/30 whitespace-nowrap inline-flex items-center">
    {item.badge}
  </span>
  ```

* **Tombol Header Dashboard ([web/app/page.tsx](file:///c:/Me/Code/rekaptukin/web/app/page.tsx))**:
  ```tsx
  <a
    href="/changelog"
    className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 shadow-sm shrink-0 whitespace-nowrap"
  >
    <History className="w-4 h-4 text-blue-600 shrink-0" />
    <span>Changelog</span>
    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold font-mono rounded-full border border-blue-200/60 whitespace-nowrap">
      {LATEST_VERSION_LABEL}
    </span>
  </a>
  ```

* **Tautan Halaman Login ([web/app/login/page.tsx](file:///c:/Me/Code/rekaptukin/web/app/login/page.tsx))**:
  ```tsx
  <a 
    href="/changelog" 
    className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
  >
    <span>Lihat Catatan Rilis & Changelog Sistem</span>
    <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-blue-100 text-blue-700 rounded-full border border-blue-200/60 whitespace-nowrap tracking-tight">
      {LATEST_VERSION_LABEL}
    </span>
  </a>
  ```

* **Timeline Card Changelog ([web/app/changelog/page.tsx](file:///c:/Me/Code/rekaptukin/web/app/changelog/page.tsx))**:
  ```tsx
  <span className="text-base sm:text-lg font-black text-white tracking-tight font-mono">
    v{entry.version}
  </span>
  ```

---

## 3. Struktur Kategori Pembaruan (Badges)

Setiap butir perubahan dalam rilis dikelompokkan ke dalam kategori dengan badge warna kontekstual:
- `✨ FITUR`: Fitur baru, modul baru, atau kemampuan ekspor baru (Hijau Emerald / Cyan)
- `🎨 UI/UX`: Tata letak, estetika antarmuka, micro-interactions, responsive styling (Biru / Navy)
- `⚡ PERFORMA`: Optimasi query database, caching, kompresi ZIP, kecepatan render (Kuning / Amber)
- `🛡️ KEAMANAN`: Autentikasi sesi, proteksi hak akses, enkripsi token, validasi payload (Merah / Rose)
- `🐛 PERBAIKAN`: Bug fix, kalkulasi selisih waktu, pembulatan formula tukin, penyesuaian dropdown (Abu-abu / Slate)

---

## 4. Prosedur & Checklist Sinkronisasi Versi Lintas Aplikasi (Mandatory Sync Checklist)

Setiap kali merilis versi baru atau mencatat changelog, **WAJIB** menjalankan checklist sinkronisasi berikut:

### A. Data Changelog Web (`web/lib/changelog-data.ts`) — *Single Source of Truth*
1. Tambahkan objek rilis baru pada urutan pertama (indeks `0`) pada array `CHANGELOG_DATA`:
   ```typescript
   {
     version: 'X.Y.Z', // Contoh: '1.4.1'
     date: 'YYYY-MM-DD',
     type: 'PATCH', // 'MAJOR' | 'MINOR' | 'PATCH'
     title: 'Judul Ringkas Fokus Rilis',
     changes: [
       { category: 'BUG_FIX', title: '...', description: '...' }
     ]
   }
   ```
2. Pastikan export otomatis di bagian bawah tetap aktif:
   ```typescript
   export const LATEST_VERSION = CHANGELOG_DATA[0]?.version || '1.0.0';
   export const LATEST_VERSION_LABEL = `v${LATEST_VERSION}`;
   ```

### B. Verifikasi Sinkronisasi Otomatis pada Badge UI
Pastikan ketiga komponen berikut mengonsumsi `LATEST_VERSION_LABEL` dan **tidak dituliskan secara manual/hardcoded**:
- [web/components/Navbar.tsx](file:///c:/Me/Code/rekaptukin/web/components/Navbar.tsx) (`badge: LATEST_VERSION_LABEL`)
- [web/app/page.tsx](file:///c:/Me/Code/rekaptukin/web/app/page.tsx) (`{LATEST_VERSION_LABEL}`)
- [web/app/login/page.tsx](file:///c:/Me/Code/rekaptukin/web/app/login/page.tsx) (`{LATEST_VERSION_LABEL}`)

### C. Dokumen Riwayat Rilis Root (`CHANGELOG.md`)
Perbarui file markdown utama repository dengan format SemVer standar:
```markdown
## [vX.Y.Z] - YYYY-MM-DD

### ✨ Fitur Baru
- ...

### 🐛 Perbaikan & Presisi Formula
- ...

### 🎨 Peningkatan Antarmuka (UI/UX)
- ...
```

### D. Chrome Extension Manifests
Jika perubahan memengaruhi fungsionalitas ekstensi browser, perbarui field `"version"` di kedua lokasi agar tetap 1:1 identik:
- [extension/manifest.json](file:///c:/Me/Code/rekaptukin/extension/manifest.json) ➔ `"version": "X.Y.Z"`
- [web/extension/manifest.json](file:///c:/Me/Code/rekaptukin/web/extension/manifest.json) ➔ `"version": "X.Y.Z"`

### E. Metadata Package
Perbarui versi pada:
- [package.json](file:///c:/Me/Code/rekaptukin/package.json) di root
- [web/package.json](file:///c:/Me/Code/rekaptukin/web/package.json)

### F. Sinkronisasi Spesifikasi & Arsitektur (PRD.md & architecture.md)
Sesuai panduan **[Doc-Sync Skill](../doc-sync/SKILL.md)**, pastikan dua dokumen spesifikasi proyek diperbarui:
- [PRD.md](file:///c:/Me/Code/rekaptukin/PRD.md): Sinkronkan nomor versi, kebutuhan fungsional modul baru (`REQ-XXX-YY`), dan aturan regulasi.
- [architecture.md](file:///c:/Me/Code/rekaptukin/architecture.md): Sinkronkan nomor versi, diagram Mermaid, pohon struktur berkas, skema basis data ERD, dan algoritma baru.

### G. Git Tag, Commit & Release Gate (Selaras dengan GitHub Skill)
Sebelum melakukan rilis git, wajib lolos **Pre-Flight Release Gate (8-Point Checklist)** sebagaimana dipandu dalam **[GitHub Skill](../github/SKILL.md)**:

1. **Jalankan Uji Build**:
   ```bash
   npm --prefix web run build
   ```
2. **Stage dan Commit Rilis Resmi** (Format Conventional Commit):
   ```bash
   git add .
   git commit -m "chore(release): bump version to vX.Y.Z - <Judul Ringkas Rilis>"
   ```
3. **Sematkan Annotated Git Tag**:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z: <Ringkasan Fokus Rilis>"
   ```
4. **Push ke Remote & Trigger Vercel Production**:
   ```bash
   git push origin main --tags
   ```

### H. Aturan Wajib Pencatatan Optimasi Performa (Strict Performance Rule)
> ⚡ **HARD RULE — JANGAN PERNAH MELEWATKAN OPTIMASI PERFORMA DARI CHANGELOG**:
> Setiap kali dilakukan perbaikan atau optimasi performa (analisis waktu muat, optimasi query database, paralelisasi `Promise.all`, dekopling payload ringkasan vs lazy-loading log harian, pemangkasan ukuran JSON, atau penurunan TTFB), agen **DILARANG KERAS** melewatkannya.
> Perubahan tersebut **WAJIB** dicatat secara transparan pada:
> 1. `CHANGELOG.md` di bawah heading `### ⚡ Performa & Optimasi Kecepatan`.
> 2. `web/lib/changelog-data.ts` dengan properti `category: 'PERFORMA'`.
> 3. `architecture.md` Bagian 4.4 (Arsitektur Optimasi Performa & Lazy Loading).

> 🔗 **Panduan Lengkap Git & Deployment**: Rincian pemetaan Conventional Commits ke SemVer, tata cara pembuatan GitHub Release resmi, serta manajemen rollback production dijelaskan secara menyeluruh pada **[GitHub Skill (.agents/skills/github/SKILL.md)](../github/SKILL.md)**.



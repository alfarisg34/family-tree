# Changelog

Catatan perubahan Silsilah Keluarga. Tanggal acuan dokumentasi: 21 Oktober 2026.

Versi aplikasi: `0.2.0`. Catatan rilis publik tersedia di `/changelog` dengan data pada `src/data/changelog.ts`. Nomor versi pada footer beranda berasal dari sumber yang sama.

Gunakan `MAJOR.MINOR.PATCH`: MAJOR untuk perubahan tidak kompatibel, MINOR untuk fitur kompatibel, PATCH untuk perbaikan. Selaraskan data changelog, package, lockfile, dan dokumen setiap rilis. Seri saat ini mempertahankan major `0`.

## [v0.2.0] - 2026-10-21

Pengelolaan keluarga dan navigasi admin.

### ✨ Fitur Baru

- Tombol sampah dengan konfirmasi menghapus permanen keluarga beserta anggota dan hubungan melalui API khusus admin. Cache lokal dihapus setelah server berhasil; kegagalan mempertahankan data pada daftar.
- Aset foto tersimpan terpisah dan belum ikut dihapus oleh operasi ini.

### 🎨 UI/UX

- Rute dashboard menjadi `/admin/dashboard`, pengelolaan menjadi `/admin/manage`, dan login tetap `/admin/login`. Admin yang sudah login dialihkan dari URL lama.
- Tabel keluarga hanya ditampilkan pada halaman pengelolaan; dashboard memuat ringkasan statistik.
- Tombol Dashboard admin pada navbar silsilah mengarah kembali ke dashboard; mobile memakai ikon dasbor.

### Dokumentasi dan pengujian

- Sinkronisasi PRD, desain, skema API, arsitektur, README, metadata package, dan changelog publik.
- Pengujian API mencakup sesi wajib, validasi slug, target penghapusan, dan kegagalan database. Regresi browser mencakup pembatalan, keberhasilan, serta kegagalan penghapusan.

## [v0.1.0] - 2026-10-21

Rilis fitur pertama yang diberi nomor versi. Mencakup kemampuan aplikasi saat ini dan penyempurnaan eksplorasi keluarga.

### Fitur

- Overview berbentuk kartu keluarga dan ringkasan anggota, dengan pilihan membuka peta keluarga tertentu.
- Galeri terkait profil yang menggabungkan foto milik anggota dan foto yang menandainya, dengan deduplikasi URL dan tag sesuai profil aktif.
- Halaman publik `/changelog` dan tautan catatan rilis beserta versi di footer beranda saja.
- Lima dokumen proyek: PRD, desain, skema data/API, arsitektur, dan changelog.

### UI/UX

- URL keluarga langsung membuka peta seluruh keluarga pada zoom 85%, termasuk setelah refresh.
- Kedua pintu masuk peta mengutamakan ukuran node yang terbaca dan memakai skala awal yang sama; fit seluruh keluarga tetap menjadi tindakan eksplisit.
- Istilah “Cabang” pada antarmuka eksplorasi diganti menjadi “Keluarga”.
- Navbar, toolbar, dan kontrol bawah desktop diringkas untuk memperluas area peta; kontrol mobile mempertahankan target sentuh.
- Kontrol zoom menampilkan batas, status, reset, dan menu tindakan tambahan.
- Jarak subtree merapat saat zoom out dan membuka bertahap saat zoom in.
- Badge generasi menyesuaikan tingkat zoom; pada mobile tampil di kiri, mengikuti baris generasi, dan menghitung anggota sesuai keluarga terpilih.

### Perbaikan

- Anak yang hanya terhubung pada pasangan yang masuk kelompok tetap disertakan dalam cluster/overview keluarga, termasuk kasus anak angkat Nela.
- Preview hover keluarga tetap terbuka ketika kursor melintasi celah; semua anggota dapat di-scroll tanpa mengubah zoom peta.
- Tombol kembali merespons klik pertama setelah peta digeser; drag anggota tetap tidak membuka profil secara tidak sengaja.
- Tag galeri menyertakan pemilik foto dan peserta lain serta mengecualikan profil aktif, tanpa mengubah tag tersimpan.
- Informasi anak pada detail profil ditampilkan sekali di Silsilah Keturunan; urutan anak dan jenis hubungan dipertahankan.

### Pengujian

- Penambahan pengujian galeri, clustering melalui pasangan, dan interpolasi jarak zoom.
- Penambahan regresi browser untuk peta awal, konsistensi dimensi, hover/scroll, navigasi kembali setelah drag, badge generasi di layar 320px/390px, serta daftar anak tanpa duplikasi.

## Riwayat implementasi yang tercatat di Git

### 2026-10-21 — snapshot `1bf1cac`

Commit berjudul `update` menjadi acuan kode tersimpan sebelum rilis v0.1.0. Tree pada commit ini mencakup:

- SPA React/TypeScript dengan peta, pencarian, profil, form anggota, dan galeri.
- Landing, login, dashboard, pengelolaan keluarga, dan tautan berbasis slug.
- API Neon, penyimpanan JSONB anggota dan aset foto, sesi admin server, serta skrip setup/migrasi/verifikasi.
- Tema keluarga bernuansa hangat dan pengujian API/admin/viewport/browser.

Daftar tersebut mendeskripsikan isi snapshot; pesan commit umum tidak cukup untuk menentukan kapan setiap kemampuan pertama kali ditambahkan.

### 2026-08-24 — rangkaian implementasi

- `579d8cc`: form anggota, pencarian tag, navbar, pemilih tanggal, dan gaya global.
- `5fd8d04`: clustering berdasarkan keturunan dengan tier zoom dinamis.
- `560df8a`: komponen UI inti, layout engine, dan hook pengelolaan data.

### 2026-08-18 — penyempurnaan profil dan navigasi

- `8d6075e`: ikon status pasangan berpisah dan ditinggal wafat.
- `ae796ad`: ikon jenis hubungan orang tua–anak pada formulir dan detail.
- `afcd5ac`: navigasi Tab/panah dan pemilihan Enter pada autocomplete pencarian.
- `482b146`: efek sepia dibatasi pada avatar utama; foto galeri mempertahankan warna.

Riwayat ini dipilih dari commit yang dapat diverifikasi, bukan rekonstruksi seluruh perubahan sejak awal proyek. Dokumentasi teknis: [Architecture.md](Architecture.md); cakupan produk: [PRD.md](PRD.md).

# Silsilah Keluarga

Aplikasi silsilah keluarga berbasis React, TypeScript, dan Vite. Data keluarga, anggota, dan foto disimpan di PostgreSQL Neon melalui API server. Kredensial database tidak dikirim ke browser.

## Fitur

- Landing page berbahasa Indonesia untuk memperkenalkan fitur aplikasi.
- Peta silsilah dengan geser, zoom, minimap, dan detail yang menyesuaikan tingkat zoom.
- Pencarian anggota, profil, galeri foto, dan visualisasi hubungan keluarga.
- Dashboard admin, pengelolaan keluarga dan anggota, serta salin tautan untuk dibagikan.
- Login server dengan cookie HttpOnly. Semua perubahan database dan daftar seluruh keluarga memerlukan sesi admin.

## Menjalankan lokal

Gunakan Node.js 24 untuk menjalankan aplikasi dan tes.

```sh
npm install
```

Buat `.env.local` berdasarkan `.env.example`, lalu isi variabel **server** berikut:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
ADMIN_PASSWORD=kata-sandi-admin-anda
ADMIN_SESSION_SECRET=rahasia-acak-minimal-32-karakter
```

Gunakan URL pooled yang diberikan Neon. Jangan beri awalan `VITE_` pada kredensial server. `.env.local` diabaikan Git.

```sh
npm run db:setup
npm run dev
```

Middleware Vite menjalankan `/api/data` di komputer lokal. `npm run preview` juga menyediakan API server untuk hasil build.

## Halaman

| Alamat | Fungsi |
| --- | --- |
| `/` | Pengenalan aplikasi; tidak menampilkan daftar atau tautan keluarga tertentu. |
| `/changelog` | Catatan rilis publik; tautan dan versi tersedia pada footer beranda. |
| `/admin/login` | Login menggunakan `ADMIN_PASSWORD`, tanpa username. |
| `/admin/dashboard` | Dashboard; dialihkan ke login jika sesi belum tersedia. |
| `/admin/manage` | Tambah keluarga, ubah informasi keluarga, tambah/edit anggota, salin tautan, hapus permanen keluarga dengan konfirmasi. Memerlukan login. |
| `/<slug-keluarga>` | Peta keluarga yang dapat dibuka oleh penerima tautan dari admin. |

Kata sandi lama tidak lagi diperiksa di frontend. Kata sandi aktif adalah nilai `ADMIN_PASSWORD` pada server. Sesi berlaku 12 jam. Login pada browser yang sudah digunakan akan diverifikasi kembali oleh server.

Admin yang sudah login dialihkan dari `/admin` ke `/admin/dashboard` dan `/manage` ke `/admin/manage`. Tombol Dashboard admin pada navbar silsilah kembali ke dashboard. Tabel keluarga tersedia di halaman pengelolaan.

Penghapusan permanen menghapus keluarga beserta seluruh anggota dan hubungan, lalu membersihkan cache pada perangkat ini setelah server berhasil. Aset foto tersimpan terpisah dan belum ikut dihapus; cache perangkat lain belum disinkronkan.

## Migrasi dari Supabase

Aktifkan kembali proyek Supabase jika sedang paused. Isi variabel sumber pada `.env.local`:

```dotenv
SUPABASE_SOURCE_URL=https://PROJECT.supabase.co
SUPABASE_SOURCE_KEY=kunci-dengan-akses-baca
```

```sh
npm run db:migrate -- --dry-run
npm run db:migrate
npm run db:migrate -- --verify
```

Skrip mengambil seluruh halaman data sumber, menyimpan backup JSON di `backups/`, menyalin foto yang digunakan oleh profil dan galeri, lalu memeriksa hasil. Data Supabase tidak diubah. Foto dari URL eksternal seperti Unsplash tetap menggunakan URL asalnya.

Migrasi berhenti jika ada alamat keluarga yang bertabrakan atau anggota yang tidak memiliki keluarga yang cocok. Migrasi juga berhenti jika keluarga tujuan sudah ada. Gunakan `--merge` hanya jika ingin memperbarui dan menggabungkan data sumber ke keluarga yang telah ada di Neon; anggota lain di Neon tetap dipertahankan.

Backup JSON dapat digunakan sebagai sumber:

```sh
npm run db:migrate -- --backup backups/supabase-YYYY-MM-DD.json
```

Format yang didukung: objek `{ family_trees, family_members }`, satu objek `FamilyData`, atau array `FamilyData`. Pemeriksaan `--verify` menggunakan backup Supabase terakhir dan tidak mengubah data keluarga.

Foto disimpan sebagai data gambar pada tabel `family_assets`, lalu disajikan melalui API. Upload menerima JPEG, PNG, WebP, dan GIF dengan batas data URL 3,5 MB; formulir mengoptimalkan gambar sebelum upload.

## Deploy ke Vercel

1. Impor repository ke Vercel sebagai proyek Vite.
2. Tambahkan `DATABASE_URL`, `ADMIN_PASSWORD`, dan `ADMIN_SESSION_SECRET` di Environment Variables untuk environment yang digunakan.
3. Gunakan secret sesi yang sama pada seluruh instance server dalam satu environment.
4. Jalankan `npm run db:setup` untuk database tujuan jika belum disiapkan, kemudian deploy.

API berada di `api/data.mjs`; konfigurasi routing mempertahankan endpoint API dan meneruskan halaman aplikasi ke frontend. Variabel sumber Supabase hanya diperlukan untuk migrasi lokal, tidak perlu ditambahkan ke Vercel. Mengubah `.env.local` tidak otomatis memperbarui konfigurasi Vercel.

## Validasi

```sh
npm test
npm run lint
npm run build
```

Tes memeriksa pengalihan halaman admin, sesi server, penolakan akses tanpa login, validasi data, hubungan pasangan, dan konversi data migrasi. Pemeriksaan Neon langsung dijalankan terpisah dengan `npm run db:migrate -- --verify`.

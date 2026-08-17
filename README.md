# 🌳 Interactive Family Tree Map Explorer

Website visualisasi silsilah pohon keluarga modern berbasis peta interaktif dengan navigasi geser (*pan*), perbesar (*zoom*), tingkat kedalaman detail (*Level of Detail* / LOD), galeri foto beroptimisasi otomatis, visualisasi status keluarga (wafat, bercerai, anak angkat), serta dukungan database **Supabase** dan deployment **Vercel**.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Supabase](https://img.shields.io/badge/Supabase-Database-emerald)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-black)

---

## ✨ Fitur Utama

- 🗺️ **Peta Silsilah Interaktif (Pan & Zoom)**: Drag, scroll/pinch-to-zoom dengan radar minimap layaknya peta dunia RPG/Google Maps.
- 🔍 **Level of Detail (LOD) Dinamis**:
  - *Zoom Makro (<55%)*: Menampilkan hanya foto generasi leluhur tanpa teks agar bersih dan rapi.
  - *Zoom Medium (55%–105%)*: Foto lingkaran memunculkan nama panggilan yang memudar masuk (*fade-in*).
  - *Zoom Mikro (>105%)*: Menampilkan detail lengkap (nama lengkap, gelar, tahun kelahiran/wafat, karir).
- 🎗️ **Visualisasi Anggota Wafat**: Foto otomatis berfilter **Sepia / Grayscale Vintage** dengan pita duka dan perhitungan usia saat berpulang.
- 💔 **Garis Hubungan Perceraian**: Garis putus-putus merah (*dashed line*) dengan simbol pemisah, silsilah anak tetap terhubung rapi ke kedua orang tua.
- 🌱 **Anak Angkat / Asuh**: Garis keturunan putus-putus berwarna cyan/teal dengan badge pembeda khusus.
- 🖼️ **Modal Detail & Karosel Galeri**: Menampilkan atribut lengkap yang terisi (pendidikan, karir, domisili, kontak, kisah hidup) serta karosel multi-foto kenangan.
- ⚡ **Optimisasi Foto Otomatis**: Kompresi foto pada perangkat (*client-side canvas compression*) menghemat ukuran berkas hingga >90% agar rendering 60 FPS tetap mulus.
- 🛡️ **Dashboard Admin**: Autentikasi admin, penambahan relasi vertikal (orang tua / anak) dan horizontal (pasangan / saudara), export/import JSON.
- ☁️ **Integrasi Supabase & Vercel**: Dukungan sinkronisasi database PostgreSQL Supabase dan konfigurasi SPA routing Vercel.

---

## 🚀 Memulai (Quick Start)

### 1. Instalasi & Menjalankan Lokal

```bash
# Clone repository
git clone https://github.com/alfarisg34/family-tree.git
cd family-tree

# Install dependencies
npm install

# Jalankan server pengembangan
npm run dev
```

Buka peramban di `http://localhost:5173/`.

---

## 💾 Setup Database Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan masuk ke **SQL Editor**.
2. Salin seluruh isi dari file `supabase_schema.sql` dan jalankan (*Run*).
3. Salin **Project URL** & **anon public API Key** dari menu *Project Settings > API*.
4. Masukkan kredensial tersebut pada menu **Database** di navbar aplikasi atau buat file `.env`:

```env
VITE_SUPABASE_URL=https://xyzabcdefg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Klik tombol **"Unggah Silsilah ke Supabase"** di aplikasi untuk menyalin seluruh data ke database cloud Anda.

---

## 🌐 Deploy ke Vercel

1. Buka [Vercel](https://vercel.com) dan impor repositori GitHub ini.
2. Tambahkan **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Klik **Deploy**!

---

## 🔑 Kredensial Admin Demo

- **Password Admin**: `admin` atau `keluarga123`

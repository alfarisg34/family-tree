# Product Requirements Document — Silsilah Keluarga

Tanggal acuan: 21 Oktober 2026. Versi aplikasi: `0.1.0` sesuai `package.json`.
Status: dokumentasi implementasi rilis v0.1.0.

## 1. Ringkasan produk

Silsilah Keluarga adalah aplikasi web berbahasa Indonesia untuk mengenal anggota keluarga, memahami hubungan lintas generasi, dan menyimpan cerita serta foto keluarga. Setiap keluarga memiliki alamat berbasis slug, misalnya `/<slug-keluarga>`. Pengunjung dapat menjelajahi peta dan profil tanpa login; admin mengelola data melalui sesi server.

Masalah yang diselesaikan:

- Hubungan orang tua, pasangan, anak, dan keturunan sulit dipahami dalam daftar biasa.
- Pohon yang besar menjadi padat saat diperbesar dan sulit dijelajahi dari ponsel.
- Foto bersama perlu ditemukan dari profil peserta dengan konteks tag yang tepat.
- Pengelola membutuhkan satu tempat untuk memperbarui keluarga dan membagikan tautannya.

## 2. Pengguna dan tujuan

| Pengguna | Tujuan | Hak akses saat ini |
| --- | --- | --- |
| Pengunjung/penerima tautan | Menelusuri keluarga, mencari anggota, membaca profil dan foto | Membaca keluarga melalui slug dan membaca aset foto |
| Admin | Membuat keluarga, memperbarui profil dan hubungan, mengunggah foto | Satu kata sandi server; akses seluruh keluarga dan operasi tulis |

Tidak ada akun anggota, undangan individual, peran admin per keluarga, atau persetujuan perubahan. Slug adalah alamat publik yang dapat dibagikan, bukan mekanisme autentikasi atau pembatasan akses data.

## 3. Ruang lingkup dan perjalanan pengguna

### Pengunjung

1. Membuka tautan keluarga dan langsung melihat peta seluruh keluarga pada zoom awal 85%.
2. Menggeser peta atau menggunakan zoom; memilih “Lihat seluruh keluarga” bila ingin memuat keseluruhan pohon ke layar.
3. Membuka overview melalui navigasi kembali, lalu memilih kartu “Keluarga [nama]”.
4. Membaca ringkasan keluarga atau membuka peta keluarga tersebut. Di mobile, pemilihan kartu membuka ringkasan terlebih dahulu.
5. Mencari nama atau memfilter generasi dalam daftar anggota, lalu membuka profil.
6. Membaca silsilah keturunan dan membuka foto terkait; memilih anggota lain dari hubungan atau tag foto.

### Admin

1. Masuk di `/admin/login` menggunakan kata sandi server.
2. Membuka dashboard `/admin` dan pengelolaan `/manage`.
3. Membuat keluarga dengan nama dan slug, memperbarui metadata dan anggota.
4. Mengatur orang tua, pasangan, urutan anak, foto profil, galeri, dan tag anggota.
5. Menyalin tautan keluarga untuk dibagikan.

## 4. Kebutuhan fungsional

| ID | Kebutuhan dan perilaku implementasi |
| --- | --- |
| REQ-NAV-01 | Landing `/` memperkenalkan aplikasi tanpa menampilkan katalog keluarga tertentu. |
| REQ-NAV-02 | `/<slug>` langsung membuka peta; refresh mempertahankan tujuan keluarga. |
| REQ-CHG-01 | `/changelog` adalah halaman publik berisi timeline versi, tanggal, serta kategori fitur/UI/UX/perbaikan/dokumentasi. Dapat dibuka langsung dan di-refresh. |
| REQ-CHG-02 | Footer beranda `/` menampilkan versi `vX.Y.Z` dan tautan catatan rilis. Footer versi tidak ditambahkan pada halaman keluarga atau admin. Versi berasal dari data changelog terpusat. |
| REQ-MAP-01 | Peta mendukung drag, wheel, gesture sentuh, zoom masuk/keluar, reset, fit, minimap, dan legenda. |
| REQ-MAP-02 | Skala kamera dibatasi 8–250%; reset dan kedua pintu masuk peta menggunakan 85%. Seluruh pohon tidak wajib langsung muat. |
| REQ-MAP-03 | Pohon besar memakai cluster keluarga dan detail bertahap: macro di bawah 50%, medium di bawah 85%, micro mulai 85%. Pohon maksimal 12 node dan mode expand-all melewati clustering. |
| REQ-MAP-04 | Jarak horizontal subtree dirapatkan saat zoom out dan dibuka bertahap sebelum keturunan muncul. Peta keluarga terpilih memakai koordinat layout penuh. |
| REQ-MAP-05 | Label generasi tetap terbaca ketika zoom; pada mobile badge berada di sisi kiri dan mengikuti posisi vertikal baris. Mode macro hanya menampilkan label generasi I–II. |
| REQ-OVR-01 | Overview berupa kartu keluarga dengan jumlah anggota; label pengguna memakai “Keluarga”, bukan “Cabang”. |
| REQ-OVR-02 | Anak yang terhubung hanya ke pasangan yang masuk kelompok tetap termasuk dalam keluarga yang sesuai, termasuk kasus anak angkat. |
| REQ-OVR-03 | Preview hover dapat dicapai kursor dan di-scroll tanpa mengubah zoom peta; kembali setelah drag merespons klik pertama. |
| REQ-SRC-01 | Pencarian nama dan filter generasi membuka profil anggota; pencarian navbar mendukung navigasi keyboard. |
| REQ-PRF-01 | Profil menampilkan identitas, gelar, biografi, riwayat hidup, kontak, foto, orang tua, pasangan, dan saudara bila tersedia. |
| REQ-PRF-02 | Silsilah keturunan dikelompokkan menjadi anak, cucu, cicit, dan seterusnya; daftar anak tidak diulang pada bagian hubungan langsung. Urutan dan jenis hubungan anak tetap tersedia. |
| REQ-PHT-01 | Galeri profil menggabungkan foto milik anggota dan foto orang lain yang menandainya; URL foto yang sama dideduplikasi. |
| REQ-PHT-02 | Tag tampilan memuat pemilik foto dan peserta yang dikenal, kecuali anggota yang profilnya sedang dibuka. Penyusunan tag tidak mengubah galeri tersimpan. |
| REQ-PHT-03 | Admin dapat crop/optimasi gambar dan upload JPEG, PNG, WebP, atau GIF melalui API. |
| REQ-ADM-01 | Admin dapat membuat keluarga, mengubah metadata, menambah/mengubah/menghapus anggota, dan menyusun urutan anak. |
| REQ-REL-01 | Jenis hubungan orang tua: biological/adopted/foster/step; status pasangan: married/divorced/separated/widowed. Perubahan pasangan disinkronkan dua arah oleh klien. |
| REQ-DAT-01 | Neon menjadi penyimpanan remote; cache localStorage per slug mempercepat tampilan awal dan menjadi fallback. |
| REQ-AUT-01 | Semua operasi tulis dan katalog seluruh keluarga memerlukan sesi admin yang diverifikasi server. Sesi bertahan 12 jam. |

## 5. Aturan bisnis

- Slug berupa huruf kecil/angka dengan pemisah `-` atau `_`; `admin`, `manage`, `api`, dan `changelog` dicadangkan. Slug unik pada database.
- ID anggota unik di dalam satu keluarga. Referensi orang tua, pasangan, dan tag menggunakan ID anggota dalam keluarga tersebut.
- Nama anggota dan nama keluarga wajib diisi. Generasi akar dapat dikonfigurasi, sehingga sebutan generasi tidak selalu dimulai dari buyut.
- Pasangan dan orang tua dapat memiliki data yang tidak lengkap; sistem tidak memerlukan tepat dua orang tua.
- Penyimpanan seluruh pohon melakukan upsert anggota. Menghilangkan anggota dari payload tidak berarti menghapusnya dari database; penghapusan memakai operasi khusus.
- Menghapus anggota membersihkan referensi `parentIds` dan `spouses` pada keluarga yang sama. Pembersihan tag foto dan aset yatim belum otomatis.
- Foto bersama milik Danti yang menandai Koko, Nenis, dan Zidan akan menampilkan Danti/Koko/Nenis saat dibuka dari profil Zidan; dari profil Danti menampilkan Koko/Nenis/Zidan.

## 6. Kebutuhan nonfungsional dan batasan

| Aspek | Ketentuan dan status |
| --- | --- |
| Responsif | Desktop mengutamakan ruang peta dengan toolbar ringkas; mobile memakai kontrol sentuh dan label ringkas. |
| Aksesibilitas | Dialog utama memakai nama aksesibel, Escape, focus trap, dan pemulihan fokus. Belum ada audit WCAG menyeluruh; sebagian chip masih berupa elemen klik non-button. |
| Keamanan | Kredensial hanya di server; cookie HttpOnly/SameSite=Strict, Secure pada HTTPS/Vercel; penulisan memeriksa Origin jika tersedia. |
| Integritas | FK keluarga dan transaksi database tersedia. Hubungan di dalam JSONB belum dijaga FK dan validasi graf lengkap belum tersedia. |
| Kinerja | Clustering, culling, thumbnail, optimasi gambar, dan cache aset diterapkan. Belum ada SLA latensi atau kapasitas pohon yang diukur. |
| Keandalan | Cache dapat tetap tampil saat fetch gagal. Sebagian alur penyimpanan bersifat optimistis; belum ada antrean retry, resolusi konflik, atau jaminan sinkronisasi offline. |
| Privasi | Pembaca slug menerima payload keluarga penuh, termasuk kontak bila diisi. Belum ada pengaturan visibilitas per field atau keluarga privat. |

## 7. Kriteria penerimaan utama

- Membuka atau refresh URL keluarga di desktop/mobile langsung menampilkan peta pada 85%.
- Ukuran node dan jarak pada dua pintu masuk peta konsisten untuk skala yang sama; pengguna dapat menggeser pohon yang melampaui layar.
- Zoom out merapatkan kelompok; zoom in membuka ruang untuk keturunan tanpa memisahkan anak yang terhubung melalui pasangan.
- Label generasi terbaca di layar 320px dan 390px, tidak hilang karena aturan CSS mobile, dan tetap berada di kiri saat pan horizontal.
- Membuka profil orang tua menampilkan setiap anak sekali pada daftar silsilah serta mempertahankan jenis hubungannya.
- Tag foto mengikuti profil aktif dan foto duplikat tidak menambah item galeri.
- Pengunjung tidak dapat menulis data atau membaca katalog keluarga melalui API tanpa sesi admin.

Pengujian otomatis terdapat di `tests/*.test.mjs` dan `tests/browser/family.spec.mjs`. Kriteria ini tidak menyatakan bahwa seluruh kombinasi perangkat, dataset, atau kondisi jaringan sudah diuji.

## 8. Di luar cakupan saat ini

Akun anggota, undangan privat, pengelolaan izin per keluarga, audit perubahan, kolaborasi real-time, konflik multi-editor, ekspor PDF pohon, dan SLA produksi belum menjadi fitur yang diimplementasikan. Prioritas pekerjaan berikutnya perlu ditetapkan terpisah.

## 9. Dokumen terkait

[Desain antarmuka](Design.md), [skema data dan kontrak API](Schema.md), [arsitektur dan operasional](Architecture.md), [riwayat perubahan](CHANGELOG.md), dan [panduan menjalankan proyek](README.md).

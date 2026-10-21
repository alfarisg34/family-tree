export type ChangeCategory = 'FITUR' | 'UI/UX' | 'PERBAIKAN' | 'DOKUMENTASI';

export interface ReleaseEntry {
  version: string;
  date: string;
  type: 'MAJOR' | 'MINOR' | 'PATCH';
  title: string;
  summary: string;
  changes: { category: ChangeCategory; title: string; description: string }[];
}

// New releases go first. The homepage and release page share this version source.
export const CHANGELOG_DATA: ReleaseEntry[] = [{
  version: '0.2.0',
  date: '2026-10-21',
  type: 'MINOR',
  title: 'Pengelolaan keluarga dan navigasi admin',
  summary: 'Hapus keluarga secara permanen, gunakan alamat admin yang lebih teratur, dan kembali ke dashboard dari halaman silsilah.',
  changes: [
    { category: 'FITUR', title: 'Hapus permanen keluarga', description: 'Tombol sampah pada daftar keluarga meminta konfirmasi sebelum menghapus keluarga beserta seluruh anggota dan hubungannya. Operasi memerlukan sesi admin; cache perangkat dibersihkan setelah server berhasil.' },
    { category: 'UI/UX', title: 'Alamat admin terpusat', description: 'Dashboard berada di /admin/dashboard dan pengelolaan di /admin/manage. Alamat lama mengarahkan admin yang sudah login ke alamat baru; login tetap di /admin/login.' },
    { category: 'UI/UX', title: 'Dashboard lebih ringkas', description: 'Dashboard menampilkan ringkasan statistik. Daftar dan tindakan keluarga tersedia pada halaman Kelola keluarga.' },
    { category: 'UI/UX', title: 'Kembali dari silsilah', description: 'Tombol Dashboard admin pada navigasi halaman keluarga membawa admin kembali ke dashboard. Di ponsel tombol menggunakan ikon dasbor.' },
    { category: 'DOKUMENTASI', title: 'Panduan admin dan kontrak penghapusan', description: 'Dokumen produk, desain, arsitektur, skema API, dan panduan diperbarui. Aset foto belum ikut dihapus karena tidak memiliki kepemilikan per keluarga.' },
  ],
}, {
  version: '0.1.0',
  date: '2026-10-21',
  type: 'MINOR',
  title: 'Lebih dekat dengan cerita keluarga',
  summary: 'Rilis pertama Silsilah Keluarga: peta interaktif, profil, galeri kenangan, dan pengelolaan keluarga dengan pengalaman yang nyaman di komputer maupun ponsel.',
  changes: [
    { category: 'FITUR', title: 'Jelajahi peta keluarga', description: 'Geser dan zoom peta, temukan anggota melalui pencarian atau filter generasi, serta gunakan minimap dan legenda untuk memahami hubungan keluarga.' },
    { category: 'FITUR', title: 'Ringkasan setiap keluarga', description: 'Overview berbentuk kartu memudahkan Anda membuka ringkasan dan peta keluarga yang ingin dikenal lebih jauh.' },
    { category: 'FITUR', title: 'Profil dan kenangan bersama', description: 'Baca kisah hidup, hubungan, serta silsilah keturunan. Foto bersama dapat ditemukan dari profil pemilik maupun anggota yang ditandai.' },
    { category: 'FITUR', title: 'Pengelolaan oleh admin', description: 'Admin dapat membuat keluarga, memperbarui anggota dan hubungan, mengatur urutan anak, mengunggah foto, serta membagikan tautan keluarga. Data disimpan di Neon melalui API dengan sesi admin server.' },
    { category: 'FITUR', title: 'Catatan rilis aplikasi', description: 'Halaman changelog merangkum pembaruan. Nomor versi dan tautannya tersedia di footer halaman utama.' },
    { category: 'UI/UX', title: 'Peta langsung terbuka dan mudah dibaca', description: 'Tautan keluarga langsung menampilkan peta pada zoom 85%. Ukuran node dan jarak konsisten pada kedua pintu masuk peta; seluruh pohon dapat dilihat melalui tombol khusus.' },
    { category: 'UI/UX', title: 'Ruang peta lebih luas', description: 'Toolbar desktop lebih ringkas, kontrol mobile nyaman disentuh, dan istilah kelompok menggunakan “Keluarga”.' },
    { category: 'UI/UX', title: 'Zoom dan generasi mengikuti konteks', description: 'Jarak keluarga merapat saat zoom out dan membuka saat zoom in. Label generasi tetap terbaca, termasuk di mobile, dengan jumlah anggota sesuai keluarga yang dipilih.' },
    { category: 'PERBAIKAN', title: 'Anggota tetap bersama keluarganya', description: 'Anak yang hanya terhubung melalui pasangan tetap termasuk dalam kelompok keluarga yang sesuai, termasuk anak angkat.' },
    { category: 'PERBAIKAN', title: 'Navigasi dan preview lebih andal', description: 'Tombol kembali merespons setelah drag. Preview keluarga tetap terbuka saat kursor berpindah dan dapat di-scroll tanpa mengubah zoom peta.' },
    { category: 'PERBAIKAN', title: 'Informasi profil tanpa pengulangan', description: 'Daftar anak tampil sekali dalam silsilah. Galeri menghapus foto duplikat berdasarkan URL dan menampilkan peserta lain sesuai profil yang sedang dibuka.' },
    { category: 'DOKUMENTASI', title: 'Dokumentasi proyek', description: 'PRD, desain, skema data dan API, arsitektur, serta changelog menjelaskan fitur dan batasan implementasi.' },
  ],
}];

export const LATEST_VERSION = CHANGELOG_DATA[0].version;
export const LATEST_VERSION_LABEL = `v${LATEST_VERSION}`;

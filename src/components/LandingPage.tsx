import { ArrowRight, GitGraph, Heart, Images, Map, Search, ShieldCheck, Users, ZoomIn } from 'lucide-react';
import './LandingPage.css';
import { LATEST_VERSION_LABEL } from '../data/changelog';

const features = [
  { icon: Map, title: 'Jelajahi silsilah secara interaktif', description: 'Geser peta, perbesar setiap keluarga, dan gunakan minimap untuk melihat hubungan lintas generasi dengan mudah.' },
  { icon: Search, title: 'Temukan anggota keluarga', description: 'Cari berdasarkan nama, nama panggilan, profesi, atau domisili. Langsung menuju anggota yang ingin Anda kenal.' },
  { icon: Images, title: 'Simpan cerita dan kenangan', description: 'Kenali setiap anggota melalui profil, kisah hidup, pendidikan, pekerjaan, dan galeri foto yang dapat diperbesar.' },
  { icon: Heart, title: 'Pahami setiap hubungan', description: 'Lihat hubungan orang tua, anak, pasangan, dan saudara, lengkap dengan penanda anak angkat, perceraian, dan anggota yang telah wafat.' },
  { icon: Users, title: 'Terhubung lintas generasi', description: 'Lihat susunan generasi dengan detail yang menyesuaikan tingkat zoom, dari gambaran keluarga besar hingga profil per anggota.' },
  { icon: ShieldCheck, title: 'Kelola bersama admin', description: 'Admin dapat menambah anggota dan kerabat, memperbarui profil, serta mengatur nama silsilah dan generasi tertua.' },
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header landing-shell">
        <a className="landing-brand" href="/" aria-label="Silsilah Keluarga — beranda">
          <span className="landing-brand-icon"><GitGraph size={22} /></span>
          <span>Silsilah<span className="landing-brand-accent"> Keluarga</span></span>
        </a>
        <nav aria-label="Navigasi utama">
          <a className="landing-nav-link" href="#fitur">Fitur aplikasi</a>
        </nav>
      </header>

      <main>
        <section className="landing-hero landing-shell" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> Setiap keluarga punya cerita</p>
            <h1 id="landing-title">Kenali akar kita.<br /><span>Jaga cerita keluarga.</span></h1>
            <p className="landing-intro">Jelajahi silsilah, kenali hubungan antar generasi, dan simpan kenangan orang-orang terkasih dalam satu peta keluarga interaktif.</p>
            <div className="landing-actions">
              <a className="landing-button" href="#fitur">Kenali fitur aplikasi <ArrowRight size={18} /></a>
            </div>
            <p className="landing-hero-note">Buka silsilah keluarga melalui tautan yang dibagikan admin.</p>
          </div>

          <div className="landing-preview" role="img" aria-label="Ilustrasi silsilah tiga generasi: kakek dan nenek, orang tua, serta anak-anak. Nama yang ditampilkan adalah contoh.">
            <div className="landing-preview-heading"><span><GitGraph size={16} /> Satu keluarga, banyak cerita</span><span className="landing-preview-badge">Ilustrasi</span></div>
            <div className="landing-tree-demo" aria-hidden="true">
              <div className="landing-demo-generation">Generasi pertama</div>
              <div className="landing-demo-couple">
                <div className="landing-demo-person"><span className="landing-demo-avatar">H</span><strong>Hasan</strong><small>Kakek</small></div>
                <span className="landing-demo-marriage"><Heart size={14} /></span>
                <div className="landing-demo-person"><span className="landing-demo-avatar landing-demo-avatar-rose">A</span><strong>Aminah</strong><small>Nenek</small></div>
              </div>
              <div className="landing-demo-stem" />
              <div className="landing-demo-generation">Generasi kedua</div>
              <div className="landing-demo-couple">
                <div className="landing-demo-person"><span className="landing-demo-avatar landing-demo-avatar-teal">R</span><strong>Rizal</strong><small>Ayah</small></div>
                <span className="landing-demo-marriage"><Heart size={14} /></span>
                <div className="landing-demo-person"><span className="landing-demo-avatar landing-demo-avatar-rose">S</span><strong>Sari</strong><small>Ibu</small></div>
              </div>
              <div className="landing-demo-branches"><span /><span /></div>
              <div className="landing-demo-children">
                <div className="landing-demo-person"><span className="landing-demo-avatar landing-demo-avatar-teal">D</span><strong>Dimas</strong><small>Anak</small></div>
                <div className="landing-demo-person"><span className="landing-demo-avatar">N</span><strong>Nadia</strong><small>Anak</small></div>
              </div>
            </div>
            <div className="landing-preview-footer"><Users size={15} /> Hubungan lintas generasi <ZoomIn size={17} /></div>
          </div>
        </section>

        <section className="landing-features landing-shell" id="fitur" aria-labelledby="landing-features-title">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Lebih dekat dengan keluarga</p>
            <h2 id="landing-features-title">Silsilah yang bisa dijelajahi.<br />Kenangan yang terus hidup.</h2>
            <p>Semua yang Anda butuhkan untuk mengenal dan merawat cerita keluarga, dari satu generasi ke generasi berikutnya.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="landing-feature" key={title}>
                <span className="landing-feature-icon"><Icon size={23} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-start landing-shell" aria-labelledby="landing-start-title">
          <div><p className="landing-eyebrow">Akses silsilah keluarga</p><h2 id="landing-start-title">Cerita keluarga dimulai dari sebuah tautan.</h2><p>Minta tautan silsilah kepada admin keluarga Anda. Buka tautan tersebut melalui komputer atau ponsel untuk menjelajahi peta dan mengenal setiap anggota keluarga.</p></div>
        </section>
      </main>

      <footer className="landing-footer landing-shell">
        <span><GitGraph size={17} /> Silsilah Keluarga</span>
        <p>Merawat hubungan. Menyimpan kenangan.</p>
        <div className="landing-footer-links">
          <a href="/changelog" aria-label={`Catatan rilis ${LATEST_VERSION_LABEL}`}>Catatan rilis <span className="landing-version">{LATEST_VERSION_LABEL}</span></a>
          <a href="#landing-title">Kembali ke atas ↑</a>
        </div>
      </footer>
    </div>
  );
}

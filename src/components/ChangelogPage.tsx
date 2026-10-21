import { ArrowLeft, GitGraph, History } from 'lucide-react';
import { CHANGELOG_DATA, type ChangeCategory } from '../data/changelog';
import './LandingPage.css';
import './ChangelogPage.css';

const categories: ChangeCategory[] = ['FITUR', 'UI/UX', 'PERBAIKAN', 'DOKUMENTASI'];
const labels: Record<ChangeCategory, string> = {
  FITUR: 'Fitur', 'UI/UX': 'UI/UX', PERBAIKAN: 'Perbaikan', DOKUMENTASI: 'Dokumentasi',
};

export function ChangelogPage() {
  return (
    <div className="landing-page changelog-page">
      <header className="landing-header landing-shell">
        <a className="landing-brand" href="/" aria-label="Silsilah Keluarga — beranda">
          <span className="landing-brand-icon"><GitGraph size={22} /></span>
          <span>Silsilah<span className="landing-brand-accent"> Keluarga</span></span>
        </a>
        <a className="changelog-back" href="/"><ArrowLeft size={16} /> Beranda</a>
      </header>
      <main className="landing-shell changelog-main">
        <div className="changelog-intro">
          <p className="landing-eyebrow"><History size={16} /> Perjalanan aplikasi</p>
          <h1>Catatan rilis</h1>
          <p>Ikuti pembaruan yang membuat cerita keluarga semakin mudah dijelajahi.</p>
        </div>
        <div className="changelog-timeline">
          {CHANGELOG_DATA.map((release, index) => (
            <article className="changelog-release" key={release.version} aria-labelledby={`release-${release.version}`}>
              <header className="changelog-release-header">
                <span className="changelog-version">v{release.version}</span>
                {index === 0 && <span className="changelog-latest">Terbaru</span>}
                <time dateTime={release.date}>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${release.date}T00:00:00Z`))}</time>
              </header>
              <h2 id={`release-${release.version}`}>{release.title}</h2>
              <p className="changelog-summary">{release.summary}</p>
              {categories.map(category => {
                const changes = release.changes.filter(change => change.category === category);
                if (!changes.length) return null;
                return (
                  <section className="changelog-category" key={category}>
                    <h3 className={`changelog-category-label category-${category === 'UI/UX' ? 'design' : category.toLowerCase()}`}>{labels[category]}</h3>
                    <ul>{changes.map(change => <li key={change.title}><h4>{change.title}</h4><p>{change.description}</p></li>)}</ul>
                  </section>
                );
              })}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

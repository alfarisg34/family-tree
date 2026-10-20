import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { GitGraph, LayoutDashboard, Users, Images, LogOut, Plus, Pencil, ExternalLink, Link, Settings, Search } from 'lucide-react';
import { getAdminRedirect, useAdminSession } from '../hooks/useAdminSession';
import { useFamilyData } from '../hooks/useFamilyData';
import { loadFamilyCatalog } from '../utils/familyCatalog';
import { isDatabaseConfigured } from '../services/databaseService';
import { syncEntireTree } from '../services/databaseService';
import { updateFamilyMembers } from '../utils/updateFamilyMembers';
import type { FamilyData, FamilyMember } from '../types/family';
import { MemberFormModal } from './MemberFormModal';
import { TreeSettingsModal } from './TreeSettingsModal';
import './AdminArea.css';

interface AdminAreaProps {
  path: string;
  onNavigate: (path: string, replace?: boolean) => void;
}

export function AdminArea({ path, onNavigate }: AdminAreaProps) {
  const { isAdmin, isSessionReady, loginAdmin, logoutAdmin } = useAdminSession();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!isSessionReady) return;
    const redirect = getAdminRedirect(path, isAdmin);
    if (redirect) onNavigate(redirect, true);
  }, [isAdmin, isSessionReady, path, onNavigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setLoading(true);
    loadFamilyCatalog().then((data) => {
      if (active) { setFamilies(data); setError(''); }
    }).catch(() => {
      if (active) setError('Data keluarga tidak dapat dimuat. Silakan coba lagi.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin, revision]);

  const refresh = () => setRevision((value) => value + 1);
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoggingIn(true);
    if (!await loginAdmin(password)) setLoginError('Login gagal. Periksa kata sandi dan koneksi server.');
    else { setPassword(''); onNavigate('/admin', true); }
    setLoggingIn(false);
  };

  const createFamily = async (event: FormEvent) => {
    event.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(cleanSlug) || ['admin', 'manage', 'api'].includes(cleanSlug)) {
      setNotice('Gunakan alamat berupa huruf kecil, angka, tanda - atau _. Alamat admin dan manage tidak dapat digunakan.');
      return;
    }
    if (families.some((family) => family.slug === cleanSlug)) { setNotice('Alamat keluarga sudah digunakan.'); return; }
    const data: FamilyData = { slug: cleanSlug, familyTreeName: familyName.trim(), members: {}, updatedAt: new Date().toISOString() };
    if (!data.familyTreeName) return;
    setSaving(true);
    try {
      if (isDatabaseConfigured()) {
        const result = await syncEntireTree(data, cleanSlug);
        if (!result.success) throw new Error(result.message);
        data.treeId = result.treeId;
        data.id = result.treeId;
      }
      localStorage.setItem(`family_tree_data_${cleanSlug}`, JSON.stringify(data));
      setCreating(false); setFamilyName(''); setSlug(''); setSelectedSlug(cleanSlug); setNotice('Keluarga berhasil ditambahkan.'); refresh();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Gagal menyimpan keluarga.'); }
    finally { setSaving(false); }
  };

  const copyLink = async (familySlug: string) => {
    const url = `${window.location.origin}/${familySlug}`;
    try { await navigator.clipboard.writeText(url); setNotice('Tautan keluarga disalin. Bagikan kepada anggota keluarga.'); }
    catch { setNotice(`Salin tautan keluarga ini: ${url}`); }
  };

  if (!isSessionReady) return <main className="admin-page admin-login-page"><p role="status">Memeriksa sesi admin…</p></main>;
  if (!isAdmin) return (
    <main className="admin-page admin-login-page">
      <section className="admin-login-card">
        <GitGraph size={34} className="admin-gold" />
        <h1>Masuk admin</h1><p>Kelola data dan silsilah keluarga Anda.</p>
        <form onSubmit={handleLogin}>
          <label className="form-label" htmlFor="admin-password">Kata sandi admin</label>
          <input id="admin-password" className="form-input" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(event) => { setPassword(event.target.value); setLoginError(''); }} />
          {loginError && <p className="admin-error" role="alert">{loginError}</p>}
          <button className="btn-nav-primary" type="submit" disabled={loggingIn}>{loggingIn ? 'Memeriksa…' : 'Masuk ke dashboard'}</button>
        </form>
        <a href="/">Kembali ke beranda</a>
      </section>
    </main>
  );

  const members = families.flatMap((family) => Object.values(family.members));
  return (
    <div className="admin-page">
      <header className="admin-header">
        <a href="/" className="admin-brand"><GitGraph size={23} /> Silsilah Keluarga <span>Admin</span></a>
        <nav aria-label="Navigasi admin">
          <a href="/admin" aria-current={path === 'admin' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); onNavigate('/admin'); }}><LayoutDashboard size={16} /> Dashboard</a>
          <a href="/manage" aria-current={path === 'manage' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); onNavigate('/manage'); }}><Settings size={16} /> Kelola keluarga</a>
          <button className="btn-nav-glass" onClick={() => { void logoutAdmin().catch(() => setNotice('Logout gagal. Silakan coba lagi.')); }}><LogOut size={16} /> Keluar</button>
        </nav>
      </header>
      <main className="admin-content">
        <div className="admin-heading"><div><p className="admin-eyebrow">Ruang admin</p><h1>{path === 'manage' ? 'Kelola keluarga' : 'Dashboard keluarga'}</h1><p>{path === 'manage' ? 'Atur informasi keluarga, tambah anggota, dan bagikan tautan silsilah.' : 'Ringkasan data silsilah keluarga yang tersedia di aplikasi.'}</p></div><button className="btn-nav-glass" onClick={refresh} disabled={loading}>Muat ulang</button></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {loading && <p role="status">Memuat data keluarga…</p>}
        {!loading && path === 'admin' && <>
          <div className="admin-stats">
            {[{ icon: GitGraph, label: 'Keluarga', value: families.length }, { icon: Users, label: 'Anggota', value: members.length }, { icon: Images, label: 'Foto galeri', value: members.reduce((total, member) => total + (member.gallery?.length || 0), 0) }, { icon: Users, label: 'Anggota hidup', value: members.filter((member) => !member.isDeceased).length }].map(({ icon: Icon, label, value }) => <article key={label}><Icon size={22} /><strong>{value}</strong><span>{label}</span></article>)}
          </div>
          <p className="admin-data-note">Ringkasan menampilkan keluarga yang tersimpan di Neon dan data pada perangkat ini.</p>
        </>}
        {path === 'manage' && <div className="admin-toolbar"><h2>Daftar keluarga</h2><button className="btn-nav-primary" onClick={() => { setCreating(!creating); setNotice(''); }}><Plus size={16} /> Tambah keluarga</button></div>}
        {path === 'manage' && creating && <form className="admin-panel admin-create-form" onSubmit={createFamily}>
          <div className="form-group"><label className="form-label" htmlFor="family-name">Nama keluarga</label><input id="family-name" className="form-input" required value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Keluarga Besar Abdullah" /></div>
          <div className="form-group"><label className="form-label" htmlFor="family-slug">Alamat tautan keluarga</label><input id="family-slug" className="form-input" required value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="keluarga-abdullah" /><small>Alamat ini digunakan untuk tautan yang dibagikan kepada keluarga.</small></div>
          <button className="btn-nav-primary" type="submit" disabled={saving || loading}>{saving ? 'Menyimpan…' : 'Simpan keluarga'}</button>
        </form>}
        {!loading && <div className="admin-panel admin-table-scroll"><table className="admin-table"><thead><tr><th>Keluarga</th><th>Anggota</th><th>Generasi</th><th>Aksi</th></tr></thead><tbody>{families.map((family) => <tr key={family.slug}><td><strong>{family.familyTreeName}</strong><small>/{family.slug}</small></td><td>{Object.keys(family.members).length}</td><td>{new Set(Object.values(family.members).map((member) => member.generation)).size}</td><td><div className="admin-row-actions"><button className="btn-nav-glass" onClick={() => { setSelectedSlug(family.slug!); if (path !== 'manage') onNavigate('/manage'); }}><Pencil size={14} /> Kelola</button><button className="btn-nav-glass" onClick={() => copyLink(family.slug!)} aria-label={`Salin tautan ${family.familyTreeName}`}><Link size={14} /></button><a className="btn-nav-glass" href={`/${family.slug}`} aria-label={`Buka ${family.familyTreeName}`}><ExternalLink size={14} /></a></div></td></tr>)}</tbody></table>{families.length === 0 && <p>Belum ada keluarga. Tambahkan keluarga untuk memulai.</p>}</div>}
        {path === 'manage' && selectedSlug && <FamilyEditor key={selectedSlug} slug={selectedSlug} onChanged={refresh} />}
      </main>
    </div>
  );
}

function FamilyEditor({ slug, onChanged }: { slug: string; onChanged: () => void }) {
  const { familyData, isCloudSyncing, updateEntireFamilyData } = useFamilyData(slug);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const busy = saving || isCloudSyncing;
  const persist = async (nextData: FamilyData) => {
    setSaving(true); setStatus('Menyimpan perubahan…');
    try {
      if (isDatabaseConfigured()) {
        const result = await syncEntireTree(nextData, slug);
        if (!result.success) throw new Error(result.message);
        nextData = { ...nextData, id: result.treeId, treeId: result.treeId };
      }
      localStorage.setItem(`family_tree_data_${slug}`, JSON.stringify(nextData));
      updateEntireFamilyData(nextData, false);
      setStatus('Perubahan berhasil disimpan.'); onChanged();
    } catch (cause) { setStatus(`Perubahan belum tersimpan: ${cause instanceof Error ? cause.message : 'Terjadi kesalahan.'}`); }
    finally { setSaving(false); }
  };
  const members = Object.values(familyData.members).filter((member) => `${member.fullName} ${member.nickname || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-panel admin-editor" aria-label="Editor keluarga">
    <div className="admin-toolbar"><div><h2>{familyData.familyTreeName}</h2><p>{familyData.description || 'Kelola profil anggota dan hubungan keluarga.'}</p></div><div className="admin-row-actions"><button className="btn-nav-glass" disabled={busy} onClick={() => setSettingsOpen(true)}><Settings size={16} /> Informasi keluarga</button><button className="btn-nav-primary" disabled={busy} onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> Tambah anggota</button></div></div>
    {isCloudSyncing && <p role="status">Memuat data terbaru…</p>}
    {status && <p className="admin-notice" role="status">{status}</p>}
    <label className="admin-member-search"><Search size={17} /><input className="form-input" aria-label="Cari anggota keluarga" placeholder="Cari nama anggota…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <div className="admin-member-list">{members.map((member) => <div className="admin-member-row" key={member.id}><div><strong>{member.fullName}</strong><small>Generasi {member.generation} · {member.isDeceased ? 'Telah wafat' : 'Hidup'}</small></div><button className="btn-nav-glass" disabled={busy} onClick={() => { setEditing(member); setFormOpen(true); }}><Pencil size={14} /> Edit</button></div>)}{members.length === 0 && <p>{query ? 'Tidak ada anggota yang cocok.' : 'Belum ada anggota. Tambahkan anggota pertama keluarga ini.'}</p>}</div>
    <p className="admin-data-note">Perubahan anggota disimpan di perangkat ini dan disinkronkan jika Neon terhubung.</p>
    {settingsOpen && <TreeSettingsModal isOpen familyData={familyData} onSave={(metadata) => { void persist({ ...familyData, ...metadata, updatedAt: new Date().toISOString() }); }} onClose={() => setSettingsOpen(false)} />}
    {formOpen && <MemberFormModal initialMember={editing} familyData={familyData} onSave={(member, children) => { void persist(updateFamilyMembers(familyData, member, children)); }} onClose={() => setFormOpen(false)} />}
  </section>;
}

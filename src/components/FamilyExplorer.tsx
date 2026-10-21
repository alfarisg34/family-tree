import { useEffect, useMemo, useRef, useState } from 'react';
import { BookHeart, ChevronRight, Heart, HelpCircle, Maximize, Search, Users, X, MousePointer2, Move, ZoomIn } from 'lucide-react';
import type { FamilyData } from '../types/family';
import { getGenerationLabel } from '../utils/dateUtils';
import { MemberAvatar } from './MemberAvatar';
import './FamilyExplorer.css';

export function FamilyExplorer({ familyData, onSelectMember, onFit, loading }: {
  familyData: FamilyData; onSelectMember: (id: string) => void; onFit: () => void; loading: boolean;
}) {
  const [panel, setPanel] = useState<'members' | 'help' | null>(null);
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('all');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const members = useMemo(() => Object.values(familyData.members).sort((a, b) => a.fullName.localeCompare(b.fullName, 'id')), [familyData.members]);
  const generations = useMemo(() => [...new Set(members.map((member) => member.generation))].sort((a, b) => a - b), [members]);
  const filtered = members.filter((member) => (generation === 'all' || String(member.generation) === generation) && `${member.fullName} ${member.nickname || ''} ${member.residence || ''} ${member.occupation || ''}`.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id')));
  useEffect(() => {
    if (panel && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!panel) dialogRef.current?.close();
  }, [panel]);
  return <>
    <section className="family-explorer-toolbar" aria-label="Jelajahi keluarga">
      <div className="family-explorer-welcome"><span className="family-explorer-heart"><Heart size={18} /></span><div><strong>Setiap keluarga, sebuah cerita.</strong><p>{loading ? 'Memuat cerita keluarga…' : `${members.length} anggota · ${generations.length} generasi terhubung`}</p></div></div>
      <div className="family-explorer-actions">
        <button className="btn-nav-primary" onClick={() => setPanel('members')}><Users size={17} /><span>Daftar anggota</span></button>
        <button className="btn-nav-glass explorer-fit" onClick={onFit}><Maximize size={16} /><span>Lihat semua</span></button>
        <button className="btn-nav-glass explorer-help" aria-label="Cara menjelajahi silsilah" onClick={() => setPanel('help')}><HelpCircle size={19} /></button>
      </div>
    </section>
    {!loading && members.length === 0 && <div className="family-empty-state"><BookHeart size={38} /><h2>Cerita keluarga dimulai di sini</h2><p>Belum ada anggota yang ditambahkan. Admin keluarga dapat menambahkan anggota pertama melalui halaman pengelolaan.</p></div>}
    <dialog ref={dialogRef} className="family-explorer-dialog" aria-label={panel === 'members' ? 'Daftar anggota keluarga' : 'Panduan silsilah'} onCancel={() => setPanel(null)} onClose={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
      <div className="family-explorer-dialog-content">
        <header><div><p className="explorer-eyebrow">{panel === 'members' ? 'Lebih dekat dengan keluarga' : 'Mari berkenalan'}</p><h2>{panel === 'members' ? 'Temukan orang terkasih' : 'Jelajahi cerita keluarga'}</h2></div><button className="control-icon-btn" aria-label="Tutup" onClick={() => setPanel(null)}><X size={20} /></button></header>
        {panel === 'members' ? <>
          <div className="explorer-search"><Search size={19} /><input aria-label="Cari anggota" placeholder="Nama, panggilan, profesi, atau domisili…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />{query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={16} /></button>}</div>
          <div className="explorer-filter-row"><label htmlFor="explorer-generation">Generasi</label><select id="explorer-generation" value={generation} onChange={(event) => setGeneration(event.target.value)}><option value="all">Semua generasi</option>{generations.map((value) => <option key={value} value={value}>{getGenerationLabel(value, familyData.rootGenerationType)} · Generasi {value}</option>)}</select><span role="status">{filtered.length} anggota</span></div>
          <div className="explorer-member-list">{filtered.map((member) => <button key={member.id} className="explorer-member" onClick={() => { setPanel(null); onSelectMember(member.id); }}>
            <MemberAvatar name={member.fullName} src={member.thumbnail || member.avatar} />
            <span><strong>{member.fullName}</strong><small>{getGenerationLabel(member.generation, familyData.rootGenerationType)}{member.residence ? ` · ${member.residence}` : ''}{member.isDeceased ? ' · Dalam kenangan' : ''}</small></span><ChevronRight size={18} />
          </button>)}{filtered.length === 0 && <div className="explorer-no-results"><Search size={30} /><h3>Belum menemukan yang dicari</h3><p>Coba nama panggilan atau pilih generasi lain.</p><button className="btn-nav-glass" onClick={() => { setQuery(''); setGeneration('all'); }}>Tampilkan semua anggota</button></div>}</div>
          <p className="explorer-footnote">Pilih anggota untuk membaca profil dan mengenal hubungan keluarganya.</p>
        </> : <>
          <p className="explorer-help-intro">Mulai dari satu nama, lalu kenali keluarganya. Ada banyak cerita untuk ditemukan.</p>
          <div className="explorer-help-step"><Move /><div><h3>Geser untuk menjelajah</h3><p>Tarik area peta dengan mouse, atau geser dengan satu jari di ponsel.</p></div></div>
          <div className="explorer-help-step"><ZoomIn /><div><h3>Dekatkan untuk mengenal</h3><p>Gunakan tombol + dan −, gulir mouse, atau cubit dengan dua jari. Pilih kelompok anggota untuk membuka keluarganya.</p></div></div>
          <div className="explorer-help-step"><MousePointer2 /><div><h3>Ketuk foto, temukan ceritanya</h3><p>Baca profil, lihat kenangan, dan telusuri orang tua, pasangan, atau anak dari halaman profil.</p></div></div>
          <div className="explorer-help-legend"><span><i className="explorer-line marriage" /> Pasangan</span><span><i className="explorer-line child" /> Orang tua & anak</span><span><i className="explorer-line adopted" /> Anak angkat / asuh</span></div>
          <p className="explorer-footnote">Keyboard: F untuk melihat semua, + / − untuk zoom, dan Esc untuk menutup profil.</p>
          <button className="btn-nav-primary" onClick={() => setPanel(null)}>Siap menjelajah <Heart size={16} /></button>
        </>}
      </div>
    </dialog>
  </>;
}

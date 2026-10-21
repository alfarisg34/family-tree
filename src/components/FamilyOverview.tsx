import { ArrowLeft, ArrowRight, Map, Users } from 'lucide-react';
import type { ClusterNode, LayoutNode } from '../types/family';
import { MemberAvatar } from './MemberAvatar';
import './FamilyOverview.css';

export function FamilyOverview({ branches, individuals, branch, onOpenBranch, onSelectMember, onOpenMap, onBack }: {
  branches: ClusterNode[];
  individuals: LayoutNode[];
  branch: ClusterNode | null;
  onOpenBranch: (branch: ClusterNode) => void;
  onSelectMember: (id: string) => void;
  onOpenMap: () => void;
  onBack: () => void;
}) {
  const generations = branch ? [...new Set(branch.memberNodes.map(node => node.generation))].sort((a, b) => a - b) : [];
  return <section className="family-overview" aria-label={branch ? `Ringkasan ${branch.label}` : 'Ringkasan keluarga besar'}>
    <div className="overview-content">
      <div className="overview-heading">
        <div><p className="overview-eyebrow">{branch ? `${branch.count} anggota terhubung` : 'Keluarga besar'}</p>
          <h2>{branch ? branch.label : 'Kenali keluarga lebih dekat'}</h2>
          <p>{branch ? 'Pilih anggota untuk membaca profil, atau ikuti hubungannya di peta.' : 'Kenali leluhur, lalu pilih keluarga yang ingin dijelajahi.'}</p></div>
        <button className="overview-map-button" onClick={onOpenMap}><Map size={18} />{branch ? 'Lihat peta keluarga' : 'Jelajahi peta'}</button>
      </div>
      {branch ? <>
        <button className="overview-back" onClick={onBack}><ArrowLeft size={16} />Kembali ke overview</button>
        {generations.map(generation => <section className="overview-generation" key={generation} aria-label={`Generasi ${generation}`}>
          <h3>Generasi {generation}</h3>
          <div className="overview-members">{branch.memberNodes.filter(node => node.generation === generation).map(node => <button key={node.id} className="overview-person" onClick={() => onSelectMember(node.id)}>
            <MemberAvatar name={node.member.fullName} src={node.member.thumbnail || node.member.avatar} />
            <span><strong>{node.member.nickname || node.member.fullName}</strong><small>{node.member.fullName}</small></span><ArrowRight size={16} />
          </button>)}</div>
        </section>)}
      </> : <>
        {individuals.length > 0 && <section className="overview-ancestors" aria-label="Leluhur dan anggota lainnya">
          {individuals.map(node => <button className="overview-person" key={node.id} onClick={() => onSelectMember(node.id)}>
            <MemberAvatar name={node.member.fullName} src={node.member.thumbnail || node.member.avatar} />
            <span><strong>{node.member.fullName}</strong><small>{node.generation === 1 ? 'Leluhur keluarga' : `Generasi ${node.generation}`}</small></span><ArrowRight size={16} />
          </button>)}
        </section>}
        <div className="overview-branches">{branches.map(item => <button className="overview-branch" key={item.id} onClick={() => onOpenBranch(item)} aria-label={`Buka ${item.label}, ${item.count} anggota`}>
          <div className="overview-branch-top"><div className="overview-avatars">{item.memberNodes.slice(0, 3).map(node => <MemberAvatar key={node.id} name={node.member.fullName} src={node.member.thumbnail || node.member.avatar} />)}</div><span><Users size={14} />{item.count} anggota</span></div>
          <strong>{item.label}</strong>
          <span className="overview-branch-leader">{item.leaderNode.member.fullName}</span>
          <span className="overview-branch-action">Jelajahi keluarga<ArrowRight size={17} /></span>
        </button>)}</div>
      </>}
    </div>
  </section>;
}

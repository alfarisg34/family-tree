import { MemberAvatar } from './MemberAvatar';
import React, { useState, useMemo } from 'react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import {
  type FamilyMember,
  type FamilyData,
  formatMemberFullName
} from '../types/family';
import { PhotoCarousel } from './PhotoCarousel';
import { getAssociatedGalleryPhotos } from '../utils/gallery';
import { formatDateID, calculateAge, getGenerationLabel, getWhatsAppUrl } from '../utils/dateUtils';
import {
  X,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Home,
  Phone,
  Mail,
  Edit,
  Trash2,
  Flower2,
  User,
  MessageCircle,
  Baby,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DescendantItem {
  member: FamilyMember;
  parentName?: string;
  order: number;
}

interface DescendantGenerationGroup {
  level: number;
  label: string;
  items: DescendantItem[];
}

// Function to compute all descendants generation by generation in strict hierarchical birth order:
// 1. Children: ordered strictly by birth order (Anak 1, Anak 2, ...)
// 2. Grandchildren: ordered by children of Anak 1 first, then children of Anak 2, etc.
// 3. Great-grandchildren: ordered by grandchildren of Anak 1 first, etc.
const getDescendantsByLevel = (
  rootMemberId: string,
  membersMap: Record<string, FamilyMember>
): DescendantGenerationGroup[] => {
  const result: DescendantGenerationGroup[] = [];
  const visited = new Set<string>([rootMemberId]);

  const levelLabels = [
    'Anak',
    'Cucu',
    'Cicit',
    'Piut (Canggah)',
    'Anggas (Wareng)',
    'Udeg-udeg',
    'Gantung Siwur'
  ];

  // Helper to get ordered children of a parent node
  const getOrderedChildrenOfParent = (parentId: string, parentSpouseIds: string[] = []): FamilyMember[] => {
    const parentGroup = [parentId, ...parentSpouseIds];
    return Object.values(membersMap)
      .filter((m) => m.parentIds && m.parentIds.some((pId) => parentGroup.includes(pId)))
      .filter((m) => !visited.has(m.id))
      .sort((a, b) => (a.order || 1) - (b.order || 1));
  };

  const rootMember = membersMap[rootMemberId];
  const rootSpouseIds = rootMember?.spouses?.map((s) => s.spouseId) || [];

  // Level 1: Children of root member
  const initialChildren = getOrderedChildrenOfParent(rootMemberId, rootSpouseIds);
  let currentGenerationList: DescendantItem[] = initialChildren.map((c) => {
    visited.add(c.id);
    return {
      member: c,
      parentName: rootMember?.nickname || (rootMember?.fullName ? rootMember.fullName.split(' ')[0] : 'Orang Tua'),
      order: c.order || 1
    };
  });

  let level = 1;

  while (currentGenerationList.length > 0) {
    const label = level <= levelLabels.length
      ? levelLabels[level - 1]
      : `Keturunan Generasi ke-${level}`;

    result.push({
      level,
      label,
      items: [...currentGenerationList]
    });

    // Next Level: iterate through parents in strict hierarchy order (Anak 1 -> then Anak 2 -> etc.)
    const nextGenerationList: DescendantItem[] = [];

    currentGenerationList.forEach((parentItem) => {
      const p = parentItem.member;
      const spouseIds = (p.spouses || []).map((s) => s.spouseId);
      const childrenOfP = getOrderedChildrenOfParent(p.id, spouseIds);

      childrenOfP.forEach((child) => {
        visited.add(child.id);
        nextGenerationList.push({
          member: child,
          parentName: p.nickname || p.fullName.split(' ')[0],
          order: child.order || 1
        });
      });
    });

    currentGenerationList = nextGenerationList;
    level++;
  }

  return result;
};

interface MemberDetailModalProps {
  member: FamilyMember;
  familyData: FamilyData;
  isAdmin: boolean;
  onClose: () => void;
  onSelectMember: (memberId: string) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  familyData,
  isAdmin,
  onClose,
  onSelectMember,
  onEditMember,
  onDeleteMember
}) => {
  const [expandedDescendantLevel, setExpandedDescendantLevel] = useState<number | null>(null);
  const dialogRef = useAccessibleDialog(onClose);
  const isDeceased = member.isDeceased;
  const ageInfo = calculateAge(member.birthDate, member.isDeceased, member.passedDate);

  // Compute all descendants by generational level
  const descendantLevels = getDescendantsByLevel(member.id, familyData.members);
  const totalDescendantsCount = descendantLevels.reduce((sum, g) => sum + g.items.length, 0);

  // Find related family members
  const parents = (member.parentIds || [])
    .map((id) => familyData.members[id])
    .filter(Boolean);

  // Find spouses bidirectional
  const spousesWithDetailsMap = new Map<string, { member: FamilyMember; status: any; marriageDate?: string; divorceDate?: string }>();

  (member.spouses || []).forEach((sp) => {
    const mem = familyData.members[sp.spouseId];
    if (mem) {
      spousesWithDetailsMap.set(mem.id, {
        member: mem,
        status: sp.status,
        marriageDate: sp.marriageDate,
        divorceDate: sp.divorceDate
      });
    }
  });

  Object.values(familyData.members).forEach((other) => {
    if (other.id !== member.id && other.spouses) {
      const match = other.spouses.find((s) => s.spouseId === member.id);
      if (match && !spousesWithDetailsMap.has(other.id)) {
        spousesWithDetailsMap.set(other.id, {
          member: other,
          status: match.status,
          marriageDate: match.marriageDate,
          divorceDate: match.divorceDate
        });
      }
    }
  });

  const spousesWithDetails = Array.from(spousesWithDetailsMap.values());

  // Find siblings (same parents)
  const siblings = Object.values(familyData.members).filter((m) => {
    if (m.id === member.id) return false;
    if (!member.parentIds || member.parentIds.length === 0) return false;
    return m.parentIds && m.parentIds.some((pId) => member.parentIds.includes(pId));
  });

  // Find all photos associated with this member:
  // 1. Direct gallery photos uploaded for this member
  // 2. Photos uploaded by other members where this member is tagged
  const allAssociatedPhotos = useMemo(
    () => getAssociatedGalleryPhotos(member, familyData.members),
    [member, familyData.members]
  );

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data "${member.fullName}" dari pohon keluarga?`)) {
      onDeleteMember(member.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Profil ${member.fullName}`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {/* Header Hero Section */}
        <div className="modal-header-hero">
          <button className="modal-close-btn" onClick={onClose} title="Tutup Modal">
            <X size={18} />
          </button>

          <div className="modal-profile-header-content">
            <div className="modal-avatar-wrapper">
              <MemberAvatar src={member.avatar} name={member.fullName}
                className={`modal-avatar-img ${isDeceased ? 'is-deceased' : ''}`}
               />
            </div>

            {/* Name & Primary Badges */}
            <div className="modal-name-group">
              <h2 className="modal-full-name">
                {formatMemberFullName(member)}
              </h2>

              <div className="modal-nickname-title">
                {member.nickname && <span>Panggilan: "{member.nickname}"</span>}
                
                <span className="badge-tag-status generation">
                  {getGenerationLabel(member.generation, familyData.rootGenerationType)}
                </span>

                {isDeceased && (
                  <span className="badge-tag-status deceased">
                    🎗️ Almarhum / Almarhumah
                  </span>
                )}

                {member.relationshipToParents === 'adopted' && (
                  <span className="badge-tag-status adopted">
                    🌱 Anak Angkat
                  </span>
                )}

                {member.relationshipToParents === 'foster' && (
                  <span className="badge-tag-status adopted" style={{ borderColor: 'rgba(57, 124, 138, 0.4)', color: '#397c8a', background: 'rgba(57, 124, 138, 0.12)' }}>
                    🤝 Anak Asuh
                  </span>
                )}

                {member.relationshipToParents === 'step' && (
                  <span className="badge-tag-status adopted" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)' }}>
                    🌿 Anak Tiri
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">

          {/* Attributes Grid */}
          <div className="attributes-grid">
            {/* Tanggal & Tempat Lahir */}
            {(member.birthDate || member.birthPlace) && (
              <div className="attribute-item">
                <Calendar size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Kelahiran</div>
                  <div className="attribute-value">
                    {formatDateID(member.birthDate)}
                    {member.birthPlace ? ` (${member.birthPlace})` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Usia */}
            {ageInfo.ageText && (
              <div className="attribute-item">
                <User size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Usia</div>
                  <div className="attribute-value">{ageInfo.ageText}</div>
                </div>
              </div>
            )}

            {/* Status Wafat */}
            {isDeceased && (member.passedDate || member.passedPlace) && (
              <div className="attribute-item">
                <Flower2 size={18} className="attribute-icon" style={{ color: '#796b60' }} />
                <div>
                  <div className="attribute-label">Berpulang / Wafat</div>
                  <div className="attribute-value">
                    {formatDateID(member.passedDate)}
                    {member.passedPlace ? ` di ${member.passedPlace}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Tempat Pemakaman */}
            {isDeceased && member.burialPlace && (
              <div className="attribute-item">
                <MapPin size={18} className="attribute-icon" style={{ color: '#796b60' }} />
                <div>
                  <div className="attribute-label">Tempat Peristirahatan</div>
                  <div className="attribute-value">{member.burialPlace}</div>
                </div>
              </div>
            )}

            {/* Pendidikan */}
            {member.education && (
              <div className="attribute-item">
                <GraduationCap size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Pendidikan</div>
                  <div className="attribute-value">{member.education}</div>
                </div>
              </div>
            )}

            {/* Pekerjaan & Tempat Kerja */}
            {(member.occupation || member.workplace) && (
              <div className="attribute-item">
                <Briefcase size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Pekerjaan / Karir</div>
                  <div className="attribute-value">
                    {member.occupation}
                    {member.workplace ? ` - ${member.workplace}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Domisili */}
            {member.residence && (
              <div className="attribute-item">
                <Home size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Domisili</div>
                  <div className="attribute-value">{member.residence}</div>
                </div>
              </div>
            )}

            {/* Kontak Telepon & WhatsApp */}
            {member.phone && (
              <div className="attribute-item">
                <Phone size={18} className="attribute-icon" style={{ color: '#22c55e' }} />
                <div>
                  <div className="attribute-label">Kontak / WhatsApp</div>
                  <a
                    href={getWhatsAppUrl(member.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-direct-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      textDecoration: 'none',
                      marginTop: 2
                    }}
                    title={`Kirim pesan WhatsApp ke ${member.fullName}`}
                  >
                    <span className="attribute-value" style={{ color: '#3e3028', fontWeight: 700 }}>
                      {member.phone}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: 'rgba(34, 197, 94, 0.18)',
                        border: '1px solid rgba(34, 197, 94, 0.45)',
                        color: '#4ade80',
                        padding: '2px 9px',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontWeight: 600,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <MessageCircle size={13} /> Chat WA ↗
                    </span>
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {member.email && (
              <div className="attribute-item">
                <Mail size={18} className="attribute-icon" />
                <div>
                  <div className="attribute-label">Email</div>
                  <div className="attribute-value">{member.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Biografi */}
          {member.bio && (
            <div style={{ background: 'rgba(240, 228, 213, 0.3)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div className="attribute-label" style={{ marginBottom: 6 }}>Kisah Hidup & Biografi</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#58473d' }}>{member.bio}</p>
            </div>
          )}

          {/* Karosel Galeri Foto Kenangan & Foto Profil */}
          {(Boolean(member.avatar) || allAssociatedPhotos.length > 0) && (
            <div>
              <div className="attribute-label" style={{ marginBottom: 8 }}>
                {allAssociatedPhotos.length > 0
                  ? `Galeri Kenangan (${allAssociatedPhotos.length + (member.avatar ? 1 : 0)} Foto)`
                  : 'Dokumentasi Foto Profil (1 Foto)'}
              </div>
              <PhotoCarousel
                key={member.id}
                photos={allAssociatedPhotos}
                defaultAvatar={member.avatar}
                isDeceased={isDeceased}
                familyMembers={familyData.members}
                onSelectMember={onSelectMember}
              />
            </div>
          )}

          {/* Statistik Keturunan & Trah Keluarga (Anak, Cucu, Cicit, dst.) */}
          {totalDescendantsCount > 0 && (
            <div style={{ background: 'rgba(255, 253, 249, 0.65)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Sparkles size={15} /> Silsilah Keturunan ({totalDescendantsCount} Jiwa)
                </div>
                <span style={{ fontSize: 11, background: 'rgba(185, 95, 60, 0.15)', color: '#a14c30', border: '1px solid rgba(185, 95, 60, 0.3)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  {descendantLevels.length} Generasi ke Bawah
                </span>
              </div>

              {/* Quick Stat Badges Row */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, descendantLevels.length)}, 1fr)`, gap: 8, marginBottom: 14 }}>
                {descendantLevels.map((group) => {
                  const isExpanded = expandedDescendantLevel === group.level;
                  return (
                    <div
                      key={group.level}
                      onClick={() => setExpandedDescendantLevel(isExpanded ? null : group.level)}
                      style={{
                        background: isExpanded ? 'rgba(185, 95, 60, 0.2)' : 'rgba(240, 228, 213, 0.5)',
                        border: isExpanded ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isExpanded ? '0 0 12px rgba(185, 95, 60, 0.25)' : 'none'
                      }}
                      title={`Klik untuk melihat urutan silsilah ${group.label}`}
                    >
                      <div style={{ fontSize: 11, color: isExpanded ? '#a14c30' : 'var(--text-secondary)', fontWeight: 600 }}>
                        {group.label.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#3e3028', marginTop: 2 }}>
                        {group.items.length} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>Jiwa</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* List of Descendants per Generation with interactive chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {descendantLevels.map((group) => {
                  const isExpanded = expandedDescendantLevel === group.level || expandedDescendantLevel === null;
                  return (
                    <div
                      key={group.level}
                      style={{
                        background: 'rgba(240, 228, 213, 0.35)',
                        border: '1px solid rgba(123, 88, 61, 0.06)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px'
                      }}
                    >
                      <div
                        onClick={() => setExpandedDescendantLevel(expandedDescendantLevel === group.level ? -1 : group.level)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#3e3028' }}>
                          <Baby size={14} style={{ color: 'var(--accent-gold)' }} />
                          <span>{group.label}</span>
                          <span style={{ fontSize: 11, color: '#a14c30', fontWeight: 700 }}>
                            ({group.items.length} Orang)
                          </span>
                        </div>

                        <div style={{ color: 'var(--text-muted)' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                          {group.items.map(({ member: desc, parentName }, itemIdx) => (
                            <div
                              key={desc.id}
                              className="relation-chip"
                              onClick={() => onSelectMember(desc.id)}
                              title={`Lihat profil ${desc.fullName} (${group.level > 1 ? `Anak dari ${parentName}` : `Anak ke-${desc.order || itemIdx + 1}`})`}
                              style={{ padding: '4px 8px', background: 'rgba(255, 253, 249, 0.8)' }}
                            >
                              <MemberAvatar src={desc.avatar} name={desc.fullName} className="relation-chip-avatar"  />
                              <div>
                                <div className="relation-chip-name" style={{ fontSize: 11.5 }}>
                                  {desc.fullName} {desc.nickname ? `("${desc.nickname}")` : ''}
                                </div>
                                <div className="relation-chip-role" style={{ fontSize: 9.5 }}>
                                  {group.level > 1 && parentName ? (
                                    <span style={{ color: '#397c8a' }}>dr. {parentName} • </span>
                                  ) : null}
                                  <span style={{ color: desc.gender === 'female' ? '#b44c62' : '#0284c7' }}>
                                    {desc.gender === 'female' ? '♀' : '♂'}
                                  </span>
                                  {` Anak ke-${desc.order || itemIdx + 1}`}
                                  {group.level === 1 && (
                                    <span>
                                      {' · '}{desc.relationshipToParents === 'adopted'
                                        ? 'Anak Angkat'
                                        : desc.relationshipToParents === 'foster'
                                        ? 'Anak Asuh'
                                        : desc.relationshipToParents === 'step'
                                        ? 'Anak Tiri'
                                        : 'Anak Kandung'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hubungan Keluarga Langsung */}
          <div className="relations-group-box">
            {/* Orang Tua */}
            {parents.length > 0 && (
              <div>
                <div className="relations-category-title">Orang Tua:</div>
                <div className="relations-chips-row">
                  {parents.map((p) => (
                    <div
                      key={p.id}
                      className="relation-chip"
                      onClick={() => onSelectMember(p.id)}
                      title={`Lihat profil ${p.fullName}`}
                    >
                      <MemberAvatar src={p.avatar} name={p.fullName} className="relation-chip-avatar"  />
                      <div>
                        <div className="relation-chip-name">{p.fullName}</div>
                        <div className="relation-chip-role">
                          {p.gender === 'female' ? 'Ibu' : 'Ayah'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pasangan */}
            {spousesWithDetails.length > 0 && (
              <div>
                <div className="relations-category-title">Pasangan:</div>
                <div className="relations-chips-row">
                  {spousesWithDetails.map(({ member: sp, status, marriageDate, divorceDate }) => {
                    const isDiv = status === 'divorced' || status === 'separated';
                    return (
                      <div
                        key={sp.id}
                        className="relation-chip"
                        onClick={() => onSelectMember(sp.id)}
                        title={`Lihat profil ${sp.fullName}`}
                        style={isDiv ? { borderColor: '#b44c62' } : { borderColor: '#b95f3c' }}
                      >
                        <MemberAvatar src={sp.avatar} name={sp.fullName} className="relation-chip-avatar"  />
                        <div>
                          <div className="relation-chip-name">{sp.fullName}</div>
                          <div className="relation-chip-role">
                            {status === 'divorced'
                              ? `💔 Mantan ${sp.gender === 'female' ? 'Istri' : 'Suami'}${divorceDate ? ` (${divorceDate.split('-')[0]})` : ''}`
                              : status === 'separated'
                              ? `⚡ Berpisah (${sp.gender === 'female' ? 'Istri' : 'Suami'})`
                              : status === 'widowed'
                              ? `🎗️ ${sp.gender === 'female' ? 'Istri (Almarhumah)' : 'Suami (Almarhum)'}`
                              : `💍 ${sp.gender === 'female' ? 'Istri' : 'Suami'}${marriageDate ? ` (${marriageDate.split('-')[0]})` : ''}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Saudara Kandung */}
            {siblings.length > 0 && (
              <div>
                <div className="relations-category-title">Saudara Kandung:</div>
                <div className="relations-chips-row">
                  {siblings.map((sib) => (
                    <div
                      key={sib.id}
                      className="relation-chip"
                      onClick={() => onSelectMember(sib.id)}
                      title={`Lihat profil ${sib.fullName}`}
                    >
                      <MemberAvatar src={sib.avatar} name={sib.fullName} className="relation-chip-avatar"  />
                      <div>
                        <div className="relation-chip-name">{sib.fullName}</div>
                        <div className="relation-chip-role">Saudara</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Admin Edit & Delete Actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <button
                className="btn-nav-primary"
                onClick={() => {
                  onClose();
                  onEditMember(member);
                }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Edit size={16} /> Edit Data Anggota
              </button>

              <button
                className="btn-nav-glass"
                onClick={handleDelete}
                style={{ color: '#b74747', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                title="Hapus Anggota"
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

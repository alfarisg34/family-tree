import React from 'react';
import {
  type FamilyMember,
  type FamilyData,
  formatMemberFullName
} from '../types/family';
import { PhotoCarousel } from './PhotoCarousel';
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
  MessageCircle
} from 'lucide-react';

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
  const isDeceased = member.isDeceased;
  const isAdopted = member.relationshipToParents === 'adopted';
  const ageInfo = calculateAge(member.birthDate, member.isDeceased, member.passedDate);

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

  // Find children
  const children = Object.values(familyData.members).filter(
    (m) => m.parentIds && m.parentIds.includes(member.id)
  );

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data "${member.fullName}" dari pohon keluarga?`)) {
      onDeleteMember(member.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Hero Section */}
        <div className="modal-header-hero">
          <button className="modal-close-btn" onClick={onClose} title="Tutup Modal">
            <X size={18} />
          </button>

          <div className="modal-profile-overlap">
            <div className="modal-avatar-wrapper">
              <img
                src={member.avatar}
                alt={member.fullName}
                className={`modal-avatar-img ${isDeceased ? 'is-deceased' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Name & Primary Badges */}
          <div className="modal-name-group">
            <h2 className="modal-full-name">
              {formatMemberFullName(member)}
            </h2>

            <div className="modal-nickname-title">
              {member.nickname && <span>Panggilan: "{member.nickname}"</span>}
              
              <span className="badge-tag-status generation">
                {getGenerationLabel(member.generation)}
              </span>

              {isDeceased && (
                <span className="badge-tag-status deceased">
                  🎗️ Almarhum / Almarhumah
                </span>
              )}

              {isAdopted && (
                <span className="badge-tag-status adopted">
                  🌱 Anak Angkat
                </span>
              )}
            </div>
          </div>

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
                <Flower2 size={18} className="attribute-icon" style={{ color: '#94a3b8' }} />
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
                <MapPin size={18} className="attribute-icon" style={{ color: '#94a3b8' }} />
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
                    <span className="attribute-value" style={{ color: '#f8fafc', fontWeight: 700 }}>
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
            <div style={{ background: 'rgba(30, 41, 59, 0.3)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div className="attribute-label" style={{ marginBottom: 6 }}>Kisah Hidup & Biografi</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#e2e8f0' }}>{member.bio}</p>
            </div>
          )}

          {/* Karosel Galeri Foto Kenangan */}
          {member.gallery && member.gallery.length > 0 && (
            <div>
              <div className="attribute-label" style={{ marginBottom: 8 }}>
                Galeri Kenangan ({member.gallery.length + 1} Foto)
              </div>
              <PhotoCarousel
                photos={member.gallery}
                defaultAvatar={member.avatar}
                isDeceased={isDeceased}
              />
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
                      <img src={p.avatar} alt={p.fullName} className="relation-chip-avatar" />
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
                        style={isDiv ? { borderColor: '#f43f5e' } : { borderColor: '#f59e0b' }}
                      >
                        <img src={sp.avatar} alt={sp.fullName} className="relation-chip-avatar" />
                        <div>
                          <div className="relation-chip-name">{sp.fullName}</div>
                          <div className="relation-chip-role">
                            {status === 'divorced' || status === 'separated'
                              ? `💔 Mantan ${sp.gender === 'female' ? 'Istri' : 'Suami'}${divorceDate ? ` (${divorceDate.split('-')[0]})` : ''}`
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
                      <img src={sib.avatar} alt={sib.fullName} className="relation-chip-avatar" />
                      <div>
                        <div className="relation-chip-name">{sib.fullName}</div>
                        <div className="relation-chip-role">Saudara</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anak */}
            {children.length > 0 && (
              <div>
                <div className="relations-category-title">Keturunan / Anak:</div>
                <div className="relations-chips-row">
                  {children.map((ch) => (
                    <div
                      key={ch.id}
                      className="relation-chip"
                      onClick={() => onSelectMember(ch.id)}
                      title={`Lihat profil ${ch.fullName}`}
                    >
                      <img src={ch.avatar} alt={ch.fullName} className="relation-chip-avatar" />
                      <div>
                        <div className="relation-chip-name">{ch.fullName}</div>
                        <div className="relation-chip-role">
                          {ch.relationshipToParents === 'adopted' ? '🌱 Anak Angkat' : 'Anak Kandung'}
                        </div>
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
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
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

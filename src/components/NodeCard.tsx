import React from 'react';
import type { LayoutNode, LODLevel } from '../types/family';
import { getMemberAgeBadgeText, getGenerationLabel } from '../utils/dateUtils';
import { Plus, UserPlus, Heart } from 'lucide-react';

interface NodeCardProps {
  node: LayoutNode;
  lodLevel: LODLevel;
  viewportScale?: number;
  isMobile?: boolean;
  hasHiddenDescendants?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isAdmin?: boolean;
  onClick: (node: LayoutNode) => void;
  onQuickAdd?: (sourceNode: LayoutNode, direction: 'parent' | 'child' | 'spouse' | 'sibling') => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  lodLevel,
  viewportScale = 0.85,
  isMobile = false,
  hasHiddenDescendants = false,
  isSelected = false,
  isHighlighted = false,
  isAdmin = false,
  onClick,
  onQuickAdd
}) => {
  const member = node.member;
  const isDeceased = member.isDeceased;
  const isAdopted = member.relationshipToParents === 'adopted';

  const ageBadgeText = getMemberAgeBadgeText(member);

  // Dynamic scale compensation:
  // When zoomed out, node scales up to 2.1x so it maintains a prominent, clear, standard visual size on screen.
  // When zoomed in, node scales down to ~0.72x so all adjacent emerging nodes fit comfortably on screen.
  const adaptiveScale = React.useMemo(() => {
    const raw = 1 / Math.pow(viewportScale || 0.85, 0.68);
    const maxScale = isMobile ? 2.3 : 2.1;
    const minScale = isMobile ? 0.78 : 0.72;
    return Math.min(maxScale, Math.max(minScale, raw));
  }, [viewportScale, isMobile]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };

  return (
    <div
      className={`tree-node-wrapper zoom-tier-${lodLevel} ${isAdmin ? 'admin-mode' : ''} ${isSelected ? 'is-selected' : ''} ${isMobile ? 'is-mobile' : ''}`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        zIndex: isSelected ? 40 : isHighlighted ? 35 : 10
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Anggota keluarga: ${member.fullName}, Generasi ${member.generation}`}
    >
      <div
        className={`tree-node-card ${isSelected ? 'is-selected' : ''}`}
        style={{
          transform: isHighlighted 
            ? `scale(${adaptiveScale * 1.16})` 
            : `scale(${adaptiveScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Progressive disclosure indicator pill for descendants */}
        {(hasHiddenDescendants || (lodLevel === 'macro' && node.totalDescendants > 0)) && (
          <div className="node-descendant-pill" title={`${node.totalDescendants} Keturunan (Perbesar untuk melihat cabang)`}>
            +{node.totalDescendants}
          </div>
        )}

        {/* Circular Avatar Frame */}
        <div
          className={`avatar-frame ${isDeceased ? 'deceased' : ''} ${isAdopted ? 'adopted' : ''}`}
          style={{
            border: isHighlighted
              ? '3px solid #fbbf24'
              : isSelected
              ? '3px solid #38bdf8'
              : undefined,
            boxShadow: isHighlighted
              ? '0 0 25px rgba(245, 158, 11, 0.7)'
              : undefined
          }}
        >
          <img
            src={member.avatar}
            alt={member.fullName}
            className={`avatar-image-circle ${isDeceased ? 'is-deceased' : ''}`}
            loading="lazy"
          />

          {isDeceased && (
            <div className="badge-deceased-ribbon" title="Almarhum / Almarhumah">
              🎗️
            </div>
          )}

          {isAdopted && (
            <div className="badge-adopted-leaf" title="Anak Angkat">
              🌱
            </div>
          )}

          {member.gender && lodLevel !== 'macro' && (
            <div
              className={`badge-gender ${member.gender}`}
              title={member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
            >
              {member.gender === 'male' ? '♂' : '♀'}
            </div>
          )}
        </div>

        {/* Scale-Dependent Labels Box */}
        <div
          className="node-labels-box"
          style={{
            borderColor: isHighlighted
              ? 'var(--accent-gold)'
              : isSelected
              ? '#38bdf8'
              : undefined
          }}
        >
          {/* Primary Name (Shown across all tiers) */}
          <div className="node-primary-name" title={member.fullName}>
            {member.nickname || member.fullName.split(' ')[0]}
          </div>

          {/* Medium Tier: Show generation pill or age */}
          {lodLevel === 'medium' && (
            <div className="node-sub-info" style={{ fontSize: 9.5, opacity: 0.85 }}>
              {getGenerationLabel(node.generation)}
            </div>
          )}

          {/* Micro Tier: Rich progressive disclosure details */}
          {lodLevel === 'micro' && (
            <>
              <div className="node-sub-info" style={{ fontWeight: 600, color: '#e2e8f0' }}>
                {member.fullName}
              </div>
              {ageBadgeText && (
                <div className="node-sub-info" style={{ color: 'var(--text-gold)', fontWeight: 600 }}>
                  {ageBadgeText}
                </div>
              )}
              {member.occupation && (
                <div className="node-sub-info" style={{ fontSize: 9.5 }}>
                  {member.occupation}
                </div>
              )}
            </>
          )}
        </div>

        {/* 3 Quick Admin Add Action Buttons - available on hover or selection in admin mode */}
        {isAdmin && onQuickAdd && (
          <div
            className="node-quick-actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(node, 'parent');
              }}
              title="Tambah Orang Tua (Ke Atas)"
            >
              <Plus size={13} /> Ortu
            </button>
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(node, 'spouse');
              }}
              title="Tambah Pasangan (Horizontal)"
            >
              <Heart size={13} /> Pasangan
            </button>
            <button
              type="button"
              className="quick-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(node, 'child');
              }}
              title="Tambah Anak (Ke Bawah)"
            >
              <UserPlus size={13} /> Anak
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

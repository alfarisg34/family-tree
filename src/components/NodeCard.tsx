import React from 'react';
import type { LayoutNode, LODLevel } from '../types/family';
import { Plus, UserPlus, Heart } from 'lucide-react';

interface NodeCardProps {
  node: LayoutNode;
  lodLevel: LODLevel;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isAdmin?: boolean;
  onClick: (node: LayoutNode) => void;
  onQuickAdd?: (sourceNode: LayoutNode, direction: 'parent' | 'child' | 'spouse' | 'sibling') => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  lodLevel,
  isSelected = false,
  isHighlighted = false,
  isAdmin = false,
  onClick,
  onQuickAdd
}) => {
  const member = node.member;
  const isDeceased = member.isDeceased;
  const isAdopted = member.relationshipToParents === 'adopted';

  const birthYear = member.birthDate ? member.birthDate.split('-')[0] : '';
  const passedYear = member.passedDate ? member.passedDate.split('-')[0] : '';
  const yearText = birthYear ? (isDeceased ? `${birthYear} - ${passedYear || '†'}` : `l. ${birthYear}`) : '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };

  return (
    <div
      className="tree-node-wrapper"
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        zIndex: isSelected ? 40 : isHighlighted ? 35 : 10
      }}
      onClick={handleClick}
    >
      <div
        className={`tree-node-card ${isSelected ? 'is-selected' : ''}`}
        style={{
          transform: isHighlighted ? 'scale(1.18)' : undefined
        }}
      >
        {lodLevel === 'macro' && node.totalDescendants > 0 && (
          <div className="node-descendant-pill" title={`${node.totalDescendants} Keturunan`}>
            +{node.totalDescendants}
          </div>
        )}

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

          {lodLevel !== 'macro' && member.gender && (
            <div
              className={`badge-gender ${member.gender}`}
              title={member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
            >
              {member.gender === 'male' ? '♂' : '♀'}
            </div>
          )}
        </div>

        {lodLevel !== 'macro' && (
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
            <div className="node-primary-name" title={member.fullName}>
              {member.nickname || member.fullName.split(' ')[0]}
            </div>

            {lodLevel === 'micro' && (
              <>
                <div className="node-sub-info" style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {member.fullName}
                </div>
                {yearText && (
                  <div className="node-sub-info" style={{ color: 'var(--text-gold)' }}>
                    {yearText}
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
        )}

        {isAdmin && onQuickAdd && (
          <div className="node-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="quick-action-btn"
              onClick={() => onQuickAdd(node, 'parent')}
              title="Tambah Orang Tua (Ke Atas)"
            >
              <Plus size={12} /> Ortu
            </button>
            <button
              className="quick-action-btn"
              onClick={() => onQuickAdd(node, 'spouse')}
              title="Tambah Pasangan (Horizontal)"
            >
              <Heart size={12} /> Pasangan
            </button>
            <button
              className="quick-action-btn"
              onClick={() => onQuickAdd(node, 'child')}
              title="Tambah Anak (Ke Bawah)"
            >
              <UserPlus size={12} /> Anak
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

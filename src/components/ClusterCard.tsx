import React, { useState } from 'react';
import type { ClusterNode, ZoomTier } from '../types/family';
import { Users, ZoomIn, ChevronRight } from 'lucide-react';
import { getGenerationLabel } from '../utils/dateUtils';

interface ClusterCardProps {
  cluster: ClusterNode;
  zoomTier: ZoomTier;
  viewportScale: number;
  isMobile?: boolean;
  onClusterClick: (cluster: ClusterNode) => void;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  viewportScale,
  isMobile = false,
  onClusterClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const leader = cluster.leaderNode.member;

  // Scale compensation so cluster remains crisp and easily tappable/clickable across zoom levels
  const adaptiveScale = React.useMemo(() => {
    const raw = 1 / Math.pow(viewportScale || 0.5, 0.65);
    return Math.min(2.4, Math.max(0.85, raw));
  }, [viewportScale]);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onClusterClick(cluster);
  };

  // Stack of avatar previews (up to 3 distinct members)
  const previewMembers = cluster.memberNodes.slice(0, 3);
  const remainingCount = Math.max(0, cluster.count - 1);

  const genRangeText = cluster.generationSpread.minGen === cluster.generationSpread.maxGen
    ? getGenerationLabel(cluster.generationSpread.minGen)
    : `${getGenerationLabel(cluster.generationSpread.minGen)} - ${getGenerationLabel(cluster.generationSpread.maxGen)}`;

  return (
    <div
      className="tree-cluster-wrapper"
      style={{
        left: `${cluster.x}px`,
        top: `${cluster.y}px`,
        zIndex: isHovered ? 60 : 25
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Cluster ${cluster.label}: ${cluster.count} anggota keluarga. Klik untuk memperbesar.`}
    >
      <div
        className="tree-cluster-card"
        style={{
          transform: isHovered
            ? `scale(${adaptiveScale * 1.12})`
            : `scale(${adaptiveScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Pulsing Outer Aura */}
        <div className="cluster-aura-ring" />

        {/* Count Badge */}
        <div className="cluster-count-pill" title={`${cluster.count} Anggota Keluarga`}>
          <Users size={12} className="cluster-count-icon" />
          <span>{cluster.count}</span>
        </div>

        {/* Multi-Avatar Stack Visual */}
        <div className="cluster-avatar-stack">
          {previewMembers.map((node, idx) => (
            <div
              key={node.id}
              className={`cluster-avatar-item ${idx === 0 ? 'is-leader' : ''}`}
              style={{
                zIndex: 10 - idx,
                transform: `translateX(${(idx - (previewMembers.length - 1) / 2) * 16}px) scale(${1 - idx * 0.12})`
              }}
            >
              <img
                src={node.member.avatar}
                alt={node.member.fullName}
                className="cluster-avatar-img"
                loading="lazy"
              />
              {idx === 0 && (
                <div className="cluster-leader-crown" title="Leluhur Tertua di Kelompok Ini">
                  👑
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cluster Label Box */}
        <div className="cluster-labels-box">
          <div className="cluster-leader-name" title={leader.fullName}>
            {leader.nickname || leader.fullName.split(' ')[0]}
            {remainingCount > 0 && <span className="cluster-plus-count"> +{remainingCount}</span>}
          </div>

          <div className="cluster-gen-subtitle">
            {genRangeText}
          </div>

          <div className="cluster-expand-hint">
            <ZoomIn size={11} />
            <span>{isMobile ? 'Ketuk untuk Buka' : 'Klik untuk Perbesar'}</span>
          </div>
        </div>

        {/* Hover / Active Preview Tooltip */}
        {isHovered && !isMobile && (
          <div className="cluster-hover-tooltip" onClick={(e) => e.stopPropagation()}>
            <div className="cluster-tooltip-header">
              <div className="cluster-tooltip-title">
                {cluster.label}
              </div>
              <div className="cluster-tooltip-badge">
                {cluster.count} Jiwa
              </div>
            </div>

            <div className="cluster-tooltip-list">
              {cluster.memberNodes.slice(0, 5).map((node) => (
                <div key={node.id} className="cluster-tooltip-member-item">
                  <img
                    src={node.member.avatar}
                    alt={node.member.fullName}
                    className="cluster-tooltip-avatar"
                  />
                  <div className="cluster-tooltip-member-info">
                    <span className="cluster-tooltip-name">{node.member.fullName}</span>
                    <span className="cluster-tooltip-gen">{getGenerationLabel(node.generation)}</span>
                  </div>
                </div>
              ))}
              {cluster.memberNodes.length > 5 && (
                <div className="cluster-tooltip-more">
                  +{cluster.memberNodes.length - 5} anggota lainnya...
                </div>
              )}
            </div>

            <button
              type="button"
              className="cluster-tooltip-btn"
              onClick={handleClick}
            >
              <span>Perbesar & Tampilkan Semua</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

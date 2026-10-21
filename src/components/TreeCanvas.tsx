import React, { useMemo } from 'react';
import type { TreeLayout, LayoutNode, ClusterNode, LODLevel, ViewportState, RootGenerationType } from '../types/family';
import { NodeCard } from './NodeCard';
import { ClusterCard } from './ClusterCard';
import { computeClusteredTree } from '../utils/clusterEngine';

interface TreeCanvasProps {
  layout: TreeLayout;
  viewport: ViewportState;
  lodLevel: LODLevel;
  rootGenerationType?: RootGenerationType;
  containerWidth?: number;
  containerHeight?: number;
  isMobile?: boolean;
  expandAll?: boolean;
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  isAdmin: boolean;
  onNodeClick: (node: LayoutNode) => void;
  onClusterClick: (cluster: ClusterNode) => void;
  onQuickAdd: (sourceNode: LayoutNode, direction: 'parent' | 'child' | 'spouse' | 'sibling') => void;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  layout,
  viewport,
  lodLevel,
  rootGenerationType = 'buyut',
  containerWidth = 1200,
  containerHeight = 800,
  isMobile = false,
  expandAll = false,
  selectedNodeId,
  highlightedNodeId,
  isAdmin,
  onNodeClick,
  onClusterClick,
  onQuickAdd
}) => {
  const { nodes, edges, bounds, generationLevels } = layout;

  // Compute marker clustering & viewport distance culling (spatial virtualization)
  const { visibleClusters, visibleNodes, visibleEdges, zoomTier } = useMemo(() => {
    if (expandAll || Object.keys(nodes).length <= 12) {
      return { visibleClusters: [], visibleNodes: Object.values(nodes), visibleEdges: edges, zoomTier: 'medium' as const };
    }
    return computeClusteredTree({
      nodes,
      edges,
      viewport,
      containerWidth,
      containerHeight,
      isMobile
    });
  }, [nodes, edges, viewport, containerWidth, containerHeight, isMobile, expandAll]);

  // Generation levels visible in current bounds
  const visibleGenLevels = useMemo(() => {
    if (zoomTier === 'macro') {
      return generationLevels.filter((lvl) => lvl.generation <= 2);
    }
    return generationLevels;
  }, [generationLevels, zoomTier]);

  const compactGenerationLabels = isMobile || viewport.scale < 0.5;
  const smallGenerationLabels = viewport.scale < 0.16;
  const mobileGenerationOffset = Math.max(24, Math.min(66, viewport.scale * 80));

  const buildSvgPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <div
      className={`world-layer zoom-tier-${zoomTier} ${isMobile ? 'is-mobile' : ''}`}
      style={{
        transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
      }}
    >
      <svg
        className="tree-svg-layer"
        style={{
          width: bounds.width,
          height: bounds.height
        }}
      >
        <defs>
          <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Visible Culled & Cluster-Aware Edges */}
        {visibleEdges.map((edge) => {
          const pathD = buildSvgPath(edge.points);
          const isMarriageActive = edge.type === 'marriage-active';
          const isDivorced = edge.type === 'marriage-divorced';
          const isAdopted = edge.type === 'parent-child-adopted';

          return (
            <g key={edge.id} className="tree-edge-group">
              <path
                d={pathD}
                className={`tree-edge ${edge.type}`}
                filter={isMarriageActive ? 'url(#glow-gold)' : undefined}
              />

              {edge.midpoint && (isMarriageActive || isDivorced) && zoomTier !== 'macro' && (
                <g
                  transform={`translate(${edge.midpoint.x}, ${edge.midpoint.y})`}
                  className="edge-marker-icon"
                >
                  <circle
                    r="12"
                    fill="#fffdf9"
                    stroke={isDivorced ? '#b44c62' : '#b95f3c'}
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fill={isDivorced ? '#b44c62' : '#a14c30'}
                  >
                    {isDivorced ? '💔' : '💍'}
                  </text>
                </g>
              )}

              {edge.midpoint && isAdopted && zoomTier === 'micro' && (
                <g
                  transform={`translate(${edge.midpoint.x}, ${edge.midpoint.y})`}
                  className="edge-marker-icon"
                >
                  <circle
                    r="10"
                    fill="#042f2e"
                    stroke="#357e68"
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fill="#357e68"
                  >
                    🌱
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Horizontal Generation Level Subtle Guide Lines */}
        {visibleGenLevels.map((lvl) => (
          <line
            key={`lvl-line-${lvl.generation}`}
            x1={lvl.minX + 340}
            y1={lvl.y}
            x2={lvl.maxX + 80}
            y2={lvl.y}
            stroke="rgba(185, 95, 60, 0.12)"
            strokeDasharray="4,6"
            strokeWidth={1.5}
            className="tree-generation-line"
          />
        ))}
      </svg>

      {/* Generation Level Badges */}
      {visibleGenLevels.map((lvl) => (
        <div
          key={lvl.generation}
          className="generation-level-marker"
          aria-label={`${lvl.name}, ${lvl.count} anggota`}
          style={{
            top: `${isMobile ? lvl.y - mobileGenerationOffset / viewport.scale : lvl.y}px`,
            left: `${isMobile ? (8 - viewport.x) / viewport.scale : lvl.minX + 250}px`,
            transform: isMobile ? 'translateY(-50%)' : 'translate(-100%, -50%)'
          }}
        >
          <div className="generation-level-pill" style={{
            transform: `scale(${1 / viewport.scale})`,
            transformOrigin: isMobile ? 'left center' : 'right center',
            fontSize: smallGenerationLabels ? 10 : 11,
            lineHeight: smallGenerationLabels ? '12px' : '16px',
            padding: smallGenerationLabels ? '2px 6px' : '5px 10px',
            gap: smallGenerationLabels ? 4 : 8,
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#3e3028', fontWeight: 700 }}>
              {compactGenerationLabels
                ? lvl.name.split(' (')[0].replace('Generasi', smallGenerationLabels ? 'Gen' : 'Generasi')
                : lvl.name}
            </span>
            <span className="count" style={{ fontSize: 10, lineHeight: smallGenerationLabels ? '12px' : '14px', padding: '0 5px' }}>
              {lvl.count}{smallGenerationLabels ? '' : ' Anggota'}
            </span>
          </div>
        </div>
      ))}

      {/* Render Clustered Marker Nodes (Progressive Disclosure) */}
      {visibleClusters.map((cluster) => (
        <ClusterCard
          key={cluster.id}
          cluster={cluster}
          zoomTier={zoomTier}
          rootGenerationType={rootGenerationType}
          viewportScale={viewport.scale}
          isMobile={isMobile}
          onClusterClick={onClusterClick}
        />
      ))}

      {/* Render Visible Individual Nodes */}
      {visibleNodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          lodLevel={expandAll ? 'micro' : Object.keys(nodes).length <= 12 && lodLevel === 'macro' ? 'medium' : lodLevel}
          rootGenerationType={rootGenerationType}
          viewportScale={viewport.scale}
          isMobile={isMobile}
          isSelected={selectedNodeId === node.id}
          isHighlighted={highlightedNodeId === node.id}
          isAdmin={isAdmin}
          onClick={onNodeClick}
          onQuickAdd={onQuickAdd}
        />
      ))}
    </div>
  );
};

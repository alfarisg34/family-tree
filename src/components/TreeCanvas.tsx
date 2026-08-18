import React, { useMemo } from 'react';
import type { TreeLayout, LayoutNode, LODLevel, ViewportState } from '../types/family';
import { NodeCard } from './NodeCard';

interface TreeCanvasProps {
  layout: TreeLayout;
  viewport: ViewportState;
  lodLevel: LODLevel;
  maxVisibleGeneration?: number;
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  isAdmin: boolean;
  onNodeClick: (node: LayoutNode) => void;
  onQuickAdd: (sourceNode: LayoutNode, direction: 'parent' | 'child' | 'spouse' | 'sibling') => void;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  layout,
  viewport,
  lodLevel,
  maxVisibleGeneration = Infinity,
  selectedNodeId,
  highlightedNodeId,
  isAdmin,
  onNodeClick,
  onQuickAdd
}) => {
  const { nodes, edges, bounds, generationLevels } = layout;

  // Progressive Hierarchical Level of Detail:
  // Filter nodes & family lines based on maxVisibleGeneration
  const visibleNodes = useMemo(() => {
    const result: Record<string, LayoutNode> = {};
    Object.entries(nodes).forEach(([id, node]) => {
      if (node.generation <= maxVisibleGeneration) {
        result[id] = node;
      }
    });
    return result;
  }, [nodes, maxVisibleGeneration]);

  const visibleNodeIds = useMemo(() => new Set(Object.keys(visibleNodes)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter((edge) => {
      // Both source and target nodes must be visible at current zoom level
      return visibleNodeIds.has(edge.fromId) && visibleNodeIds.has(edge.toId);
    });
  }, [edges, visibleNodeIds]);

  const visibleGenLevels = useMemo(() => {
    return generationLevels.filter((lvl) => lvl.generation <= maxVisibleGeneration);
  }, [generationLevels, maxVisibleGeneration]);

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
      className="world-layer"
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

              {edge.midpoint && (isMarriageActive || isDivorced) && (
                <g
                  transform={`translate(${edge.midpoint.x}, ${edge.midpoint.y})`}
                  className="edge-marker-icon"
                >
                  <circle
                    r="12"
                    fill="#0f172a"
                    stroke={isDivorced ? '#f43f5e' : '#f59e0b'}
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fill={isDivorced ? '#f43f5e' : '#fbbf24'}
                  >
                    {isDivorced ? '💔' : '💍'}
                  </text>
                </g>
              )}

              {edge.midpoint && isAdopted && lodLevel !== 'macro' && (
                <g
                  transform={`translate(${edge.midpoint.x}, ${edge.midpoint.y})`}
                  className="edge-marker-icon"
                >
                  <circle
                    r="10"
                    fill="#042f2e"
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fill="#2dd4bf"
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
            stroke="rgba(245, 158, 11, 0.12)"
            strokeDasharray="4,6"
            strokeWidth={1.5}
            className="tree-generation-line"
          />
        ))}
      </svg>

      {/* Generation Level Badges (Aligned in Straight Vertical Column on Left) */}
      {visibleGenLevels.map((lvl) => (
        <div
          key={lvl.generation}
          className="generation-level-marker"
          style={{
            top: `${lvl.y}px`,
            left: `${lvl.minX}px`
          }}
        >
          <div className="generation-level-pill">
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{lvl.name}</span>
            <span className="count">{lvl.count} Anggota</span>
          </div>
        </div>
      ))}

      {/* Render Visible Nodes */}
      {Object.values(visibleNodes).map((node) => {
        const hasHiddenDescendants = node.totalDescendants > 0 && maxVisibleGeneration <= node.generation;

        return (
          <NodeCard
            key={node.id}
            node={node}
            lodLevel={lodLevel}
            viewportScale={viewport.scale}
            hasHiddenDescendants={hasHiddenDescendants}
            isSelected={selectedNodeId === node.id}
            isHighlighted={highlightedNodeId === node.id}
            isAdmin={isAdmin}
            onClick={onNodeClick}
            onQuickAdd={onQuickAdd}
          />
        );
      })}
    </div>
  );
};

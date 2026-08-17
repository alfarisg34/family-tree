import React from 'react';
import type { TreeLayout, LayoutNode, LODLevel, ViewportState } from '../types/family';
import { NodeCard } from './NodeCard';

interface TreeCanvasProps {
  layout: TreeLayout;
  viewport: ViewportState;
  lodLevel: LODLevel;
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
  selectedNodeId,
  highlightedNodeId,
  isAdmin,
  onNodeClick,
  onQuickAdd
}) => {
  const { nodes, edges, bounds, generationLevels } = layout;

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

        {edges.map((edge) => {
          const pathD = buildSvgPath(edge.points);
          const isMarriageActive = edge.type === 'marriage-active';
          const isDivorced = edge.type === 'marriage-divorced';
          const isAdopted = edge.type === 'parent-child-adopted';

          return (
            <g key={edge.id}>
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
      </svg>

      {generationLevels.map((lvl) => (
        <div
          key={lvl.generation}
          className="generation-level-marker"
          style={{ top: `${lvl.y}px` }}
        >
          <div className="generation-level-pill">
            <span>{lvl.name}</span>
            <span className="count">{lvl.count} Anggota</span>
          </div>
        </div>
      ))}

      {Object.values(nodes).map((node) => {
        const isVisibleInMacro = lodLevel !== 'macro' || node.isOldestGeneration || node.totalDescendants > 0;
        if (!isVisibleInMacro) return null;

        return (
          <NodeCard
            key={node.id}
            node={node}
            lodLevel={lodLevel}
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

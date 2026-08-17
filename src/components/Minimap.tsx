import React from 'react';
import type { TreeLayout, ViewportState } from '../types/family';
import { Compass } from 'lucide-react';

interface MinimapProps {
  layout: TreeLayout;
  viewport: ViewportState;
  onNavigate?: (worldX: number, worldY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ layout, viewport, onNavigate }) => {
  const { nodes, bounds } = layout;
  const mapW = 168;
  const mapH = 92;

  const minX = bounds.minX;
  const maxX = bounds.maxX;
  const minY = bounds.minY;
  const maxY = bounds.maxY;

  const worldW = Math.max(800, maxX - minX);
  const worldH = Math.max(600, maxY - minY);

  const scaleX = mapW / worldW;
  const scaleY = mapH / worldH;
  const mmScale = Math.min(scaleX, scaleY);

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  const vpWorldX = -viewport.x / viewport.scale;
  const vpWorldY = -viewport.y / viewport.scale;
  const vpWorldW = screenW / viewport.scale;
  const vpWorldH = screenH / viewport.scale;

  const vpMmX = Math.max(0, (vpWorldX - minX) * mmScale);
  const vpMmY = Math.max(0, (vpWorldY - minY) * mmScale);
  const vpMmW = Math.min(mapW, vpWorldW * mmScale);
  const vpMmH = Math.min(mapH, vpWorldH * mmScale);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = minX + clickX / mmScale;
    const targetWorldY = minY + clickY / mmScale;
    onNavigate(targetWorldX, targetWorldY);
  };

  return (
    <div className="minimap-panel">
      <div className="minimap-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Compass size={12} color="var(--accent-gold)" />
          <span>Radar Peta</span>
        </div>
        <span style={{ fontSize: 9 }}>{Object.keys(nodes).length} Jiwa</span>
      </div>

      <div className="minimap-canvas-box" onClick={handleMinimapClick} style={{ cursor: 'crosshair' }}>
        {Object.values(nodes).map((node) => {
          const dotX = (node.x - minX) * mmScale;
          const dotY = (node.y - minY) * mmScale;
          return (
            <div
              key={node.id}
              className={`minimap-dot ${node.member.isDeceased ? 'deceased' : ''}`}
              style={{
                left: `${dotX}px`,
                top: `${dotY}px`
              }}
            />
          );
        })}

        <div
          className="minimap-viewport-box"
          style={{
            left: `${vpMmX}px`,
            top: `${vpMmY}px`,
            width: `${Math.max(16, vpMmW)}px`,
            height: `${Math.max(12, vpMmH)}px`
          }}
        />
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import type { TreeLayout, ViewportState } from '../types/family';
import { Compass, ChevronDown } from 'lucide-react';

interface MinimapProps {
  layout: TreeLayout;
  viewport: ViewportState;
  containerSize: { width: number; height: number };
  onNavigate?: (worldX: number, worldY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ layout, viewport, containerSize, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const canvasBoxRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ width: 168, height: 92 });

  useEffect(() => {
    const updateSize = () => {
      if (canvasBoxRef.current) {
        const rect = canvasBoxRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setBoxSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isCollapsed]);

  const { nodes, bounds } = layout;
  const mapW = boxSize.width || 168;
  const mapH = boxSize.height || 92;

  const minX = bounds.minX;
  const maxX = bounds.maxX;
  const minY = bounds.minY;
  const maxY = bounds.maxY;

  const worldW = Math.max(800, maxX - minX);
  const worldH = Math.max(600, maxY - minY);

  const scaleX = mapW / worldW;
  const scaleY = mapH / worldH;
  const mmScale = Math.min(scaleX, scaleY);

  const screenW = containerSize.width;
  const screenH = containerSize.height;

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

  if (isCollapsed) {
    return (
      <button
        className="minimap-pill-btn"
        onClick={() => setIsCollapsed(false)}
        title="Buka Peta kecil Silsilah"
      >
        <Compass size={14} color="var(--accent-gold)" />
        <span>Peta kecil</span>
        <span className="minimap-pill-count">{Object.keys(nodes).length}</span>
      </button>
    );
  }

  return (
    <div className="minimap-panel">
      <button
        className="minimap-header"
        aria-label="Sembunyikan peta kecil"
        onClick={() => setIsCollapsed(true)}
        style={{ cursor: 'pointer' }}
        title="Klik untuk menyembunyikan Peta kecil"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Compass size={12} color="var(--accent-gold)" />
          <span>Peta kecil</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9.5 }}>{Object.keys(nodes).length} anggota</span>
          <ChevronDown size={12} color="var(--text-muted)" />
        </div>
      </button>

      <div
        ref={canvasBoxRef}
        className="minimap-canvas-box"
        onClick={handleMinimapClick}
        style={{ cursor: 'crosshair' }}
      >
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
            width: `${Math.max(14, vpMmW)}px`,
            height: `${Math.max(10, vpMmH)}px`
          }}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { Plus, Minus, Maximize, RotateCcw } from 'lucide-react';
import type { LODLevel } from '../types/family';

interface ControlsProps {
  scale: number;
  lodLevel: LODLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  scale,
  lodLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit
}) => {
  const getTierBadge = () => {
    switch (lodLevel) {
      case 'macro':
        return { label: 'Cluster Makro', icon: '🌐', color: 'var(--text-gold)' };
      case 'medium':
        return { label: 'Cabang Keluarga', icon: '🌿', color: '#38bdf8' };
      case 'micro':
        return { label: 'Detail Lengkap', icon: '🔍', color: '#2dd4bf' };
    }
  };

  const tier = getTierBadge();

  return (
    <div className="floating-controls-panel">
      {/* Zoom Mode / Tier Status Indicator */}
      <div className={`control-tier-indicator tier-${lodLevel}`} title={`Mode Tampilan: ${tier.label}`}>
        <span className="tier-indicator-dot" />
        <span className="tier-label">{tier.label}</span>
      </div>

      <div className="control-btn-group">
        <button
          className="control-icon-btn"
          onClick={onZoomIn}
          title="Perbesar Peta (Zoom In)"
          aria-label="Zoom In"
        >
          <Plus size={18} />
        </button>

        <div className="control-zoom-indicator">
          {Math.round(scale * 100)}%
        </div>

        <button
          className="control-icon-btn"
          onClick={onZoomOut}
          title="Perkecil Peta (Zoom Out)"
          aria-label="Zoom Out"
        >
          <Minus size={18} />
        </button>
      </div>

      <div className="control-btn-group">
        <button
          className="control-icon-btn"
          onClick={onFit}
          title="Sesuaikan dengan Layar (Fit View)"
          aria-label="Fit View"
        >
          <Maximize size={16} />
        </button>

        <button
          className="control-icon-btn"
          onClick={onReset}
          title="Posisikan ke Tengah (Reset)"
          aria-label="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

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
  onZoomIn,
  onZoomOut,
  onReset,
  onFit
}) => {
  return (
    <div className="floating-controls-panel">
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

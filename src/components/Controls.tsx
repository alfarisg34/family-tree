import { useEffect, useRef } from 'react';
import { Plus, Minus, Maximize, RotateCcw, MoreHorizontal, Users } from 'lucide-react';
import type { LODLevel } from '../types/family';
import './Controls.css';

interface ControlsProps {
  scale: number;
  lodLevel: LODLevel;
  minScale: number;
  maxScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onOverview: () => void;
}

export function Controls({ scale, lodLevel, minScale, maxScale, onZoomIn, onZoomOut, onReset, onFit, onOverview }: ControlsProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const atMinimum = scale <= minScale + 0.00001;
  const atMaximum = scale >= maxScale - 0.00001;
  const mode = { macro: 'Ringkasan keluarga', medium: 'Kelompok keluarga', micro: 'Anggota keluarga' }[lodLevel];
  const feedback = atMinimum ? 'Sudah paling jauh' : atMaximum ? 'Sudah paling dekat' : 'Geser peta untuk menjelajah';

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) menuRef.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);

  const runAction = (action: () => void) => {
    if (menuRef.current) menuRef.current.open = false;
    action();
  };

  return <div className="floating-controls-panel map-controls" role="group" aria-label="Kontrol peta">
    <div className={`map-control-status tier-${lodLevel}`} role="status" aria-live="polite" aria-atomic="true">
      <strong><i aria-hidden="true" />{mode}</strong><span>{feedback}</span>
    </div>
    <div className="map-control-actions">
      <div className="control-btn-group">
        <button className="control-icon-btn" onClick={onZoomIn} disabled={atMaximum} title={atMaximum ? 'Sudah paling dekat' : 'Perbesar peta'} aria-label="Perbesar peta"><Plus size={20} /></button>
        <div className="control-zoom-indicator" aria-label={`Zoom ${Math.round(scale * 100)} persen`}>{Math.round(scale * 100)}%</div>
        <button className="control-icon-btn" onClick={onZoomOut} disabled={atMinimum} title={atMinimum ? 'Sudah paling jauh' : 'Perkecil peta'} aria-label="Perkecil peta"><Minus size={20} /></button>
      </div>
      <button className="map-action-button map-fit-button" onClick={onFit} title="Muat seluruh anggota dalam peta ke layar" aria-label="Lihat seluruh keluarga"><Maximize size={18} /><span>Lihat semua</span></button>
      <button className="map-action-button map-reset-button" onClick={onReset} title="Pusatkan peta keluarga yang sedang dilihat pada zoom 85%" aria-label="Tengah peta, zoom 85 persen"><RotateCcw size={18} /><span>Tengah peta · 85%</span></button>
      <details ref={menuRef} className="map-options">
        <summary aria-label="Opsi peta" title="Opsi peta"><MoreHorizontal size={22} /></summary>
        <div className="map-options-menu" role="group" aria-label="Opsi peta lainnya">
          <button onClick={() => runAction(onReset)}><RotateCcw size={18} /><span>Tengah peta · 85%</span></button>
          <button onClick={() => runAction(onOverview)}><Users size={18} /><span>Ringkasan keluarga besar</span></button>
        </div>
      </details>
    </div>
  </div>;
}

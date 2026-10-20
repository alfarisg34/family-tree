import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const LegendPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`map-legend-drawer ${isOpen ? 'is-open' : 'is-collapsed'}`}
      style={{
        width: isOpen ? 270 : 'auto',
        cursor: isOpen ? 'default' : 'pointer'
      }}
      onClick={() => {
        if (!isOpen) setIsOpen(true);
      }}
    >
      <button
        className="map-legend-title"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={15} color="var(--accent-gold)" />
          <span className="legend-title-full">Panduan Garis & Simbol</span>
          <span className="legend-title-short">Panduan</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <div className="legend-items-list" style={{ marginTop: 6 }}>
          <div className="legend-item">
            <div className="legend-line-sample marriage" />
            <span>Pernikahan (Suami - Istri)</span>
          </div>

          <div className="legend-item">
            <div className="legend-line-sample divorced" />
            <span style={{ color: '#b74747' }}>Bercerai / Berpisah (Mantan)</span>
          </div>

          <div className="legend-item">
            <div className="legend-line-sample child-bio" />
            <span>Keturunan / Anak Kandung</span>
          </div>

          <div className="legend-item">
            <div className="legend-line-sample child-adopted" />
            <span style={{ color: '#357e68' }}>🌱 Anak Angkat / Asuh</span>
          </div>

          <div style={{ height: 1, background: 'var(--border-glass)', margin: '4px 0' }} />

          <div className="legend-item">
            <div className="legend-circle-sample alive" />
            <span>Anggota Masih Hidup</span>
          </div>

          <div className="legend-item">
            <div className="legend-circle-sample deceased" />
            <span style={{ color: '#756357' }}>🎗️ Foto Sepia: Sudah Wafat</span>
          </div>
        </div>
      )}
    </div>
  );
};

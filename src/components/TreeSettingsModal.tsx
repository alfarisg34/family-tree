import React, { useState } from 'react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import type { FamilyData, RootGenerationType } from '../types/family';
import { getGenerationLabel } from '../utils/dateUtils';
import { Settings, X, Save, Check } from 'lucide-react';

interface TreeSettingsModalProps {
  isOpen: boolean;
  familyData: FamilyData;
  onSave: (metadata: { familyTreeName: string; description?: string; rootGenerationType?: RootGenerationType }) => void;
  onClose: () => void;
}

export const TreeSettingsModal: React.FC<TreeSettingsModalProps> = ({
  isOpen,
  familyData,
  onSave,
  onClose
}) => {
  const [treeName, setTreeName] = useState(familyData.familyTreeName || '');
  const dialogRef = useAccessibleDialog(onClose);
  const [description, setDescription] = useState(familyData.description || '');
  const [rootGenType, setRootGenType] = useState<RootGenerationType>(familyData.rootGenerationType || 'buyut');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treeName.trim()) return;

    onSave({
      familyTreeName: treeName.trim(),
      description: description.trim(),
      rootGenerationType: rootGenType
    });
    onClose();
  };

  const generationPresets: Array<{
    type: RootGenerationType;
    title: string;
    description: string;
    sampleGen1: string;
    sampleGen2: string;
    sampleGen3: string;
  }> = [
    {
      type: 'gantungsiwur',
      title: '👑 Gantung Siwur (Trah Kuno / Leluhur Utama - 8-11 Generasi)',
      description: 'Cocok untuk silsilah trah keraton / dinasti leluhur 8+ generasi (Orang tua dari Udheg-Udheg).',
      sampleGen1: getGenerationLabel(1, 'gantungsiwur'),
      sampleGen2: getGenerationLabel(2, 'gantungsiwur'),
      sampleGen3: getGenerationLabel(3, 'gantungsiwur')
    },
    {
      type: 'udhegudheg',
      title: '🌿 Udheg-Udheg (3 Tingkat di Atas Buyut - 7-10 Generasi)',
      description: 'Cocok untuk silsilah keluarga besar 7+ generasi (Orang tua dari Wareng).',
      sampleGen1: getGenerationLabel(1, 'udhegudheg'),
      sampleGen2: getGenerationLabel(2, 'udhegudheg'),
      sampleGen3: getGenerationLabel(3, 'udhegudheg')
    },
    {
      type: 'wareng',
      title: '📜 Wareng / Baurekso (2 Tingkat di Atas Buyut - 6-9 Generasi)',
      description: 'Cocok untuk silsilah leluhur 6 generasi (Orang tua dari Canggah).',
      sampleGen1: getGenerationLabel(1, 'wareng'),
      sampleGen2: getGenerationLabel(2, 'wareng'),
      sampleGen3: getGenerationLabel(3, 'wareng')
    },
    {
      type: 'canggah',
      title: '🏛️ Canggah / Moyang (1 Tingkat di Atas Buyut - 5-8 Generasi)',
      description: 'Cocok jika generasi tertua yang didata adalah Eyang Canggah / Moyang (Orang tua dari Buyut).',
      sampleGen1: getGenerationLabel(1, 'canggah'),
      sampleGen2: getGenerationLabel(2, 'canggah'),
      sampleGen3: getGenerationLabel(3, 'canggah')
    },
    {
      type: 'buyut',
      title: '🌟 Buyut / Uyut (Standar Keluarga Besar - 4-7 Generasi)',
      description: 'Cocok untuk silsilah umum yang berawal dari Eyang Buyut / Uyut.',
      sampleGen1: getGenerationLabel(1, 'buyut'),
      sampleGen2: getGenerationLabel(2, 'buyut'),
      sampleGen3: getGenerationLabel(3, 'buyut')
    },
    {
      type: 'kakek',
      title: '👴 Kakek & Nenek (Keluarga Sedang - 3-5 Generasi)',
      description: 'Cocok jika generasi pertama yang didata adalah Kakek & Nenek.',
      sampleGen1: getGenerationLabel(1, 'kakek'),
      sampleGen2: getGenerationLabel(2, 'kakek'),
      sampleGen3: getGenerationLabel(3, 'kakek')
    },
    {
      type: 'orangtua',
      title: '👨‍👩‍👦 Orang Tua (Keluarga Inti / Nuklir - 2-3 Generasi)',
      description: 'Cocok untuk silsilah yang dimulai dari Ayah & Ibu (Orang Tua).',
      sampleGen1: getGenerationLabel(1, 'orangtua'),
      sampleGen2: getGenerationLabel(2, 'orangtua'),
      sampleGen3: getGenerationLabel(3, 'orangtua')
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content-card"
        ref={dialogRef} role="dialog" aria-modal="true" aria-label="Informasi keluarga" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: '92vw' }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(185, 95, 60, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)'
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#3e3028' }}>
                Pengaturan Silsilah Keluarga
              </h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Atur nama silsilah dan tingkat generasi tertua pohon ini
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            style={{ position: 'static' }}
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxHeight: 'calc(85vh - 90px)',
            overflowY: 'auto'
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="tree-name-input">
              Nama Pohon Silsilah Keluarga <span style={{ color: 'var(--accent-gold)' }}>*</span>
            </label>
            <input
              id="tree-name-input"
              type="text"
              className="form-input"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="Contoh: Keluarga Besar Bani Sukandi"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tree-desc-input">
              Deskripsi Singkat / Keterangan Silsilah
            </label>
            <textarea
              id="tree-desc-input"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Silsilah garis keturunan Bani Sukandi dari Sumedang"
              rows={2}
            />
          </div>

          {/* Root Generation Type Selector */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>Tingkat Generasi Tertua (Generasi 1)</span>
              <span style={{ fontSize: 11, color: 'var(--accent-gold)' }}>Pilih Sapaan Awal</span>
            </label>

            <div className="generation-preset-grid">
              {generationPresets.map((preset) => {
                const isSelected = rootGenType === preset.type;
                return (
                  <div
                    key={preset.type}
                    className={`generation-preset-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setRootGenType(preset.type)}
                  >
                    <div className="preset-header">
                      <div className="preset-title">{preset.title}</div>
                      {isSelected && <Check size={16} className="preset-check-icon" />}
                    </div>

                    <div className="preset-desc">{preset.description}</div>

                    <div className="preset-preview-pills">
                      <span className="preset-pill">
                        Gen 1: {preset.sampleGen1.split('(')[1]?.replace(')', '') || preset.sampleGen1}
                      </span>
                      <span className="preset-pill">
                        Gen 2: {preset.sampleGen2.split('(')[1]?.replace(')', '') || preset.sampleGen2}
                      </span>
                      <span className="preset-pill">
                        Gen 3: {preset.sampleGen3.split('(')[1]?.replace(')', '') || preset.sampleGen3}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions (Styled Buttons) */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 16,
              borderTop: '1px solid var(--border-glass)'
            }}
          >
            <button
              type="button"
              className="btn-nav-glass"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-nav-primary"
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              <Save size={15} />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

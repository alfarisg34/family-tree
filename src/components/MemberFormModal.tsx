import React, { useState, useRef } from 'react';
import {
  type FamilyMember,
  type FamilyData,
  type Gender,
  type ParentRelationType,
  type MarriageStatus,
  type SpouseRelation,
  type GalleryPhoto,
  formatMemberFullName
} from '../types/family';
import { uploadImageToSupabaseStorage } from '../services/supabaseService';
import { optimizeImage, formatBytes } from '../utils/imageOptimizer';
import { getWhatsAppUrl } from '../utils/dateUtils';
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Heart,
  Users,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Baby,
  ListOrdered,
  MessageCircle
} from 'lucide-react';

interface MemberFormModalProps {
  initialMember?: Partial<FamilyMember> | null;
  familyData: FamilyData;
  sourceNodeIdForRelation?: string;
  relationDirection?: 'parent' | 'child' | 'spouse' | 'sibling';
  onSave: (member: FamilyMember, reorderedChildren?: FamilyMember[]) => void;
  onClose: () => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  initialMember,
  familyData,
  sourceNodeIdForRelation,
  relationDirection,
  onSave,
  onClose
}) => {
  const isEditing = Boolean(initialMember?.id);
  const sourceMember = sourceNodeIdForRelation ? familyData.members[sourceNodeIdForRelation] : undefined;
  const allOtherMembers = Object.values(familyData.members).filter(
    (m) => m.id !== initialMember?.id
  );

  // Find all existing children of this member (when editing a parent)
  const initialChildren = isEditing && initialMember?.id
    ? Object.values(familyData.members)
        .filter((m) => m.parentIds && m.parentIds.includes(initialMember.id!))
        .sort((a, b) => (a.order || 1) - (b.order || 1))
    : [];

  // Find existing siblings (when adding a child to sourceMember)
  const existingSiblings = !isEditing && relationDirection === 'child' && sourceMember
    ? Object.values(familyData.members)
        .filter((m) => m.parentIds && m.parentIds.includes(sourceMember.id))
        .sort((a, b) => (a.order || 1) - (b.order || 1))
    : [];

  const defaultChildOrder = existingSiblings.length + 1;

  const [childrenList, setChildrenList] = useState<FamilyMember[]>(initialChildren);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  let defaultGen = initialMember?.generation || 1;
  let initialSpouses: SpouseRelation[] = initialMember?.spouses ? [...initialMember.spouses] : [];
  let initialParents: string[] = initialMember?.parentIds ? [...initialMember.parentIds] : [];
  let defaultGender: Gender = initialMember?.gender || 'male';
  let initialOrder = initialMember?.order || (relationDirection === 'child' ? defaultChildOrder : 1);

  if (!isEditing && sourceMember && relationDirection) {
    if (relationDirection === 'parent') {
      defaultGen = Math.max(1, sourceMember.generation - 1);
    } else if (relationDirection === 'child') {
      defaultGen = sourceMember.generation + 1;
      initialParents = [sourceMember.id];
      if (sourceMember.spouses && sourceMember.spouses.length > 0) {
        const activeSp = sourceMember.spouses.find(s => s.status === 'married') || sourceMember.spouses[0];
        if (activeSp) initialParents.push(activeSp.spouseId);
      }
    } else if (relationDirection === 'spouse') {
      defaultGen = sourceMember.generation;
      defaultGender = sourceMember.gender === 'male' ? 'female' : 'male';
      initialSpouses = [{
        spouseId: sourceMember.id,
        status: 'married'
      }];
    } else if (relationDirection === 'sibling') {
      defaultGen = sourceMember.generation;
      initialParents = [...(sourceMember.parentIds || [])];
    }
  }

  let initPrefix = initialMember?.titlePrefix ?? '';
  let initSuffix = initialMember?.titleSuffix ?? '';

  if (!initPrefix && !initSuffix && initialMember?.title) {
    const t = initialMember.title.trim();
    if (t.startsWith('S.') || t.startsWith('M.') || t.startsWith('Ph') || t.startsWith('B.')) {
      initSuffix = t;
    } else {
      initPrefix = t;
    }
  }

  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    id: initialMember?.id || 'mem-' + Date.now(),
    fullName: initialMember?.fullName || '',
    nickname: initialMember?.nickname || '',
    titlePrefix: initPrefix,
    titleSuffix: initSuffix,
    title: '',
    gender: defaultGender,
    generation: defaultGen,
    birthDate: initialMember?.birthDate || '',
    birthPlace: initialMember?.birthPlace || '',
    isDeceased: initialMember?.isDeceased || false,
    passedDate: initialMember?.passedDate || '',
    passedPlace: initialMember?.passedPlace || '',
    burialPlace: initialMember?.burialPlace || '',
    education: initialMember?.education || '',
    occupation: initialMember?.occupation || '',
    workplace: initialMember?.workplace || '',
    residence: initialMember?.residence || '',
    phone: initialMember?.phone || '',
    email: initialMember?.email || '',
    bio: initialMember?.bio || '',
    avatar: initialMember?.avatar || (defaultGender === 'female' 
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop'),
    parentIds: initialParents,
    relationshipToParents: initialMember?.relationshipToParents || 'biological',
    spouses: initialSpouses,
    order: initialOrder,
    gallery: initialMember?.gallery || []
  });

  const initFatherId = initialParents.find(id => familyData.members[id]?.gender === 'male') || '';
  const initMotherId = initialParents.find(id => familyData.members[id]?.gender === 'female') || '';

  const [selectedFatherId, setSelectedFatherId] = useState<string>(initFatherId);
  const [selectedMotherId, setSelectedMotherId] = useState<string>(initMotherId);

  const handleFatherChange = (newFatherId: string) => {
    setSelectedFatherId(newFatherId);
    const newParents = [newFatherId, selectedMotherId].filter(Boolean);
    setFormData(prev => ({
      ...prev,
      parentIds: newParents
    }));
  };

  const handleMotherChange = (newMotherId: string) => {
    setSelectedMotherId(newMotherId);
    const newParents = [selectedFatherId, newMotherId].filter(Boolean);
    setFormData(prev => ({
      ...prev,
      parentIds: newParents
    }));
  };

  const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Translate Indonesian relation titles
  const getRelationDirectionTitle = () => {
    switch (relationDirection) {
      case 'parent': return 'Orang Tua';
      case 'child': return 'Anak';
      case 'spouse': return 'Pasangan';
      case 'sibling': return 'Saudara Kandung';
      default: return 'Keluarga';
    }
  };

  // Automatic photo compression on device + Supabase Storage upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsOptimizing(true);
      setOptimizationStatus('Mengompresi foto & mengunggah ke Supabase...');

      const result = await optimizeImage(file, 600, 600, 0.82);
      
      const finalUrl = await uploadImageToSupabaseStorage(
        result.dataUrl,
        'avatars',
        formData.id || 'avatar'
      );
      
      setFormData((prev) => ({
        ...prev,
        avatar: finalUrl || result.dataUrl
      }));

      const isCloud = finalUrl && finalUrl.startsWith('http') && !finalUrl.startsWith('data:');
      setOptimizationStatus(
        `✓ Foto dioptimasi (${formatBytes(result.originalSize)} ➔ ${formatBytes(result.optimizedSize)}) ${isCloud ? '• Tersimpan di Supabase Storage' : ''}`
      );
    } catch (err) {
      console.error(err);
      setOptimizationStatus('Gagal memproses foto');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsOptimizing(true);
      setOptimizationStatus('Mengompresi foto galeri & mengunggah...');

      const newPhotos: GalleryPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await optimizeImage(file, 1000, 1000, 0.82);
        const photoId = 'photo-' + Date.now() + '-' + i;
        const uploadedUrl = await uploadImageToSupabaseStorage(res.dataUrl, 'gallery', photoId);

        newPhotos.push({
          id: photoId,
          url: uploadedUrl || res.dataUrl,
          caption: 'Foto Kenangan',
          date: '' // Kosong secara default, bisa diisi oleh admin
        });
      }

      setFormData((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...newPhotos]
      }));

      setOptimizationStatus(`✓ Berhasil menambahkan ${newPhotos.length} foto galeri!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUpdateGalleryPhoto = (photoId: string, field: 'caption' | 'date', value: string) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((p) =>
        p.id === photoId ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleRemoveGalleryPhoto = (photoId: string) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((p) => p.id !== photoId)
    }));
  };

  // Spouse Management
  const handleAddSpouse = () => {
    const availableSpouse = allOtherMembers.find(
      (m) => !(formData.spouses || []).some((s) => s.spouseId === m.id)
    );
    if (!availableSpouse) {
      alert('Tidak ada anggota keluarga lain yang tersedia untuk dipilih sebagai pasangan.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      spouses: [
        ...(prev.spouses || []),
        {
          spouseId: availableSpouse.id,
          status: 'married'
        }
      ]
    }));
  };

  const handleUpdateSpouse = (index: number, field: keyof SpouseRelation, value: any) => {
    setFormData((prev) => {
      const updated = [...(prev.spouses || [])];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return {
        ...prev,
        spouses: updated
      };
    });
  };

  const handleRemoveSpouse = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      spouses: (prev.spouses || []).filter((_, i) => i !== index)
    }));
  };

  // Children Drag & Drop Handlers (When editing a parent)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const reordered = [...childrenList];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, movedItem);
    setDraggedIndex(index);
    setChildrenList(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveChild = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= childrenList.length) return;
    const reordered = [...childrenList];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setChildrenList(reordered);
  };

  const getChildOrderLabel = (index: number, total: number) => {
    if (index === 0) return 'Anak ke-1 (Sulung)';
    if (index === total - 1 && total > 1) return `Anak ke-${index + 1} (Bungsu)`;
    return `Anak ke-${index + 1}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || formData.fullName.trim() === '') {
      alert('Mohon isi nama lengkap anggota keluarga.');
      return;
    }

    const payloadToSave: FamilyMember = {
      ...(formData as FamilyMember),
      titlePrefix: formData.titlePrefix?.trim() || '',
      titleSuffix: formData.titleSuffix?.trim() || '',
      title: ''
    };

    onSave(payloadToSave, childrenList);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isEditing
                ? `Edit Data: ${formData.fullName}`
                : relationDirection && sourceMember
                ? `Tambah ${getRelationDirectionTitle()} dari ${sourceMember.fullName}`
                : 'Tambah Anggota Keluarga Baru'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Lengkapi informasi profil, silsilah garis keluarga, pasangan, dan urutan kelahiran.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Foto Profil & Optimisasi Box */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
              <img
                src={formData.avatar}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  filter: formData.isDeceased ? 'var(--sepia-filter)' : undefined,
                  border: '2px solid var(--accent-gold)'
                }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Foto Profil Utama (Otomatis Dioptimasi & Dikompresi)
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-nav-glass"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOptimizing}
                >
                  <Upload size={14} /> Pilih Foto dari Perangkat
                </button>

                <input
                  type="text"
                  placeholder="Atau masukkan URL foto..."
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="form-input"
                  style={{ flex: 1, minWidth: 180, padding: '6px 10px', fontSize: 12 }}
                />
              </div>

              {optimizationStatus && (
                <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {optimizationStatus}
                </div>
              )}
            </div>
          </div>

          {/* 1. Informasi Pokok & Gelar */}
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Alfari Sidnan Ghilmana"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Gelar Depan</label>
              <input
                type="text"
                placeholder="Contoh: Dr. / Hj. / R.M. / Prof. / Ir."
                value={formData.titlePrefix || ''}
                onChange={(e) => setFormData({ ...formData, titlePrefix: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gelar Belakang</label>
              <input
                type="text"
                placeholder="Contoh: S.Kom. / M.T. / Ph.D. / S.T."
                value={formData.titleSuffix || ''}
                onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Live Preview Format Nama Resmi */}
          {formData.fullName && (
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Format Tampilan Nama Resmi:</span>
              <span style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: 13.5 }}>
                {formatMemberFullName(formData)}
              </span>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nama Panggilan / Alias</label>
              <input
                type="text"
                placeholder="Contoh: Kakang / Mani / Papap"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-grid-2" style={{ gap: 8 }}>
              <div className="form-group">
                <label className="form-label">Jenis Kelamin</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="form-select"
                >
                  <option value="male">Laki-laki (♂)</option>
                  <option value="female">Perempuan (♀)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Generasi</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.generation}
                  onChange={(e) => setFormData({ ...formData, generation: parseInt(e.target.value) || 1 })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* 2. Hubungan Pasangan (Suami / Istri / Mantan) */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={15} /> Pasangan (Suami / Istri / Mantan)
              </div>
              <button
                type="button"
                className="btn-nav-glass"
                onClick={handleAddSpouse}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                <Plus size={12} /> Tambah Pasangan
              </button>
            </div>

            {(!formData.spouses || formData.spouses.length === 0) ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Belum ada pasangan yang dihubungkan. Klik "Tambah Pasangan" di atas untuk menghubungkan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {formData.spouses.map((sp, idx) => {
                  const isDiv = sp.status === 'divorced' || sp.status === 'separated';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        background: 'rgba(15, 23, 42, 0.65)',
                        padding: 12,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-glass)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Pilih Pasangan */}
                        <div style={{ flex: 2 }}>
                          <select
                            value={sp.spouseId}
                            onChange={(e) => handleUpdateSpouse(idx, 'spouseId', e.target.value)}
                            className="form-select"
                            style={{ width: '100%', fontSize: 12.5 }}
                          >
                            {allOtherMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName} ({m.gender === 'female' ? 'Perempuan' : 'Laki-laki'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status Hubungan */}
                        <div style={{ flex: 1.5 }}>
                          <select
                            value={sp.status}
                            onChange={(e) => handleUpdateSpouse(idx, 'status', e.target.value as MarriageStatus)}
                            className="form-select"
                            style={{ width: '100%', fontSize: 12.5 }}
                          >
                            <option value="married">💍 Menikah</option>
                            <option value="divorced">💔 Bercerai</option>
                            <option value="separated">Berpisah</option>
                            <option value="widowed">Pasangan Wafat</option>
                          </select>
                        </div>

                        {/* Hapus Pasangan Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSpouse(idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            borderRadius: 'var(--radius-sm)',
                            padding: '7px 9px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Relasi Pasangan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Input Tahun / Tanggal Pernikahan atau Perceraian */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, paddingTop: 4, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isDiv ? '💔 Tahun / Tanggal Perceraian (Opsional):' : '💍 Tahun / Tanggal Pernikahan (Opsional):'}
                          </label>
                          <input
                            type="text"
                            placeholder={isDiv ? "Contoh: 2021 / 15 Mei 2021" : "Contoh: 2020 / 12 Desember 2020"}
                            value={isDiv ? (sp.divorceDate || '') : (sp.marriageDate || '')}
                            onChange={(e) => handleUpdateSpouse(idx, isDiv ? 'divorceDate' : 'marriageDate', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Status Kehidupan (Hidup / Wafat) */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label className="form-label" style={{ margin: 0, color: 'var(--text-gold)', fontWeight: 700 }}>
                Status Keberadaan
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.isDeceased}
                  onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ color: formData.isDeceased ? '#cbd5e1' : '#10b981', fontWeight: 600 }}>
                  {formData.isDeceased ? '🎗️ Sudah Wafat (Almarhum / Almarhumah)' : '🌿 Masih Hidup'}
                </span>
              </label>
            </div>

            {formData.isDeceased && (
              <div className="form-grid-2" style={{ marginTop: 10 }}>
                <div className="form-group">
                  <label className="form-label">Tanggal Wafat</label>
                  <input
                    type="date"
                    value={formData.passedDate}
                    onChange={(e) => setFormData({ ...formData, passedDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tempat Wafat & Pemakaman</label>
                  <input
                    type="text"
                    placeholder="Contoh: TPU Tanah Kusir / Kotagede"
                    value={formData.burialPlace}
                    onChange={(e) => setFormData({ ...formData, burialPlace: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Garis Silsilah & Hubungan Orang Tua */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-gold)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={15} /> Hubungan Orang Tua (Ayah & Ibu)
            </div>

            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              {/* Pilihan Ayah */}
              <div className="form-group">
                <label className="form-label">Ayah Kandung / Angkat</label>
                <select
                  value={selectedFatherId}
                  onChange={(e) => handleFatherChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Tidak Ada / Belum Ditentukan --</option>
                  {allOtherMembers
                    .filter((m) => m.gender === 'male')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.nickname ? `("${m.nickname}")` : ''} (Gen {m.generation || 1})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pilihan Ibu */}
              <div className="form-group">
                <label className="form-label">Ibu Kandung / Angkat</label>
                <select
                  value={selectedMotherId}
                  onChange={(e) => handleMotherChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Tidak Ada / Belum Ditentukan --</option>
                  {allOtherMembers
                    .filter((m) => m.gender === 'female')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.nickname ? `("${m.nickname}")` : ''} (Gen {m.generation || 1})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Tipe Hubungan ke Orang Tua</label>
                <select
                  value={formData.relationshipToParents}
                  onChange={(e) => setFormData({ ...formData, relationshipToParents: e.target.value as ParentRelationType })}
                  className="form-select"
                >
                  <option value="biological">Anak Kandung (Garis Solid)</option>
                  <option value="adopted">🌱 Anak Angkat (Garis Putus-putus Cyan)</option>
                  <option value="foster">Anak Asuh</option>
                  <option value="step">Anak Tiri</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urutan Kelahiran (Anak ke-)</label>
                {existingSiblings.length > 0 ? (
                  <select
                    value={formData.order || defaultChildOrder}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="form-select"
                    style={{ borderColor: 'var(--accent-gold)', fontWeight: 600 }}
                  >
                    <option value={existingSiblings.length + 1}>
                      Anak ke-{existingSiblings.length + 1} (Bungsu / Termuda)
                    </option>
                    <option value={1}>
                      Anak ke-1 (Sulung) — Sebelum {existingSiblings[0].nickname || existingSiblings[0].fullName.split(' ')[0]}
                    </option>
                    {existingSiblings.slice(0, -1).map((sib, i) => (
                      <option key={sib.id} value={i + 2}>
                        Anak ke-{i + 2} — Setelah {sib.nickname || sib.fullName.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={1}
                    placeholder="1 = Sulung, 2 = Kedua, dst."
                    value={formData.order || 1}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="form-input"
                  />
                )}
              </div>
            </div>

            {/* Smart Siblings Placement Preview when adding a child */}
            {!isEditing && relationDirection === 'child' && existingSiblings.length > 0 && (
              <div style={{ marginTop: 14, background: 'rgba(15, 23, 42, 0.65)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ListOrdered size={14} /> Preview Urutan Saudara Kandung dari {sourceMember?.fullName}:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                  {(() => {
                    const currentChosenOrder = formData.order || defaultChildOrder;
                    const items: { label: string; name: string; isNew?: boolean }[] = [];
                    let newInserted = false;

                    existingSiblings.forEach((sib, idx) => {
                      const pos = idx + 1;
                      if (!newInserted && currentChosenOrder === pos) {
                        items.push({
                          label: `✨ Anak ke-${currentChosenOrder}`,
                          name: `[ ${formData.fullName || 'Calon Anak Baru Ini'} ]`,
                          isNew: true
                        });
                        newInserted = true;
                      }
                      items.push({
                        label: `Anak ke-${items.length + 1}`,
                        name: sib.fullName + (sib.nickname ? ` ("${sib.nickname}")` : '')
                      });
                    });

                    if (!newInserted) {
                      items.push({
                        label: `✨ Anak ke-${items.length + 1} (Bungsu)`,
                        name: `[ ${formData.fullName || 'Calon Anak Baru Ini'} ]`,
                        isNew: true
                      });
                    }

                    return items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '3px 6px',
                          borderRadius: 4,
                          background: item.isNew ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          color: item.isNew ? '#fbbf24' : '#94a3b8',
                          fontWeight: item.isNew ? 700 : 500
                        }}
                      >
                        <span style={{ width: 130 }}>{item.label}:</span>
                        <span>{item.name}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 5. Daftar & Urutan Kelahiran Anak (Ketika Edit Profil Orang Tua yang Sudah Punya Anak) */}
          {childrenList.length > 0 && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: 18, borderRadius: 'var(--radius-md)', border: '1.5px solid rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Baby size={16} /> Urutan Kelahiran & Mapping Pasangan Anak ({childrenList.length} Anak)
                </div>
                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                  ✨ Drag & Drop untuk Mengatur Urutan
                </span>
              </div>
              
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Tarik dan geser posisi anak untuk mengatur urutan kelahiran, serta tentukan pasangan mana yang menjadi orang tua kandung dari masing-masing anak.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {childrenList.map((child, index) => {
                  const isDraggingThis = draggedIndex === index;
                  return (
                    <div
                      key={child.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: isDraggingThis ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.75)',
                        border: isDraggingThis ? '2px dashed var(--accent-gold)' : '1px solid var(--border-glass)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'grab',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {/* Drag Handle */}
                      <div style={{ color: 'var(--text-gold)', display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                        <GripVertical size={16} />
                      </div>

                      {/* Avatar */}
                      <img
                        src={child.avatar}
                        alt={child.fullName}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid var(--accent-gold)'
                        }}
                      />

                      {/* Info & Badge */}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {child.fullName}
                          </span>
                          {child.nickname && (
                            <span style={{ fontSize: 11.5, color: 'var(--text-gold)' }}>
                              ("{child.nickname}")
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                          <span style={{ color: child.gender === 'female' ? '#f43f5e' : '#0284c7', fontWeight: 600 }}>
                            {child.gender === 'female' ? '♀ Perempuan' : '♂ Laki-laki'}
                          </span>
                          <span>•</span>
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                            {getChildOrderLabel(index, childrenList.length)}
                          </span>
                        </div>

                        {/* Mapping Pasangan Orang Tua untuk Anak Ini */}
                        {formData.spouses && formData.spouses.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {formData.gender === 'female' ? 'Ayah:' : 'Ibu:'}
                            </span>
                            <select
                              value={(() => {
                                const spouseIds = formData.spouses?.map((s) => s.spouseId) || [];
                                const matched = child.parentIds?.find((pId) => spouseIds.includes(pId));
                                return matched || '';
                              })()}
                              onChange={(e) => {
                                const chosenSpouseId = e.target.value;
                                const remainingParents = (child.parentIds || []).filter(
                                  (pId) => pId !== formData.id && !(formData.spouses || []).some((s) => s.spouseId === pId)
                                );
                                const newParentIds = [formData.id!];
                                if (chosenSpouseId) newParentIds.push(chosenSpouseId);
                                remainingParents.forEach((pId) => {
                                  if (!newParentIds.includes(pId)) newParentIds.push(pId);
                                });

                                const updated = [...childrenList];
                                updated[index] = {
                                  ...updated[index],
                                  parentIds: newParentIds
                                };
                                setChildrenList(updated);
                              }}
                              className="form-select"
                              style={{ fontSize: 11.5, padding: '2px 8px', height: 26, background: 'rgba(15, 23, 42, 0.9)' }}
                            >
                              <option value="">-- Hanya {formData.nickname || (formData.fullName ? formData.fullName.split(' ')[0] : 'Orang Tua Ini')} --</option>
                              {formData.spouses.map((sp) => {
                                const spMember = familyData.members[sp.spouseId];
                                return (
                                  <option key={sp.spouseId} value={sp.spouseId}>
                                    💍 {spMember ? spMember.fullName : sp.spouseId}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Reorder Buttons (Up & Down for Mobile / Desktop) */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleMoveChild(index, 'up')}
                          disabled={index === 0}
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid var(--border-glass)',
                            color: index === 0 ? '#475569' : '#e2e8f0',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Pindah ke atas (Lebih tua/Kiri)"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveChild(index, 'down')}
                          disabled={index === childrenList.length - 1}
                          style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid var(--border-glass)',
                            color: index === childrenList.length - 1 ? '#475569' : '#e2e8f0',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            cursor: index === childrenList.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Pindah ke bawah (Lebih muda/Kanan)"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Detail Lanjutan */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tempat Lahir</label>
              <input
                type="text"
                placeholder="Contoh: Yogyakarta / Jakarta"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Pendidikan Terakhir</label>
              <input
                type="text"
                placeholder="Contoh: S1 Kedokteran Hewan UGM"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pekerjaan & Tempat Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Dokter Hewan - Klinik Satwa Medika"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Kota / Domisili Saat Ini</label>
              <input
                type="text"
                placeholder="Contoh: Kebayoran Baru, Jakarta Selatan"
                value={formData.residence}
                onChange={(e) => setFormData({ ...formData, residence: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                placeholder="Contoh: 081290423000 / +6281290423000"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
              {formData.phone && formData.phone.trim() && (
                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MessageCircle size={12} />
                  <span>Tautan WA: <strong>{getWhatsAppUrl(formData.phone)}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Biografi & Catatan Kisah Hidup</label>
            <textarea
              rows={3}
              placeholder="Tuliskan kisah perjalanan hidup, kenangan, atau pesan untuk keluarga..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="form-textarea"
            />
          </div>

          {/* 7. Galeri Foto Karosel & Kenangan */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <label className="form-label" style={{ margin: 0, color: 'var(--text-gold)', fontWeight: 700 }}>
                  Galeri Foto Kenangan ({formData.gallery?.length || 0} Foto)
                </label>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Tambahkan foto kenangan bersama keluarga, lengkap dengan judul dan tahun (opsional).
                </div>
              </div>
              <input
                type="file"
                ref={galleryInputRef}
                onChange={handleGalleryFileChange}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-nav-glass"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isOptimizing}
                style={{ fontSize: 11.5, padding: '5px 12px' }}
              >
                <Plus size={13} /> Tambah Foto Galeri
              </button>
            </div>

            {(!formData.gallery || formData.gallery.length === 0) ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                Belum ada foto galeri tambahan. Klik "+ Tambah Foto Galeri" untuk mengunggah foto kenangan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {formData.gallery.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    {/* Thumbnail Image */}
                    <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-glass)' }}>
                      <img src={p.url} alt="Galeri" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* Inputs */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, minWidth: 0 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Keterangan / Momen Foto
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Momen Wisuda S1 / Liburan Keluarga"
                          value={p.caption || ''}
                          onChange={(e) => handleUpdateGalleryPhoto(p.id, 'caption', e.target.value)}
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Tahun / Tanggal (Opsional)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 2024 / Kosongkan"
                          value={p.date || ''}
                          onChange={(e) => handleUpdateGalleryPhoto(p.id, 'date', e.target.value)}
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                        />
                      </div>
                    </div>

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPhoto(p.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        alignSelf: 'center'
                      }}
                      title="Hapus Foto dari Galeri"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
            <button type="button" className="btn-nav-glass" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-nav-primary">
              <CheckCircle2 size={16} /> Simpan Data Anggota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

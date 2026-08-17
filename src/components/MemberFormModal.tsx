import React, { useState, useRef } from 'react';
import type {
  FamilyMember,
  FamilyData,
  Gender,
  ParentRelationType,
  MarriageStatus,
  SpouseRelation,
  GalleryPhoto
} from '../types/family';
import { uploadImageToSupabaseStorage } from '../services/supabaseService';
import { optimizeImage, formatBytes } from '../utils/imageOptimizer';
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Heart,
  Users
} from 'lucide-react';

interface MemberFormModalProps {
  initialMember?: Partial<FamilyMember> | null;
  familyData: FamilyData;
  sourceNodeIdForRelation?: string;
  relationDirection?: 'parent' | 'child' | 'spouse' | 'sibling';
  onSave: (member: FamilyMember) => void;
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

  let defaultGen = initialMember?.generation || 1;
  let initialSpouses: SpouseRelation[] = initialMember?.spouses ? [...initialMember.spouses] : [];
  let initialParents: string[] = initialMember?.parentIds ? [...initialMember.parentIds] : [];
  let defaultGender: Gender = initialMember?.gender || 'male';

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

  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    id: initialMember?.id || 'mem-' + Date.now(),
    fullName: initialMember?.fullName || '',
    nickname: initialMember?.nickname || '',
    title: initialMember?.title || '',
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
    gallery: initialMember?.gallery || []
  });

  const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Automatic photo compression on device + Supabase Storage upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsOptimizing(true);
      setOptimizationStatus('Mengompresi foto & mengunggah ke Supabase...');

      const result = await optimizeImage(file, 600, 600, 0.82);
      
      // Upload to Supabase Storage (or returns result.dataUrl as fallback)
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
          date: new Date().getFullYear().toString()
        });
      }

      setFormData((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...newPhotos]
      }));

      setOptimizationStatus(`✓ Berhasil menambahkan ${newPhotos.length} foto galeri optimal!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || formData.fullName.trim() === '') {
      alert('Mohon isi nama lengkap anggota keluarga.');
      return;
    }

    onSave(formData as FamilyMember);
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
                ? `Tambah ${relationDirection.toUpperCase()} dari ${sourceMember.fullName}`
                : 'Tambah Anggota Keluarga Baru'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Lengkapi informasi profil, silsilah garis keluarga, pasangan, dan dokumentasi foto.
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

          {/* 1. Informasi Pokok */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Raden Mas Sastrowardoyo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gelar (Depan / Belakang)</label>
              <input
                type="text"
                placeholder="Contoh: R.M. / S.T. / Drh."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nama Panggilan / Alias</label>
              <input
                type="text"
                placeholder="Contoh: Kakang / Eyang Hendra"
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
                {formData.spouses.map((sp, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <select
                      value={sp.spouseId}
                      onChange={(e) => handleUpdateSpouse(idx, 'spouseId', e.target.value)}
                      className="form-select"
                      style={{ flex: 2, fontSize: 12.5 }}
                    >
                      {allOtherMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.gender === 'female' ? 'Perempuan' : 'Laki-laki'})
                        </option>
                      ))}
                    </select>

                    <select
                      value={sp.status}
                      onChange={(e) => handleUpdateSpouse(idx, 'status', e.target.value as MarriageStatus)}
                      className="form-select"
                      style={{ flex: 1.5, fontSize: 12.5 }}
                    >
                      <option value="married">💍 Menikah</option>
                      <option value="divorced">💔 Bercerai</option>
                      <option value="separated">Berpisah</option>
                      <option value="widowed">Pasangan Wafat</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpouse(idx)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Hapus Relasi Pasangan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
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
              <Users size={15} /> Garis Silsilah & Hubungan Orang Tua
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
                <input
                  type="number"
                  min={1}
                  placeholder="1 = Sulung, 2 = Kedua, dst."
                  value={formData.order || 1}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* 5. Detail Lanjutan */}
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
                placeholder="Contoh: +62 812-3456-7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
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

          {/* 6. Galeri Foto Karosel */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Galeri Foto Karosel ({formData.gallery?.length || 0} Foto)
              </label>
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
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                <Plus size={12} /> Tambah Foto Galeri
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {formData.gallery?.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: 'relative',
                    width: 70,
                    height: 70,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <img src={p.url} alt="Galeri" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryPhoto(p.id)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(239, 68, 68, 0.85)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
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

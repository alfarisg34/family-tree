import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryPhoto, FamilyMember } from '../types/family';

interface ImageLightboxModalProps {
  photos: GalleryPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  familyMembers?: Record<string, FamilyMember>;
  onSelectMember?: (memberId: string) => void;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  photos,
  initialIndex = 0,
  isOpen,
  familyMembers,
  onSelectMember,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length, currentIndex]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.2);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0
      }}
      onClick={onClose}
    >
      {/* Top Floating Control Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
      >
        {/* Caption & Photo Counter */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 16px',
            color: '#fff',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            maxWidth: 'calc(100vw - 220px)',
            overflow: 'hidden'
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentPhoto.caption || 'Foto Kenangan'}
          </span>
          {currentPhoto.date && (
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
              ({currentPhoto.date})
            </span>
          )}

          {/* Tagged members chips in lightbox */}
          {currentPhoto.taggedMemberIds && currentPhoto.taggedMemberIds.length > 0 && familyMembers && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderLeft: '1px solid var(--border-glass)', paddingLeft: 10, overflow: 'hidden' }}>
              {currentPhoto.taggedMemberIds.map((tagId) => {
                const taggedMember = familyMembers[tagId];
                if (!taggedMember) return null;
                return (
                  <span
                    key={tagId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectMember) {
                        onClose();
                        onSelectMember(tagId);
                      }
                    }}
                    style={{
                      fontSize: 11,
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      cursor: onSelectMember ? 'pointer' : 'default',
                      whiteSpace: 'nowrap'
                    }}
                    title={`Lihat profil ${taggedMember.fullName}`}
                  >
                    👤 {taggedMember.nickname || taggedMember.fullName.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          )}

          {photos.length > 1 && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11, borderLeft: '1px solid var(--border-glass)', paddingLeft: 10, whiteSpace: 'nowrap' }}>
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>

        {/* Action Controls (Zoom & Close) */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: scale <= 1 ? 'rgba(255,255,255,0.3)' : '#fff',
              padding: '6px 8px',
              borderRadius: '50%',
              cursor: scale <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>

          <span style={{ fontSize: 12, color: 'var(--text-gold)', fontWeight: 600, minWidth: 42, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            style={{
              background: 'transparent',
              border: 'none',
              color: scale >= 4 ? 'rgba(255,255,255,0.3)' : '#fff',
              padding: '6px 8px',
              borderRadius: '50%',
              cursor: scale >= 4 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              padding: '6px 8px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Reset Zoom (100%)"
          >
            <RotateCcw size={16} />
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--border-glass)', margin: '0 4px' }} />

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || 'Foto Utuh'}
          draggable={false}
          style={{
            maxWidth: '92vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
            borderRadius: 4
          }}
        />
      </div>

      {/* Prev / Next Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
            title="Foto Sebelumnya (←)"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
            title="Foto Selanjutnya (→)"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 16,
            display: 'flex',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-full)',
            maxWidth: '90vw',
            overflowX: 'auto',
            zIndex: 10000
          }}
        >
          {photos.map((p, idx) => (
            <div
              key={p.id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: currentIndex === idx ? '2px solid var(--accent-gold)' : '1px solid rgba(255,255,255,0.2)',
                opacity: currentIndex === idx ? 1 : 0.6,
                transform: currentIndex === idx ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <img src={p.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

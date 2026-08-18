import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2 } from 'lucide-react';
import type { GalleryPhoto } from '../types/family';
import { ImageLightboxModal } from './ImageLightboxModal';

interface PhotoCarouselProps {
  photos: GalleryPhoto[];
  defaultAvatar?: string;
  isDeceased?: boolean;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  defaultAvatar,
  isDeceased = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const allImages = React.useMemo(() => {
    const list: GalleryPhoto[] = [];
    if (defaultAvatar) {
      list.push({
        id: 'main-avatar',
        url: defaultAvatar,
        caption: 'Foto Profil Utama'
      });
    }
    if (photos && photos.length > 0) {
      list.push(...photos);
    }
    return list;
  }, [photos, defaultAvatar]);

  if (allImages.length === 0) {
    return (
      <div className="carousel-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-muted)' }}>
        <ImageIcon size={28} />
        <span style={{ marginLeft: 8, fontSize: 13 }}>Belum ada dokumentasi foto</span>
      </div>
    );
  }

  const currentPhoto = allImages[currentIndex] || allImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="carousel-container">
        {/* Main Photo Display Area */}
        <div
          className="carousel-slide-box"
          onClick={() => setIsLightboxOpen(true)}
          title="Klik untuk melihat foto utuh & zoom"
        >
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Foto Keluarga'}
            className="carousel-slide-img"
            style={isDeceased ? { filter: 'var(--sepia-filter)' } : undefined}
            loading="lazy"
          />

          {/* Zoom hint badge */}
          <div className="carousel-zoom-hint">
            <Maximize2 size={12} />
            <span>Perbesar Foto</span>
          </div>

          {(Boolean(currentPhoto.caption && currentPhoto.caption.trim()) || Boolean(currentPhoto.date && currentPhoto.date.trim())) && (
            <div className="carousel-caption-bar">
              {currentPhoto.caption && currentPhoto.caption.trim() && (
                <p style={{ fontWeight: 600 }}>{currentPhoto.caption.trim()}</p>
              )}
              {currentPhoto.date && currentPhoto.date.trim() && (
                <span style={{ fontSize: 11, color: 'var(--text-gold)', marginTop: 2, display: 'block' }}>
                  Tahun / Tanggal: {currentPhoto.date.trim()}
                </span>
              )}
            </div>
          )}

          {allImages.length > 1 && (
            <>
              <button
                className="carousel-nav-btn prev"
                onClick={handlePrev}
                title="Foto Sebelumnya"
                aria-label="Previous photo"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="carousel-nav-btn next"
                onClick={handleNext}
                title="Foto Selanjutnya"
                aria-label="Next photo"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {allImages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0', background: 'rgba(0,0,0,0.4)' }}>
            {allImages.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: currentIndex === idx ? 16 : 6,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor: currentIndex === idx ? 'var(--accent-gold)' : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal with Zoom & Pan */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        photos={allImages}
        initialIndex={currentIndex}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, Scissors } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  cropShape?: 'circle' | 'rect';
  rectAspectRatio?: number; // e.g. 1.5 for 3:2 landscape
  title?: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  cropShape = 'circle',
  rectAspectRatio = 1.5,
  title = 'Sesuaikan & Potong Foto',
  onSave,
  onClose
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Viewport display dimensions
  const viewWidth = 360;
  const viewHeight = 360;

  // Crop area dimensions
  const cropSize = cropShape === 'circle' 
    ? 260 
    : { width: 320, height: Math.round(320 / rectAspectRatio) };

  const cropWidth = typeof cropSize === 'number' ? cropSize : cropSize.width;
  const cropHeight = typeof cropSize === 'number' ? cropSize : cropSize.height;

  // Load image when modal opens or url changes
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setImageLoaded(false);
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Initial fit scale
      const isRotated = rotation % 180 !== 0;
      const imgW = isRotated ? img.naturalHeight : img.naturalWidth;
      const imgH = isRotated ? img.naturalWidth : img.naturalHeight;

      const scaleW = cropWidth / imgW;
      const scaleH = cropHeight / imgH;
      const initialFit = Math.max(scaleW, scaleH, 1);
      setScale(initialFit);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Draw viewport with crop mask
  const drawViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;

    ctx.clearRect(0, 0, viewWidth, viewHeight);

    // Save state for image rendering
    ctx.save();
    ctx.translate(viewWidth / 2 + offset.x, viewHeight / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw the image centered
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Dark overlay outside crop area
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Cut out the crop area (make it transparent)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(viewWidth / 2, viewHeight / 2, cropWidth / 2, 0, Math.PI * 2);
    } else {
      const x = (viewWidth - cropWidth) / 2;
      const y = (viewHeight - cropHeight) / 2;
      ctx.roundRect(x, y, cropWidth, cropHeight, 6);
    }
    ctx.fill();
    ctx.restore();

    // Draw golden border & guidelines around crop area
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(viewWidth / 2, viewHeight / 2, cropWidth / 2, 0, Math.PI * 2);
    } else {
      const x = (viewWidth - cropWidth) / 2;
      const y = (viewHeight - cropHeight) / 2;
      ctx.roundRect(x, y, cropWidth, cropHeight, 6);
    }
    ctx.stroke();

    // Subtle 3x3 grid guidelines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const xStart = (viewWidth - cropWidth) / 2;
    const yStart = (viewHeight - cropHeight) / 2;

    ctx.beginPath();
    // vertical grid lines
    ctx.moveTo(xStart + cropWidth / 3, yStart);
    ctx.lineTo(xStart + cropWidth / 3, yStart + cropHeight);
    ctx.moveTo(xStart + (cropWidth * 2) / 3, yStart);
    ctx.lineTo(xStart + (cropWidth * 2) / 3, yStart + cropHeight);
    // horizontal grid lines
    ctx.moveTo(xStart, yStart + cropHeight / 3);
    ctx.lineTo(xStart + cropWidth, yStart + cropHeight / 3);
    ctx.moveTo(xStart, yStart + (cropHeight * 2) / 3);
    ctx.lineTo(xStart + cropWidth, yStart + (cropHeight * 2) / 3);
    ctx.stroke();

    ctx.restore();
  }, [imageLoaded, scale, rotation, offset, cropShape, cropWidth, cropHeight]);

  useEffect(() => {
    drawViewport();
  }, [drawViewport]);

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag Events (Mobile Support)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.1;
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + zoomStep, 4));
    } else {
      setScale((prev) => Math.max(prev - zoomStep, 0.4));
    }
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to original
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate the final cropped image data URL
  const handleConfirmCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    // High-resolution output canvas (800x800 for avatar or 1200x800 for rect)
    const outWidth = cropShape === 'circle' ? 800 : 1200;
    const outHeight = cropShape === 'circle' ? 800 : Math.round(1200 / rectAspectRatio);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    // Map viewport crop coordinate scale to output canvas scale
    const outputScaleFactor = outWidth / cropWidth;

    outCtx.save();
    outCtx.translate(outWidth / 2, outHeight / 2);
    outCtx.scale(outputScaleFactor, outputScaleFactor);
    outCtx.translate(offset.x, offset.y);
    outCtx.rotate((rotation * Math.PI) / 180);
    outCtx.scale(scale, scale);

    outCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    outCtx.restore();

    try {
      const croppedDataUrl = outCanvas.toDataURL('image/webp', 0.88);
      onSave(croppedDataUrl);
      onClose();
    } catch {
      const fallbackJpeg = outCanvas.toDataURL('image/jpeg', 0.88);
      onSave(fallbackJpeg);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid var(--border-glass-highlight)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 60px -8px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.2)',
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(30, 41, 59, 0.6)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scissors size={18} color="var(--accent-gold)" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Box */}
        <div
          style={{
            position: 'relative',
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            userSelect: 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            width={viewWidth}
            height={viewHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{
              width: '100%',
              maxWidth: viewWidth,
              aspectRatio: '1/1',
              borderRadius: 'var(--radius-sm)',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 18,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              pointerEvents: 'none'
            }}
          >
            <Move size={12} />
            <span>Geser & scroll mouse untuk atur posisi</span>
          </div>
        </div>

        {/* Adjust Controls Bar */}
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderTop: '1px solid var(--border-glass)'
          }}
        >
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(prev - 0.15, 0.4))}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>

            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--accent-gold)',
                cursor: 'pointer'
              }}
            />

            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(prev + 0.15, 3.5))}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Putar 90 Derajat"
            >
              <RotateCw size={13} />
              <span>Putar 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer'
              }}
              title="Reset Zoom & Posisi"
            >
              Reset
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              className="btn-nav-glass"
              onClick={onClose}
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-nav-primary"
              onClick={handleConfirmCrop}
              style={{ fontSize: 12, padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Check size={15} />
              <span>Gunakan Hasil Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

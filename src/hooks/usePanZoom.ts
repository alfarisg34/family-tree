import { useState, useRef, useEffect, useCallback } from 'react';
import type { ViewportState, LODLevel } from '../types/family';

interface UsePanZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  initialX?: number;
  initialY?: number;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

export function usePanZoom(options: UsePanZoomOptions = {}) {
  const {
    minScale = 0.2,
    maxScale = 2.5,
    initialScale = 0.85,
    initialX = 0,
    initialY = 0,
    bounds
  } = options;

  const [viewport, setViewport] = useState<ViewportState>({
    x: initialX,
    y: initialY,
    scale: initialScale
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag tracking
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const isPointerDownRef = useRef(false);

  // Compute LOD level based on zoom scale
  const getLODLevel = (scale: number): LODLevel => {
    if (scale < 0.55) return 'macro';
    if (scale <= 1.05) return 'medium';
    return 'micro';
  };

  // Progressive generation visibility threshold based on zoom scale:
  // scale < 0.35  -> Gen 1 & 2 only (ancestor overview)
  // scale < 0.48  -> Gen 1, 2, 3 (grandparents)
  // scale < 0.62  -> Gen 1, 2, 3, 4 (parents & uncles)
  // scale >= 0.62 -> All generations (Gen 5, 6, 7+ children, grandchildren, etc.)
  const getMaxVisibleGeneration = (scale: number): number => {
    if (scale < 0.35) return 2;
    if (scale < 0.48) return 3;
    if (scale < 0.62) return 4;
    return Infinity;
  };

  const lodLevel: LODLevel = getLODLevel(viewport.scale);
  const maxVisibleGeneration: number = getMaxVisibleGeneration(viewport.scale);

  // Zoom towards a specific screen coordinate (or center if omitted)
  const zoomAt = useCallback((newScale: number, clientX?: number, clientY?: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setViewport((prev) => {
      if (clampedScale === prev.scale) return prev;

      const container = containerRef.current;
      const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      
      const pointX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const pointY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

      // Maintain world point under mouse cursor
      const worldX = (pointX - prev.x) / prev.scale;
      const worldY = (pointY - prev.y) / prev.scale;

      const nextX = pointX - worldX * clampedScale;
      const nextY = pointY - worldY * clampedScale;

      return {
        x: nextX,
        y: nextY,
        scale: clampedScale
      };
    });
  }, [minScale, maxScale]);

  // Step zoom controls (+ / -)
  const zoomIn = useCallback(() => {
    zoomAt(viewport.scale * 1.3);
  }, [viewport.scale, zoomAt]);

  const zoomOut = useCallback(() => {
    zoomAt(viewport.scale / 1.3);
  }, [viewport.scale, zoomAt]);

  // Reset to initial centered scale
  const resetView = useCallback(() => {
    if (!containerRef.current) {
      setViewport({ x: 0, y: 0, scale: 0.85 });
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    setViewport({
      x: rect.width / 2 - 600 * 0.85,
      y: rect.height / 2 - 350 * 0.85,
      scale: 0.85
    });
  }, []);

  // Fit all tree bounds into viewport
  const fitView = useCallback((treeBounds?: { minX: number; maxX: number; minY: number; maxY: number }) => {
    const b = treeBounds || bounds;
    if (!containerRef.current || !b) return;

    const rect = containerRef.current.getBoundingClientRect();
    const treeW = Math.max(400, b.maxX - b.minX);
    const treeH = Math.max(400, b.maxY - b.minY);

    const padding = 100;
    const scaleX = (rect.width - padding * 2) / treeW;
    const scaleY = (rect.height - padding * 2) / treeH;
    const fitScale = Math.max(minScale, Math.min(1.2, Math.min(scaleX, scaleY)));

    const centerX = (b.minX + b.maxX) / 2;
    const centerY = (b.minY + b.maxY) / 2;

    setViewport({
      x: rect.width / 2 - centerX * fitScale,
      y: rect.height / 2 - centerY * fitScale,
      scale: fitScale
    });
  }, [bounds, minScale]);

  // Smooth animation fly to specific node
  const flyToNode = useCallback((nodeX: number, nodeY: number, targetScale: number = 1.25) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const targetX = rect.width / 2 - nodeX * targetScale;
    const targetY = rect.height / 2 - nodeY * targetScale;

    setViewport({
      x: targetX,
      y: targetY,
      scale: targetScale
    });
  }, []);

  // Mouse wheel handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      zoomAt(viewport.scale * zoomFactor, e.clientX, e.clientY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [viewport.scale, zoomAt]);

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, .modal-backdrop, .nav-actions-section')) {
      return;
    }

    isPointerDownRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    viewportStartRef.current = { x: viewport.x, y: viewport.y };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setViewport((prev) => ({
      ...prev,
      x: viewportStartRef.current.x + deltaX,
      y: viewportStartRef.current.y + deltaY
    }));
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistanceRef.current;
      touchDistanceRef.current = dist;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      zoomAt(viewport.scale * ratio, midX, midY);
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  return {
    viewport,
    setViewport,
    lodLevel,
    maxVisibleGeneration,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    flyToNode,
    zoomAt,
    bindContainerEvents: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

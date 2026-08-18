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

  // Non-passive Touch Handlers for smooth mobile gestures (pinch-to-zoom and two-finger pan)
  const touchStateRef = useRef<{
    initialDist: number | null;
    initialScale: number;
    initialMidpoint: { x: number; y: number };
    initialViewport: { x: number; y: number };
  }>({
    initialDist: null,
    initialScale: 1,
    initialMidpoint: { x: 0, y: 0 },
    initialViewport: { x: 0, y: 0 }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStartNative = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, .modal-backdrop, .nav-actions-section')) {
        return;
      }

      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;

        touchStateRef.current = {
          initialDist: Math.max(dist, 1),
          initialScale: viewport.scale,
          initialMidpoint: { x: midX, y: midY },
          initialViewport: { x: viewport.x, y: viewport.y }
        };
        setIsDragging(true);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        isPointerDownRef.current = true;
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        viewportStartRef.current = { x: viewport.x, y: viewport.y };
        setIsDragging(true);
      }
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStateRef.current.initialDist !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const currentMidX = (touch1.clientX + touch2.clientX) / 2;
        const currentMidY = (touch1.clientY + touch2.clientY) / 2;

        const { initialDist, initialScale, initialMidpoint, initialViewport } = touchStateRef.current;
        const scaleMultiplier = currentDist / initialDist;
        const targetScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleMultiplier));

        const containerRect = container.getBoundingClientRect();
        const initPointX = initialMidpoint.x - containerRect.left;
        const initPointY = initialMidpoint.y - containerRect.top;

        // World coordinate pinned under the initial midpoint
        const worldX = (initPointX - initialViewport.x) / initialScale;
        const worldY = (initPointY - initialViewport.y) / initialScale;

        // Account for simultaneous translation of the pinch midpoint
        const deltaMidX = currentMidX - initialMidpoint.x;
        const deltaMidY = currentMidY - initialMidpoint.y;

        const nextX = initPointX - worldX * targetScale + deltaMidX;
        const nextY = initPointY - worldY * targetScale + deltaMidY;

        setViewport({
          x: nextX,
          y: nextY,
          scale: targetScale
        });
      } else if (e.touches.length === 1 && isPointerDownRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartRef.current.x;
        const deltaY = touch.clientY - dragStartRef.current.y;

        setViewport((prev) => ({
          ...prev,
          x: viewportStartRef.current.x + deltaX,
          y: viewportStartRef.current.y + deltaY
        }));
      }
    };

    const handleTouchEndNative = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStateRef.current.initialDist = null;
      }
      if (e.touches.length === 0) {
        isPointerDownRef.current = false;
        setIsDragging(false);
      } else if (e.touches.length === 1) {
        // Reset single finger drag starting anchor
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        viewportStartRef.current = { x: viewport.x, y: viewport.y };
      }
    };

    container.addEventListener('touchstart', handleTouchStartNative, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });
    container.addEventListener('touchend', handleTouchEndNative);
    container.addEventListener('touchcancel', handleTouchEndNative);

    return () => {
      container.removeEventListener('touchstart', handleTouchStartNative);
      container.removeEventListener('touchmove', handleTouchMoveNative);
      container.removeEventListener('touchend', handleTouchEndNative);
      container.removeEventListener('touchcancel', handleTouchEndNative);
    };
  }, [viewport.scale, viewport.x, viewport.y, minScale, maxScale]);

  // Mouse Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled by native touch listeners
    if (e.button !== 0) return;
    
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
    if (e.pointerType === 'touch') return; // Handled by native touch listeners
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setViewport((prev) => ({
      ...prev,
      x: viewportStartRef.current.x + deltaX,
      y: viewportStartRef.current.y + deltaY
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    isPointerDownRef.current = false;
    setIsDragging(false);
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
      onPointerLeave: handlePointerUp
    }
  };
}

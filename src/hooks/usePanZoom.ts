import { useState, useRef, useEffect, useCallback } from 'react';
import type { ViewportState, LODLevel, ZoomTier } from '../types/family';
import { getZoomTier } from '../utils/clusterEngine';
import { fitTreeViewport } from '../utils/viewport';

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
    minScale = 0.08,
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
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || ('ontouchstart' in window);
  });

  // Track container size & mobile status on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      } else {
        setContainerSize({ width: window.innerWidth, height: window.innerHeight });
      }
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window));
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => { observer.disconnect(); window.removeEventListener('resize', handleResize); };
  }, []);

  // Drag tracking
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const dragMovedRef = useRef(false);

  // Compute Zoom Tier / LOD Level
  const lodLevel: LODLevel = getZoomTier(viewport.scale);
  const zoomTier: ZoomTier = lodLevel;

  // Zoom towards a specific screen coordinate (or center if omitted)
  const zoomAt = useCallback((newScale: number, clientX?: number, clientY?: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setViewport((prev) => {
      if (clampedScale === prev.scale) return prev;

      const container = containerRef.current;
      const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      
      const pointX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const pointY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

      // Maintain world point under cursor/touch
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
      x: rect.width / 2 - (bounds ? (bounds.minX + bounds.maxX) / 2 : 0) * 0.85,
      y: rect.height / 2 - (bounds ? (bounds.minY + bounds.maxY) / 2 : 0) * 0.85,
      scale: 0.85
    });
  }, [bounds]);

  // Fit all tree bounds into viewport
  const fitView = useCallback((treeBounds?: { minX: number; maxX: number; minY: number; maxY: number }) => {
    const b = treeBounds || bounds;
    if (!containerRef.current || !b) return;

    const rect = containerRef.current.getBoundingClientRect();
    setViewport(fitTreeViewport(b, rect, minScale));
  }, [bounds, minScale]);

  // Smooth animation fly to specific node
  const flyToNode = useCallback((nodeX: number, nodeY: number, targetScale: number = 1.15) => {
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

  // Progressive disclosure zoom to cluster bounds
  const zoomToCluster = useCallback((clusterBounds: { minX: number; maxX: number; minY: number; maxY: number }, targetScale = 1.05) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = (clusterBounds.minX + clusterBounds.maxX) / 2;
    const centerY = (clusterBounds.minY + clusterBounds.maxY) / 2;

    setViewport({
      x: rect.width / 2 - centerX * targetScale,
      y: rect.height / 2 - centerY * targetScale,
      scale: targetScale
    });
  }, []);

  // Mouse wheel handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 300 : 1);
      const zoomFactor = Math.exp(-Math.max(-120, Math.min(120, delta)) * .002);
      zoomAt(viewport.scale * zoomFactor, e.clientX, e.clientY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [viewport.scale, zoomAt]);

  // Touch Handlers for mobile gestures (pinch-to-zoom and two-finger pan & swipe)
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
      if (target.closest('button, input, select, textarea, .modal-backdrop, .nav-actions-section, .cluster-hover-tooltip')) {
        return;
      }

      if (e.touches.length === 2) {
        dragMovedRef.current = true;
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
        dragMovedRef.current = false;
        const touch = e.touches[0];
        isPointerDownRef.current = true;
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        viewportStartRef.current = { x: viewport.x, y: viewport.y };
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
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartRef.current.x;
        const deltaY = touch.clientY - dragStartRef.current.y;
        if (!dragMovedRef.current && Math.hypot(deltaX, deltaY) < 5) return;
        e.preventDefault();
        dragMovedRef.current = true;
        setIsDragging(true);

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
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, .modal-backdrop, .nav-actions-section, .cluster-hover-tooltip')) {
      return;
    }

    isPointerDownRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    viewportStartRef.current = { x: viewport.x, y: viewport.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    if (!dragMovedRef.current && Math.hypot(deltaX, deltaY) < 5) return;
    dragMovedRef.current = true;
    setIsDragging(true);
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);

    setViewport((prev) => ({
      ...prev,
      x: viewportStartRef.current.x + deltaX,
      y: viewportStartRef.current.y + deltaY
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.type === 'pointerleave' && e.currentTarget.hasPointerCapture(e.pointerId)) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
  };

  return {
    viewport,
    setViewport,
    lodLevel,
    zoomTier,
    isMobile,
    containerSize,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetView,
    fitView,
    flyToNode,
    zoomToCluster,
    zoomAt,
    bindContainerEvents: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onClickCapture: (event: React.MouseEvent) => {
        if (dragMovedRef.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
      },
      onPointerLeave: handlePointerUp
    }
  };
}

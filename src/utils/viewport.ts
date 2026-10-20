export function fitTreeViewport(bounds: { minX: number; maxX: number; minY: number; maxY: number }, size: { width: number; height: number }, minScale = 0.08) {
  const padding = size.width < 768 ? 35 : 65;
  const width = Math.max(240, bounds.maxX - bounds.minX);
  const height = Math.max(240, bounds.maxY - bounds.minY);
  const scale = Math.max(minScale, Math.min(1.15, Math.max(1, size.width - padding * 2) / width, Math.max(1, size.height - padding * 2) / height));
  return { x: size.width / 2 - (bounds.minX + bounds.maxX) / 2 * scale, y: size.height / 2 - (bounds.minY + bounds.maxY) / 2 * scale, scale };
}

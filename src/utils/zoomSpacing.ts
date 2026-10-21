/** Expand hidden descendants before the zoom level that reveals them. */
export function getFamilyExpansion(generation: number, scale: number): number {
  if (generation < 2) return 1;
  const start = generation === 2 ? 0.28 : 0.5;
  const end = generation === 2 ? 0.5 : 0.85;
  const progress = Math.max(0, Math.min(1, (scale - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

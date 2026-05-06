/** Trim machine type / name per spec (leading/trailing space). */
export function trimMachineName(raw: string): string {
  return raw.trim();
}

/**
 * Normalize plant name: trim, lowercase, map known plants.
 * Returns canonical name or null if unknown.
 */
export function normalizePlantName(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (t === 'đà nẵng') return 'Đà Nẵng';
  if (t === 'long thành') return 'Long Thành';
  if (t === 'tân á') return 'Tân Á';
  if (t === 'bắc ninh') return 'Bắc Ninh';
  return null;
}

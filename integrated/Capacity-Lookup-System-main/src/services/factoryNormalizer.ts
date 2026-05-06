import { normalizePlantName } from '../utils/stringUtils';
import type { PlantRow } from '../types/masterData';

/**
 * Per-job cache: normalized plant name → plant id (from DB seed).
 */
export class PlantLookupCache {
  private readonly nameToId = new Map<string, number>();

  constructor(plants: PlantRow[]) {
    for (const p of plants) {
      this.nameToId.set(p.name, p.id);
    }
  }

  /**
   * PHẦN 7: trim → lowercase → map; then lookup id by canonical name.
   */
  resolve(raw: string): { plantId: number; canonicalName: string } | null {
    const canonical = normalizePlantName(raw);
    if (!canonical) return null;
    const plantId = this.nameToId.get(canonical);
    if (plantId === undefined) return null;
    return { plantId, canonicalName: canonical };
  }
}

import type { PlantRow } from '../types/masterData';
import type { CapabilityRawRow } from '../db/queries/searchPhase2';

function num(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface MachineCapabilityOut {
  capability_id: number;
  machine_id: number;
  machine_type: string;
  process_step_code: string;
  process_step_name: string;
  design_speed: number | null;
  actual_speed: number | null;
  actual_speed_ms: number | null;
  output_km_per_shift: number | null;
  output_kg_per_shift: number | null;
  is_recommended: boolean;
}

export interface PlantResultOut {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  has_data: boolean;
  has_recommended: boolean;
  machines: MachineCapabilityOut[];
}

export interface CapabilitySummaryOut {
  best_actual_speed: number | null;
  best_actual_speed_ms: number | null;
  best_output_km_per_shift: number | null;
  best_output_kg_per_shift: number | null;
  best_plant_name: string | null;
  best_machine_type: string | null;
  plants_with_data: number;
  plants_without_data: number;
}

/** Cách chọn bản ghi “đề xuất” khi DB không gắn is_recommended. */
export type CapabilityRankBy = 'speed' | 'output';

function applySyntheticRecommendation(
  working: CapabilityRawRow[],
  rankBy: CapabilityRankBy
): CapabilityRawRow[] {
  if (working.length === 0) return working;

  if (rankBy === 'output') {
    const maxKm = Math.max(...working.map((r) => num(r.output_km_per_shift) ?? 0));
    if (maxKm > 0) {
      const winners = working.filter((r) => (num(r.output_km_per_shift) ?? 0) === maxKm);
      winners.sort((a, b) => a.capability_id - b.capability_id);
      const pickId = winners[0]!.capability_id;
      return working.map((r) => ({
        ...r,
        is_recommended: r.capability_id === pickId,
      }));
    }
    const maxKg = Math.max(...working.map((r) => num(r.output_kg_per_shift) ?? 0));
    if (maxKg > 0) {
      const winners = working.filter((r) => (num(r.output_kg_per_shift) ?? 0) === maxKg);
      winners.sort((a, b) => a.capability_id - b.capability_id);
      const pickId = winners[0]!.capability_id;
      return working.map((r) => ({
        ...r,
        is_recommended: r.capability_id === pickId,
      }));
    }
  }

  const speeds = working.map((r) => num(r.actual_speed) ?? 0);
  const maxSpeed = Math.max(...speeds);
  if (maxSpeed > 0) {
    const winners = working.filter((r) => (num(r.actual_speed) ?? 0) === maxSpeed);
    winners.sort((a, b) => a.capability_id - b.capability_id);
    const pickId = winners[0]!.capability_id;
    return working.map((r) => ({
      ...r,
      is_recommended: r.capability_id === pickId,
    }));
  }

  return working;
}

export function buildCapabilityResult(
  rows: CapabilityRawRow[],
  allPlants: PlantRow[],
  material: {
    id: number;
    material_code: string;
    material_description: string;
    process_step_code: string;
    process_step_name: string;
  },
  opts?: { rankBy?: CapabilityRankBy }
): {
  material: typeof material;
  summary: CapabilitySummaryOut;
  plants: PlantResultOut[];
} {
  const rankBy: CapabilityRankBy = opts?.rankBy === 'output' ? 'output' : 'speed';
  let working = rows.map((r) => ({ ...r }));

  const anyDbRec = working.some((r) => r.is_recommended);
  if (rankBy === 'output') {
    const hasOutput = working.some(
      (r) => (num(r.output_km_per_shift) ?? 0) > 0 || (num(r.output_kg_per_shift) ?? 0) > 0
    );
    if (hasOutput) {
      working = applySyntheticRecommendation(
        working.map((r) => ({ ...r, is_recommended: false })),
        'output'
      );
    } else if (!anyDbRec) {
      working = applySyntheticRecommendation(working, 'speed');
    }
  } else if (!anyDbRec && working.length > 0) {
    working = applySyntheticRecommendation(working, 'speed');
  }

  const byPlant = new Map<number, CapabilityRawRow[]>();
  for (const r of working) {
    const arr = byPlant.get(r.plant_id) ?? [];
    arr.push(r);
    byPlant.set(r.plant_id, arr);
  }

  for (const [, arr] of byPlant) {
    arr.sort((a, b) => {
      if (a.is_recommended !== b.is_recommended) return a.is_recommended ? -1 : 1;
      if (rankBy === 'output') {
        const ka = num(a.output_km_per_shift) ?? 0;
        const kb = num(b.output_km_per_shift) ?? 0;
        if (ka !== kb) return kb - ka;
        const ga = num(a.output_kg_per_shift) ?? 0;
        const gb = num(b.output_kg_per_shift) ?? 0;
        if (ga !== gb) return gb - ga;
      }
      const sa = num(a.actual_speed);
      const sb = num(b.actual_speed);
      if (sa === null && sb === null) return 0;
      if (sa === null) return 1;
      if (sb === null) return -1;
      return sb - sa;
    });
  }

  const rec = working.find((r) => r.is_recommended) ?? null;
  const isKeo = material.process_step_code === 'KEO';

  const summary: CapabilitySummaryOut = {
    best_actual_speed: rec ? num(rec.actual_speed) : null,
    best_actual_speed_ms: rec && isKeo ? num(rec.actual_speed_ms) : null,
    best_output_km_per_shift: rec ? num(rec.output_km_per_shift) : null,
    best_output_kg_per_shift: rec ? num(rec.output_kg_per_shift) : null,
    best_plant_name: rec?.plant_name ?? null,
    best_machine_type: rec?.machine_type ?? null,
    plants_with_data: byPlant.size,
    plants_without_data: allPlants.length - byPlant.size,
  };

  const plants: PlantResultOut[] = allPlants.map((pl) => {
    const ms = byPlant.get(pl.id) ?? [];
    const machines: MachineCapabilityOut[] = ms.map((r) => ({
      capability_id: r.capability_id,
      machine_id: r.machine_id,
      machine_type: r.machine_type,
      process_step_code: r.process_step_code,
      process_step_name: r.process_step_name,
      design_speed: num(r.design_speed),
      actual_speed: num(r.actual_speed),
      actual_speed_ms: r.process_step_code === 'KEO' ? num(r.actual_speed_ms) : null,
      output_km_per_shift: num(r.output_km_per_shift),
      output_kg_per_shift: num(r.output_kg_per_shift),
      is_recommended: r.is_recommended,
    }));

    return {
      plant_id: pl.id,
      plant_code: pl.code,
      plant_name: pl.name,
      has_data: machines.length > 0,
      has_recommended: machines.some((m) => m.is_recommended),
      machines,
    };
  });

  return { material, summary, plants };
}

/**
 * Legacy tra cứu dưới /api/v1/master-data (Phase 1).
 */
import { Router } from 'express';
import { getPool } from '../db/client';
import { listPlants } from '../db/queries/plants';
import {
  searchCapabilities,
  findMaterialsByExactCode,
  findCapabilitiesForMaterialIds,
} from '../db/queries/capabilitySearch';

export const capabilityLegacyRouter = Router();

const MATERIAL_CODE_STRICT = /^\d{8}$/;

function numOrNull(v: string | null): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

capabilityLegacyRouter.get('/capability', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const limit = parseInt(String(req.query.limit ?? '100'), 10);
    const pool = getPool();
    const client = await pool.connect();
    try {
      const rows = await searchCapabilities(client, q, limit);
      res.json({
        items: rows.map((r) => ({
          id: r.id,
          material_code: r.material_code,
          material_description: r.material_description,
          design_speed: numOrNull(r.design_speed),
          actual_speed: numOrNull(r.actual_speed),
          actual_speed_ms: numOrNull(r.actual_speed_ms),
          output_km_per_shift: numOrNull(r.output_km_per_shift),
          output_kg_per_shift: numOrNull(r.output_kg_per_shift),
          machine_type: r.machine_type,
          plant: { id: r.plant_id, code: r.plant_code, name: r.plant_name },
          process_step: {
            id: r.process_step_id,
            code: r.process_step_code,
            name: r.process_step_name,
          },
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

capabilityLegacyRouter.get('/capability/lookup', async (req, res, next) => {
  try {
    const raw =
      typeof req.query.material_code === 'string'
        ? req.query.material_code.trim()
        : typeof req.query.q === 'string'
          ? req.query.q.trim()
          : '';
    if (!MATERIAL_CODE_STRICT.test(raw)) {
      res.status(400).json({
        error: 'material_code phải là đúng 8 chữ số (ví dụ 56000122)',
        code: 'INVALID_MATERIAL_CODE',
      });
      return;
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      const plants = await listPlants(client);
      const materials = await findMaterialsByExactCode(client, raw);
      if (materials.length === 0) {
        res.json({
          material_code: raw,
          found: false,
          matches: [],
          plants_coverage: plants.map((p) => ({
            plant: { id: p.id, code: p.code, name: p.name },
            has_data: false,
            lines: [] as unknown[],
          })),
          summary: {
            plants_with_data: [] as string[],
            plants_without_data: plants.map((p) => p.code),
          },
        });
        return;
      }

      const materialIds = materials.map((m) => m.material_id);
      const caps = await findCapabilitiesForMaterialIds(client, materialIds);

      const matches = materials.map((m) => {
        const plantBlocks = plants.map((pl) => {
          const lines = caps
            .filter((c) => c.material_id === m.material_id && c.plant_id === pl.id)
            .map((c) => ({
              capability_id: c.capability_id,
              machine_type: c.machine_type,
              design_speed: numOrNull(c.design_speed),
              actual_speed: numOrNull(c.actual_speed),
              actual_speed_ms: numOrNull(c.actual_speed_ms),
              output_km_per_shift: numOrNull(c.output_km_per_shift),
              output_kg_per_shift: numOrNull(c.output_kg_per_shift),
            }));
          return {
            plant: { id: pl.id, code: pl.code, name: pl.name },
            has_data: lines.length > 0,
            line_count: lines.length,
            lines,
          };
        });

        return {
          material_id: m.material_id,
          material_code: m.material_code,
          material_description: m.material_description,
          process_step: {
            id: m.process_step_id,
            code: m.process_step_code,
            name: m.process_step_name,
            sheet_name: m.sheet_name,
          },
          plants: plantBlocks,
        };
      });

      const codesWithData = new Set<string>();
      for (const m of matches) {
        for (const block of m.plants) {
          if (block.has_data) codesWithData.add(block.plant.code);
        }
      }
      const plantsWithoutData = plants
        .map((p) => p.code)
        .filter((code) => !codesWithData.has(code));

      res.json({
        material_code: raw,
        found: true,
        matches,
        summary: {
          plants_with_data: [...codesWithData].sort(),
          plants_without_data: plantsWithoutData.sort(),
        },
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

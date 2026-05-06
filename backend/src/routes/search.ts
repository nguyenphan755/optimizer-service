import { Router } from 'express';
import { getPool } from '../db/client';
import { listPlants } from '../db/queries/plants';
import {
  searchAutocomplete,
  fetchCapabilitiesForMaterial,
  fetchFilterProcessSteps,
  fetchMissingPlants,
  type AutocompleteRow,
  type AutocompleteSortMode,
} from '../db/queries/searchPhase2';

function parseAutocompleteSort(raw: unknown): AutocompleteSortMode {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s === 'best_speed' || s === 'best_output') return s;
  return 'relevance';
}

function autocompleteRowToJson(r: AutocompleteRow) {
  return {
    id: r.id,
    material_code: r.material_code,
    material_description: r.material_description,
    process_step_code: r.process_step_code,
    process_step_name: r.process_step_name,
    plant_count: parseInt(r.plant_count, 10) || 0,
    machine_count: parseInt(String(r.machine_count ?? '0'), 10) || 0,
    best_actual_speed: parseFloat(String(r.best_actual ?? '0')) || 0,
    best_output_km: parseFloat(String(r.best_output_km ?? '0')) || 0,
    best_output_kg: parseFloat(String(r.best_output_kg ?? '0')) || 0,
  };
}
import { buildCapabilityResult, type CapabilityRankBy } from '../services/capabilityResultBuilder';
import { BULK_MAX_ITEMS, runBulkCapabilityLookup } from '../services/bulkCapability';

export const searchRouter = Router();

const autocompleteCache = new Map<string, { data: AutocompleteRow[]; expiry: number }>();

function cacheAutocompleteGet(key: string): AutocompleteRow[] | null {
  const e = autocompleteCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiry) {
    autocompleteCache.delete(key);
    return null;
  }
  return e.data;
}

function cacheAutocompleteSet(key: string, data: AutocompleteRow[]): void {
  if (autocompleteCache.size >= 500) autocompleteCache.clear();
  autocompleteCache.set(key, { data, expiry: Date.now() + 30_000 });
}

/** POST /bulk-capability — tra cứu hàng loạt theo danh sách mã (client parse Excel, gửi mảng). */
searchRouter.post('/bulk-capability', async (req, res, next) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Body cần { items: [...] }', code: 'INVALID_BODY' });
      return;
    }
    if (items.length > BULK_MAX_ITEMS) {
      res.status(400).json({
        error: `Tối đa ${BULK_MAX_ITEMS} dòng trong một lần gửi`,
        code: 'TOO_MANY',
      });
      return;
    }

    const normalized: { material_code: string; description_file?: string | null }[] = [];
    for (const it of items) {
      if (it === null || typeof it !== 'object') continue;
      const code = typeof (it as { material_code?: unknown }).material_code === 'string'
        ? (it as { material_code: string }).material_code
        : '';
      if (!code.trim()) continue;
      const df = (it as { description_file?: unknown }).description_file;
      normalized.push({
        material_code: code.trim(),
        description_file:
          typeof df === 'string' && df.trim() !== '' ? df.trim() : null,
      });
    }

    if (normalized.length === 0) {
      res.status(400).json({ error: 'Không có mã material hợp lệ', code: 'EMPTY' });
      return;
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      const body = await runBulkCapabilityLookup(client, normalized);
      res.json(body);
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('BULK_LIMIT')) {
      res.status(400).json({ error: e.message.replace('BULK_LIMIT: ', ''), code: 'BULK_LIMIT' });
      return;
    }
    next(e);
  }
});

/** GET /autocomplete */
searchRouter.get('/autocomplete', async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      res.status(400).json({ error: 'q tối thiểu 2 ký tự', code: 'INVALID_Q' });
      return;
    }
    const step =
      typeof req.query.step === 'string' && req.query.step.trim() !== ''
        ? req.query.step.trim().toUpperCase()
        : null;
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? '15'), 10) || 15, 1),
      50
    );
    const sort = parseAutocompleteSort(req.query.sort);

    const cacheKey = `${q}|${step ?? ''}|${sort}`;
    const cached = cacheAutocompleteGet(cacheKey);
    if (cached) {
      res.json(cached.map(autocompleteRowToJson));
      return;
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      const t0 = Date.now();
      const rows = await searchAutocomplete(client, { q, step, limit, sort });
      if (Date.now() - t0 > 200) {
        console.warn(`[SLOW] autocomplete q=${q}: ${Date.now() - t0}ms`);
      }
      cacheAutocompleteSet(cacheKey, rows);
      res.json(rows.map(autocompleteRowToJson));
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /material/:material_id/capability */
searchRouter.get('/material/:materialId/capability', async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      res.status(400).json({ error: 'material_id không hợp lệ', code: 'INVALID_ID' });
      return;
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      const t0 = Date.now();
      const meta = await client.query<{
        id: number;
        material_code: string;
        material_description: string;
        process_step_code: string;
        process_step_name: string;
      }>(
        `SELECT m.id, m.material_code, m.material_description,
                ps.code AS process_step_code, ps.name AS process_step_name
         FROM materials m
         JOIN process_steps ps ON ps.id = m.process_step_id
         WHERE m.id = $1`,
        [materialId]
      );
      if (!meta.rows[0]) {
        res.status(404).json({ error: 'Không tìm thấy material', code: 'NOT_FOUND' });
        return;
      }

      const rawRows = await fetchCapabilitiesForMaterial(client, materialId);
      const plants = await listPlants(client);
      const dt = Date.now() - t0;
      if (dt > 200) {
        console.warn(`[SLOW] capability ${materialId}: ${dt}ms`);
      }

      const rankBy: CapabilityRankBy =
        typeof req.query.rank_by === 'string' && req.query.rank_by.trim().toLowerCase() === 'output'
          ? 'output'
          : 'speed';
      const body = buildCapabilityResult(rawRows, plants, meta.rows[0], { rankBy });
      res.json(body);
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /filters */
searchRouter.get('/filters', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const steps = await fetchFilterProcessSteps(client);
      const plants = await listPlants(client);
      res.json({
        process_steps: steps.map((s) => ({
          code: s.code,
          name: s.name,
          material_count: parseInt(s.material_count, 10) || 0,
        })),
        plants: plants.map((p) => ({ id: p.id, code: p.code, name: p.name })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /material/:material_id/missing-plants */
searchRouter.get('/material/:materialId/missing-plants', async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      res.status(400).json({ error: 'material_id không hợp lệ', code: 'INVALID_ID' });
      return;
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      const m = await client.query<{ material_code: string }>(
        `SELECT material_code FROM materials WHERE id = $1`,
        [materialId]
      );
      if (!m.rows[0]) {
        res.status(404).json({ error: 'Không tìm thấy material', code: 'NOT_FOUND' });
        return;
      }
      const missing = await fetchMissingPlants(client, materialId);
      res.json({
        material_id: materialId,
        material_code: m.rows[0].material_code,
        missing_plants: missing.map((p) => ({
          plant_id: p.plant_id,
          plant_name: p.plant_name,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

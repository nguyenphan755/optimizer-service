import { PoolClient } from 'pg';

export interface AutocompleteRow {
  id: number;
  material_code: string;
  material_description: string;
  process_step_code: string;
  process_step_name: string;
  plant_count: string;
  machine_count: string;
  best_actual: string;
  best_output_km: string;
  best_output_kg: string;
}

export type AutocompleteSortMode = 'relevance' | 'best_speed' | 'best_output';

function buildTsQueryInput(q: string): string {
  const parts = q
    .trim()
    .split(/\s+/)
    .map((s) => s.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((p) => `${p}:*`).join(' & ');
}

function escLike(s: string): string {
  return s.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function autocompleteOrderBy(sort: AutocompleteSortMode, codeLikeParamIdx: number): string {
  const codeFirst = `CASE WHEN m.material_code ILIKE $${codeLikeParamIdx} ESCAPE '\\' THEN 0 ELSE 1 END`;
  if (sort === 'best_speed') {
    return `${codeFirst},
            COALESCE(MAX(pc.actual_speed) FILTER (WHERE pc.actual_speed IS NOT NULL), 0) DESC NULLS LAST,
            m.material_code`;
  }
  if (sort === 'best_output') {
    return `${codeFirst},
            (
              COALESCE(MAX(pc.output_km_per_shift) FILTER (WHERE pc.output_km_per_shift IS NOT NULL), 0) * 1000000.0
              + COALESCE(MAX(pc.output_kg_per_shift) FILTER (WHERE pc.output_kg_per_shift IS NOT NULL), 0)
            ) DESC NULLS LAST,
            m.material_code`;
  }
  return `${codeFirst},
          COUNT(DISTINCT pc.plant_id) DESC,
          m.material_code`;
}

const autocompleteAggSelect = `
                COUNT(DISTINCT pc.plant_id)::text AS plant_count,
                COUNT(DISTINCT pc.machine_id)::text AS machine_count,
                COALESCE(MAX(pc.actual_speed) FILTER (WHERE pc.actual_speed IS NOT NULL), 0)::text AS best_actual,
                COALESCE(MAX(pc.output_km_per_shift) FILTER (WHERE pc.output_km_per_shift IS NOT NULL), 0)::text AS best_output_km,
                COALESCE(MAX(pc.output_kg_per_shift) FILTER (WHERE pc.output_kg_per_shift IS NOT NULL), 0)::text AS best_output_kg`;

export async function searchAutocomplete(
  client: PoolClient,
  params: { q: string; step: string | null; limit: number; sort?: AutocompleteSortMode }
): Promise<AutocompleteRow[]> {
  const { q, step, limit } = params;
  const sort: AutocompleteSortMode = params.sort ?? 'relevance';
  const likePrefix = `${escLike(q)}%`;
  const likeAny = `%${escLike(q)}%`;
  const tsInput = buildTsQueryInput(q);

  const baseFrom = `
    FROM materials m
    JOIN process_steps ps ON ps.id = m.process_step_id
    LEFT JOIN production_capabilities pc ON pc.material_id = m.id
    WHERE ($2::text IS NULL OR ps.code = $2)
  `;

  if (tsInput) {
    try {
      const orderBy = autocompleteOrderBy(sort, 4);
      const sql =
        `SELECT m.id, m.material_code, m.material_description,
                ps.code AS process_step_code, ps.name AS process_step_name,
                ${autocompleteAggSelect}
         ${baseFrom}
         AND (
           m.search_vector @@ to_tsquery('simple', $3)
           OR m.material_code ILIKE $4 ESCAPE '\\'
           OR m.material_description ILIKE $5 ESCAPE '\\'
         )
         GROUP BY m.id, m.material_code, m.material_description, ps.code, ps.name, ps.id
         ORDER BY ${orderBy}
         LIMIT $1`;
      const r = await client.query<AutocompleteRow>(sql, [
        limit,
        step,
        tsInput,
        likePrefix,
        likeAny,
      ]);
      return r.rows;
    } catch {
      /* to_tsquery / search_vector — fallback ILIKE */
    }
  }

  const orderIlike = autocompleteOrderBy(sort, 3);
  const sqlIlike = `
    SELECT m.id, m.material_code, m.material_description,
           ps.code AS process_step_code, ps.name AS process_step_name,
           ${autocompleteAggSelect}
    ${baseFrom}
    AND (
      m.material_code ILIKE $3 ESCAPE '\\'
      OR m.material_description ILIKE $4 ESCAPE '\\'
    )
    GROUP BY m.id, m.material_code, m.material_description, ps.code, ps.name, ps.id
    ORDER BY ${orderIlike}
    LIMIT $1`;

  const r2 = await client.query<AutocompleteRow>(sqlIlike, [
    limit,
    step,
    likePrefix,
    likeAny,
  ]);
  return r2.rows;
}

export interface CapabilityRawRow {
  capability_id: number;
  material_code: string;
  material_description: string;
  process_step_code: string;
  process_step_name: string;
  plant_id: number;
  plant_code: string;
  plant_name: string;
  machine_id: number;
  machine_type: string;
  design_speed: string | null;
  actual_speed: string | null;
  actual_speed_ms: string | null;
  output_km_per_shift: string | null;
  output_kg_per_shift: string | null;
  is_recommended: boolean;
}

export async function fetchCapabilitiesForMaterial(
  client: PoolClient,
  materialId: number
): Promise<CapabilityRawRow[]> {
  const r = await client.query<CapabilityRawRow>(
    `SELECT
      pc.id                   AS capability_id,
      m.material_code,
      m.material_description,
      ps.code                 AS process_step_code,
      ps.name                 AS process_step_name,
      p.id                    AS plant_id,
      p.code                  AS plant_code,
      p.name                  AS plant_name,
      mc.id                   AS machine_id,
      mc.machine_type,
      pc.design_speed::text,
      pc.actual_speed::text,
      pc.actual_speed_ms::text,
      pc.output_km_per_shift::text,
      pc.output_kg_per_shift::text,
      COALESCE(pc.is_recommended, false) AS is_recommended
    FROM production_capabilities pc
    JOIN materials m      ON m.id  = pc.material_id
    JOIN process_steps ps ON ps.id = pc.process_step_id
    JOIN plants p         ON p.id  = pc.plant_id
    JOIN machines mc      ON mc.id = pc.machine_id
    WHERE pc.material_id = $1
    ORDER BY pc.is_recommended DESC, pc.actual_speed DESC NULLS LAST`,
    [materialId]
  );
  return r.rows;
}

/** Một query cho nhiều material (bulk tra cứu). */
export async function fetchCapabilitiesForMaterialIds(
  client: PoolClient,
  materialIds: number[]
): Promise<CapabilityRawRow[]> {
  if (materialIds.length === 0) return [];
  const r = await client.query<CapabilityRawRow>(
    `SELECT
      pc.id                   AS capability_id,
      m.material_code,
      m.material_description,
      ps.code                 AS process_step_code,
      ps.name                 AS process_step_name,
      p.id                    AS plant_id,
      p.code                  AS plant_code,
      p.name                  AS plant_name,
      mc.id                   AS machine_id,
      mc.machine_type,
      pc.design_speed::text,
      pc.actual_speed::text,
      pc.actual_speed_ms::text,
      pc.output_km_per_shift::text,
      pc.output_kg_per_shift::text,
      COALESCE(pc.is_recommended, false) AS is_recommended
    FROM production_capabilities pc
    JOIN materials m      ON m.id  = pc.material_id
    JOIN process_steps ps ON ps.id = pc.process_step_id
    JOIN plants p         ON p.id  = pc.plant_id
    JOIN machines mc      ON mc.id = pc.machine_id
    WHERE pc.material_id = ANY($1::int[])
    ORDER BY m.material_code, pc.is_recommended DESC, pc.actual_speed DESC NULLS LAST`,
    [materialIds]
  );
  return r.rows;
}

export interface FilterStepRow {
  code: string;
  name: string;
  material_count: string;
}

export async function fetchFilterProcessSteps(client: PoolClient): Promise<FilterStepRow[]> {
  const r = await client.query<FilterStepRow>(
    `SELECT ps.code, ps.name,
            COUNT(DISTINCT m.id)::text AS material_count
     FROM process_steps ps
     LEFT JOIN materials m ON m.process_step_id = ps.id
     GROUP BY ps.code, ps.name, ps.id
     ORDER BY ps.id`
  );
  return r.rows;
}

export interface MissingPlantRow {
  plant_id: number;
  plant_name: string;
}

export async function fetchMissingPlants(
  client: PoolClient,
  materialId: number
): Promise<MissingPlantRow[]> {
  const r = await client.query<MissingPlantRow>(
    `SELECT p.id AS plant_id, p.name AS plant_name
     FROM plants p
     WHERE p.id NOT IN (
       SELECT DISTINCT pc.plant_id
       FROM production_capabilities pc
       WHERE pc.material_id = $1
     )
     ORDER BY p.id`,
    [materialId]
  );
  return r.rows;
}

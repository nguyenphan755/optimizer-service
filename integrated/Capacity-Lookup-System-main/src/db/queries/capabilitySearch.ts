import { PoolClient } from 'pg';

export interface CapabilitySearchRow {
  id: number;
  material_code: string;
  material_description: string;
  design_speed: string | null;
  actual_speed: string | null;
  actual_speed_ms: string | null;
  output_km_per_shift: string | null;
  output_kg_per_shift: string | null;
  machine_type: string;
  plant_id: number;
  plant_code: string;
  plant_name: string;
  process_step_id: number;
  process_step_code: string;
  process_step_name: string;
}

export async function searchCapabilities(
  client: PoolClient,
  q: string | undefined,
  limit: number
): Promise<CapabilitySearchRow[]> {
  const lim = Math.min(Math.max(limit || 100, 1), 500);
  const term = (q ?? '').trim();

  if (!term) {
    const r = await client.query<CapabilitySearchRow>(
      `SELECT pc.id,
              m.material_code, m.material_description,
              pc.design_speed::text, pc.actual_speed::text, pc.actual_speed_ms::text,
              pc.output_km_per_shift::text, pc.output_kg_per_shift::text,
              ma.machine_type,
              pl.id AS plant_id, pl.code AS plant_code, pl.name AS plant_name,
              ps.id AS process_step_id, ps.code AS process_step_code, ps.name AS process_step_name
       FROM production_capabilities pc
       JOIN materials m ON m.id = pc.material_id
       JOIN machines ma ON ma.id = pc.machine_id
       JOIN plants pl ON pl.id = pc.plant_id
       JOIN process_steps ps ON ps.id = pc.process_step_id
       ORDER BY pc.id ASC
       LIMIT $1`,
      [lim]
    );
    return r.rows;
  }

  const like = `%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
  const r = await client.query<CapabilitySearchRow>(
    `SELECT pc.id,
            m.material_code, m.material_description,
            pc.design_speed::text, pc.actual_speed::text, pc.actual_speed_ms::text,
            pc.output_km_per_shift::text, pc.output_kg_per_shift::text,
            ma.machine_type,
            pl.id AS plant_id, pl.code AS plant_code, pl.name AS plant_name,
            ps.id AS process_step_id, ps.code AS process_step_code, ps.name AS process_step_name
     FROM production_capabilities pc
     JOIN materials m ON m.id = pc.material_id
     JOIN machines ma ON ma.id = pc.machine_id
     JOIN plants pl ON pl.id = pc.plant_id
     JOIN process_steps ps ON ps.id = pc.process_step_id
     WHERE m.material_code ILIKE $1 ESCAPE '\\'
        OR m.material_description ILIKE $1 ESCAPE '\\'
     ORDER BY pc.id ASC
     LIMIT $2`,
    [like, lim]
  );
  return r.rows;
}

export interface MaterialMatchRow {
  material_id: number;
  material_code: string;
  material_description: string;
  process_step_id: number;
  process_step_code: string;
  process_step_name: string;
  sheet_name: string;
}

export interface CapabilityLineRow {
  capability_id: number;
  material_id: number;
  plant_id: number;
  design_speed: string | null;
  actual_speed: string | null;
  actual_speed_ms: string | null;
  output_km_per_shift: string | null;
  output_kg_per_shift: string | null;
  machine_type: string;
}

export async function findMaterialsByExactCode(
  client: PoolClient,
  materialCode: string
): Promise<MaterialMatchRow[]> {
  const r = await client.query<MaterialMatchRow>(
    `SELECT m.id AS material_id, m.material_code, m.material_description,
            ps.id AS process_step_id, ps.code AS process_step_code,
            ps.name AS process_step_name, ps.sheet_name
     FROM materials m
     JOIN process_steps ps ON ps.id = m.process_step_id
     WHERE m.material_code = $1
     ORDER BY ps.id ASC`,
    [materialCode]
  );
  return r.rows;
}

export async function findCapabilitiesForMaterialIds(
  client: PoolClient,
  materialIds: number[]
): Promise<CapabilityLineRow[]> {
  if (materialIds.length === 0) return [];
  const r = await client.query<CapabilityLineRow>(
    `SELECT pc.id AS capability_id, pc.material_id,
            pc.plant_id,
            pc.design_speed::text, pc.actual_speed::text, pc.actual_speed_ms::text,
            pc.output_km_per_shift::text, pc.output_kg_per_shift::text,
            ma.machine_type
     FROM production_capabilities pc
     JOIN machines ma ON ma.id = pc.machine_id
     WHERE pc.material_id = ANY($1::int[])
     ORDER BY pc.plant_id ASC, ma.machine_type ASC`,
    [materialIds]
  );
  return r.rows;
}

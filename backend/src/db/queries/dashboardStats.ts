import { PoolClient } from 'pg';

export interface DashboardOverviewRow {
  total_materials: number;
  materials_with_capability: number;
  materials_complete: number;
  total_machines: number;
  missing_reports: number;
  import_jobs_active: number;
}

export interface MachineByProcessRow {
  process_code: string;
  process_name: string;
  machine_count: number;
}

export interface PlantSummaryStatRow {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  machine_count: number;
  capability_rows: number;
  materials_with_data: number;
  process_count: number;
}

export async function getDashboardOverview(client: PoolClient): Promise<DashboardOverviewRow> {
  const r = await client.query<DashboardOverviewRow>(
    `SELECT
       (SELECT COUNT(*)::int FROM materials) AS total_materials,
       (SELECT COUNT(DISTINCT material_id)::int FROM production_capabilities) AS materials_with_capability,
       (SELECT COUNT(DISTINCT material_id)::int
          FROM production_capabilities
         WHERE design_speed IS NOT NULL
           AND actual_speed IS NOT NULL
           AND output_km_per_shift IS NOT NULL
       ) AS materials_complete,
       (SELECT COUNT(*)::int FROM machines) AS total_machines,
       (SELECT COUNT(*)::int FROM missing_capability_reports) AS missing_reports,
       (SELECT COUNT(*)::int FROM import_jobs
         WHERE status IN (
           'uploaded'::import_status,
           'validating'::import_status,
           'awaiting_conflict_resolution'::import_status,
           'processing'::import_status
         )) AS import_jobs_active`
  );
  return r.rows[0];
}

export async function getMachinesByProcess(client: PoolClient): Promise<MachineByProcessRow[]> {
  const r = await client.query<MachineByProcessRow>(
    `SELECT ps.code AS process_code, ps.name AS process_name,
            COUNT(m.id)::int AS machine_count
     FROM machines m
     JOIN process_steps ps ON ps.id = m.process_step_id
     GROUP BY ps.id, ps.code, ps.name
     ORDER BY ps.code`
  );
  return r.rows;
}

export async function getCoverageByProcess(client: PoolClient): Promise<
  { process_code: string; process_name: string; total_materials: number; with_data: number }[]
> {
  const r = await client.query<{
    process_code: string;
    process_name: string;
    total_materials: string;
    with_data: string;
  }>(
    `SELECT ps.code AS process_code, ps.name AS process_name,
            COUNT(DISTINCT m.id)::text AS total_materials,
            COUNT(DISTINCT CASE WHEN pc.id IS NOT NULL THEN m.id END)::text AS with_data
     FROM process_steps ps
     LEFT JOIN materials m ON m.process_step_id = ps.id
     LEFT JOIN production_capabilities pc
       ON pc.material_id = m.id AND pc.process_step_id = ps.id
     GROUP BY ps.id, ps.code, ps.name
     ORDER BY ps.code`
  );
  return r.rows.map((row) => ({
    process_code: row.process_code,
    process_name: row.process_name,
    total_materials: parseInt(row.total_materials, 10) || 0,
    with_data: parseInt(row.with_data, 10) || 0,
  }));
}

export async function getPlantSummaries(client: PoolClient): Promise<PlantSummaryStatRow[]> {
  const r = await client.query<{
    plant_id: string;
    plant_code: string;
    plant_name: string;
    machine_count: string;
    capability_rows: string;
    materials_with_data: string;
    process_count: string;
  }>(
    `SELECT p.id::text AS plant_id, p.code AS plant_code, p.name AS plant_name,
            COUNT(DISTINCT m.id)::text AS machine_count,
            COUNT(pc.id)::text AS capability_rows,
            COUNT(DISTINCT pc.material_id)::text AS materials_with_data,
            COUNT(DISTINCT m.process_step_id)::text AS process_count
     FROM plants p
     LEFT JOIN machines m ON m.plant_id = p.id
     LEFT JOIN production_capabilities pc ON pc.plant_id = p.id
     GROUP BY p.id, p.code, p.name
     ORDER BY p.code`
  );
  return r.rows.map((row) => ({
    plant_id: parseInt(row.plant_id, 10),
    plant_code: row.plant_code,
    plant_name: row.plant_name,
    machine_count: parseInt(row.machine_count, 10) || 0,
    capability_rows: parseInt(row.capability_rows, 10) || 0,
    materials_with_data: parseInt(row.materials_with_data, 10) || 0,
    process_count: parseInt(row.process_count, 10) || 0,
  }));
}

/** TB design_speed / actual_speed theo công đoạn (m/min) */
export async function getSpeedComparisonByProcess(
  client: PoolClient
): Promise<{ process_name: string; avg_design: number; avg_actual: number }[]> {
  const r = await client.query<{
    process_name: string;
    avg_design: string;
    avg_actual: string;
  }>(
    `SELECT ps.name AS process_name,
            COALESCE(AVG(pc.design_speed), 0)::text AS avg_design,
            COALESCE(AVG(pc.actual_speed), 0)::text AS avg_actual
     FROM production_capabilities pc
     JOIN materials m ON m.id = pc.material_id
     JOIN process_steps ps ON ps.id = m.process_step_id
     WHERE pc.design_speed IS NOT NULL AND pc.actual_speed IS NOT NULL
     GROUP BY ps.id, ps.name
     ORDER BY ps.code`
  );
  return r.rows.map((row) => ({
    process_name: row.process_name,
    avg_design: parseFloat(row.avg_design) || 0,
    avg_actual: parseFloat(row.avg_actual) || 0,
  }));
}

export interface ScatterPointRow {
  plant_name: string;
  process_name: string;
  process_code: string;
  design_speed: number | null;
  actual_speed: number;
  material_code: string;
}

/** Điểm scatter đa công đoạn, tối đa n điểm */
export async function getScatterCapabilityPoints(
  client: PoolClient,
  limit = 2000
): Promise<ScatterPointRow[]> {
  const r = await client.query<{
    plant_name: string;
    process_name: string;
    process_code: string;
    design_speed: string;
    actual_speed: string;
    material_code: string;
  }>(
    `WITH ranked AS (
       SELECT pl.name AS plant_name,
              ps.name AS process_name,
              ps.code AS process_code,
              pc.design_speed::text AS design_speed,
              pc.actual_speed::text AS actual_speed,
              m.material_code,
              ROW_NUMBER() OVER (
                PARTITION BY ps.code
                ORDER BY pc.actual_speed DESC NULLS LAST, pc.id DESC
              ) AS rn
       FROM production_capabilities pc
       JOIN plants pl ON pl.id = pc.plant_id
       JOIN materials m ON m.id = pc.material_id
       JOIN process_steps ps ON ps.id = pc.process_step_id
       WHERE pc.actual_speed IS NOT NULL
     )
     SELECT plant_name, process_name, process_code, design_speed, actual_speed, material_code
     FROM ranked
     WHERE rn <= $1
     ORDER BY process_code, actual_speed::numeric DESC NULLS LAST`,
    [limit]
  );
  return r.rows.map((row) => ({
    plant_name: row.plant_name,
    process_name: row.process_name,
    process_code: row.process_code,
    design_speed:
      row.design_speed != null && row.design_speed.trim() !== ''
        ? parseFloat(row.design_speed) || null
        : null,
    actual_speed: parseFloat(row.actual_speed) || 0,
    material_code: row.material_code,
  }));
}

export interface ParetoPlantRow {
  plant_name: string;
  count: number;
}

/** Thiếu năng lực theo nhà máy (Pareto) */
export async function getParetoMissingByPlant(client: PoolClient): Promise<ParetoPlantRow[]> {
  const r = await client.query<{ plant_name: string; cnt: string }>(
    `SELECT pl.name AS plant_name, COUNT(*)::text AS cnt
     FROM missing_capability_reports mr
     JOIN plants pl ON pl.id = mr.plant_id
     GROUP BY pl.id, pl.name
     ORDER BY COUNT(*) DESC`
  );
  return r.rows.map((row) => ({
    plant_name: row.plant_name,
    count: parseInt(row.cnt, 10) || 0,
  }));
}

export interface TopMaterialRow {
  material_code: string;
  material_description: string;
  process_name: string;
  plant_name: string;
  machine_type: string;
  design_speed: number | null;
  actual_speed: number | null;
  output_km: number | null;
  status: 'complete' | 'partial';
}

export async function getTopMaterialsByActualSpeed(
  client: PoolClient,
  limit = 20
): Promise<TopMaterialRow[]> {
  const perProcessLimit = Math.max(1, Math.ceil(limit / 4));
  const r = await client.query<{
    material_code: string;
    material_description: string;
    process_name: string;
    plant_name: string;
    machine_type: string;
    design_speed: string | null;
    actual_speed: string | null;
    output_km: string | null;
  }>(
    `WITH ranked AS (
       SELECT m.material_code,
              m.material_description,
              ps.name AS process_name,
              ps.code AS process_code,
              pl.name AS plant_name,
              ma.machine_type,
              pc.design_speed::text AS design_speed,
              pc.actual_speed::text AS actual_speed,
              pc.output_km_per_shift::text AS output_km,
              ROW_NUMBER() OVER (
                PARTITION BY ps.code
                ORDER BY
                  COALESCE(pc.actual_speed, -1) DESC,
                  COALESCE(pc.design_speed, -1) DESC,
                  pc.id DESC
              ) AS rn
       FROM production_capabilities pc
       JOIN materials m ON m.id = pc.material_id
       JOIN process_steps ps ON ps.id = pc.process_step_id
       JOIN plants pl ON pl.id = pc.plant_id
       JOIN machines ma ON ma.id = pc.machine_id
     )
     SELECT material_code, material_description, process_name, plant_name, machine_type,
            design_speed, actual_speed, output_km
     FROM ranked
     WHERE rn <= $1
     ORDER BY
       process_code,
       COALESCE(actual_speed::numeric, -1) DESC,
       COALESCE(design_speed::numeric, -1) DESC
     LIMIT $2`,
    [perProcessLimit, limit]
  );
  return r.rows.map((row) => {
    const design = row.design_speed != null ? parseFloat(row.design_speed) : null;
    const actual = row.actual_speed != null ? parseFloat(row.actual_speed) : null;
    const outKm = row.output_km != null ? parseFloat(row.output_km) : null;
    const complete =
      design != null && actual != null && outKm != null;
    return {
      material_code: row.material_code,
      material_description: row.material_description,
      process_name: row.process_name,
      plant_name: row.plant_name,
      machine_type: row.machine_type,
      design_speed: design,
      actual_speed: actual,
      output_km: outKm,
      status: complete ? 'complete' : 'partial',
    };
  });
}

export interface PlantRowLite {
  id: number;
  code: string;
  name: string;
}

/** Khớp tên ngắn (Đà Nẵng), mã (DN), hoặc "Cadivi Đà Nẵng". */
export async function findPlantByQuery(client: PoolClient, q: string): Promise<PlantRowLite | null> {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const noPrefix = trimmed.replace(/^cadivi\s+/i, '').trim();
  const r = await client.query<PlantRowLite>(
    `SELECT id, code, name FROM plants
     WHERE LOWER(code) = LOWER($1)
        OR LOWER(name) = LOWER($1)
        OR LOWER(name) = LOWER($2)
     LIMIT 1`,
    [trimmed, noPrefix]
  );
  return r.rows[0] ?? null;
}

export interface PlantDetailKpisRow {
  total_materials: number;
  materials_with_data: number;
  machine_count: number;
  process_count: number;
}

export async function getPlantDetailKpis(client: PoolClient, plantId: number): Promise<PlantDetailKpisRow> {
  const r = await client.query<{
    total_materials: string;
    materials_with_data: string;
    machine_count: string;
    process_count: string;
  }>(
    `WITH total AS (SELECT COUNT(*)::text AS c FROM materials)
     SELECT t.c AS total_materials,
            (SELECT COUNT(DISTINCT pc.material_id)::text FROM production_capabilities pc WHERE pc.plant_id = $1) AS materials_with_data,
            (SELECT COUNT(*)::text FROM machines m WHERE m.plant_id = $1) AS machine_count,
            (SELECT COUNT(DISTINCT m.process_step_id)::text FROM machines m WHERE m.plant_id = $1) AS process_count
     FROM total t`,
    [plantId]
  );
  const row = r.rows[0];
  return {
    total_materials: parseInt(row?.total_materials ?? '0', 10) || 0,
    materials_with_data: parseInt(row?.materials_with_data ?? '0', 10) || 0,
    machine_count: parseInt(row?.machine_count ?? '0', 10) || 0,
    process_count: parseInt(row?.process_count ?? '0', 10) || 0,
  };
}

export interface PlantProcessCoverageRow {
  process_name: string;
  coverage_percent: number;
}

export async function getPlantCoverageByProcess(
  client: PoolClient,
  plantId: number
): Promise<PlantProcessCoverageRow[]> {
  const r = await client.query<{ process_name: string; total: string; with_data: string }>(
    `SELECT ps.name AS process_name,
            COUNT(DISTINCT m.id)::text AS total,
            COUNT(DISTINCT CASE WHEN pc.id IS NOT NULL THEN m.id END)::text AS with_data
     FROM process_steps ps
     LEFT JOIN materials m ON m.process_step_id = ps.id
     LEFT JOIN production_capabilities pc ON pc.material_id = m.id AND pc.plant_id = $1
     GROUP BY ps.id, ps.name
     ORDER BY ps.code`,
    [plantId]
  );
  return r.rows.map((row) => {
    const total = parseInt(row.total, 10) || 0;
    const withData = parseInt(row.with_data, 10) || 0;
    const pct = total > 0 ? Math.min(100, Math.round((100 * withData) / total)) : 0;
    return { process_name: row.process_name, coverage_percent: pct };
  });
}

export interface PlantTopMachineRow {
  machine_type: string;
  actual_speed: number;
  process_name: string;
}

export async function getPlantTopMachines(
  client: PoolClient,
  plantId: number,
  limit = 10
): Promise<PlantTopMachineRow[]> {
  const r = await client.query<{ machine_type: string; mx: string; process_name: string }>(
    `SELECT ma.machine_type,
            MAX(pc.actual_speed::numeric)::text AS mx,
            ps.name AS process_name
     FROM machines ma
     JOIN process_steps ps ON ps.id = ma.process_step_id
     JOIN production_capabilities pc ON pc.machine_id = ma.id AND pc.plant_id = ma.plant_id
     WHERE ma.plant_id = $1 AND pc.actual_speed IS NOT NULL
     GROUP BY ma.id, ma.machine_type, ps.name
     ORDER BY MAX(pc.actual_speed::numeric) DESC NULLS LAST
     LIMIT $2`,
    [plantId, limit]
  );
  return r.rows.map((row) => ({
    machine_type: row.machine_type,
    actual_speed: parseFloat(row.mx) || 0,
    process_name: row.process_name,
  }));
}

export interface PlantMachineAggRow {
  process_name: string;
  machine_type: string;
  avg_design: number;
  avg_actual: number;
  avg_out_km: number;
  avg_out_kg: number;
  material_count: number;
}

export async function getPlantMachinesAggregated(
  client: PoolClient,
  plantId: number
): Promise<PlantMachineAggRow[]> {
  const r = await client.query<{
    process_name: string;
    machine_type: string;
    avg_design: string;
    avg_actual: string;
    avg_out_km: string;
    avg_out_kg: string;
    material_count: string;
  }>(
    `SELECT ps.name AS process_name,
            ma.machine_type,
            COALESCE(AVG(pc.design_speed) FILTER (WHERE pc.design_speed IS NOT NULL), 0)::text AS avg_design,
            COALESCE(AVG(pc.actual_speed) FILTER (WHERE pc.actual_speed IS NOT NULL), 0)::text AS avg_actual,
            COALESCE(AVG(pc.output_km_per_shift) FILTER (WHERE pc.output_km_per_shift IS NOT NULL), 0)::text AS avg_out_km,
            COALESCE(AVG(pc.output_kg_per_shift) FILTER (WHERE pc.output_kg_per_shift IS NOT NULL), 0)::text AS avg_out_kg,
            COUNT(DISTINCT pc.material_id)::text AS material_count
     FROM machines ma
     JOIN process_steps ps ON ps.id = ma.process_step_id
     LEFT JOIN production_capabilities pc ON pc.machine_id = ma.id AND pc.plant_id = ma.plant_id
     WHERE ma.plant_id = $1
     GROUP BY ma.id, ma.machine_type, ps.name, ps.code
     ORDER BY ps.code, ma.machine_type`,
    [plantId]
  );
  return r.rows.map((row) => ({
    process_name: row.process_name,
    machine_type: row.machine_type,
    avg_design: parseFloat(row.avg_design) || 0,
    avg_actual: parseFloat(row.avg_actual) || 0,
    avg_out_km: parseFloat(row.avg_out_km) || 0,
    avg_out_kg: parseFloat(row.avg_out_kg) || 0,
    material_count: parseInt(row.material_count, 10) || 0,
  }));
}

export interface PlantMissingSampleRow {
  material_code: string;
  process_name: string;
}

export async function getPlantMissingMaterialSamples(
  client: PoolClient,
  plantId: number,
  limit = 40
): Promise<PlantMissingSampleRow[]> {
  const r = await client.query<{ material_code: string; process_name: string }>(
    `SELECT m.material_code, ps.name AS process_name
     FROM missing_capability_reports mr
     JOIN materials m ON m.id = mr.material_id
     JOIN process_steps ps ON ps.id = m.process_step_id
     WHERE mr.plant_id = $1
     ORDER BY mr.last_reported_at DESC
     LIMIT $2`,
    [plantId, limit]
  );
  return r.rows;
}

/** Máy có ít nhất một bản ghi năng lực vs tổng máy — theo nhà máy. */
export async function getMachineActiveByPlant(
  client: PoolClient
): Promise<{ plant_name: string; total: number; with_data: number }[]> {
  const r = await client.query<{ plant_name: string; total: string; with_data: string }>(
    `SELECT pl.name AS plant_name,
            COUNT(DISTINCT m.id)::text AS total,
            COUNT(DISTINCT CASE WHEN EXISTS (
              SELECT 1 FROM production_capabilities pc WHERE pc.machine_id = m.id
            ) THEN m.id END)::text AS with_data
     FROM plants pl
     LEFT JOIN machines m ON m.plant_id = pl.id
     GROUP BY pl.id, pl.name
     ORDER BY pl.code`
  );
  return r.rows.map((row) => ({
    plant_name: row.plant_name,
    total: parseInt(row.total, 10) || 0,
    with_data: parseInt(row.with_data, 10) || 0,
  }));
}

/** TB + max tốc độ, max sản lượng (km/kg per shift) theo nhà máy — phục vụ lọc báo cáo Capacity. */
export async function getPlantAvgSpeeds(client: PoolClient): Promise<
  {
    plant_name: string;
    avg_design: number;
    avg_actual: number;
    max_actual: number;
    max_output_km: number;
    max_output_kg: number;
  }[]
> {
  const r = await client.query<{
    plant_name: string;
    d: string;
    a: string;
    max_a: string;
    max_km: string;
    max_kg: string;
  }>(
    `SELECT pl.name AS plant_name,
            COALESCE(AVG(pc.design_speed) FILTER (WHERE pc.design_speed IS NOT NULL), 0)::text AS d,
            COALESCE(AVG(pc.actual_speed) FILTER (WHERE pc.actual_speed IS NOT NULL), 0)::text AS a,
            COALESCE(MAX(pc.actual_speed) FILTER (WHERE pc.actual_speed IS NOT NULL), 0)::text AS max_a,
            COALESCE(MAX(pc.output_km_per_shift) FILTER (WHERE pc.output_km_per_shift IS NOT NULL), 0)::text AS max_km,
            COALESCE(MAX(pc.output_kg_per_shift) FILTER (WHERE pc.output_kg_per_shift IS NOT NULL), 0)::text AS max_kg
     FROM plants pl
     LEFT JOIN production_capabilities pc ON pc.plant_id = pl.id
     GROUP BY pl.id, pl.name
     ORDER BY pl.code`
  );
  return r.rows.map((row) => ({
    plant_name: row.plant_name,
    avg_design: parseFloat(row.d) || 0,
    avg_actual: parseFloat(row.a) || 0,
    max_actual: parseFloat(row.max_a) || 0,
    max_output_km: parseFloat(row.max_km) || 0,
    max_output_kg: parseFloat(row.max_kg) || 0,
  }));
}

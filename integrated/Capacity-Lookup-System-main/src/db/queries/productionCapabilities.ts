import { PoolClient } from 'pg';

export interface ExistingCapRow {
  material_code: string;
  plant_id: number;
  machine_type: string;
  design_speed: string | null;
  actual_speed: string | null;
  output_km_per_shift: string | null;
}

export async function fetchExistingCapabilitiesByMaterialCodes(
  client: PoolClient,
  materialCodes: string[]
): Promise<ExistingCapRow[]> {
  if (materialCodes.length === 0) return [];
  const r = await client.query<ExistingCapRow>(
    `SELECT m.material_code AS material_code, pc.plant_id, ma.machine_type AS machine_type,
            pc.design_speed::text AS design_speed,
            pc.actual_speed::text AS actual_speed,
            pc.output_km_per_shift::text AS output_km_per_shift
     FROM production_capabilities pc
     JOIN materials m ON m.id = pc.material_id
     JOIN machines ma ON ma.id = pc.machine_id
     WHERE m.material_code = ANY($1::text[])`,
    [materialCodes]
  );
  return r.rows;
}

export async function insertCapability(
  client: PoolClient,
  params: {
    materialId: number;
    plantId: number;
    machineId: number;
    processStepId: number;
    designSpeed: number | null;
    actualSpeed: number | null;
    outputKmPerShift: number | null;
    outputKgPerShift: number | null;
  }
): Promise<void> {
  await client.query(
    `INSERT INTO production_capabilities (
       material_id, plant_id, machine_id, process_step_id,
       design_speed, actual_speed, output_km_per_shift, output_kg_per_shift, source
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'import')
     ON CONFLICT (material_id, plant_id, machine_id) DO NOTHING`,
    [
      params.materialId,
      params.plantId,
      params.machineId,
      params.processStepId,
      params.designSpeed,
      params.actualSpeed,
      params.outputKmPerShift,
      params.outputKgPerShift,
    ]
  );
}

export async function updateCapabilityByKeys(
  client: PoolClient,
  params: {
    materialId: number;
    plantId: number;
    machineId: number;
    designSpeed: number | null;
    actualSpeed: number | null;
    outputKmPerShift: number | null;
    outputKgPerShift: number | null;
  }
): Promise<void> {
  await client.query(
    `UPDATE production_capabilities SET
       design_speed = $1,
       actual_speed = $2,
       output_km_per_shift = $3,
       output_kg_per_shift = $4,
       source = 'import',
       updated_at = now()
     WHERE material_id = $5 AND plant_id = $6 AND machine_id = $7`,
    [
      params.designSpeed,
      params.actualSpeed,
      params.outputKmPerShift,
      params.outputKgPerShift,
      params.materialId,
      params.plantId,
      params.machineId,
    ]
  );
}

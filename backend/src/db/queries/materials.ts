import { PoolClient } from 'pg';

export async function getMaterialIdByCodeAndStep(
  client: PoolClient,
  materialCode: string,
  processStepId: number
): Promise<number | null> {
  const r = await client.query<{ id: number }>(
    `SELECT id FROM materials WHERE material_code = $1 AND process_step_id = $2`,
    [materialCode, processStepId]
  );
  return r.rows[0]?.id ?? null;
}

export async function insertMaterial(
  client: PoolClient,
  materialCode: string,
  materialDescription: string,
  processStepId: number
): Promise<number> {
  const ins = await client.query<{ id: number }>(
    `INSERT INTO materials (material_code, material_description, process_step_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (material_code, process_step_id) DO NOTHING
     RETURNING id`,
    [materialCode, materialDescription, processStepId]
  );
  if (ins.rows[0]) return ins.rows[0].id;
  const sel = await client.query<{ id: number }>(
    `SELECT id FROM materials WHERE material_code = $1 AND process_step_id = $2`,
    [materialCode, processStepId]
  );
  if (!sel.rows[0]) throw new Error('insertMaterial failed');
  return sel.rows[0].id;
}

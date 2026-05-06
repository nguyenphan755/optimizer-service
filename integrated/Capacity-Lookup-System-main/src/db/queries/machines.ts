import { PoolClient } from 'pg';

export async function insertMachine(
  client: PoolClient,
  plantId: number,
  processStepId: number,
  machineType: string
): Promise<number> {
  const ins = await client.query<{ id: number }>(
    `INSERT INTO machines (plant_id, process_step_id, machine_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (plant_id, process_step_id, machine_type) DO NOTHING
     RETURNING id`,
    [plantId, processStepId, machineType]
  );
  if (ins.rows[0]) return ins.rows[0].id;
  const sel = await client.query<{ id: number }>(
    `SELECT id FROM machines WHERE plant_id = $1 AND process_step_id = $2 AND machine_type = $3`,
    [plantId, processStepId, machineType]
  );
  if (!sel.rows[0]) throw new Error('insertMachine failed');
  return sel.rows[0].id;
}

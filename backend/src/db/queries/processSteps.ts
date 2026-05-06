import { PoolClient } from 'pg';
import type { ProcessStepRow } from '../../types/masterData';

export async function listProcessSteps(client: PoolClient): Promise<ProcessStepRow[]> {
  const r = await client.query<ProcessStepRow>(
    `SELECT id, code, name, sheet_name, material_prefix FROM process_steps ORDER BY id ASC`
  );
  return r.rows;
}

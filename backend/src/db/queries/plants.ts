import { PoolClient } from 'pg';
import type { PlantRow } from '../../types/masterData';

export async function listPlants(client: PoolClient): Promise<PlantRow[]> {
  const r = await client.query<PlantRow>(
    `SELECT id, code, name FROM plants ORDER BY id ASC`
  );
  return r.rows;
}

export async function getPlantIdByName(
  client: PoolClient,
  name: string
): Promise<number | null> {
  const r = await client.query<{ id: number }>(
    `SELECT id FROM plants WHERE name = $1`,
    [name]
  );
  return r.rows[0]?.id ?? null;
}

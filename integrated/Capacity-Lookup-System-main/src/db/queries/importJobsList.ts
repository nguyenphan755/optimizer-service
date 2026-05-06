import { PoolClient } from 'pg';
import type { ImportStatus } from '../../types/masterData';

export interface ImportJobListRow {
  id: number;
  filename: string;
  status: ImportStatus;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  conflict_rows: number;
  created_at: string;
  finished_at: string | null;
}

export async function listImportJobs(
  client: PoolClient,
  params: { limit: number; offset: number; status?: string | null }
): Promise<{ rows: ImportJobListRow[]; total: number }> {
  const limit = Math.min(Math.max(params.limit, 1), 200);
  const offset = Math.max(params.offset, 0);
  const statusFilter = params.status?.trim() || null;

  const where: string[] = ['1=1'];
  const args: unknown[] = [];
  let i = 1;
  if (statusFilter) {
    where.push(`status::text = $${i++}`);
    args.push(statusFilter);
  }

  const whereSql = where.join(' AND ');

  const countR = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM import_jobs WHERE ${whereSql}`,
    args
  );
  const total = parseInt(countR.rows[0]?.c ?? '0', 10) || 0;

  args.push(limit, offset);
  const listR = await client.query<ImportJobListRow>(
    `SELECT id, filename, status::text AS status, total_rows, success_rows, error_rows, conflict_rows,
            created_at::text AS created_at,
            finished_at::text AS finished_at
     FROM import_jobs
     WHERE ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${i++} OFFSET $${i}`,
    args
  );

  return { rows: listR.rows, total };
}

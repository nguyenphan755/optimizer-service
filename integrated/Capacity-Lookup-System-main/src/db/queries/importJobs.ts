import { PoolClient } from 'pg';
import type { ImportStatus } from '../../types/masterData';

export interface ImportJobRow {
  id: number;
  filename: string;
  file_path: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  conflict_rows: number;
  conflict_action: string | null;
  status: ImportStatus;
  created_by: number | null;
  created_at: Date;
  finished_at: Date | null;
}

export async function createImportJob(
  client: PoolClient,
  filename: string,
  filePath: string
): Promise<number> {
  const r = await client.query<{ id: number }>(
    `INSERT INTO import_jobs (filename, file_path, status)
     VALUES ($1, $2, 'uploaded')
     RETURNING id`,
    [filename, filePath]
  );
  return r.rows[0].id;
}

export async function updateJobValidating(client: PoolClient, jobId: number): Promise<void> {
  await client.query(`UPDATE import_jobs SET status = 'validating' WHERE id = $1`, [jobId]);
}

export async function updateJobAfterValidation(
  client: PoolClient,
  jobId: number,
  fields: {
    total_rows: number;
    error_rows: number;
    conflict_rows: number;
    status: ImportStatus;
  }
): Promise<void> {
  await client.query(
    `UPDATE import_jobs SET
       total_rows = $2,
       error_rows = $3,
       conflict_rows = $4,
       status = $5::import_status
     WHERE id = $1`,
    [jobId, fields.total_rows, fields.error_rows, fields.conflict_rows, fields.status]
  );
}

export async function setJobProcessing(
  client: PoolClient,
  jobId: number,
  conflictAction: 'overwrite' | 'skip' | null
): Promise<void> {
  await client.query(
    `UPDATE import_jobs SET
       status = 'processing'::import_status,
       conflict_action = $2
     WHERE id = $1`,
    [jobId, conflictAction]
  );
}

export async function updateJobProgress(
  client: PoolClient,
  jobId: number,
  successRows: number,
  errorRows: number
): Promise<void> {
  await client.query(
    `UPDATE import_jobs SET success_rows = $2, error_rows = $3 WHERE id = $1`,
    [jobId, successRows, errorRows]
  );
}

export async function finishJob(
  client: PoolClient,
  jobId: number,
  status: 'done' | 'partial_error' | 'failed',
  successRows: number,
  errorRows: number
): Promise<void> {
  await client.query(
    `UPDATE import_jobs SET
       status = $2::import_status,
       success_rows = $3,
       error_rows = $4,
       finished_at = now()
     WHERE id = $1`,
    [jobId, status, successRows, errorRows]
  );
}

export async function getJobById(
  client: PoolClient,
  jobId: number
): Promise<ImportJobRow | null> {
  const r = await client.query<ImportJobRow>(
    `SELECT id, filename, file_path, total_rows, success_rows, error_rows, conflict_rows,
            conflict_action, status::text AS status, created_by, created_at, finished_at
     FROM import_jobs WHERE id = $1`,
    [jobId]
  );
  return r.rows[0] ?? null;
}

export async function bulkInsertImportErrors(
  client: PoolClient,
  jobId: number,
  rows: Array<{
    sheet_name: string | null;
    row_number: number | null;
    material_code: string | null;
    column_name: string | null;
    raw_value: string | null;
    error_message: string;
  }>
): Promise<void> {
  for (const row of rows) {
    await client.query(
      `INSERT INTO import_errors (job_id, sheet_name, row_number, material_code, column_name, raw_value, error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        jobId,
        row.sheet_name,
        row.row_number,
        row.material_code,
        row.column_name,
        row.raw_value,
        row.error_message,
      ]
    );
  }
}

export async function bulkInsertImportConflicts(
  client: PoolClient,
  rows: Array<{
    job_id: number;
    sheet_name: string;
    row_number: number;
    material_code: string;
    factory_name: string;
    machine_type: string;
    existing_design_speed: number | null;
    existing_actual_speed: number | null;
    existing_output_km: number | null;
    incoming_design_speed: number | null;
    incoming_actual_speed: number | null;
    incoming_output_km: number | null;
  }>
): Promise<void> {
  for (const row of rows) {
    await client.query(
      `INSERT INTO import_conflicts (
         job_id, sheet_name, row_number, material_code, factory_name, machine_type,
         existing_design_speed, existing_actual_speed, existing_output_km,
         incoming_design_speed, incoming_actual_speed, incoming_output_km
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        row.job_id,
        row.sheet_name,
        row.row_number,
        row.material_code,
        row.factory_name,
        row.machine_type,
        row.existing_design_speed,
        row.existing_actual_speed,
        row.existing_output_km,
        row.incoming_design_speed,
        row.incoming_actual_speed,
        row.incoming_output_km,
      ]
    );
  }
}

export async function listImportErrors(
  client: PoolClient,
  jobId: number,
  limit?: number
): Promise<
  Array<{
    sheet_name: string | null;
    row_number: number | null;
    material_code: string | null;
    column_name: string | null;
    raw_value: string | null;
    error_message: string;
  }>
> {
  const lim = limit ?? 10000;
  const r = await client.query(
    `SELECT sheet_name, row_number, material_code, column_name, raw_value, error_message
     FROM import_errors WHERE job_id = $1 ORDER BY id ASC LIMIT $2`,
    [jobId, lim]
  );
  return r.rows as Array<{
    sheet_name: string | null;
    row_number: number | null;
    material_code: string | null;
    column_name: string | null;
    raw_value: string | null;
    error_message: string;
  }>;
}

export async function listImportConflicts(client: PoolClient, jobId: number) {
  const r = await client.query(
    `SELECT id, sheet_name, row_number, material_code, factory_name, machine_type,
            existing_design_speed, existing_actual_speed, existing_output_km,
            incoming_design_speed, incoming_actual_speed, incoming_output_km
     FROM import_conflicts WHERE job_id = $1 ORDER BY id ASC`,
    [jobId]
  );
  return r.rows;
}

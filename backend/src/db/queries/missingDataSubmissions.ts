import { PoolClient } from 'pg';

export interface TemplateRowDb {
  sheet_name: string;
  material_code: string;
  material_description: string;
  plant_name: string;
}

export async function listMissingTemplateRows(
  client: PoolClient,
  plantId: number
): Promise<TemplateRowDb[]> {
  const r = await client.query<TemplateRowDb>(
    `SELECT ps.sheet_name,
            m.material_code,
            m.material_description,
            pl.name AS plant_name
     FROM missing_capability_reports mr
     JOIN materials m ON m.id = mr.material_id
     JOIN process_steps ps ON ps.id = m.process_step_id
     JOIN plants pl ON pl.id = mr.plant_id
     WHERE mr.plant_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM production_capabilities pc
         WHERE pc.material_id = mr.material_id AND pc.plant_id = mr.plant_id
       )
     ORDER BY ps.sheet_name, m.material_code`,
    [plantId]
  );
  return r.rows;
}

export interface SubmissionListRow {
  id: number;
  plant_id: number;
  plant_name: string;
  original_filename: string;
  stored_path: string;
  template_row_hint: number;
  submitter_note: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_label: string | null;
  rejection_reason: string | null;
  /** JWT username khi reject (migration 010). */
  reviewer_mes_username: string | null;
  /** Admin | Head Office | User — theo JWT khi reject. */
  reviewer_access_label: string | null;
  import_job_id: number | null;
  import_job_status: string | null;
  import_finished_at: string | null;
  import_job_created_at: string | null;
}

export async function insertSubmission(
  client: PoolClient,
  params: {
    plant_id: number;
    original_filename: string;
    stored_path: string;
    template_row_hint: number;
    submitter_note: string | null;
  }
): Promise<{ id: number; created_at: string }> {
  const r = await client.query<{ id: number; created_at: string }>(
    `INSERT INTO missing_data_submissions
       (plant_id, original_filename, stored_path, template_row_hint, submitter_note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at::text AS created_at`,
    [
      params.plant_id,
      params.original_filename,
      params.stored_path,
      params.template_row_hint,
      params.submitter_note,
    ]
  );
  return r.rows[0];
}

export async function listSubmissions(
  client: PoolClient,
  params: {
    plantId: number | null;
    status: string | null;
    limit: number;
    offset: number;
  }
): Promise<{ rows: SubmissionListRow[]; total: number }> {
  const where: string[] = ['1=1'];
  const args: unknown[] = [];
  let i = 1;
  if (params.plantId !== null) {
    where.push(`s.plant_id = $${i++}`);
    args.push(params.plantId);
  }
  if (params.status) {
    where.push(`s.status::text = $${i++}`);
    args.push(params.status);
  }
  const whereSql = where.join(' AND ');

  const countR = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM missing_data_submissions s
     WHERE ${whereSql}`,
    args
  );
  const total = parseInt(countR.rows[0]?.c ?? '0', 10) || 0;

  args.push(params.limit, params.offset);
  const listR = await client.query<SubmissionListRow>(
    `SELECT s.id, s.plant_id, pl.name AS plant_name, s.original_filename, s.stored_path,
            s.template_row_hint, s.submitter_note, s.status::text AS status,
            s.created_at::text AS created_at,
            s.reviewed_at::text AS reviewed_at,
            s.reviewer_label, s.rejection_reason,
            s.reviewer_mes_username, s.reviewer_access_label,
            s.import_job_id,
            j.status::text AS import_job_status,
            j.finished_at::text AS import_finished_at,
            j.created_at::text AS import_job_created_at
     FROM missing_data_submissions s
     JOIN plants pl ON pl.id = s.plant_id
     LEFT JOIN import_jobs j ON j.id = s.import_job_id
     WHERE ${whereSql}
     ORDER BY s.created_at DESC
     LIMIT $${i++} OFFSET $${i}`,
    args
  );

  return { rows: listR.rows, total };
}

export async function getSubmissionById(
  client: PoolClient,
  id: number
): Promise<SubmissionListRow | null> {
  const r = await client.query<SubmissionListRow>(
    `SELECT s.id, s.plant_id, pl.name AS plant_name, s.original_filename, s.stored_path,
            s.template_row_hint, s.submitter_note, s.status::text AS status,
            s.created_at::text AS created_at,
            s.reviewed_at::text AS reviewed_at,
            s.reviewer_label, s.rejection_reason,
            s.reviewer_mes_username, s.reviewer_access_label,
            s.import_job_id,
            j.status::text AS import_job_status,
            j.finished_at::text AS import_finished_at,
            j.created_at::text AS import_job_created_at
     FROM missing_data_submissions s
     JOIN plants pl ON pl.id = s.plant_id
     LEFT JOIN import_jobs j ON j.id = s.import_job_id
     WHERE s.id = $1`,
    [id]
  );
  return r.rows[0] ?? null;
}

export async function updateSubmissionRejected(
  client: PoolClient,
  id: number,
  reviewerLabel: string,
  reason: string,
  reviewerMesUsername: string | null,
  reviewerAccessLabel: string | null
): Promise<boolean> {
  const r = await client.query(
    `UPDATE missing_data_submissions
     SET status = 'rejected',
         reviewed_at = now(),
         reviewer_label = $2,
         rejection_reason = $3,
         reviewer_mes_username = $4,
         reviewer_access_label = $5
     WHERE id = $1 AND status = 'pending_review'`,
    [id, reviewerLabel, reason, reviewerMesUsername, reviewerAccessLabel]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function updateSubmissionImportStarted(
  client: PoolClient,
  id: number,
  reviewerLabel: string,
  importJobId: number
): Promise<boolean> {
  const r = await client.query(
    `UPDATE missing_data_submissions
     SET status = 'import_started',
         reviewed_at = now(),
         reviewer_label = $2,
         import_job_id = $3,
         rejection_reason = NULL
     WHERE id = $1 AND status = 'pending_review'`,
    [id, reviewerLabel, importJobId]
  );
  return (r.rowCount ?? 0) > 0;
}

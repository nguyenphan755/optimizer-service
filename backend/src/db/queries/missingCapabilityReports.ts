import { PoolClient } from 'pg';

export interface MissingReportRow {
  id: number;
  material_id: number;
  plant_id: number;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
}

export async function upsertMissingCapabilityReport(
  client: PoolClient,
  params: { material_id: number; plant_id: number; note: string | null }
): Promise<MissingReportRow> {
  const r = await client.query<MissingReportRow>(
    `INSERT INTO missing_capability_reports (material_id, plant_id, note)
     VALUES ($1, $2, NULLIF(trim($3::text), ''))
     ON CONFLICT (material_id, plant_id) DO UPDATE SET
       last_reported_at = now(),
       report_count = missing_capability_reports.report_count + 1,
       note = COALESCE(
         NULLIF(trim($3::text), ''),
         missing_capability_reports.note
       )
     RETURNING id, material_id, plant_id, report_count,
               first_reported_at::text AS first_reported_at,
               last_reported_at::text AS last_reported_at`,
    [params.material_id, params.plant_id, params.note ?? '']
  );
  return r.rows[0];
}

export async function materialExists(
  client: PoolClient,
  materialId: number
): Promise<boolean> {
  const r = await client.query(`SELECT 1 FROM materials WHERE id = $1`, [materialId]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function plantExists(client: PoolClient, plantId: number): Promise<boolean> {
  const r = await client.query(`SELECT 1 FROM plants WHERE id = $1`, [plantId]);
  return r.rowCount !== null && r.rowCount > 0;
}

export interface MissingReportListRow {
  id: number;
  material_id: number;
  plant_id: number;
  material_code: string;
  material_description: string;
  plant_code: string;
  plant_name: string;
  report_count: number;
  note: string | null;
  first_reported_at: string;
  last_reported_at: string;
  /** Đã có ít nhất một bản ghi production_capabilities tại NM báo thiếu */
  has_capability_at_plant: boolean;
  /** MAX(updated_at) của năng lực tại cặp material–plant (null nếu chưa có) */
  capability_updated_at: string | null;
  /**
   * Gợi ý người liên quan cập nhật dữ liệu vào HT: ưu tiên display_name/username từ import_jobs.created_by,
   * sau đó reviewer_label (bài nộp NM), theo job import hoàn tất gần nhất sau lần báo đầu.
   */
  data_update_attributed_user: string | null;
}

export async function listMissingCapabilityReports(
  client: PoolClient,
  params: {
    plantId: number | null;
    q: string;
    limit: number;
    offset: number;
    /** false khi chưa migrate bảng missing_data_submissions (tránh lỗi 42P01). */
    includeImportAttribution?: boolean;
  }
): Promise<{ rows: MissingReportListRow[]; total: number }> {
  const plantId = params.plantId;
  const q = params.q.trim();
  const limit = Math.min(Math.max(params.limit, 1), 200);
  const offset = Math.max(params.offset, 0);

  const whereParts: string[] = ['1=1'];
  const values: unknown[] = [];
  let i = 1;

  if (plantId !== null) {
    whereParts.push(`mcr.plant_id = $${i}`);
    values.push(plantId);
    i++;
  }
  if (q.length > 0) {
    whereParts.push(
      `(m.material_code ILIKE $${i} OR m.material_description ILIKE $${i})`
    );
    values.push(`%${q}%`);
    i++;
  }

  const whereSql = whereParts.join(' AND ');
  const includeAttr = params.includeImportAttribution !== false;

  const attributionSelect = includeAttr
    ? `(SELECT COALESCE(
               NULLIF(TRIM(u.display_name), ''),
               NULLIF(TRIM(u.username), ''),
               NULLIF(TRIM(s.reviewer_label), '')
             )
             FROM missing_data_submissions s
             INNER JOIN import_jobs j ON j.id = s.import_job_id
             LEFT JOIN mes_users u ON u.id = j.created_by
             WHERE s.plant_id = mcr.plant_id
               AND j.finished_at IS NOT NULL
               AND j.finished_at >= mcr.first_reported_at
             ORDER BY j.finished_at DESC
             LIMIT 1
            ) AS data_update_attributed_user`
    : `NULL::text AS data_update_attributed_user`;

  const countR = await client.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM missing_capability_reports mcr
     JOIN materials m ON m.id = mcr.material_id
     WHERE ${whereSql}`,
    values
  );
  const total = parseInt(countR.rows[0]?.c ?? '0', 10) || 0;

  const listR = await client.query<MissingReportListRow>(
    `SELECT mcr.id,
            mcr.material_id,
            mcr.plant_id,
            m.material_code,
            m.material_description,
            p.code AS plant_code,
            p.name AS plant_name,
            mcr.report_count,
            mcr.note,
            mcr.first_reported_at::text AS first_reported_at,
            mcr.last_reported_at::text AS last_reported_at,
            EXISTS (
              SELECT 1 FROM production_capabilities pc
              WHERE pc.material_id = mcr.material_id AND pc.plant_id = mcr.plant_id
            ) AS has_capability_at_plant,
            (SELECT MAX(pc.updated_at)::text
             FROM production_capabilities pc
             WHERE pc.material_id = mcr.material_id AND pc.plant_id = mcr.plant_id
            ) AS capability_updated_at,
            ${attributionSelect}
     FROM missing_capability_reports mcr
     JOIN materials m ON m.id = mcr.material_id
     JOIN plants p ON p.id = mcr.plant_id
     WHERE ${whereSql}
     ORDER BY mcr.last_reported_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...values, limit, offset]
  );

  return { rows: listR.rows, total };
}

export interface MissingDataSummaryRow {
  total_records: number;
  total_report_events: string;
  distinct_materials: number;
}

export interface MissingDataPlantCountRow {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  record_count: number;
}

/** Tổng hợp realtime từ missing_capability_reports (không phụ thuộc phân trang) */
export async function getMissingDataSummary(client: PoolClient): Promise<{
  totals: MissingDataSummaryRow;
  by_plant: MissingDataPlantCountRow[];
}> {
  const totalsR = await client.query<MissingDataSummaryRow>(
    `SELECT
       COUNT(*)::int AS total_records,
       COALESCE(SUM(report_count), 0)::text AS total_report_events,
       COUNT(DISTINCT material_id)::int AS distinct_materials
     FROM missing_capability_reports`
  );

  const byPlantR = await client.query<{
    plant_id: number;
    plant_code: string;
    plant_name: string;
    record_count: number;
  }>(
    `SELECT p.id AS plant_id, p.code AS plant_code, p.name AS plant_name,
            COALESCE(mc.cnt, 0)::int AS record_count
     FROM plants p
     LEFT JOIN (
       SELECT plant_id, COUNT(*)::int AS cnt
       FROM missing_capability_reports
       GROUP BY plant_id
     ) mc ON mc.plant_id = p.id
     ORDER BY p.code`
  );

  const totals = totalsR.rows[0] ?? {
    total_records: 0,
    total_report_events: '0',
    distinct_materials: 0,
  };

  return { totals, by_plant: byPlantR.rows };
}

export async function deleteMissingCapabilityReportById(
  client: PoolClient,
  id: number
): Promise<boolean> {
  const r = await client.query(`DELETE FROM missing_capability_reports WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}

/** Xóa tối đa 500 id; chỉ số nguyên dương hợp lệ. */
export async function deleteMissingCapabilityReportsByIds(
  client: PoolClient,
  ids: number[]
): Promise<number> {
  const uniq = [...new Set(ids)].filter((n) => Number.isInteger(n) && n > 0).slice(0, 500);
  if (uniq.length === 0) return 0;
  const r = await client.query(`DELETE FROM missing_capability_reports WHERE id = ANY($1::int[])`, [uniq]);
  return r.rowCount ?? 0;
}

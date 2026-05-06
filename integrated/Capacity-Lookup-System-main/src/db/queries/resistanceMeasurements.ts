import { PoolClient } from 'pg';

export interface ResistanceRow {
  id: number;
  loai_sp: string;
  tiet_dien: string;
  ket_cau: string;
  plant_id: number | null;
  plant_code: string | null;
  plant_name: string | null;
  plant_code_excel: string | null;
  ca: number | null;
  observed_at: string;
  dien_tro_max: string | null;
  dien_tro_max_raw: string | null;
  dien_tro_tt: string | null;
  ty_le_dien_tro_pct: string | null;
}

export async function listResistanceByKeys(
  client: PoolClient,
  params: {
    tiet_dien: number;
    ket_cau: string;
    loai_sp: string | null;
  }
): Promise<ResistanceRow[]> {
  const { tiet_dien, ket_cau, loai_sp } = params;
  const sql =
    loai_sp === null
      ? `SELECT r.id, r.loai_sp, r.tiet_dien::text, r.ket_cau,
                r.plant_id, p.code AS plant_code, p.name AS plant_name,
                r.plant_code_excel, r.ca, r.observed_at::text,
                r.dien_tro_max::text, r.dien_tro_max_raw, r.dien_tro_tt::text,
                r.ty_le_dien_tro_pct::text
         FROM resistance_measurements r
         LEFT JOIN plants p ON p.id = r.plant_id
         WHERE r.tiet_dien = $1 AND r.ket_cau = $2
         ORDER BY r.observed_at DESC, r.id DESC`
      : `SELECT r.id, r.loai_sp, r.tiet_dien::text, r.ket_cau,
                r.plant_id, p.code AS plant_code, p.name AS plant_name,
                r.plant_code_excel, r.ca, r.observed_at::text,
                r.dien_tro_max::text, r.dien_tro_max_raw, r.dien_tro_tt::text,
                r.ty_le_dien_tro_pct::text
         FROM resistance_measurements r
         LEFT JOIN plants p ON p.id = r.plant_id
         WHERE r.tiet_dien = $1 AND r.ket_cau = $2 AND r.loai_sp = $3
         ORDER BY r.observed_at DESC, r.id DESC`;

  const args = loai_sp === null ? [tiet_dien, ket_cau] : [tiet_dien, ket_cau, loai_sp];
  const r = await client.query<ResistanceRow>(sql, args);
  return r.rows;
}

/** Đếm số dòng điện trở cho nhiều cặp (tiết diện, kết cấu) trong một query. */
export async function countResistanceRowsByKeyPairs(
  client: PoolClient,
  pairs: { tiet_dien: number; ket_cau: string }[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (pairs.length === 0) return out;
  const tiets: number[] = [];
  const kets: string[] = [];
  for (const p of pairs) {
    tiets.push(p.tiet_dien);
    kets.push(p.ket_cau);
  }
  const r = await client.query<{ tiet_dien: string; ket_cau: string; c: string }>(
    `SELECT r.tiet_dien::text, r.ket_cau, COUNT(*)::text AS c
     FROM resistance_measurements r
     JOIN unnest($1::numeric[], $2::text[]) AS u(t, k)
       ON r.tiet_dien = u.t AND r.ket_cau = u.k
     GROUP BY r.tiet_dien, r.ket_cau`,
    [tiets, kets]
  );
  for (const row of r.rows) {
    out.set(`${row.tiet_dien}|${row.ket_cau}`, parseInt(row.c, 10) || 0);
  }
  return out;
}

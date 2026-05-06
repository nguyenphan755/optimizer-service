import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { parseXoanMaterialDescription } from '../src/services/xoanDescriptionParser';
import { listResistanceByKeys } from '../src/db/queries/resistanceMeasurements';

dotenv.config();

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  const client = await pool.connect();
  try {
    const m = await client.query<{ id: number; material_description: string; step_code: string }>(
      `SELECT m.id, m.material_description, ps.code AS step_code
       FROM materials m JOIN process_steps ps ON ps.id = m.process_step_id
       WHERE m.material_code = $1`,
      ['53000261']
    );
    const mat = m.rows[0];
    console.log('=== MATERIAL ===');
    console.log(JSON.stringify(mat, null, 2));

    const parsed = parseXoanMaterialDescription(mat?.material_description ?? '');
    console.log('\n=== PARSE (xoanDescriptionParser) ===');
    console.log(JSON.stringify(parsed, null, 2));

    if (!mat || mat.step_code !== 'XOAN') {
      console.log('Không phải XOAN hoặc không có material.');
      return;
    }
    if (parsed.tiet_dien === null || parsed.ket_cau === null) {
      console.log('Parse thất bại — không tra được điện trở.');
      return;
    }

    const allSp = await listResistanceByKeys(client, {
      tiet_dien: parsed.tiet_dien,
      ket_cau: parsed.ket_cau,
      loai_sp: null,
    });
    const cccOnly = await listResistanceByKeys(client, {
      tiet_dien: parsed.tiet_dien,
      ket_cau: parsed.ket_cau,
      loai_sp: 'Ccc',
    });

    console.log('\n=== KHỚP DB (loai_sp = mọi) ===');
    console.log('row_count:', allSp.length);
    console.log('latest_observed_at:', allSp[0]?.observed_at ?? null);

    console.log('\n=== 5 dòng mới nhất (mọi Loại SP) ===');
    console.log(JSON.stringify(allSp.slice(0, 5), null, 2));

    console.log('\n=== So sánh: chỉ Loại SP = Ccc ===');
    console.log('row_count Ccc:', cccOnly.length);

    const byPlant = new Map<string, number>();
    for (const r of allSp) {
      const k = r.plant_code ?? r.plant_code_excel ?? '?';
      byPlant.set(k, (byPlant.get(k) ?? 0) + 1);
    }
    console.log('\n=== Số dòng theo nhà máy (code) ===');
    console.log(Object.fromEntries(byPlant));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

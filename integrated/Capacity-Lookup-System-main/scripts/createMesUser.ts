/**
 * Tạo user MES từ dòng lệnh (cần DB đã migrate 006).
 * Ví dụ (.env cùng thư mục integrated):
 *   MES_USER_USERNAME=nv01
 *   MES_USER_PASSWORD=matkhau_toi_thieu_8_ky_tu
 *   MES_USER_ROLE=user
 *   MES_USER_PLANT_CODE=DN
 *   MES_USER_DISPLAY_NAME=Nguyễn Văn A
 */
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  const username = (process.env.MES_USER_USERNAME || '').trim().toLowerCase();
  const password = process.env.MES_USER_PASSWORD || '';
  const roleRaw = (process.env.MES_USER_ROLE || 'user').trim().toLowerCase();
  const plantRaw = (process.env.MES_USER_PLANT_CODE || '').trim();
  const displayName = (process.env.MES_USER_DISPLAY_NAME || '').trim() || null;

  if (!username || !password) {
    console.error('Thiếu MES_USER_USERNAME hoặc MES_USER_PASSWORD trong .env');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('MES_USER_PASSWORD cần tối thiểu 8 ký tự');
    process.exit(1);
  }
  if (roleRaw !== 'admin' && roleRaw !== 'user') {
    console.error('MES_USER_ROLE phải là admin hoặc user');
    process.exit(1);
  }
  const role = roleRaw as 'admin' | 'user';

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 2,
  });

  let plantCode: string | null = null;
  if (role === 'admin') {
    plantCode = null;
  } else if (plantRaw) {
    const pr = await pool.query<{ code: string }>(
      `SELECT code FROM plants WHERE LOWER(TRIM(code)) = LOWER(TRIM($1)) LIMIT 1`,
      [plantRaw]
    );
    if (pr.rows.length === 0) {
      console.error(`plant_code "${plantRaw}" không tồn tại trong bảng plants`);
      await pool.end();
      process.exit(1);
    }
    plantCode = pr.rows[0].code;
  }

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO mes_users (username, password_hash, role, plant_code, display_name)
       VALUES ($1, $2, $3::mes_user_role, $4, $5)`,
      [username, hash, role, plantCode, displayName]
    );
    console.log(`Đã tạo user: ${username} (role=${role}${plantCode ? `, plant=${plantCode}` : ''})`);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === '23505') {
      console.error(`Username "${username}" đã tồn tại.`);
      process.exit(1);
    }
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

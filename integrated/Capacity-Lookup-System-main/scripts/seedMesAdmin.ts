/**
 * Tạo user admin nếu chưa có (bcrypt).
 *   MES_ADMIN_PASSWORD=yourSecurePass npm run seed:mes-admin
 * Mặc định dev: admin / admin123 (đổi ngay)
 */
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

dotenv.config();

async function main() {
  const username = (process.env.MES_ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.MES_ADMIN_PASSWORD || 'admin123';
  const displayName = process.env.MES_ADMIN_DISPLAY_NAME || 'Administrator';

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 2,
  });

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    const r = await client.query(
      `INSERT INTO mes_users (username, password_hash, role, display_name)
       VALUES ($1, $2, 'admin'::mes_user_role, $3)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [username, hash, displayName]
    );
    if (r.rowCount === 0) {
      console.log(`User "${username}" đã tồn tại — không ghi đè.`);
    } else {
      console.log(`Đã tạo admin: ${username} (đổi mật khẩu sau lần đăng nhập đầu).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

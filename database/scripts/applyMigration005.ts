/**
 * Áp migration 005 — bảng missing_data_submissions
 *   npm run db:migrate-005
 */
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,
  });

  const file = path.join(__dirname, 'migrations', '005_missing_data_submissions.sql');
  const sql = fs.readFileSync(file, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('OK: db/migrations/005_missing_data_submissions.sql');
    console.log(`    Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT || '5432'}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

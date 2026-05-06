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

  const seedPath = path.join(__dirname, 'seeds', '001_seed_master.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Seed 001_seed_master.sql applied.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

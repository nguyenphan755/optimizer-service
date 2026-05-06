/**
 * Import sheet DATA từ file Excel điện trở vào bảng resistance_measurements.
 *
 *   npx ts-node scripts/importResistanceExcel.ts [đường-dẫn-file.xlsx]
 * hoặc đặt RESISTANCE_EXCEL_PATH trong .env
 *
 *   --truncate   xóa hết bản ghi cũ trước khi nạp
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';

dotenv.config();

function normKey(k: string): string {
  return k
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findCol(headers: string[], ...mustInclude: string[]): string | null {
  for (const h of headers) {
    const n = normKey(h);
    if (mustInclude.every((m) => n.includes(normKey(m)))) return h;
  }
  return null;
}

function num(v: unknown): number | null {
  if (v === '' || v === undefined || v === null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
  const x = parseFloat(s);
  return Number.isFinite(x) ? x : null;
}

function parseRes(v: unknown): { n: number | null; raw: string | null } {
  if (v === '' || v === undefined || v === null) return { n: null, raw: null };
  if (typeof v === 'number' && Number.isFinite(v)) return { n: v, raw: null };
  const s = String(v).trim();
  if (s.includes('÷') || s.includes('/')) return { n: null, raw: s };
  const x = parseFloat(s.replace(',', '.'));
  return Number.isFinite(x) ? { n: x, raw: null } : { n: null, raw: s };
}

function normalizeKetCauExcel(s: string): string {
  return String(s).replace(/\r?\n/g, '').trim();
}

const PLANT_ALIASES: [string, string][] = [
  ['bn', 'BN'],
  ['bacninh', 'BN'],
  ['danang', 'DN'],
  ['da nang', 'DN'],
  ['tan a', 'TA'],
  ['taná', 'TA'],
  ['longthanh', 'LT'],
  ['long thanh', 'LT'],
];

function resolvePlantCode(raw: string, codeToId: Map<string, number>): number | null {
  const t = normKey(raw).replace(/\s/g, '');
  if (codeToId.has(t)) return codeToId.get(t)!;
  for (const [alias, code] of PLANT_ALIASES) {
    const a = alias.replace(/\s/g, '');
    if (t === a || t.includes(a)) {
      const id = codeToId.get(code.toLowerCase());
      if (id !== undefined) return id;
    }
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2).filter((a) => a !== '--truncate');
  const truncate = process.argv.includes('--truncate');
  const filePath =
    argv[0] ||
    process.env.RESISTANCE_EXCEL_PATH ||
    path.join(process.env.USERPROFILE || '', 'Downloads', 'cadivi_resistance_weight_data_v1_20260403.xlsx');

  if (!fs.existsSync(filePath)) {
    console.error('Không thấy file:', filePath);
    console.error('Truyền đường dẫn đối số hoặc RESISTANCE_EXCEL_PATH trong .env');
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 5,
  });

  const client = await pool.connect();
  try {
    const plants = await client.query<{ id: number; code: string; name: string }>(
      `SELECT id, code, name FROM plants`
    );
    const codeToId = new Map<string, number>();
    for (const p of plants.rows) {
      codeToId.set(normKey(p.code).replace(/\s/g, ''), p.id);
      codeToId.set(normKey(p.name).replace(/\s/g, ''), p.id);
    }
    if (truncate) {
      await client.query('TRUNCATE TABLE resistance_measurements RESTART IDENTITY');
      console.log('Đã TRUNCATE resistance_measurements.');
    }

    const wb = XLSX.readFile(filePath, { cellDates: true });
    const ws = wb.Sheets['DATA'];
    if (!ws) {
      console.error('Không có sheet DATA');
      process.exit(1);
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
    if (rows.length === 0) {
      console.log('Sheet DATA rỗng.');
      return;
    }

    const headers = Object.keys(rows[0]);
    const colLoai = findCol(headers, 'loại', 'sp') || findCol(headers, 'loai', 'sp');
    const colTiet = findCol(headers, 'tiết', 'diện') || findCol(headers, 'tiet', 'dien');
    const colKet = findCol(headers, 'kết', 'cấu') || findCol(headers, 'ket', 'cau');
    const colNm = findCol(headers, 'nhà', 'máy') || findCol(headers, 'nha', 'may');
    const nk = normKey;
    const colNgay = headers.find((h) => {
      const n = nk(h);
      return n.startsWith(nk('ngày')) || n === 'ngay';
    });
    const colThang = headers.find((h) => {
      const n = nk(h);
      return n.includes(nk('tháng')) || n === 'thang';
    });
    const colNam = headers.find((h) => {
      const n = nk(h);
      return n === nk('năm') || n === 'nam';
    });
    const colCa = headers.find((h) => nk(h) === 'ca');
    const colNsx = headers.find((h) => nk(h) === 'nsx');
    const colRmax = headers.find((h) => {
      const n = nk(h);
      return n.includes(nk('điện trở')) && n.includes('max');
    });
    const colRtt = headers.find((h) => {
      const n = nk(h);
      return n.includes(nk('điện trở')) && n.includes('tt') && !n.includes('max');
    });
    const colTyLe = headers.find((h) => {
      const n = nk(h);
      return n.includes(nk('tỷ lệ')) && n.includes(nk('điện trở')) && !n.includes(nk('khối'));
    });

    if (!colLoai || !colTiet || !colKet || !colNm) {
      console.error('Thiếu cột bắt buộc', { colLoai, colTiet, colKet, colNm });
      process.exit(1);
    }

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const loai = String(row[colLoai] ?? '').trim();
      const tiet = num(row[colTiet]);
      const ket = normalizeKetCauExcel(String(row[colKet] ?? ''));
      const nmRaw = String(row[colNm] ?? '').trim();
      if (!loai || tiet === null || !ket || !nmRaw) {
        skipped++;
        continue;
      }

      const plantId = resolvePlantCode(nmRaw, codeToId);
      const ca = colCa ? num(row[colCa]) : null;
      let observed: Date;
      const nsx = colNsx ? row[colNsx] : null;
      if (nsx instanceof Date && !isNaN(nsx.getTime())) {
        observed = nsx;
      } else {
        const d = colNgay ? num(row[colNgay]) : null;
        const mo = colThang ? num(row[colThang]) : null;
        const y = colNam ? num(row[colNam]) : null;
        if (y !== null && mo !== null && d !== null) {
          observed = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
        } else {
          observed = new Date(0);
        }
      }

      const rmax = colRmax ? parseRes(row[colRmax]) : { n: null, raw: null };
      const rtt = colRtt ? parseRes(row[colRtt]) : { n: null, raw: null };
      const tyLe = colTyLe ? num(row[colTyLe]) : null;

      await client.query(
        `INSERT INTO resistance_measurements (
           loai_sp, tiet_dien, ket_cau, plant_id, plant_code_excel, ca, observed_at,
           dien_tro_max, dien_tro_max_raw, dien_tro_tt, ty_le_dien_tro_pct
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          loai,
          tiet,
          ket,
          plantId,
          nmRaw,
          ca,
          observed.toISOString(),
          rmax.n,
          rmax.raw,
          rtt.n,
          tyLe,
        ]
      );
      inserted++;
    }

    console.log('Import xong:', filePath);
    console.log('  Đã chèn:', inserted, '— bỏ qua:', skipped);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

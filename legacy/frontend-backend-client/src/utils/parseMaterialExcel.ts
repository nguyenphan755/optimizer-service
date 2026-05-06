import * as XLSX from 'xlsx';

/** Giới hạn dòng dữ liệu (không tính header) — khớp backend. */
export const MAX_FILE_ROWS = 10_000;

function normHeader(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Đọc .xlsx: sheet đầu, tìm cột Material (bắt buộc) và Material description (tuỳ chọn).
 * Gom distinct theo mã — mô tả lấy lần đầu gặp.
 */
export function parseMaterialExcel(buffer: ArrayBuffer): {
  items: { material_code: string; description_file: string | null }[];
  stats: { data_rows: number; distinct_codes: number };
} {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('File không có sheet.');
  }
  const ws = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(ws, {
    header: 1,
    defval: '',
    raw: false,
  }) as (string | number | boolean)[][];

  if (matrix.length < 2) {
    throw new Error('File không có dòng dữ liệu.');
  }

  const header = matrix[0].map((c) => String(c ?? '').trim());
  let idxCode = -1;
  let idxDesc = -1;

  header.forEach((h, i) => {
    const n = normHeader(h);
    if (n === 'material' || (n.includes('material') && !n.includes('description'))) {
      if (idxCode < 0) idxCode = i;
    }
    if (n.includes('description') || n.includes('mo ta')) {
      idxDesc = i;
    }
  });

  if (idxCode < 0) {
    idxCode = 0;
  }

  const dataRowCount = matrix.length - 1;
  if (dataRowCount > MAX_FILE_ROWS) {
    throw new Error(`File vượt quá ${MAX_FILE_ROWS} dòng dữ liệu (đang có ${dataRowCount}).`);
  }

  const seen = new Map<string, string | null>();
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    const code = String(row[idxCode] ?? '')
      .trim()
      .replace(/\s/g, '');
    if (!code) continue;
    if (seen.has(code)) continue;
    const rawDesc =
      idxDesc >= 0 ? String(row[idxDesc] ?? '').trim() : '';
    seen.set(code, rawDesc.length > 0 ? rawDesc : null);
  }

  const items = Array.from(seen.entries()).map(([material_code, description_file]) => ({
    material_code,
    description_file,
  }));

  return {
    items,
    stats: { data_rows: dataRowCount, distinct_codes: items.length },
  };
}

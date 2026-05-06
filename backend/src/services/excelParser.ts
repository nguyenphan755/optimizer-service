import * as XLSX from 'xlsx';
import type { NormalizedExcelCells, ParsedExcelRow, ProcessStepRow } from '../types/masterData';

export const SHEET_NAMES = [
  'Drawing Data',
  'Stranding & Taping Data',
  'Armoring Data',
  'Sheathing Data',
] as const;

export type ExpectedSheetName = (typeof SHEET_NAMES)[number];

function normHeader(h: unknown): string {
  if (h === null || h === undefined) return '';
  return String(h).trim();
}

function rowToRecord(header: string[], row: unknown[]): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  for (let i = 0; i < header.length; i++) {
    const key = normHeader(header[i]);
    if (!key) continue;
    rec[key] = row[i] ?? null;
  }
  return rec;
}

/**
 * Excel → field nội bộ (actual_speed_ms không parse — DB generated).
 */
export function mapExcelRowToNormalizedCells(
  sheetName: string,
  raw: Record<string, unknown>
): NormalizedExcelCells {
  const isDrawing = sheetName === 'Drawing Data';
  return {
    material_code: raw['Material Code'],
    material_description: raw['Material Description'],
    design_speed: raw['Design Speed'],
    actual_speed: isDrawing ? raw['Actual Speed (m/p)'] : raw['Actual Speed'],
    output_km_per_shift: raw['Output (km/shift)'],
    output_kg_per_shift: raw['Output (kg/shift)'],
    factory: raw['Factory'],
    machine_type: raw['Machine Type'],
  };
}

export interface ParseWorkbookResult {
  rows: ParsedExcelRow[];
  missingSheets: string[];
  rowsPerSheet: Record<string, number>;
}

/**
 * Excel Xoắn/Giáp/Bọc: ô Output (km/shift) trống do merge — lấy giá trị dòng trên.
 */
function forwardFillOutputKmFromAbove(sheetRows: ParsedExcelRow[]): void {
  if (sheetRows.length === 0 || sheetRows[0].sheet_name === 'Drawing Data') return;
  let last: unknown = undefined;
  for (const row of sheetRows) {
    const v = row.cells.output_km_per_shift;
    const empty =
      v === null ||
      v === undefined ||
      v === '' ||
      (typeof v === 'string' && v.trim() === '');
    if (!empty) {
      last = v;
    } else if (last !== undefined) {
      row.cells.output_km_per_shift = last;
    }
  }
}

export function parseWorkbook(
  buffer: Buffer,
  processSteps: ProcessStepRow[]
): ParseWorkbookResult {
  const bySheet = new Map<string, ProcessStepRow>();
  for (const p of processSteps) {
    bySheet.set(p.sheet_name, p);
  }

  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const rows: ParsedExcelRow[] = [];
  const missingSheets: string[] = [];
  const rowsPerSheet: Record<string, number> = {};

  for (const name of SHEET_NAMES) {
    const ps = bySheet.get(name);
    if (!ps) continue;

    if (!wb.SheetNames.includes(name)) {
      missingSheets.push(name);
      console.warn(`[excelParser] Missing sheet (exact name): ${name}`);
      continue;
    }

    const ws = wb.Sheets[name];
    if (!ws) {
      missingSheets.push(name);
      continue;
    }

    const matrix = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      raw: true,
    }) as unknown[][];

    if (!matrix.length) {
      rowsPerSheet[name] = 0;
      continue;
    }

    const header = (matrix[0] as unknown[]).map((c) => normHeader(c));
    const sheetBatch: ParsedExcelRow[] = [];
    let dataRowCount = 0;
    for (let r = 1; r < matrix.length; r++) {
      const line = matrix[r] as unknown[];
      if (!line || line.every((c) => c === null || c === undefined || String(c).trim() === '')) {
        continue;
      }
      dataRowCount++;
      const rawRow = rowToRecord(header, line);
      const cells = mapExcelRowToNormalizedCells(name, rawRow);
      sheetBatch.push({
        sheet_name: name,
        row_number: r + 1,
        process_step_id: ps.id,
        material_prefix: ps.material_prefix,
        cells,
      });
    }
    forwardFillOutputKmFromAbove(sheetBatch);
    rows.push(...sheetBatch);
    rowsPerSheet[name] = dataRowCount;
  }

  return { rows, missingSheets, rowsPerSheet };
}

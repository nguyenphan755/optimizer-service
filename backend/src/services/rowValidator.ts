import { z } from 'zod';
import type { ParsedExcelRow, ValidatedImportRow, ValidationErrorDetail } from '../types/masterData';
import type { PlantLookupCache } from './factoryNormalizer';
import { trimMachineName } from '../utils/stringUtils';

const MATERIAL_CODE_REGEX = /^\d{8}$/;

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

const CHUA_QUY_DOI = /^chưa quy đổi$/i;

function isChuaQuyDoi(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v !== 'string') return false;
  return CHUA_QUY_DOI.test(v.trim());
}

function parseOptionalPositiveNumber(
  v: unknown,
  fieldLabel: string
): { ok: true; n: number | null } | { ok: false; message: string } {
  if (v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '') || isChuaQuyDoi(v)) {
    return { ok: true, n: null };
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v > 0) return { ok: true, n: v };
    return { ok: false, message: `${fieldLabel} phải là số dương` };
  }
  const s = String(v).trim().replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, message: `${fieldLabel} phải là số dương` };
  }
  return { ok: true, n };
}

function parseOptionalNonNegativeNumber(
  v: unknown,
  fieldLabel: string
): { ok: true; n: number | null } | { ok: false; message: string } {
  if (v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '') || isChuaQuyDoi(v)) {
    return { ok: true, n: null };
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v >= 0) return { ok: true, n: v };
    return { ok: false, message: `${fieldLabel} phải >= 0` };
  }
  const s = String(v).trim().replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, message: `${fieldLabel} phải là số >= 0` };
  }
  return { ok: true, n };
}

export function parseOutputKgNonDrawing(
  raw: unknown,
  jobId: number,
  sheet: string,
  row: number
): { value: number | null; warning?: string } {
  if (raw === null || raw === undefined || raw === '') {
    return { value: null };
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { value: raw };
  }
  const s = String(raw).trim();
  if (CHUA_QUY_DOI.test(s)) {
    return { value: null };
  }
  const n = Number(String(s).replace(',', '.'));
  if (Number.isFinite(n)) {
    return { value: n };
  }
  const w = `job=${jobId} sheet=${sheet} row=${row}: Output (kg/shift) không phải số — lưu NULL (cảnh báo)`;
  console.warn(w);
  return { value: null, warning: w };
}

export interface ValidatedRowOutput {
  ok: true;
  row: ValidatedImportRow;
  kgWarning?: string;
}

export interface ValidatedRowError {
  ok: false;
  errors: ValidationErrorDetail[];
}

export type RowValidationResult = ValidatedRowOutput | ValidatedRowError;

export function validateParsedRow(
  parsed: ParsedExcelRow,
  plants: PlantLookupCache,
  jobId: number
): RowValidationResult {
  const { sheet_name: sheetName, row_number: rowNumber, process_step_id: processStepId, cells } = parsed;
  const isDrawing = sheetName === 'Drawing Data';
  const errors: ValidationErrorDetail[] = [];

  const materialCodeRaw = cellStr(cells.material_code);
  if (!materialCodeRaw) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: null,
      column: 'Material Code',
      raw_value: cells.material_code ?? null,
      message: 'Material Code không được để trống',
    });
  } else if (!MATERIAL_CODE_REGEX.test(materialCodeRaw)) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw,
      column: 'Material Code',
      raw_value: cells.material_code ?? null,
      message: 'Material Code không hợp lệ: phải là 8 chữ số',
    });
  }
  /* Công đoạn lấy theo TÊN SHEET (process_step_id), không bắt buộc prefix mã 52/53/55/56 —
     file thực tế cadivi_master_production_data có mã nằm sheet khác prefix quy ước. */

  const desc = cellStr(cells.material_description);
  if (!desc) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Material Description',
      raw_value: cells.material_description ?? null,
      message: 'Material Description không được để trống',
    });
  } else if (desc.length > 500) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Material Description',
      raw_value: desc,
      message: 'Material Description tối đa 500 ký tự',
    });
  }

  const ds = parseOptionalPositiveNumber(cells.design_speed, 'Design Speed');
  if (!ds.ok) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Design Speed',
      raw_value: cells.design_speed ?? null,
      message: 'Design Speed phải là số dương',
    });
  }

  const actualColLabel = isDrawing ? 'Actual Speed (m/p)' : 'Actual Speed';
  const act = parseOptionalPositiveNumber(cells.actual_speed, 'Actual Speed');
  if (!act.ok) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: actualColLabel,
      raw_value: cells.actual_speed ?? null,
      message: act.message,
    });
  }

  const okm = parseOptionalNonNegativeNumber(cells.output_km_per_shift, 'Output (km/shift)');
  if (!okm.ok) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Output (km/shift)',
      raw_value: cells.output_km_per_shift ?? null,
      message: okm.message,
    });
  }

  let outputKg: number | null = null;
  let kgWarning: string | undefined;
  if (isDrawing) {
    /* File thực tế có Output (kg/shift) = 0 — chấp nhận >= 0 */
    const kg = parseOptionalNonNegativeNumber(cells.output_kg_per_shift, 'Output (kg/shift)');
    if (!kg.ok) {
      errors.push({
        sheet: sheetName,
        row: rowNumber,
        material_code: materialCodeRaw || null,
        column: 'Output (kg/shift)',
        raw_value: cells.output_kg_per_shift ?? null,
        message: kg.message,
      });
    } else {
      outputKg = kg.n;
    }
  } else {
    const kgParsed = parseOutputKgNonDrawing(cells.output_kg_per_shift, jobId, sheetName, rowNumber);
    outputKg = kgParsed.value;
    kgWarning = kgParsed.warning;
  }

  const factoryRaw = cellStr(cells.factory);
  if (!factoryRaw) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Factory',
      raw_value: cells.factory ?? null,
      message: 'Factory không được để trống',
    });
  }

  const machineTrimmed =
    cells.machine_type != null ? trimMachineName(String(cells.machine_type)) : '';
  if (!machineTrimmed) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Machine Type',
      raw_value: cells.machine_type ?? null,
      message: 'Machine Type không được để trống',
    });
  } else if (machineTrimmed.length < 2) {
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: 'Machine Type',
      raw_value: cells.machine_type ?? null,
      message: 'Machine Type phải có ít nhất 2 ký tự sau khi trim',
    });
  }

  let plantId = 0;
  let plantName = '';
  if (factoryRaw) {
    const resolved = plants.resolve(factoryRaw);
    if (!resolved) {
      errors.push({
        sheet: sheetName,
        row: rowNumber,
        material_code: materialCodeRaw || null,
        column: 'Factory',
        raw_value: factoryRaw,
        message: `Nhà máy không hợp lệ: '${factoryRaw}'`,
      });
    } else {
      plantId = resolved.plantId;
      plantName = resolved.canonicalName;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const candidate: ValidatedImportRow = {
    sheet_name: sheetName,
    row_number: rowNumber,
    material_code: materialCodeRaw,
    material_description: desc,
    design_speed: ds.ok ? ds.n : null,
    actual_speed: act.ok ? act.n : null,
    output_km_per_shift: okm.ok ? okm.n : null,
    output_kg_per_shift: outputKg,
    plant_id: plantId,
    plant_name: plantName,
    machine_type: machineTrimmed,
    process_step_id: processStepId,
    is_conflict: false,
  };

  const zodCheck = validatedImportRowSchema.safeParse(candidate);
  if (!zodCheck.success) {
    const first = zodCheck.error.errors[0];
    errors.push({
      sheet: sheetName,
      row: rowNumber,
      material_code: materialCodeRaw || null,
      column: first?.path.join('.') || 'row',
      raw_value: null,
      message: first?.message || 'Validation failed',
    });
    return { ok: false, errors };
  }

  return {
    ok: true,
    kgWarning,
    row: zodCheck.data,
  };
}

export const validatedImportRowSchema = z.object({
  sheet_name: z.string(),
  row_number: z.number().int().positive(),
  material_code: z.string().regex(MATERIAL_CODE_REGEX, 'Material Code không hợp lệ: phải là 8 chữ số'),
  material_description: z.string().min(1).max(500),
  design_speed: z.union([z.number().positive(), z.null()]),
  actual_speed: z.union([z.number().positive(), z.null()]),
  output_km_per_shift: z.union([z.number().min(0), z.null()]),
  output_kg_per_shift: z.union([z.number().min(0), z.null()]),
  plant_id: z.number().int().positive(),
  plant_name: z.string().min(1),
  machine_type: z.string().min(2),
  process_step_id: z.number().int().positive(),
  is_conflict: z.boolean(),
});

export const materialCodeSchema = z
  .string()
  .regex(MATERIAL_CODE_REGEX, 'Material Code không hợp lệ: phải là 8 chữ số');

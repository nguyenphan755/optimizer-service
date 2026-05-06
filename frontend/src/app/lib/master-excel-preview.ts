/**
 * Preview file master production (.xlsx) — logic khớp backend excelParser + cột tốc độ thực tế.
 */
import * as XLSX from "xlsx";
import type { ImportResult, ParsedProductionRecord, ValidationError } from "@/app/lib/csv-parser";

const SHEET_NAMES = [
  "Drawing Data",
  "Stranding & Taping Data",
  "Armoring Data",
  "Sheathing Data",
] as const;

const CHUA_QUY_DOI = /^chưa quy đổi$/i;

function isChuaQuyDoi(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v !== "string") return false;
  return CHUA_QUY_DOI.test(v.trim());
}

function isEmptyCell(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" || t === "-";
  }
  return false;
}

function normHeader(h: unknown): string {
  if (h === null || h === undefined) return "";
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

function forwardFillOutputKmFromAbove(
  sheetRows: Array<{ raw: Record<string, unknown>; sheet: string; rowNum: number }>
): void {
  if (sheetRows.length === 0 || sheetRows[0].sheet === "Drawing Data") return;
  let last: unknown = undefined;
  for (const item of sheetRows) {
    const raw = item.raw;
    const v = raw["Output (km/shift)"];
    const empty =
      v === null ||
      v === undefined ||
      v === "" ||
      (typeof v === "string" && v.trim() === "");
    if (!empty) {
      last = v;
    } else if (last !== undefined) {
      raw["Output (km/shift)"] = last;
    }
  }
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (isChuaQuyDoi(v)) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(/,/g, "").replace(/\s/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeFactoryName(raw: string): string {
  const t = raw.trim();
  const map: Record<string, string> = {
    "đà nẵng": "Cadivi Đà Nẵng",
    "Đà Nẵng": "Cadivi Đà Nẵng",
    "da nang": "Cadivi Đà Nẵng",
    "long thành": "Cadivi Long Thành",
    "Long Thành": "Cadivi Long Thành",
    "long thanh": "Cadivi Long Thành",
    "tân á": "Cadivi Tân Á",
    "Tân Á": "Cadivi Tân Á",
    "tan a": "Cadivi Tân Á",
    "bắc ninh": "Cadivi Bắc Ninh",
    "Bắc Ninh": "Cadivi Bắc Ninh",
    "bac ninh": "Cadivi Bắc Ninh",
  };
  return map[t] || t;
}

function rowToProductionRecord(
  sheetName: string,
  rowNumber: number,
  raw: Record<string, unknown>
): { ok: true; record: ParsedProductionRecord } | { ok: false; errors: ValidationError[] } {
  const isDrawing = sheetName === "Drawing Data";
  const materialCode = String(raw["Material Code"] ?? "").trim();
  const materialDescription = String(raw["Material Description"] ?? "").trim();
  const designSpeed = parseNum(raw["Design Speed"]);
  let actualSpeedMp: number | null;
  let actualSpeedMs: number | null;
  if (isDrawing) {
    actualSpeedMp = parseNum(raw["Actual Speed (m/p)"]);
    actualSpeedMs = parseNum(raw["Actual Speed (m/s)"]);
  } else {
    const one = parseNum(raw["Actual Speed"]);
    if (one === null) {
      actualSpeedMp = null;
      actualSpeedMs = null;
    } else {
      actualSpeedMp = one;
      actualSpeedMs = one;
    }
  }
  const outputKmShift = parseNum(raw["Output (km/shift)"]);
  const outputKgShift = parseNum(raw["Output (kg/shift)"]);
  const factory = String(raw["Factory"] ?? "").trim();
  const machineType = String(raw["Machine Type"] ?? "").trim();

  const errors: ValidationError[] = [];
  if (!materialCode) {
    errors.push({
      rowNumber,
      field: "Material Code",
      value: "",
      error: `[${sheetName}] Material Code is required`,
      materialCode,
      materialDescription,
    });
  }
  if (!materialDescription) {
    errors.push({
      rowNumber,
      field: "Material Description",
      value: "",
      error: `[${sheetName}] Material Description is required`,
      materialCode,
      materialDescription,
    });
  }
  // Design Speed: cho phép để trống cho máy cũ (coi như NULL, không báo lỗi).
  // Chỉ báo lỗi nếu người dùng có nhập nhưng không parse được số.
  if (
    designSpeed === null &&
    !isChuaQuyDoi(raw["Design Speed"]) &&
    !isEmptyCell(raw["Design Speed"])
  ) {
    errors.push({
      rowNumber,
      field: "Design Speed",
      value: String(raw["Design Speed"] ?? ""),
      error: `[${sheetName}] Invalid Design Speed`,
      materialCode,
      materialDescription,
    });
  }
  const actualMpIsChua = isDrawing
    ? isChuaQuyDoi(raw["Actual Speed (m/p)"])
    : isChuaQuyDoi(raw["Actual Speed"]);
  const actualMsIsChua = isDrawing ? isChuaQuyDoi(raw["Actual Speed (m/s)"]) : actualMpIsChua;

  if (
    (actualSpeedMp === null && !actualMpIsChua) ||
    (isDrawing && actualSpeedMs === null && !actualMsIsChua)
  ) {
    errors.push({
      rowNumber,
      field: isDrawing ? "Actual Speed" : "Actual Speed",
      value: isDrawing
        ? `${String(raw["Actual Speed (m/p)"] ?? "")} / ${String(raw["Actual Speed (m/s)"] ?? "")}`
        : String(raw["Actual Speed"] ?? ""),
      error: `[${sheetName}] Invalid actual speed`,
      materialCode,
      materialDescription,
    });
  }
  if (outputKmShift === null && !isChuaQuyDoi(raw["Output (km/shift)"])) {
    errors.push({
      rowNumber,
      field: "Output (km/shift)",
      value: String(raw["Output (km/shift)"] ?? ""),
      error: `[${sheetName}] Invalid Output (km/shift)`,
      materialCode,
      materialDescription,
    });
  }
  if (outputKgShift === null && !isChuaQuyDoi(raw["Output (kg/shift)"])) {
    errors.push({
      rowNumber,
      field: "Output (kg/shift)",
      value: String(raw["Output (kg/shift)"] ?? ""),
      error: `[${sheetName}] Invalid Output (kg/shift)`,
      materialCode,
      materialDescription,
    });
  }
  if (!factory) {
    errors.push({
      rowNumber,
      field: "Factory",
      value: "",
      error: `[${sheetName}] Factory is required`,
      materialCode,
      materialDescription,
    });
  }
  if (!machineType) {
    errors.push({
      rowNumber,
      field: "Machine Type",
      value: "",
      error: `[${sheetName}] Machine Type is required`,
      materialCode,
      materialDescription,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Nếu là "chưa quy đổi" thì coi như bỏ qua khi import server.
  // Preview vẫn cần số để render (toFixed), nên set 0.
  const designSpeedSafe = designSpeed ?? 0;
  const actualSpeedMpSafe = actualSpeedMp ?? 0;
  const actualSpeedMsSafe = actualSpeedMs ?? 0;
  const outputKmShiftSafe = outputKmShift ?? 0;
  const outputKgShiftSafe = outputKgShift ?? 0;

  return {
    ok: true,
    record: {
      materialCode,
      materialDescription,
      designSpeed: designSpeedSafe,
      actualSpeedMp: actualSpeedMpSafe,
      actualSpeedMs: actualSpeedMsSafe,
      outputKmShift: outputKmShiftSafe,
      outputKgShift: outputKgShiftSafe,
      factory: normalizeFactoryName(factory),
      machineType,
      rowNumber,
    },
  };
}

export function previewMasterProductionExcel(buffer: ArrayBuffer): ImportResult {
  const warnings: string[] = [];
  const allErrors: ValidationError[] = [];
  const records: ParsedProductionRecord[] = [];

  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const pending: Array<{ raw: Record<string, unknown>; sheet: string; rowNum: number }> = [];

  for (const name of SHEET_NAMES) {
    if (!wb.SheetNames.includes(name)) {
      warnings.push(`Thiếu sheet: "${name}"`);
      continue;
    }
    const ws = wb.Sheets[name];
    if (!ws) {
      warnings.push(`Sheet rỗng: "${name}"`);
      continue;
    }
    const matrix = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      raw: true,
    }) as unknown[][];
    if (!matrix.length) continue;

    const header = (matrix[0] as unknown[]).map((c) => normHeader(c));
    for (let r = 1; r < matrix.length; r++) {
      const line = matrix[r] as unknown[];
      if (!line || line.every((c) => c === null || c === undefined || String(c).trim() === "")) {
        continue;
      }
      const rawRow = rowToRecord(header, line);
      pending.push({ raw: rawRow, sheet: name, rowNum: r + 1 });
    }
  }

  const bySheet = new Map<string, typeof pending>();
  for (const p of pending) {
    if (!bySheet.has(p.sheet)) bySheet.set(p.sheet, []);
    bySheet.get(p.sheet)!.push(p);
  }
  for (const batch of bySheet.values()) {
    forwardFillOutputKmFromAbove(batch);
  }

  for (const { raw, sheet, rowNum } of pending) {
    const v = rowToProductionRecord(sheet, rowNum, raw);
    if (v.ok) {
      records.push(v.record);
    } else {
      allErrors.push(...v.errors);
    }
  }

  const totalRows = pending.length;
  const validRows = records.length;

  return {
    success: allErrors.length === 0 && totalRows > 0,
    totalRows,
    validRows,
    invalidRows: Math.max(0, totalRows - validRows),
    records,
    errors: allErrors,
    warnings:
      totalRows === 0
        ? [...warnings, "Không đọc được dòng dữ liệu nào — kiểm tra đúng file master production (4 sheet)."]
        : warnings,
  };
}

// Excel parser + bulk lookup qua API (PostgreSQL)

import { parseMaterialExcel } from "@/app/lib/parse-material-excel";
import { postBulkCapability } from "@/app/api/bulkCapability";
import type { BulkCapabilityRow } from "@/app/api/types";

export interface ExcelRow {
  materialCode: string;
  description?: string;
}

export interface ExcelParseResult {
  success: boolean;
  error?: string;
  /** Số dòng có mã Material khác rỗng (trừ header; kể cả nhiều dòng cùng mã). */
  totalRows: number;
  distinctCodes: number;
  /** Tổng hàng dữ liệu trên sheet dưới header (kể cả trống mã), nếu có. */
  sheetPhysicalRows?: number;
  rows: ExcelRow[];
}

export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return {
        success: false,
        error: "Chỉ hỗ trợ file .xlsx hoặc .xls",
        totalRows: 0,
        distinctCodes: 0,
        sheetPhysicalRows: 0,
        rows: [],
      };
    }

    const buf = await file.arrayBuffer();
    const { items, stats } = parseMaterialExcel(buf);
    const rows: ExcelRow[] = items.map((i) => ({
      materialCode: i.material_code,
      description: i.description_file ?? undefined,
    }));

    return {
      success: true,
      totalRows: stats.rows_with_code,
      distinctCodes: stats.distinct_codes,
      sheetPhysicalRows: stats.sheet_physical_rows,
      rows,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      totalRows: 0,
      distinctCodes: 0,
      sheetPhysicalRows: 0,
      rows: [],
    };
  }
}

export interface BulkLookupResult {
  materialCode: string;
  descriptionFile?: string;
  descriptionSystem?: string;
  processStep?: string;
  /** KEO | XOAN | GIAP | BOC — để xuất đúng sheet file mẫu import năng lực */
  processStepCode?: string;
  plantsWithData: string[];
  plantsMissing: string[];
  /** NM có tốc độ thực tế tốt nhất (summary.best_plant_name) — dùng sắp xếp + highlight */
  bestPlantName?: string | null;
  /** Loại máy đề xuất (summary.best_machine_type) */
  bestMachineType?: string | null;
  maxSpeed?: string;
  resistanceRows?: number | string;
  notFoundInSystem: boolean;
}

/** Chuẩn hóa tên NM để so khớp dropdown (vd. Long Thành) với API (Cadivi Long Thành). */
export function normalizePlantCompareKey(name: string): string {
  return name.trim().toLowerCase().replace(/^cadivi\s+/iu, "");
}

/** Đưa NM đề xuất (best speed) lên đầu danh sách. */
function orderPlantsWithRecommendedFirst(
  plantNames: string[],
  bestPlantName: string | null | undefined
): string[] {
  if (!bestPlantName?.trim() || plantNames.length === 0) return [...plantNames];
  const key = normalizePlantCompareKey(bestPlantName);
  if (!key) return [...plantNames];
  return [...plantNames].sort((a, b) => {
    const aOk = normalizePlantCompareKey(a) === key;
    const bOk = normalizePlantCompareKey(b) === key;
    if (aOk === bOk) return 0;
    return aOk ? -1 : 1;
  });
}

function mapBulkRow(row: BulkCapabilityRow): BulkLookupResult {
  if (!row.found || !row.material) {
    return {
      materialCode: row.material_code,
      descriptionFile: row.description_file ?? undefined,
      notFoundInSystem: true,
      plantsWithData: [],
      plantsMissing: [],
      bestPlantName: null,
      bestMachineType: null,
    };
  }

  const s = row.summary;
  let withData: string[];
  let missing: string[];
  if (
    s &&
    (s.plants_with_detail !== undefined || s.plants_missing_detail !== undefined)
  ) {
    withData = (s.plants_with_detail ?? []).map((p) => p.plant_name);
    missing = (s.plants_missing_detail ?? []).map((p) => p.plant_name);
  } else {
    const plants = row.plants ?? [];
    withData = plants.filter((p) => p.has_data).map((p) => p.plant_name);
    missing = plants.filter((p) => !p.has_data).map((p) => p.plant_name);
  }

  const bestPlantName = s?.best_plant_name ?? null;
  const bestMachineType = s?.best_machine_type ?? null;
  withData = orderPlantsWithRecommendedFirst(withData, bestPlantName);

  const best =
    row.summary?.best_actual_speed != null
      ? `${row.summary.best_actual_speed.toLocaleString("vi-VN")} m/min`
      : "—";

  const res = row.resistance;
  const resistanceRows =
    res?.parse_ok === false ? (res.message ?? "—") : res?.row_count ?? "—";

  return {
    materialCode: row.material_code,
    descriptionFile: row.description_file ?? undefined,
    descriptionSystem: row.material.material_description,
    processStep: row.material.process_step_name,
    processStepCode: String(row.material.process_step_code ?? "").toUpperCase(),
    plantsWithData: withData,
    plantsMissing: missing,
    bestPlantName,
    bestMachineType,
    maxSpeed: best,
    resistanceRows,
    notFoundInSystem: false,
  };
}

export async function bulkLookupMaterials(codes: string[]): Promise<BulkLookupResult[]> {
  const items = codes.map((c) => ({ material_code: c.trim() }));
  const body = await postBulkCapability(items);
  return body.rows.map(mapBulkRow);
}

export async function bulkLookupFromRows(rows: ExcelRow[]): Promise<BulkLookupResult[]> {
  const items = rows.map((r) => ({
    material_code: r.materialCode,
    description_file: r.description ?? null,
  }));
  const body = await postBulkCapability(items);
  return body.rows.map(mapBulkRow);
}

/** Cùng logic lọc với bảng “đang lọc” và xuất file. */
export function filterBulkResults(
  results: BulkLookupResult[],
  bulkFilter: string,
  bulkPlantFilter: string
): BulkLookupResult[] {
  const plantKey =
    bulkPlantFilter && bulkPlantFilter !== "all" ? normalizePlantCompareKey(bulkPlantFilter) : "";
  return results.filter((r) => {
    if (bulkFilter === "not-in-system") {
      if (!r.notFoundInSystem) return false;
      /** Mã không có trong HT không có NM thiếu từng dòng — không áp lọc NM để tránh mất toàn bộ dòng. */
    } else if (bulkFilter === "missing-any-plant") {
      if (r.notFoundInSystem || r.plantsMissing.length === 0) return false;
    } else if (bulkFilter === "optimal-speed") {
      /** Có trong HT và ít nhất một NM đã có năng lực — để báo cáo NM/máy/tốc độ đề xuất */
      if (r.notFoundInSystem || r.plantsWithData.length === 0) return false;
    }
    if (plantKey && bulkFilter !== "not-in-system") {
      if (bulkFilter === "optimal-speed") {
        if (normalizePlantCompareKey(r.bestPlantName ?? "") !== plantKey) return false;
      } else {
        if (!r.plantsMissing.some((p) => normalizePlantCompareKey(p) === plantKey)) return false;
      }
    }
    return true;
  });
}

export function exportToCSV(
  results: BulkLookupResult[],
  bulkFilter: string,
  bulkPlantFilter: string
): string {
  /** Không xuất cột NM đã có — chỉ NM thiếu (theo bộ lọc), tốc độ/điện trở để trống để NM điền (giống template Missing Data). */
  const headers = [
    "Material",
    "Mô tả (file)",
    "Mô tả (HT)",
    "Công đoạn",
    "NM thiếu",
    "Tốc độ tốt nhất",
    "Điện trở",
  ];
  const lines = [headers.join(",")];

  const filtered = filterBulkResults(results, bulkFilter, bulkPlantFilter);

  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;

  /** Chỉ để trống tốc độ/điện trở khi xuất theo ngữ cảnh “thiếu NM” (NM tự điền), không áp khi báo cáo tốc độ tối ưu / tổng quan. */
  const templateFillMode =
    bulkFilter !== "optimal-speed" &&
    (bulkFilter === "missing-any-plant" ||
      bulkFilter === "not-in-system" ||
      (bulkPlantFilter && bulkPlantFilter !== "all"));

  for (const r of filtered) {
    const nmThieu =
      bulkPlantFilter && bulkPlantFilter !== "all"
        ? bulkPlantFilter
        : r.plantsMissing.join("; ");

    const emptyForPlantFill =
      r.notFoundInSystem || (templateFillMode && r.plantsMissing.length > 0);

    lines.push(
      [
        r.materialCode,
        r.descriptionFile ?? "",
        r.notFoundInSystem ? "KHÔNG CÓ TRONG HỆ THỐNG" : (r.descriptionSystem ?? ""),
        r.processStep ?? "",
        nmThieu,
        emptyForPlantFill ? "" : (r.maxSpeed ?? ""),
        emptyForPlantFill ? "" : String(r.resistanceRows ?? ""),
      ]
        .map(esc)
        .join(",")
    );
  }

  return "\uFEFF" + lines.join("\n");
}

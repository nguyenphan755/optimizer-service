/**
 * Workbook .xlsx cùng cấu trúc template missing_data / master import
 * (missing_data_template_plant_*.xlsx): 4 sheet, cột tốc độ & Machine Type để NM điền.
 */
import * as XLSX from "xlsx";
import {
  filterBulkResults,
  normalizePlantCompareKey,
  type BulkLookupResult,
} from "@/app/lib/excel-parser";

export const CAPABILITY_SHEET_NAMES = [
  "Drawing Data",
  "Stranding & Taping Data",
  "Armoring Data",
  "Sheathing Data",
] as const;

const DRAWING_HEADER = [
  "Material Code",
  "Material Description",
  "Design Speed",
  "Actual Speed (m/p)",
  "Output (kg/shift)",
  "Output (km/shift)",
  "Factory",
  "Machine Type",
];

const OTHER_HEADER = [
  "Material Code",
  "Material Description",
  "Design Speed",
  "Actual Speed",
  "Output (km/shift)",
  "Output (kg/shift)",
  "Factory",
  "Machine Type",
];

function sheetForProcessCode(code: string | undefined): (typeof CAPABILITY_SHEET_NAMES)[number] | null {
  const c = (code ?? "").toUpperCase();
  switch (c) {
    case "KEO":
      return "Drawing Data";
    case "XOAN":
      return "Stranding & Taping Data";
    case "GIAP":
      return "Armoring Data";
    case "BOC":
      return "Sheathing Data";
    default:
      return null;
  }
}

/** Giống file mẫu plant_2: Factory thường là tên ngắn (không tiền tố Cadivi ). */
function factoryCell(plantName: string): string {
  const t = plantName.trim();
  return t.startsWith("Cadivi ") ? t.slice(7) : t;
}

export interface BulkTemplateExportRow {
  materialCode: string;
  materialDescription: string;
  processStepCode: string;
  factoryName: string;
}

/**
 * Mỗi cặp (material × NM thiếu) một dòng trên đúng sheet công đoạn.
 * Bỏ qua mã không có trong HT (không import được).
 */
export function collectBulkTemplateExportRows(
  results: BulkLookupResult[],
  bulkFilter: string,
  bulkPlantFilter: string
): BulkTemplateExportRow[] {
  if (bulkFilter === "optimal-speed") return [];
  const filtered = filterBulkResults(results, bulkFilter, bulkPlantFilter);
  const out: BulkTemplateExportRow[] = [];

  for (const r of filtered) {
    if (r.notFoundInSystem) continue;
    const step = String(r.processStepCode ?? "").toUpperCase();
    if (!sheetForProcessCode(step)) continue;

    let plants: string[];
    if (bulkPlantFilter && bulkPlantFilter !== "all") {
      const key = normalizePlantCompareKey(bulkPlantFilter);
      const hit = r.plantsMissing.find((p) => normalizePlantCompareKey(p) === key);
      plants = hit ? [hit] : [];
    } else {
      plants = [...r.plantsMissing];
    }
    if (plants.length === 0) continue;

    const materialDescription = (r.descriptionSystem || r.descriptionFile || "").trim();
    for (const fac of plants) {
      out.push({
        materialCode: r.materialCode,
        materialDescription,
        processStepCode: step,
        factoryName: fac,
      });
    }
  }

  return out;
}

export function buildBulkMissingTemplateWorkbook(rows: BulkTemplateExportRow[]): Uint8Array {
  const bySheet = new Map<string, BulkTemplateExportRow[]>();
  for (const name of CAPABILITY_SHEET_NAMES) {
    bySheet.set(name, []);
  }
  for (const row of rows) {
    const sh = sheetForProcessCode(row.processStepCode);
    if (!sh) continue;
    bySheet.get(sh)!.push(row);
  }

  const wb = XLSX.utils.book_new();

  for (const sheetName of CAPABILITY_SHEET_NAMES) {
    const isDrawing = sheetName === "Drawing Data";
    const header = isDrawing ? DRAWING_HEADER : OTHER_HEADER;
    const list = bySheet.get(sheetName) ?? [];
    const aoa: unknown[][] = [header];
    for (const r of list) {
      const factory = factoryCell(r.factoryName);
      aoa.push([r.materialCode, r.materialDescription, "", "", "", "", factory, ""]);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return raw instanceof Uint8Array ? raw : new Uint8Array(raw as number[]);
}

/** Một sheet — đúng các cột bảng tra cứu bulk khi lọc “Master Data thiếu”. */
const MASTER_DATA_THIEU_HEADERS = [
  "Material",
  "Mô tả (file)",
  "Mô tả (HT)",
  "Công đoạn",
  "NM có dữ liệu",
  "NM thiếu",
  "Tốc độ tốt nhất",
  "Điện trở (dòng)",
];

const MASTER_SHEET_NAME = "Master_Data_thieu";

/**
 * Biểu mẫu cho mã chưa có trong master (không có trong HT).
 * Chỉ dùng các dòng đã lọc `notFoundInSystem`.
 */
export function buildBulkMasterDataMissingWorkbook(rows: BulkLookupResult[]): Uint8Array {
  const aoa: unknown[][] = [MASTER_DATA_THIEU_HEADERS];
  for (const r of rows) {
    if (!r.notFoundInSystem) continue;
    aoa.push([
      r.materialCode,
      r.descriptionFile ?? "",
      "KHÔNG CÓ TRONG HỆ THỐNG",
      r.processStep ?? "",
      r.plantsWithData.length ? r.plantsWithData.join("; ") : "",
      r.plantsMissing.length ? r.plantsMissing.join("; ") : "",
      r.maxSpeed ?? "",
      r.resistanceRows != null && r.resistanceRows !== "" ? String(r.resistanceRows) : "",
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, MASTER_SHEET_NAME);

  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return raw instanceof Uint8Array ? raw : new Uint8Array(raw as number[]);
}

/** Báo cáo nhanh: mỗi dòng = mã có trong HT + NM/máy/tốc độ đề xuất (theo bộ lọc). */
const OPTIMAL_SPEED_SHEET = "Bao_cao_toc_do_toi_uu";

const OPTIMAL_SPEED_HEADERS = [
  "Material",
  "Mô tả (HT)",
  "Công đoạn",
  "Nhà máy đề xuất (tốc độ tối ưu)",
  "Loại máy đề xuất",
  "Tốc độ thực tế tốt nhất",
  "Số NM có dữ liệu",
  "NM còn thiếu dữ liệu",
  "Điện trở (dòng)",
];

export function buildBulkOptimalSpeedReportWorkbook(rows: BulkLookupResult[]): Uint8Array {
  const aoa: unknown[][] = [OPTIMAL_SPEED_HEADERS];
  for (const r of rows) {
    if (r.notFoundInSystem) continue;
    aoa.push([
      r.materialCode,
      (r.descriptionSystem ?? "").trim(),
      r.processStep ?? "",
      r.bestPlantName ?? "",
      r.bestMachineType ?? "",
      r.maxSpeed ?? "",
      r.plantsWithData.length,
      r.plantsMissing.length ? r.plantsMissing.join("; ") : "",
      r.resistanceRows != null && r.resistanceRows !== "" ? String(r.resistanceRows) : "",
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, OPTIMAL_SPEED_SHEET);

  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return raw instanceof Uint8Array ? raw : new Uint8Array(raw as number[]);
}

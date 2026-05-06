/**
 * Preview sheet DATA từ Excel điện trở — cùng quy tắc cột với backend importResistanceExcel.
 */
import * as XLSX from "xlsx";
import type { ResistanceImportResult, ResistanceRecord } from "@/app/lib/resistance-csv-parser";

function normKey(k: string): string {
  return k
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findCol(headers: string[], ...mustInclude: string[]): string | null {
  for (const h of headers) {
    const n = normKey(h);
    if (mustInclude.every((m) => n.includes(normKey(m)))) return h;
  }
  return null;
}

function num(v: unknown): number | null {
  if (v === "" || v === undefined || v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const x = parseFloat(s);
  return Number.isFinite(x) ? x : null;
}

function parseRes(v: unknown): { n: number | null; raw: string | null } {
  if (v === "" || v === undefined || v === null) return { n: null, raw: null };
  if (typeof v === "number" && Number.isFinite(v)) return { n: v, raw: null };
  const s = String(v).trim();
  if (s.includes("÷") || s.includes("/")) return { n: null, raw: s };
  const x = parseFloat(s.replace(",", "."));
  return Number.isFinite(x) ? { n: x, raw: null } : { n: null, raw: s };
}

function normalizeKetCauExcel(s: string): string {
  return String(s).replace(/\r?\n/g, "").trim();
}

function plantDisplay(nmRaw: string): string {
  const t = nmRaw.trim();
  const u = t.toUpperCase();
  if (u.includes("ĐÀ NẴNG") || u.includes("DA NANG")) return "DN";
  if (u.includes("LONG") || u.includes("THÀNH")) return "LT";
  if (u.includes("TÂN") || u.includes("TAN")) return "TA";
  if (u.includes("BẮC") || u.includes("BAC")) return "BN";
  if (/^[A-Z]{2}\b/i.test(t)) return t.slice(0, 2).toUpperCase();
  return t.slice(0, 8) || "—";
}

export function previewResistanceExcel(buffer: ArrayBuffer): ResistanceImportResult {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets["DATA"];
  if (!ws) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      records: [],
      errors: [
        {
          rowNumber: 0,
          field: "Sheet",
          value: "",
          error: 'Không tìm thấy sheet "DATA". File điện trở cần đúng tên sheet DATA.',
        },
      ],
      warnings: [],
    };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
  if (rows.length === 0) {
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      records: [],
      errors: [{ rowNumber: 0, field: "DATA", value: "", error: "Sheet DATA không có dòng dữ liệu." }],
      warnings: [],
    };
  }

  const headers = Object.keys(rows[0]);
  const colLoai = findCol(headers, "loại", "sp") || findCol(headers, "loai", "sp");
  const colTiet = findCol(headers, "tiết", "diện") || findCol(headers, "tiet", "dien");
  const colKet = findCol(headers, "kết", "cấu") || findCol(headers, "ket", "cau");
  const colNm = findCol(headers, "nhà", "máy") || findCol(headers, "nha", "may");
  const nk = normKey;
  const colNgay = headers.find((h) => {
    const n = nk(h);
    return n.startsWith(nk("ngày")) || n === "ngay";
  });
  const colThang = headers.find((h) => {
    const n = nk(h);
    return n.includes(nk("tháng")) || n === "thang";
  });
  const colNam = headers.find((h) => {
    const n = nk(h);
    return n === nk("năm") || n === "nam";
  });
  const colCa = headers.find((h) => nk(h) === "ca");
  const colNsx = headers.find((h) => nk(h) === "nsx");
  const colRmax = headers.find((h) => {
    const n = nk(h);
    return n.includes(nk("điện trở")) && n.includes("max");
  });
  const colRtt = headers.find((h) => {
    const n = nk(h);
    return n.includes(nk("điện trở")) && n.includes("tt") && !n.includes("max");
  });
  const colTyLe = headers.find((h) => {
    const n = nk(h);
    return n.includes(nk("tỷ lệ")) && n.includes(nk("điện trở")) && !n.includes(nk("khối"));
  });

  if (!colLoai || !colTiet || !colKet || !colNm) {
    return {
      success: false,
      totalRows: rows.length,
      validRows: 0,
      invalidRows: rows.length,
      records: [],
      errors: [
        {
          rowNumber: 0,
          field: "Headers",
          value: headers.join(" | "),
          error: `Thiếu cột bắt buộc: Loại SP / Tiết diện / Kết cấu / Nhà máy. Tìm thấy: ${colLoai}, ${colTiet}, ${colKet}, ${colNm}`,
        },
      ],
      warnings: [],
    };
  }

  const records: ResistanceRecord[] = [];
  const errors: ResistanceImportResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const loai = String(row[colLoai] ?? "").trim();
    const tiet = num(row[colTiet]);
    const ket = normalizeKetCauExcel(String(row[colKet] ?? ""));
    const nmRaw = String(row[colNm] ?? "").trim();
    if (!loai || tiet === null || !ket || !nmRaw) {
      continue;
    }

    let observed: string;
    const nsx = colNsx ? row[colNsx] : null;
    if (nsx instanceof Date && !isNaN(nsx.getTime())) {
      observed = nsx.toISOString();
    } else {
      const d = colNgay ? num(row[colNgay]) : null;
      const mo = colThang ? num(row[colThang]) : null;
      const y = colNam ? num(row[colNam]) : null;
      if (y !== null && mo !== null && d !== null) {
        observed = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).toISOString();
      } else {
        observed = new Date(0).toISOString();
      }
    }

    const rmax = colRmax ? parseRes(row[colRmax]) : { n: null, raw: null };
    const rtt = colRtt ? parseRes(row[colRtt]) : { n: null, raw: null };
    const tyLe = colTyLe ? num(row[colTyLe]) : null;

    const dienTroMax = rmax.n ?? 0;
    const dienTroTt = rtt.n ?? 0;
    const tyLeDienTroPct = tyLe ?? 0;

    const materialCode = `${loai}|${tiet}|${ket.slice(0, 40)}`;
    const ca = colCa ? num(row[colCa]) : null;

    records.push({
      materialCode,
      observedAt: observed,
      plantCode: plantDisplay(nmRaw),
      loaiSp: loai,
      ca,
      dienTroMax,
      dienTroTt,
      tyLeDienTroPct,
    });
  }

  const validRows = records.length;
  const skipped = rows.length - validRows;

  return {
    success: true,
    totalRows: rows.length,
    validRows,
    invalidRows: skipped,
    records,
    errors,
    warnings:
      skipped > 0
        ? [`Đã bỏ qua ${skipped} dòng trống hoặc thiếu Loại SP / Tiết diện / Kết cấu / Nhà máy.`]
        : [],
  };
}

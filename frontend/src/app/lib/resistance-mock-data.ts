// Mock data for Resistance Module (Điện trở)

export interface ResistanceMeasurement {
  id: number;
  observed_at: string; // ISO datetime
  plant_code: string | null; // "DN", "LT", "TA", "BN"
  plant_code_excel: string | null; // fallback nếu plant_code null
  loai_sp: string; // "Ccc", "Acc", "Ccc/WC", etc.
  ca: number | null; // shift number
  dien_tro_max: number | string; // có thể là số hoặc text/phân số
  dien_tro_tt: number | null; // điện trở thực tế
  ty_le_dien_tro_pct: number | null; // tỷ lệ %
}

export interface ResistanceLookupResult {
  success: boolean;
  message?: string; // error/parse failure message
  tiet_dien: number | null; // tiết diện suy ra
  ket_cau: string | null; // kết cấu suy ra (dạng "37/2,63")
  loai_sp_filter: string; // "all", "Ccc", "Acc"
  row_count: number;
  latest_observation: string | null; // ISO datetime của dòng mới nhất
  measurements: ResistanceMeasurement[];
}

// Mock resistance data for XOẮN materials
export const resistanceMockData: Record<string, ResistanceLookupResult> = {
  // Material "53000234" - công đoạn XOẮN
  "53000234": {
    success: true,
    tiet_dien: 6,
    ket_cau: "37/2,63",
    loai_sp_filter: "all",
    row_count: 8,
    latest_observation: "2026-04-05T14:30:00",
    measurements: [
      {
        id: 1,
        observed_at: "2026-04-05T14:30:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.95,
        ty_le_dien_tro_pct: 95.8,
      },
      {
        id: 2,
        observed_at: "2026-04-05T06:15:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 1,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.98,
        ty_le_dien_tro_pct: 96.8,
      },
      {
        id: 3,
        observed_at: "2026-04-04T22:45:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 3,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.92,
        ty_le_dien_tro_pct: 94.8,
      },
      {
        id: 4,
        observed_at: "2026-04-04T14:20:00",
        plant_code: "LT",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.96,
        ty_le_dien_tro_pct: 96.1,
      },
      {
        id: 5,
        observed_at: "2026-04-03T15:10:00",
        plant_code: "TA",
        plant_code_excel: null,
        loai_sp: "Acc",
        ca: 2,
        dien_tro_max: 3.08,
        dien_tro_tt: 3.01,
        ty_le_dien_tro_pct: 97.7,
      },
      {
        id: 6,
        observed_at: "2026-04-03T07:30:00",
        plant_code: null,
        plant_code_excel: "Bắc Ninh",
        loai_sp: "Ccc",
        ca: 1,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.94,
        ty_le_dien_tro_pct: 95.5,
      },
      {
        id: 7,
        observed_at: "2026-04-02T16:00:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc/WC",
        ca: 2,
        dien_tro_max: "3.08 (spec)",
        dien_tro_tt: 2.97,
        ty_le_dien_tro_pct: 96.4,
      },
      {
        id: 8,
        observed_at: "2026-04-01T09:45:00",
        plant_code: "LT",
        plant_code_excel: null,
        loai_sp: "Acc",
        ca: 1,
        dien_tro_max: 3.08,
        dien_tro_tt: null, // missing TT
        ty_le_dien_tro_pct: null,
      },
    ],
  },

  // Material "53000456" - công đoạn XOẮN
  "53000456": {
    success: true,
    tiet_dien: 10,
    ket_cau: "61/2,89",
    loai_sp_filter: "all",
    row_count: 5,
    latest_observation: "2026-04-05T13:00:00",
    measurements: [
      {
        id: 9,
        observed_at: "2026-04-05T13:00:00",
        plant_code: "LT",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 1.91,
        dien_tro_tt: 1.85,
        ty_le_dien_tro_pct: 96.9,
      },
      {
        id: 10,
        observed_at: "2026-04-04T21:30:00",
        plant_code: "LT",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 3,
        dien_tro_max: 1.91,
        dien_tro_tt: 1.87,
        ty_le_dien_tro_pct: 97.9,
      },
      {
        id: 11,
        observed_at: "2026-04-04T05:45:00",
        plant_code: "TA",
        plant_code_excel: null,
        loai_sp: "Acc",
        ca: 1,
        dien_tro_max: 1.91,
        dien_tro_tt: 1.88,
        ty_le_dien_tro_pct: 98.4,
      },
      {
        id: 12,
        observed_at: "2026-04-03T14:15:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 1.91,
        dien_tro_tt: 1.84,
        ty_le_dien_tro_pct: 96.3,
      },
      {
        id: 13,
        observed_at: "2026-04-02T08:00:00",
        plant_code: null,
        plant_code_excel: "Bắc Ninh",
        loai_sp: "Ccc",
        ca: 1,
        dien_tro_max: 1.91,
        dien_tro_tt: 1.86,
        ty_le_dien_tro_pct: 97.4,
      },
    ],
  },

  // Material "53000789" - công đoạn XOẮN - example với 0 records
  "53000789": {
    success: true,
    message: "0 bản ghi khớp với khóa tra cứu. Chưa import hoặc chưa có dữ liệu cho tiết diện/kết cấu này.",
    tiet_dien: 16,
    ket_cau: "61/2,89",
    loai_sp_filter: "all",
    row_count: 0,
    latest_observation: null,
    measurements: [],
  },

  // Material "53001234" - công đoạn XOẮN
  "53001234": {
    success: true,
    tiet_dien: 6,
    ket_cau: "37/2,63",
    loai_sp_filter: "all",
    row_count: 6,
    latest_observation: "2026-04-05T11:20:00",
    measurements: [
      {
        id: 14,
        observed_at: "2026-04-05T11:20:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.99,
        ty_le_dien_tro_pct: 97.1,
      },
      {
        id: 15,
        observed_at: "2026-04-04T19:45:00",
        plant_code: "BN",
        plant_code_excel: null,
        loai_sp: "Acc",
        ca: 3,
        dien_tro_max: 3.08,
        dien_tro_tt: 3.02,
        ty_le_dien_tro_pct: 98.1,
      },
      {
        id: 16,
        observed_at: "2026-04-04T03:30:00",
        plant_code: "LT",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 1,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.91,
        ty_le_dien_tro_pct: 94.5,
      },
      {
        id: 17,
        observed_at: "2026-04-03T12:00:00",
        plant_code: "TA",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 2,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.96,
        ty_le_dien_tro_pct: 96.1,
      },
      {
        id: 18,
        observed_at: "2026-04-02T20:15:00",
        plant_code: "DN",
        plant_code_excel: null,
        loai_sp: "Ccc",
        ca: 3,
        dien_tro_max: 3.08,
        dien_tro_tt: 2.93,
        ty_le_dien_tro_pct: 95.1,
      },
      {
        id: 19,
        observed_at: "2026-04-01T06:30:00",
        plant_code: "BN",
        plant_code_excel: null,
        loai_sp: "Acc",
        ca: 1,
        dien_tro_max: 3.08,
        dien_tro_tt: 3.00,
        ty_le_dien_tro_pct: 97.4,
      },
    ],
  },

  // Parse failure example
  "52000567": {
    success: false,
    message: "Không thể suy ra tiết diện/kết cấu từ mô tả material. Vui lòng kiểm tra lại dữ liệu material description.",
    tiet_dien: null,
    ket_cau: null,
    loai_sp_filter: "all",
    row_count: 0,
    latest_observation: null,
    measurements: [],
  },
};

// Helper function to get resistance data by material code
export function getResistanceData(
  materialCode: string,
  loaiSpFilter: "all" | "Ccc" | "Acc" = "all"
): ResistanceLookupResult | null {
  const data = resistanceMockData[materialCode];
  if (!data) return null;

  // Filter by loai_sp if not "all"
  if (loaiSpFilter !== "all" && data.success) {
    const filteredMeasurements = data.measurements.filter((m) =>
      m.loai_sp.toLowerCase().includes(loaiSpFilter.toLowerCase())
    );
    return {
      ...data,
      loai_sp_filter: loaiSpFilter,
      row_count: filteredMeasurements.length,
      measurements: filteredMeasurements,
      latest_observation:
        filteredMeasurements.length > 0 ? filteredMeasurements[0].observed_at : null,
    };
  }

  return data;
}

// Plant code mapping helper
export function getPlantName(plantCode: string | null, plantCodeExcel: string | null): string {
  if (plantCode) {
    const mapping: Record<string, string> = {
      DN: "Đà Nẵng",
      LT: "Long Thành",
      TA: "Tân Á",
      BN: "Bắc Ninh",
    };
    return mapping[plantCode] || plantCode;
  }
  if (plantCodeExcel) {
    return plantCodeExcel;
  }
  return "—";
}

/**
 * Suy tiết diện + kết cấu (full, dạng Excel) từ material_description Xoắn.
 * Ví dụ: "Cm 185c37x2.63" → tiet_dien 185, ket_cau "37/2,63"
 * "Acz400c61x2.89" → 400, "61/2,89" (tiền tố chữ có thể dính liền số, không cần khoảng trắng).
 * "Cm/WC 25c7x2.22" → 25, "7/2,22" (loại SP kiểu Cm/WC trước phần số).
 * Loại SP (Cm→Ccc) tính sau — hiện trả null.
 */
export interface ParsedXoanDescription {
  tiet_dien: number | null;
  ket_cau: string | null;
  loai_sp: string | null;
}

function normalizeDecimalPart(s: string): string {
  return s.trim().replace(/\./g, ',');
}

/** Chuỗi kết cấu khớp cột Excel: "37/2,63" */
export function buildKetCauFull(strandCount: string, wireMm: string): string {
  return `${strandCount.trim()}/${normalizeDecimalPart(wireMm)}`;
}

/**
 * Mẫu: `[prefix][ws]<tiet>c<nhóm>x<đường kính>` — prefix tùy chọn: một cụm chữ hoặc chuỗi
 * `Cm/WC` (lặp `/` + chữ), rồi khoảng trắng tùy chọn trước tiết diện.
 */
export function parseXoanMaterialDescription(raw: string): ParsedXoanDescription {
  const s = raw.trim();
  if (!s) {
    return { tiet_dien: null, ket_cau: null, loai_sp: null };
  }

  const re =
    /^(?:[A-Za-zÀ-ỹ]+(?:\s*\/\s*[A-Za-zÀ-ỹ]+)*\s*)?(\d+(?:[.,]\d+)?)\s*[cC]\s*(\d+)\s*[xX]\s*([\d,\.]+)\s*$/;
  const m = s.match(re);
  if (m) {
    const tiet = parseFloat(m[1].replace(',', '.'));
    if (!Number.isFinite(tiet)) {
      return { tiet_dien: null, ket_cau: null, loai_sp: null };
    }
    const ket = buildKetCauFull(m[2], m[3]);
    return { tiet_dien: tiet, ket_cau: ket, loai_sp: null };
  }

  return { tiet_dien: null, ket_cau: null, loai_sp: null };
}

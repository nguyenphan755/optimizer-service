import * as XLSX from 'xlsx';
import { SHEET_NAMES } from './excelParser';
import type { TemplateRowDb } from '../db/queries/missingDataSubmissions';

const DRAWING_HEADER = [
  'Material Code',
  'Material Description',
  'Design Speed',
  'Actual Speed (m/p)',
  'Output (kg/shift)',
  'Output (km/shift)',
  'Factory',
  'Machine Type',
];

const OTHER_HEADER = [
  'Material Code',
  'Material Description',
  'Design Speed',
  'Actual Speed',
  'Output (km/shift)',
  'Output (kg/shift)',
  'Factory',
  'Machine Type',
];

/**
 * Excel đúng cấu trúc import năng lực — các dòng từ báo cáo thiếu, cột tốc độ/máy để NM điền.
 */
export function buildMissingDataTemplateBuffer(rows: TemplateRowDb[]): Buffer {
  const bySheet = new Map<string, TemplateRowDb[]>();
  for (const name of SHEET_NAMES) {
    bySheet.set(name, []);
  }
  for (const row of rows) {
    const list = bySheet.get(row.sheet_name);
    if (list) list.push(row);
  }

  const wb = XLSX.utils.book_new();

  for (const sheetName of SHEET_NAMES) {
    const list = bySheet.get(sheetName) ?? [];
    const isDrawing = sheetName === 'Drawing Data';
    const header = isDrawing ? DRAWING_HEADER : OTHER_HEADER;
    const aoa: unknown[][] = [header];

    for (const r of list) {
      const factory = r.plant_name;
      if (isDrawing) {
        aoa.push([r.material_code, r.material_description, '', '', '', '', factory, '']);
      } else {
        aoa.push([r.material_code, r.material_description, '', '', '', '', factory, '']);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const sheetHuongDan = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN BỔ SUNG DỮ LIỆU THIẾU'],
    [],
    [
      '1. File đã có sẵn Material Code, mô tả, Factory (nhà máy). Bạn bắt buộc điền: Design Speed, Actual Speed, Output (km/shift), Machine Type.',
    ],
    ['2. Công đoạn Kéo (Drawing): cột Actual Speed (m/p); các sheet khác: Actual Speed (đơn vị theo file chuẩn CADIVI).'],
    ['3. Drawing: điền Output (kg/shift) và Output (km/shift) theo quy định; sheet khác có thể để trống Output (kg/shift) hoặc "chưa quy đổi".'],
    ['4. Sau khi điền đầy đủ, lưu file và tải lên Plant Upload Portal — chờ chuyên viên phê duyệt mới ghi vào hệ thống.'],
  ]);
  XLSX.utils.book_append_sheet(wb, sheetHuongDan, '_HUONG_DAN');

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

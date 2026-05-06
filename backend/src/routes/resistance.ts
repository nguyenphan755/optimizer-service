import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import { getPool } from '../db/client';
import { listResistanceByKeys } from '../db/queries/resistanceMeasurements';
import { parseXoanMaterialDescription } from '../services/xoanDescriptionParser';
import { importResistanceFromBuffer } from '../services/resistanceExcelImport';

export const resistanceRouter = Router();

const MAX_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okMime =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel';
    const okExt = ext === '.xlsx' || ext === '.xls';
    if (okMime && okExt) cb(null, true);
    else cb(new Error('INVALID_FILE_TYPE'));
  },
});

function sendErr(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: message, code });
}

/**
 * POST /api/v1/resistance/import
 * multipart field: file — sheet DATA (Excel điện trở).
 * Query: truncate=1 — xóa bảng resistance_measurements trước khi nạp.
 */
resistanceRouter.post(
  '/import',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return sendErr(res, 400, 'FILE_TOO_LARGE', 'File vượt quá 50MB');
        }
        if ((err as Error).message === 'INVALID_FILE_TYPE') {
          return sendErr(res, 400, 'INVALID_FILE_TYPE', 'Chỉ chấp nhận file .xlsx hoặc .xls');
        }
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file?.buffer) {
        return sendErr(res, 400, 'FILE_REQUIRED', 'Thiếu file (field: file)');
      }
      const truncate =
        req.query.truncate === '1' ||
        req.query.truncate === 'true' ||
        req.query.truncate === 'yes';
      const pool = getPool();
      const client = await pool.connect();
      try {
        const out = await importResistanceFromBuffer(client, req.file.buffer, { truncate });
        res.status(200).json({
          inserted: out.inserted,
          skipped: out.skipped,
          errors: out.errors,
          truncate,
        });
      } finally {
        client.release();
      }
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/v1/resistance/for-material/:materialId
 * Query: loai_sp (optional) — Acc | Ccc; nếu không gửi, trả mọi Loại SP khớp tiết diện+kết cấu
 */
resistanceRouter.get('/for-material/:materialId', async (req, res, next) => {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    if (!Number.isFinite(materialId) || materialId <= 0) {
      res.status(400).json({ error: 'material_id không hợp lệ', code: 'INVALID_ID' });
      return;
    }

    const loaiSpQ =
      typeof req.query.loai_sp === 'string' && req.query.loai_sp.trim() !== ''
        ? req.query.loai_sp.trim().toUpperCase()
        : null;
    if (loaiSpQ && loaiSpQ !== 'ACC' && loaiSpQ !== 'CCC') {
      res.status(400).json({ error: 'loai_sp chỉ nhận Acc hoặc Ccc', code: 'INVALID_LOAI_SP' });
      return;
    }
    const loai_sp = loaiSpQ === 'ACC' ? 'Acc' : loaiSpQ === 'CCC' ? 'Ccc' : null;

    const pool = getPool();
    const client = await pool.connect();
    try {
      const meta = await client.query<{
        material_code: string;
        material_description: string;
        step_code: string;
      }>(
        `SELECT m.material_code, m.material_description, ps.code AS step_code
         FROM materials m
         JOIN process_steps ps ON ps.id = m.process_step_id
         WHERE m.id = $1`,
        [materialId]
      );
      if (!meta.rows[0]) {
        res.status(404).json({ error: 'Không tìm thấy material', code: 'NOT_FOUND' });
        return;
      }
      if (meta.rows[0].step_code !== 'XOAN') {
        res.status(400).json({
          error: 'Chỉ material công đoạn Xoắn mới tra cứu điện trở',
          code: 'NOT_XOAN',
        });
        return;
      }

      const parsed = parseXoanMaterialDescription(meta.rows[0].material_description);
      if (parsed.tiet_dien === null || parsed.ket_cau === null) {
        res.json({
          material_id: materialId,
          material_code: meta.rows[0].material_code,
          material_description: meta.rows[0].material_description,
          parse: parsed,
          loai_sp_filter: loai_sp,
          latest_observed_at: null,
          row_count: 0,
          rows: [],
          message:
            'Không suy được tiết diện / kết cấu từ mô tả. Cần chỉnh mô tả hoặc dùng master sau này.',
        });
        return;
      }

      const effectiveLoai = loai_sp ?? parsed.loai_sp;
      const rows = await listResistanceByKeys(client, {
        tiet_dien: parsed.tiet_dien,
        ket_cau: parsed.ket_cau,
        loai_sp: effectiveLoai,
      });

      const latest = rows[0]?.observed_at ?? null;

      res.json({
        material_id: materialId,
        material_code: meta.rows[0].material_code,
        material_description: meta.rows[0].material_description,
        parse: { ...parsed, loai_sp: effectiveLoai },
        loai_sp_filter: loai_sp,
        lookup: {
          tiet_dien: parsed.tiet_dien,
          ket_cau: parsed.ket_cau,
          loai_sp: effectiveLoai,
        },
        latest_observed_at: latest,
        row_count: rows.length,
        rows: rows.map((r) => ({
          id: r.id,
          loai_sp: r.loai_sp,
          tiet_dien: parseFloat(r.tiet_dien),
          ket_cau: r.ket_cau,
          plant_code: r.plant_code,
          plant_name: r.plant_name,
          plant_code_excel: r.plant_code_excel,
          ca: r.ca,
          observed_at: r.observed_at,
          dien_tro_max: r.dien_tro_max !== null ? parseFloat(r.dien_tro_max) : null,
          dien_tro_max_raw: r.dien_tro_max_raw,
          dien_tro_tt: r.dien_tro_tt !== null ? parseFloat(r.dien_tro_tt) : null,
          ty_le_dien_tro_pct:
            r.ty_le_dien_tro_pct !== null ? parseFloat(r.ty_le_dien_tro_pct) : null,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

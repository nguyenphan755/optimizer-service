import { Router, type Request } from 'express';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { getPool } from '../db/client';
import {
  materialExists,
  plantExists,
  upsertMissingCapabilityReport,
  listMissingCapabilityReports,
  getMissingDataSummary,
  deleteMissingCapabilityReportById,
  deleteMissingCapabilityReportsByIds,
} from '../db/queries/missingCapabilityReports';
import { requireMesAdmin } from '../middleware/authJwt';
import {
  listMissingTemplateRows,
  insertSubmission,
  listSubmissions,
  getSubmissionById,
  updateSubmissionRejected,
  updateSubmissionImportStarted,
  type SubmissionListRow,
} from '../db/queries/missingDataSubmissions';
import { buildMissingDataTemplateBuffer } from '../services/missingTemplateWorkbook';
import { runImportValidationPhase } from '../services/importOrchestrator';
import {
  formatMissingSubmissionPublicRef,
  formatImportJobPublicRef,
} from '../services/missingSubmissionRef';
import type { MesJwtPayload } from '../auth/jwt';

export const missingDataRouter = Router();

function submissionReviewerAudit(req: Request): {
  reviewerMesUsername: string | null;
  reviewerAccessLabel: string | null;
} {
  const j = req.mesJwt as MesJwtPayload | undefined;
  if (!j) return { reviewerMesUsername: null, reviewerAccessLabel: null };
  const reviewerMesUsername = j.username?.trim() || null;
  let reviewerAccessLabel: string | null = null;
  if (j.role === 'admin') reviewerAccessLabel = 'Admin';
  else if ((j.plant_code ?? '').trim().toUpperCase() === 'HO') reviewerAccessLabel = 'Head Office';
  else reviewerAccessLabel = 'User';
  return { reviewerMesUsername, reviewerAccessLabel };
}

/** Bảng chưa migrate 005 — Postgres 42P01 hoặc message tiếng Anh */
function isSubmissionsTableMissingError(e: unknown): boolean {
  const any = e as { code?: string; message?: string };
  if (any?.code === '42P01') return true;
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /missing_data_submissions/i.test(msg) &&
    (/does not exist|relation|không tồn tại/i.test(msg) || /42P01/.test(msg))
  );
}

function respondMigrationRequired(res: import('express').Response): void {
  res.status(503).json({
    error:
      'Chưa có bảng missing_data_submissions trên PostgreSQL. Trên máy chủ API, từ thư mục integrated/Capacity-Lookup-System-main chạy: npm run db:migrate-005 (cùng file .env DB với server đang chạy), rồi restart API.',
    code: 'MIGRATION_REQUIRED',
  });
}

const MAX_SUBMISSION_MB = 50;

function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR || './uploads');
}

function submissionsDir(): string {
  const dir = path.join(uploadRoot(), 'missing_submissions');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** File lưu trữ phải nằm trong thư mục missing_submissions (chống path traversal). */
function isResolvedPathUnderDir(resolvedFile: string, resolvedDir: string): boolean {
  const rel = path.relative(resolvedDir, resolvedFile);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function submissionRowToApiItem(r: SubmissionListRow) {
  return {
    id: r.id,
    public_ref: formatMissingSubmissionPublicRef({
      id: r.id,
      plant_id: r.plant_id,
      created_at: r.created_at,
    }),
    plant_id: r.plant_id,
    plant_name: r.plant_name,
    original_filename: r.original_filename,
    template_row_hint: r.template_row_hint,
    submitter_note: r.submitter_note,
    status: r.status,
    created_at: r.created_at,
    reviewed_at: r.reviewed_at,
    reviewer_label: r.reviewer_label,
    rejection_reason: r.rejection_reason,
    reviewer_mes_username: r.reviewer_mes_username,
    reviewer_access_label: r.reviewer_access_label,
    import_job_id: r.import_job_id,
    import_job_ref:
      r.import_job_id != null
        ? formatImportJobPublicRef(r.import_job_id, r.import_job_created_at)
        : null,
    import_job_status: r.import_job_status,
    import_finished_at: r.import_finished_at,
  };
}

const submissionUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, submissionsDir()),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: MAX_SUBMISSION_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') cb(null, true);
    else cb(new Error('INVALID_FILE_TYPE'));
  },
});

const bodySchema = z.object({
  material_id: z.number().int().positive(),
  plant_id: z.number().int().positive(),
  note: z.string().max(2000).optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  plant_id: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
});

const submissionListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  plant_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['pending_review', 'rejected', 'import_started']).optional(),
});

const approveBody = z.object({
  reviewer_label: z.string().min(1).max(200),
});

const rejectBody = z.object({
  reviewer_label: z.string().min(1).max(200),
  reason: z.string().min(1).max(2000),
});

const bulkDeleteReportsBody = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

/** GET /api/v1/missing-data/submissions/template?plant_id= — Excel mẫu từ báo cáo thiếu */
missingDataRouter.get('/submissions/template', async (req, res, next) => {
  try {
    const plantId = parseInt(String(req.query.plant_id ?? ''), 10);
    if (!Number.isFinite(plantId) || plantId < 1) {
      res.status(400).json({ error: 'Thiếu hoặc sai plant_id', code: 'INVALID_PLANT' });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const pOk = await plantExists(client, plantId);
      if (!pOk) {
        res.status(404).json({ error: 'Không tìm thấy nhà máy', code: 'PLANT_NOT_FOUND' });
        return;
      }
      const rows = await listMissingTemplateRows(client, plantId);
      const buf = buildMissingDataTemplateBuffer(rows);
      const fname = `missing_data_template_plant_${plantId}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      res.send(buf);
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /api/v1/missing-data/submissions — lịch sử / hàng chờ duyệt */
missingDataRouter.get('/submissions', async (req, res, next) => {
  try {
    const parsed = submissionListQuery.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Tham số không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }
    const { page, limit, plant_id, status } = parsed.data;
    const offset = (page - 1) * limit;
    const pool = getPool();
    const client = await pool.connect();
    try {
      const { rows, total } = await listSubmissions(client, {
        plantId: plant_id ?? null,
        status: status ?? null,
        limit,
        offset,
      });
      res.json({
        items: rows.map(submissionRowToApiItem),
        total,
        page,
        page_size: limit,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    if (isSubmissionsTableMissingError(e)) {
      respondMigrationRequired(res);
      return;
    }
    next(e);
  }
});

/** GET /api/v1/missing-data/submissions/:id/file — tải file Excel nhà máy đã gửi */
missingDataRouter.get('/submissions/:id/file', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'id không hợp lệ', code: 'INVALID_ID' });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    let submission: Awaited<ReturnType<typeof getSubmissionById>>;
    try {
      submission = await getSubmissionById(client, id);
    } finally {
      client.release();
    }
    if (!submission) {
      res.status(404).json({ error: 'Không tìm thấy bài nộp', code: 'NOT_FOUND' });
      return;
    }
    const allowedRoot = path.resolve(submissionsDir());
    const abs = path.resolve(submission.stored_path);
    if (!isResolvedPathUnderDir(abs, allowedRoot)) {
      res.status(500).json({ error: 'Đường dẫn lưu file không hợp lệ', code: 'STORAGE_ERROR' });
      return;
    }
    if (!fs.existsSync(abs)) {
      res.status(410).json({ error: 'File không còn trên server', code: 'FILE_GONE' });
      return;
    }
    const ext = path.extname(submission.original_filename).toLowerCase();
    const ct =
      ext === '.xls'
        ? 'application/vnd.ms-excel'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    res.setHeader('Content-Type', ct);
    const dlName = submission.original_filename.replace(/[\r\n]/g, '_') || 'submission.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(dlName)}`);
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    if (isSubmissionsTableMissingError(e)) {
      respondMigrationRequired(res);
      return;
    }
    next(e);
  }
});

/** POST /api/v1/missing-data/submissions — NM gửi file (chờ duyệt) */
missingDataRouter.post(
  '/submissions',
  (req, res, next) => {
    submissionUpload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: `File vượt quá ${MAX_SUBMISSION_MB}MB`, code: 'FILE_TOO_LARGE' });
          return;
        }
        if ((err as Error).message === 'INVALID_FILE_TYPE') {
          res.status(400).json({ error: 'Chỉ chấp nhận .xlsx hoặc .xls', code: 'INVALID_FILE_TYPE' });
          return;
        }
        next(err);
        return;
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file?.path) {
        res.status(400).json({ error: 'Thiếu file (field: file)', code: 'FILE_REQUIRED' });
        return;
      }
      const plantId = parseInt(String(req.body.plant_id ?? ''), 10);
      if (!Number.isFinite(plantId) || plantId < 1) {
        fs.unlinkSync(file.path);
        res.status(400).json({ error: 'plant_id không hợp lệ', code: 'INVALID_PLANT' });
        return;
      }
      const noteRaw = req.body.submitter_note;
      const submitterNote =
        typeof noteRaw === 'string' && noteRaw.trim() !== '' ? noteRaw.trim().slice(0, 500) : null;

      const pool = getPool();
      const client = await pool.connect();
      try {
        const pOk = await plantExists(client, plantId);
        if (!pOk) {
          fs.unlinkSync(file.path);
          res.status(404).json({ error: 'Không tìm thấy nhà máy', code: 'PLANT_NOT_FOUND' });
          return;
        }
        const templateRows = await listMissingTemplateRows(client, plantId);
        const inserted = await insertSubmission(client, {
          plant_id: plantId,
          original_filename: file.originalname,
          stored_path: file.path,
          template_row_hint: templateRows.length,
          submitter_note: submitterNote,
        });
        const public_ref = formatMissingSubmissionPublicRef({
          id: inserted.id,
          plant_id: plantId,
          created_at: inserted.created_at,
        });
        res.status(201).json({
          ok: true,
          id: inserted.id,
          public_ref,
          status: 'pending_review',
          message:
            'Đã gửi file. Chờ chuyên viên phê duyệt tại Approval Dashboard — sau khi chấp nhận dữ liệu mới được import vào hệ thống.',
        });
      } finally {
        client.release();
      }
    } catch (e) {
      if (req.file?.path) {
        try {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
      }
      if (isSubmissionsTableMissingError(e)) {
        respondMigrationRequired(res);
        return;
      }
      next(e);
    }
  }
);

/** POST /api/v1/missing-data/submissions/:id/approve */
missingDataRouter.post('/submissions/:id/approve', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'id không hợp lệ', code: 'INVALID_ID' });
      return;
    }
    const parsed = approveBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    let submission: Awaited<ReturnType<typeof getSubmissionById>>;
    try {
      submission = await getSubmissionById(client, id);
    } finally {
      client.release();
    }
    if (!submission) {
      res.status(404).json({ error: 'Không tìm thấy bài nộp', code: 'NOT_FOUND' });
      return;
    }
    if (submission.status !== 'pending_review') {
      res.status(409).json({ error: 'Bài nộp không ở trạng thái chờ duyệt', code: 'INVALID_STATE' });
      return;
    }
    if (!fs.existsSync(submission.stored_path)) {
      res.status(410).json({ error: 'File gốc không còn trên server', code: 'FILE_GONE' });
      return;
    }

    const buffer = fs.readFileSync(submission.stored_path);
    const out = await runImportValidationPhase({
      buffer,
      originalFilename: submission.original_filename,
      uploadDir: uploadRoot(),
    });

    const client2 = await pool.connect();
    try {
      const ok = await updateSubmissionImportStarted(
        client2,
        id,
        parsed.data.reviewer_label,
        out.job_id
      );
      if (!ok) {
        res.status(409).json({ error: 'Trạng thái bài nộp đã thay đổi', code: 'CONFLICT' });
        return;
      }
    } finally {
      client2.release();
    }

    res.status(200).json({
      ok: true,
      submission_id: id,
      import_job_id: out.job_id,
      import_status: out.status,
      total_rows: out.total_rows,
      error_rows: out.error_rows,
      conflict_rows: out.conflict_rows,
      message:
        out.conflict_rows > 0
          ? 'Import job đã tạo — có xung đột, xử lý như luồng import master-data (resolve-conflicts).'
          : 'Đã chấp nhận — hệ thống đang xử lý import (theo job).',
    });
  } catch (e) {
    if (isSubmissionsTableMissingError(e)) {
      respondMigrationRequired(res);
      return;
    }
    next(e);
  }
});

/** POST /api/v1/missing-data/submissions/:id/reject */
missingDataRouter.post('/submissions/:id/reject', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'id không hợp lệ', code: 'INVALID_ID' });
      return;
    }
    const parsed = rejectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const audit = submissionReviewerAudit(req);
      const ok = await updateSubmissionRejected(
        client,
        id,
        parsed.data.reviewer_label,
        parsed.data.reason,
        audit.reviewerMesUsername,
        audit.reviewerAccessLabel
      );
      if (!ok) {
        res.status(409).json({ error: 'Không từ chối được (đã xử lý hoặc không tồn tại)', code: 'CONFLICT' });
        return;
      }
      res.json({ ok: true, id, status: 'rejected' });
    } finally {
      client.release();
    }
  } catch (e) {
    if (isSubmissionsTableMissingError(e)) {
      respondMigrationRequired(res);
      return;
    }
    next(e);
  }
});

/** GET /api/v1/missing-data/summary — KPI + đếm theo nhà máy (Postgres) */
missingDataRouter.get('/summary', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const { totals, by_plant } = await getMissingDataSummary(client);
      const totalReportEvents = parseInt(totals.total_report_events, 10) || 0;
      const plantsWithReports = by_plant.filter((p) => p.record_count > 0).length;
      res.json({
        total_records: totals.total_records,
        total_report_events: totalReportEvents,
        distinct_materials: totals.distinct_materials,
        plants_with_reports: plantsWithReports,
        avg_reports_per_record:
          totals.total_records > 0
            ? Math.round((100 * totalReportEvents) / totals.total_records) / 100
            : 0,
        by_plant: by_plant.map((p) => ({
          plant_id: p.plant_id,
          plant_code: p.plant_code,
          plant_name: p.plant_name,
          record_count: p.record_count,
        })),
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** DELETE /api/v1/missing-data/reports/:id — admin xóa một bản ghi báo thiếu */
missingDataRouter.delete('/reports/:id', requireMesAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: 'id không hợp lệ', code: 'INVALID_ID' });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const ok = await deleteMissingCapabilityReportById(client, id);
      if (!ok) {
        res.status(404).json({ error: 'Không tìm thấy bản ghi', code: 'NOT_FOUND' });
        return;
      }
      res.json({ ok: true, deleted: 1 });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/missing-data/reports/bulk-delete — admin xóa nhiều bản ghi */
missingDataRouter.post('/reports/bulk-delete', requireMesAdmin, async (req, res, next) => {
  try {
    const parsed = bulkDeleteReportsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const deleted = await deleteMissingCapabilityReportsByIds(client, parsed.data.ids);
      res.json({ ok: true, deleted });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** GET /api/v1/missing-data — danh sách báo thiếu (Postgres) */
missingDataRouter.get('/', async (req, res, next) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Tham số không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { page, limit, plant_id, q } = parsed.data;
    const offset = (page - 1) * limit;
    const pool = getPool();
    const client = await pool.connect();
    try {
      let rows: Awaited<ReturnType<typeof listMissingCapabilityReports>>['rows'];
      let total: number;
      try {
        const out = await listMissingCapabilityReports(client, {
          plantId: plant_id ?? null,
          q: q ?? '',
          limit,
          offset,
          includeImportAttribution: true,
        });
        rows = out.rows;
        total = out.total;
      } catch (e) {
        if (isSubmissionsTableMissingError(e)) {
          const out = await listMissingCapabilityReports(client, {
            plantId: plant_id ?? null,
            q: q ?? '',
            limit,
            offset,
            includeImportAttribution: false,
          });
          rows = out.rows;
          total = out.total;
        } else {
          throw e;
        }
      }
      res.json({
        items: rows.map((r) => ({
          id: r.id,
          material_id: r.material_id,
          plant_id: r.plant_id,
          material_code: r.material_code,
          material_description: r.material_description,
          plant_code: r.plant_code,
          plant_name: r.plant_name,
          report_count: r.report_count,
          note: r.note,
          first_reported_at: r.first_reported_at,
          last_reported_at: r.last_reported_at,
          has_capability_at_plant: Boolean(r.has_capability_at_plant),
          capability_updated_at: r.capability_updated_at,
          data_update_attributed_user: r.data_update_attributed_user,
        })),
        total,
        page,
        page_size: limit,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/missing-data */
missingDataRouter.post('/', async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { material_id, plant_id, note } = parsed.data;
    const pool = getPool();
    const client = await pool.connect();
    try {
      const [mOk, pOk] = await Promise.all([
        materialExists(client, material_id),
        plantExists(client, plant_id),
      ]);
      if (!mOk) {
        res.status(404).json({ error: 'Không tìm thấy material', code: 'MATERIAL_NOT_FOUND' });
        return;
      }
      if (!pOk) {
        res.status(404).json({ error: 'Không tìm thấy nhà máy', code: 'PLANT_NOT_FOUND' });
        return;
      }

      const row = await upsertMissingCapabilityReport(client, {
        material_id,
        plant_id,
        note: note?.trim() ? note.trim() : null,
      });

      const isFirst = row.report_count === 1;

      res.status(isFirst ? 201 : 200).json({
        ok: true,
        is_first_report: isFirst,
        id: row.id,
        material_id: row.material_id,
        plant_id: row.plant_id,
        report_count: row.report_count,
        first_reported_at: row.first_reported_at,
        last_reported_at: row.last_reported_at,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

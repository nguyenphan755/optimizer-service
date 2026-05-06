import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { getPool } from '../db/client';
import { listPlants } from '../db/queries/plants';
import { listProcessSteps } from '../db/queries/processSteps';
import {
  getJobById,
  listImportConflicts,
  listImportErrors,
} from '../db/queries/importJobs';
import {
  runImportValidationPhase,
  resolveConflictsAndProcess,
} from '../services/importOrchestrator';

const MAX_SIZE = 50 * 1024 * 1024;

function uploadDir(): string {
  return path.resolve(process.env.UPLOAD_DIR || './uploads');
}

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

const router = Router();

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: message, code });
}

router.post(
  '/import',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 400, 'FILE_TOO_LARGE', 'File vượt quá 50MB');
        }
        if ((err as Error).message === 'INVALID_FILE_TYPE') {
          return sendError(
            res,
            400,
            'INVALID_FILE_TYPE',
            'Chỉ chấp nhận file .xlsx hoặc .xls'
          );
        }
        return next(err);
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file?.buffer) {
        return sendError(res, 400, 'FILE_REQUIRED', 'Thiếu file (field: file)');
      }
      const out = await runImportValidationPhase({
        buffer: req.file.buffer,
        originalFilename: req.file.originalname,
        uploadDir: uploadDir(),
      });
      res.status(202).json({
        job_id: out.job_id,
        status: out.status,
        total_rows: out.total_rows,
        error_rows: out.error_rows,
        conflict_rows: out.conflict_rows,
        errors: out.errors_preview.map((e) => ({
          sheet: e.sheet,
          row: e.row,
          material_code: e.material_code,
          column: e.column,
          raw_value: e.raw_value,
          message: e.message,
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post('/import/:jobId/resolve-conflicts', async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return sendError(res, 400, 'INVALID_JOB_ID', 'job_id không hợp lệ');
    }
    const body = req.body as { action?: string };
    if (body.action !== 'overwrite' && body.action !== 'skip') {
      return sendError(
        res,
        400,
        'INVALID_ACTION',
        'action phải là overwrite hoặc skip'
      );
    }
    const pool = getPool();
    const client = await pool.connect();
    let job;
    try {
      job = await getJobById(client, jobId);
    } finally {
      client.release();
    }
    if (!job) {
      return sendError(res, 404, 'NOT_FOUND', 'Job không tồn tại');
    }
    if (job.status !== 'awaiting_conflict_resolution') {
      return sendError(
        res,
        400,
        'INVALID_STATUS',
        'Job không ở trạng thái awaiting_conflict_resolution'
      );
    }
    await resolveConflictsAndProcess(jobId, uploadDir(), body.action);
    res.json({ job_id: jobId, status: 'processing' });
  } catch (e) {
    next(e);
  }
});

router.get('/import/:jobId/status', async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return sendError(res, 400, 'INVALID_JOB_ID', 'job_id không hợp lệ');
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const job = await getJobById(client, jobId);
      if (!job) {
        return sendError(res, 404, 'NOT_FOUND', 'Job không tồn tại');
      }

      const base: Record<string, unknown> = {
        job_id: job.id,
        status: job.status,
        total_rows: job.total_rows,
        success_rows: job.success_rows,
        error_rows: job.error_rows,
        conflict_rows: job.conflict_rows,
        conflict_action: job.conflict_action,
        created_at: job.created_at?.toISOString?.() ?? job.created_at,
        finished_at: job.finished_at?.toISOString?.() ?? job.finished_at,
      };

      if (job.status === 'awaiting_conflict_resolution') {
        const conflicts = await listImportConflicts(client, jobId);
        base.conflicts = conflicts.map((c: Record<string, unknown>) => ({
          id: c.id,
          sheet: c.sheet_name,
          row: c.row_number,
          material_code: c.material_code,
          factory: c.factory_name,
          machine_type: c.machine_type,
          existing: {
            design_speed: c.existing_design_speed != null ? Number(c.existing_design_speed) : null,
            actual_speed: c.existing_actual_speed != null ? Number(c.existing_actual_speed) : null,
            output_km_per_shift: c.existing_output_km != null ? Number(c.existing_output_km) : null,
          },
          incoming: {
            design_speed: c.incoming_design_speed != null ? Number(c.incoming_design_speed) : null,
            actual_speed: c.incoming_actual_speed != null ? Number(c.incoming_actual_speed) : null,
            output_km_per_shift: c.incoming_output_km != null ? Number(c.incoming_output_km) : null,
          },
        }));
      }

      if (job.error_rows > 0) {
        const errs = await listImportErrors(client, jobId, 200);
        base.errors = errs.map((e) => ({
          sheet: e.sheet_name,
          row: e.row_number,
          material_code: e.material_code,
          column: e.column_name,
          raw_value: e.raw_value,
          message: e.error_message,
        }));
      }

      res.json(base);
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

router.get('/import/:jobId/errors/export', async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return sendError(res, 400, 'INVALID_JOB_ID', 'job_id không hợp lệ');
    }
    const pool = getPool();
    const client = await pool.connect();
    try {
      const job = await getJobById(client, jobId);
      if (!job) {
        return sendError(res, 404, 'NOT_FOUND', 'Job không tồn tại');
      }
      const errs = await listImportErrors(client, jobId);
      const aoa = [
        ['Sheet', 'Row', 'Material Code', 'Column', 'Raw Value', 'Error Message'],
        ...errs.map((e) => [
          e.sheet_name ?? '',
          e.row_number ?? '',
          e.material_code ?? '',
          e.column_name ?? '',
          e.raw_value ?? '',
          e.error_message,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Errors');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="errors_job_${jobId}.xlsx"`
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.send(buf);
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

router.get('/plants', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const rows = await listPlants(client);
      res.json(rows.map((p) => ({ id: p.id, code: p.code, name: p.name })));
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

router.get('/process-steps', async (_req, res, next) => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const rows = await listProcessSteps(client);
      res.json(
        rows.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          sheet_name: p.sheet_name,
        }))
      );
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

export const masterDataRouter = router;

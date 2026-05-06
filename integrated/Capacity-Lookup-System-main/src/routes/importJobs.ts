import { Router } from 'express';
import { getPool } from '../db/client';
import { listImportJobs } from '../db/queries/importJobsList';

export const importJobsRouter = Router();

/** GET /api/v1/import-jobs */
importJobsRouter.get('/', async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === 'string' && req.query.status.trim() !== ''
        ? req.query.status.trim()
        : null;
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1),
      200
    );
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const offset = (page - 1) * limit;

    const pool = getPool();
    const client = await pool.connect();
    try {
      const { rows, total } = await listImportJobs(client, { limit, offset, status });
      res.json({
        items: rows.map((r) => ({
          id: r.id,
          filename: r.filename,
          status: r.status,
          total_rows: r.total_rows,
          success_rows: r.success_rows,
          error_rows: r.error_rows,
          conflict_rows: r.conflict_rows,
          created_at: r.created_at,
          finished_at: r.finished_at,
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

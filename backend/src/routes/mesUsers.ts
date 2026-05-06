import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/client';
import { requireMesAdmin } from '../middleware/authJwt';
import { mesUserCreateBodySchema, mesUserUnlockBodySchema } from '../validation/authSchemas';

export const mesUsersRouter = Router();
const HEAD_OFFICE_PLANT_CODE = 'HO';

/** GET /api/v1/users/locked — admin xem tài khoản đang bị khóa hoặc đang có lần sai. */
mesUsersRouter.get('/locked', requireMesAdmin, async (_req, res, next) => {
  try {
    const pool = getPool();
    const r = await pool.query<{
      id: number;
      username: string;
      role: 'admin' | 'user';
      display_name: string | null;
      failed_login_count: number;
      locked_until: string | null;
      is_active: boolean;
    }>(
      `SELECT id, username, role, display_name, failed_login_count, locked_until, is_active
       FROM mes_users
       WHERE is_active = true
         AND (failed_login_count > 0 OR (locked_until IS NOT NULL AND locked_until > now()))
       ORDER BY COALESCE(locked_until, to_timestamp(0)) DESC, failed_login_count DESC, username ASC`
    );
    res.json({ items: r.rows });
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/users — admin tạo tài khoản MES mới */
mesUsersRouter.post('/', requireMesAdmin, async (req, res, next) => {
  try {
    const parsed = mesUserCreateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'username, password (≥8 ký tự); role tùy chọn; plant_code tùy chọn (phải khớp bảng plants)',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const username = parsed.data.username.trim().toLowerCase();
    const { password, role } = parsed.data;
    const displayName =
      parsed.data.display_name === undefined || parsed.data.display_name === ''
        ? null
        : parsed.data.display_name.trim() || null;

    let plantCode: string | null = null;
    if (role === 'admin') {
      plantCode = null;
    } else {
      const raw = parsed.data.plant_code;
      if (raw && raw.trim()) {
        const normalized = raw.trim().toUpperCase();
        if (normalized === HEAD_OFFICE_PLANT_CODE) {
          plantCode = HEAD_OFFICE_PLANT_CODE;
        } else {
        const pool = getPool();
        const pr = await pool.query<{ code: string }>(
          `SELECT code FROM plants WHERE LOWER(TRIM(code)) = LOWER(TRIM($1)) LIMIT 1`,
          [normalized]
        );
        if (pr.rows.length === 0) {
          res.status(400).json({
            error: 'Mã nhà máy (plant_code) không tồn tại. Dùng mã plants hợp lệ hoặc HO (Head Office).',
            code: 'INVALID_PLANT',
          });
          return;
        }
        plantCode = pr.rows[0].code;
        }
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const pool = getPool();
    try {
      const r = await pool.query<{ id: number; username: string; role: string; plant_code: string | null; display_name: string | null }>(
        `INSERT INTO mes_users (username, password_hash, role, plant_code, display_name)
         VALUES ($1, $2, $3::mes_user_role, $4, $5)
         RETURNING id, username, role, plant_code, display_name`,
        [username, hash, role, plantCode, displayName]
      );
      const row = r.rows[0];
      res.status(201).json({
        user: {
          id: row.id,
          username: row.username,
          role: row.role,
          plant_code: row.plant_code,
          display_name: row.display_name,
        },
      });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === '23505') {
        res.status(409).json({ error: 'Tên đăng nhập đã tồn tại', code: 'DUPLICATE_USERNAME' });
        return;
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/users/:userId/unlock — admin mở khóa bằng lớp xác thực mật khẩu admin. */
mesUsersRouter.post('/:userId/unlock', requireMesAdmin, async (req, res, next) => {
  try {
    const parsed = mesUserUnlockBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Thiếu admin_password', code: 'VALIDATION_ERROR' });
      return;
    }
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId) || userId <= 0) {
      res.status(400).json({ error: 'userId không hợp lệ', code: 'VALIDATION_ERROR' });
      return;
    }

    const pool = getPool();
    const adminCheck = await pool.query<{ id: number; password_hash: string; is_active: boolean }>(
      `SELECT id, password_hash, is_active FROM mes_users WHERE id = $1 AND role = 'admin'::mes_user_role LIMIT 1`,
      [req.mesJwt!.sub]
    );
    const admin = adminCheck.rows[0];
    if (!admin || !admin.is_active) {
      res.status(401).json({ error: 'Phiên admin không hợp lệ', code: 'AUTH_INVALID' });
      return;
    }
    const adminPasswordOk = await bcrypt.compare(parsed.data.admin_password, admin.password_hash);
    if (!adminPasswordOk) {
      res.status(401).json({ error: 'Mật khẩu xác thực admin không đúng', code: 'AUTH_FAILED' });
      return;
    }

    const target = await pool.query<{ id: number; username: string }>(
      `SELECT id, username FROM mes_users WHERE id = $1 AND is_active = true LIMIT 1`,
      [userId]
    );
    if (target.rows.length === 0) {
      res.status(404).json({ error: 'Không tìm thấy user để mở khóa', code: 'NOT_FOUND' });
      return;
    }

    await pool.query(
      `UPDATE mes_users
       SET failed_login_count = 0, locked_until = NULL, updated_at = now()
       WHERE id = $1`,
      [userId]
    );
    res.json({ ok: true, user_id: userId, username: target.rows[0].username });
  } catch (e) {
    next(e);
  }
});

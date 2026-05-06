import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { getPool } from '../db/client';
import {
  newJti,
  signMesAccessToken,
  signMesRefreshToken,
  verifyMesAccessToken,
  verifyMesRefreshToken,
  decodeAccessJtiUnsafe,
} from '../auth/jwt';
import {
  REFRESH_COOKIE,
  clearAccessCookie,
  clearRefreshCookie,
  setAccessCookie,
  setRefreshCookie,
} from '../auth/cookies';
import {
  denyAccessJti,
  insertRefreshRow,
  findRefreshByJti,
  revokeRefreshJti,
  revokeRefreshFamily,
  revokeAllRefreshForUser,
} from '../auth/tokenStore';
import { requireMesAuth, readAccessTokenFromRequest } from '../middleware/authJwt';
import { loginBodySchema, passwordChangeBodySchema } from '../validation/authSchemas';
import { randomUUID } from 'crypto';

export const authRouter = Router();

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_FAIL_LOCK_THRESHOLD = 3;
const LOGIN_LOCK_MS = 30 * 60 * 1000;

const USER_SELECT = `u.id, u.username, u.password_hash, u.role, u.plant_code, u.display_name, u.is_active,
       p.id AS factory_id, u.failed_login_count, u.locked_until`;
const USER_FROM = `mes_users u
LEFT JOIN plants p ON p.code = u.plant_code`;

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests' },
});

interface MesUserRow {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  plant_code: string | null;
  display_name: string | null;
  is_active: boolean;
  factory_id: number | null;
  failed_login_count?: number;
  locked_until?: string | null;
}

function publicUser(row: MesUserRow) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    plant_code: row.plant_code,
    display_name: row.display_name,
  };
}

function accessExpiryFromToken(token: string): Date {
  const d = jwt.decode(token) as jwt.JwtPayload | null;
  if (d?.exp) return new Date(d.exp * 1000);
  return new Date(Date.now() + 15 * 60 * 1000);
}

async function issueSession(
  res: Response,
  row: MesUserRow,
  reuseFamilyId?: string
): Promise<void> {
  const accessJti = newJti();
  const refreshJti = newJti();
  const familyId = reuseFamilyId ?? randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_MS);

  await insertRefreshRow(row.id, refreshJti, familyId, expiresAt);

  const accessToken = signMesAccessToken(
    {
      sub: row.id,
      username: row.username,
      role: row.role,
      plant_code: row.plant_code,
      factory_id: row.factory_id ?? null,
    },
    accessJti
  );
  const refreshToken = signMesRefreshToken(row.id, refreshJti);
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
}

/** POST /api/v1/auth/login */
authRouter.post('/login', authLoginLimiter, async (req, res, next) => {
  try {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dữ liệu không hợp lệ', code: 'VALIDATION_ERROR' });
      return;
    }
    const username = parsed.data.username.trim().toLowerCase();
    const password = parsed.data.password;

    const pool = getPool();
    const r = await pool.query<MesUserRow>(
      `SELECT ${USER_SELECT}
       FROM ${USER_FROM} WHERE LOWER(u.username) = LOWER($1) LIMIT 1`,
      [username]
    );
    const row = r.rows[0];
    if (!row || !row.is_active) {
      res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu', code: 'AUTH_FAILED' });
      return;
    }
    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      res.status(423).json({
        error: 'Tài khoản đang bị khóa do nhập sai mật khẩu nhiều lần.',
        code: 'ACCOUNT_LOCKED',
        locked_until: row.locked_until,
      });
      return;
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      const currentFails = row.failed_login_count ?? 0;
      const nextFails = currentFails + 1;
      if (nextFails >= LOGIN_FAIL_LOCK_THRESHOLD) {
        const lockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
        await pool.query(
          `UPDATE mes_users
           SET failed_login_count = 0, locked_until = $1, updated_at = now()
           WHERE id = $2`,
          [lockedUntil.toISOString(), row.id]
        );
        res.status(423).json({
          error: 'Tài khoản bị khóa 30 phút do nhập sai mật khẩu 3 lần.',
          code: 'ACCOUNT_LOCKED',
          locked_until: lockedUntil.toISOString(),
        });
        return;
      }
      await pool.query(
        `UPDATE mes_users
         SET failed_login_count = $1, updated_at = now()
         WHERE id = $2`,
        [nextFails, row.id]
      );
      res.status(401).json({
        error: 'Sai tài khoản hoặc mật khẩu',
        code: 'AUTH_FAILED',
        remaining_attempts: LOGIN_FAIL_LOCK_THRESHOLD - nextFails,
      });
      return;
    }
    if ((row.failed_login_count ?? 0) > 0 || row.locked_until) {
      await pool.query(
        `UPDATE mes_users
         SET failed_login_count = 0, locked_until = NULL, updated_at = now()
         WHERE id = $1`,
        [row.id]
      );
    }

    await issueSession(res, row);
    res.json({ user: publicUser(row) });
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/auth/refresh */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw || typeof raw !== 'string') {
      res.status(401).json({ error: 'Thiếu refresh session', code: 'NO_REFRESH' });
      return;
    }

    let payload: { sub: number; jti: string; typ: 'refresh' };
    try {
      payload = verifyMesRefreshToken(raw);
    } catch {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Refresh token không hợp lệ', code: 'INVALID_REFRESH' });
      return;
    }

    const row = await findRefreshByJti(payload.jti);
    if (!row) {
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Phiên không tồn tại', code: 'SESSION_GONE' });
      return;
    }

    if (row.revoked_at) {
      await revokeRefreshFamily(row.family_id);
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Phiên đã thu hồi', code: 'REFRESH_REUSE' });
      return;
    }

    if (new Date(row.expires_at) <= new Date()) {
      await revokeRefreshJti(payload.jti);
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Phiên hết hạn', code: 'SESSION_EXPIRED' });
      return;
    }

    const pool = getPool();
    const ur = await pool.query<MesUserRow>(
      `SELECT ${USER_SELECT}
       FROM ${USER_FROM} WHERE u.id = $1 LIMIT 1`,
      [payload.sub]
    );
    const userRow = ur.rows[0];
    if (!userRow || !userRow.is_active) {
      await revokeRefreshFamily(row.family_id);
      clearRefreshCookie(res);
      res.status(401).json({ error: 'Tài khoản không hợp lệ', code: 'AUTH_INVALID' });
      return;
    }

    await revokeRefreshJti(payload.jti);
    await issueSession(res, userRow, row.family_id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/auth/logout */
authRouter.post('/logout', requireMesAuth, async (req, res, next) => {
  try {
    const token = readAccessTokenFromRequest(req) || '';

    try {
      const payload = verifyMesAccessToken(token);
      await denyAccessJti(payload.jti, accessExpiryFromToken(token));
      await revokeAllRefreshForUser(payload.sub);
    } catch {
      const jti = decodeAccessJtiUnsafe(token);
      const dec = jwt.decode(token) as jwt.JwtPayload | null;
      const subRaw = dec?.sub;
      const sub =
        typeof subRaw === 'number' ? subRaw : typeof subRaw === 'string' ? parseInt(subRaw, 10) : NaN;
      if (jti) {
        await denyAccessJti(jti, dec?.exp ? new Date(dec.exp * 1000) : new Date(Date.now() + 60_000));
      }
      if (!Number.isNaN(sub)) {
        await revokeAllRefreshForUser(sub);
      }
    }

    clearAccessCookie(res);
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** GET /api/v1/auth/me */
authRouter.get('/me', requireMesAuth, async (req, res, next) => {
  try {
    const jwtPayload = req.mesJwt!;
    const pool = getPool();
    const r = await pool.query<MesUserRow>(
      `SELECT ${USER_SELECT}
       FROM ${USER_FROM} WHERE u.id = $1 LIMIT 1`,
      [jwtPayload.sub]
    );
    const row = r.rows[0];
    if (!row || !row.is_active) {
      res.status(401).json({ error: 'Tài khoản không còn hợp lệ', code: 'AUTH_INVALID' });
      return;
    }
    res.json({ user: publicUser(row) });
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/auth/password */
authRouter.post('/password', requireMesAuth, async (req, res, next) => {
  try {
    const parsed = passwordChangeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Cần current_password và new_password (tối thiểu 8 ký tự)',
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    const { current_password: current, new_password: nextPw } = parsed.data;

    const pool = getPool();
    const r = await pool.query<MesUserRow>(
      `SELECT id, password_hash FROM mes_users WHERE id = $1 AND is_active = true LIMIT 1`,
      [req.mesJwt!.sub]
    );
    const row = r.rows[0];
    if (!row) {
      res.status(401).json({ error: 'Không tìm thấy user', code: 'NOT_FOUND' });
      return;
    }
    const ok = await bcrypt.compare(current, row.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'Mật khẩu hiện tại không đúng', code: 'AUTH_FAILED' });
      return;
    }

    const hash = await bcrypt.hash(nextPw, 10);
    await pool.query(`UPDATE mes_users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
      hash,
      row.id,
    ]);
    const token = readAccessTokenFromRequest(req);
    if (token) {
      try {
        const p = verifyMesAccessToken(token);
        await denyAccessJti(p.jti, accessExpiryFromToken(token));
      } catch {
        /* ignore */
      }
    }
    await revokeAllRefreshForUser(row.id);
    clearAccessCookie(res);
    clearRefreshCookie(res);
    res.json({ ok: true, message: 'Đăng nhập lại trên các thiết bị khác nếu có.' });
  } catch (e) {
    next(e);
  }
});

import { Request, Response, NextFunction } from 'express';
import { verifyMesAccessToken, MesJwtPayload } from '../auth/jwt';
import { isAccessJtiDenied } from '../auth/tokenStore';
import { ACCESS_COOKIE } from '../auth/cookies';

export interface MesAuthUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
  plant_code: string | null;
  display_name: string | null;
}

declare global {
  namespace Express {
    interface Request {
      mesUser?: MesAuthUser;
      mesJwt?: MesJwtPayload;
    }
  }
}

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  const t = h.slice(7).trim();
  return t || null;
}

/** Cookie httpOnly trước, Bearer (Postman / công cụ) sau. */
export function readAccessTokenFromRequest(req: Request): string | null {
  const raw = req.cookies?.[ACCESS_COOKIE];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t) return t;
  }
  return bearerToken(req);
}

/** Gắn req.mesJwt nếu có access token hợp lệ; không trả 401. */
export function optionalMesAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readAccessTokenFromRequest(req);
  if (!token) {
    next();
    return;
  }
  void (async () => {
    try {
      const payload = verifyMesAccessToken(token);
      if (await isAccessJtiDenied(payload.jti)) {
        next();
        return;
      }
      req.mesJwt = payload;
    } catch {
      /* ignore */
    }
    next();
  })();
}

/** Bắt buộc JWT hợp lệ và jti chưa bị thu hồi. */
export function requireMesAuth(req: Request, res: Response, next: NextFunction): void {
  const token = readAccessTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Thiếu phiên đăng nhập', code: 'UNAUTHORIZED' });
    return;
  }
  void (async () => {
    try {
      const payload = verifyMesAccessToken(token);
      if (await isAccessJtiDenied(payload.jti)) {
        res.status(401).json({ error: 'Token đã thu hồi', code: 'TOKEN_REVOKED' });
        return;
      }
      req.mesJwt = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn', code: 'INVALID_TOKEN' });
    }
  })();
}

/** Sau khi đã xác thực — chỉ role admin. */
export function requireMesAdmin(req: Request, res: Response, next: NextFunction): void {
  requireMesAuth(req, res, () => {
    if (req.mesJwt?.role !== 'admin') {
      res.status(403).json({ error: 'Chỉ quản trị viên mới được thực hiện', code: 'FORBIDDEN' });
      return;
    }
    next();
  });
}

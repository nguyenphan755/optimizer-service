import net from 'net';
import { Request, Response, NextFunction } from 'express';
import { getPool } from '../db/client';

function safeInet(req: Request): string | null {
  const raw = req.ip || req.socket.remoteAddress;
  if (!raw || net.isIP(raw) === 0) return null;
  return raw;
}

/**
 * Ghi nhận mỗi request API vào audit_logs (không log body / Authorization).
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    void (async () => {
      try {
        const p = req.originalUrl.split('?')[0] || '';
        if (p === '/health' || p === '/') return;
        const pool = getPool();
        const userId = req.mesJwt?.sub ?? null;
        const ip = safeInet(req);
        const path = req.originalUrl.length > 2000 ? req.originalUrl.slice(0, 2000) : req.originalUrl;
        const factoryId = req.mesJwt?.factory_id ?? null;
        await pool.query(
          `INSERT INTO audit_logs (method, path, status_code, user_id, factory_id, ip, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6::inet, $7)`,
          [
            req.method,
            path,
            res.statusCode,
            userId,
            factoryId,
            ip,
            String(req.get('user-agent') || '').slice(0, 500),
          ]
        );
      } catch (e) {
        console.error('[audit] insert failed', e);
      }
    })();
  });
  next();
}

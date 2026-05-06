import type { Response } from 'express';

export const ACCESS_COOKIE = 'mes_access';
export const REFRESH_COOKIE = 'mes_refresh';

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

/** Parse JWT_ACCESS_EXPIRES_IN (vd. 15m, 1h) → milliseconds cho Max-Age cookie. */
export function accessCookieMaxAgeMs(): number {
  const raw = (process.env.JWT_ACCESS_EXPIRES_IN || '15m').trim();
  const m = /^(\d+)(s|m|h|d)$/i.exec(raw);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u === 's') return n * 1000;
  if (u === 'm') return n * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
}

export function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: accessCookieMaxAgeMs(),
  });
}

export function clearAccessCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/api' });
}

export function setRefreshCookie(res: Response, refreshJwt: string): void {
  res.cookie(REFRESH_COOKIE, refreshJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: REFRESH_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

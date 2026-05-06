import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export interface MesJwtPayload {
  sub: number;
  username: string;
  role: 'admin' | 'user';
  plant_code: string | null;
  /** maps plants.id khi user có plant_code khớp nhà máy */
  factory_id: number | null;
  jti: string;
}

export interface MesRefreshPayload {
  sub: number;
  jti: string;
  typ: 'refresh';
}

const isProd = () => process.env.NODE_ENV === 'production';

/** Production: ≥32 ký tự (tương đương entropy khuyến nghị cho HMAC). */
function getAccessSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (isProd()) {
    if (!s || s.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters in production');
    }
    return s;
  }
  if (s && s.length >= 16) return s;
  console.warn('[auth] JWT_SECRET dev-only fallback — không dùng production.');
  return 'dev-mes-jwt-secret-min-16chars!!';
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET?.trim();
  if (isProd()) {
    if (!s || s.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters in production');
    }
    if (s === process.env.JWT_SECRET?.trim()) {
      throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET in production');
    }
    return s;
  }
  if (s && s.length >= 16) return s;
  return `${getAccessSecret()}-refresh-dev`;
}

export function newJti(): string {
  return randomUUID();
}

export function signMesAccessToken(
  payload: Omit<MesJwtPayload, 'jti'>,
  jti: string
): string {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const full: MesJwtPayload = { ...payload, jti };
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(full, getAccessSecret(), options);
}

export function signMesRefreshToken(sub: number, jti: string): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const payload: MesRefreshPayload = { sub, jti, typ: 'refresh' };
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, getRefreshSecret(), options);
}

export function verifyMesAccessToken(token: string): MesJwtPayload {
  const decoded = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload & Partial<MesJwtPayload>;
  const jti = typeof decoded.jti === 'string' ? decoded.jti : (decoded as { jwtid?: string }).jwtid;
  if (
    typeof decoded.sub !== 'number' ||
    typeof decoded.username !== 'string' ||
    (decoded.role !== 'admin' && decoded.role !== 'user') ||
    typeof jti !== 'string' ||
    !jti
  ) {
    throw new Error('Invalid access token payload');
  }
  const factoryRaw = (decoded as { factory_id?: unknown }).factory_id;
  const factory_id =
    typeof factoryRaw === 'number' && Number.isFinite(factoryRaw) ? factoryRaw : null;

  return {
    sub: decoded.sub,
    username: decoded.username,
    role: decoded.role,
    plant_code: decoded.plant_code ?? null,
    factory_id,
    jti,
  };
}

export function verifyMesRefreshToken(token: string): MesRefreshPayload {
  const decoded = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload & Partial<MesRefreshPayload>;
  if (decoded.typ !== 'refresh' || typeof decoded.sub !== 'number' || typeof decoded.jti !== 'string') {
    throw new Error('Invalid refresh token payload');
  }
  return { sub: decoded.sub, jti: decoded.jti, typ: 'refresh' };
}

/** Decode không verify — chỉ để lấy jti khi logout nếu verify fail (hết hạn). */
export function decodeAccessJtiUnsafe(token: string): string | null {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded) return null;
  const jti = typeof decoded.jti === 'string' ? decoded.jti : decoded.jwtid;
  return typeof jti === 'string' ? jti : null;
}

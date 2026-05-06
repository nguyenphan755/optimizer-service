import { getPool } from '../db/client';

export async function isAccessJtiDenied(jti: string): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(`SELECT 1 FROM mes_jti_denylist WHERE jti = $1 AND expires_at > now()`, [jti]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function denyAccessJti(jti: string, expiresAt: Date): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO mes_jti_denylist (jti, expires_at) VALUES ($1, $2)
     ON CONFLICT (jti) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
    [jti, expiresAt]
  );
}

interface RefreshRow {
  user_id: number;
  jti: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export async function insertRefreshRow(
  userId: number,
  jti: string,
  familyId: string,
  expiresAt: Date
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO mes_refresh_tokens (user_id, jti, family_id, expires_at) VALUES ($1, $2::uuid, $3::uuid, $4)`,
    [userId, jti, familyId, expiresAt]
  );
}

/** Bao gồm bản ghi đã revoked (phát hiện reuse). */
export async function findRefreshByJti(jti: string): Promise<RefreshRow | null> {
  const pool = getPool();
  const r = await pool.query<RefreshRow>(
    `SELECT user_id, jti::text, family_id::text, expires_at, revoked_at
     FROM mes_refresh_tokens WHERE jti = $1::uuid LIMIT 1`,
    [jti]
  );
  return r.rows[0] ?? null;
}

export async function revokeRefreshJti(jti: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE mes_refresh_tokens SET revoked_at = now() WHERE jti = $1::uuid AND revoked_at IS NULL`,
    [jti]
  );
}

/** Phát hiện reuse: thu hồi toàn bộ family. */
export async function revokeRefreshFamily(familyId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE mes_refresh_tokens SET revoked_at = now() WHERE family_id = $1::uuid AND revoked_at IS NULL`,
    [familyId]
  );
}

export async function revokeAllRefreshForUser(userId: number): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE mes_refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

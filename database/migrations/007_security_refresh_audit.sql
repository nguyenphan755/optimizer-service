-- Refresh rotation, access jti denylist, audit API (security hardening)
CREATE TABLE IF NOT EXISTS mes_refresh_tokens (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES mes_users(id) ON DELETE CASCADE,
  jti          UUID NOT NULL UNIQUE,
  family_id    UUID NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mes_refresh_user ON mes_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mes_refresh_family ON mes_refresh_tokens(family_id);

CREATE TABLE IF NOT EXISTS mes_jti_denylist (
  jti         TEXT PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mes_jti_denylist_exp ON mes_jti_denylist(expires_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  method        VARCHAR(12) NOT NULL,
  path          TEXT NOT NULL,
  status_code   INT,
  user_id       INT REFERENCES mes_users(id) ON DELETE SET NULL,
  ip            INET,
  user_agent    TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

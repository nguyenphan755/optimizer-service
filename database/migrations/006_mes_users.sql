-- MES web users: bcrypt hashes + JWT session (see .cursor/skills/mes-login-account-auth)
DO $$
BEGIN
  CREATE TYPE mes_user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mes_users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(80) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            mes_user_role NOT NULL DEFAULT 'user',
  plant_code      VARCHAR(20),
  display_name    VARCHAR(150),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mes_users_username ON mes_users(username);

COMMENT ON TABLE mes_users IS 'MES Capacity UI: bcrypt password, JWT; plant_code NULL = all plants (admin)';

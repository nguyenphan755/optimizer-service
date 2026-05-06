-- =============================================================================
-- CADIVI Production Intelligence — PostgreSQL schema (DDL đầy đủ)
-- Database mục tiêu: ví dụ cadivi_production_intelligence
-- Áp dụng: psql -f db/schema.sql   hoặc   npx ts-node db/migrate.ts
-- Sau đó seed: npx ts-node db/seed.ts
-- =============================================================================

-- Nhà máy CADIVI (seed: DN, LT, TA, BN, …)
CREATE TABLE plants (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20) UNIQUE NOT NULL,  -- 'DN', 'LT', 'TA'
  name        VARCHAR(100) NOT NULL,         -- 'Đà Nẵng', 'Long Thành', 'Tân Á'
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Process step (công đoạn): Kéo, Xoắn, Giáp, Bọc
CREATE TABLE process_steps (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(20) UNIQUE NOT NULL, -- 'KEO','XOAN','GIAP','BOC'
  name          VARCHAR(100) NOT NULL,        -- 'Kéo', 'Xoắn', 'Giáp', 'Bọc'
  sheet_name    VARCHAR(100) NOT NULL,        -- tên sheet Excel tương ứng
  material_prefix VARCHAR(2) NOT NULL         -- '52','53','55','56'
);

-- Máy móc — machine_type khớp cột "Machine Type" trong Excel (trim khi insert)
CREATE TABLE machines (
  id               SERIAL PRIMARY KEY,
  plant_id         INT NOT NULL REFERENCES plants(id),
  process_step_id  INT NOT NULL REFERENCES process_steps(id),
  machine_type     VARCHAR(200) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plant_id, process_step_id, machine_type)
);

-- Material master
CREATE TABLE materials (
  id            SERIAL PRIMARY KEY,
  material_code          VARCHAR(20) NOT NULL,
  material_description   VARCHAR(500) NOT NULL,
  process_step_id INT NOT NULL REFERENCES process_steps(id),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', material_code || ' ' || material_description)
  ) STORED,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(material_code, process_step_id)
);
CREATE INDEX idx_materials_search ON materials USING GIN(search_vector);
CREATE INDEX idx_materials_material_code ON materials(material_code);

-- Năng lực sản xuất — bảng trung tâm (tên cột khớp Excel / nội bộ)
CREATE TABLE production_capabilities (
  id                  SERIAL PRIMARY KEY,
  material_id         INT NOT NULL REFERENCES materials(id),
  plant_id            INT NOT NULL REFERENCES plants(id),
  machine_id          INT NOT NULL REFERENCES machines(id),
  process_step_id     INT NOT NULL REFERENCES process_steps(id),

  design_speed        NUMERIC(10,3),   -- Design Speed (m/min)
  actual_speed        NUMERIC(10,3),   -- Actual Speed (m/min)
  actual_speed_ms     NUMERIC(10,4)
                      GENERATED ALWAYS AS (
                        CASE WHEN actual_speed IS NOT NULL
                             THEN ROUND((actual_speed / 60.0)::NUMERIC, 4)
                             ELSE NULL END
                      ) STORED,

  output_km_per_shift  NUMERIC(10,4),
  output_kg_per_shift  NUMERIC(12,4),
  is_recommended      BOOLEAN DEFAULT false,
  source              VARCHAR(20) DEFAULT 'import',

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE(material_id, plant_id, machine_id)
);
CREATE INDEX idx_cap_material      ON production_capabilities(material_id);
CREATE INDEX idx_cap_plant         ON production_capabilities(plant_id);
CREATE INDEX idx_cap_process_step  ON production_capabilities(process_step_id);

-- Import job tracking
CREATE TYPE import_status AS ENUM
  ('uploaded', 'validating', 'awaiting_conflict_resolution', 'processing', 'done', 'partial_error', 'failed');

CREATE TABLE import_jobs (
  id              SERIAL PRIMARY KEY,
  filename        VARCHAR(500) NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  total_rows      INT DEFAULT 0,
  success_rows    INT DEFAULT 0,
  error_rows      INT DEFAULT 0,
  conflict_rows   INT DEFAULT 0,
  conflict_action VARCHAR(10),
  status          import_status DEFAULT 'uploaded',
  created_by      INT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

CREATE TABLE import_errors (
  id            SERIAL PRIMARY KEY,
  job_id        INT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  sheet_name    VARCHAR(100),
  row_number    INT,
  material_code VARCHAR(50),
  column_name   VARCHAR(100),
  raw_value     TEXT,
  error_message TEXT NOT NULL
);

CREATE TABLE import_conflicts (
  id                      SERIAL PRIMARY KEY,
  job_id                  INT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  sheet_name              VARCHAR(100),
  row_number              INT,
  material_code           VARCHAR(50),
  factory_name            VARCHAR(100),
  machine_type            VARCHAR(200),
  existing_design_speed   NUMERIC(10,3),
  existing_actual_speed   NUMERIC(10,3),
  existing_output_km      NUMERIC(10,4),
  incoming_design_speed   NUMERIC(10,3),
  incoming_actual_speed   NUMERIC(10,3),
  incoming_output_km      NUMERIC(10,4)
);

-- Báo cáo thiếu năng lực (UI: "Đánh dấu thiếu data")
CREATE TABLE missing_capability_reports (
  id SERIAL PRIMARY KEY,
  material_id INT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  plant_id INT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  note TEXT,
  first_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_count INT NOT NULL DEFAULT 1,
  UNIQUE(material_id, plant_id)
);
CREATE INDEX idx_missing_cap_reports_material ON missing_capability_reports(material_id);
CREATE INDEX idx_missing_cap_reports_plant ON missing_capability_reports(plant_id);

-- Bài nộp bổ sung dữ liệu thiếu (Plant Upload → Approval → import)
-- Chi tiết: db/migrations/005_missing_data_submissions.sql + 010_submission_reviewer_audit.sql (reviewer_mes_username, reviewer_access_label)

CREATE TABLE resistance_measurements (
  id SERIAL PRIMARY KEY,
  loai_sp VARCHAR(10) NOT NULL,
  tiet_dien NUMERIC(12, 3) NOT NULL,
  ket_cau TEXT NOT NULL,
  plant_id INT REFERENCES plants(id),
  plant_code_excel VARCHAR(40),
  ca INT,
  observed_at TIMESTAMPTZ NOT NULL,
  dien_tro_max NUMERIC(18, 8),
  dien_tro_max_raw TEXT,
  dien_tro_tt NUMERIC(18, 8),
  ty_le_dien_tro_pct NUMERIC(18, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resistance_lookup ON resistance_measurements(loai_sp, tiet_dien, ket_cau);
CREATE INDEX idx_resistance_observed ON resistance_measurements(observed_at DESC);

-- =============================================================================
-- MES web users (login UI): bcrypt password hash + JWT — skill mes-login-account-auth
-- =============================================================================
CREATE TYPE mes_user_role AS ENUM ('admin', 'user');

CREATE TABLE mes_users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(80) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            mes_user_role NOT NULL DEFAULT 'user',
  plant_code      VARCHAR(20),
  display_name    VARCHAR(150),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  failed_login_count INT NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mes_users_username ON mes_users(username);
CREATE INDEX idx_mes_users_locked_until ON mes_users(locked_until);

CREATE TABLE mes_refresh_tokens (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES mes_users(id) ON DELETE CASCADE,
  jti          UUID NOT NULL UNIQUE,
  family_id    UUID NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mes_refresh_user ON mes_refresh_tokens(user_id);
CREATE INDEX idx_mes_refresh_family ON mes_refresh_tokens(family_id);

CREATE TABLE mes_jti_denylist (
  jti         TEXT PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_mes_jti_denylist_exp ON mes_jti_denylist(expires_at);

CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  method        VARCHAR(12) NOT NULL,
  path          TEXT NOT NULL,
  status_code   INT,
  user_id       INT REFERENCES mes_users(id) ON DELETE SET NULL,
  factory_id    INT REFERENCES plants(id) ON DELETE SET NULL,
  ip            INET,
  user_agent    TEXT
);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_factory ON audit_logs(factory_id);

-- Đo điện trở (sheet DATA Excel điện trở — chỉ dùng tra cứu theo tiết diện + kết cấu + Loại SP)
-- Chạy: npm run db:migrate-004

CREATE TABLE IF NOT EXISTS resistance_measurements (
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

CREATE INDEX IF NOT EXISTS idx_resistance_lookup
  ON resistance_measurements(loai_sp, tiet_dien, ket_cau);
CREATE INDEX IF NOT EXISTS idx_resistance_observed
  ON resistance_measurements(observed_at DESC);

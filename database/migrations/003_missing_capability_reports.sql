-- Báo cáo material + nhà máy chưa có năng lực (thiếu data)
--
-- Cách 1 (khuyên dùng, dùng .env gốc dự án):
--   npm run db:migrate-003
--
-- Cách 2 (psql):
--   psql -h localhost -U postgres -d <DB_NAME> -f db/migrations/003_missing_capability_reports.sql

CREATE TABLE IF NOT EXISTS missing_capability_reports (
  id SERIAL PRIMARY KEY,
  material_id INT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  plant_id INT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  note TEXT,
  first_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_count INT NOT NULL DEFAULT 1,
  UNIQUE(material_id, plant_id)
);

CREATE INDEX IF NOT EXISTS idx_missing_cap_reports_material
  ON missing_capability_reports(material_id);
CREATE INDEX IF NOT EXISTS idx_missing_cap_reports_plant
  ON missing_capability_reports(plant_id);

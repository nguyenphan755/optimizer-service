-- Bài nộp bổ sung dữ liệu thiếu: chờ duyệt → chạy import sau khi chuyên viên chấp nhận
-- Chạy: npm run db:migrate-005  hoặc psql -f db/migrations/005_missing_data_submissions.sql

CREATE TYPE missing_submission_status AS ENUM (
  'pending_review',
  'rejected',
  'import_started'
);

CREATE TABLE IF NOT EXISTS missing_data_submissions (
  id                SERIAL PRIMARY KEY,
  plant_id          INT NOT NULL REFERENCES plants(id),
  original_filename VARCHAR(500) NOT NULL,
  stored_path       VARCHAR(500) NOT NULL,
  template_row_hint INT DEFAULT 0,
  submitter_note    VARCHAR(500),
  status            missing_submission_status NOT NULL DEFAULT 'pending_review',
  reviewed_at       TIMESTAMPTZ,
  reviewer_label    VARCHAR(200),
  rejection_reason  TEXT,
  import_job_id     INT REFERENCES import_jobs(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missing_submissions_plant ON missing_data_submissions(plant_id);
CREATE INDEX IF NOT EXISTS idx_missing_submissions_status ON missing_data_submissions(status);
CREATE INDEX IF NOT EXISTS idx_missing_submissions_created ON missing_data_submissions(created_at DESC);

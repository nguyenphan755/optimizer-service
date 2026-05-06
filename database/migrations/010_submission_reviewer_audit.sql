-- Ghi nhận user JWT khi từ chối bài nộp (hiển thị cho nhà máy)
-- Chạy: npm run db:migrate-010

ALTER TABLE missing_data_submissions
  ADD COLUMN IF NOT EXISTS reviewer_mes_username VARCHAR(120),
  ADD COLUMN IF NOT EXISTS reviewer_access_label VARCHAR(40);

COMMENT ON COLUMN missing_data_submissions.reviewer_mes_username IS 'username từ JWT lúc reject';
COMMENT ON COLUMN missing_data_submissions.reviewer_access_label IS 'Admin | Head Office | User (theo JWT)';

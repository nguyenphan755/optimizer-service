-- audit_logs: gắn nhà máy (plants.id) khi user JWT có factory_id
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS factory_id INTEGER NULL REFERENCES plants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_audit_factory ON audit_logs(factory_id);

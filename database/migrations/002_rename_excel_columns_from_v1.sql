-- Chạy migration này CHỈ KHI database đã tạo từ 001_initial_schema.sql (phiên bản cũ: code, name, design_speed_mpm, …).
-- Nếu tạo mới hoàn toàn từ 001 đã cập nhật, BỎ QUA file này.

BEGIN;

ALTER TABLE materials DROP COLUMN IF EXISTS search_vector;
ALTER TABLE materials RENAME COLUMN code TO material_code;
ALTER TABLE materials RENAME COLUMN description TO material_description;
ALTER TABLE materials ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', material_code || ' ' || material_description)
) STORED;
CREATE INDEX IF NOT EXISTS idx_materials_search ON materials USING GIN(search_vector);
DROP INDEX IF EXISTS idx_materials_code;
CREATE INDEX IF NOT EXISTS idx_materials_material_code ON materials(material_code);

ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_plant_id_process_step_id_name_key;
ALTER TABLE machines RENAME COLUMN name TO machine_type;
ALTER TABLE machines ADD CONSTRAINT machines_plant_id_process_step_id_machine_type_key
  UNIQUE (plant_id, process_step_id, machine_type);

ALTER TABLE production_capabilities DROP COLUMN IF EXISTS actual_speed_mps;
ALTER TABLE production_capabilities RENAME COLUMN design_speed_mpm TO design_speed;
ALTER TABLE production_capabilities RENAME COLUMN actual_speed_mpm TO actual_speed;
ALTER TABLE production_capabilities RENAME COLUMN output_km_shift TO output_km_per_shift;
ALTER TABLE production_capabilities RENAME COLUMN output_kg_shift TO output_kg_per_shift;
ALTER TABLE production_capabilities ADD COLUMN actual_speed_ms NUMERIC(10,4)
  GENERATED ALWAYS AS (
    CASE WHEN actual_speed IS NOT NULL
         THEN ROUND((actual_speed / 60.0)::NUMERIC, 4)
         ELSE NULL END
  ) STORED;

ALTER TABLE import_conflicts RENAME COLUMN machine_name TO machine_type;

COMMIT;

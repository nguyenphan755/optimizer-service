export type ImportStatus =
  | 'uploaded'
  | 'validating'
  | 'awaiting_conflict_resolution'
  | 'processing'
  | 'done'
  | 'partial_error'
  | 'failed';

export type ConflictAction = 'overwrite' | 'skip';

export interface ProcessStepRow {
  id: number;
  code: string;
  name: string;
  sheet_name: string;
  material_prefix: string;
}

export interface PlantRow {
  id: number;
  code: string;
  name: string;
}

/** Sau excelParser — key nội bộ thống nhất 4 sheet. */
export interface NormalizedExcelCells {
  material_code: unknown;
  material_description: unknown;
  design_speed: unknown;
  actual_speed: unknown;
  output_km_per_shift: unknown;
  output_kg_per_shift: unknown;
  factory: unknown;
  machine_type: unknown;
}

export interface ParsedExcelRow {
  sheet_name: string;
  row_number: number;
  process_step_id: number;
  material_prefix: string;
  cells: NormalizedExcelCells;
}

export interface ValidationErrorDetail {
  sheet: string;
  row: number;
  material_code: string | null;
  column: string;
  raw_value: unknown;
  message: string;
}

export interface ValidatedImportRow {
  sheet_name: string;
  row_number: number;
  material_code: string;
  material_description: string;
  design_speed: number | null;
  actual_speed: number | null;
  output_km_per_shift: number | null;
  output_kg_per_shift: number | null;
  plant_id: number;
  plant_name: string;
  machine_type: string;
  process_step_id: number;
  is_conflict: boolean;
}

export interface ConflictRow {
  material_code: string;
  plant_id: number;
  machine_type: string;
  sheet_name: string;
  row_number: number;
  factory_name: string;
  existing_design_speed: number | null;
  existing_actual_speed: number | null;
  existing_output_km: number | null;
  incoming_design_speed: number | null;
  incoming_actual_speed: number | null;
  incoming_output_km: number | null;
}

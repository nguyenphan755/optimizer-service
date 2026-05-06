export interface MaterialSuggestion {
  id: number;
  material_code: string;
  material_description: string;
  process_step_code: 'KEO' | 'XOAN' | 'GIAP' | 'BOC';
  process_step_name: string;
  plant_count: number;
}

export interface MachineCapability {
  capability_id: number;
  machine_id: number;
  machine_type: string;
  process_step_code: string;
  process_step_name: string;
  design_speed: number | null;
  actual_speed: number | null;
  actual_speed_ms: number | null;
  output_km_per_shift: number | null;
  output_kg_per_shift: number | null;
  is_recommended: boolean;
}

export interface PlantResult {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  has_data: boolean;
  has_recommended: boolean;
  machines: MachineCapability[];
}

export interface CapabilitySummary {
  best_actual_speed: number | null;
  best_actual_speed_ms: number | null;
  best_output_km_per_shift: number | null;
  best_output_kg_per_shift: number | null;
  best_plant_name: string | null;
  best_machine_type: string | null;
  plants_with_data: number;
  plants_without_data: number;
}

export interface CapabilityResult {
  material: {
    id: number;
    material_code: string;
    material_description: string;
    process_step_code: string;
    process_step_name: string;
  };
  summary: CapabilitySummary;
  plants: PlantResult[];
}

export interface FilterOptions {
  process_steps: {
    code: string;
    name: string;
    material_count: number;
  }[];
  plants: { id: number; code: string; name: string }[];
}

export interface MissingPlantsResponse {
  material_id: number;
  material_code: string;
  missing_plants: { plant_id: number; plant_name: string }[];
}

export interface ResistanceMeasurementRow {
  id: number;
  loai_sp: string;
  tiet_dien: number;
  ket_cau: string;
  plant_code: string | null;
  plant_name: string | null;
  plant_code_excel: string | null;
  ca: number | null;
  observed_at: string;
  dien_tro_max: number | null;
  dien_tro_max_raw: string | null;
  dien_tro_tt: number | null;
  ty_le_dien_tro_pct: number | null;
}

export interface ResistanceForMaterialResponse {
  material_id: number;
  material_code: string;
  material_description: string;
  parse: { tiet_dien: number | null; ket_cau: string | null; loai_sp: string | null };
  loai_sp_filter: string | null;
  lookup?: { tiet_dien: number; ket_cau: string; loai_sp: string | null };
  latest_observed_at: string | null;
  row_count: number;
  rows: ResistanceMeasurementRow[];
  message?: string;
}

export interface FlagMissingCapabilityResponse {
  ok: true;
  is_first_report: boolean;
  id: number;
  material_id: number;
  plant_id: number;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
}

export interface BulkCapabilityMeta {
  requested: number;
  distinct_codes: number;
  found: number;
  not_found: number;
}

export interface BulkCapabilityRow {
  material_code: string;
  description_file: string | null;
  found: boolean;
  material: {
    id: number;
    material_code: string;
    material_description: string;
    process_step_code: string;
    process_step_name: string;
  } | null;
  summary: {
    plants_with_data: number;
    plants_without_data: number;
    best_actual_speed: number | null;
    best_plant_name: string | null;
    best_machine_type: string | null;
  } | null;
  resistance: {
    row_count: number | null;
    parse_ok: boolean;
    message?: string;
  } | null;
}

export interface BulkCapabilityResult {
  meta: BulkCapabilityMeta;
  rows: BulkCapabilityRow[];
}

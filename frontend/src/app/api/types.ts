/** Kiểu dùng chung cho response API /api/v1 */

/** POST /api/v1/auth/login, GET /api/v1/auth/me */
export interface MesUser {
  id: number;
  username: string;
  role: "admin" | "user";
  plant_code: string | null;
  display_name: string | null;
}

export interface AuthLoginResponse {
  user: MesUser;
}

/** POST /api/v1/auth/refresh — cookie mes_access được Set-Cookie */
export interface AuthRefreshResponse {
  ok?: boolean;
}

export interface AuthMeResponse {
  user: MesUser;
}

export interface LockedMesUser {
  id: number;
  username: string;
  role: "admin" | "user";
  display_name: string | null;
  failed_login_count: number;
  locked_until: string | null;
  is_active: boolean;
}

export interface LockedMesUsersResponse {
  items: LockedMesUser[];
}

export interface AutocompleteItem {
  id: number;
  material_code: string;
  material_description: string;
  process_step_code: string;
  process_step_name: string;
  plant_count: number;
  /** Số máy có bản ghi production_capabilities (distinct machine_id) */
  machine_count?: number;
  /** Max actual_speed trong các bản ghi NL của material (m/phút) */
  best_actual_speed?: number;
  best_output_km?: number;
  best_output_kg?: number;
}

export interface CapabilityMachine {
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

export interface CapabilityPlant {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  has_data: boolean;
  has_recommended: boolean;
  machines: CapabilityMachine[];
}

export interface CapabilityResponse {
  material: {
    id: number;
    material_code: string;
    material_description: string;
    process_step_code: string;
    process_step_name: string;
  };
  summary: {
    best_actual_speed: number | null;
    best_actual_speed_ms: number | null;
    best_output_km_per_shift: number | null;
    best_output_kg_per_shift: number | null;
    best_plant_name: string | null;
    best_machine_type: string | null;
    plants_with_data: number;
    plants_without_data: number;
  };
  plants: CapabilityPlant[];
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
    /** Danh sách NM có năng lực (server bulk-capability) */
    plants_with_detail?: { plant_id: number; plant_name: string }[];
    /** Danh sách NM chưa có năng lực */
    plants_missing_detail?: { plant_id: number; plant_name: string }[];
  } | null;
  /** Gộp đủ NM + has_data — có thể vắng nếu API chỉ trả summary chi tiết */
  plants: Array<{ plant_name: string; plant_code: string; has_data: boolean }> | null;
  resistance: {
    row_count: number | null;
    parse_ok: boolean;
    message?: string;
  } | null;
}

export interface BulkCapabilityResponse {
  meta: BulkCapabilityMeta;
  rows: BulkCapabilityRow[];
}

/** POST /api/v1/missing-data */
export interface ReportMissingCapabilityResponse {
  ok: boolean;
  is_first_report: boolean;
  id: number;
  material_id: number;
  plant_id: number;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
}

/** GET/POST /api/v1/missing-data/submissions */
export interface MissingSubmissionItem {
  id: number;
  /** Mã hiển thị: BN-YYYYMMDD-Pxx-xxxxxx (ngày theo Asia/Ho_Chi_Minh). */
  public_ref: string;
  plant_id: number;
  plant_name: string;
  original_filename: string;
  template_row_hint: number;
  submitter_note: string | null;
  status: "pending_review" | "rejected" | "import_started";
  created_at: string;
  reviewed_at: string | null;
  reviewer_label: string | null;
  rejection_reason: string | null;
  /** Username JWT khi từ chối (sau migration 010). */
  reviewer_mes_username?: string | null;
  /** Admin | Head Office | User — theo JWT khi từ chối. */
  reviewer_access_label?: string | null;
  import_job_id: number | null;
  /** Mã job: IMP-YYYYMMDD-Jxxxxx theo ngày tạo job import. */
  import_job_ref: string | null;
  import_job_status: string | null;
  import_finished_at: string | null;
}

export interface MissingSubmissionListResponse {
  items: MissingSubmissionItem[];
  total: number;
  page: number;
  page_size: number;
}

/** GET /api/v1/missing-data/summary */
export interface MissingDataSummaryResponse {
  total_records: number;
  total_report_events: number;
  distinct_materials: number;
  plants_with_reports: number;
  avg_reports_per_record: number;
  by_plant: Array<{
    plant_id: number;
    plant_code: string;
    plant_name: string;
    record_count: number;
  }>;
}

export interface MissingDataListResponse {
  items: Array<{
    id: number;
    material_id: number;
    plant_id: number;
    material_code: string;
    material_description: string;
    plant_code: string;
    plant_name: string;
    report_count: number;
    note: string | null;
    first_reported_at: string;
    last_reported_at: string;
    /** Đã có bản ghi năng lực tại NM báo thiếu */
    has_capability_at_plant: boolean;
    capability_updated_at: string | null;
    /** Gợi ý người liên quan import (MES user hoặc reviewer) */
    data_update_attributed_user: string | null;
  }>;
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardOverviewResponse {
  kpis: {
    total_materials: number;
    materials_with_capability: number;
    materials_complete: number;
    materials_missing: number;
    total_machines: number;
    missing_reports: number;
    import_jobs_active: number;
  };
  machines_by_process: Array<{ process: string; process_code: string; count: number }>;
  coverage_by_process: Array<{
    process: string;
    process_code: string;
    total: number;
    has_data: number;
    missing: number;
  }>;
  plant_summaries: Array<{
    plant: string;
    plant_code: string;
    machines: number;
    capability_rows: number;
    materials_with_data: number;
    coverage_percent: number;
    process_count: number;
  }>;
  speed_comparison: Array<{
    process: string;
    avg_design: number;
    avg_actual: number;
  }>;
  scatter_points: Array<{
    plant: string;
    process: string;
    process_code: string;
    design: number | null;
    actual: number;
    material_code: string;
  }>;
  pareto_by_plant: Array<{
    plant: string;
    count: number;
    cumulative: number;
  }>;
  top_materials: Array<{
    code: string;
    description: string;
    process: string;
    plant: string;
    machine: string;
    design_speed: number | null;
    actual_speed: number | null;
    output_km: number | null;
    status: string;
  }>;
}

/** GET /api/v1/dashboard/plant-detail?plant= */
export interface DashboardPlantDetailResponse {
  plant: { code: string; name: string };
  total_materials: number;
  materials_with_data: number;
  materials_missing: number;
  coverage_percent: number;
  machine_count: number;
  process_count: number;
  coverage_by_process: Array<{ process: string; coverage: number }>;
  top_machines: Array<{ machine: string; actualSpeed: number; process: string }>;
  machines_by_process: Record<
    string,
    Array<{
      machine: string;
      designSpeed: number;
      actualSpeed: number;
      efficiency: number;
      outputKm: number;
      outputKg: number;
      materialCount: number;
      status: "complete" | "missing";
    }>
  >;
  missing_materials: Array<{ code: string; process: string }>;
}

/** GET /api/v1/dashboard/capacity-report */
export interface DashboardCapacityReportResponse {
  kpis: {
    total_machines: number;
    machines_with_capability_rows: number;
    machines_without_capabilities: number;
    avg_design_speed_sum_by_plant: number;
    avg_actual_speed_sum_by_plant: number;
    avg_utilization_percent: number;
    total_capability_rows: number;
  };
  machine_by_plant: Array<{ plant: string; machines: number; active: number; inactive: number }>;
  speed_by_plant: Array<{
    plant: string;
    design: number;
    actual: number;
    utilization: number;
    /** Max actual_speed trong bản ghi NL của NM (m/phút) */
    max_actual?: number;
    /** Max output_km_per_shift */
    max_output_km?: number;
    /** Max output_kg_per_shift */
    max_output_kg?: number;
  }>;
  missing_by_plant: Array<{ plant: string; missing: number; total: number; percentage: number }>;
}

export interface ImportJobItem {
  id: number;
  filename: string;
  status: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  conflict_rows: number;
  created_at: string;
  finished_at: string | null;
}

export interface MasterImportResponse {
  job_id: number;
  status: string;
  total_rows: number;
  error_rows: number;
  conflict_rows: number;
  errors: Array<Record<string, unknown>>;
}

/** GET /api/v1/master-data/import/:jobId/status */
export interface ImportJobStatusResponse {
  job_id: number;
  status: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  conflict_rows: number;
  conflict_action?: string | null;
  created_at?: string;
  finished_at?: string | null;
  conflicts?: Array<Record<string, unknown>>;
  errors?: Array<Record<string, unknown>>;
}

/** POST /api/v1/resistance/import */
export interface ResistanceImportApiResponse {
  inserted: number;
  skipped: number;
  errors: string[];
  truncate: boolean;
}

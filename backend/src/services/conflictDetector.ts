import type { PoolClient } from 'pg';
import { fetchExistingCapabilitiesByMaterialCodes } from '../db/queries/productionCapabilities';
import type { ValidatedImportRow, ConflictRow } from '../types/masterData';
import { trimMachineName } from '../utils/stringUtils';

function capKey(materialCode: string, plantId: number, machineType: string): string {
  return `${materialCode}|${plantId}|${trimMachineName(machineType)}`;
}

export interface ConflictDetectOutput {
  conflicts: ConflictRow[];
  rows: ValidatedImportRow[];
}

export async function detectConflicts(
  client: PoolClient,
  validRows: ValidatedImportRow[]
): Promise<ConflictDetectOutput> {
  const codes = [...new Set(validRows.map((r) => r.material_code))];
  const existing = await fetchExistingCapabilitiesByMaterialCodes(client, codes);

  const map = new Map<
    string,
    { design: number | null; actual: number | null; km: number | null }
  >();
  for (const e of existing) {
    const k = capKey(e.material_code, e.plant_id, e.machine_type);
    map.set(k, {
      design: e.design_speed != null ? Number(e.design_speed) : null,
      actual: e.actual_speed != null ? Number(e.actual_speed) : null,
      km: e.output_km_per_shift != null ? Number(e.output_km_per_shift) : null,
    });
  }

  const conflicts: ConflictRow[] = [];
  const rows: ValidatedImportRow[] = validRows.map((r) => ({ ...r }));

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const k = capKey(r.material_code, r.plant_id, r.machine_type);
    const ex = map.get(k);
    if (ex) {
      r.is_conflict = true;
      conflicts.push({
        material_code: r.material_code,
        plant_id: r.plant_id,
        machine_type: r.machine_type,
        sheet_name: r.sheet_name,
        row_number: r.row_number,
        factory_name: r.plant_name,
        existing_design_speed: ex.design,
        existing_actual_speed: ex.actual,
        existing_output_km: ex.km,
        incoming_design_speed: r.design_speed,
        incoming_actual_speed: r.actual_speed,
        incoming_output_km: r.output_km_per_shift,
      });
    }
  }

  return { conflicts, rows };
}

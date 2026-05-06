import type { PoolClient } from 'pg';
import { listPlants } from '../db/queries/plants';
import { fetchCapabilitiesForMaterialIds } from '../db/queries/searchPhase2';
import { countResistanceRowsByKeyPairs } from '../db/queries/resistanceMeasurements';
import { buildCapabilityResult } from './capabilityResultBuilder';
import { parseXoanMaterialDescription } from './xoanDescriptionParser';

export const BULK_MAX_ITEMS = 10_000;

/** Ưu tiên mô tả HT; nếu không suy được tiết diện/kết cấu thì thử mô tả từ file Excel. */
function resolveXoanKeysForResistance(
  materialDescription: string,
  descriptionFile: string | null
): {
  tiet_dien: number | null;
  ket_cau: string | null;
  used_file_fallback: boolean;
} {
  const fromDb = parseXoanMaterialDescription(materialDescription);
  if (fromDb.tiet_dien !== null && fromDb.ket_cau !== null) {
    return {
      tiet_dien: fromDb.tiet_dien,
      ket_cau: fromDb.ket_cau,
      used_file_fallback: false,
    };
  }
  if (descriptionFile) {
    const fromFile = parseXoanMaterialDescription(descriptionFile);
    if (fromFile.tiet_dien !== null && fromFile.ket_cau !== null) {
      return {
        tiet_dien: fromFile.tiet_dien,
        ket_cau: fromFile.ket_cau,
        used_file_fallback: true,
      };
    }
  }
  return { tiet_dien: null, ket_cau: null, used_file_fallback: false };
}

export interface BulkItemIn {
  material_code: string;
  description_file?: string | null;
}

export interface BulkRowOut {
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
    /** Loại máy gắn với bản ghi đề xuất (cùng NM best speed / output) */
    best_machine_type: string | null;
    /** Nhà máy đang có dữ liệu năng lực */
    plants_with_detail: { plant_id: number; plant_name: string }[];
    /** Nhà máy chưa có dữ liệu (dùng để lọc theo NM trước khi xuất CSV) */
    plants_missing_detail: { plant_id: number; plant_name: string }[];
  } | null;
  resistance: {
    row_count: number | null;
    parse_ok: boolean;
    /** Đã suy khóa điện trở từ mô tả file vì mô tả trong HT không parse được */
    used_file_description?: boolean;
    message?: string;
  } | null;
}

export interface BulkCapabilityResponse {
  meta: {
    requested: number;
    distinct_codes: number;
    found: number;
    not_found: number;
  };
  rows: BulkRowOut[];
}

export async function runBulkCapabilityLookup(
  client: PoolClient,
  items: BulkItemIn[]
): Promise<BulkCapabilityResponse> {
  const requestedRaw = items.length;
  const descByCode = new Map<string, string | null>();
  const orderedCodes: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const c = it.material_code.trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    orderedCodes.push(c);
    const d = it.description_file;
    descByCode.set(c, typeof d === 'string' && d.trim() !== '' ? d.trim() : null);
  }

  if (orderedCodes.length > BULK_MAX_ITEMS) {
    throw new Error(`BULK_LIMIT: Tối đa ${BULK_MAX_ITEMS} mã sau khi gom.`);
  }

  const codes = orderedCodes;

  const metaRows = await client.query<{
    id: number;
    material_code: string;
    material_description: string;
    process_step_code: string;
    process_step_name: string;
  }>(
    `SELECT m.id, m.material_code, m.material_description,
            ps.code AS process_step_code, ps.name AS process_step_name
     FROM materials m
     JOIN process_steps ps ON ps.id = m.process_step_id
     WHERE m.material_code = ANY($1::text[])`,
    [codes]
  );
  const metaByCode = new Map(metaRows.rows.map((r) => [r.material_code, r]));

  const allPlants = await listPlants(client);
  const foundIds = metaRows.rows.map((r) => r.id);
  const allCaps =
    foundIds.length > 0 ? await fetchCapabilitiesForMaterialIds(client, foundIds) : [];

  const capsByCode = new Map<string, typeof allCaps>();
  for (const row of allCaps) {
    const arr = capsByCode.get(row.material_code) ?? [];
    arr.push(row);
    capsByCode.set(row.material_code, arr);
  }

  const pairList: { tiet_dien: number; ket_cau: string }[] = [];
  const pairKeySeen = new Set<string>();

  for (const m of metaRows.rows) {
    if (m.process_step_code !== 'XOAN') continue;
    const descFile = descByCode.get(m.material_code) ?? null;
    const parsed = resolveXoanKeysForResistance(m.material_description, descFile);
    if (parsed.tiet_dien !== null && parsed.ket_cau !== null) {
      const pk = `${parsed.tiet_dien}|${parsed.ket_cau}`;
      if (!pairKeySeen.has(pk)) {
        pairKeySeen.add(pk);
        pairList.push({ tiet_dien: parsed.tiet_dien, ket_cau: parsed.ket_cau });
      }
    }
  }

  const countByPair =
    pairList.length > 0 ? await countResistanceRowsByKeyPairs(client, pairList) : new Map();

  const rows: BulkRowOut[] = [];
  for (const code of codes) {
    const descFile = descByCode.get(code) ?? null;
    const meta = metaByCode.get(code);
    if (!meta) {
      rows.push({
        material_code: code,
        description_file: descFile,
        found: false,
        material: null,
        summary: null,
        resistance: null,
      });
      continue;
    }

    const raw = capsByCode.get(code) ?? [];
    const built = buildCapabilityResult(raw, allPlants, meta);
    const s = built.summary;
    const plantsWithDetail = built.plants
      .filter((p) => p.has_data)
      .map((p) => ({ plant_id: p.plant_id, plant_name: p.plant_name }));
    const plantsMissingDetail = built.plants
      .filter((p) => !p.has_data)
      .map((p) => ({ plant_id: p.plant_id, plant_name: p.plant_name }));

    let resistance: BulkRowOut['resistance'] = null;
    if (meta.process_step_code === 'XOAN') {
      const keys = resolveXoanKeysForResistance(meta.material_description, descFile);
      if (keys.tiet_dien === null || keys.ket_cau === null) {
        resistance = {
          row_count: null,
          parse_ok: false,
          message:
            'Không suy được tiết diện/kết cấu từ mô tả hệ thống và mô tả file (nếu có).',
        };
      } else {
        const pk = `${keys.tiet_dien}|${keys.ket_cau}`;
        const rowCount = countByPair.get(pk) ?? 0;
        resistance = {
          row_count: rowCount,
          parse_ok: true,
          used_file_description: keys.used_file_fallback,
        };
      }
    }

    rows.push({
      material_code: code,
      description_file: descFile,
      found: true,
      material: {
        id: meta.id,
        material_code: meta.material_code,
        material_description: meta.material_description,
        process_step_code: meta.process_step_code,
        process_step_name: meta.process_step_name,
      },
      summary: {
        plants_with_data: s.plants_with_data,
        plants_without_data: s.plants_without_data,
        best_actual_speed: s.best_actual_speed,
        best_plant_name: s.best_plant_name,
        best_machine_type: s.best_machine_type,
        plants_with_detail: plantsWithDetail,
        plants_missing_detail: plantsMissingDetail,
      },
      resistance,
    });
  }

  const notFound = rows.filter((r) => !r.found).length;
  return {
    meta: {
      requested: requestedRaw,
      distinct_codes: codes.length,
      found: rows.filter((r) => r.found).length,
      not_found: notFound,
    },
    rows,
  };
}

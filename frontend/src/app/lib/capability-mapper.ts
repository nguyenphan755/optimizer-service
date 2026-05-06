import type { CapabilityResponse } from "@/app/api/types";

function fmtNum(n: number | null, suffix: string): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("vi-VN")} ${suffix}`;
}

/** Shape dùng bởi MaterialLookupScreen (giữ field như mock) */
export function mapCapabilityToLookupView(api: CapabilityResponse) {
  const { material, summary, plants } = api;
  const keo = material.process_step_code === "KEO";

  const maxSpeed = keo
    ? fmtNum(summary.best_actual_speed_ms, "m/s")
    : fmtNum(summary.best_actual_speed, "m/min");

  let maxOutput = "—";
  if (summary.best_output_kg_per_shift != null) {
    maxOutput = fmtNum(summary.best_output_kg_per_shift, "kg/ca");
  } else if (summary.best_output_km_per_shift != null) {
    maxOutput = fmtNum(summary.best_output_km_per_shift, "km/ca");
  }

  return {
    code: material.material_code,
    name: material.material_description,
    process: material.process_step_code,
    plantsWithData: summary.plants_with_data,
    plantsNoData: summary.plants_without_data,
    maxSpeed,
    maxOutput,
    recommendedPlant: summary.best_plant_name ?? "—",
    /** Loại máy / dây chuyền của bản ghi năng lực được đánh dấu đề xuất (cột Machine Type). */
    recommendedProductionLine: summary.best_machine_type?.trim() || "—",
    plants: plants.map((p) => ({
      plantId: p.plant_id,
      name: p.plant_name.startsWith("Cadivi") ? p.plant_name : `Cadivi ${p.plant_name}`,
      shortName: p.plant_code,
      hasData: p.has_data,
      isRecommended: p.has_recommended,
      machines: p.machines.map((m) => ({
        id: m.machine_type,
        speedDesign: fmtNum(m.design_speed, keo ? "m/s" : "m/min"),
        speedActual: fmtNum(keo ? m.actual_speed_ms : m.actual_speed, keo ? "m/s" : "m/min"),
        output:
          m.output_kg_per_shift != null
            ? fmtNum(m.output_kg_per_shift, "kg/ca")
            : fmtNum(m.output_km_per_shift, "km/ca"),
        recommended: m.is_recommended,
      })),
    })),
  };
}

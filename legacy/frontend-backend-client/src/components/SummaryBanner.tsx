import type { CapabilityResult, CapabilitySummary } from '../types/search';
import { ProcessChip } from './ProcessChip';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

export function SummaryBanner({
  summary,
  material,
}: {
  summary: CapabilitySummary;
  material: CapabilityResult['material'];
}) {
  const isKeo = material.process_step_code === 'KEO';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-xl p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <span className="font-mono font-bold">{material.material_code}</span>
          <span className="text-gray-500"> — </span>
          <span>{material.material_description}</span>
        </div>
        <ProcessChip code={material.process_step_code} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-gray-500">Tốc độ tốt nhất</div>
          <div className="text-2xl font-bold">{fmt(summary.best_actual_speed)} m/min</div>
          {isKeo && summary.best_actual_speed_ms != null && (
            <div className="text-sm text-gray-500">
              = {fmt(summary.best_actual_speed_ms)} m/s
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500">Sản lượng tốt nhất</div>
          <div className="text-2xl font-bold">
            {fmt(summary.best_output_km_per_shift)} km/ca
          </div>
          {summary.best_output_kg_per_shift != null ? (
            <div className="text-sm text-gray-500">
              {fmt(summary.best_output_kg_per_shift)} kg/ca
            </div>
          ) : (
            <div className="text-sm text-gray-400">— kg/ca (chưa quy đổi)</div>
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500">Máy đề xuất</div>
          <div className="font-medium">{summary.best_machine_type ?? '—'}</div>
          <div className="text-sm text-gray-500">{summary.best_plant_name ?? '—'}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <span className="text-green-600 text-sm">
          ● {summary.plants_with_data} nhà máy có dữ liệu
        </span>
        <span className="text-gray-400 text-sm">
          ○ {summary.plants_without_data} nhà máy chưa có
        </span>
      </div>
    </div>
  );
}

import type { MachineCapability } from '../types/search';
import { ProcessChip } from './ProcessChip';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

export function MachineRow({ machine }: { machine: MachineCapability }) {
  const isKeo = machine.process_step_code === 'KEO';
  return (
    <div
      className={`px-4 py-3 ${machine.is_recommended ? 'bg-green-50' : 'bg-white'}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {machine.is_recommended && (
          <span className="text-yellow-400 text-base" aria-hidden>
            ★
          </span>
        )}
        <span className="font-medium text-gray-800 text-sm">{machine.machine_type}</span>
        <ProcessChip code={machine.process_step_code} size="sm" />
        {machine.is_recommended && (
          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            Đề xuất
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-1 text-sm">
        <div>
          <div className="text-xs text-gray-400">TK</div>
          <div>{fmt(machine.design_speed)} m/min</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">TT</div>
          <div>
            {fmt(machine.actual_speed)} m/min
            {isKeo && machine.actual_speed_ms != null && (
              <span className="text-xs text-gray-400 ml-1">
                (= {fmt(machine.actual_speed_ms)} m/s)
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Sản lượng</div>
          <div>
            {fmt(machine.output_km_per_shift)} km/ca
            {machine.output_kg_per_shift != null ? (
              <span className="ml-2">{fmt(machine.output_kg_per_shift)} kg/ca</span>
            ) : (
              <span className="text-gray-300 ml-2">— kg/ca</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

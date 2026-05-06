import type { PlantResult } from '../types/search';
import { MachineRow } from './MachineRow';
import { NoDataPlantCard } from './NoDataPlantCard';

export function PlantCapabilityCard({
  plant,
  materialId,
}: {
  plant: PlantResult;
  materialId: number;
}) {
  if (!plant.has_data) {
    return <NoDataPlantCard plant={plant} materialId={materialId} />;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-900">{plant.plant_name}</span>
        {plant.has_recommended && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
            Đề xuất
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {plant.machines.map((m) => (
          <MachineRow key={m.capability_id} machine={m} />
        ))}
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/app/components/ui/card";
import { ChevronRight } from "lucide-react";
import { getPlantColor } from "@/app/lib/plant-colors";

interface PlantSummaryCardProps {
  plantName: string;
  materialCount: number;
  coveragePercent: number;
  machineCount: number;
  processCount: number;
  onClick: () => void;
}

export function PlantSummaryCard({
  plantName,
  materialCount,
  coveragePercent,
  machineCount,
  processCount,
  onClick,
}: PlantSummaryCardProps) {
  const plantColor = getPlantColor(plantName, "primary");

  return (
    <Card
      className="border-[0.5px] cursor-pointer transition-all hover:border-gray-400"
      style={{ borderRadius: "10px" }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-medium">{plantName}</h3>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <p className="text-[13px] text-muted-foreground mb-2">
          {materialCount.toLocaleString()} materials
        </p>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">Coverage</span>
            <span className="text-[11px] font-medium">{coveragePercent}%</span>
          </div>
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${coveragePercent}%`,
                backgroundColor: plantColor,
              }}
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {machineCount} máy · {processCount} công đoạn
        </p>
      </CardContent>
    </Card>
  );
}

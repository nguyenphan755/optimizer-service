import { useState } from "react";
import { Zap, TrendingUp, AlertCircle, DollarSign, ArrowRightLeft, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageHeader } from "@/app/components/ui/page-header";
import { KpiCard } from "@/app/components/ui/kpi-card";
import { ChartCard } from "@/app/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { optimizationData } from "@/app/lib/analytics-dashboard-mock-data";

export function OptimizationCenterDashboard() {
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);
  const data = optimizationData;

  const totalPotentialGain = data.matchingScores.reduce((sum, item) => {
    const gain = parseInt(item.potentialGain.replace("+", "").replace("%", ""));
    return sum + gain;
  }, 0);

  const totalUnderutilized = data.underutilizedCapacity.reduce((sum, item) => sum + (100 - item.utilization), 0);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader
          compact
          title="Optimization Center"
          subtitle="Actionable Recommendations & What-If Scenarios"
        />
        <div className="mt-2 shrink-0 sm:mt-0">
          <Button className="h-8 bg-[#10b981] text-[12px] hover:bg-[#10b981]/90">
            <Zap className="mr-2 h-4 w-4" />
            Run Optimization
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Potential Speed Gain"
            value={`+${totalPotentialGain}%`}
            subText="From optimal matching"
            variant="success"
            icon={<TrendingUp className="h-8 w-8 text-[#10b981]" />}
          />
          <KpiCard
            label="Underutilized Capacity"
            value={`${Math.round(totalUnderutilized / data.underutilizedCapacity.length)}%`}
            subText="Available capacity"
            variant="warning"
            icon={<AlertCircle className="h-8 w-8 text-[#f59e0b]" />}
          />
          <KpiCard
            label="Load Balancing Opportunities"
            value={data.loadBalancingOpportunities.length}
            subText="Cross-plant transfers"
            variant="info"
            icon={<ArrowRightLeft className="h-8 w-8 text-[#3b82f6]" />}
          />
          <KpiCard
            label="Best ROI Initiative"
            value="304%"
            subText="Optimize top 10 materials"
            variant="success"
            icon={<DollarSign className="h-8 w-8 text-[#10b981]" />}
          />
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#2563eb]" />
                  Material-to-Machine Matching Scores
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Recommended machine changes for better performance
                </p>
              </div>
              <Badge variant="outline">{data.matchingScores.length} recommendations</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.matchingScores.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedOptimization === item.material
                      ? "border-[#2563eb] bg-[#eff6ff]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedOptimization(item.material)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[12px] font-mono font-medium">{item.material}</p>
                      <p className="text-[10px] text-muted-foreground">Current Score: {item.score}%</p>
                    </div>
                    <Badge
                      className={
                        parseInt(item.potentialGain.replace("+", "").replace("%", "")) >= 15
                          ? "bg-[#f0fdf4] text-[#15803d] border-[#15803d]"
                          : "bg-[#fffbeb] text-[#f59e0b] border-[#f59e0b]"
                      }
                      variant="outline"
                    >
                      {item.potentialGain}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current:</span>
                      <Badge variant="outline" className="font-mono">
                        {item.currentMachine}
                      </Badge>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Recommended:</span>
                      <Badge variant="outline" className="font-mono bg-[#eff6ff] text-[#2563eb] border-[#2563eb]">
                        {item.recommendedMachine}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="Underutilized Capacity Alerts"
            subtitle="Công suất chưa sử dụng"
          >
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.underutilizedCapacity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="plant"
                    tick={{ fontSize: 11 }}
                    width={100}
                    tickFormatter={(value) => `${getShortPlantName(value)}`}
                  />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-[#3b82f6]" />
                Load Balancing Opportunities
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Cross-plant transfer recommendations</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.loadBalancingOpportunities.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPlantColor(item.fromPlant) }}
                      />
                      <span className="text-[11px] font-medium">{getShortPlantName(item.fromPlant)}</span>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium">{getShortPlantName(item.toPlant)}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPlantColor(item.toPlant) }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Materials:</span>
                      <span className="ml-2 font-medium">{item.materials}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capacity Gain:</span>
                      <span className="ml-2 font-medium text-[#10b981]">{item.capacityGain}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#10b981]" />
              ROI Calculator - Investment Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.roiScenarios.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-[12px] font-medium mb-1">{item.initiative}</h4>
                      <div className="flex items-center gap-4 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">Investment:</span>
                          <span className="ml-2 font-medium">{item.investment}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Annual Saving:</span>
                          <span className="ml-2 font-medium text-[#10b981]">{item.annualSaving}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[20px] font-medium text-[#10b981]">{item.roi}</p>
                      <p className="text-[10px] text-muted-foreground">ROI</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge variant="outline" className="bg-[#f0fdf4] text-[#15803d] border-[#15803d]">
                      Payback: {item.payback}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

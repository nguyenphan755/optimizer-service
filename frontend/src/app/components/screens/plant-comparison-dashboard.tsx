import { useState } from "react";
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/app/components/ui/page-header";
import { KpiCard } from "@/app/components/ui/kpi-card";
import { ChartCard } from "@/app/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { plantComparisonData } from "@/app/lib/analytics-dashboard-mock-data";

export function PlantComparisonDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<"coverage" | "efficiency" | "quality">("coverage");
  const data = plantComparisonData;

  // Prepare radar chart data
  const radarData = [
    {
      metric: "Coverage",
      "Đà Nẵng": data.plantKPIs[0].coverage,
      "Long Thành": data.plantKPIs[1].coverage,
      "Tân Á": data.plantKPIs[2].coverage,
      "Bắc Ninh": data.plantKPIs[3].coverage,
    },
    {
      metric: "Speed",
      "Đà Nẵng": (data.plantKPIs[0].avgSpeed / 200) * 100,
      "Long Thành": (data.plantKPIs[1].avgSpeed / 200) * 100,
      "Tân Á": (data.plantKPIs[2].avgSpeed / 200) * 100,
      "Bắc Ninh": (data.plantKPIs[3].avgSpeed / 200) * 100,
    },
    {
      metric: "Efficiency",
      "Đà Nẵng": data.plantKPIs[0].efficiency,
      "Long Thành": data.plantKPIs[1].efficiency,
      "Tân Á": data.plantKPIs[2].efficiency,
      "Bắc Ninh": data.plantKPIs[3].efficiency,
    },
    {
      metric: "Quality",
      "Đà Nẵng": data.plantKPIs[0].quality,
      "Long Thành": data.plantKPIs[1].quality,
      "Tân Á": data.plantKPIs[2].quality,
      "Bắc Ninh": data.plantKPIs[3].quality,
    },
    {
      metric: "Utilization",
      "Đà Nẵng": data.plantKPIs[0].utilization,
      "Long Thành": data.plantKPIs[1].utilization,
      "Tân Á": data.plantKPIs[2].utilization,
      "Bắc Ninh": data.plantKPIs[3].utilization,
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Topbar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader compact title="So sánh Nhà máy" subtitle="Benchmarking & Performance Comparison" />
        <div className="mt-2 w-full min-w-0 sm:mt-0 sm:w-auto sm:shrink-0">
          <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
            <SelectTrigger className="h-8 w-full text-[12px] sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coverage">Coverage</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Row 1 - Side-by-side KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {data.plantKPIs.map((plant) => (
            <Card
              key={plant.plant}
              className="border-[0.5px]"
              style={{
                borderRadius: "10px",
                borderColor: getPlantColor(plant.plant, "border"),
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-[13px] font-medium"
                  style={{ color: getPlantColor(plant.plant) }}
                >
                  {getShortPlantName(plant.plant)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Coverage</p>
                  <p className="text-[20px] font-medium">{plant.coverage}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Efficiency</p>
                  <p className="text-[20px] font-medium">{plant.efficiency}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Quality</p>
                  <p className="text-[20px] font-medium">{plant.quality}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Utilization</p>
                  <p className="text-[20px] font-medium">{plant.utilization}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Output/Shift</p>
                  <p className="text-[20px] font-medium">{plant.outputPerShift} km</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2 - Radar Chart & Bar Chart */}
        <div className="grid grid-cols-2 gap-4">
          {/* Radar Chart */}
          <ChartCard
            title="Performance Radar Chart"
            subtitle="So sánh toàn diện theo 5 metrics"
          >
            <div style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Đà Nẵng"
                    dataKey="Đà Nẵng"
                    stroke={getPlantColor("Cadivi Đà Nẵng")}
                    fill={getPlantColor("Cadivi Đà Nẵng")}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Long Thành"
                    dataKey="Long Thành"
                    stroke={getPlantColor("Cadivi Long Thành")}
                    fill={getPlantColor("Cadivi Long Thành")}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Tân Á"
                    dataKey="Tân Á"
                    stroke={getPlantColor("Cadivi Tân Á")}
                    fill={getPlantColor("Cadivi Tân Á")}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Bắc Ninh"
                    dataKey="Bắc Ninh"
                    stroke={getPlantColor("Cadivi Bắc Ninh")}
                    fill={getPlantColor("Cadivi Bắc Ninh")}
                    fillOpacity={0.3}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Output Comparison */}
          <ChartCard
            title="Output Comparison"
            subtitle="Sản lượng trung bình theo ca (km/shift)"
          >
            <div style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.plantKPIs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="plant"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => getShortPlantName(value)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="outputPerShift" radius={[4, 4, 0, 0]}>
                    {data.plantKPIs.map((entry, index) => (
                      <rect
                        key={`bar-${index}`}
                        fill={getPlantColor(entry.plant)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Row 3 - Rankings Table */}
        <ChartCard
          title="League Table — Rankings by Metric"
          subtitle="Xếp hạng nhà máy theo từng chỉ số"
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Coverage Rankings */}
            <div>
              <h4 className="text-[12px] font-medium mb-3">Coverage Rankings</h4>
              <div className="space-y-2">
                {data.rankings.coverage.map((item) => (
                  <div
                    key={item.plant}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.rank === 1 ? "default" : "outline"}
                        className={item.rank === 1 ? "bg-[#f59e0b]" : ""}
                      >
                        {item.rank === 1 ? <Award className="h-3 w-3" /> : `#${item.rank}`}
                      </Badge>
                      <span className="text-[11px]">{getShortPlantName(item.plant)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{item.value}%</span>
                      <span
                        className={`text-[10px] flex items-center ${
                          item.change.startsWith("+") ? "text-[#10b981]" : "text-[#ef4444]"
                        }`}
                      >
                        {item.change.startsWith("+") ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Rankings */}
            <div>
              <h4 className="text-[12px] font-medium mb-3">Efficiency Rankings</h4>
              <div className="space-y-2">
                {data.rankings.efficiency.map((item) => (
                  <div
                    key={item.plant}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.rank === 1 ? "default" : "outline"}
                        className={item.rank === 1 ? "bg-[#f59e0b]" : ""}
                      >
                        {item.rank === 1 ? <Award className="h-3 w-3" /> : `#${item.rank}`}
                      </Badge>
                      <span className="text-[11px]">{getShortPlantName(item.plant)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{item.value}%</span>
                      <span
                        className={`text-[10px] flex items-center ${
                          item.change.startsWith("+") || item.change === "0%"
                            ? "text-[#10b981]"
                            : "text-[#ef4444]"
                        }`}
                      >
                        {item.change.startsWith("+") ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : item.change.startsWith("-") ? (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        ) : null}
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Rankings */}
            <div>
              <h4 className="text-[12px] font-medium mb-3">Quality Rankings</h4>
              <div className="space-y-2">
                {data.rankings.quality.map((item) => (
                  <div
                    key={item.plant}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.rank === 1 ? "default" : "outline"}
                        className={item.rank === 1 ? "bg-[#f59e0b]" : ""}
                      >
                        {item.rank === 1 ? <Award className="h-3 w-3" /> : `#${item.rank}`}
                      </Badge>
                      <span className="text-[11px]">{getShortPlantName(item.plant)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium">{item.value}%</span>
                      <span
                        className={`text-[10px] flex items-center ${
                          item.change.startsWith("+") ? "text-[#10b981]" : "text-[#ef4444]"
                        }`}
                      >
                        {item.change.startsWith("+") ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Row 4 - Gap Analysis & Cost Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Gap Analysis */}
          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#f59e0b]" />
                Gap Analysis: Best vs Worst
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#f0fdf4] rounded-lg">
                <span className="text-[11px] text-muted-foreground">Best Performer</span>
                <Badge style={{ backgroundColor: getPlantColor("Cadivi Bắc Ninh", "bg"), color: getPlantColor("Cadivi Bắc Ninh") }}>
                  {getShortPlantName(data.gapAnalysis.bestPlant)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#fef2f2] rounded-lg">
                <span className="text-[11px] text-muted-foreground">Needs Improvement</span>
                <Badge style={{ backgroundColor: getPlantColor("Cadivi Long Thành", "bg"), color: getPlantColor("Cadivi Long Thành") }}>
                  {getShortPlantName(data.gapAnalysis.worstPlant)}
                </Badge>
              </div>
              <div className="pt-2 border-t space-y-3">
                {data.gapAnalysis.gaps.map((gap, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium">{gap.metric}</p>
                      <p className="text-[10px] text-muted-foreground">{gap.potential}</p>
                    </div>
                    <Badge variant="outline" className="text-[#ef4444] border-[#ef4444]">
                      -{gap.gap}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Comparison */}
          <ChartCard
            title="Cost Comparison"
            subtitle="Chi phí sản xuất trung bình (VND)"
          >
            <div className="space-y-3">
              {data.costComparison.map((item) => (
                <div
                  key={item.plant}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: getPlantColor(item.plant) }}
                    />
                    <span className="text-[12px] font-medium">{getShortPlantName(item.plant)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-medium">{item.costPerKm.toLocaleString()} đ/km</p>
                    <p className="text-[10px] text-muted-foreground">{item.costPerKg.toLocaleString()} đ/kg</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

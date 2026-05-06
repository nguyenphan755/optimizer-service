import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Factory, TrendingUp, AlertCircle, Activity, Loader2 } from "lucide-react";
import { PLANT_COLORS, getPlantColor, getShortPlantName, cadiviPlantLabel } from "@/app/lib/plant-colors";
import { PageHeader } from "@/app/components/ui/page-header";
import { useDashboardCapacityReport } from "@/app/hooks/useDashboard";

const BUCKET_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

type PlantRankFilter = "all" | "top3" | "top5" | "median_up";

function medianSorted(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0;
  const m = Math.floor(sortedAsc.length / 2);
  return sortedAsc.length % 2 === 1 ? sortedAsc[m]! : (sortedAsc[m - 1]! + sortedAsc[m]!) / 2;
}

/** Lọc tập nhà máy theo thứ hạng metric (TB actual, hoặc max sản lượng km/kg). */
function plantsMatchingRank(
  rows: Array<{ plant: string; rankValue: number }>,
  mode: PlantRankFilter
): Set<string> | null {
  if (mode === "all") return null;
  const sorted = [...rows].filter((r) => Number.isFinite(r.rankValue)).sort((a, b) => b.rankValue - a.rankValue);
  if (mode === "top3") return new Set(sorted.slice(0, 3).map((r) => r.plant));
  if (mode === "top5") return new Set(sorted.slice(0, 5).map((r) => r.plant));
  const positives = sorted.map((r) => r.rankValue).filter((v) => v > 0);
  if (positives.length === 0) return new Set();
  const med = medianSorted([...positives].sort((a, b) => a - b));
  return new Set(sorted.filter((r) => r.rankValue >= med).map((r) => r.plant));
}

function intersectPlantSets(a: Set<string> | null, b: Set<string> | null): Set<string> | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return new Set([...a].filter((p) => b.has(p)));
}

function filterRowsByPlants<T extends { plant: string }>(rows: T[], plants: Set<string> | null): T[] {
  if (plants === null) return rows;
  return rows.filter((r) => plants.has(r.plant));
}

function utilizationBuckets(utilizations: number[]) {
  let b90 = 0,
    b80 = 0,
    b65 = 0,
    bLow = 0;
  for (const u of utilizations) {
    if (u >= 90) b90++;
    else if (u >= 80) b80++;
    else if (u >= 65) b65++;
    else bLow++;
  }
  return [
    { name: "90–100%", value: b90, color: BUCKET_COLORS[0] },
    { name: "80–89%", value: b80, color: BUCKET_COLORS[1] },
    { name: "65–79%", value: b65, color: BUCKET_COLORS[2] },
    { name: "< 65%", value: bLow, color: BUCKET_COLORS[3] },
  ];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const plantName = payload[0]?.payload?.plant;
    const plantColor = plantName ? getPlantColor(plantName) : "#6b7280";

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
        <p className="font-semibold mb-2" style={{ color: plantColor }}>
          {getShortPlantName(label || plantName)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CapacityReportScreen() {
  const [timeRange, setTimeRange] = useState("month");
  const [speedRankFilter, setSpeedRankFilter] = useState<PlantRankFilter>("all");
  const [outputRankFilter, setOutputRankFilter] = useState<PlantRankFilter>("all");
  const { data: report, isLoading, isError, error } = useDashboardCapacityReport();

  const capacityDataFull = useMemo(() => {
    if (!report) return [];
    return report.speed_by_plant.map((r) => ({
      plant: cadiviPlantLabel(r.plant),
      design: r.design,
      actual: r.actual,
      utilization: r.utilization,
      max_actual: r.max_actual ?? 0,
      max_output_km: r.max_output_km ?? 0,
      max_output_kg: r.max_output_kg ?? 0,
    }));
  }, [report]);

  const filteredPlantSet = useMemo(() => {
    const speedRows = capacityDataFull.map((r) => ({
      plant: r.plant,
      rankValue: r.actual,
    }));
    const outRows = capacityDataFull.map((r) => ({
      plant: r.plant,
      rankValue: r.max_output_km > 0 ? r.max_output_km : r.max_output_kg,
    }));
    const bySpeed = plantsMatchingRank(speedRows, speedRankFilter);
    const byOut = plantsMatchingRank(outRows, outputRankFilter);
    return intersectPlantSets(bySpeed, byOut);
  }, [capacityDataFull, speedRankFilter, outputRankFilter]);

  const machineCountData = useMemo(() => {
    if (!report) return [];
    const rows = report.machine_by_plant.map((r) => ({
      plant: cadiviPlantLabel(r.plant),
      machines: r.machines,
      active: r.active,
      inactive: r.inactive,
    }));
    return filterRowsByPlants(rows, filteredPlantSet);
  }, [report, filteredPlantSet]);

  const capacityData = useMemo(() => {
    return filterRowsByPlants(capacityDataFull, filteredPlantSet);
  }, [capacityDataFull, filteredPlantSet]);

  const missingDataByPlant = useMemo(() => {
    if (!report) return [];
    const rows = report.missing_by_plant.map((r) => ({
      plant: cadiviPlantLabel(r.plant),
      missing: r.missing,
      total: r.total,
      percentage: r.percentage,
    }));
    return filterRowsByPlants(rows, filteredPlantSet);
  }, [report, filteredPlantSet]);

  const utilizationDistribution = useMemo(() => {
    return utilizationBuckets(capacityData.map((s) => s.utilization));
  }, [capacityData]);

  if (isLoading && !report) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải báo cáo từ PostgreSQL…
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-red-600 font-medium">Không tải được báo cáo năng lực.</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Kiểm tra API."}</p>
      </div>
    );
  }

  const k = report.kpis;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo cáo Năng lực Sản xuất"
        description=""
        actions={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <span className="text-xs text-muted-foreground hidden sm:inline">Thời gian</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Tuần này</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="quarter">Quý này</SelectItem>
                <SelectItem value="year">Năm này</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground hidden md:inline">Tốc độ</span>
            <Select value={speedRankFilter} onValueChange={(v) => setSpeedRankFilter(v as PlantRankFilter)}>
              <SelectTrigger className="w-[200px] min-w-0">
                <SelectValue placeholder="Tốc độ tốt nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tốc độ: Tất cả NM</SelectItem>
                <SelectItem value="top3">Tốc độ: Top 3 NM (TB actual)</SelectItem>
                <SelectItem value="top5">Tốc độ: Top 5 NM (TB actual)</SelectItem>
                <SelectItem value="median_up">Tốc độ: Từ trung vị trở lên</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground hidden md:inline">Sản lượng</span>
            <Select value={outputRankFilter} onValueChange={(v) => setOutputRankFilter(v as PlantRankFilter)}>
              <SelectTrigger className="w-[220px] min-w-0">
                <SelectValue placeholder="Sản lượng cao nhất" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sản lượng: Tất cả NM</SelectItem>
                <SelectItem value="top3">Sản lượng: Top 3 NM (max km/ca)</SelectItem>
                <SelectItem value="top5">Sản lượng: Top 5 NM (max km/ca)</SelectItem>
                <SelectItem value="median_up">Sản lượng: Từ trung vị trở lên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số máy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold">{k.total_machines}</span>
              <Badge className="bg-[#10b981] hover:bg-[#10b981]">
                {k.machines_with_capability_rows} có bản ghi NL
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {k.machines_without_capabilities} máy chưa có dòng năng lực
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cộng TB tốc độ TK (theo NM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{k.avg_design_speed_sum_by_plant.toLocaleString("vi-VN")}</span>
              <span className="text-sm text-muted-foreground">m/phút</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Σ trung bình design_speed theo từng nhà máy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cộng TB tốc độ TT (theo NM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{k.avg_actual_speed_sum_by_plant.toLocaleString("vi-VN")}</span>
              <span className="text-sm text-muted-foreground">m/phút</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Σ trung bình actual_speed theo từng nhà máy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TB hiệu suất (theo NM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{k.avg_utilization_percent}%</span>
              <TrendingUp className="h-5 w-5 text-[#10b981]" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{k.total_capability_rows.toLocaleString()} dòng năng lực</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Mã màu nhà máy:</span>
            {Object.entries(PLANT_COLORS).map(([plant, colors]) => (
              <div key={plant} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: colors.primary }} />
                <span className="text-sm font-medium">{getShortPlantName(plant)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(speedRankFilter !== "all" || outputRankFilter !== "all") && (
        <p className="text-sm text-muted-foreground">
          Đang lọc <strong>{capacityData.length}</strong> / {capacityDataFull.length} nhà máy trên biểu đồ & bảng (theo tốc độ TB actual và max sản lượng km/ca, hoặc kg/ca nếu không có km).
        </p>
      )}

      {capacityData.length === 0 && (speedRankFilter !== "all" || outputRankFilter !== "all") && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-100">
            Không có nhà máy nào thỏa đồng thời hai bộ lọc. Hãy nới &quot;Tất cả NM&quot; ở một trong hai lọc.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-[#1e3a8a]" />
              <CardTitle>Số lượng máy theo nhà máy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {machineCountData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Không có dữ liệu sau lọc.</p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={machineCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plant" tickFormatter={(value) => getShortPlantName(value)} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="active" name="Có bản ghi năng lực" radius={[4, 4, 0, 0]}>
                  {machineCountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPlantColor(entry.plant)} />
                  ))}
                </Bar>
                <Bar dataKey="inactive" fill="#ef4444" name="Chưa có bản ghi NL" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#1e3a8a]" />
              <CardTitle>Phân bố hiệu suất (TB actual/design theo NM)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {utilizationDistribution.every((x) => x.value === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-12">Không có dữ liệu sau lọc.</p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value} NM` : "")}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {utilizationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1e3a8a]" />
            <CardTitle>TB tốc độ thiết kế vs thực tế (m/phút theo nhà máy)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {capacityData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Không có dữ liệu sau lọc.</p>
          ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plant" tickFormatter={(value) => getShortPlantName(value)} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="design" name="TB design speed" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="TB actual speed" radius={[4, 4, 0, 0]}>
                {capacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPlantColor(entry.plant)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
            <CardTitle>Material chưa có năng lực theo nhà máy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missingDataByPlant.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Không có dữ liệu sau lọc.</p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={missingDataByPlant} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="plant" type="category" width={150} tickFormatter={(value) => getShortPlantName(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="missing" name="Material thiếu NL" radius={[0, 4, 4, 0]}>
                  {missingDataByPlant.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPlantColor(entry.plant)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Nhà máy</th>
                    <th className="text-right py-2 px-4">Material thiếu NL</th>
                    <th className="text-right py-2 px-4">Tổng master</th>
                    <th className="text-right py-2 px-4">Tỉ lệ thiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {missingDataByPlant.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground text-sm">
                        Không có dòng sau lọc.
                      </td>
                    </tr>
                  ) : (
                  missingDataByPlant.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: getPlantColor(item.plant) }} />
                          <span className="font-medium">{getShortPlantName(item.plant)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: getPlantColor(item.plant, "bg"),
                            borderColor: getPlantColor(item.plant, "border"),
                            color: getPlantColor(item.plant, "text"),
                          }}
                        >
                          {item.missing}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{item.total}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold ${
                            item.percentage > 20
                              ? "text-[#ef4444]"
                              : item.percentage > 10
                                ? "text-[#f59e0b]"
                                : "text-[#10b981]"
                          }`}
                        >
                          {item.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

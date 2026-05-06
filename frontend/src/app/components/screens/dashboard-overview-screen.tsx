import { useMemo, useState } from "react";
import { FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
} from "recharts";
import { KpiCard } from "@/app/components/ui/kpi-card";
import { PlantSummaryCard } from "@/app/components/ui/plant-summary-card";
import { ChartCard } from "@/app/components/ui/chart-card";
import { ChartLegend } from "@/app/components/ui/chart-legend";
import { ProcessChip } from "@/app/components/ui/process-chip";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cadiviPlantLabel, getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { useDashboardOverview } from "@/app/hooks/useDashboard";
import type { DashboardOverviewResponse } from "@/app/api/types";

interface DashboardOverviewScreenProps {
  onNavigateToPlantDetail: (plantName: string) => void;
}

const PLANT_FILTER_TO_CODE: Record<string, string | undefined> = {
  dn: "DN",
  lt: "LT",
  ta: "TA",
  bn: "BN",
};

const PROCESS_FILTER_TO_NAME: Record<string, string | undefined> = {
  keo: "Kéo",
  xoan: "Xoắn",
  giap: "Giáp",
  boc: "Bọc",
};

const PROCESS_FILTER_TO_CODE: Record<string, string | undefined> = {
  keo: "KEO",
  xoan: "XOAN",
  giap: "GIAP",
  boc: "BOC",
};

function buildDashboardView(live: DashboardOverviewResponse) {
  const k = live.kpis;
  const codeByShortName = new Map(live.plant_summaries.map((p) => [p.plant, p.plant_code]));

  const cov = live.coverage_by_process.map((c) => {
    const t = Math.max(1, c.total);
    return {
      process: c.process,
      hasData: Math.round((100 * c.has_data) / t),
      missing: Math.round((100 * c.missing) / t),
    };
  });
  const mach = live.machines_by_process.map((m) => ({
    process: m.process,
    count: m.count,
    plants: live.plant_summaries.length,
  }));
  const speedComparison = live.speed_comparison.map((s) => ({
    process: s.process,
    design: s.avg_design,
    actual: s.avg_actual,
  }));
  const scatterData = live.scatter_points.map((s) => {
    const label = cadiviPlantLabel(s.plant);
    return {
      plant: label,
      plantCode: codeByShortName.get(s.plant) ?? "",
      process: s.process,
      processCode: s.process_code,
      design: s.design,
      designPlot: s.design ?? 0,
      actual: s.actual,
      material: s.material_code,
    };
  });
  const paretoData = live.pareto_by_plant.map((p) => {
    const full = cadiviPlantLabel(p.plant);
    return {
      process: getShortPlantName(full),
      plantFull: full,
      plantCode: codeByShortName.get(p.plant) ?? "",
      count: p.count,
      cumulative: p.cumulative,
    };
  });
  const plantSummaries = live.plant_summaries.map((p) => ({
    plant: cadiviPlantLabel(p.plant),
    plantCode: p.plant_code,
    materialCount: p.materials_with_data,
    coverage: p.coverage_percent,
    machines: p.machines,
    processes: p.process_count,
  }));
  const topMaterials = live.top_materials.map((t) => ({
    code: t.code,
    description: t.description,
    process: t.process,
    plant: cadiviPlantLabel(t.plant),
    plantCode: codeByShortName.get(t.plant) ?? "",
    machine: t.machine,
    designSpeed: t.design_speed ?? 0,
    actualSpeed: t.actual_speed ?? 0,
    outputKm: t.output_km ?? 0,
    status: t.status === "complete" ? ("complete" as const) : ("partial" as const),
  }));

  return {
    totalMaterials: k.total_materials,
    materialsWithData: k.materials_with_capability,
    materialsComplete: k.materials_complete,
    materialsMissing: k.materials_missing,
    pendingApproval: k.import_jobs_active,
    machinesByProcess: mach,
    coverageByProcess: cov,
    speedComparison,
    scatterData,
    paretoData,
    plantSummaries,
    topMaterials,
  };
}

type DashboardView = ReturnType<typeof buildDashboardView>;

function applyDashboardFilters(
  view: DashboardView,
  selectedPlant: string,
  selectedProcess: string
): DashboardView {
  const plantCode = selectedPlant === "all" ? null : PLANT_FILTER_TO_CODE[selectedPlant];
  const processName = selectedProcess === "all" ? null : PROCESS_FILTER_TO_NAME[selectedProcess];
  const processStepCode = selectedProcess === "all" ? null : PROCESS_FILTER_TO_CODE[selectedProcess];

  const machinesByProcess = processName
    ? view.machinesByProcess.filter((m) => m.process === processName)
    : view.machinesByProcess;

  const coverageByProcess = processName
    ? view.coverageByProcess.filter((c) => c.process === processName)
    : view.coverageByProcess;

  const speedComparison = processName
    ? view.speedComparison.filter((s) => s.process === processName)
    : view.speedComparison;

  let scatterData = view.scatterData;
  if (processStepCode) {
    scatterData = scatterData.filter((d) => d.processCode === processStepCode);
  }
  if (plantCode) {
    scatterData = scatterData.filter((d) => d.plantCode === plantCode);
  }
  // Top 20 theo MATERIAL (không lặp mã), lấy bản ghi có actual cao nhất cho mỗi material.
  const byMaterial = new Map<
    string,
    {
      plant: string;
      plantCode: string;
      process: string;
      processCode: string;
      design: number | null;
      designPlot: number;
      actual: number;
      material: string;
    }
  >();
  for (const row of scatterData) {
    const key = `${row.processCode}|${row.material}`;
    const prev = byMaterial.get(key);
    if (!prev || row.actual > prev.actual) {
      byMaterial.set(key, row);
    }
  }
  scatterData = [...byMaterial.values()].sort((a, b) => b.actual - a.actual).slice(0, 20);

  let paretoData = view.paretoData;
  if (plantCode) {
    const sub = view.paretoData.filter((r) => r.plantCode === plantCode);
    const total = sub.reduce((s, r) => s + r.count, 0);
    let cum = 0;
    paretoData = sub.map((r) => {
      cum += r.count;
      return {
        ...r,
        cumulative: total > 0 ? Math.round((100 * cum) / total) : 0,
      };
    });
  }

  const plantSummaries = plantCode
    ? view.plantSummaries.filter((p) => p.plantCode === plantCode)
    : view.plantSummaries;

  const topMaterials = view.topMaterials.filter((m) => {
    if (plantCode && m.plantCode !== plantCode) return false;
    if (processName && m.process !== processName) return false;
    return true;
  });

  return {
    ...view,
    machinesByProcess,
    coverageByProcess,
    speedComparison,
    scatterData,
    paretoData,
    plantSummaries,
    topMaterials,
  };
}

export function DashboardOverviewScreen({ onNavigateToPlantDetail }: DashboardOverviewScreenProps) {
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState("all");

  const { data: liveOverview, isLoading, isError, error, dataUpdatedAt } = useDashboardOverview();

  const data = useMemo(() => {
    if (!liveOverview) return null;
    const base = buildDashboardView(liveOverview);
    return applyDashboardFilters(base, selectedPlant, selectedProcess);
  }, [liveOverview, selectedPlant, selectedProcess]);

  const updatedLabel = useMemo(() => {
    const t = dataUpdatedAt || Date.now();
    return new Date(t).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [dataUpdatedAt]);

  const filtersActive = selectedPlant !== "all" || selectedProcess !== "all";
  const scatterProcessLabel = selectedProcess === "all" ? "Tất cả công đoạn" : (PROCESS_FILTER_TO_NAME[selectedProcess] ?? "Tất cả công đoạn");

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-4 text-muted-foreground sm:p-6">
        Đang tải dashboard từ PostgreSQL…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-gray-50 p-4 sm:p-6">
        <p className="text-red-600 font-medium">Không tải được dashboard.</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Kiểm tra API và proxy VITE_API_PORT."}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Topbar */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:h-[52px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <div className="min-w-0">
          <h1 className="text-[15px] font-medium">Dashboard — Năng lực sản xuất</h1>
          <p className="text-[11px] text-muted-foreground">
            Dữ liệu PostgreSQL (API) · Lần tải: {updatedLabel}
            {filtersActive ? " · Bộ lọc áp dụng cho biểu đồ và bảng; 4 KPI đầu là toàn hệ thống." : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger
              className="h-10 w-full text-[12px] border-[0.5px] sm:h-8 sm:w-[180px] touch-manipulation"
              style={{ borderRadius: "6px" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhà máy</SelectItem>
              <SelectItem value="dn">Đà Nẵng</SelectItem>
              <SelectItem value="lt">Long Thành</SelectItem>
              <SelectItem value="ta">Tân Á</SelectItem>
              <SelectItem value="bn">Bắc Ninh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger
              className="h-10 w-full text-[12px] border-[0.5px] sm:h-8 sm:w-[180px] touch-manipulation"
              style={{ borderRadius: "6px" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả công đoạn</SelectItem>
              <SelectItem value="keo">Kéo</SelectItem>
              <SelectItem value="xoan">Xoắn</SelectItem>
              <SelectItem value="giap">Giáp</SelectItem>
              <SelectItem value="boc">Bọc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 p-4 sm:p-6">
        {/* Row 1 - Data Coverage KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          <KpiCard
            label="Tổng material"
            value={data.totalMaterials.toLocaleString()}
            subText="materials trong hệ thống"
            icon={<FileText className="h-8 w-8 text-[#3b82f6]" />}
            variant="neutral"
          />
          <KpiCard
            label="Có dữ liệu"
            value={data.materialsWithData.toLocaleString()}
            subText={`${
              data.totalMaterials > 0
                ? Math.round((data.materialsWithData / data.totalMaterials) * 100)
                : 0
            }% có ít nhất 1 dòng năng lực`}
            icon={<CheckCircle2 className="h-8 w-8 text-[#10b981]" />}
            variant="success"
          />
          <KpiCard
            label="Đầy đủ (TK+TT+Output km)"
            value={data.materialsComplete.toLocaleString()}
            subText={`${
              data.totalMaterials > 0
                ? Math.round((data.materialsComplete / data.totalMaterials) * 100)
                : 0
            }% đủ 3 cột chính`}
            icon={<CheckCircle2 className="h-8 w-8 text-[#059669]" />}
            variant="success"
          />
          <KpiCard
            label="Thiếu dữ liệu"
            value={data.materialsMissing.toLocaleString()}
            subText={`${
              data.totalMaterials > 0
                ? Math.round((data.materialsMissing / data.totalMaterials) * 100)
                : 0
            }% cần bổ sung`}
            icon={<AlertTriangle className="h-8 w-8 text-[#f59e0b]" />}
            variant="warning"
          />
          <KpiCard
            label="Chờ phê duyệt"
            value={data.pendingApproval}
            subText="job import đang chạy / chờ"
            icon={<Clock className="h-8 w-8 text-[#2563eb]" />}
            variant="info"
          />
        </div>

        {/* Row 2 - Machine Count by Process */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {data.machinesByProcess.map((item) => (
            <KpiCard
              key={item.process}
              label={`Tổng máy · ${item.process}`}
              value={item.count}
              subText={`${item.plants} nhà máy`}
              variant="neutral"
            />
          ))}
        </div>

        {/* Row 3 - Coverage & Speed Charts */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Coverage by Process */}
          <ChartCard
            title="Coverage dữ liệu theo công đoạn"
            subtitle="Phân bố dữ liệu đầy đủ và thiếu theo từng công đoạn"
            legend={
              <ChartLegend
                items={[
                  { name: "Có data", color: "#2563eb" },
                  { name: "Thiếu", color: "#e5e7eb" },
                ]}
              />
            }
          >
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.coverageByProcess}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="process" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: "%", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="hasData" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missing" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Speed Comparison */}
          <ChartCard
            title="Tốc độ thực tế vs thiết kế"
            subtitle="So sánh tốc độ thiết kế và thực tế theo công đoạn"
            legend={
              <ChartLegend
                items={[
                  { name: "Thiết kế", color: "#93c5fd" },
                  { name: "Thực tế", color: "#2563eb" },
                ]}
              />
            }
          >
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.speedComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="process" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: "m/min", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="design" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Row 4 - Scatter Chart */}
        <ChartCard
          title={`Phân bố actual_speed theo nhà máy — Top 20 trending (${scatterProcessLabel})`}
          subtitle={`Scatter: mỗi điểm = 1 material (theo mã công đoạn) | trục X = design_speed (NULL → 0 để vẽ) | trục Y = actual_speed | hiển thị ${data.scatterData.length}/20`}
          legend={
            <ChartLegend
              items={[
                { name: "Đà Nẵng", color: getPlantColor("Cadivi Đà Nẵng") },
                { name: "Long Thành", color: getPlantColor("Cadivi Long Thành") },
                { name: "Tân Á", color: getPlantColor("Cadivi Tân Á") },
                { name: "Bắc Ninh", color: getPlantColor("Cadivi Bắc Ninh") },
              ]}
            />
          }
        >
          {data.scatterData.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-10 text-center">
              Không có điểm nào cho bộ lọc hiện tại.
            </p>
          ) : (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    dataKey="designPlot"
                    name="Design speed"
                    unit=" m/min"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Design speed (m/min)", position: "insideBottom", offset: -5, fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="actual"
                    name="Actual speed"
                    unit=" m/min"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Actual speed (m/min)", angle: -90, position: "insideLeft", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as {
                        material: string;
                        plant: string;
                        process: string;
                        design: number | null;
                        designPlot: number;
                        actual: number;
                      };
                      return (
                        <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-sm">
                          <div className="font-mono font-semibold">{p.material}</div>
                          <div className="text-muted-foreground">{p.process}</div>
                          <div>{p.plant}</div>
                          <div className="mt-1 font-mono">
                            TK: {p.design == null ? "NULL" : p.design} (plot {p.designPlot}) · TT: {p.actual}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    name="Đà Nẵng"
                    data={data.scatterData.filter((d) => d.plant === "Cadivi Đà Nẵng")}
                    fill={getPlantColor("Cadivi Đà Nẵng")}
                    fillOpacity={0.55}
                  />
                  <Scatter
                    name="Long Thành"
                    data={data.scatterData.filter((d) => d.plant === "Cadivi Long Thành")}
                    fill={getPlantColor("Cadivi Long Thành")}
                    fillOpacity={0.55}
                  />
                  <Scatter
                    name="Tân Á"
                    data={data.scatterData.filter((d) => d.plant === "Cadivi Tân Á")}
                    fill={getPlantColor("Cadivi Tân Á")}
                    fillOpacity={0.55}
                  />
                  <Scatter
                    name="Bắc Ninh"
                    data={data.scatterData.filter((d) => d.plant === "Cadivi Bắc Ninh")}
                    fill={getPlantColor("Cadivi Bắc Ninh")}
                    fillOpacity={0.55}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Row 5 - Pareto Chart */}
        <ChartCard
          title="Missing data theo nhà máy — Phân tích Pareto"
          subtitle="Cột: số báo cáo thiếu (missing_capability_reports) | Đường đỏ: % tích lũy"
        >
          {data.paretoData.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-10 text-center">
              Không có báo cáo thiếu năng lực cho bộ lọc hiện tại.
            </p>
          ) : (
            <div style={{ height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="process" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: "Số báo cáo", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    label={{ value: "% tích lũy", angle: 90, position: "insideRight", fontSize: 11 }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.paretoData.map((entry, index) => {
                      const colors = ["#1d4ed8", "#15803d", "#b45309", "#6d28d9"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#dc2626" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Row 6 - Plant Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {data.plantSummaries.map((plant) => (
            <PlantSummaryCard
              key={plant.plant}
              plantName={plant.plant}
              materialCount={plant.materialCount}
              coveragePercent={plant.coverage}
              machineCount={plant.machines}
              processCount={plant.processes}
              onClick={() => onNavigateToPlantDetail(plant.plant)}
            />
          ))}
        </div>

        {/* Row 7 - Top Materials Table */}
        <div className="bg-white border-[0.5px] border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-[13px] font-medium">Top 20 material — Năng lực sản xuất thực tế</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-[#eff6ff] text-[#1d4ed8] border-[#1d4ed8]/30">
                Xoắn
              </Badge>
              <Badge variant="outline" className="bg-[#f0fdf4] text-[#15803d] border-[#15803d]/30">
                Bọc
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            {data.topMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-8 text-center">
                Không có dòng nào sau khi lọc. Thử “Tất cả nhà máy / công đoạn”.
              </p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50">
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Material Code
                  </TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">Mô tả</TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">Công đoạn</TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">Nhà máy</TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">Máy</TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                    TK (m/min)
                  </TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                    TT (m/min)
                  </TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                    Output km/ca
                  </TableHead>
                  <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topMaterials.map((material, idx) => (
                  <TableRow
                    key={idx}
                    className="h-11 hover:bg-gray-50 cursor-pointer"
                    style={{ borderBottom: idx === data.topMaterials.length - 1 ? "none" : "0.5px solid #e5e7eb" }}
                    onClick={() => onNavigateToPlantDetail(material.plant)}
                  >
                    <TableCell className="font-mono text-[11px]">{material.code}</TableCell>
                    <TableCell className="text-[12px] max-w-xs truncate">{material.description}</TableCell>
                    <TableCell>
                      <ProcessChip process={material.process as any} size="sm" />
                    </TableCell>
                    <TableCell className="text-[12px]">{material.plant}</TableCell>
                    <TableCell className="font-mono text-[11px]">{material.machine}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{material.designSpeed}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{material.actualSpeed}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{material.outputKm}</TableCell>
                    <TableCell>
                      {material.status === "complete" ? (
                        <Badge className="bg-[#f0fdf4] text-[#15803d] border-none">Đầy đủ</Badge>
                      ) : material.status === "partial" ? (
                        <Badge className="bg-[#eff6ff] text-[#1d4ed8] border-none">Một phần</Badge>
                      ) : (
                        <Badge className="bg-[#fffbeb] text-[#b45309] border-none">Thiếu data</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

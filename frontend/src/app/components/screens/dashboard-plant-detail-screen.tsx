import { useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { KpiCard } from "@/app/components/ui/kpi-card";
import { ChartCard } from "@/app/components/ui/chart-card";
import { SectionCollapse } from "@/app/components/ui/section-collapse";
import { ProcessChip } from "@/app/components/ui/process-chip";
import { EfficiencyBadge } from "@/app/components/ui/efficiency-badge";
import { BreadcrumbNav } from "@/app/components/ui/breadcrumb-nav";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { getPlantColor, getShortPlantName, cadiviPlantLabel } from "@/app/lib/plant-colors";
import { useDashboardPlantDetail } from "@/app/hooks/useDashboard";

interface DashboardPlantDetailScreenProps {
  plantName: string;
  onNavigateBack: () => void;
  onNavigateToSearch?: (plantName: string, machine: string) => void;
}

const processColors: Record<string, string> = {
  Kéo: "#1d4ed8",
  Xoắn: "#6d28d9",
  Giáp: "#b45309",
  Bọc: "#15803d",
};

const PROCESS_ORDER = ["Kéo", "Xoắn", "Giáp", "Bọc"];

const processSelectToVi: Record<string, string> = {
  keo: "Kéo",
  xoan: "Xoắn",
  giap: "Giáp",
  boc: "Bọc",
};

const VI_PROCESSES = new Set(["Kéo", "Xoắn", "Giáp", "Bọc"]);

export function DashboardPlantDetailScreen({
  plantName,
  onNavigateBack,
  onNavigateToSearch,
}: DashboardPlantDetailScreenProps) {
  const [selectedProcess, setSelectedProcess] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

  const { data, isLoading, isError, error } = useDashboardPlantDetail(plantName);

  const displayPlant = cadiviPlantLabel(data?.plant.name ?? plantName);
  const plantColor = getPlantColor(displayPlant, "primary");

  const sortedProcessEntries = useMemo(() => {
    if (!data) return [];
    const m = data.machines_by_process;
    const rank = new Map(PROCESS_ORDER.map((p, i) => [p, i]));
    return Object.keys(m)
      .sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
      .map((k) => [k, m[k]!] as const);
  }, [data]);

  const filteredProcessEntries = useMemo(() => {
    if (selectedProcess === "all") return sortedProcessEntries;
    const want = processSelectToVi[selectedProcess];
    return sortedProcessEntries.filter(([p]) => p === want);
  }, [sortedProcessEntries, selectedProcess]);

  if (isLoading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải chi tiết nhà máy…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 gap-2">
        <p className="text-red-600 font-medium">Không tải được chi tiết nhà máy.</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Kiểm tra API."}</p>
        <Button variant="outline" size="sm" onClick={onNavigateBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  const coverageByProcess = data.coverage_by_process;
  const topMachines = data.top_machines;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack}
            className="text-[12px] text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", onClick: onNavigateBack },
              { label: getShortPlantName(displayPlant) },
            ]}
          />
        </div>
        <div className="mt-2 flex flex-shrink-0 flex-wrap items-center gap-2 sm:mt-0 sm:gap-3">
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger
              className="h-8 w-full text-[12px] border-[0.5px] sm:w-[180px]"
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

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger
              className="h-8 w-full text-[12px] border-[0.5px] sm:w-[180px]"
              style={{ borderRadius: "6px" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Tháng này</SelectItem>
              <SelectItem value="lastMonth">Tháng trước</SelectItem>
              <SelectItem value="thisQuarter">Quý này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <p className="text-[11px] text-muted-foreground">
          Dữ liệu PostgreSQL · Mã NM <span className="font-mono">{data.plant.code}</span>
          {selectedPeriod !== "thisMonth" ? " · (bộ lọc thời gian chỉ hiển thị — chưa lọc CSDL)" : ""}
        </p>

        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Material có năng lực"
            value={data.materials_with_data.toLocaleString()}
            subText={`trên ${data.total_materials.toLocaleString()} material master`}
            variant="neutral"
          />
          <KpiCard
            label="Coverage"
            value={`${data.coverage_percent}%`}
            variant="success"
            showProgressBar
            progressValue={data.coverage_percent}
          />
          <KpiCard
            label="Thiếu data"
            value={data.materials_missing.toLocaleString()}
            subText="chưa có bản ghi năng lực tại NM"
            variant="warning"
          />
          <KpiCard
            label="Tổng máy"
            value={data.machine_count}
            subText={`${data.process_count} công đoạn (theo máy)`}
            variant="info"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title={`Coverage theo công đoạn — ${getShortPlantName(displayPlant)}`}
            subtitle="% material master có ít nhất một bản ghi năng lực tại NM"
          >
            <div style={{ height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageByProcess} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="process" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                    {coverageByProcess.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={processColors[entry.process] ?? "#64748b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Top 10 máy — Actual speed" subtitle="Theo bản ghi năng lực (m/phút)">
            <div style={{ height: "380px" }}>
              {topMachines.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">Chưa có dữ liệu tốc độ thực tế.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMachines} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="machine" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="actualSpeed" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>

        <div className="space-y-4">
          {filteredProcessEntries.map(([process, machines]) => (
            <SectionCollapse
              key={process}
              title={process}
              subtitle={`· ${machines.length} máy · coverage ${
                coverageByProcess.find((p) => p.process === process)?.coverage ?? 0
              }%`}
              chip={
                VI_PROCESSES.has(process) ? (
                  <ProcessChip process={process as "Kéo" | "Xoắn" | "Giáp" | "Bọc"} size="sm" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">{process}</span>
                )
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50">
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">
                        Máy
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        Design (m/min)
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        Actual (m/min)
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">
                        Hiệu suất %
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        Output km/ca
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        Output kg/ca
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground text-right">
                        Material count
                      </TableHead>
                      <TableHead className="h-10 text-[11px] uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine, idx) => (
                      <TableRow
                        key={`${machine.machine}-${idx}`}
                        className="h-11 hover:bg-gray-50 cursor-pointer"
                        style={{ borderBottom: idx === machines.length - 1 ? "none" : "0.5px solid #e5e7eb" }}
                        onClick={() => onNavigateToSearch?.(displayPlant, machine.machine)}
                      >
                        <TableCell className="font-mono text-[11px]">{machine.machine}</TableCell>
                        <TableCell className="font-mono text-[11px] text-right">{machine.designSpeed}</TableCell>
                        <TableCell className="font-mono text-[11px] text-right">{machine.actualSpeed}</TableCell>
                        <TableCell>
                          <EfficiencyBadge efficiency={machine.efficiency} />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-right">{machine.outputKm}</TableCell>
                        <TableCell className="font-mono text-[11px] text-right">
                          {machine.outputKg.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-right">{machine.materialCount}</TableCell>
                        <TableCell>
                          {machine.status === "complete" ? (
                            <Badge className="bg-[#f0fdf4] text-[#15803d] border-none">Đầy đủ</Badge>
                          ) : (
                            <Badge className="bg-[#fffbeb] text-[#b45309] border-none">Thiếu data</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCollapse>
          ))}
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardContent className="p-4">
            <h3 className="text-[13px] font-medium mb-3">
              Báo cáo thiếu năng lực (mẫu) — {getShortPlantName(displayPlant)}
            </h3>
            <p className="text-[11px] text-muted-foreground mb-2">
              Tổng material chưa có năng lực tại NM:{" "}
              <span className="font-semibold text-foreground">{data.materials_missing}</span> · Dưới đây là các dòng
              đã có báo cáo &quot;thiếu data&quot; gần đây.
            </p>
            <div className="flex flex-wrap gap-2">
              {data.missing_materials.length === 0 ? (
                <span className="text-sm text-muted-foreground">Chưa có báo cáo thiếu trong CSDL.</span>
              ) : (
                data.missing_materials.map((material, idx) => (
                  <Badge
                    key={`${material.code}-${idx}`}
                    variant="outline"
                    className="text-[11px]"
                    style={{
                      borderColor: plantColor,
                      color: plantColor,
                    }}
                  >
                    {material.code} · {material.process}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

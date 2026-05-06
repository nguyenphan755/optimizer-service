import { useState } from "react";
import { Activity, TrendingDown, AlertCircle, Award } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { PageHeader } from "@/app/components/ui/page-header";
import { KpiCard } from "@/app/components/ui/kpi-card";
import { ChartCard } from "@/app/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ProcessChip } from "@/app/components/ui/process-chip";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { machinePerformanceData } from "@/app/lib/analytics-dashboard-mock-data";

export function MachinePerformanceDashboard() {
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const data = machinePerformanceData;

  const avgOEE = Math.round(data.oeeData.reduce((sum, d) => sum + d.oee, 0) / data.oeeData.length);
  const avgAvailability = Math.round(data.oeeData.reduce((sum, d) => sum + d.availability, 0) / data.oeeData.length);
  const avgPerformance = Math.round(data.oeeData.reduce((sum, d) => sum + d.performance, 0) / data.oeeData.length);
  const avgQuality = Math.round(data.oeeData.reduce((sum, d) => sum + d.quality, 0) / data.oeeData.length);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader compact title="Hiệu suất Máy móc" subtitle="Machine Performance & OEE Analytics" />
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0 sm:shrink-0">
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger className="w-[180px] h-8 text-[12px]">
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
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày</SelectItem>
              <SelectItem value="30days">30 ngày</SelectItem>
              <SelectItem value="90days">90 ngày</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Overall OEE"
            value={`${avgOEE}%`}
            subText="Average across all machines"
            variant={avgOEE >= 75 ? "success" : avgOEE >= 65 ? "warning" : "danger"}
            icon={<Activity className="h-8 w-8 text-[#2563eb]" />}
          />
          <KpiCard
            label="Availability"
            value={`${avgAvailability}%`}
            subText="Machine uptime"
            variant="info"
            icon={<Activity className="h-8 w-8 text-[#10b981]" />}
          />
          <KpiCard
            label="Performance"
            value={`${avgPerformance}%`}
            subText="Speed efficiency"
            variant="info"
            icon={<Activity className="h-8 w-8 text-[#f59e0b]" />}
          />
          <KpiCard
            label="Quality"
            value={`${avgQuality}%`}
            subText="Quality rate"
            variant="success"
            icon={<Activity className="h-8 w-8 text-[#8b5cf6]" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="OEE Breakdown by Machine"
            subtitle="Phân tích chi tiết 3 thành phần OEE"
          >
            <div style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.oeeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="machine" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="availability" fill="#10b981" name="Availability" />
                  <Bar dataKey="performance" fill="#f59e0b" name="Performance" />
                  <Bar dataKey="quality" fill="#8b5cf6" name="Quality" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Utilization Timeline - Last 30 Days"
            subtitle="Xu hướng sử dụng máy theo thời gian"
          >
            <div style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.utilizationTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="Cadivi Đà Nẵng"
                    stroke={getPlantColor("Cadivi Đà Nẵng")}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cadivi Long Thành"
                    stroke={getPlantColor("Cadivi Long Thành")}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cadivi Tân Á"
                    stroke={getPlantColor("Cadivi Tân Á")}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cadivi Bắc Ninh"
                    stroke={getPlantColor("Cadivi Bắc Ninh")}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="Downtime Analysis - Root Causes"
            subtitle="Phân tích nguyên nhân dừng máy"
          >
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.downtimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="reason" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {data.downtimeData.map((entry, index) => {
                      const colors: Record<string, string> = {
                        critical: "#ef4444",
                        high: "#f59e0b",
                        medium: "#3b82f6",
                        low: "#10b981",
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.impact]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="space-y-4">
            <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#f59e0b]" />
                  Top 5 Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topPerformers.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{
                        backgroundColor: getPlantColor(item.plant, "bg"),
                        borderLeft: `3px solid ${getPlantColor(item.plant)}`,
                      }}
                    >
                      <div>
                        <p className="text-[11px] font-medium">{item.machine}</p>
                        <p className="text-[10px] text-muted-foreground">{getShortPlantName(item.plant)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-[#10b981]">{item.oee}%</p>
                        <p className="text-[10px] text-muted-foreground">OEE</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#ef4444]" />
                  Bottom 5 - Need Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.bottomPerformers.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#fef2f2]"
                      style={{ borderLeft: `3px solid #ef4444` }}
                    >
                      <div>
                        <p className="text-[11px] font-medium">{item.machine}</p>
                        <p className="text-[10px] text-muted-foreground">{getShortPlantName(item.plant)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-[#ef4444]">{item.oee}%</p>
                        <p className="text-[10px] text-muted-foreground">OEE</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium">OEE Details - All Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-[11px]">Machine</TableHead>
                  <TableHead className="text-[11px]">Nhà máy</TableHead>
                  <TableHead className="text-[11px]">Công đoạn</TableHead>
                  <TableHead className="text-[11px] text-right">OEE %</TableHead>
                  <TableHead className="text-[11px] text-right">Availability</TableHead>
                  <TableHead className="text-[11px] text-right">Performance</TableHead>
                  <TableHead className="text-[11px] text-right">Quality</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.oeeData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-[11px]">{item.machine}</TableCell>
                    <TableCell className="text-[12px]">{getShortPlantName(item.plant)}</TableCell>
                    <TableCell>
                      <ProcessChip process={item.process as any} size="sm" />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.oee}%</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.availability}%</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.performance}%</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.quality}%</TableCell>
                    <TableCell>
                      {item.oee >= 75 ? (
                        <Badge className="bg-[#f0fdf4] text-[#15803d] border-none">Excellent</Badge>
                      ) : item.oee >= 65 ? (
                        <Badge className="bg-[#fffbeb] text-[#f59e0b] border-none">Good</Badge>
                      ) : (
                        <Badge className="bg-[#fef2f2] text-[#ef4444] border-none">Needs Improvement</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

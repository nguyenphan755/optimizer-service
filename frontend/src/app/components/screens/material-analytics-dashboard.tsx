import { useState } from "react";
import { PackageSearch, AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
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
import { materialAnalyticsData } from "@/app/lib/analytics-dashboard-mock-data";

const processColors = {
  Kéo: "#1d4ed8",
  Xoắn: "#6d28d9",
  Giáp: "#b45309",
  Bọc: "#15803d",
};

export function MaterialAnalyticsDashboard() {
  const [selectedProcess, setSelectedProcess] = useState("all");
  const data = materialAnalyticsData;

  const quadrantColors: Record<string, string> = {
    star: "#10b981",
    growth: "#3b82f6",
    niche: "#8b5cf6",
    problem: "#ef4444",
    review: "#f59e0b",
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader
          compact
          title="Phân tích Material"
          subtitle="Material Complexity, Variance & Portfolio Analysis"
        />
        <div className="mt-2 w-full min-w-0 sm:mt-0 sm:w-auto sm:shrink-0">
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger className="h-8 w-full text-[12px] sm:w-[200px]">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Total Materials Analyzed"
            value={data.complexitySpeedData.length}
            subText="Across all processes"
            variant="neutral"
            icon={<PackageSearch className="h-8 w-8 text-[#3b82f6]" />}
          />
          <KpiCard
            label="High Variance Materials"
            value={data.varianceAnalysis.filter((m) => m.impact === "critical" || m.impact === "high").length}
            subText="Require attention"
            variant="warning"
            icon={<TrendingDown className="h-8 w-8 text-[#ef4444]" />}
          />
          <KpiCard
            label="Problematic Materials"
            value={data.problematicMaterials.length}
            subText="Quality or consistency issues"
            variant="danger"
            icon={<AlertTriangle className="h-8 w-8 text-[#f59e0b]" />}
          />
          <KpiCard
            label="Multi-Machine Materials"
            value={data.multiMachineConsistency.length}
            subText="Running on multiple machines"
            variant="info"
            icon={<BarChart3 className="h-8 w-8 text-[#8b5cf6]" />}
          />
        </div>

        <ChartCard
          title="Material Complexity vs Actual Speed"
          subtitle="Bubble size = volume | Color = process"
        >
          <div style={{ height: "320px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  dataKey="complexity"
                  name="Complexity"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Complexity Score", position: "insideBottom", offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="actualSpeed"
                  name="Speed"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Actual Speed (m/min)", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Scatter
                  name="Kéo"
                  data={data.complexitySpeedData.filter((d) => d.process === "Kéo")}
                  fill={processColors.Kéo}
                />
                <Scatter
                  name="Xoắn"
                  data={data.complexitySpeedData.filter((d) => d.process === "Xoắn")}
                  fill={processColors.Xoắn}
                />
                <Scatter
                  name="Bọc"
                  data={data.complexitySpeedData.filter((d) => d.process === "Bọc")}
                  fill={processColors.Bọc}
                />
                <Scatter
                  name="Giáp"
                  data={data.complexitySpeedData.filter((d) => d.process === "Giáp")}
                  fill={processColors.Giáp}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="Variance Analysis - Top Deviations"
            subtitle="Materials với chênh lệch lớn nhất"
          >
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.varianceAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="material" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
                    {data.varianceAnalysis.map((entry, index) => {
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

          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium">Portfolio Matrix</CardTitle>
              <p className="text-[11px] text-muted-foreground">Volume vs Efficiency</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.portfolioMatrix.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: quadrantColors[item.quadrant] }}
                      />
                      <div>
                        <p className="text-[11px] font-mono">{item.material}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.volume} volume • {item.efficiency} efficiency
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: quadrantColors[item.quadrant] + "20",
                        borderColor: quadrantColors[item.quadrant],
                        color: quadrantColors[item.quadrant],
                      }}
                    >
                      {item.quadrant}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium">Variance Analysis - Full Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-[11px]">Material</TableHead>
                  <TableHead className="text-[11px] text-right">Design Speed</TableHead>
                  <TableHead className="text-[11px] text-right">Actual Speed</TableHead>
                  <TableHead className="text-[11px] text-right">Variance</TableHead>
                  <TableHead className="text-[11px] text-right">Variance %</TableHead>
                  <TableHead className="text-[11px]">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.varianceAnalysis.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-[11px]">{item.material}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.design}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right">{item.actual}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right text-[#ef4444]">{item.variance}</TableCell>
                    <TableCell className="font-mono text-[11px] text-right text-[#ef4444]">
                      {item.variancePercent}%
                    </TableCell>
                    <TableCell>
                      {item.impact === "critical" ? (
                        <Badge className="bg-[#fef2f2] text-[#ef4444] border-none">Critical</Badge>
                      ) : item.impact === "high" ? (
                        <Badge className="bg-[#fffbeb] text-[#f59e0b] border-none">High</Badge>
                      ) : (
                        <Badge className="bg-[#eff6ff] text-[#2563eb] border-none">Medium</Badge>
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

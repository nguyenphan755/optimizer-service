import { useState } from "react";
import { TrendingUp, Calendar, Target, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { trendsData } from "@/app/lib/analytics-dashboard-mock-data";

export function TrendsForecastingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"6months" | "12months">("12months");
  const data = trendsData;

  // Combine historical + forecast for coverage
  const coverageTrendData = [
    ...data.historicalTrends.map((d) => ({ ...d, coverageForecast: null, type: "actual" })),
    ...data.forecast.map((d) => ({ ...d, coverage: null, type: "forecast" })),
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Topbar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader compact title="Xu hướng & Dự báo" subtitle="Historical Trends & Forecasting Analytics" />
        <div className="mt-2 w-full min-w-0 sm:mt-0 sm:w-auto sm:shrink-0">
          <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
            <SelectTrigger className="h-8 w-full text-[12px] sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">6 tháng gần nhất</SelectItem>
              <SelectItem value="12months">12 tháng gần nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Row 1 - YoY Comparison KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {data.yoyComparison.map((item) => (
            <KpiCard
              key={item.metric}
              label={`${item.metric} (YoY)`}
              value={item.current}
              subText={item.growth}
              variant={item.status === "excellent" ? "success" : "neutral"}
              icon={<TrendingUp className="h-8 w-8 text-[#10b981]" />}
            />
          ))}
        </div>

        {/* Row 2 - Historical Trends (12 months) */}
        <ChartCard
          title="Historical Trends — 12 tháng gần nhất"
          subtitle="Xu hướng Coverage, Utilization, Output theo thời gian"
        >
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.historicalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `T${date.getMonth() + 1}/${date.getFullYear() % 100}`;
                  }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 20]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="coverage"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Coverage %"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="utilization"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Utilization %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="output"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Output km/shift"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Row 3 - Coverage Forecast */}
        <ChartCard
          title="Coverage Forecast — 6 tháng tới"
          subtitle="Dự báo coverage với confidence levels"
        >
          <div style={{ height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={coverageTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `T${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="coverage"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.6}
                  name="Actual Coverage"
                />
                <Area
                  type="monotone"
                  dataKey="coverageForecast"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                  name="Forecast"
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Row 4 - Seasonal Patterns & Forecast Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* Seasonal Patterns */}
          <ChartCard
            title="Seasonal Patterns"
            subtitle="Mẫu hình theo mùa - Utilization rate"
          >
            <div style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.seasonalPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avgUtilization" radius={[4, 4, 0, 0]}>
                    {data.seasonalPatterns.map((entry, index) => {
                      const colors: Record<string, string> = {
                        peak: "#10b981",
                        high: "#3b82f6",
                        medium: "#f59e0b",
                        low: "#ef4444",
                      };
                      return (
                        <rect
                          key={`bar-${index}`}
                          fill={colors[entry.pattern]}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Forecast Table */}
          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-[#2563eb]" />
                6-Month Forecast Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.forecast.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[12px] font-medium">
                          {new Date(item.month).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Utilization: {item.utilizationForecast}% • Output: {item.outputForecast} km
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        item.confidence === "high"
                          ? "bg-[#f0fdf4] text-[#15803d] border-[#15803d]"
                          : item.confidence === "medium"
                          ? "bg-[#fffbeb] text-[#f59e0b] border-[#f59e0b]"
                          : "bg-[#fef2f2] text-[#ef4444] border-[#ef4444]"
                      }
                    >
                      {item.confidence}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 5 - Growth Metrics */}
        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#10b981]" />
              Growth Trajectory — Year-over-Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {data.yoyComparison.map((item) => (
                <div
                  key={item.metric}
                  className="p-4 rounded-lg border border-gray-200"
                  style={{
                    backgroundColor: item.status === "excellent" ? "#f0fdf4" : "#fafafa",
                  }}
                >
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">{item.metric}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-[20px] font-medium">{item.current}</p>
                    <p className="text-[11px] text-muted-foreground">từ {item.lastYear}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-[#10b981]" />
                    <span className="text-[12px] font-medium text-[#10b981]">{item.growth}</span>
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

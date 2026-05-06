import { AlertTriangle, TrendingUp, Target, DollarSign, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/app/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { executiveSummaryData } from "@/app/lib/analytics-dashboard-mock-data";

export function ExecutiveSummaryDashboard() {
  const data = executiveSummaryData;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5 sm:flex sm:min-h-[52px] sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <PageHeader compact title="Executive Summary" subtitle="High-Level Overview for Leadership" />
        <div className="mt-1 flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground sm:mt-0">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Cập nhật: {new Date().toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-5 gap-4">
          {data.strategicKPIs.map((kpi, idx) => (
            <Card
              key={idx}
              className="border-[0.5px]"
              style={{
                borderRadius: "10px",
                borderColor: kpi.status === "on-track" ? "#10b981" : "#f59e0b",
              }}
            >
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-[24px] font-medium">{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground">/ {kpi.target}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={
                      kpi.status === "on-track"
                        ? "bg-[#f0fdf4] text-[#15803d] border-[#15803d]"
                        : "bg-[#fffbeb] text-[#f59e0b] border-[#f59e0b]"
                    }
                  >
                    {kpi.status === "on-track" ? "On Track" : "Attention"}
                  </Badge>
                  <span className="text-[10px] text-[#10b981]">{kpi.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
                Critical Alerts
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Issues requiring immediate attention</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.criticalAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border-l-3"
                  style={{
                    backgroundColor:
                      alert.severity === "critical"
                        ? "#fef2f2"
                        : alert.severity === "high"
                        ? "#fffbeb"
                        : "#eff6ff",
                    borderLeft: `3px solid ${
                      alert.severity === "critical" ? "#ef4444" : alert.severity === "high" ? "#f59e0b" : "#3b82f6"
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[12px] font-medium flex-1">{alert.message}</p>
                    <Badge
                      variant="outline"
                      className={
                        alert.severity === "critical"
                          ? "text-[#ef4444] border-[#ef4444]"
                          : alert.severity === "high"
                          ? "text-[#f59e0b] border-[#f59e0b]"
                          : "text-[#3b82f6] border-[#3b82f6]"
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Affected: {alert.affected}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardHeader>
              <CardTitle className="text-[13px] font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#2563eb]" />
                Monthly Summary
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">{data.monthlySummary.month}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-[11px] font-medium text-[#10b981] mb-2">✓ Highlights</h4>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {data.monthlySummary.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#10b981] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-[11px] font-medium text-[#f59e0b] mb-2">⚠ Challenges</h4>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {data.monthlySummary.challenges.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#f59e0b] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-[#ef4444]" />
              Capacity vs Demand Gap — Next 4 Months
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Forecast shortage & capacity planning</p>
          </CardHeader>
          <CardContent>
            <div style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.capacityDemandGap}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Demand %"
                  />
                  <Line
                    type="monotone"
                    dataKey="capacity"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Capacity %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {data.capacityDemandGap.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: item.status === "critical" ? "#fef2f2" : "#fffbeb",
                  }}
                >
                  <p className="text-[10px] text-muted-foreground mb-1">{item.month}</p>
                  <p className="text-[14px] font-medium text-[#ef4444]">{item.gap}%</p>
                  <p className="text-[10px] text-muted-foreground">gap</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
          <CardHeader>
            <CardTitle className="text-[13px] font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#10b981]" />
              Investment Priorities
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Top initiatives ranked by ROI & impact</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.investmentPriorities.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2563eb] text-white font-medium text-[14px]">
                      {item.priority}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium mb-1">{item.initiative}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Impact: {item.impact}</span>
                        <span>•</span>
                        <span className="text-[#10b981] font-medium">ROI: {item.roi}</span>
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-[#10b981]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardContent className="p-4">
              <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">OEE</span>
                  <span className="text-[14px] font-medium">74%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Utilization</span>
                  <span className="text-[14px] font-medium">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Quality Rate</span>
                  <span className="text-[14px] font-medium">96.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardContent className="p-4">
              <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Data Coverage</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Overall</span>
                  <span className="text-[14px] font-medium">84%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Missing</span>
                  <span className="text-[14px] font-medium text-[#f59e0b]">957</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Pending</span>
                  <span className="text-[14px] font-medium text-[#3b82f6]">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[0.5px]" style={{ borderRadius: "10px" }}>
            <CardContent className="p-4">
              <h4 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Output</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Avg/Shift</span>
                  <span className="text-[14px] font-medium">15.8 km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">YoY Growth</span>
                  <span className="text-[14px] font-medium text-[#10b981]">+26.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Target</span>
                  <span className="text-[14px] font-medium">17.5 km</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

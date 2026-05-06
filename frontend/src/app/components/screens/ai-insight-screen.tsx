import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { PageHeader } from "@/app/components/ui/page-header";
import { Separator } from "@/app/components/ui/separator";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import {
  executiveSummaryData,
  optimizationData,
  trendsData,
  plantComparisonData,
  materialAnalyticsData,
} from "@/app/lib/analytics-dashboard-mock-data";
import {
  Sparkles,
  Database,
  Bot,
  LineChart,
  Cpu,
  ShieldCheck,
  ArrowRight,
  CalendarClock,
  Target,
  AlertTriangle,
  Factory,
  Search,
  FileBarChart,
} from "lucide-react";

export type DeepAnalyticsScreen =
  | "analytics-machine-performance"
  | "analytics-plant-comparison"
  | "analytics-material"
  | "analytics-trends"
  | "analytics-optimization"
  | "analytics-executive";

export interface AIInsightScreenProps {
  onOpenDeepAnalytics?: (screen: DeepAnalyticsScreen) => void;
  onOpenOperational?: (screen: "material-lookup" | "missing-data" | "capacity-report") => void;
}

const FUSION_SOURCES = [
  {
    key: "internal-db",
    label: "MES & Capacity DB",
    scope: "Nội bộ",
    detail: "Máy, vật tư, tốc độ, sản lượng theo nhà máy.",
    Icon: Database,
    tone: "border-slate-200 bg-slate-50/80 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100",
  },
  {
    key: "rules-kpi",
    label: "Rule & KPI engine",
    scope: "Nội bộ",
    detail: "Ngưỡng cảnh báo, Pareto, so sánh thiết kế vs thực tế.",
    Icon: Cpu,
    tone: "border-violet-200 bg-violet-50/80 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100",
  },
  {
    key: "forecast",
    label: "Chuỗi thời gian & dự báo",
    scope: "Nội bộ / mô hình",
    detail: "Xu hướng coverage, tốc độ và sản lượng theo tháng.",
    Icon: LineChart,
    tone: "border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
  },
  {
    key: "optimize",
    label: "Optimization layer",
    scope: "Nội bộ",
    detail: "Gợi ý máy, cân tải NM, ROI kịch bản.",
    Icon: Target,
    tone: "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    key: "llm",
    label: "LLM / Copilot (tùy cấu hình)",
    scope: "Ngoài hệ thống",
    detail: "Diễn giải ngôn ngữ tự nhiên, soạn báo cáo — kết nối API khi bật.",
    Icon: Bot,
    tone: "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  },
] as const;

const DEEP_LINKS: {
  screen: DeepAnalyticsScreen;
  title: string;
  blurb: string;
}[] = [
  {
    screen: "analytics-executive",
    title: "Executive Summary",
    blurb: "KPI chiến lược, rủi ro, ưu tiên đầu tư.",
  },
  {
    screen: "analytics-trends",
    title: "Trends & Forecasting",
    blurb: "Lịch sử, dự báo 6 tháng, độ tin cậy.",
  },
  {
    screen: "analytics-optimization",
    title: "Optimization Center",
    blurb: "Ghép máy, cân tải, chuyển NM, ROI.",
  },
  {
    screen: "analytics-material",
    title: "Material Analytics",
    blurb: "Độ phức tạp, phương sai, portfolio.",
  },
  {
    screen: "analytics-plant-comparison",
    title: "Multi-plant",
    blurb: "So sánh NM, gap, chi phí/km.",
  },
  {
    screen: "analytics-machine-performance",
    title: "Machine performance",
    blurb: "Tốc độ thực tế, biến động theo máy, top/bottom hiệu suất.",
  },
];

function kpiStatusClass(status: string) {
  if (status === "on-track") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  if (status === "attention") return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function alertSeverityClass(severity: string) {
  if (severity === "critical") return "border-red-200 bg-red-50/90 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100";
  if (severity === "high") return "border-orange-200 bg-orange-50/90 text-orange-950 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100";
  return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100";
}

export function AIInsightScreen({ onOpenDeepAnalytics, onOpenOperational }: AIInsightScreenProps) {
  const exec = executiveSummaryData;
  const strategicKpis = exec.strategicKPIs.filter((k) => !k.label.toUpperCase().includes("OEE"));
  const plantRows = plantComparisonData.plantKPIs;
  const problemCount = materialAnalyticsData.problematicMaterials.length;
  const highVariance = materialAnalyticsData.varianceAnalysis.filter(
    (m) => m.impact === "critical" || m.impact === "high"
  ).length;

  const cov = exec.strategicKPIs.find((k) => k.label.includes("Coverage"));
  const util = exec.strategicKPIs.find((k) => k.label.includes("Utilization"));
  const nextGap = exec.capacityDemandGap[0];
  const gapLine = nextGap
    ? `Kịch bản nhu cầu ${nextGap.month}: nhu cầu ${nextGap.demand}% so với năng lực ${nextGap.capacity}% (lệch ${nextGap.gap} điểm).`
    : "";
  const synthesis = {
    headline: "Tóm tắt tổng hợp (demo — đồng bộ từ các lớp phân tích nội bộ)",
    body: [
      cov && util
        ? `Hiện trạng: ${cov.label.toLowerCase()} ${cov.value}, ${util.label.toLowerCase()} ${util.value}. ${cov.trend}, ${util.trend}.`
        : "",
      gapLine,
      `Rủi ro vận hành: ${highVariance} vật tư có độ lệch tốc độ cao/critical; ${problemCount} vật tư đang được đánh dấu có vấn đề chất lượng hoặc tính nhất quán dữ liệu giữa các NM.`,
      "Hành động ưu tiên: tập trung coverage dữ liệu, tối ưu tốc độ/sản lượng theo nhóm vật tư trọng điểm, rồi mới mở rộng kịch bản đầu tư.",
    ]
      .filter(Boolean)
      .join(" "),
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-[1920px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-6">
        <PageHeader
          title="AI Analytics"
          description="Màn hình tổng hợp cho dữ liệu tốc độ, sản lượng/năng suất, coverage và thiếu dữ liệu theo nhà máy/vật tư; giúp nhìn rõ hiện trạng và hành động ưu tiên kế tiếp."
          actions={
            <Button
              type="button"
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              onClick={() =>
                toast.success("Đã làm mới tóm tắt từ dữ liệu nội bộ (demo). Kết nối API thật ở giai đoạn triển khai tiếp theo.")
              }
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Làm mới tóm tắt
            </Button>
          }
        />

        {/* Fusion strip */}
        <div className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-sky-50/60 p-4 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:via-gray-950 dark:to-sky-950/20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-violet-700 dark:text-violet-300 shrink-0" />
            <h2 className="text-sm font-semibold text-violet-950 dark:text-violet-100">
              Kiến trúc tín hiệu — kết hợp nội bộ & mở rộng
            </h2>
            <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-800 dark:border-violet-700">
              Fusion layer
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {FUSION_SOURCES.map(({ key, label, scope, detail, Icon, tone }) => (
              <div key={key} className={`rounded-lg border p-3 text-left ${tone}`}>
                <div className="flex items-start justify-between gap-2">
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{scope}</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-snug">{label}</p>
                <p className="mt-1 text-[11px] leading-relaxed opacity-90">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Synthesis */}
        <Card className="border-violet-200/80 shadow-sm dark:border-violet-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <CardTitle className="text-base">{synthesis.headline}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{synthesis.body}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Hiện tại */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hiện tại</h2>
              <Badge variant="secondary" className="text-xs">
                Snapshot
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {strategicKpis.map((k) => (
                <Card key={k.label} className="shadow-sm">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                      <Badge className={`text-[10px] font-normal ${kpiStatusClass(k.status)}`}>{k.status}</Badge>
                    </div>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Mục tiêu: <span className="font-medium text-foreground">{k.target}</span> · {k.trend}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cảnh báo & chú ý</CardTitle>
                <CardDescription>Ưu tiên xử lý theo mức độ (demo từ executive summary).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exec.criticalAlerts.map((a, i) => (
                  <div
                    key={i}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm ${alertSeverityClass(a.severity)}`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="leading-snug">{a.message}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] w-fit">
                      {a.affected}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tình hình nhà máy (mức khai thác năng lực)</CardTitle>
                <CardDescription>So sánh mức khai thác hiện tại theo từng NM (demo).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plantRows.map((p) => (
                  <div key={p.plant} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: getPlantColor(p.plant) }}
                        />
                        <span className="font-medium truncate">{getShortPlantName(p.plant)}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{p.utilization}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, p.utilization)}%`,
                          backgroundColor: getPlantColor(p.plant),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Điểm sáng tháng</CardTitle>
                  <CardDescription>{exec.monthlySummary.month}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 list-disc pl-4 text-muted-foreground">
                    {exec.monthlySummary.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Thách thức</CardTitle>
                  <CardDescription>Cần theo dõi sát</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 list-disc pl-4 text-muted-foreground">
                    {exec.monthlySummary.challenges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#1e3a8a]/25 shadow-sm dark:border-[#3b82f6]/30">
              <CardHeader>
                <CardTitle className="text-base">Việc cần làm ngay (vận hành)</CardTitle>
                <CardDescription>Mở đúng màn hình nghiệp vụ trong hệ thống.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-between h-auto py-3"
                  disabled={!onOpenOperational}
                  onClick={() => onOpenOperational?.("material-lookup")}
                >
                  <span className="flex items-center gap-2 text-left">
                    <Search className="h-4 w-4 shrink-0" />
                    Tra cứu năng lực vật tư
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-between h-auto py-3"
                  disabled={!onOpenOperational}
                  onClick={() => onOpenOperational?.("missing-data")}
                >
                  <span className="flex items-center gap-2 text-left">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Missing Data Records
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-between h-auto py-3"
                  disabled={!onOpenOperational}
                  onClick={() => onOpenOperational?.("capacity-report")}
                >
                  <span className="flex items-center gap-2 text-left">
                    <FileBarChart className="h-4 w-4 shrink-0" />
                    Báo cáo Năng lực
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tương lai & việc cần làm */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tương lai & việc cần làm</h2>
              <Badge variant="outline" className="text-xs border-violet-300 text-violet-800 dark:text-violet-200">
                Roadmap
              </Badge>
            </div>

            <Card className="border-violet-200/70 dark:border-violet-900/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Ưu tiên đầu tư / dự án</CardTitle>
                <CardDescription>Thứ tự gợi ý từ lớp tối ưu + executive (demo).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exec.investmentPriorities.map((p) => (
                  <div
                    key={p.priority}
                    className="flex gap-3 rounded-lg border bg-white/60 p-3 dark:bg-gray-900/40 dark:border-gray-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                      {p.priority}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{p.initiative}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          Tác động: {p.impact}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          ROI gợi ý: {p.roi}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nhu cầu vs năng lực (tới đây)</CardTitle>
                <CardDescription>Gap âm = thiếu năng lực so với nhu cầu kịch bản.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exec.capacityDemandGap.map((row) => (
                  <div key={row.month} className="rounded-lg border p-3 dark:border-gray-800">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{row.month}</span>
                      <Badge
                        variant="outline"
                        className={
                          row.status === "critical"
                            ? "border-red-300 text-red-800 dark:text-red-200"
                            : "border-amber-200 text-amber-900 dark:text-amber-200"
                        }
                      >
                        {row.status === "critical" ? "Critical" : "Shortage"}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div>
                        <p className="text-muted-foreground">Nhu cầu</p>
                        <p className="font-mono font-semibold">{row.demand}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Năng lực</p>
                        <p className="font-mono font-semibold">{row.capacity}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lệch</p>
                        <p className="font-mono font-semibold text-red-600 dark:text-red-400">{row.gap}%</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Gợi ý: tăng coverage dữ liệu, cân tải NM hoặc đầu tư máy — xem Optimization Center.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dự báo ngắn hạn (6 tháng)</CardTitle>
                <CardDescription>Từ chuỗi trends — độ tin cậy giảm dần xa hơn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendsData.forecast.map((f) => (
                  <div
                    key={f.month}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs dark:border-gray-800"
                  >
                    <span className="font-medium">{f.month}</span>
                    <span className="font-mono text-muted-foreground">
                      Cov {f.coverageForecast}% · Khai thác {f.utilizationForecast}%
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {f.confidence}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kịch bản ROI (chọn lọc)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimizationData.roiScenarios.slice(0, 3).map((r) => (
                  <div key={r.initiative} className="rounded-lg border p-3 text-sm dark:border-gray-800">
                    <p className="font-medium leading-snug">{r.initiative}</p>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <span>Đầu tư: {r.investment}</span>
                      <span>Tiết kiệm/năm: {r.annualSaving}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">ROI: {r.roi}</span>
                      <span>Hoàn vốn: {r.payback}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Deep analytics */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Drill-down chuyên sâu</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Các dashboard chi tiết đã có trong app — mở khi cần phân tích theo chủ đề.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DEEP_LINKS.map(({ screen, title, blurb }) => (
              <Card key={screen} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">{blurb}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={!onOpenDeepAnalytics}
                    onClick={() => onOpenDeepAnalytics?.(screen)}
                  >
                    Mở dashboard
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

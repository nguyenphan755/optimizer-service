import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Checkbox } from "@/app/components/ui/checkbox";
import { SideDrawer } from "@/app/components/ui/side-drawer";
import { PageHeader } from "@/app/components/ui/page-header";
import { TableCard } from "@/app/components/ui/table-card";
import { FilterBar } from "@/app/components/ui/filter-bar";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import {
  Search,
  FileDown,
  Factory,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  UserPlus,
  Clock,
  FileText,
  TrendingUp,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { usePlants } from "@/app/hooks/useMasterData";
import {
  useMissingDataList,
  useMissingDataSummary,
  useDeleteMissingReport,
  useBulkDeleteMissingReports,
} from "@/app/hooks/useMissingData";
import { useAuth } from "@/app/contexts/auth-context";
import { toast } from "sonner";
import { cadiviPlantLabel, hasMesAdminLikeAccess, isPlantPortalUser } from "@/app/lib/mes-plant-nav";

// Mock data (fallback khi API lỗi — ưu tiên dữ liệu API)
const missingDataRecords = [
  {
    id: "MD-001",
    materialCode: "53000173",
    materialName: "Cm 1.5n7x0.52",
    missingAt: "Cadivi Đà Nẵng",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 3, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3"] },
      { plant: "Cadivi Tân Á", hasData: true, machineCount: 2, machines: ["Xoắn 12-1", "Xoắn 12-4"] },
      { plant: "Cadivi Bắc Ninh", hasData: true, machineCount: 1, machines: ["Xoắn 88-2"] },
    ],
    requestedBy: "Nguyen Van A",
    requestedDate: "2026-03-15",
    assignedTo: "Plant Manager - Đà Nẵng",
    status: "pending",
    priority: "high",
    notes: "Khách hàng yêu cầu gấp, cần bổ sung data trong 3 ngày",
    history: [
      { date: "2026-03-15", action: "Created", user: "Nguyen Van A", note: "Request created" },
      { date: "2026-03-16", action: "Assigned", user: "System", note: "Assigned to Plant Manager - Đà Nẵng" },
    ],
  },
  {
    id: "MD-002",
    materialCode: "52000255",
    materialName: "CM 70c19x2 22",
    missingAt: "Cadivi Bắc Ninh",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 4, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3", "Xoắn 54-5"] },
      { plant: "Cadivi Tân Á", hasData: true, machineCount: 3, machines: ["Xoắn 12-1", "Xoắn 12-2", "Xoắn 12-4"] },
      { plant: "Cadivi Đà Nẵng", hasData: false, machineCount: 0, machines: [] },
    ],
    requestedBy: "Tran Thi B",
    requestedDate: "2026-03-18",
    assignedTo: "Plant Manager - Bắc Ninh",
    status: "in_progress",
    priority: "medium",
    notes: "Đang thu thập dữ liệu từ máy Xoắn 88",
    history: [
      { date: "2026-03-18", action: "Created", user: "Tran Thi B", note: "Request created" },
      { date: "2026-03-19", action: "In Progress", user: "Plant Manager - Bắc Ninh", note: "Started data collection" },
    ],
  },
  {
    id: "MD-003",
    materialCode: "53000258",
    materialName: "Cm 95c19x2 63",
    missingAt: "Cadivi Đà Nẵng",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 5, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3", "Xoắn 54-4", "Xoắn 54-5"] },
      { plant: "Cadivi Tân Á", hasData: true, machineCount: 4, machines: ["Xoắn 12-1", "Xoắn 12-2", "Xoắn 12-3", "Xoắn 12-4"] },
      { plant: "Cadivi Bắc Ninh", hasData: true, machineCount: 2, machines: ["Xoắn 88-1", "Xoắn 88-2"] },
    ],
    requestedBy: "Le Van C",
    requestedDate: "2026-03-20",
    assignedTo: null,
    status: "pending",
    priority: "high",
    notes: null,
    history: [
      { date: "2026-03-20", action: "Created", user: "Le Van C", note: "Request created" },
    ],
  },
  {
    id: "MD-004",
    materialCode: "52003962",
    materialName: "GD Cc 14/5 1kV",
    missingAt: "Cadivi Tân Á",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 6, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3", "Xoắn 54-4", "Xoắn 54-5", "Xoắn 54-6"] },
      { plant: "Cadivi Đà Nẵng", hasData: false, machineCount: 0, machines: [] },
      { plant: "Cadivi Bắc Ninh", hasData: true, machineCount: 3, machines: ["Xoắn 88-1", "Xoắn 88-2", "Xoắn 88-3"] },
    ],
    requestedBy: "Pham Van D",
    requestedDate: "2026-03-22",
    assignedTo: "Plant Manager - Tân Á",
    status: "completed",
    priority: "low",
    notes: "Đã hoàn thành và phê duyệt",
    history: [
      { date: "2026-03-22", action: "Created", user: "Pham Van D", note: "Request created" },
      { date: "2026-03-23", action: "In Progress", user: "Plant Manager - Tân Á", note: "Started" },
      { date: "2026-03-25", action: "Completed", user: "Specialist", note: "Data approved" },
    ],
  },
  {
    id: "MD-005",
    materialCode: "53000100",
    materialName: "Cm 50c19x2",
    missingAt: "Cadivi Long Thành",
    otherPlants: [
      { plant: "Cadivi Tân Á", hasData: true, machineCount: 2, machines: ["Xoắn 12-1", "Xoắn 12-2"] },
      { plant: "Cadivi Đà Nẵng", hasData: true, machineCount: 1, machines: ["Xoắn 45-1"] },
      { plant: "Cadivi Bắc Ninh", hasData: false, machineCount: 0, machines: [] },
    ],
    requestedBy: "Hoang Thi E",
    requestedDate: "2026-03-25",
    assignedTo: "Plant Manager - Long Thành",
    status: "pending",
    priority: "medium",
    notes: null,
    history: [
      { date: "2026-03-25", action: "Created", user: "Hoang Thi E", note: "Request created" },
    ],
  },
  {
    id: "MD-006",
    materialCode: "52002295",
    materialName: "GD Al 2x70c19",
    missingAt: "Cadivi Đà Nẵng",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 3, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3"] },
      { plant: "Cadivi Tân Á", hasData: true, machineCount: 2, machines: ["Xoắn 12-1", "Xoắn 12-4"] },
      { plant: "Cadivi Bắc Ninh", hasData: true, machineCount: 2, machines: ["Xoắn 88-1", "Xoắn 88-2"] },
    ],
    requestedBy: "Nguyen Van F",
    requestedDate: "2026-03-28",
    assignedTo: "Plant Manager - Đà Nẵng",
    status: "in_progress",
    priority: "high",
    notes: "Đang test máy Xoắn 12-5",
    history: [
      { date: "2026-03-28", action: "Created", user: "Nguyen Van F", note: "Request created" },
      { date: "2026-03-29", action: "In Progress", user: "Plant Manager - Đà Nẵng", note: "Testing machines" },
    ],
  },
  {
    id: "MD-007",
    materialCode: "53000310",
    materialName: "Cm 120c19x2 88",
    missingAt: "Cadivi Bắc Ninh",
    otherPlants: [
      { plant: "Cadivi Long Thành", hasData: true, machineCount: 4, machines: ["Xoắn 54-1", "Xoắn 54-2", "Xoắn 54-3", "Xoắn 54-4"] },
      { plant: "Cadivi Tân Á", hasData: false, machineCount: 0, machines: [] },
      { plant: "Cadivi Đà Nẵng", hasData: false, machineCount: 0, machines: [] },
    ],
    requestedBy: "Tran Van G",
    requestedDate: "2026-04-01",
    assignedTo: null,
    status: "pending",
    priority: "medium",
    notes: "Material mới, chỉ Long Thành đã có dữ liệu",
    history: [
      { date: "2026-04-01", action: "Created", user: "Tran Van G", note: "Request created" },
    ],
  },
];

type ApiMissingRow = {
  id: string;
  numericId: number;
  materialCode: string;
  materialName: string;
  missingAt: string;
  reportCount: number;
  lastAt: string;
  note: string | null;
  hasCapabilityAtPlant: boolean;
  capabilityUpdatedAt: string | null;
  dataUpdateAttributedUser: string | null;
};

export function MissingDataScreen() {
  const { user } = useAuth();
  const fullAccess = hasMesAdminLikeAccess(user ?? null);
  const plantPortal = isPlantPortalUser(user ?? null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlant, setFilterPlant] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<typeof missingDataRecords[0] | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiMissingRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);

  const deleteOne = useDeleteMissingReport();
  const bulkDelete = useBulkDeleteMissingReports();

  const { data: plants } = usePlants();

  const userPlant = useMemo(() => {
    if (!plantPortal || !user?.plant_code?.trim() || !plants?.length) return null;
    const code = user.plant_code.trim().toUpperCase();
    return plants.find((x) => x.code.trim().toUpperCase() === code) ?? null;
  }, [plantPortal, user, plants]);

  const plantScopeUnknown = plantPortal && Boolean(user?.plant_code?.trim()) && !userPlant;
  const plantPortalMissingCode = plantPortal && !user?.plant_code?.trim();

  useEffect(() => {
    if (!userPlant) return;
    const label = cadiviPlantLabel(userPlant.name);
    setFilterPlant(label);
  }, [userPlant]);

  const plantIdFromFilter = useMemo(() => {
    if (filterPlant === "all") return null;
    const p = plants?.find((x) => cadiviPlantLabel(x.name) === filterPlant);
    return p?.id ?? null;
  }, [filterPlant, plants]);

  const listPlantId = fullAccess ? plantIdFromFilter : userPlant ? userPlant.id : null;
  const listQueryEnabled =
    fullAccess ? true : Boolean(userPlant) && !plantScopeUnknown && !plantPortalMissingCode;

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    error: listFetchError,
  } = useMissingDataList({
    plantId: listPlantId,
    q: searchTerm,
    page: 1,
    enabled: listQueryEnabled,
  });

  const listErrorDetail =
    listFetchError instanceof Error ? listFetchError.message : "Lỗi không xác định khi gọi API.";

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useMissingDataSummary();

  const liveKpi = Boolean(summary && !summaryError);

  const apiRows: ApiMissingRow[] = useMemo(() => {
    if (!listData?.items?.length) return [];
    return listData.items.map((r) => ({
      id: String(r.id),
      numericId: r.id,
      materialCode: r.material_code,
      materialName: r.material_description,
      missingAt: `Cadivi ${r.plant_name}`,
      reportCount: r.report_count,
      lastAt: r.last_reported_at,
      note: r.note,
      hasCapabilityAtPlant: Boolean(r.has_capability_at_plant),
      capabilityUpdatedAt: r.capability_updated_at,
      dataUpdateAttributedUser: r.data_update_attributed_user,
    }));
  }, [listData]);

  useEffect(() => {
    setSelectedReportIds([]);
  }, [listData?.items, filterPlant, searchTerm]);

  const toggleSelectReport = (id: number) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allVisibleSelected =
    apiRows.length > 0 && apiRows.every((r) => selectedReportIds.includes(r.numericId));

  const handleBulkDelete = async () => {
    if (selectedReportIds.length === 0) return;
    if (
      !window.confirm(
        `Xóa ${selectedReportIds.length} bản ghi báo thiếu khỏi hệ thống? Hành động không hoàn tác.`
      )
    ) {
      return;
    }
    try {
      const n = await bulkDelete.mutateAsync(selectedReportIds);
      toast.success(`Đã xóa ${n.deleted} bản ghi.`);
      setSelectedReportIds([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xóa được.");
    }
  };

  const handleDeleteOne = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Xóa bản ghi báo thiếu này? Không hoàn tác.")) return;
    try {
      await deleteOne.mutateAsync(id);
      toast.success("Đã xóa bản ghi.");
      setDrawerOpen(false);
      setSelectedApi(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được.");
    }
  };

  const filteredRecords = missingDataRecords.filter((record) => {
    const matchesSearch =
      record.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlant = filterPlant === "all" || record.missingAt === filterPlant;
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;

    return matchesSearch && matchesPlant && matchesStatus;
  });

  const showApiTable = !listError && listData !== undefined;
  const showDemoTable = !plantPortal && !showApiTable;

  const userPlantLabel = userPlant ? cadiviPlantLabel(userPlant.name) : null;

  const plantTiles = useMemo(() => {
    if (liveKpi && summary?.by_plant?.length) {
      let rows = summary.by_plant.map((row) => {
        const plant = cadiviPlantLabel(row.plant_name);
        return {
          plant,
          short: getShortPlantName(plant),
          count: row.record_count,
        };
      });
      if (userPlantLabel) {
        rows = rows.filter((r) => r.plant === userPlantLabel);
        if (rows.length === 0) {
          rows = [{ plant: userPlantLabel, short: getShortPlantName(userPlantLabel), count: 0 }];
        }
      }
      return rows;
    }
    const demo: Record<string, number> = {
      "Cadivi Long Thành": missingDataRecords.filter((r) => r.missingAt === "Cadivi Long Thành").length,
      "Cadivi Tân Á": missingDataRecords.filter((r) => r.missingAt === "Cadivi Tân Á").length,
      "Cadivi Đà Nẵng": missingDataRecords.filter((r) => r.missingAt === "Cadivi Đà Nẵng").length,
      "Cadivi Bắc Ninh": missingDataRecords.filter((r) => r.missingAt === "Cadivi Bắc Ninh").length,
    };
    let out = Object.entries(demo).map(([plant, count]) => ({
      plant,
      short: getShortPlantName(plant),
      count,
    }));
    if (userPlantLabel) {
      out = out.filter((r) => r.plant === userPlantLabel);
      if (out.length === 0) {
        out = [{ plant: userPlantLabel, short: getShortPlantName(userPlantLabel), count: 0 }];
      }
    }
    return out;
  }, [liveKpi, summary, userPlantLabel]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-[#f59e0b] hover:bg-[#f59e0b]">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-[#3b82f6] hover:bg-[#3b82f6]">
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-[#10b981] hover:bg-[#10b981]">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-[#ef4444] hover:bg-[#ef4444]">High</Badge>;
      case "medium":
        return <Badge className="bg-[#f59e0b] hover:bg-[#f59e0b]">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleRowClick = (record: typeof missingDataRecords[0]) => {
    setSelectedApi(null);
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {plantScopeUnknown ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Tài khoản có mã nhà máy <span className="font-mono font-medium">{user?.plant_code}</span> nhưng không
          khớp danh mục nhà máy trên hệ thống. Liên hệ quản trị để gán đúng mã NM — danh sách báo thiếu tạm thời không
          tải được.
        </div>
      ) : plantPortalMissingCode ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Tài khoản nhà máy cần có <span className="font-medium">mã nhà máy (plant_code)</span> trên hệ thống để xem báo
          cáo thiếu theo đúng phạm vi. Vui lòng liên hệ quản trị.
        </div>
      ) : userPlantLabel ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          Bạn đang xem báo cáo thiếu dữ liệu chỉ cho nhà máy:{" "}
          <span className="font-semibold">{userPlantLabel}</span>.
        </div>
      ) : null}

      {/* Page Header */}
      <PageHeader
        title="Missing Data Management"
        description="Ghi nhận và theo dõi các Order Material thiếu dữ liệu năng lực sản xuất tại từng nhà máy"
        subtitle="💡 Click vào row để xem chi tiết và đối chiếu với nhà máy khác"
      />

      {/* KPI — đồng bộ PostgreSQL (missing_capability_reports); không có workflow Pending/Completed trên CSDL */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng bản ghi</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {summaryLoading && showApiTable
                    ? "…"
                    : liveKpi
                      ? summary!.total_records
                      : showApiTable
                        ? (listData?.total ?? 0)
                        : missingDataRecords.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {liveKpi
                    ? "cặp material–nhà máy (CSDL)"
                    : showApiTable
                      ? "theo API danh sách (tổng khớp summary khi tải xong)"
                      : "bản ghi (demo)"}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-[#f59e0b]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng lượt báo</p>
                <p className="text-2xl font-bold mt-1 text-[#f59e0b] tabular-nums">
                  {summaryLoading && showApiTable ? "…" : liveKpi ? summary!.total_report_events : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {liveKpi ? "Σ report_count" : "chỉ có trên CSDL"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#f59e0b]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Material khác nhau</p>
                <p className="text-2xl font-bold mt-1 text-[#3b82f6] tabular-nums">
                  {summaryLoading && showApiTable ? "…" : liveKpi ? summary!.distinct_materials : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {liveKpi ? "COUNT DISTINCT material_id" : "chỉ có trên CSDL"}
                </p>
              </div>
              <Factory className="h-8 w-8 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nhà máy có báo</p>
                <p className="text-2xl font-bold mt-1 text-[#10b981] tabular-nums">
                  {summaryLoading && showApiTable
                    ? "…"
                    : liveKpi
                      ? `${summary!.plants_with_reports}/${summary!.by_plant.length}`
                      : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {liveKpi
                    ? `TB ${summary!.avg_reports_per_record} lượt/bản ghi`
                    : "chỉ có trên CSDL"}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plant Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Thống kê theo nhà máy
            {liveKpi ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(PostgreSQL, realtime)</span>
            ) : (
              <span className="ml-2 text-xs font-normal text-amber-700">(demo — API summary lỗi)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {plantTiles.map(({ plant, short, count }) => (
              <div
                key={plant}
                className="flex items-center justify-between p-4 rounded-lg border-2"
                style={{
                  backgroundColor: getPlantColor(plant, "bg"),
                  borderColor: getPlantColor(plant, "border"),
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: getPlantColor(plant) }}
                    />
                    <p className="text-sm font-semibold" style={{ color: getPlantColor(plant, "text") }}>
                      {short}
                    </p>
                  </div>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{count}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    count >= 3
                      ? "bg-[#fee2e2] border-[#ef4444] text-[#ef4444]"
                      : count >= 1
                      ? "bg-[#fef3c7] border-[#f59e0b] text-[#f59e0b]"
                      : "bg-[#f0fdf4] border-[#10b981] text-[#10b981]"
                  }
                >
                  {count === 0 ? "OK" : `${count} báo cáo`}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table with Filters */}
      <TableCard
        title="Missing Data Records"
        description={
          showApiTable
            ? `${listData?.total ?? 0} bản ghi (PostgreSQL)`
            : showDemoTable
              ? `${filteredRecords.length} records (demo)`
              : plantPortal
                ? "Chỉ tải dữ liệu từ API theo nhà máy của bạn"
                : "—"
        }
        filters={
          <FilterBar>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, code, or name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={filterPlant}
              onValueChange={setFilterPlant}
              disabled={Boolean(userPlant) || plantScopeUnknown || plantPortalMissingCode}
            >
              <SelectTrigger className="w-[200px]">
                <Factory className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Chọn nhà máy" />
              </SelectTrigger>
              <SelectContent>
                {fullAccess ? (
                  <>
                    <SelectItem value="all">All Plants</SelectItem>
                    {(plants ?? []).map((p) => {
                      const v = cadiviPlantLabel(p.name);
                      return (
                        <SelectItem key={p.id} value={v}>
                          {p.name}
                        </SelectItem>
                      );
                    })}
                  </>
                ) : userPlant ? (
                  <SelectItem value={cadiviPlantLabel(userPlant.name)}>{userPlant.name}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="all">All Plants</SelectItem>
                    <SelectItem value="Cadivi Long Thành">Long Thành</SelectItem>
                    <SelectItem value="Cadivi Tân Á">Tân Á</SelectItem>
                    <SelectItem value="Cadivi Đà Nẵng">Đà Nẵng</SelectItem>
                    <SelectItem value="Cadivi Bắc Ninh">Bắc Ninh</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {showDemoTable && (
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FilterBar>
        }
      >
        <>
          {showApiTable && fullAccess && (
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-slate-50 px-4 py-2 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(v) => {
                    if (v === true) setSelectedReportIds(apiRows.map((r) => r.numericId));
                    else setSelectedReportIds([]);
                  }}
                  disabled={apiRows.length === 0}
                  aria-label="Chọn tất cả trên trang"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">Chọn tất cả</span>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={selectedReportIds.length === 0 || bulkDelete.isPending}
                className="min-h-9"
                onClick={() => void handleBulkDelete()}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Xóa đã chọn ({selectedReportIds.length})
              </Button>
            </div>
          )}
          <Table>
          <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <TableRow>
              {showApiTable && fullAccess ? (
                <TableHead className="w-10 text-center">
                  <span className="sr-only">Chọn</span>
                </TableHead>
              ) : null}
              <TableHead>ID</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Nhà máy thiếu data</TableHead>
              <TableHead>Đối chiếu</TableHead>
              <TableHead>Lượt báo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Cập nhật dữ liệu</TableHead>
              <TableHead>Cập nhật cuối</TableHead>
              {showApiTable && fullAccess ? (
                <TableHead className="w-12 text-center">
                  <span className="sr-only">Xóa</span>
                </TableHead>
              ) : (
                <TableHead></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading && (
              <TableRow>
                <TableCell
                  colSpan={showApiTable && fullAccess ? 11 : 9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải từ API…
                </TableCell>
              </TableRow>
            )}
            {listError && !listLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-amber-800 dark:text-amber-200">
                  <div className="mx-auto max-w-4xl space-y-2 text-left text-sm">
                    <p className="font-medium">
                      {plantPortal
                        ? "Không tải được danh sách báo thiếu từ API."
                        : "Không tải được danh sách báo thiếu từ API — bảng phía dưới là dữ liệu demo (chỉ Admin/HO)."}
                    </p>
                    <p className="rounded-md border border-amber-200/70 bg-amber-50/80 p-3 font-mono text-xs leading-snug text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-50 whitespace-pre-wrap">
                      {listErrorDetail}
                    </p>
                    {!plantPortal ? (
                      <p className="text-xs text-muted-foreground">
                        Thường gặp: backend chưa chạy hoặc sai cổng. Thử{" "}
                        <code className="rounded bg-muted px-1 py-0.5">npm run dev</code> (API + UI) hoặc một terminal{" "}
                        <code className="rounded bg-muted px-1 py-0.5">npm run dev:api</code> và một terminal{" "}
                        <code className="rounded bg-muted px-1 py-0.5">npm run dev:ui</code> — proxy Vite mặc định{" "}
                        <code className="rounded bg-muted px-1 py-0.5">/api</code> →{" "}
                        <code className="rounded bg-muted px-1 py-0.5">127.0.0.1:3002</code> (xem{" "}
                        <code className="rounded bg-muted px-1 py-0.5">VITE_API_PORT</code> /{" "}
                        <code className="rounded bg-muted px-1 py-0.5">VITE_API_PROXY_TARGET</code> trong .env).
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {plantPortal && !listQueryEnabled && !listLoading && !listError && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Không có dữ liệu để hiển thị cho phạm vi nhà máy của bạn. Kiểm tra mã nhà máy trên tài khoản hoặc liên
                  hệ quản trị.
                </TableCell>
              </TableRow>
            )}
            {showApiTable && !listLoading && apiRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showApiTable && fullAccess ? 11 : 9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không có báo cáo thiếu năng lực khớp bộ lọc.
                </TableCell>
              </TableRow>
            )}
            {showApiTable &&
              !listLoading &&
              apiRows.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  onClick={() => {
                    setSelectedRecord(null);
                    setSelectedApi(record);
                    setDrawerOpen(true);
                  }}
                >
                  {fullAccess ? (
                    <TableCell
                      className="w-10 align-middle"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedReportIds.includes(record.numericId)}
                        onCheckedChange={() => toggleSelectReport(record.numericId)}
                        aria-label={`Chọn báo cáo ${record.id}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-mono text-sm font-medium">{record.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-mono text-sm font-medium">{record.materialCode}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {record.materialName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: getPlantColor(record.missingAt, "bg"),
                        borderColor: getPlantColor(record.missingAt, "border"),
                        color: getPlantColor(record.missingAt, "text"),
                      }}
                      className="border"
                    >
                      {getShortPlantName(record.missingAt)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.reportCount} lần</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-800">Đã ghi nhận</Badge>
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    {record.hasCapabilityAtPlant ? (
                      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" aria-label="Đã bổ sung dữ liệu tại NM" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] text-xs">
                    {record.hasCapabilityAtPlant && record.capabilityUpdatedAt ? (
                      <div className="space-y-0.5">
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                          {new Date(record.capabilityUpdatedAt).toLocaleString("vi-VN")}
                        </div>
                        {record.dataUpdateAttributedUser ? (
                          <div className="text-muted-foreground">
                            {record.dataUpdateAttributedUser}
                          </div>
                        ) : (
                          <div className="text-muted-foreground italic">—</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{new Date(record.lastAt).toLocaleDateString("vi-VN")}</TableCell>
                  {fullAccess ? (
                    <TableCell
                      className="w-12 text-center"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteOne.isPending}
                        aria-label="Xóa bản ghi"
                        onClick={(e) => void handleDeleteOne(record.numericId, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            {showDemoTable && !listLoading && filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            )}
            {showDemoTable &&
              !listLoading &&
              filteredRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  onClick={() => handleRowClick(record)}
                >
                  <TableCell className="font-mono text-sm font-medium">{record.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-mono text-sm font-medium">{record.materialCode}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {record.materialName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: getPlantColor(record.missingAt),
                        borderColor: getPlantColor(record.missingAt, "border"),
                      }}
                      className="hover:opacity-90"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {getShortPlantName(record.missingAt)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {record.otherPlants.slice(0, 2).map((plant, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={
                            plant.hasData
                              ? "bg-[#f0fdf4] border-[#10b981] text-[#10b981] text-[10px]"
                              : "bg-[#fef2f2] border-[#ef4444] text-[#ef4444] text-[10px]"
                          }
                        >
                          {plant.hasData ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                          {plant.plant.replace("Cadivi ", "").substring(0, 2)}
                        </Badge>
                      ))}
                      {record.otherPlants.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{record.otherPlants.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(record.priority)}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">
                    {record.assignedTo || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {record.requestedDate}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
        </>
      </TableCard>

      {/* Instructions */}
      <Card className="bg-[#dbeafe] dark:bg-[#1e3a8a]/20 border-[#3b82f6]/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#1e3a8a] dark:text-[#3b82f6] mt-0.5" />
            <div>
              <h4 className="font-medium text-[#1e3a8a] dark:text-[#3b82f6] mb-2">
                Quy trình xử lý (Click row để xem chi tiết)
              </h4>
              <ol className="text-sm text-[#1e3a8a] dark:text-[#3b82f6] space-y-1 list-decimal list-inside">
                <li><strong>Ghi nhận:</strong> Tạo request khi tra cứu phát hiện thiếu data</li>
                <li><strong>Đối chiếu:</strong> Xem nhà máy khác đã có data để tham khảo</li>
                <li><strong>Assign:</strong> Giao việc cho Plant Manager</li>
                <li><strong>Upload:</strong> Nhà máy bổ sung data qua Plant Upload Portal</li>
                <li><strong>Phê duyệt:</strong> Specialist kiểm tra tại Approval Dashboard</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side Drawer for Details */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedApi(null);
        }}
        title={
          selectedApi
            ? `${selectedApi.id} — ${selectedApi.materialCode}`
            : selectedRecord
            ? `${selectedRecord.id} - ${selectedRecord.materialCode}`
            : ""
        }
        subtitle={selectedApi?.materialName ?? selectedRecord?.materialName}
        width="xl"
      >
        {selectedApi && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Báo cáo thiếu năng lực (API)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Nhà máy: </span>
                {selectedApi.missingAt}
              </p>
              <p>
                <span className="text-muted-foreground">Số lần báo: </span>
                {selectedApi.reportCount}
              </p>
              <p>
                <span className="text-muted-foreground">Cập nhật cuối (báo): </span>
                {new Date(selectedApi.lastAt).toLocaleString("vi-VN")}
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="font-medium text-slate-800 dark:text-slate-100">Assigned / dữ liệu NM</p>
                {selectedApi.hasCapabilityAtPlant ? (
                  <div className="mt-2 flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-emerald-800 dark:text-emerald-200">Đã có dữ liệu năng lực tại NM này.</p>
                      {selectedApi.capabilityUpdatedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cập nhật năng lực:{" "}
                          {new Date(selectedApi.capabilityUpdatedAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                      {selectedApi.dataUpdateAttributedUser ? (
                        <p className="text-xs mt-1">
                          <span className="text-muted-foreground">Ghi nhận xử lý: </span>
                          <span className="font-medium">{selectedApi.dataUpdateAttributedUser}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">Chưa có bản ghi năng lực tại NM (theo hệ thống).</p>
                )}
              </div>
              {selectedApi.note && (
                <p>
                  <span className="text-muted-foreground">Ghi chú: </span>
                  {selectedApi.note}
                </p>
              )}
              {fullAccess && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={deleteOne.isPending}
                  onClick={() => void handleDeleteOne(selectedApi.numericId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa bản ghi này
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {selectedRecord && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="plants">Đối chiếu nhà máy</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chi tiết Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Request ID</label>
                      <p className="font-mono font-medium">{selectedRecord.id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Material Code</label>
                      <p className="font-mono font-medium">{selectedRecord.materialCode}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Material Name</label>
                      <p>{selectedRecord.materialName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Nhà máy thiếu data</label>
                      <p>{selectedRecord.missingAt}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Priority</label>
                      <div className="mt-1">{getPriorityBadge(selectedRecord.priority)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Requested By</label>
                      <p>{selectedRecord.requestedBy}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Request Date</label>
                      <p>{selectedRecord.requestedDate}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Assigned To</label>
                      <p>{selectedRecord.assignedTo || <span className="text-muted-foreground italic">Not assigned</span>}</p>
                    </div>
                    {selectedRecord.notes && (
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Notes</label>
                        <p className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                          {selectedRecord.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {!selectedRecord.assignedTo && (
                  <Button className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign to Plant Manager
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="plants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đối chiếu với nhà máy khác</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Xem nhà máy nào đã có dữ liệu để tham khảo tốc độ, sản lượng
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedRecord.otherPlants.map((plant, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${
                        plant.hasData
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4" />
                            <span className="font-medium">{plant.plant}</span>
                          </div>
                        </div>
                        {plant.hasData ? (
                          <Badge className="bg-[#10b981] hover:bg-[#10b981]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Có dữ liệu
                          </Badge>
                        ) : (
                          <Badge className="bg-[#ef4444] hover:bg-[#ef4444]">
                            <XCircle className="h-3 w-3 mr-1" />
                            Không có dữ liệu
                          </Badge>
                        )}
                      </div>

                      {plant.hasData && (
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground mb-2">
                            Số máy: {plant.machineCount}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {plant.machines.map((machine, mIdx) => (
                              <Badge key={mIdx} variant="outline" className="text-xs">
                                {machine}
                              </Badge>
                            ))}
                          </div>
                          <Button size="sm" variant="outline" className="mt-3 w-full">
                            <TrendingUp className="h-3 w-3 mr-2" />
                            Xem chi tiết capacity tại {plant.plant}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lịch sử thay đổi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedRecord.history.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          {idx < selectedRecord.history.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.action}</span>
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">by {item.user}</p>
                          {item.note && (
                            <p className="text-sm mt-1">{item.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </SideDrawer>
    </div>
  );
}

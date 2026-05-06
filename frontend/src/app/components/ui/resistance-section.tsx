import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { AlertCircle, ChevronDown, Database } from "lucide-react";
import { getPlantName } from "@/app/lib/resistance-mock-data";
import { apiJson } from "@/app/api/http";
import type { ResistanceLookupResult, ResistanceMeasurement } from "@/app/lib/resistance-mock-data";

interface ResistanceApiRow {
  id: number;
  loai_sp: string;
  tiet_dien: number;
  ket_cau: string;
  plant_code: string | null;
  plant_name: string | null;
  plant_code_excel: string | null;
  ca: number | null;
  observed_at: string;
  dien_tro_max: number | null;
  dien_tro_max_raw: string | null;
  dien_tro_tt: number | null;
  ty_le_dien_tro_pct: number | null;
}

interface ResistanceApiResponse {
  material_id: number;
  row_count: number;
  latest_observed_at: string | null;
  rows: ResistanceApiRow[];
  parse?: { tiet_dien: number | null; ket_cau: string | null };
  message?: string;
}

interface ResistanceSectionProps {
  materialId: number | null;
  materialCode: string;
  processStepCode: string;
}

function meanFinite(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function averageResistanceRow(measurements: ResistanceMeasurement[]) {
  const rmax = measurements
    .map((m) => (typeof m.dien_tro_max === "number" ? m.dien_tro_max : null))
    .filter((x): x is number => x != null && Number.isFinite(x));
  const rtt = measurements.map((m) => m.dien_tro_tt).filter((x): x is number => x != null && Number.isFinite(x));
  const pct = measurements
    .map((m) => m.ty_le_dien_tro_pct)
    .filter((x): x is number => x != null && Number.isFinite(x));
  return {
    dien_tro_max: meanFinite(rmax),
    dien_tro_tt: meanFinite(rtt),
    ty_le_dien_tro_pct: meanFinite(pct),
  };
}

function mapApiToResult(api: ResistanceApiResponse, loaiFilter: "all" | "Ccc" | "Acc"): ResistanceLookupResult {
  const parse = api.parse ?? { tiet_dien: null, ket_cau: null };
  const rows = api.rows ?? [];
  const measurements: ResistanceMeasurement[] = rows.map((r) => ({
    id: r.id,
    observed_at: r.observed_at,
    plant_code: r.plant_code,
    plant_code_excel: r.plant_code_excel,
    loai_sp: r.loai_sp,
    ca: r.ca,
    dien_tro_max: r.dien_tro_max ?? r.dien_tro_max_raw ?? "—",
    dien_tro_tt: r.dien_tro_tt,
    ty_le_dien_tro_pct: r.ty_le_dien_tro_pct,
  }));

  return {
    success: parse.tiet_dien !== null && parse.ket_cau !== null,
    message: api.message,
    tiet_dien: parse.tiet_dien,
    ket_cau: parse.ket_cau,
    loai_sp_filter: loaiFilter,
    row_count: measurements.length,
    latest_observation: api.latest_observed_at,
    measurements,
  };
}

function formatObservedAt(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResistanceSection({ materialId, materialCode, processStepCode }: ResistanceSectionProps) {
  const [loaiSpFilter, setLoaiSpFilter] = useState<"all" | "Ccc" | "Acc">("all");
  const [historyOpen, setHistoryOpen] = useState(false);

  const loaiParam =
    loaiSpFilter === "all" ? "" : loaiSpFilter === "Ccc" ? "Ccc" : "Acc";

  const { data: apiRaw, isLoading } = useQuery({
    queryKey: ["resistance", "for-material", materialId, loaiParam],
    queryFn: async () => {
      const q = loaiParam ? `?loai_sp=${encodeURIComponent(loaiParam)}` : "";
      return apiJson<ResistanceApiResponse>(`/api/v1/resistance/for-material/${materialId}${q}`);
    },
    enabled: processStepCode === "XOAN" && materialId !== null && materialId > 0,
  });

  const data = useMemo(() => {
    if (!apiRaw) return null;
    return mapApiToResult(apiRaw, loaiSpFilter);
  }, [apiRaw, loaiSpFilter]);

  const sortedMeasurements = useMemo(() => {
    if (!data?.measurements?.length) return [];
    return [...data.measurements].sort(
      (a, b) =>
        new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime() || b.id - a.id
    );
  }, [data?.measurements]);

  const latestMeasurement = sortedMeasurements[0] ?? null;
  const olderMeasurements = sortedMeasurements.slice(1);
  const averages = useMemo(
    () => (sortedMeasurements.length ? averageResistanceRow(sortedMeasurements) : null),
    [sortedMeasurements]
  );

  useEffect(() => {
    setHistoryOpen(false);
  }, [materialId, loaiSpFilter]);

  if (processStepCode !== "XOAN") {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-violet-200 bg-gradient-to-b from-violet-50 to-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-600" />
            Điện trở đo (sheet DATA)
          </CardTitle>
          <p className="text-gray-500">Đang tải...</p>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center bg-violet-50/50 rounded-lg border border-violet-200 animate-pulse">
            <p className="text-violet-600">Đang tải dữ liệu điện trở...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!materialId) {
    return null;
  }

  if (!data) {
    return (
      <Card className="border-amber-200 bg-amber-50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Điện trở đo (sheet DATA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900">Không tải được dữ liệu điện trở cho {materialCode}.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.success) {
    return (
      <Card className="border-amber-200 bg-amber-50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Điện trở đo (sheet DATA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-900">{data.message ?? "Không suy được tiết diện/kết cấu từ mô tả material."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-b from-violet-50 to-white rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-600" />
              Điện trở đo (sheet DATA)
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-500">
                Khóa tra cứu:{" "}
                <span className="font-medium">
                  Tiết diện {data.tiet_dien} • Kết cấu {data.ket_cau}
                </span>
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                Loại SP:{" "}
                <span className="font-medium">
                  {loaiSpFilter === "all" ? "mọi Loại SP" : loaiSpFilter}
                </span>
              </span>
            </div>
          </div>
          <Select value={loaiSpFilter} onValueChange={(v: "all" | "Ccc" | "Acc") => setLoaiSpFilter(v)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Lọc Loại SP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Ccc">Ccc</SelectItem>
              <SelectItem value="Acc">Acc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 p-2 bg-violet-100/60 rounded-lg flex items-center justify-between">
          <span className="text-violet-900">
            Cập nhật mới nhất:{" "}
            <span className="font-medium">
              {data.latest_observation
                ? new Date(data.latest_observation).toLocaleString("vi-VN")
                : "—"}
            </span>
          </span>
          <Badge variant="outline" className="bg-violet-100 text-violet-700 border-violet-300">
            {data.row_count} bản ghi
          </Badge>
        </div>

        {data.row_count === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-violet-300 mx-auto mb-2" />
            <p className="text-violet-600">0 bản ghi khớp với khóa tra cứu</p>
            <p className="text-violet-500 mt-1">Thử đổi bộ lọc Loại SP hoặc kiểm tra dữ liệu đo trong DB.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="border border-violet-200 rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-violet-50">
                  <TableRow className="hover:bg-violet-50">
                    <TableHead className="h-10 text-gray-500">Thời điểm</TableHead>
                    <TableHead className="h-10 text-gray-500">NM</TableHead>
                    <TableHead className="h-10 text-gray-500">SP</TableHead>
                    <TableHead className="h-10 text-gray-500">Ca</TableHead>
                    <TableHead className="h-10 text-gray-500 text-right">R max</TableHead>
                    <TableHead className="h-10 text-gray-500 text-right">R TT</TableHead>
                    <TableHead className="h-10 text-gray-500 text-right">Tỷ lệ %R</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {averages && (
                    <TableRow className="h-11 bg-violet-100/90 font-medium text-violet-950">
                      <TableCell colSpan={4}>
                        <span className="text-violet-800">Trung bình cộng</span>
                        <span className="text-violet-600 font-normal text-xs ml-2">
                          ({sortedMeasurements.length} bản ghi)
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {averages.dien_tro_max != null ? averages.dien_tro_max.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {averages.dien_tro_tt != null ? averages.dien_tro_tt.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {averages.ty_le_dien_tro_pct != null
                          ? `${averages.ty_le_dien_tro_pct.toFixed(1)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )}
                  {latestMeasurement && (
                    <TableRow className="h-11 bg-emerald-50/70 border-t border-violet-200">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-emerald-800">Thời điểm gần nhất</span>
                          <span className="font-mono text-sm">{formatObservedAt(latestMeasurement.observed_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPlantName(latestMeasurement.plant_code, latestMeasurement.plant_code_excel)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{latestMeasurement.loai_sp}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{latestMeasurement.ca ?? "—"}</TableCell>
                      <TableCell className="font-mono text-right">
                        {typeof latestMeasurement.dien_tro_max === "number"
                          ? latestMeasurement.dien_tro_max.toFixed(2)
                          : latestMeasurement.dien_tro_max}
                      </TableCell>
                      <TableCell
                        className={`font-mono text-right ${
                          latestMeasurement.dien_tro_tt === null ? "text-muted-foreground" : ""
                        }`}
                      >
                        {latestMeasurement.dien_tro_tt !== null
                          ? latestMeasurement.dien_tro_tt.toFixed(2)
                          : "—"}
                      </TableCell>
                      <TableCell
                        className={`font-mono text-right ${
                          latestMeasurement.ty_le_dien_tro_pct === null ? "text-muted-foreground" : ""
                        }`}
                      >
                        {latestMeasurement.ty_le_dien_tro_pct !== null
                          ? `${latestMeasurement.ty_le_dien_tro_pct.toFixed(1)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {olderMeasurements.length > 0 && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-violet-900 hover:bg-violet-50/80">
                  <span>
                    Xem thêm <strong>{olderMeasurements.length}</strong> bản ghi trước đó
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${historyOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div
                    className="mt-2 border border-violet-200 rounded-lg overflow-x-auto overflow-y-auto max-h-[min(360px,50vh)]"
                  >
                    <Table>
                      <TableHeader className="sticky top-0 bg-violet-50 z-10">
                        <TableRow>
                          <TableHead className="h-9 text-gray-500 text-xs">Thời điểm</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs">NM</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs">SP</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs">Ca</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs text-right">R max</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs text-right">R TT</TableHead>
                          <TableHead className="h-9 text-gray-500 text-xs text-right">Tỷ lệ %R</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {olderMeasurements.map((measurement) => (
                          <TableRow key={measurement.id} className="h-10 hover:bg-violet-50/30">
                            <TableCell className="text-xs">{formatObservedAt(measurement.observed_at)}</TableCell>
                            <TableCell className="text-xs">
                              {getPlantName(measurement.plant_code, measurement.plant_code_excel)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {measurement.loai_sp}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-xs">{measurement.ca ?? "—"}</TableCell>
                            <TableCell className="font-mono text-right text-xs">
                              {typeof measurement.dien_tro_max === "number"
                                ? measurement.dien_tro_max.toFixed(2)
                                : measurement.dien_tro_max}
                            </TableCell>
                            <TableCell
                              className={`font-mono text-right text-xs ${
                                measurement.dien_tro_tt === null ? "text-muted-foreground" : ""
                              }`}
                            >
                              {measurement.dien_tro_tt !== null ? measurement.dien_tro_tt.toFixed(2) : "—"}
                            </TableCell>
                            <TableCell
                              className={`font-mono text-right text-xs ${
                                measurement.ty_le_dien_tro_pct === null ? "text-muted-foreground" : ""
                              }`}
                            >
                              {measurement.ty_le_dien_tro_pct !== null
                                ? `${measurement.ty_le_dien_tro_pct.toFixed(1)}%`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

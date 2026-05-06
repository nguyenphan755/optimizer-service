import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Search, X, Loader2, Star, Factory, Zap, Database, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ResistanceSection } from "@/app/components/ui/resistance-section";
import {
  parseExcelFile,
  bulkLookupFromRows,
  filterBulkResults,
  normalizePlantCompareKey,
  type ExcelRow,
  type BulkLookupResult,
} from "@/app/lib/excel-parser";
import {
  buildBulkMissingTemplateWorkbook,
  buildBulkMasterDataMissingWorkbook,
  buildBulkOptimalSpeedReportWorkbook,
  collectBulkTemplateExportRows,
} from "@/app/lib/bulk-missing-template-workbook";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import {
  useSearchAutocomplete,
  useMaterialCapability,
  useCapabilityLookupByCode,
  type AutocompleteSortParam,
} from "@/app/hooks/useCapacity";
import { useReportMissingCapability } from "@/app/hooks/useMissingData";
import { mapCapabilityToLookupView } from "@/app/lib/capability-mapper";
import type { AutocompleteItem } from "@/app/api/types";
import { ApiError } from "@/app/api/http";
import { toast } from "sonner";
import { usePlants } from "@/app/hooks/useMasterData";
import { getShortPlantName } from "@/app/lib/plant-colors";

// Process chip colors
const processColors: Record<string, { bg: string; text: string; label: string }> = {
  KEO: { bg: "bg-blue-100", text: "text-blue-700", label: "Kéo" },
  XOAN: { bg: "bg-purple-100", text: "text-purple-700", label: "Xoắn" },
  GIAP: { bg: "bg-amber-100", text: "text-amber-700", label: "Giáp" },
  BOC: { bg: "bg-green-100", text: "text-green-700", label: "Bọc" },
};

const processSteps = [
  { id: "all", label: "Tất cả" },
  { id: "KEO", label: "Kéo" },
  { id: "XOAN", label: "Xoắn" },
  { id: "GIAP", label: "Giáp" },
  { id: "BOC", label: "Bọc" },
];

function ProcessChip({ code }: { code: string }) {
  const config = processColors[code] || { bg: "bg-gray-100", text: "text-gray-700", label: code };
  return (
    <span className={`inline-flex items-center ${config.bg} ${config.text} rounded-full px-2 py-0.5 font-medium`}>
      {config.label}
    </span>
  );
}

/** Tên file an toàn trên Windows (bỏ ký tự cấm, khoảng trắng → _). */
function safeFilenameSegment(raw: string, maxLen = 48): string {
  const t = raw
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const base = t.slice(0, maxLen);
  return base.length > 0 ? base : "plant";
}

function bulkExportFilename(isoDate: string, plantFilter: string, bulkFilter: string): string {
  if (bulkFilter === "not-in-system") {
    return `missing_data_bulk_${isoDate}_master_data_thieu.xlsx`;
  }
  if (bulkFilter === "optimal-speed") {
    if (plantFilter && plantFilter !== "all") {
      return `bao_cao_toc_do_toi_uu_${isoDate}_${safeFilenameSegment(plantFilter)}.xlsx`;
    }
    return `bao_cao_toc_do_toi_uu_${isoDate}.xlsx`;
  }
  if (plantFilter && plantFilter !== "all") {
    return `missing_data_bulk_${isoDate}_${safeFilenameSegment(plantFilter)}.xlsx`;
  }
  return `missing_data_bulk_${isoDate}.xlsx`;
}

export function MaterialLookupScreen() {
  const [mode, setMode] = useState<"single" | "excel">("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [pendingExactCode, setPendingExactCode] = useState<string | null>(null);
  const [filterProcess, setFilterProcess] = useState("all");
  /** Sắp xếp danh sách gợi ý tra cứu (API /search/autocomplete?sort=) */
  const [autocompleteSort, setAutocompleteSort] = useState<AutocompleteSortParam>("relevance");
  /** Đóng danh sách gợi ý sau khi chọn một dòng (tránh còn mở khi debounce + gợi ý vẫn khớp mã) */
  const [autocompleteDismissed, setAutocompleteDismissed] = useState(false);

  const debounced = useDebouncedValue(searchTerm, 320);
  const { data: plantsMaster } = usePlants();
  const totalPlantsMaster = plantsMaster?.length ?? 0;
  const stepParam = filterProcess === "all" ? null : filterProcess;
  const { data: suggestions = [], isFetching: sugLoading } = useSearchAutocomplete(
    debounced,
    stepParam,
    autocompleteSort
  );
  const { data: lookupExact, isFetching: lookupLoading } =
    useCapabilityLookupByCode(pendingExactCode);
  const capabilityRankBy = autocompleteSort === "best_output" ? "output" : "speed";
  const {
    data: capRaw,
    isLoading: capLoading,
    isError: capError,
    error: capErr,
  } = useMaterialCapability(materialId, { rankBy: capabilityRankBy });

  const reportMissing = useReportMissingCapability();
  /** materialId:plantId → số lần báo thiếu mới nhất (theo response API sau lần bấm gần nhất) */
  const [missingReportCountByKey, setMissingReportCountByKey] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    setMissingReportCountByKey({});
  }, [materialId]);

  /** Đổi chip công đoạn: chỉ mở lại gợi ý khi chưa chọn material (đã chọn thì không ép mở dropdown) */
  useEffect(() => {
    if (materialId === null) {
      setAutocompleteDismissed(false);
    }
  }, [filterProcess, materialId]);

  useEffect(() => {
    setAutocompleteDismissed(false);
  }, [autocompleteSort]);

  useEffect(() => {
    if (lookupExact?.found && lookupExact.matches?.length) {
      setMaterialId(lookupExact.matches[0].material_id);
      setPendingExactCode(null);
      setAutocompleteDismissed(true);
    }
  }, [lookupExact]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Excel bulk lookup state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [excelStats, setExcelStats] = useState<{ totalRows: number; distinctCodes: number } | null>(null);
  const [isExcelProcessing, setIsExcelProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkLookupResult[]>([]);
  const [bulkFilter, setBulkFilter] = useState<string>("optimal-speed");
  const [bulkPlantFilter, setBulkPlantFilter] = useState<string>("all");

  const handleSearch = () => {
    const code = searchTerm.trim();
    if (/^\d{8}$/.test(code)) {
      setMaterialId(null);
      setPendingExactCode(code);
      return;
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setMaterialId(null);
    setPendingExactCode(null);
    setFilterProcess("all");
    setAutocompleteDismissed(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setExcelError(null);
    setExcelStats(null);
    setBulkResults([]);
    setIsExcelProcessing(true);

    const result = await parseExcelFile(file);

    setIsExcelProcessing(false);

    if (!result.success) {
      setExcelError(result.error || 'Lỗi đọc file');
      return;
    }

    setExcelRows(result.rows);
    setExcelStats({
      totalRows: result.totalRows,
      distinctCodes: result.distinctCodes,
    });
  };

  const handleBulkLookup = async () => {
    if (excelRows.length === 0) return;

    setIsExcelProcessing(true);
    try {
      const results = await bulkLookupFromRows(excelRows);
      setBulkResults(results);
    } catch (e) {
      setExcelError(e instanceof Error ? e.message : "Lỗi tra cứu hàng loạt");
    } finally {
      setIsExcelProcessing(false);
    }
  };

  const handleExportImportTemplate = () => {
    try {
      const filtered = filterBulkResults(bulkResults, bulkFilter, bulkPlantFilter);
      let u8: Uint8Array;
      let exportedCount = 0;

      if (bulkFilter === "not-in-system") {
        const masterRows = filtered.filter((r) => r.notFoundInSystem);
        if (masterRows.length === 0) {
          toast.error("Không có dòng “Master Data thiếu” trong bộ lọc hiện tại.");
          return;
        }
        u8 = buildBulkMasterDataMissingWorkbook(masterRows);
        exportedCount = masterRows.length;
      } else if (bulkFilter === "optimal-speed") {
        if (filtered.length === 0) {
          toast.error(
            "Không có dòng để xuất báo cáo (cần mã có trong HT, ít nhất một NM đã có dữ liệu năng lực; với “Chọn nhà máy” chỉ giữ các dòng có NM đề xuất trùng nhà máy đó)."
          );
          return;
        }
        u8 = buildBulkOptimalSpeedReportWorkbook(filtered);
        exportedCount = filtered.length;
      } else {
        const rows = collectBulkTemplateExportRows(bulkResults, bulkFilter, bulkPlantFilter);
        if (rows.length === 0) {
          toast.error(
            "Không có dòng nào để xuất (chọn “Nhà máy thiếu” và/hoặc một nhà máy cụ thể; cần mã có trong HT, còn thiếu NM, công đoạn Kéo/Xoắn/Giáp/Bọc)."
          );
          return;
        }
        u8 = buildBulkMissingTemplateWorkbook(rows);
        exportedCount = rows.length;
      }

      const blob = new Blob([u8], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const d = new Date().toISOString().slice(0, 10);
      link.download = bulkExportFilename(d, bulkPlantFilter, bulkFilter);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 2500);
      toast.success(
        bulkFilter === "not-in-system"
          ? `Đã tải ${exportedCount} dòng — sheet “Master_Data_thieu” đúng cột bảng.`
          : bulkFilter === "optimal-speed"
            ? `Đã tải ${exportedCount} dòng — sheet “Bao_cao_toc_do_toi_uu” (NM & máy & tốc độ đề xuất).`
            : `Đã tải ${exportedCount} dòng mẫu — điền tốc độ/máy rồi import như file master.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được file Excel.");
    }
  };

  const handleResetExcel = () => {
    setExcelFile(null);
    setExcelRows([]);
    setExcelError(null);
    setExcelStats(null);
    setBulkResults([]);
    setBulkFilter("optimal-speed");
    setBulkPlantFilter("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const data = capRaw ? mapCapabilityToLookupView(capRaw) : null;
  const processStepCode = data?.process ?? "";
  const isLoading =
    (!!pendingExactCode && lookupLoading) || (!!materialId && capLoading);
  const exactNotFound =
    !!lookupExact &&
    !lookupExact.found &&
    /^\d{8}$/.test(searchTerm.trim()) &&
    !lookupLoading;

  const filteredPlants = data?.plants;

  const selectedCapabilityStats = useMemo(() => {
    if (!data?.plants?.length) return null;
    const plist = data.plants as Array<{ hasData: boolean; machines: unknown[] }>;
    const withData = plist.filter((p) => p.hasData);
    const machines = withData.reduce((n, p) => n + p.machines.length, 0);
    return {
      plantsWithData: withData.length,
      totalPlants: plist.length,
      machinesWithData: machines,
    };
  }, [data?.plants]);

  const handleReportMissingForPlant = async (plantId: number, plantLabel: string) => {
    if (materialId == null) {
      toast.error("Chưa có material — không gửi được báo thiếu.");
      return;
    }
    try {
      const res = await reportMissing.mutateAsync({
        material_id: materialId,
        plant_id: plantId,
      });
      const key = `${materialId}:${plantId}`;
      setMissingReportCountByKey((prev) => ({ ...prev, [key]: res.report_count }));
      toast.success(
        `Ghi nhận báo thiếu lần ${res.report_count} — ${plantLabel}.`
      );
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Không gửi được báo thiếu.";
      toast.error(msg);
    }
  };

  const filteredBulkResults = useMemo(
    () => filterBulkResults(bulkResults, bulkFilter, bulkPlantFilter),
    [bulkResults, bulkFilter, bulkPlantFilter]
  );

  /** sheetRows = số dòng có mã Material (không rỗng). codesSent = mã distinct gửi API (= excelRows.length). */
  const bulkStats = {
    sheetRows: excelStats?.totalRows ?? 0,
    codesSent: excelStats?.distinctCodes ?? bulkResults.length,
    found: bulkResults.filter((r) => !r.notFoundInSystem).length,
    notFound: bulkResults.filter((r) => r.notFoundInSystem).length,
  };

  const allPlants = useMemo(() => {
    const names = (plantsMaster ?? []).map((p) => p.name).filter(Boolean);
    const base = names.length > 0 ? names : ["Long Thành", "Tân Á", "Đà Nẵng", "Bắc Ninh"];
    return Array.from(new Set(base));
  }, [plantsMaster]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-[1920px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Mode Pills */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`min-h-[44px] touch-manipulation rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-all sm:min-h-0 sm:w-auto ${
              mode === "single"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
            }`}
          >
            Tra cứu đơn
          </button>
          <button
            type="button"
            onClick={() => setMode("excel")}
            className={`min-h-[44px] touch-manipulation rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-all sm:min-h-0 sm:w-auto ${
              mode === "excel"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
            }`}
          >
            Tra cứu theo file Excel
          </button>
        </div>

        {mode === "single" && (
          <>
            {/* Sticky Search Bar */}
            <div className="sticky top-0 z-10 -mx-4 mb-4 bg-white px-4 py-4 shadow-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:py-5">
              <div className="mx-auto max-w-[1920px] space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Gõ ≥2 ký tự để gợi ý, hoặc mã 8 số + Enter"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setAutocompleteDismissed(false);
                      setMaterialId(null);
                      setPendingExactCode(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 min-h-[48px] rounded-[10px] border-[1.5px] border-gray-200 pl-11 pr-11 text-base text-gray-900 placeholder:text-gray-400 focus-within:border-blue-600 sm:h-[52px]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {(isLoading || sugLoading) ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : searchTerm ? (
                      <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                      </button>
                    ) : null}
                  </div>
                  {materialId === null &&
                    debounced.trim().length >= 2 &&
                    suggestions.length > 0 &&
                    !autocompleteDismissed && (
                    <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg z-30">
                      {suggestions.map((s: AutocompleteItem) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-start justify-between gap-3"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setAutocompleteDismissed(true);
                              setMaterialId(s.id);
                              setSearchTerm(s.material_code);
                              setPendingExactCode(null);
                              searchInputRef.current?.blur();
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-mono font-medium">{s.material_code}</span>
                              <span className="text-gray-600 ml-2">{s.material_description.slice(0, 80)}</span>
                              <span className="text-gray-400 text-xs ml-2">{s.process_step_code}</span>
                            </div>
                            <div className="shrink-0 text-xs text-gray-500 tabular-nums text-right pt-0.5 max-w-[140px] sm:max-w-none">
                              {totalPlantsMaster > 0
                                ? `${s.plant_count}/${totalPlantsMaster} NM`
                                : `${s.plant_count} NM`}
                              <span className="text-gray-300 mx-1">·</span>
                              {s.machine_count ?? 0} máy
                              {(s.best_actual_speed ?? 0) > 0 && (
                                <>
                                  <br />
                                  <span className="text-emerald-700">
                                    TT max {s.best_actual_speed!.toLocaleString("vi-VN")} m/ph
                                  </span>
                                </>
                              )}
                              {((s.best_output_km ?? 0) > 0 || (s.best_output_kg ?? 0) > 0) && (
                                <>
                                  <br />
                                  <span className="text-blue-700">
                                    SL max{" "}
                                    {(s.best_output_km ?? 0) > 0
                                      ? `${(s.best_output_km ?? 0).toLocaleString("vi-VN")} km/ca`
                                      : `${(s.best_output_kg ?? 0).toLocaleString("vi-VN")} kg/ca`}
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                  {selectedCapabilityStats && materialId != null && (
                    <div
                      className="shrink-0 text-sm text-gray-600 sm:text-right whitespace-nowrap px-1"
                      aria-live="polite"
                    >
                      <span className="font-medium text-gray-800">
                        {selectedCapabilityStats.plantsWithData}/{selectedCapabilityStats.totalPlants} nhà máy
                      </span>
                      <span className="text-gray-400 mx-1.5">·</span>
                      <span className="font-medium text-gray-800">
                        {selectedCapabilityStats.machinesWithData} máy có dữ liệu
                      </span>
                    </div>
                  )}
                </div>
                {exactNotFound && (
                  <p className="text-sm text-red-600">Không tìm thấy mã {searchTerm.trim()} trong hệ thống.</p>
                )}
                {capError && (
                  <p className="text-sm text-red-600">
                    {(capErr as Error)?.message ?? "Không tải được năng lực từ API."}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <span className="text-xs text-gray-500 shrink-0">Sắp xếp gợi ý</span>
                  <Select
                    value={autocompleteSort}
                    onValueChange={(v) => setAutocompleteSort(v as AutocompleteSortParam)}
                  >
                    <SelectTrigger className="h-10 w-full sm:w-[260px] rounded-lg border-gray-200 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Mặc định (độ liên quan)</SelectItem>
                      <SelectItem value="best_speed">Tốc độ tốt nhất (max TT)</SelectItem>
                      <SelectItem value="best_output">Sản lượng cao nhất (max km/ca · kg/ca)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 sm:max-w-[420px]">
                    {autocompleteSort === "relevance" &&
                      "Ưu tiên trùng đầu mã, rồi số nhà máy có dữ liệu."}
                    {autocompleteSort === "best_speed" &&
                      "Top gợi ý theo tốc độ thực tế cao nhất trong bản ghi năng lực (m/phút)."}
                    {autocompleteSort === "best_output" &&
                      "Top gợi ý theo max km/ca, tiếp theo kg/ca (trong bản ghi NL)."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {mode === "single" && (
          <>
            {/* Filter Chips */}
            {materialId && (
          <div className="mb-6 flex flex-wrap gap-2">
            {processSteps.map((step) => (
              <button
                type="button"
                key={step.id}
                onClick={() => setFilterProcess(step.id)}
                className={`min-h-[40px] touch-manipulation rounded-full border px-3 py-2 text-sm transition-all sm:min-h-0 sm:py-1 ${
                  filterProcess === step.id
                    ? "border-transparent bg-blue-600 text-white"
                    : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!materialId && !isLoading && (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <Factory className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">Tra cứu năng lực sản xuất</h3>
              <p className="text-gray-500">
                Nhập mã vật tư để xem thông tin năng lực tại các nhà máy CADIVI
              </p>
              <p className="text-gray-400 mt-2">
                Ví dụ: <span className="font-mono">53000173</span>, <span className="font-mono">53000258</span>
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="space-y-6">
            {/* Banner Summary */}
            <Card className="rounded-xl border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-4 shadow-sm sm:p-5">
              <div className="space-y-4">
                {/* Row 1: Material Info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-gray-900">{data.code}</span>
                    <span className="ml-2 block text-gray-600 sm:inline sm:mt-0">{data.name}</span>
                  </div>
                  <div className="shrink-0 self-start sm:self-auto">
                    <ProcessChip code={data.process} />
                  </div>
                </div>

                {/* Row 2: Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                  <div>
                    <div className="text-gray-500">Tốc độ cao nhất</div>
                    <div className="font-bold text-gray-900">{data.maxSpeed}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Sản lượng cao nhất</div>
                    <div className="font-bold text-gray-900">{data.maxOutput}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Nhà máy đề xuất</div>
                    <div className="font-bold text-gray-900">{data.recommendedPlant}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-500">Dây chuyền đề xuất</div>
                    <div className="font-bold text-gray-900 break-words" title={data.recommendedProductionLine}>
                      {data.recommendedProductionLine}
                    </div>
                  </div>
                </div>

                {/* Row 3: Plant Status — liệt kê tên từng nhà máy */}
                <div className="space-y-2 text-sm border-t border-blue-100/80 pt-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-green-600 font-medium shrink-0">● Có dữ liệu</span>
                    <span className="text-gray-600 shrink-0 tabular-nums">
                      ({data.plantsWithData})
                    </span>
                    <span className="text-gray-800 font-medium">
                      {data.plants
                        .filter((p: { hasData: boolean }) => p.hasData)
                        .map((p: { name: string }) => getShortPlantName(p.name))
                        .join(" · ") || "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-amber-600 font-medium shrink-0">○ Chưa có dữ liệu</span>
                    <span className="text-gray-600 shrink-0 tabular-nums">
                      ({data.plantsNoData})
                    </span>
                    <span className="text-gray-800 font-medium">
                      {data.plants
                        .filter((p: { hasData: boolean }) => !p.hasData)
                        .map((p: { name: string }) => getShortPlantName(p.name))
                        .join(" · ") || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Resistance Panel (only for XOAN) */}
            {processStepCode === "XOAN" && (
              <ResistanceSection
              materialId={materialId}
              materialCode={data?.code ?? ""}
              processStepCode={processStepCode}
            />
            )}

            {/* Plant Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredPlants?.map((plant: any, idx: number) => (
                <Card
                  key={idx}
                  className={`rounded-xl shadow-sm ${
                    plant.hasData
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-dashed border-gray-200"
                  }`}
                >
                  <CardHeader className="border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{plant.name}</span>
                      {plant.isRecommended && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Đề xuất
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {plant.hasData ? (
                    <CardContent className="pt-4 space-y-3">
                      {plant.machines.map((machine: any, mIdx: number) => (
                        <div
                          key={mIdx}
                          className={`p-3 rounded-lg border ${
                            machine.recommended
                              ? "bg-green-50 border-green-200"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{machine.id}</span>
                            {machine.recommended && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                <Badge className="bg-green-500 text-white">Đề xuất</Badge>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-xs sm:text-sm">
                            <div className="min-w-0">
                              <div className="text-gray-500">Thiết kế</div>
                              <div className="break-words font-mono text-gray-900">{machine.speedDesign}</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-gray-500">Thực tế</div>
                              <div className="break-words font-mono text-gray-900">{machine.speedActual}</div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-gray-500">Sản lượng</div>
                              <div className="break-words font-mono text-gray-900">{machine.output}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  ) : (
                    <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center min-h-[160px] gap-2">
                      <Database className="h-8 w-8 text-gray-300 mb-1" />
                      <p className="text-gray-400 text-center mb-1">Chưa có dữ liệu</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={
                          !materialId ||
                          reportMissing.isPending ||
                          typeof plant.plantId !== "number"
                        }
                        onClick={() =>
                          void handleReportMissingForPlant(plant.plantId as number, plant.name)
                        }
                      >
                        Báo thiếu dữ liệu
                      </Button>
                      {materialId != null &&
                        typeof plant.plantId === "number" &&
                        missingReportCountByKey[`${materialId}:${plant.plantId}`] != null && (
                          <p
                            className="text-sm font-medium text-emerald-700 text-center px-2 mt-2"
                            role="status"
                            aria-live="polite"
                          >
                            Ghi nhận báo thiếu lần{" "}
                            {missingReportCountByKey[`${materialId}:${plant.plantId}`]}.
                          </p>
                        )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
          </>
        )}

        {/* Excel Bulk Lookup Mode */}
        {mode === "excel" && (
          <div className="space-y-6">
            {/* Card 1: Upload & Instructions */}
            <Card className="rounded-xl border-slate-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <h2 className="font-semibold text-gray-900 mb-2">Tra cứu theo file Excel</h2>
                <p className="text-gray-600 mb-4">
                  Hệ thống sẽ đọc sheet <strong>đầu tiên</strong>, tối đa <strong>10.000</strong> dòng dữ liệu.
                  Cột <strong>bắt buộc: Material</strong> (mã vật liệu). Cột mô tả tùy chọn.
                  Tra cứu <strong>theo mã</strong>, <strong>gom distinct</strong> mã (dòng trùng chỉ tra một lần).
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label htmlFor="excel-file-input">
                    <Button
                      asChild
                      className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
                    >
                      <span>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Chọn file .xlsx
                      </span>
                    </Button>
                  </label>
                  {excelFile && (
                    <span className="text-gray-600 truncate">{excelFile.name}</span>
                  )}
                </div>

                {/* Error */}
                {excelError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>{excelError}</span>
                    </div>
                  </div>
                )}

                {/* Success - Ready to lookup */}
                {excelStats && !excelError && (
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      Đã đọc{" "}
                      <span className="font-semibold text-blue-600 tabular-nums">{excelStats.totalRows}</span> dòng chứa
                      dữ liệu Material →{" "}
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {excelStats.distinctCodes}
                      </span>{" "}
                      mã sau khi gom và lọc trùng lặp.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkLookup}
                        disabled={isExcelProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        {isExcelProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang tra cứu...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Tra cứu hàng loạt
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleResetExcel}
                        variant="outline"
                        className="rounded-lg"
                      >
                        Chọn file khác
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Results Table */}
            {bulkResults.length > 0 && (
              <Card className="rounded-xl border-slate-200 shadow-sm">
                {/* Toolbar */}
                <div className="space-y-3 border-b border-slate-100 px-3 py-3 sm:px-4">
                  {/* Stats Row */}
                  <p className="text-gray-700">
                    <strong>{bulkStats.sheetRows}</strong> dòng có mã Material · Đã gửi tra cứu{" "}
                    <strong>{bulkStats.codesSent}</strong> mã (sau khi gom) · Tìm thấy <strong>{bulkStats.found}</strong> ·
                    Không có trong hệ thống{" "}
                    <strong className="text-red-600">{bulkStats.notFound}</strong>
                  </p>

                  {/* Controls Row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <span className="shrink-0 text-gray-600 font-medium">Nội dung:</span>
                    <Select value={bulkFilter} onValueChange={setBulkFilter}>
                      <SelectTrigger className="h-11 w-full min-w-0 rounded-lg border-gray-200 sm:h-10 sm:w-[280px] touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="optimal-speed">Tốc độ tối ưu</SelectItem>
                        <SelectItem value="missing-any-plant">Nhà máy thiếu</SelectItem>
                        <SelectItem value="not-in-system">Master Data thiếu</SelectItem>
                      </SelectContent>
                    </Select>

                    <span className="shrink-0 text-gray-600 font-medium sm:ml-1">Chọn nhà máy:</span>
                    <Select value={bulkPlantFilter} onValueChange={setBulkPlantFilter}>
                      <SelectTrigger className="h-11 w-full min-w-0 rounded-lg border-gray-200 bg-white sm:h-10 sm:w-[240px] touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhà máy</SelectItem>
                        {allPlants.map((plant) => (
                          <SelectItem key={plant} value={plant}>
                            {plant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      onClick={handleExportImportTemplate}
                      variant="outline"
                      className="ml-0 min-h-[44px] w-full touch-manipulation rounded-lg border-gray-300 hover:bg-gray-50 sm:ml-auto sm:h-10 sm:min-h-0 sm:w-auto"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Xuất Excel (đang lọc)
                    </Button>
                  </div>

                  {/* Note Row */}
                  <p className="text-gray-500">
                    <span className="text-gray-600">
                      Bảng và <strong>Xuất Excel</strong> (mẫu import hoặc báo cáo — theo Nội dung) dùng chung:{" "}
                      <strong>Nội dung</strong> +{" "}
                      <strong>Chọn nhà máy</strong>
                      {bulkPlantFilter !== "all" ? (
                        <>
                          {" "}
                          (đang chọn <strong>{bulkPlantFilter}</strong>)
                        </>
                      ) : null}
                      .{" "}
                    </span>
                    {bulkFilter === "not-in-system" ? (
                      <>
                        Với <strong>Master Data thiếu</strong>: file <strong>.xlsx</strong> một sheet{" "}
                        <strong>Master_Data_thieu</strong> — đúng các cột bảng (Material, mô tả file, trạng thái HT,
                        công đoạn, NM, tốc độ, điện trở). <em>Chọn nhà máy</em> không lọc thêm loại này (mã chưa có
                        trong HT).
                      </>
                    ) : bulkFilter === "optimal-speed" ? (
                      <>
                        Với <strong>Tốc độ tối ưu</strong>: file <strong>.xlsx</strong> một sheet{" "}
                        <strong>Bao_cao_toc_do_toi_uu</strong> — báo cáo nhanh{" "}
                        <strong>Nhà máy đề xuất</strong>, loại máy, tốc độ thực tế tốt nhất, số NM có dữ liệu, NM
                        thiếu. <em>Chọn nhà máy</em> chỉ giữ các dòng có <strong>NM đề xuất</strong> trùng nhà máy đó.
                      </>
                    ) : (
                      <>
                        Với <strong>Nhà máy thiếu</strong>: file <strong>.xlsx</strong> 4 sheet như template năng lực —
                        cột Factory theo NM thiếu (theo nhà máy đã chọn nếu có), tốc độ và{" "}
                        <strong>Machine Type</strong> để trống để import master.
                      </>
                    )}{" "}
                    Đang xem bảng: <strong>{filteredBulkResults.length}</strong> dòng.
                  </p>
                </div>

                {/* Table */}
                <CardContent className="p-0">
                  <div
                    className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0"
                    style={{ maxHeight: "min(560px, 70vh)" }}
                  >
                    {filteredBulkResults.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        Không có dòng khớp bộ lọc
                      </div>
                    ) : (
                      <Table className="min-w-[720px]">
                        <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                          <TableRow>
                            <TableHead className="text-gray-500">Material</TableHead>
                            <TableHead className="text-gray-500">Mô tả (file)</TableHead>
                            <TableHead className="text-gray-500">Mô tả (HT)</TableHead>
                            <TableHead className="text-gray-500">Công đoạn</TableHead>
                            <TableHead className="text-gray-500" title="NM có tốc độ thực tế tốt nhất hiển thị trên cùng, in đậm">
                              NM có dữ liệu
                            </TableHead>
                            <TableHead className="text-gray-500">NM thiếu</TableHead>
                            <TableHead className="text-gray-500">Tốc độ tốt nhất</TableHead>
                            <TableHead className="text-gray-500" title="Loại máy gắn với bản ghi năng lực đề xuất">
                              Tên máy (đề xuất)
                            </TableHead>
                            <TableHead className="text-gray-500">Điện trở (dòng)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100">
                          {filteredBulkResults.map((row, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/80">
                              <TableCell className="font-mono">{row.materialCode}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={row.descriptionFile}>
                                {row.descriptionFile || '—'}
                              </TableCell>
                              <TableCell className={row.notFoundInSystem ? 'text-red-600' : ''}>
                                {row.notFoundInSystem ? 'KHÔNG CÓ TRONG HỆ THỐNG' : (row.descriptionSystem || '—')}
                              </TableCell>
                              <TableCell>{row.processStep || '—'}</TableCell>
                              <TableCell>
                                {row.plantsWithData.length > 0 ? (
                                  <ul className="space-y-1.5">
                                    {row.plantsWithData.map((p, i) => {
                                      const bestKey = row.bestPlantName
                                        ? normalizePlantCompareKey(row.bestPlantName)
                                        : "";
                                      const isRecommended =
                                        Boolean(bestKey) &&
                                        normalizePlantCompareKey(p) === bestKey;
                                      return (
                                        <li key={`${row.materialCode}-${i}-${p}`} className="text-sm">
                                          {isRecommended ? (
                                            <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-semibold text-blue-900">
                                              <span className="break-words">{p}</span>
                                              <Badge className="shrink-0 border-0 bg-blue-600 px-1.5 py-0 text-[10px] font-medium text-white hover:bg-blue-600">
                                                Đề xuất
                                              </Badge>
                                            </span>
                                          ) : (
                                            <span className="text-gray-800">• {p}</span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-amber-900">
                                {row.plantsMissing.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {row.plantsMissing.map((p, i) => (
                                      <li key={i}>{p}</li>
                                    ))}
                                  </ul>
                                ) : '—'}
                              </TableCell>
                              <TableCell>{row.maxSpeed || "—"}</TableCell>
                              <TableCell>
                                {row.notFoundInSystem ? (
                                  "—"
                                ) : row.bestMachineType ? (
                                  <span className="font-medium text-slate-800">{row.bestMachineType}</span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell>{row.resistanceRows?.toString() || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Download, Eye, Zap, Database } from "lucide-react";
import { PageHeader } from "@/app/components/ui/page-header";
import { TableCard } from "@/app/components/ui/table-card";
import { getPlantColor, getShortPlantName } from "@/app/lib/plant-colors";
import { parseCSV, type ImportResult } from "@/app/lib/csv-parser";
import { parseResistanceCSV, type ResistanceImportResult } from "@/app/lib/resistance-csv-parser";
import { previewMasterProductionExcel } from "@/app/lib/master-excel-preview";
import { previewResistanceExcel } from "@/app/lib/resistance-excel-preview";
import type { ValidationError } from "@/app/lib/csv-parser";
import {
  useImportMasterExcel,
  useImportResistanceExcel,
  useImportJobStatus,
  useResolveMasterImportConflicts,
} from "@/app/hooks/useMasterData";
import { toast } from "sonner";

type UploadType = "speed" | "resistance";

export function ImportBTPOrdersScreen() {
  const [uploadType, setUploadType] = useState<UploadType>("speed");
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | ResistanceImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importExcel = useImportMasterExcel();
  const importResistanceExcel = useImportResistanceExcel();
  const resolveConflicts = useResolveMasterImportConflicts();
  const [speedImportJobId, setSpeedImportJobId] = useState<number | null>(null);
  const { data: speedJobStatus } = useImportJobStatus(speedImportJobId, true);

  useEffect(() => {
    if (!speedJobStatus?.status) return;
    const st = speedJobStatus.status;
    if (st === "done") {
      toast.success(
        `Đã cập nhật production_capabilities: ${(speedJobStatus.success_rows ?? 0).toLocaleString()} dòng thành công.`
      );
      setSpeedImportJobId(null);
    } else if (st === "failed") {
      toast.error("Import tốc độ thất bại (xem import-jobs trên server).");
      setSpeedImportJobId(null);
    } else if (st === "partial_error") {
      toast.warning(
        `Import tốc độ xong một phần: ${(speedJobStatus.success_rows ?? 0).toLocaleString()} OK, còn lỗi — xem chi tiết job.`
      );
      setSpeedImportJobId(null);
    }
  }, [speedJobStatus?.status, speedJobStatus?.success_rows]);

  const onMasterImportResult = (res: { job_id: number; status: string }) => {
    setSpeedImportJobId(res.job_id);
    if (res.status === "awaiting_conflict_resolution") {
      toast.info("Có dòng trùng — chọn Ghi đè hoặc Bỏ qua bên dưới để ghi vào production_capabilities.");
    } else {
      toast.success(`Job #${res.job_id} đang xử lý → bảng production_capabilities…`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setShowPreview(false);
      setShowErrors(false);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const lower = file.name.toLowerCase();
      const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");
      const result = isExcel
        ? uploadType === "speed"
          ? previewMasterProductionExcel(await file.arrayBuffer())
          : previewResistanceExcel(await file.arrayBuffer())
        : uploadType === "speed"
          ? parseCSV(await file.text())
          : parseResistanceCSV(await file.text());
      setImportResult(result);
      setShowPreview(true);
      setShowErrors(result.errors.length > 0);
    } catch (error) {
      console.error('Error processing file:', error);
      const errorResult = uploadType === "speed" ? {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        records: [],
        errors: [{
          rowNumber: 0,
          field: 'File',
          value: '',
          error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        warnings: []
      } : {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        records: [],
        errors: [{
          rowNumber: 0,
          field: 'File',
          value: '',
          error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        warnings: []
      };
      setImportResult(errorResult);
      setShowErrors(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setShowPreview(false);
    setShowErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadTypeChange = (type: UploadType) => {
    setUploadType(type);
    handleReset();
  };

  const handleImport = async () => {
    if (!importResult || !file) return;
    if (importResult.validRows === 0) return;
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");
    if (isExcel) {
      try {
        if (uploadType === "speed") {
          const res = await importExcel.mutateAsync(file);
          onMasterImportResult(res);
        } else {
          const res = await importResistanceExcel.mutateAsync(file);
          toast.success(
            `Đã ghi resistance_measurements: ${res.inserted.toLocaleString()} dòng (bỏ qua ${res.skipped})`
          );
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Import thất bại");
      }
      return;
    }
    toast.info("CSV: dùng Process File để xem trước; nhập CSDL qua API đang bổ sung.");
  };

  const handleImportMasterExcelServer = async () => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast.error("Chỉ gửi được file Excel .xlsx / .xls lên API master-data/import");
      return;
    }
    try {
      const res = await importExcel.mutateAsync(file);
      onMasterImportResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import thất bại");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Master Data Setup"
        description="Import Production Capacity Master Data từ file Excel/CSV"
      />

      {/* Upload Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => handleUploadTypeChange("speed")}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            uploadType === "speed"
              ? "border-[#1e3a8a] bg-[#dbeafe] dark:bg-[#1e3a8a]/20"
              : "border-gray-200 dark:border-gray-700 hover:border-[#1e3a8a]/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${uploadType === "speed" ? "bg-[#1e3a8a]" : "bg-gray-200 dark:bg-gray-700"}`}>
              <Zap className={`h-5 w-5 ${uploadType === "speed" ? "text-white" : "text-gray-500"}`} />
            </div>
            <div className="text-left">
              <h3 className={`font-semibold text-sm ${uploadType === "speed" ? "text-[#1e3a8a] dark:text-[#3b82f6]" : ""}`}>
                Upload Tốc độ Máy
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Speed data, Output, Machine capacity
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleUploadTypeChange("resistance")}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            uploadType === "resistance"
              ? "border-[#8b5cf6] bg-[#f3e8ff] dark:bg-[#8b5cf6]/20"
              : "border-gray-200 dark:border-gray-700 hover:border-[#8b5cf6]/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${uploadType === "resistance" ? "bg-[#8b5cf6]" : "bg-gray-200 dark:bg-gray-700"}`}>
              <Database className={`h-5 w-5 ${uploadType === "resistance" ? "text-white" : "text-gray-500"}`} />
            </div>
            <div className="text-left">
              <h3 className={`font-semibold text-sm ${uploadType === "resistance" ? "text-[#8b5cf6]" : ""}`}>
                Upload Điện trở
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Resistance measurements for XOẮN process
              </p>
            </div>
          </div>
        </button>
      </div>

      {speedImportJobId && speedJobStatus && (
        <Card className="border-2 border-[#1e3a8a]/30 bg-[#dbeafe]/40 dark:bg-[#1e3a8a]/10">
          <CardHeader>
            <CardTitle className="text-base">
              Import tốc độ → bảng <code className="text-sm">production_capabilities</code>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Job #{speedJobStatus.job_id} ·{" "}
              <Badge variant="outline">{speedJobStatus.status}</Badge>
              {typeof speedJobStatus.success_rows === "number" && (
                <span> · Đã ghi: {speedJobStatus.success_rows.toLocaleString()}</span>
              )}
              {typeof speedJobStatus.conflict_rows === "number" && speedJobStatus.conflict_rows > 0 && (
                <span> · Trùng: {speedJobStatus.conflict_rows}</span>
              )}
            </p>
            {speedJobStatus.status === "awaiting_conflict_resolution" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={resolveConflicts.isPending}
                  onClick={() =>
                    speedImportJobId &&
                    resolveConflicts.mutate({ jobId: speedImportJobId, action: "overwrite" })
                  }
                >
                  Ghi đè dữ liệu cũ
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={resolveConflicts.isPending}
                  onClick={() =>
                    speedImportJobId &&
                    resolveConflicts.mutate({ jobId: speedImportJobId, action: "skip" })
                  }
                >
                  Giữ dữ liệu cũ (bỏ qua dòng trùng)
                </Button>
              </div>
            )}
            {(speedJobStatus.status === "processing" ||
              speedJobStatus.status === "validating" ||
              speedJobStatus.status === "uploaded") && (
              <p className="text-sm text-[#1e3a8a] animate-pulse">Đang ghi vào PostgreSQL…</p>
            )}
          </CardContent>
        </Card>
      )}

      {!importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">
                {uploadType === "speed" ? "Upload Tốc độ Máy File" : "Upload Điện trở File"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />

              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>

              {file && (
                <div className="mt-4 p-3 bg-[#dbeafe] dark:bg-[#1e3a8a]/20 rounded-lg border border-[#3b82f6]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#3b82f6]" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#1e3a8a] dark:text-[#3b82f6]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#1e3a8a] hover:bg-[#1e40af]"
                      onClick={handleProcessFile}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Process File'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#fffbeb] dark:bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-[#f59e0b] mb-1">Required Columns</p>
                  {uploadType === "speed" ? (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• Material Code, Material Description</li>
                      <li>• Design Speed, Actual Speed (m/p), Actual Speed (m/s)</li>
                      <li>• Output (km/shift), Output (kg/shift)</li>
                      <li>• Factory, Machine Type</li>
                    </ul>
                  ) : (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• File Excel: sheet tên <strong>DATA</strong> (Loại SP, Tiết diện, Kết cấu, Nhà máy, …)</li>
                      <li>• CSV: Material Code, observed_at, plant DN/LT/TA/BN, Loại SP, ca, điện trở</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                    <p className="text-2xl mt-1">{importResult.totalRows.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-[#3b82f6]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Records</p>
                    <p className="text-2xl mt-1 text-[#10b981]">{importResult.validRows.toLocaleString()}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-[#10b981]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Invalid Records</p>
                    <p className="text-2xl mt-1 text-[#ef4444]">{importResult.invalidRows.toLocaleString()}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-[#ef4444]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl mt-1">
                      {importResult.totalRows > 0
                        ? Math.round((importResult.validRows / importResult.totalRows) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Badge className={importResult.success ? "bg-[#10b981]" : "bg-[#f59e0b]"}>
                    {importResult.success ? "Ready" : "Has Errors"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {importResult.warnings.length > 0 && (
            <Card className="border-[#f59e0b]/30 bg-[#fffbeb] dark:bg-[#f59e0b]/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#f59e0b] mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#f59e0b] mb-2">Warnings</h4>
                    <ul className="text-sm space-y-1">
                      {importResult.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showErrors && importResult.errors.length > 0 && (
            <Card className="border-[#ef4444]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#ef4444]">
                    Validation Errors ({importResult.errors.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowErrors(!showErrors)}>
                    {showErrors ? 'Hide' : 'Show'} Errors
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead>No.</TableHead>
                        <TableHead>Row #</TableHead>
                        <TableHead>Material Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.slice(0, 100).map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono">{error.rowNumber}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {(error as ValidationError).materialCode?.trim() || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                            {(error as ValidationError).materialDescription?.trim() || "-"}
                          </TableCell>
                          <TableCell><Badge variant="outline">{error.field}</Badge></TableCell>
                          <TableCell className="font-mono text-muted-foreground max-w-xs truncate">
                            {error.value || '(empty)'}
                          </TableCell>
                          <TableCell className="text-[#ef4444]">{error.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {showPreview && importResult.records.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview - First 50 Records</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  {uploadType === "speed" ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead>Material Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Factory</TableHead>
                          <TableHead>Machine</TableHead>
                          <TableHead className="text-right">Speed (m/s)</TableHead>
                          <TableHead className="text-right">Output (kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(importResult.records as any[]).slice(0, 50).map((record: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{record.materialCode}</TableCell>
                            <TableCell>{record.materialDescription}</TableCell>
                            <TableCell><Badge variant="secondary">{record.factory}</Badge></TableCell>
                            <TableCell className="font-mono text-sm">{record.machineType}</TableCell>
                            <TableCell className="text-right font-mono">{record.actualSpeedMs.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{record.outputKgShift.toFixed(0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          <TableHead>Material Code</TableHead>
                          <TableHead>Thời điểm</TableHead>
                          <TableHead>NM</TableHead>
                          <TableHead>Loại SP</TableHead>
                          <TableHead className="text-right">Ca</TableHead>
                          <TableHead className="text-right">R Max</TableHead>
                          <TableHead className="text-right">R TT</TableHead>
                          <TableHead className="text-right">Tỷ lệ %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(importResult.records as any[]).slice(0, 50).map((record: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{record.materialCode}</TableCell>
                            <TableCell className="text-xs">{record.observedAt}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{record.plantCode}</Badge>
                            </TableCell>
                            <TableCell><Badge variant="outline">{record.loaiSp}</Badge></TableCell>
                            <TableCell className="text-right font-mono">{record.ca || '-'}</TableCell>
                            <TableCell className="text-right font-mono">{record.dienTroMax.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{record.dienTroTt.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{record.tyLeDienTroPct.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={handleReset}>Upload Another File</Button>
            <div className="flex flex-wrap gap-3">
              {uploadType === "speed" && file && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportMasterExcelServer}
                  disabled={importExcel.isPending}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {importExcel.isPending ? "Đang gửi…" : "Gửi Excel tốc độ (master-data/import)"}
                </Button>
              )}
              {uploadType === "resistance" && file && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!file) return;
                    const lower = file.name.toLowerCase();
                    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
                      toast.error("Điện trở: chỉ gửi file .xlsx / .xls lên API resistance/import");
                      return;
                    }
                    try {
                      const res = await importResistanceExcel.mutateAsync(file);
                      toast.success(
                        `Đã nhập: ${res.inserted.toLocaleString()} dòng (bỏ qua ${res.skipped})`
                      );
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Import thất bại");
                    }
                  }}
                  disabled={importResistanceExcel.isPending}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {importResistanceExcel.isPending
                    ? "Đang gửi…"
                    : "Gửi Excel điện trở (resistance/import)"}
                </Button>
              )}
              {importResult.validRows > 0 && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Valid
                </Button>
              )}
              <Button
                className="bg-[#10b981] hover:bg-[#10b981]/90"
                onClick={() => void handleImport()}
                disabled={
                  importResult.validRows === 0 ||
                  importExcel.isPending ||
                  importResistanceExcel.isPending ||
                  !!(file?.name.toLowerCase().endsWith(".csv"))
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {file?.name.toLowerCase().endsWith(".csv")
                  ? "Import CSV (chưa nối API)"
                  : `Nhập vào CSDL (${importResult.validRows.toLocaleString()} dòng)`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

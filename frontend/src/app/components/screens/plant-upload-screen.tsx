import { useEffect, useMemo, useState } from "react";
import { cn } from "@/app/components/ui/utils";
import { useBellRowFlash, type BellRowHighlightPayload } from "@/app/hooks/useBellRowFlash";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { PageHeader } from "@/app/components/ui/page-header";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Upload, FileDown, CheckCircle2, Clock, File, Loader2, Factory, AlertCircle } from "lucide-react";
import { usePlants } from "@/app/hooks/useMasterData";
import {
  useMissingSubmissionsList,
  downloadMissingTemplateXlsx,
  useSubmitMissingDataFile,
} from "@/app/hooks/useMissingSubmissions";
import { toast } from "sonner";
import { ApiError } from "@/app/api/http";
import { cadiviPlantLabel } from "@/app/lib/plant-colors";
import { useAuth } from "@/app/contexts/auth-context";
import { hasMesAdminLikeAccess } from "@/app/lib/mes-plant-nav";

function submissionBadge(status: string, jobStatus: string | null) {
  if (status === "pending_review")
    return { label: "Chờ duyệt", className: "bg-amber-100 text-amber-900 border-amber-200" };
  if (status === "rejected")
    return { label: "Từ chối", className: "bg-red-100 text-red-800 border-red-200" };
  if (status === "import_started") {
    const j = jobStatus ?? "";
    if (j === "done" || j === "partial_error")
      return { label: "Import xong", className: "bg-emerald-100 text-emerald-900 border-emerald-200" };
    if (j === "failed") return { label: "Import lỗi", className: "bg-red-100 text-red-800 border-red-200" };
    return { label: "Đang import", className: "bg-blue-100 text-blue-900 border-blue-200" };
  }
  return { label: status, className: "bg-slate-100 text-slate-800" };
}

export interface PlantUploadScreenProps {
  bellRowHighlight?: BellRowHighlightPayload | null;
  onBellRowHighlightConsumed?: () => void;
}

export function PlantUploadScreen({
  bellRowHighlight = null,
  onBellRowHighlightConsumed,
}: PlantUploadScreenProps) {
  const flashIds = useBellRowFlash(bellRowHighlight ?? undefined, onBellRowHighlightConsumed);
  const { user } = useAuth();
  const fullAccess = hasMesAdminLikeAccess(user ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [plantIdStr, setPlantIdStr] = useState<string>("");
  const [note, setNote] = useState("");
  const { data: plants, isLoading: plantsLoading } = usePlants();

  const userPlantId = useMemo(() => {
    if (fullAccess || !user?.plant_code?.trim() || !plants?.length) return null;
    const code = user.plant_code.trim().toUpperCase();
    const p = plants.find((x) => x.code.trim().toUpperCase() === code);
    return p?.id ?? null;
  }, [fullAccess, user, plants]);

  const plantPortalMissingCode = !fullAccess && !user?.plant_code?.trim();
  const plantScopeUnknown = !fullAccess && Boolean(user?.plant_code?.trim()) && userPlantId == null;
  const plantSelectLocked = !fullAccess && userPlantId != null;

  useEffect(() => {
    if (!plantSelectLocked || userPlantId == null) return;
    setPlantIdStr(String(userPlantId));
  }, [plantSelectLocked, userPlantId]);

  const plantId = plantIdStr ? parseInt(plantIdStr, 10) : NaN;
  const plantValid = Number.isFinite(plantId) && plantId > 0;

  const { data: subsData, isLoading: subsLoading } = useMissingSubmissionsList({
    plantId: plantValid ? plantId : null,
    page: 1,
    enabled: plantValid,
  });
  const submitMutation = useSubmitMissingDataFile();

  const [templateLoading, setTemplateLoading] = useState(false);

  async function onDownloadTemplate() {
    if (!plantValid) {
      toast.error("Chọn nhà máy trước khi tải template.");
      return;
    }
    setTemplateLoading(true);
    try {
      await downloadMissingTemplateXlsx(plantId);
      toast.success("Đã tải file Excel mẫu (theo báo cáo thiếu của nhà máy).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được template.");
    } finally {
      setTemplateLoading(false);
    }
  }

  async function uploadFile(file: File) {
    if (!plantValid) {
      toast.error("Chọn nhà máy trước khi gửi file.");
      return;
    }
    try {
      const res = await submitMutation.mutateAsync({
        plantId,
        file,
        note: note.trim() || undefined,
      });
      toast.success(
        res.public_ref ? `${res.message} Mã bài nộp: ${res.public_ref}.` : res.message
      );
      setNote("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Upload thất bại");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Plant Upload Portal"
        description="Bước 1: Tải template theo danh sách thiếu dữ liệu. Bước 2: Gửi file đã điền — chờ chuyên viên duyệt tại Approval Dashboard, sau đó hệ thống mới import vào CSDL."
      />

      {plantScopeUnknown ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Mã nhà máy <span className="font-mono font-medium">{user?.plant_code}</span> không khớp danh mục NM. Liên hệ
          quản trị — bạn vẫn có thể chọn nhà máy thủ công nếu được hướng dẫn.
        </div>
      ) : plantPortalMissingCode ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Tài khoản nhà máy cần có mã NM (plant_code) để hệ thống gán đúng phạm vi gửi file. Liên hệ quản trị.
        </div>
      ) : plantSelectLocked ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
          Nhà máy đã gán theo tài khoản — chỉ gửi file và template cho nhà máy của bạn.
        </div>
      ) : null}

      <Card className="border-blue-100 bg-blue-50/40">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Nhà máy</Label>
              <Select
                value={plantIdStr}
                onValueChange={setPlantIdStr}
                disabled={plantsLoading || plantSelectLocked}
              >
                <SelectTrigger className="w-full sm:max-w-md bg-white">
                  <Factory className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder={plantsLoading ? "Đang tải…" : "Chọn nhà máy của bạn"} />
                </SelectTrigger>
                <SelectContent>
                  {plants?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {cadiviPlantLabel(p.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!plantValid && (
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Chọn nhà máy để tải template và gửi file.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bước 1 — Tải template thiếu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              File Excel gồm các sheet chuẩn CADIVI (Kéo / Xoắn / Giáp / Bọc), đã điền sẵn{" "}
              <strong>Material Code</strong>, <strong>mô tả</strong> và <strong>Factory</strong> theo đúng các báo
              cáo &quot;thiếu năng lực&quot; đang mở cho nhà máy bạn. Bạn chỉ cần bổ sung tốc độ, sản lượng và loại
              máy theo từng dòng (xem sheet <code className="text-xs bg-muted px-1 rounded">_HUONG_DAN</code>).
            </p>
            <Button
              type="button"
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af]"
              disabled={!plantValid || templateLoading}
              onClick={() => void onDownloadTemplate()}
            >
              {templateLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Tải template Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bước 2 — Gửi file đã hoàn chỉnh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submitter-note">Ghi chú (tùy chọn)</Label>
              <Input
                id="submitter-note"
                placeholder="VD: Bổ sung đợt 1 — tuần 15/2026"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-[#3b82f6] bg-[#dbeafe] dark:bg-[#1e3a8a]/20" : "border-gray-300 dark:border-gray-700"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) await uploadFile(f);
              }}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Kéo thả file .xlsx / .xls vào đây</p>
              <p className="text-xs text-muted-foreground mb-3">hoặc</p>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                id="plant-upload-file"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await uploadFile(f);
                  e.target.value = "";
                }}
              />
              <label htmlFor="plant-upload-file">
                <Button variant="outline" asChild disabled={!plantValid || submitMutation.isPending}>
                  <span>Chọn file</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-3">Tối đa 50MB. File sẽ ở trạng thái chờ duyệt.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử gửi (nhà máy đã chọn)</CardTitle>
        </CardHeader>
        <CardContent>
          {!plantValid ? (
            <p className="text-sm text-muted-foreground">Chọn nhà máy để xem lịch sử.</p>
          ) : subsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : (subsData?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có lần gửi nào.</p>
          ) : (
            <div className="space-y-3">
              {subsData!.items.map((item) => {
                const b = submissionBadge(item.status, item.import_job_status);
                return (
                  <div
                    key={item.id}
                    id={`mes-submission-row-${item.id}`}
                    className={cn(
                      "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4",
                      flashIds.has(item.id) && "mes-bell-new-row-flash"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <File
                        className={`mt-0.5 h-5 w-5 shrink-0 ${item.status === "rejected" ? "text-red-600" : "text-[#10b981]"}`}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-medium">{item.original_filename}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.public_ref}</p>
                        <p className="text-xs text-muted-foreground">
                          Gửi: {new Date(item.created_at).toLocaleString("vi-VN")}
                          {item.import_job_ref != null && (
                            <span className="ml-2 font-mono">{item.import_job_ref}</span>
                          )}
                        </p>
                        {item.status === "rejected" ? (
                          <div className="pt-1 text-sm leading-snug text-foreground">
                            <p>
                              <span className="font-semibold text-red-800 dark:text-red-200">Chức danh: </span>
                              {item.reviewer_label?.trim() ? item.reviewer_label : "—"}
                              {item.reviewer_access_label ? (
                                <span className="text-muted-foreground"> · {item.reviewer_access_label}</span>
                              ) : null}
                              {item.reviewer_mes_username?.trim() ? (
                                <>
                                  <span className="text-muted-foreground"> · </span>
                                  <span className="font-mono text-xs">{item.reviewer_mes_username}</span>
                                </>
                              ) : null}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              <span className="font-semibold text-red-800 dark:text-red-200">Lý do: </span>
                              <span className="whitespace-pre-wrap break-words text-foreground">
                                {item.rejection_reason?.trim() ? item.rejection_reason : "—"}
                              </span>
                              <span className="mx-2 text-muted-foreground/80">|</span>
                              <span className="font-semibold text-red-800 dark:text-red-200">Thời gian: </span>
                              {item.reviewed_at
                                ? new Date(item.reviewed_at).toLocaleString("vi-VN")
                                : "—"}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 self-start">
                      <Badge variant="outline" className={b.className}>
                        {item.status === "pending_review" && <Clock className="h-3 w-3 mr-1" />}
                        {(item.status === "import_started" &&
                          (item.import_job_status === "done" || item.import_job_status === "partial_error")) && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {b.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

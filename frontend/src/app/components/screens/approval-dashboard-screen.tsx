import { useMemo, useState } from "react";
import { cn } from "@/app/components/ui/utils";
import { useBellRowFlash, type BellRowHighlightPayload } from "@/app/hooks/useBellRowFlash";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { PageHeader } from "@/app/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Eye, FileText, Loader2, FileDown } from "lucide-react";
import {
  useMissingSubmissionsList,
  useApproveMissingSubmission,
  useRejectMissingSubmission,
  downloadMissingSubmissionFile,
} from "@/app/hooks/useMissingSubmissions";
import { cadiviPlantLabel } from "@/app/lib/plant-colors";
import type { MissingSubmissionItem } from "@/app/api/types";
import { toast } from "sonner";
import { ApiError } from "@/app/api/http";

function isPending(item: MissingSubmissionItem) {
  return item.status === "pending_review";
}

function isActiveImport(item: MissingSubmissionItem) {
  if (item.status !== "import_started") return false;
  const j = item.import_job_status ?? "";
  return j !== "done" && j !== "partial_error" && j !== "failed";
}

export interface ApprovalDashboardScreenProps {
  bellRowHighlight?: BellRowHighlightPayload | null;
  onBellRowHighlightConsumed?: () => void;
}

export function ApprovalDashboardScreen({
  bellRowHighlight = null,
  onBellRowHighlightConsumed,
}: ApprovalDashboardScreenProps) {
  const flashIds = useBellRowFlash(bellRowHighlight ?? undefined, onBellRowHighlightConsumed);
  const { data, isLoading, refetch } = useMissingSubmissionsList({ plantId: null, page: 1 });
  const approveMut = useApproveMissingSubmission();
  const rejectMut = useRejectMissingSubmission();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<MissingSubmissionItem | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("Chuyên viên");
  const [rejectReason, setRejectReason] = useState("");
  const [fileDlBusy, setFileDlBusy] = useState(false);

  const items = data?.items ?? [];

  const kpi = useMemo(() => {
    const pending = items.filter(isPending).length;
    const reviewing = items.filter(isActiveImport).length;
    return { pending, reviewing, total: items.length };
  }, [items]);

  function openReview(row: MissingSubmissionItem) {
    setSelected(row);
    setReviewOpen(true);
  }

  async function onDownloadSubmittedFile() {
    if (!selected) return;
    setFileDlBusy(true);
    try {
      await downloadMissingSubmissionFile(selected.id, selected.original_filename);
      toast.success("Đã tải file nhà máy đã gửi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được file.");
    } finally {
      setFileDlBusy(false);
    }
  }

  async function onApprove() {
    if (!selected) return;
    const name = reviewerName.trim();
    if (!name) {
      toast.error("Nhập tên người duyệt.");
      return;
    }
    try {
      const out = await approveMut.mutateAsync({ id: selected.id, reviewer_label: name });
      toast.success(out.message);
      setApproveOpen(false);
      setReviewOpen(false);
      setSelected(null);
      void refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Duyệt thất bại");
    }
  }

  async function onReject() {
    if (!selected) return;
    const name = reviewerName.trim();
    const reason = rejectReason.trim();
    if (!name || !reason) {
      toast.error("Nhập tên người duyệt và lý do từ chối.");
      return;
    }
    try {
      await rejectMut.mutateAsync({ id: selected.id, reviewer_label: name, reason });
      toast.success("Đã từ chối bài nộp.");
      setRejectOpen(false);
      setReviewOpen(false);
      setRejectReason("");
      setSelected(null);
      void refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Từ chối thất bại");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Approval Dashboard"
        description="Danh sách file bổ sung dữ liệu thiếu từ Plant Upload Portal. Chỉ sau khi chấp nhận, hệ thống mới chạy import (cùng luồng kiểm tra/xung đột như import master-data)."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl mt-1 text-amber-600 tabular-nums">
                  {isLoading ? "…" : kpi.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang xử lý import</p>
                <p className="text-2xl mt-1 text-blue-600 tabular-nums">
                  {isLoading ? "…" : kpi.reviewing}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng bài nộp (trang này)</p>
                <p className="text-2xl mt-1 tabular-nums">{isLoading ? "…" : kpi.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hàng chờ phê duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead>Mã bài nộp</TableHead>
                  <TableHead>Nhà máy</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Gửi lúc</TableHead>
                  <TableHead className="text-center">Gợi ý dòng template</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mã import (job)</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      Đang tải…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Chưa có bài nộp nào.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      id={`mes-submission-row-${item.id}`}
                      className={cn(flashIds.has(item.id) && "mes-bell-new-row-flash")}
                    >
                      <TableCell className="font-mono text-xs max-w-[200px]">
                        <span className="font-semibold text-foreground block truncate" title={item.public_ref}>
                          {item.public_ref}
                        </span>
                        <span className="text-muted-foreground text-[10px]">id nội bộ #{item.id}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cadiviPlantLabel(item.plant_name)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate" title={item.original_filename}>
                        {item.original_filename}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-center text-sm">{item.template_row_hint}</TableCell>
                      <TableCell>
                        {item.status === "pending_review" && (
                          <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Chờ duyệt</Badge>
                        )}
                        {item.status === "rejected" && (
                          <Badge variant="destructive">Từ chối</Badge>
                        )}
                        {item.status === "import_started" && (
                          <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-100">
                            {item.import_job_status ?? "import"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[160px]">
                        {item.import_job_ref != null ? (
                          <span className="block truncate" title={item.import_job_ref}>
                            {item.import_job_ref}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button variant="outline" size="sm" type="button" onClick={() => openReview(item)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Chi tiết
                          </Button>
                          {isPending(item) && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                type="button"
                                onClick={() => {
                                  setSelected(item);
                                  setApproveOpen(true);
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Chấp nhận
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                type="button"
                                onClick={() => {
                                  setSelected(item);
                                  setRejectOpen(true);
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Từ chối
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết — {selected?.public_ref ?? "…"}</DialogTitle>
            <DialogDescription>
              Mã bài nộp gồm ngày (VN) + nhà máy + số thứ tự CSDL. Sau khi chấp nhận, hệ thống tạo import job (mã{" "}
              <span className="font-mono">IMP-…</span>) và áp dụng cùng quy tắc import năng lực.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p className="font-mono text-xs bg-muted/60 rounded px-2 py-1 break-all">{selected.public_ref}</p>
              <p>
                <span className="text-muted-foreground">Nhà máy:</span>{" "}
                {cadiviPlantLabel(selected.plant_name)}
              </p>
              <p>
                <span className="text-muted-foreground">File:</span> {selected.original_filename}
              </p>
              {selected.import_job_ref != null && (
                <p>
                  <span className="text-muted-foreground">Mã import job:</span>{" "}
                  <span className="font-mono text-xs">{selected.import_job_ref}</span>
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Ghi chú NM:</span>{" "}
                {selected.submitter_note ?? "—"}
              </p>
              {selected.status === "rejected" && (
                <p className="text-red-700">
                  <span className="font-medium">Lý do từ chối:</span> {selected.rejection_reason ?? "—"}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between sm:space-x-0">
            <Button
              type="button"
              variant="secondary"
              disabled={!selected || fileDlBusy}
              onClick={() => void onDownloadSubmittedFile()}
            >
              {fileDlBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
              Tải file nhà máy đã gửi
            </Button>
            <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chấp nhận và import</DialogTitle>
            <DialogDescription>
              Xác nhận nội dung file đã đúng. Hệ thống sẽ chạy kiểm tra Excel và import (có thể cần xử lý xung đột
              như màn Import master).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Người duyệt</label>
            <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setApproveOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={approveMut.isPending}
              onClick={() => void onApprove()}
            >
              {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận chấp nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối bài nộp</DialogTitle>
            <DialogDescription>Nhà máy sẽ không thể tự import; cần gửi lại file sau khi chỉnh sửa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Người duyệt</label>
              <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Thiếu cột Machine Type / sai đơn vị tốc độ…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" disabled={rejectMut.isPending} onClick={() => void onReject()}>
              {rejectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

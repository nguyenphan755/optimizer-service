import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiUpload, resolveApiBaseUrl } from "@/app/api/http";
import type { MissingSubmissionListResponse } from "@/app/api/types";

const BASE = "/api/v1/missing-data/submissions";

export function useMissingSubmissionsList(params: {
  plantId: number | null;
  page?: number;
  limit?: number;
  status?: "pending_review" | "rejected" | "import_started";
  /** Mặc định true; đặt false để không gọi API (ví dụ chưa chọn nhà máy trên Plant Portal). */
  enabled?: boolean;
  /** Làm mới định kỳ (ms), vd. 25000 cho chuông chờ duyệt. */
  refetchInterval?: number | false;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const plantId = params.plantId;
  const status = params.status;
  const enabled = params.enabled !== false;
  const refetchInterval = params.refetchInterval ?? false;
  return useQuery({
    queryKey: ["missing-data", "submissions", plantId ?? "all", page, limit, status ?? "any"],
    enabled,
    refetchInterval,
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (plantId !== null) p.set("plant_id", String(plantId));
      if (status) p.set("status", status);
      return apiJson<MissingSubmissionListResponse>(`${BASE}?${p.toString()}`);
    },
  });
}

export async function downloadMissingSubmissionFile(submissionId: number, originalFilename: string): Promise<void> {
  const url = `${resolveApiBaseUrl()}/api/v1/missing-data/submissions/${submissionId}/file`;
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(t) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = originalFilename || `submission_${submissionId}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadMissingTemplateXlsx(plantId: number): Promise<void> {
  const url = `${resolveApiBaseUrl()}/api/v1/missing-data/submissions/template?plant_id=${plantId}`;
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text();
    let msg = res.statusText;
    try {
      const j = JSON.parse(t) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `missing_data_template_plant_${plantId}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function useSubmitMissingDataFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { plantId: number; file: File; note?: string }) => {
      const fd = new FormData();
      fd.append("plant_id", String(params.plantId));
      fd.append("file", params.file);
      if (params.note?.trim()) fd.append("submitter_note", params.note.trim());
      return apiUpload<{
        ok: boolean;
        id: number;
        public_ref: string;
        status: string;
        message: string;
      }>(BASE, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data", "submissions"] });
    },
  });
}

export function useApproveMissingSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: number; reviewer_label: string }) =>
      apiJson<{
        ok: boolean;
        submission_id: number;
        import_job_id: number;
        import_status: string;
        total_rows: number;
        error_rows: number;
        conflict_rows: number;
        message: string;
      }>(`${BASE}/${params.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ reviewer_label: params.reviewer_label }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data", "submissions"] });
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
    },
  });
}

export function useRejectMissingSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: number; reviewer_label: string; reason: string }) =>
      apiJson<{ ok: boolean; id: number; status: string }>(`${BASE}/${params.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          reviewer_label: params.reviewer_label,
          reason: params.reason,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data", "submissions"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/app/api/http";
import type {
  MissingDataListResponse,
  MissingDataSummaryResponse,
  ReportMissingCapabilityResponse,
} from "@/app/api/types";

const BASE = "/api/v1/missing-data";

export function useMissingDataSummary() {
  return useQuery({
    queryKey: ["missing-data", "summary"],
    queryFn: () => apiJson<MissingDataSummaryResponse>(`${BASE}/summary`),
  });
}

export function useMissingDataList(params: {
  plantId: number | null;
  q: string;
  page: number;
  /** Tắt query (vd. user nhà máy chưa khớp plant_code với master). */
  enabled?: boolean;
}) {
  const { plantId, q, page, enabled = true } = params;
  return useQuery({
    queryKey: ["missing-data", plantId, q, page],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: "50" });
      if (plantId !== null) p.set("plant_id", String(plantId));
      if (q.trim()) p.set("q", q.trim());
      return apiJson<MissingDataListResponse>(`${BASE}/?${p.toString()}`);
    },
    enabled,
  });
}

export function useReportMissingCapability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { material_id: number; plant_id: number; note?: string }) =>
      apiJson<ReportMissingCapabilityResponse>(`${BASE}/`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data"] });
      qc.invalidateQueries({ queryKey: ["missing-data", "submissions"] });
    },
  });
}

export function useDeleteMissingReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiJson<{ ok: boolean; deleted: number }>(`${BASE}/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data"] });
    },
  });
}

export function useBulkDeleteMissingReports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      apiJson<{ ok: boolean; deleted: number }>(`${BASE}/reports/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missing-data"] });
    },
  });
}

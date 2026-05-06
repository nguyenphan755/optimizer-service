import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson, apiUpload } from "@/app/api/http";
import type {
  MasterImportResponse,
  ResistanceImportApiResponse,
  ImportJobStatusResponse,
} from "@/app/api/types";

const PREFIX = "/api/v1/master-data";

export function usePlants() {
  return useQuery({
    queryKey: ["master-data", "plants"],
    queryFn: () =>
      apiJson<Array<{ id: number; code: string; name: string }>>(`${PREFIX}/plants`),
  });
}

export function useProcessSteps() {
  return useQuery({
    queryKey: ["master-data", "process-steps"],
    queryFn: () =>
      apiJson<
        Array<{ id: number; code: string; name: string; sheet_name: string }>
      >(`${PREFIX}/process-steps`),
  });
}

export function useImportMasterExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<MasterImportResponse>(`${PREFIX}/import`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["master-data"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useResolveMasterImportConflicts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jobId,
      action,
    }: {
      jobId: number;
      action: "overwrite" | "skip";
    }) =>
      apiJson<{ job_id: number; status: string }>(
        `${PREFIX}/import/${jobId}/resolve-conflicts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["master-data", "import-status", variables.jobId],
      });
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["master-data"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

const RES_PREFIX = "/api/v1/resistance";

export function useImportResistanceExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<ResistanceImportApiResponse>(`${RES_PREFIX}/import`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useImportJobStatus(jobId: number | null, pollWhileActive = false) {
  return useQuery({
    queryKey: ["master-data", "import-status", jobId],
    queryFn: () =>
      apiJson<ImportJobStatusResponse>(`${PREFIX}/import/${jobId}/status`),
    enabled: jobId !== null && jobId > 0,
    refetchInterval: (q) => {
      if (!pollWhileActive || !jobId) return false;
      const s = q.state.data?.status;
      if (!s) return 2000;
      if (s === "awaiting_conflict_resolution") return false;
      if (s === "done" || s === "failed" || s === "partial_error") return false;
      return 2000;
    },
  });
}

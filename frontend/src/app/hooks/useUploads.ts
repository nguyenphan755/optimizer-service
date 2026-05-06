import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/app/api/http";
import type { ImportJobItem } from "@/app/api/types";

export function useImportJobsList(params: { page?: number; status?: string | null }) {
  const page = params.page ?? 1;
  const status = params.status ?? null;
  return useQuery({
    queryKey: ["import-jobs", page, status],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: "50" });
      if (status) p.set("status", status);
      return apiJson<{
        items: ImportJobItem[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/v1/import-jobs/?${p.toString()}`);
    },
  });
}

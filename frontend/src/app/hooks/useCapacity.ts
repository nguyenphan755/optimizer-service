import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/app/api/http";
import type { AutocompleteItem, CapabilityResponse } from "@/app/api/types";

const SEARCH = "/api/v1/search";
const LEGACY = "/api/v1/master-data";

export type AutocompleteSortParam = "relevance" | "best_speed" | "best_output";

export function useSearchAutocomplete(
  q: string,
  step: string | null,
  sort: AutocompleteSortParam = "relevance"
) {
  const enabled = q.trim().length >= 2;
  return useQuery({
    queryKey: ["search", "autocomplete", q, step, sort],
    queryFn: async () => {
      const p = new URLSearchParams({ q: q.trim(), limit: "15" });
      if (step && step !== "all") p.set("step", step);
      if (sort !== "relevance") p.set("sort", sort);
      return apiJson<AutocompleteItem[]>(`${SEARCH}/autocomplete?${p.toString()}`);
    },
    enabled,
  });
}

export type CapabilityRankByParam = "speed" | "output";

export function useMaterialCapability(
  materialId: number | null,
  options?: { rankBy?: CapabilityRankByParam }
) {
  const rankBy = options?.rankBy ?? "speed";
  return useQuery({
    queryKey: ["search", "capability", materialId, rankBy],
    queryFn: () =>
      apiJson<CapabilityResponse>(
        `${SEARCH}/material/${materialId}/capability${rankBy === "output" ? "?rank_by=output" : ""}`
      ),
    enabled: materialId !== null && materialId > 0,
  });
}

/** Tra cứu đúng 8 chữ số — dùng khi không chọn từ gợi ý */
export function useCapabilityLookupByCode(materialCode: string | null) {
  const ok = materialCode !== null && /^\d{8}$/.test(materialCode);
  return useQuery({
    queryKey: ["master-data", "capability-lookup", materialCode],
    queryFn: () =>
      apiJson<{
        found: boolean;
        matches: Array<{ material_id: number; material_code: string }>;
      }>(`${LEGACY}/capability/lookup?material_code=${materialCode}`),
    enabled: ok,
  });
}


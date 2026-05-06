import { useQuery } from "@tanstack/react-query";
import { apiJson } from "@/app/api/http";
import type {
  DashboardOverviewResponse,
  DashboardPlantDetailResponse,
  DashboardCapacityReportResponse,
} from "@/app/api/types";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiJson<DashboardOverviewResponse>("/api/v1/dashboard/overview"),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDashboardPlantDetail(plantQuery: string) {
  const q = plantQuery.trim();
  return useQuery({
    queryKey: ["dashboard", "plant-detail", q],
    enabled: q.length > 0,
    queryFn: () =>
      apiJson<DashboardPlantDetailResponse>(
        `/api/v1/dashboard/plant-detail?plant=${encodeURIComponent(q)}`
      ),
  });
}

export function useDashboardCapacityReport() {
  return useQuery({
    queryKey: ["dashboard", "capacity-report"],
    queryFn: () => apiJson<DashboardCapacityReportResponse>("/api/v1/dashboard/capacity-report"),
  });
}

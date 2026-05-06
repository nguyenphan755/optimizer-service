import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export function useCapability(materialId: number | null) {
  return useQuery({
    queryKey: ['capability', materialId],
    queryFn: () => searchApi.getCapability(materialId!),
    enabled: materialId !== null,
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export function useResistance(
  materialId: number | null,
  opts: { enabled: boolean; loaiSp?: 'Ccc' | 'Acc' }
) {
  const { enabled, loaiSp } = opts;
  return useQuery({
    queryKey: ['resistance', materialId, loaiSp ?? 'all'],
    queryFn: () => searchApi.getResistanceForMaterial(materialId!, loaiSp),
    enabled: enabled && materialId !== null,
    staleTime: 60_000,
  });
}

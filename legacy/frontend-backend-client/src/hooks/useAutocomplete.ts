import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import { useDebouncedValue } from './useDebouncedValue';

export function useAutocomplete(q: string, step?: string) {
  const dq = useDebouncedValue(q, 300);
  return useQuery({
    queryKey: ['autocomplete', dq, step],
    queryFn: () => searchApi.autocomplete(dq, step),
    enabled: dq.length >= 2,
    staleTime: 30_000,
    placeholderData: [],
  });
}

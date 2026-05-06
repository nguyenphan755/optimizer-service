import axios from 'axios';
import type {
  MaterialSuggestion,
  CapabilityResult,
  FilterOptions,
  MissingPlantsResponse,
  FlagMissingCapabilityResponse,
  ResistanceForMaterialResponse,
  BulkCapabilityResult,
} from '../types/search';

/**
 * Base URL cho axios — tính **mỗi request** (đúng khi mở UI qua IP Tailscale).
 * - Để trống `VITE_API_URL` → relative `/api` qua proxy Vite (khuyến nghị dev).
 * - Nếu set `VITE_API_URL=http://localhost:PORT` nhưng đang mở `http://100.x.x.x:5100`,
 *   bỏ qua env và dùng `hostname hiện tại + VITE_API_PORT` (tránh gọi localhost trên máy client).
 */
function resolveApiBaseURL(): string {
  const raw = import.meta.env.VITE_API_URL;
  const apiPort = import.meta.env.VITE_API_PORT || '3000';

  if (typeof window === 'undefined') {
    return typeof raw === 'string' && raw.length > 0 ? raw : '';
  }

  const hostname = window.location.hostname;
  const isPageLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (typeof raw === 'string' && raw.length > 0) {
    const envLooksLocal = /localhost|127\.0\.0\.1/i.test(raw);
    if (envLooksLocal && !isPageLocal) {
      const base = `${window.location.protocol}//${hostname}:${apiPort}`;
      console.warn(
        '[searchApi] VITE_API_URL trỏ localhost nhưng đang mở từ host khác — dùng:',
        base
      );
      return base;
    }
    return raw;
  }

  return '';
}

const api = axios.create({
  baseURL: '',
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseURL();
  return config;
});

export const searchApi = {
  autocomplete: (q: string, step?: string) =>
    api
      .get<MaterialSuggestion[]>('/api/v1/search/autocomplete', {
        params: { q, step, limit: 15 },
      })
      .then((r) => r.data),

  getCapability: (materialId: number) =>
    api
      .get<CapabilityResult>(`/api/v1/search/material/${materialId}/capability`)
      .then((r) => r.data),

  getFilters: () =>
    api.get<FilterOptions>('/api/v1/search/filters').then((r) => r.data),

  getMissingPlants: (materialId: number) =>
    api
      .get<MissingPlantsResponse>(`/api/v1/search/material/${materialId}/missing-plants`)
      .then((r) => r.data),

  getResistanceForMaterial: (materialId: number, loaiSp?: 'Ccc' | 'Acc') =>
    api
      .get<ResistanceForMaterialResponse>(`/api/v1/resistance/for-material/${materialId}`, {
        params: loaiSp ? { loai_sp: loaiSp } : {},
      })
      .then((r) => r.data),

  flagMissingCapability: (body: {
    material_id: number;
    plant_id: number;
    note?: string;
  }) =>
    api
      .post<FlagMissingCapabilityResponse>('/api/v1/missing-data', body)
      .then((r) => r.data),

  bulkCapability: (
    items: { material_code: string; description_file?: string | null }[]
  ) =>
    api
      .post<BulkCapabilityResult>('/api/v1/search/bulk-capability', { items })
      .then((r) => r.data),
};

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { searchApi } from '../api/searchApi';
import type { PlantResult } from '../types/search';

export function NoDataPlantCard({
  plant,
  materialId,
}: {
  plant: PlantResult;
  materialId: number;
}) {
  const [lastCount, setLastCount] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      searchApi.flagMissingCapability({
        material_id: materialId,
        plant_id: plant.plant_id,
      }),
    onSuccess: (data) => setLastCount(data.report_count),
  });

  const errMsg = mutation.isError
    ? axios.isAxiosError(mutation.error)
      ? (mutation.error.response?.data as { error?: string } | undefined)?.error ??
        mutation.error.message
      : 'Không gửi được. Thử lại sau.'
    : null;

  return (
    <div className="bg-gray-50 border-[1.5px] border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px]">
      <svg
        className="w-8 h-8 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth="1.5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"
        />
        <text
          x="16"
          y="11"
          fill="currentColor"
          fontSize="8"
          fontWeight="bold"
          className="select-none"
        >
          ?
        </text>
      </svg>
      <p className="font-medium text-gray-500 mt-2">{plant.plant_name}</p>
      <p className="text-sm text-gray-400">Chưa có dữ liệu</p>

      {lastCount !== null && (
        <p className="text-xs text-green-700 mt-2 font-medium text-center">
          Đã ghi nhận thiếu data
          {lastCount > 1 ? ` · ${lastCount} lần báo` : ''}
        </p>
      )}

      {errMsg && <p className="text-xs text-red-600 mt-2 text-center max-w-[220px]">{errMsg}</p>}

      <button
        type="button"
        disabled={mutation.isPending}
        className="mt-3 text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending
          ? 'Đang gửi…'
          : lastCount !== null
            ? 'Ghi nhận thêm lần nữa'
            : 'Đánh dấu thiếu data'}
      </button>
    </div>
  );
}

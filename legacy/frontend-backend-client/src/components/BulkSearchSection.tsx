import { useRef, useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { searchApi } from '../api/searchApi';
import type { BulkCapabilityRow } from '../types/search';
import { parseMaterialExcel, MAX_FILE_ROWS } from '../utils/parseMaterialExcel';

type FilterMode = 'all' | 'errors' | 'missing_plants';

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function resistanceCell(r: BulkCapabilityRow): string {
  if (!r.material || r.material.process_step_code !== 'XOAN') return '—';
  if (!r.resistance) return '—';
  if (!r.resistance.parse_ok) return r.resistance.message ?? 'Không parse được';
  return String(r.resistance.row_count ?? 0);
}

function filterRows(rows: BulkCapabilityRow[], mode: FilterMode): BulkCapabilityRow[] {
  if (mode === 'errors') return rows.filter((r) => !r.found);
  if (mode === 'missing_plants') {
    return rows.filter((r) => r.found && r.summary && r.summary.plants_without_data > 0);
  }
  return rows;
}

function toCsv(rows: BulkCapabilityRow[]): string {
  const h = [
    'Material',
    'Mo ta file',
    'Mo ta he thong',
    'Cong doan',
    'NM co data',
    'NM thieu',
    'Toc do tot nhat',
    'Dien tro dong',
  ];
  const lines = [h.join(',')];
  for (const r of rows) {
    const cells = [
      r.material_code,
      r.description_file ?? '',
      r.material?.material_description ?? '',
      r.material?.process_step_name ?? '',
      r.summary ? String(r.summary.plants_with_data) : '',
      r.summary ? String(r.summary.plants_without_data) : '',
      r.summary ? String(r.summary.best_actual_speed ?? '') : '',
      resistanceCell(r).replace(/\r?\n/g, ' '),
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export function BulkSearchSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseStats, setParseStats] = useState<{ data_rows: number; distinct_codes: number } | null>(
    null
  );
  const [pendingItems, setPendingItems] = useState<
    { material_code: string; description_file: string | null }[] | null
  >(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [parseError, setParseError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (items: { material_code: string; description_file: string | null }[]) =>
      searchApi.bulkCapability(items),
  });

  const displayedRows = useMemo(() => {
    if (!mutation.data?.rows) return [];
    return filterRows(mutation.data.rows, filter);
  }, [mutation.data?.rows, filter]);

  function onPickFile() {
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParseError(null);
    setFileName(file.name);
    setPendingItems(null);
    mutation.reset();

    try {
      const buf = await file.arrayBuffer();
      const { items, stats } = parseMaterialExcel(buf);
      setParseStats(stats);
      setPendingItems(items);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Không đọc được file.');
      setParseStats(null);
      setPendingItems(null);
    }
  }

  function runSearch() {
    if (!pendingItems?.length) return;
    mutation.mutate(pendingItems);
  }

  function exportCsv() {
    const blob = new Blob([toCsv(displayedRows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bulk-capability-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Tra cứu theo file Excel</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sheet đầu tiên, tối đa <strong>{MAX_FILE_ROWS.toLocaleString('vi-VN')}</strong> dòng dữ liệu.
          Cột bắt buộc: <strong>Material</strong>. Cột mô tả (tuỳ chọn) — hệ thống tra cứu{' '}
          <strong>theo mã</strong>; các dòng trùng mã được gom lại một lần.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={onPickFile}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
          >
            Chọn file .xlsx
          </button>
          {fileName && <span className="text-sm text-gray-600 truncate max-w-[240px]">{fileName}</span>}
        </div>

        {parseError && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {parseError}
          </div>
        )}

        {parseStats && pendingItems && (
          <div className="mt-4 text-sm text-gray-700">
            Đã đọc <strong>{parseStats.data_rows}</strong> dòng → <strong>{parseStats.distinct_codes}</strong>{' '}
            mã sau khi gom.
            <button
              type="button"
              onClick={runSearch}
              disabled={mutation.isPending}
              className="ml-4 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Đang tra cứu…' : 'Tra cứu hàng loạt'}
            </button>
          </div>
        )}

        {mutation.isError && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {axios.isAxiosError(mutation.error) && mutation.error.response?.data
              ? String(
                  (mutation.error.response.data as { error?: string }).error ??
                    mutation.error.message
                )
              : mutation.error instanceof Error
                ? mutation.error.message
                : 'Lỗi API tra cứu.'}
          </div>
        )}
      </div>

      {mutation.data && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              Gửi <strong>{mutation.data.meta.requested}</strong> dòng →{' '}
              <strong>{mutation.data.meta.distinct_codes}</strong> mã · Tìm thấy{' '}
              <strong>{mutation.data.meta.found}</strong> · Không có trong hệ thống{' '}
              <strong>{mutation.data.meta.not_found}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-500">Lọc</label>
              <select
                className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterMode)}
              >
                <option value="all">Tất cả</option>
                <option value="errors">Chỉ mã không có trong HT</option>
                <option value="missing_plants">Chỉ còn thiếu NM</option>
              </select>
              <button
                type="button"
                onClick={exportCsv}
                className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Xuất CSV (đang lọc)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[min(560px,70vh)] overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs text-gray-500 shadow-sm">
                <tr>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2">Mô tả (file)</th>
                  <th className="px-3 py-2">Mô tả (HT)</th>
                  <th className="px-3 py-2">Công đoạn</th>
                  <th className="px-3 py-2">NM có data</th>
                  <th className="px-3 py-2">NM thiếu</th>
                  <th className="px-3 py-2">Tốc độ tốt nhất</th>
                  <th className="px-3 py-2">Điện trở (dòng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedRows.map((r) => (
                  <tr key={r.material_code} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-mono text-xs">{r.material_code}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={r.description_file ?? ''}>
                      {r.description_file ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-[220px] truncate" title={r.material?.material_description ?? ''}>
                      {!r.found ? (
                        <span className="text-red-600">—</span>
                      ) : (
                        r.material?.material_description ?? '—'
                      )}
                    </td>
                    <td className="px-3 py-2">{r.material?.process_step_name ?? '—'}</td>
                    <td className="px-3 py-2">{r.summary?.plants_with_data ?? '—'}</td>
                    <td className="px-3 py-2">{r.summary?.plants_without_data ?? '—'}</td>
                    <td className="px-3 py-2">{fmtNum(r.summary?.best_actual_speed ?? null)}</td>
                    <td className="px-3 py-2 text-xs">{resistanceCell(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayedRows.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">Không có dòng khớp bộ lọc.</div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useResistance } from '../hooks/useResistance';

function fmtNum(n: number | null | undefined, digits = 6): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ResistancePanel({ materialId }: { materialId: number }) {
  const [loaiSp, setLoaiSp] = useState<'Ccc' | 'Acc' | ''>('');
  const q = useResistance(materialId, {
    enabled: true,
    loaiSp: loaiSp === '' ? undefined : loaiSp,
  });

  if (q.isLoading) {
    return (
      <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-4 animate-pulse h-24" />
    );
  }

  if (q.isError) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
        Không tải được dữ liệu điện trở.
      </div>
    );
  }

  const d = q.data;
  if (!d) return null;

  if (d.message) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
        <p className="font-medium">Điện trở (Xoắn)</p>
        <p className="mt-1">{d.message}</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">Điện trở đo (sheet DATA)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {d.lookup ? (
              <>
                Khóa: tiết diện {d.lookup.tiet_dien} · kết cấu {d.lookup.ket_cau}
                {d.lookup.loai_sp ? ` · Loại SP ${d.lookup.loai_sp}` : ' · mọi Loại SP'}
              </>
            ) : (
              <>Khóa tra cứu chưa xác định.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Lọc Loại SP</label>
          <select
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            value={loaiSp}
            onChange={(e) => setLoaiSp((e.target.value as 'Ccc' | 'Acc' | '') || '')}
          >
            <option value="">Tất cả</option>
            <option value="Ccc">Ccc</option>
            <option value="Acc">Acc</option>
          </select>
        </div>
      </div>

      {d.row_count > 0 && d.latest_observed_at && (
        <div className="px-4 py-2 bg-violet-100/60 text-sm text-violet-900">
          <span className="font-medium">Cập nhật mới nhất:</span>{' '}
          {fmtDate(d.latest_observed_at)} · {d.row_count} bản ghi
        </div>
      )}
      {d.row_count === 0 && d.lookup && (
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
          0 bản ghi khớp khóa (đã import chưa?)
        </div>
      )}

      {d.row_count === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          Chưa có dòng điện trở khớp. Chạy migration 004 +{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">npm run import:resistance</code> với file
          Excel.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white shadow-sm text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2">Thời điểm</th>
                <th className="px-3 py-2">NM</th>
                <th className="px-3 py-2">SP</th>
                <th className="px-3 py-2">Ca</th>
                <th className="px-3 py-2">R max</th>
                <th className="px-3 py-2">R TT</th>
                <th className="px-3 py-2">Tỷ lệ %R</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {d.rows.map((r) => (
                <tr key={r.id} className="hover:bg-violet-50/40">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.observed_at)}</td>
                  <td className="px-3 py-2">
                    {r.plant_code ?? r.plant_code_excel ?? '—'}
                  </td>
                  <td className="px-3 py-2">{r.loai_sp}</td>
                  <td className="px-3 py-2">{r.ca ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.dien_tro_max_raw ?? fmtNum(r.dien_tro_max, 6)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{fmtNum(r.dien_tro_tt, 6)}</td>
                  <td className="px-3 py-2">{fmtNum(r.ty_le_dien_tro_pct, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

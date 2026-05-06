/**
 * Mã hiển thị cho bài nộp bổ sung thiếu & import job (theo ngày VN, dễ tra cứu).
 * id nội bộ vẫn là SERIAL; đây chỉ là quy tắc hiển thị / đối chiếu với job.
 */

const VN_TZ = 'Asia/Ho_Chi_Minh';

function ymdInVietnam(isoOrPgText: string): string {
  const d = new Date(isoOrPgText);
  if (Number.isNaN(d.getTime())) return '00000000';
  const s = d.toLocaleDateString('en-CA', { timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return s.replace(/-/g, '');
}

/** BN = bài nộp; ngày theo VN; P = plant; seq = id CSDL (ổn định, duy nhất). */
export function formatMissingSubmissionPublicRef(params: {
  id: number;
  plant_id: number;
  created_at: string;
}): string {
  const datePart = ymdInVietnam(params.created_at);
  const plantPart = `P${String(params.plant_id).padStart(2, '0')}`;
  const seq = String(params.id).padStart(6, '0');
  return `BN-${datePart}-${plantPart}-${seq}`;
}

/** IMP = import job; ngày tạo job (VN); J + id job (số tự động CSDL). */
export function formatImportJobPublicRef(jobId: number, jobCreatedAt: string | null): string {
  const datePart = jobCreatedAt ? ymdInVietnam(jobCreatedAt) : '00000000';
  const j = String(jobId).padStart(5, '0');
  return `IMP-${datePart}-J${j}`;
}

type StepCode = 'KEO' | 'XOAN' | 'GIAP' | 'BOC' | string;

const STYLES: Record<string, { className: string; label: string }> = {
  KEO: { className: 'bg-blue-100 text-blue-700', label: 'Kéo' },
  XOAN: { className: 'bg-purple-100 text-purple-700', label: 'Xoắn' },
  GIAP: { className: 'bg-amber-100 text-amber-700', label: 'Giáp' },
  BOC: { className: 'bg-green-100 text-green-700', label: 'Bọc' },
};

export function ProcessChip({
  code,
  size = 'md',
}: {
  code: StepCode;
  size?: 'sm' | 'md';
}) {
  const s = STYLES[code] ?? {
    className: 'bg-gray-100 text-gray-700',
    label: code,
  };
  const sizeCls =
    size === 'sm'
      ? 'rounded-full px-1.5 py-0.5 text-[10px] font-medium'
      : 'rounded-full px-2 py-0.5 text-xs font-medium';
  return (
    <span className={`inline-block ${s.className} ${sizeCls}`}>{s.label}</span>
  );
}

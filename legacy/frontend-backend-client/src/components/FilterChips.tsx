const CHIPS: { label: string; code: string | null }[] = [
  { label: 'Tất cả', code: null },
  { label: 'Kéo', code: 'KEO' },
  { label: 'Xoắn', code: 'XOAN' },
  { label: 'Giáp', code: 'GIAP' },
  { label: 'Bọc', code: 'BOC' },
];

export function FilterChips({
  selected,
  onChange,
}: {
  selected: string | null;
  onChange: (code: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map(({ label, code }) => {
        const isSel = selected === code;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(code)}
            className={`px-3 py-1 text-sm rounded-full cursor-pointer transition-colors border ${
              isSel
                ? 'bg-blue-600 text-white border-transparent'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

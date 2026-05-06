import { useRef } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  isFetching: boolean;
  onArrowDownOpenDropdown: () => void;
  onEscapeClose: () => void;
};

export function SearchBar({
  value,
  onChange,
  onClear,
  isFetching,
  onArrowDownOpenDropdown,
  onEscapeClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <div
        className={`flex items-center h-[52px] rounded-[10px] border-[1.5px] bg-white transition-colors ${
          'border-gray-200 focus-within:border-blue-600'
        }`}
      >
        <span className="absolute left-3 text-gray-400 pointer-events-none" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập mã material hoặc tên sản phẩm... (vd: 56000122, CV 1n7)"
          className="w-full h-full pl-11 pr-24 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              onArrowDownOpenDropdown();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onEscapeClose();
              inputRef.current?.blur();
            }
          }}
        />
        <div className="absolute right-3 flex items-center gap-2">
          {isFetching && (
            <span
              className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
              aria-label="Đang tải"
            />
          )}
          {!isFetching && value.length > 0 && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
              aria-label="Xóa"
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import type { MaterialSuggestion } from '../types/search';
import { ProcessChip } from './ProcessChip';

export type AutoSuggestDropdownHandle = {
  focusFirstOption: () => void;
};

type Props = {
  items: MaterialSuggestion[];
  isLoading: boolean;
  query: string;
  onSelect: (item: MaterialSuggestion) => void;
  onRequestClose: () => void;
};

export const AutoSuggestDropdown = forwardRef<AutoSuggestDropdownHandle, Props>(
  function AutoSuggestDropdown(
    { items, isLoading, query, onSelect, onRequestClose },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

    useEffect(() => {
      setActiveIndex(-1);
      optionRefs.current = [];
    }, [items, query]);

    useImperativeHandle(ref, () => ({
      focusFirstOption: () => {
        if (!items.length) return;
        setActiveIndex(0);
        requestAnimationFrame(() => {
          optionRefs.current[0]?.focus();
        });
      },
    }));

    useEffect(() => {
      function onDocMouseDown(e: MouseEvent) {
        const el = rootRef.current;
        if (el && !el.contains(e.target as Node)) {
          onRequestClose();
        }
      }
      document.addEventListener('mousedown', onDocMouseDown);
      return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [onRequestClose]);

    function selectIndex(i: number) {
      const it = items[i];
      if (it) onSelect(it);
    }

    function onOptionKeyDown(e: React.KeyboardEvent<HTMLLIElement>, i: number) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onRequestClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = i < items.length - 1 ? i + 1 : 0;
        setActiveIndex(next);
        optionRefs.current[next]?.focus();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = i > 0 ? i - 1 : items.length - 1;
        setActiveIndex(prev);
        optionRefs.current[prev]?.focus();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectIndex(i);
      }
    }

    return (
      <div
        ref={rootRef}
        className="absolute w-full mt-1 z-50 bg-white border border-gray-200 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] max-h-[360px] overflow-y-auto"
      >
        {isLoading ? (
          <div className="py-2">
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className="h-14 animate-pulse bg-gray-100 rounded-lg mx-3 my-1"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-8 px-4">
            Không tìm thấy kết quả cho &apos;{query}&apos;
          </p>
        ) : (
          <ul role="listbox" className="py-1">
            {items.map((item, i) => (
              <li
                key={item.id}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                className="px-4 py-3 cursor-pointer hover:bg-[#F5F7FF] flex gap-3 items-start outline-none focus:bg-[#F5F7FF]"
                onMouseEnter={() => setActiveIndex(i)}
                onKeyDown={(e) => onOptionKeyDown(e, i)}
                onClick={() => onSelect(item)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ProcessChip code={item.process_step_code} />
                    <span className="font-mono font-semibold">{item.material_code}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5 truncate">
                    {item.material_description}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0 pt-0.5">
                  {item.plant_count} nhà máy
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

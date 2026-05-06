import { useRef, useState } from 'react';
import type { MaterialSuggestion } from '../types/search';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { useCapability } from '../hooks/useCapability';
import { SearchBar } from '../components/SearchBar';
import {
  AutoSuggestDropdown,
  type AutoSuggestDropdownHandle,
} from '../components/AutoSuggestDropdown';
import { FilterChips } from '../components/FilterChips';
import { SummaryBanner } from '../components/SummaryBanner';
import { PlantCapabilityCard } from '../components/PlantCapabilityCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ResistancePanel } from '../components/ResistancePanel';
import { BulkSearchSection } from '../components/BulkSearchSection';

type SearchMode = 'single' | 'bulk';

export function SearchPage() {
  const [mode, setMode] = useState<SearchMode>('single');
  const [searchText, setSearchText] = useState('');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSuggestion | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef<AutoSuggestDropdownHandle>(null);

  const autocomplete = useAutocomplete(searchText, selectedStep ?? undefined);
  const capability = useCapability(selectedMaterial?.id ?? null);

  const items = autocomplete.data ?? [];
  const showSuggest =
    showDropdown && searchText.trim().length >= 2 && !selectedMaterial;

  function handleClearSearch() {
    setSearchText('');
    setSelectedMaterial(null);
    setShowDropdown(false);
  }

  function handleSelectItem(item: MaterialSuggestion) {
    setSelectedMaterial(item);
    setSearchText(item.material_code);
    setShowDropdown(false);
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tra cứu đơn
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'bulk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tra cứu theo file Excel
        </button>
      </div>

      {mode === 'bulk' ? (
        <BulkSearchSection />
      ) : (
        <>
      <div className="sticky top-0 z-10 bg-white shadow-sm py-5 -mx-6 px-6 mb-2">
        <div className="relative max-w-[1200px] mx-auto">
          <SearchBar
            value={searchText}
            onChange={(v) => {
              setSearchText(v);
              setShowDropdown(true);
              if (selectedMaterial && v !== selectedMaterial.material_code) {
                setSelectedMaterial(null);
              }
            }}
            onClear={handleClearSearch}
            isFetching={autocomplete.isFetching}
            onArrowDownOpenDropdown={() => {
              if (searchText.trim().length >= 2) {
                setShowDropdown(true);
                dropdownRef.current?.focusFirstOption();
              }
            }}
            onEscapeClose={() => setShowDropdown(false)}
          />
          {showSuggest && (
            <AutoSuggestDropdown
              ref={dropdownRef}
              items={items}
              isLoading={autocomplete.isFetching}
              query={searchText.trim()}
              onSelect={handleSelectItem}
              onRequestClose={() => setShowDropdown(false)}
            />
          )}
        </div>
      </div>

      <div className="mb-6">
        <FilterChips selected={selectedStep} onChange={setSelectedStep} />
      </div>

      {!selectedMaterial && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-gray-400 text-center">
          <p className="text-lg">Tra cứu năng lực sản xuất</p>
          <p className="text-sm mt-2 max-w-md">
            Nhập mã hoặc tên material (tối thiểu 2 ký tự), chọn từ gợi ý để xem chi tiết theo
            nhà máy.
          </p>
        </div>
      )}

      {selectedMaterial && capability.isLoading && <LoadingSkeleton />}

      {selectedMaterial && capability.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-4">
          Không tải được dữ liệu năng lực. Kiểm tra API và kết nối mạng.
        </div>
      )}

      {selectedMaterial && capability.data && (
        <>
          <SummaryBanner summary={capability.data.summary} material={capability.data.material} />
          {capability.data.material.process_step_code === 'XOAN' && (
            <ResistancePanel materialId={capability.data.material.id} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capability.data.plants.map((p) => (
              <PlantCapabilityCard
                key={p.plant_id}
                plant={p}
                materialId={capability.data.material.id}
              />
            ))}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

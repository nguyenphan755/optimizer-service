import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Search, Filter, Download, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  onExport?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
  enableKeyboardNav?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  selectable = false,
  onSelectionChange,
  getRowId,
  actions,
  onExport,
  loading = false,
  emptyMessage = "No data available",
  stickyHeader = true,
  maxHeight = "calc(100vh - 300px)",
  enableKeyboardNav = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return columns.some(col => {
        const value = col.accessor(row);
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const column = columns.find(col => col.key === sortColumn);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, undefined, { numeric: true });
      } else {
        return bStr.localeCompare(aStr, undefined, { numeric: true });
      }
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection, columns]);

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedData.map(getRowId));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  }, [sortedData, getRowId, onSelectionChange]);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  }, [selectedIds, onSelectionChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardNav) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedRowIndex(prev => Math.min(prev + 1, sortedData.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedRowIndex(prev => Math.max(prev - 1, 0));
        break;
      case ' ':
        if (selectable) {
          e.preventDefault();
          const rowId = getRowId(sortedData[focusedRowIndex]);
          handleSelectRow(rowId, !selectedIds.has(rowId));
        }
        break;
    }
  }, [enableKeyboardNav, sortedData, focusedRowIndex, selectable, getRowId, selectedIds, handleSelectRow]);

  const allSelected = sortedData.length > 0 && sortedData.every(row => selectedIds.has(getRowId(row)));
  const someSelected = sortedData.some(row => selectedIds.has(getRowId(row))) && !allSelected;

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      {(searchable || onExport || selectable) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {searchable && (
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {selectable && selectedIds.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea style={{ height: maxHeight }}>
          <Table>
            <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-muted" : ""}>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                {columns.map(column => (
                  <TableHead
                    key={column.key}
                    className={`${column.width || ''} ${column.className || ''} ${column.sortable ? 'cursor-pointer select-none hover:bg-accent' : ''}`}
                    style={{ textAlign: column.align || 'left' }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && <TableHead className="w-32 text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, index) => {
                  const rowId = getRowId(row);
                  const isSelected = selectedIds.has(rowId);
                  const isFocused = index === focusedRowIndex;
                  
                  return (
                    <TableRow
                      key={rowId}
                      className={`${isSelected ? 'bg-accent/50' : ''} ${isFocused ? 'ring-2 ring-primary' : ''}`}
                    >
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      {columns.map(column => (
                        <TableCell
                          key={column.key}
                          className={column.className}
                          style={{ textAlign: column.align || 'left' }}
                        >
                          {column.accessor(row)}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell className="text-center">
                          {actions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedData.length} of {data.length} records
        {searchTerm && ` (filtered from ${data.length})`}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
export { AppTable, type AppTableProps, type AppTableColumn } from './app-table';

interface DataTableProps<TData, TValue> {
  columns: any;
  data: any[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  infiniteScroll?: boolean;
  initialPageSize?: number;
  batchSize?: number;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  toolbar?: React.ReactNode;
  headerTheme?: 'blue' | 'default';
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Cari...',
  onRowClick,
  infiniteScroll = false,
  initialPageSize = 10,
  batchSize = 10,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: setControlledRowSelection,
  toolbar,
  headerTheme = 'blue',
}: DataTableProps<TData, TValue>) {
  const [mounted, setMounted] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = setControlledRowSelection ?? setInternalRowSelection;

  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // When search filter changes in infinite scroll mode, reset to initial page size
  React.useEffect(() => {
    if (infiniteScroll) {
      setPagination((prev) => ({
        ...prev,
        pageSize: initialPageSize,
      }));
    }
  }, [columnFilters, infiniteScroll, initialPageSize]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row: any) => row.id ?? row._id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
  });

  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const hasMore = infiniteScroll && pagination.pageSize < totalFilteredRows;

  // Progressive infinite scroll intersection observer
  React.useEffect(() => {
    if (!infiniteScroll || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setPagination((prev) => ({
              ...prev,
              pageSize: prev.pageSize + batchSize,
            }));
            setIsLoadingMore(false);
          }, 200);
        }
      },
      {
        root: null,
        rootMargin: '150px',
        threshold: 0.1,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [infiniteScroll, hasMore, isLoadingMore, batchSize]);

  const scrollToTop = () => {
    if (sentinelRef.current) {
      let parent = sentinelRef.current.parentElement;
      while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          parent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        parent = parent.parentElement;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {searchKey && (
          <div className="flex items-center w-full max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9 bg-card"
            />
          </div>
        )}
        {toolbar && (
          <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
            {toolbar}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader
            className={cn(
              headerTheme === 'blue' &&
                'bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 border-b border-blue-100/80 dark:border-blue-900/40'
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  headerTheme === 'blue'
                    ? 'border-none bg-transparent hover:bg-transparent'
                    : 'border-b'
                )}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        headerTheme === 'blue'
                          ? 'text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm h-11 px-3.5 tracking-tight whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&_[role=checkbox]]:border-blue-300 dark:[&_[role=checkbox]]:border-blue-700 [&_[role=checkbox]]:bg-white dark:[&_[role=checkbox]]:bg-slate-900 [&_[role=checkbox][data-state=checked]]:bg-blue-600 [&_[role=checkbox][data-state=checked]]:text-white [&_[role=checkbox][data-state=checked]]:border-blue-600 [&_button]:text-slate-700 dark:[&_button]:text-slate-300 [&_button:hover]:text-slate-900 dark:[&_button:hover]:text-white [&_button:hover]:bg-blue-100/70 dark:[&_button:hover]:bg-blue-900/50 [&_svg]:text-slate-600 dark:[&_svg]:text-slate-400'
                          : 'h-10 px-2'
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={cn(
                    'border-b border-slate-100 dark:border-slate-800/80 transition-colors',
                    onRowClick && 'cursor-pointer',
                    headerTheme === 'blue'
                      ? 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20 data-[state=selected]:bg-blue-50/70 dark:data-[state=selected]:bg-blue-950/40'
                      : 'hover:bg-muted/50 data-[state=selected]:bg-muted'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3.5 py-3 text-xs sm:text-sm align-middle"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center py-6 space-y-1.5">
                    <Search className="w-6 h-6 text-muted-foreground/40 mb-1" />
                    <span className="font-semibold text-sm text-foreground">
                      Tidak ada data ditemukan
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Coba ubah kata kunci pencarian atau filter yang dipilih.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {infiniteScroll ? (
        <div className="flex flex-col items-center justify-center pt-2 pb-6 space-y-3">
          {/* Intersection Sentinel & Loading indicator */}
          <div ref={sentinelRef} className="w-full flex items-center justify-center py-2 min-h-[44px]">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border border-border/50 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Memuat {batchSize} item berikutnya...</span>
              </div>
            ) : hasMore ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsLoadingMore(true);
                  setTimeout(() => {
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: prev.pageSize + batchSize,
                    }));
                    setIsLoadingMore(false);
                  }, 200);
                }}
                className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-4 h-8"
              >
                Scroll untuk memuat lebih banyak (atau klik di sini)
              </Button>
            ) : totalFilteredRows > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" />
                <span>Semua {totalFilteredRows} item telah ditampilkan</span>
              </div>
            ) : null}
          </div>

          {/* Row status counter & Scroll to top */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground px-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                {table.getFilteredSelectedRowModel().rows.length} dari {totalFilteredRows} baris dipilih.
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Menampilkan <span className="font-semibold text-foreground">{Math.min(pagination.pageSize, totalFilteredRows)}</span> dari <span className="font-semibold text-foreground">{totalFilteredRows}</span> total item
              </span>
            </div>
            {pagination.pageSize > initialPageSize && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={scrollToTop}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                <span>Kembali ke atas</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span className="font-medium text-foreground mr-2">
                {table.getFilteredSelectedRowModel().rows.length} dari {table.getFilteredRowModel().rows.length} baris dipilih.
              </span>
            )}
            Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length} baris
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="hidden sm:flex"
            >
              Sebelumnya
            </Button>

            {(() => {
              const currentPage = table.getState().pagination.pageIndex + 1;
              const totalPages = table.getPageCount();
              if (totalPages <= 1) return null;

              const delta = 1;
              const range = [];
              const rangeWithDots = [];
              let l;

              for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                  range.push(i);
                }
              }

              for (const i of range) {
                if (l) {
                  if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                  } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                  }
                }
                rangeWithDots.push(i);
                l = i;
              }

              return rangeWithDots.map((pageNumber, index) => {
                if (pageNumber === '...') {
                  return <span key={index} className="px-2 text-muted-foreground">...</span>;
                }
                return (
                  <Button
                    key={index}
                    variant={pageNumber === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => table.setPageIndex((pageNumber as number) - 1)}
                  >
                    {pageNumber}
                  </Button>
                );
              });
            })()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="hidden sm:flex"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

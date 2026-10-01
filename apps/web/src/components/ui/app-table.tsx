'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, PackageSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface AppTableColumn<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  searchKey?: keyof T | ((item: T) => string);
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  headerTheme?: 'blue' | 'default';
  className?: string;
}

export function AppTable<T>({
  columns,
  data,
  keyExtractor,
  searchKey,
  searchPlaceholder = 'Cari data...',
  toolbar,
  onRowClick,
  pageSize = 10,
  emptyTitle = 'Tidak ada data ditemukan',
  emptyDescription = 'Coba ubah kata kunci pencarian atau filter yang dipilih.',
  className,
}: AppTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(pageSize);

  // Filter data based on searchKey
  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) => {
      let val: string | undefined;
      if (typeof searchKey === 'function') {
        val = searchKey(item);
      } else {
        val = String((item as any)?.[searchKey] || '');
      }
      return val ? String(val).toLowerCase().includes(query) : false;
    });
  }, [data, searchKey, searchQuery]);

  // Reset to first page when search or items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Paginated items
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const getPaginationNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if ((i as number) - l === 2) {
          rangeWithDots.push(l + 1);
        } else if ((i as number) - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    }

    return rangeWithDots;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Bar: Search Input (Left) & Toolbar Actions (Right) */}
      {(searchKey || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchKey ? (
            <div className="flex items-center w-full max-w-sm relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9.5 h-9 bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus-visible:ring-blue-600"
              />
            </div>
          ) : (
            <div />
          )}

          {toolbar && (
            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              {toolbar}
            </div>
          )}
        </div>
      )}

      {/* Main Table Card Container */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/80 dark:border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'py-3.5 px-4 text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400 tracking-tight',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const key = keyExtractor
                    ? keyExtractor(item, index)
                    : (item as any)?.id ?? index;

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={cn(
                        'transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/25',
                        onRowClick && 'cursor-pointer'
                      )}
                    >
                      {columns.map((col) => {
                        const value = (item as any)?.[col.key];
                        const rendered = col.render ? col.render(item, index) : value;

                        return (
                          <td
                            key={col.key}
                            className={cn(
                              'py-3.5 px-4 text-xs align-middle whitespace-nowrap text-slate-700 dark:text-slate-300',
                              col.align === 'center' && 'text-center',
                              col.align === 'right' && 'text-right',
                              col.className
                            )}
                          >
                            {rendered}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <PackageSearch className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {emptyTitle}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {emptyDescription}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* Left: Items Per Page Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Items Per Page</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium gap-1.5 cursor-pointer"
                >
                  <span>{itemsPerPage}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-24 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
                {[10, 20, 50, 100].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => setItemsPerPage(size)}
                    className={cn("text-xs py-1.5 px-3 rounded-lg cursor-pointer", itemsPerPage === size && "font-semibold text-blue-600")}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: Page Numbers < 1 2 3 ... 8 9 10 > */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 disabled:opacity-40 cursor-pointer"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPaginationNumbers().map((pageItem, index) => {
                if (pageItem === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-slate-400">
                      ...
                    </span>
                  );
                }
                const pageNum = pageItem as number;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "h-8 min-w-[32px] px-2 text-xs rounded-lg font-medium transition-colors cursor-pointer",
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 disabled:opacity-40 cursor-pointer"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

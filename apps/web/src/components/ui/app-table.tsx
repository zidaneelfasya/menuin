'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  headerTheme = 'blue',
  className,
}: AppTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter data based on searchKey
  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((item) => {
      let value = '';
      if (typeof searchKey === 'function') {
        value = searchKey(item);
      } else {
        const raw = item[searchKey];
        value = raw ? String(raw) : '';
      }
      return value.toLowerCase().includes(query);
    });
  }, [data, searchKey, searchQuery]);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const startIndex = filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredData.length);

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
                className="pl-9.5 h-10 bg-card rounded-xl border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-600"
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          {/* Table Header: Ultra-soft blue background with slate-700 text */}
          <TableHeader
            className={cn(
              headerTheme === 'blue' &&
                'bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 border-b border-blue-100/80 dark:border-blue-900/40'
            )}
          >
            <TableRow
              className={cn(
                headerTheme === 'blue'
                  ? 'border-none bg-transparent hover:bg-transparent'
                  : 'border-b'
              )}
            >
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    headerTheme === 'blue'
                      ? 'text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm h-11 px-3.5 tracking-tight whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&_[role=checkbox]]:border-blue-300 dark:[&_[role=checkbox]]:border-blue-700 [&_[role=checkbox]]:bg-white dark:[&_[role=checkbox]]:bg-slate-900 [&_[role=checkbox][data-state=checked]]:bg-blue-600 [&_[role=checkbox][data-state=checked]]:text-white [&_[role=checkbox][data-state=checked]]:border-blue-600 [&_button]:text-slate-700 dark:[&_button]:text-slate-300 [&_button:hover]:text-slate-900 dark:[&_button:hover]:text-white [&_button:hover]:bg-blue-100/70 dark:[&_button:hover]:bg-blue-900/50 [&_svg]:text-slate-600 dark:[&_svg]:text-slate-400'
                      : 'h-10 px-2',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => {
                const key = keyExtractor
                  ? keyExtractor(item, index)
                  : (item as any)?.id ?? index;

                return (
                  <TableRow
                    key={key}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'border-b border-slate-100 dark:border-slate-800/80 transition-colors',
                      onRowClick && 'cursor-pointer',
                      headerTheme === 'blue'
                        ? 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20 data-[state=selected]:bg-blue-50/80 dark:data-[state=selected]:bg-blue-950/40'
                        : 'hover:bg-muted/50 data-[state=selected]:bg-muted'
                    )}
                  >
                    {columns.map((col) => {
                      const value = (item as any)?.[col.key];
                      const rendered = col.render ? col.render(item, index) : value;

                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            'px-3.5 py-3 text-xs sm:text-sm align-middle',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right',
                            col.className
                          )}
                        >
                          {rendered}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center py-6 space-y-1.5">
                    <PackageSearch className="w-8 h-8 text-muted-foreground/40 mb-1" />
                    <span className="font-semibold text-sm text-foreground">
                      {emptyTitle}
                    </span>
                    <span className="text-xs text-muted-foreground max-w-sm">
                      {emptyDescription}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-foreground">
              {startIndex}-{endIndex}
            </span>{' '}
            dari <span className="font-semibold text-foreground">{filteredData.length}</span> data
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 text-xs cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                <span>Sebelumnya</span>
              </Button>

              <div className="px-2 font-medium text-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 text-xs cursor-pointer disabled:opacity-40"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

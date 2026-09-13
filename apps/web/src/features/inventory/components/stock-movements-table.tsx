'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ShoppingCart, 
  RefreshCw, 
  Calendar, 
  User, 
  Search, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockMovementDto } from '@/lib/actions/inventory';

export function StockMovementsTable({ initialData }: { initialData: StockMovementDto[] }) {
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL');

  const filteredData = React.useMemo(() => {
    if (typeFilter === 'ALL') return initialData;
    return initialData.filter((item) => item.type === typeFilter);
  }, [initialData, typeFilter]);

  const columns: ColumnDef<StockMovementDto>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Waktu & Tanggal',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="flex flex-col">
            <span className="font-medium text-xs text-foreground">
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'productName',
      header: 'Nama Item',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-8 h-8 rounded-lg object-cover border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {item.productName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-medium text-sm block">{item.productName}</span>
              {item.categoryName && (
                <span className="text-[11px] text-muted-foreground">{item.categoryName}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipe Mutasi',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        switch (type) {
          case 'IN':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                Stok Masuk
              </span>
            );
          case 'OUT':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <ArrowUpCircle className="w-3.5 h-3.5 text-rose-600" />
                Stok Keluar
              </span>
            );
          case 'SALE':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                Penjualan Kasir
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                Penyesuaian
              </span>
            );
        }
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Jumlah',
      cell: ({ row }) => {
        const item = row.original;
        const isPositive = item.type === 'IN';
        return (
          <span
            className={`font-semibold text-sm ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? `+${item.quantity}` : `-${item.quantity}`}
          </span>
        );
      },
    },
    {
      id: 'distribution',
      header: 'Perubahan Stok',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{item.previousStock}</span>
            <span className="text-muted-foreground/60">➔</span>
            <span className="font-semibold text-foreground">{item.currentStock}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Catatan / Alasan',
      cell: ({ row }) => {
        const reason = row.getValue('reason') as string | null;
        return <span className="text-xs text-muted-foreground">{reason || '-'}</span>;
      },
    },
    {
      accessorKey: 'actorName',
      header: 'Dicatat Oleh',
      cell: ({ row }) => {
        const actor = row.getValue('actorName') as string | null;
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{actor || 'Sistem'}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Filter Tipe:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[170px] text-xs rounded-xl">
              <SelectValue placeholder="Semua Mutasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Mutasi</SelectItem>
              <SelectItem value="IN">Stok Masuk</SelectItem>
              <SelectItem value="OUT">Stok Keluar</SelectItem>
              <SelectItem value="SALE">Penjualan Kasir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Menampilkan <b>{filteredData.length}</b> catatan mutasi terbaru
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="productName"
        searchPlaceholder="Cari nama item mutasi..."
      />
    </div>
  );
}

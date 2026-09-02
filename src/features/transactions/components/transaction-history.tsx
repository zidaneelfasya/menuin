'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Printer, Eye, Download } from 'lucide-react';
import dynamic from 'next/dynamic';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Transaction = {
  id: string;
  userId: string | null;
  totalAmount: string;
  discount: string | null;
  tax: string | null;
  grandTotal: string;
  paymentMethod: string;
  status: string;
  source: string;
  orderType: string;
  customerName: string | null;
  tableNumber: string | null;
  createdAt: Date;
};

const paymentMethodMap: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  card: 'Kartu',
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'id',
    header: 'No. Transaksi',
    cell: ({ row }) => <span className="font-semibold text-primary font-mono text-xs">{row.getValue('id')}</span>
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal & Waktu',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return <span className="text-muted-foreground">{new Date(date).toLocaleString('id-ID')}</span>;
    }
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Pembayaran',
    cell: ({ row }) => {
      const method = row.getValue('paymentMethod') as string;
      return <span>{paymentMethodMap[method] || method}</span>;
    }
  },
  {
    accessorKey: 'source',
    header: 'Sumber & Channel',
    cell: ({ row }) => {
      const source = row.getValue('source') as string;
      const orderType = (row.original.orderType || 'DINE_IN').toUpperCase();
      const customer = row.original.customerName;
      const table = row.original.tableNumber;
      
      let channelBadge = 'bg-gray-100 text-gray-700';
      if (orderType.includes('GRAB')) channelBadge = 'bg-green-100 text-green-800 font-bold border border-green-300';
      else if (orderType.includes('SHOPEE')) channelBadge = 'bg-orange-100 text-orange-800 font-bold border border-orange-300';
      else if (orderType.includes('GOFOOD') || orderType.includes('GOJEK')) channelBadge = 'bg-red-100 text-red-800 font-bold border border-red-300';
      else if (orderType === 'DINE_IN') channelBadge = 'bg-blue-100 text-blue-800';

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${channelBadge}`}>
              {orderType.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-muted-foreground">({source})</span>
          </div>
          {(customer || table) && (
            <div className="text-xs text-muted-foreground">
              {customer && <span className="font-medium">{customer} </span>}
              {table && <span>(Meja {table})</span>}
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'grandTotal',
    header: 'Total & Rincian',
    cell: ({ row }) => {
      const total = parseFloat(row.getValue('grandTotal'));
      const discount = parseFloat(row.original.discount || '0');
      const platformFee = parseFloat((row.original as any).platformFee || '0');
      
      return (
        <div className="flex flex-col">
          <span className="font-bold">{formatCurrency(total)}</span>
          {discount > 0 && (
            <span className="text-[11px] text-green-600 dark:text-green-400">
              Hemat: -{formatCurrency(discount)}
            </span>
          )}
          {platformFee > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Fee Komisi: -{formatCurrency(platformFee)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      let badgeClass = '';
      let text = '';
      
      switch (status) {
        case 'COMPLETED':
          badgeClass = 'bg-success/10 text-success';
          text = 'Berhasil';
          break;
        case 'REFUNDED':
          badgeClass = 'bg-warning/10 text-warning';
          text = 'Dikembalikan';
          break;
        case 'FAILED':
          badgeClass = 'bg-destructive/10 text-destructive';
          text = 'Gagal';
          break;
        default:
          badgeClass = 'bg-muted text-muted-foreground';
          text = status;
      }
      
      return (
        <div className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${badgeClass}`}>
          {text}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi Transaksi</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" /> Detail Transaksi
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Printer className="mr-2 h-4 w-4" /> Cetak Struk
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function TransactionHistory({ initialData }: { initialData: Transaction[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
          <p className="text-sm text-muted-foreground">Lihat dan kelola semua riwayat penjualan kasir.</p>
        </div>
      </div>

      <DataTable columns={columns} data={initialData} searchKey="id" searchPlaceholder="Cari no transaksi..." />
    </div>
  );
}

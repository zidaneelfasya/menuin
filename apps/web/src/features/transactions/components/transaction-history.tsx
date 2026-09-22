'use client';

import * as React from 'react';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { 
  MoreHorizontal, 
  Printer, 
  Eye, 
  Ban, 
  AlertTriangle, 
  Loader2, 
  ChefHat, 
  ReceiptText,
  X
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { voidTransaction, getTransactionDetails } from '@/lib/actions/transactions';
import { ReceiptPrinter, ReceiptData, TenantReceiptSettings } from '@/features/pos/components/receipt-printer';
import { toast } from 'sonner';

const DataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => mod.DataTable),
  { ssr: false, loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-xl"></div> }
);

type Transaction = {
  id: string;
  cashierMembershipId?: string | null;
  posSessionId?: string | null;
  shiftId?: string | null;
  totalAmount: string;
  discount: string | null;
  tax: string | null;
  grandTotal: string;
  paymentMethod: string;
  paymentStatus?: string | null;
  status: string;
  source: string;
  orderType: string;
  orderNumber?: string | null;
  customerName: string | null;
  tableNumber: string | null;
  voidReason?: string | null;
  voidedAt?: Date | string | null;
  createdAt: Date;
};

const paymentMethodMap: Record<string, string> = {
  CASH: 'Tunai',
  cash: 'Tunai',
  QRIS: 'QRIS',
  qris: 'QRIS',
  TRANSFER: 'Transfer',
  transfer: 'Transfer',
  CARD: 'Kartu',
  card: 'Kartu',
};

export function TransactionHistory({ initialData }: { initialData: Transaction[] }) {
  const [data, setData] = React.useState<Transaction[]>(initialData);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectedTxForVoid, setSelectedTxForVoid] = React.useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = React.useState(false);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = React.useState<{ transaction: any; items: any[]; settings?: any } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  
  // Printing state
  const [printData, setPrintData] = React.useState<ReceiptData | null>(null);
  const [printSettings, setPrintSettings] = React.useState<TenantReceiptSettings | null>(null);
  const [printMode, setPrintMode] = React.useState<'all' | 'customer' | 'kitchen'>('all');
  const [loadingPrintId, setLoadingPrintId] = React.useState<string | null>(null);

  const handleRowClick = async (row: any) => {
    const trx = row as Transaction;
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const res = await getTransactionDetails(trx.id);
      if (res.success && res.data) {
        setSelectedTxDetail(res.data);
      } else {
        toast.error(res.error || 'Gagal mengambil detail transaksi');
      }
    } catch {
      toast.error('Gagal mengambil detail transaksi');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleReprint = async (transactionId: string, mode: 'all' | 'customer' | 'kitchen') => {
    setLoadingPrintId(transactionId);
    const toastId = toast.loading('Menyiapkan struk...');
    try {
      const res = await getTransactionDetails(transactionId);
      if (res.success && res.data) {
        const { transaction, items, settings } = res.data;
        const receipt: ReceiptData = {
          transactionId: transaction.id,
          date: new Date(transaction.createdAt),
          cashierName: transaction.cashierName || 'Kasir',
          subtotal: parseFloat(transaction.totalAmount || '0'),
          discount: parseFloat(transaction.discount || '0'),
          promoCode: transaction.promoCode || undefined,
          tax: parseFloat(transaction.tax || '0'),
          serviceCharge: parseFloat(transaction.serviceCharge || '0'),
          totalAmount: parseFloat(transaction.grandTotal || '0'),
          cashReceived: parseFloat(transaction.grandTotal || '0'),
          change: 0,
          paymentMethod: (transaction.paymentMethod || 'TUNAI').toUpperCase(),
          orderType: transaction.orderType,
          customerName: transaction.customerName || undefined,
          tableNumber: transaction.tableNumber || undefined,
          items: items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.subtotal,
            modifiers: Array.isArray(it.modifiers) ? it.modifiers : undefined,
            notes: it.notes,
          })),
        };

        setPrintSettings(settings || null);
        setPrintData(receipt);
        setPrintMode(mode);
        toast.dismiss(toastId);

        setTimeout(() => {
          window.print();
        }, 200);
      } else {
        toast.error(res.error || 'Gagal mengambil data struk', { id: toastId });
      }
    } catch (err) {
      toast.error('Gagal mencetak struk', { id: toastId });
    } finally {
      setLoadingPrintId(null);
    }
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForVoid) return;
    if (!voidReason || voidReason.trim().length < 3) {
      toast.error('Alasan pembatalan wajib diisi (minimal 3 karakter)');
      return;
    }

    setIsSubmittingVoid(true);
    try {
      const res = await voidTransaction({
        transactionId: selectedTxForVoid.id,
        reason: voidReason.trim(),
        restock: true,
      });

      if (res.success) {
        toast.success(res.message || 'Transaksi berhasil dibatalkan dan tercatat dalam log audit.');
        setData(prev => prev.map(t => t.id === selectedTxForVoid.id ? {
          ...t,
          status: 'CANCELLED',
          paymentStatus: 'CANCELED',
          voidReason: voidReason.trim(),
          voidedAt: new Date(),
        } : t));

        if (selectedTxDetail && selectedTxDetail.transaction.id === selectedTxForVoid.id) {
          setSelectedTxDetail(prev => prev ? {
            ...prev,
            transaction: {
              ...prev.transaction,
              status: 'CANCELLED',
              paymentStatus: 'CANCELED',
              voidReason: voidReason.trim(),
              voidedAt: new Date(),
            }
          } : null);
        }

        setSelectedTxForVoid(null);
        setVoidReason('');
      } else {
        toast.error(res.error || 'Gagal membatalkan transaksi');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat membatalkan transaksi');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Pilih semua baris"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Pilih baris"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'No. Transaksi',
      cell: ({ row }) => {
        const orderNum = row.original.orderNumber;
        const id = row.original.id.slice(0, 8).toUpperCase();
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
              {orderNum || `#${id}`}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              ID: {id}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[11px]">
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'source',
      header: 'Channel & Meja',
      cell: ({ row }) => {
        const orderType = (row.original.orderType || 'DINE_IN').toUpperCase();
        const customer = row.original.customerName;
        const table = row.original.tableNumber;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit">
              {orderType.replace('_', ' ')}
            </span>
            {(customer || table) && (
              <span className="text-[11px] text-muted-foreground">
                {customer ? customer : ''}{customer && table ? ' • ' : ''}{table ? `Meja ${table}` : ''}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Pembayaran',
      cell: ({ row }) => {
        const method = (row.getValue('paymentMethod') as string) || 'TUNAI';
        return (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">
            {paymentMethodMap[method] || method}
          </span>
        );
      }
    },
    {
      accessorKey: 'grandTotal',
      header: 'Total Tagihan',
      cell: ({ row }) => {
        const total = parseFloat(row.getValue('grandTotal') || '0');
        const isCanceled = row.original.status === 'CANCELLED' || row.original.paymentStatus === 'CANCELED';
        
        return (
          <div className="font-semibold font-mono text-xs">
            <span className={isCanceled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}>
              {formatCurrency(total)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const paymentStatus = row.original.paymentStatus;
        const isCanceled = status === 'CANCELLED' || paymentStatus === 'CANCELED' || status === 'CANCELED';
        const voidReason = row.original.voidReason;
        
        if (isCanceled) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Batal
              </span>
              {voidReason && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={voidReason}>
                  {voidReason}
                </span>
              )}
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Sukses
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const trx = row.original;
        const isCanceled = trx.status === 'CANCELLED' || trx.paymentStatus === 'CANCELED';
        const isLoading = loadingPrintId === trx.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" 
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <DropdownMenuItem 
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); handleRowClick(trx); }}
              >
                <Eye className="h-3.5 w-3.5 text-slate-500" /> Detail transaksi
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleReprint(trx.id, 'customer'); }}
                disabled={isLoading}
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ReceiptText className="h-3.5 w-3.5 text-slate-500" /> Struk pelanggan
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleReprint(trx.id, 'kitchen'); }}
                disabled={isLoading}
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <ChefHat className="h-3.5 w-3.5 text-slate-500" /> Tiket dapur
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleReprint(trx.id, 'all'); }}
                disabled={isLoading}
                className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" /> Cetak lengkap
              </DropdownMenuItem>

              {!isCanceled && (
                <>
                  <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTxForVoid(trx);
                      setVoidReason('');
                    }}
                    className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 flex items-center gap-2"
                  >
                    <Ban className="h-3.5 w-3.5 text-red-600" /> Batalkan transaksi
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Riwayat Penjualan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit trail seluruh riwayat pesanan, status pembayaran, dan log pembatalan transaksi.
          </p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="id" 
        searchPlaceholder="Cari no transaksi / ID..." 
        onRowClick={handleRowClick}
        infiniteScroll={true}
        initialPageSize={10}
        batchSize={10}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {/* MODAL DETAIL TRANSAKSI (shadcn/ui Pure Dialog) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Memuat rincian transaksi...</p>
            </div>
          ) : selectedTxDetail ? (
            <>
              {/* Header */}
              <div className="p-6 pb-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-start justify-between pr-12">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                      {selectedTxDetail.transaction.orderNumber || `#${selectedTxDetail.transaction.id.slice(0, 8).toUpperCase()}`}
                    </h3>
                    {selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Batal / Void
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sukses
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedTxDetail.transaction.createdAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Info Grid (Kasir, Channel, Meja, Pelanggan) */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tipe Pesanan / Meja</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {(selectedTxDetail.transaction.orderType || 'DINE_IN').replace('_', ' ')}
                      {selectedTxDetail.transaction.tableNumber ? ` (Meja ${selectedTxDetail.transaction.tableNumber})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Kasir Bertugas</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTxDetail.transaction.cashierName || 'Kasir Toko'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Metode Pembayaran</span>
                    <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">
                      {paymentMethodMap[selectedTxDetail.transaction.paymentMethod] || selectedTxDetail.transaction.paymentMethod || 'TUNAI'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Pelanggan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTxDetail.transaction.customerName || '-'}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Item Pesanan ({selectedTxDetail.items.length})
                  </h4>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {selectedTxDetail.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-950 flex items-start justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.quantity}x</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                          </div>
                          {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                            <div className="text-[11px] text-muted-foreground pl-5">
                              {item.modifiers.map((m: any, mIdx: number) => (
                                <span key={mIdx} className="inline-block bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-1 mb-0.5">
                                  {m.name || m.optionName} {m.price ? `(+${formatCurrency(m.price)})` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic pl-5">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="font-semibold font-mono text-slate-900 dark:text-slate-100 text-right">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Produk</span>
                    <span className="font-mono">{formatCurrency(parseFloat(selectedTxDetail.transaction.totalAmount || '0'))}</span>
                  </div>
                  {parseFloat(selectedTxDetail.transaction.discount || '0') > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Diskon {selectedTxDetail.transaction.promoCode ? `(${selectedTxDetail.transaction.promoCode})` : ''}</span>
                      <span className="font-mono">-{formatCurrency(parseFloat(selectedTxDetail.transaction.discount || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.tax || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak (PB1)</span>
                      <span className="font-mono">{formatCurrency(parseFloat(selectedTxDetail.transaction.tax || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.serviceCharge || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Biaya Layanan</span>
                      <span className="font-mono">{formatCurrency(parseFloat(selectedTxDetail.transaction.serviceCharge || '0'))}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Total Pembayaran</span>
                    <span className="font-bold text-base font-mono text-primary">
                      {formatCurrency(parseFloat(selectedTxDetail.transaction.grandTotal || '0'))}
                    </span>
                  </div>
                </div>

                {/* Audit Void Information if cancelled */}
                {(selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED') && selectedTxDetail.transaction.voidReason && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Informasi Pembatalan (Void)
                    </div>
                    <p className="text-red-600 dark:text-red-300">
                      Alasan: <span className="italic font-medium">{selectedTxDetail.transaction.voidReason}</span>
                    </p>
                    {selectedTxDetail.transaction.voidedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Dibatalkan pada: {new Date(selectedTxDetail.transaction.voidedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Tutup
                </Button>

                <div className="flex items-center gap-2">
                  {selectedTxDetail.transaction.status !== 'CANCELLED' && selectedTxDetail.transaction.paymentStatus !== 'CANCELED' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTxForVoid(selectedTxDetail.transaction);
                        setVoidReason('');
                      }}
                      className="rounded-xl text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      Void Transaksi
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Struk</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'customer')}
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                        Struk Pelanggan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'kitchen')}
                      >
                        <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                        Tiket Dapur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => handleReprint(selectedTxDetail.transaction.id, 'all')}
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Cetak Lengkap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* MODAL DIALOG VOID TRANSAKSI (ANTI-FRAUD AUDIT) */}
      <Dialog open={!!selectedTxForVoid} onOpenChange={(open) => !open && setSelectedTxForVoid(null)}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
          <form onSubmit={handleConfirmVoid}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-600">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Batalkan (Void) Transaksi
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Transaksi yang dibatalkan akan ditandai <strong>BATAL</strong> dan tetap tersimpan di audit trail anti-fraud.
              </DialogDescription>
            </DialogHeader>

            {selectedTxForVoid && (
              <div className="space-y-4 py-3">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID Transaksi:</span>
                    <span className="font-mono font-bold">{selectedTxForVoid.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">No. Order / Meja:</span>
                    <span className="font-medium">{selectedTxForVoid.orderNumber || '-'} {selectedTxForVoid.tableNumber ? `(Meja ${selectedTxForVoid.tableNumber})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Nominal Transaksi:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(parseFloat(selectedTxForVoid.grandTotal))}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voidReason" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Alasan Pembatalan <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="voidReason"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Contoh: Pelanggan salah pesan menu, pembayaran gagal/double, salah input kasir..."
                    rows={3}
                    className="text-xs resize-none rounded-xl"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alasan ini akan disimpan secara permanen di log audit laporan keuangan.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedTxForVoid(null)}
                disabled={isSubmittingVoid}
                className="rounded-xl text-xs h-9"
              >
                Kembali
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={isSubmittingVoid || !voidReason.trim()}
                className="rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 min-w-[130px]"
              >
                {isSubmittingVoid ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                ) : (
                  <>Konfirmasi Void</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECEIPT PRINTER FOR REPRINT */}
      <ReceiptPrinter data={printData} settings={printSettings} printMode={printMode} />
    </div>
  );
}

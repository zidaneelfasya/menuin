'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Printer, Eye, Ban, AlertTriangle, Loader2, ChefHat, ReceiptText } from 'lucide-react';
import dynamic from 'next/dynamic';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  const [selectedTxForVoid, setSelectedTxForVoid] = React.useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = React.useState(false);
  
  // Printing state
  const [printData, setPrintData] = React.useState<ReceiptData | null>(null);
  const [printSettings, setPrintSettings] = React.useState<TenantReceiptSettings | null>(null);
  const [printMode, setPrintMode] = React.useState<'all' | 'customer' | 'kitchen'>('all');
  const [loadingPrintId, setLoadingPrintId] = React.useState<string | null>(null);

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
      accessorKey: 'id',
      header: 'No. Transaksi',
      cell: ({ row }) => {
        const orderNum = row.original.orderNumber;
        const id = row.original.id.slice(0, 8).toUpperCase();
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 font-mono text-xs">
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
      header: 'Tanggal & Waktu',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return <span className="text-xs text-muted-foreground">{new Date(date).toLocaleString('id-ID')}</span>;
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Pembayaran',
      cell: ({ row }) => {
        const method = (row.getValue('paymentMethod') as string) || 'TUNAI';
        return <span className="text-xs font-semibold uppercase">{paymentMethodMap[method] || method}</span>;
      }
    },
    {
      accessorKey: 'source',
      header: 'Channel & Meja',
      cell: ({ row }) => {
        const orderType = (row.original.orderType || 'DINE_IN').toUpperCase();
        const customer = row.original.customerName;
        const table = row.original.tableNumber;
        
        let channelBadge = 'bg-slate-100 text-slate-700';
        if (orderType.includes('GRAB')) channelBadge = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
        else if (orderType.includes('SHOPEE')) channelBadge = 'bg-orange-50 text-orange-800 border border-orange-200';
        else if (orderType.includes('GOFOOD') || orderType.includes('GOJEK')) channelBadge = 'bg-red-50 text-red-800 border border-red-200';
        else if (orderType === 'DINE_IN') channelBadge = 'bg-blue-50 text-blue-800 border border-blue-200';

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${channelBadge}`}>
                {orderType.replace('_', ' ')}
              </span>
            </div>
            {(customer || table) && (
              <div className="text-[11px] text-slate-600">
                {customer && <span className="font-medium">{customer} </span>}
                {table && <span className="text-slate-500">(Meja {table})</span>}
              </div>
            )}
          </div>
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
          <div className="flex flex-col">
            <span className={`font-bold font-mono text-xs ${isCanceled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {formatCurrency(total)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status & Audit',
      cell: ({ row }) => {
        const status = row.original.status;
        const paymentStatus = row.original.paymentStatus;
        const isCanceled = status === 'CANCELLED' || paymentStatus === 'CANCELED' || status === 'CANCELED';
        const voidReason = row.original.voidReason;
        
        if (isCanceled) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200 w-fit">
                BATAL / VOID
              </span>
              {voidReason && (
                <span className="text-[10px] text-red-600 italic">
                  Alasan: {voidReason}
                </span>
              )}
            </div>
          );
        }

        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 w-fit">
            SUKSES
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Cetak Ulang Struk</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleReprint(trx.id, 'customer')}
                disabled={isLoading}
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <ReceiptText className="h-3.5 w-3.5 text-primary" /> Struk Pelanggan
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleReprint(trx.id, 'kitchen')}
                disabled={isLoading}
                className="cursor-pointer text-xs flex items-center gap-2 text-orange-700 focus:text-orange-700"
              >
                <ChefHat className="h-3.5 w-3.5 text-orange-600" /> Tiket Dapur (Slip)
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleReprint(trx.id, 'all')}
                disabled={isLoading}
                className="cursor-pointer text-xs flex items-center gap-2"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak Lengkap (Keduanya)
              </DropdownMenuItem>

              {!isCanceled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedTxForVoid(trx);
                      setVoidReason('');
                    }}
                    className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                  >
                    <Ban className="h-3.5 w-3.5" /> Batalkan / Void Transaksi
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Riwayat Penjualan & Transaksi</h1>
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
      />

      {/* MODAL DIALOG VOID TRANSAKSI (ANTI-FRAUD AUDIT) */}
      <Dialog open={!!selectedTxForVoid} onOpenChange={(open) => !open && setSelectedTxForVoid(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmVoid}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-700">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Batalkan (Void) Transaksi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transaksi yang dibatalkan akan ditandai <strong>BATAL</strong> dan tetap tersimpan di audit trail anti-fraud.
              </DialogDescription>
            </DialogHeader>

            {selectedTxForVoid && (
              <div className="space-y-4 py-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">ID Transaksi:</span>
                    <span className="font-mono font-bold">{selectedTxForVoid.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">No. Order / Meja:</span>
                    <span className="font-medium">{selectedTxForVoid.orderNumber || '-'} {selectedTxForVoid.tableNumber ? `(Meja ${selectedTxForVoid.tableNumber})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nominal Transaksi:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(parseFloat(selectedTxForVoid.grandTotal))}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voidReason" className="text-xs font-semibold uppercase text-slate-700">
                    Alasan Pembatalan <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="voidReason"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Contoh: Pelanggan salah pesan menu, pembayaran gagal/double, salah input kasir..."
                    rows={3}
                    className="text-xs resize-none"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alasan ini akan disimpan secara permanen di log audit laporan keuangan.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedTxForVoid(null)}
                disabled={isSubmittingVoid}
              >
                Kembali
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={isSubmittingVoid || !voidReason.trim()}
                className="min-w-[130px]"
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

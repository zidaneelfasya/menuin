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
  X,
  Globe,
  Monitor,
  Copy,
  Check,
  ArrowUpDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type TimeFilter = 'all' | 'today' | 'yesterday' | '7days' | 'this_month' | 'custom';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';
type SourceFilter = 'all' | 'pos' | 'storefront';

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

const getOrderSourceInfo = (source?: string | null) => {
  const s = (source || 'POS').toUpperCase();
  if (s === 'ONLINE' || s === 'WEB_ORDER' || s === 'STOREFRONT' || s === 'QR') {
    return {
      label: 'Storefront Online',
      shortLabel: 'Storefront',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      isStorefront: true,
    };
  }
  if (s === 'DELIVERY') {
    return {
      label: 'Delivery Online',
      shortLabel: 'Delivery',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      isStorefront: true,
    };
  }
  return {
    label: 'Kasir Manual (POS)',
    shortLabel: 'Kasir Manual',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20',
    isStorefront: false,
  };
};

function formatFriendlyDate(dateInput: Date | string): { dateStr: string; timeStr: string } {
  const d = new Date(dateInput);
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  const dateStr = d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return { dateStr, timeStr };
}

export function TransactionHistory({ initialData }: { initialData: Transaction[] }) {
  const [data, setData] = React.useState<Transaction[]>(initialData);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectedTxForVoid, setSelectedTxForVoid] = React.useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = React.useState(false);

  // Time filters, Custom DateRange & Sorting state
  const [timeRangeFilter, setTimeRangeFilter] = React.useState<TimeFilter>('all');
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('newest');

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = React.useState<{ transaction: any; items: any[]; settings?: any } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  
  // Printing state
  const [printData, setPrintData] = React.useState<ReceiptData | null>(null);
  const [printSettings, setPrintSettings] = React.useState<TenantReceiptSettings | null>(null);
  const [printMode, setPrintMode] = React.useState<'all' | 'customer' | 'kitchen'>('all');
  const [loadingPrintId, setLoadingPrintId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handlePresetClick = (preset: 'all' | 'today' | 'yesterday' | '7days' | 'this_month') => {
    setTimeRangeFilter(preset);
    setCustomDateRange(undefined);
  };

  // Filter & Sort calculation
  const filteredData = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return data
      .filter((tx) => {
        // 1. Time range filter
        if (timeRangeFilter !== 'all') {
          const txDate = new Date(tx.createdAt);
          if (timeRangeFilter === 'custom' && customDateRange?.from) {
            const start = new Date(customDateRange.from);
            start.setHours(0, 0, 0, 0);
            if (txDate < start) return false;

            const end = new Date(customDateRange.to || customDateRange.from);
            end.setHours(23, 59, 59, 999);
            if (txDate > end) return false;
          } else if (timeRangeFilter === 'today') {
            if (txDate < startOfToday) return false;
          } else if (timeRangeFilter === 'yesterday') {
            if (txDate < startOfYesterday || txDate >= startOfToday) return false;
          } else if (timeRangeFilter === '7days') {
            if (txDate < sevenDaysAgo) return false;
          } else if (timeRangeFilter === 'this_month') {
            if (txDate < startOfMonth) return false;
          }
        }

        // 2. Source filter
        if (sourceFilter !== 'all') {
          const info = getOrderSourceInfo(tx.source);
          if (sourceFilter === 'pos' && info.isStorefront) return false;
          if (sourceFilter === 'storefront' && !info.isStorefront) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        const amountA = parseFloat(a.grandTotal || '0');
        const amountB = parseFloat(b.grandTotal || '0');

        if (sortBy === 'newest') return timeB - timeA;
        if (sortBy === 'oldest') return timeA - timeB;
        if (sortBy === 'amount_high') return amountB - amountA;
        if (sortBy === 'amount_low') return amountA - amountB;
        return timeB - timeA;
      });
  }, [data, timeRangeFilter, customDateRange, sourceFilter, sortBy]);

  const totalRevenue = React.useMemo(() => {
    return filteredData
      .filter(tx => tx.status !== 'CANCELLED' && tx.paymentStatus !== 'CANCELED')
      .reduce((acc, curr) => acc + parseFloat(curr.grandTotal || '0'), 0);
  }, [filteredData]);

  const handleCopyId = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle escape key and body scroll lock for modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTxForVoid) {
          setSelectedTxForVoid(null);
        } else if (isDetailOpen) {
          setIsDetailOpen(false);
        }
      }
    };

    if (isDetailOpen || selectedTxForVoid) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailOpen, selectedTxForVoid]);

  const handleRowClick = async (row: any) => {
    const trx = row as Transaction;
    // Set immediate transaction metadata so the modal opens with full context instantly without jitter
    setSelectedTxDetail({
      transaction: trx,
      items: [],
    });
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
        const displayCode = orderNum || `#${id}`;
        const isCopied = copiedId === displayCode;

        return (
          <div className="flex items-center gap-1.5 group">
            <div className="flex flex-col">
              <span className="font-inter font-normal text-blue-600 dark:text-blue-400 text-xs">
                {displayCode}
              </span>
              <span className="text-[10px] text-muted-foreground font-inter font-normal">
                ID: {id}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => handleCopyId(e, displayCode)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground transition-all"
              title="Salin No. Transaksi"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Waktu',
      cell: ({ row }) => {
        const { dateStr, timeStr } = formatFriendlyDate(row.getValue('createdAt'));

        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {dateStr}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {timeStr}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'source',
      header: 'Channel & Meja',
      cell: ({ row }) => {
        const sourceInfo = getOrderSourceInfo(row.original.source);
        const orderType = (row.original.orderType || 'DINE_IN').toUpperCase();
        // Kalau storefront, nama pelanggan tidak ditampilkan
        const customer = sourceInfo.isStorefront ? null : row.original.customerName;
        const table = row.original.tableNumber;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                sourceInfo.badgeClass
              )}>
                {sourceInfo.isStorefront ? (
                  <Globe className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                {sourceInfo.shortLabel}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {orderType.replace('_', ' ')}
              </span>
            </div>
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
        const discount = parseFloat(row.original.discount || '0');
        const isCanceled = row.original.status === 'CANCELLED' || row.original.paymentStatus === 'CANCELED';
        
        return (
          <div className="flex flex-col text-xs font-inter">
            <span className={cn(
              "font-normal font-inter flex items-center gap-0.5",
              isCanceled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
            )}>
              {!isCanceled && <span className="text-emerald-600 font-normal text-xs">+</span>}
              <span>{formatCurrency(total)}</span>
            </span>
            {discount > 0 && !isCanceled && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-inter font-normal">
                Diskon -{formatCurrency(discount)}
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
        const status = row.original.status;
        const paymentStatus = row.original.paymentStatus;
        const isCanceled = status === 'CANCELLED' || paymentStatus === 'CANCELED' || status === 'CANCELED';
        const voidReason = row.original.voidReason;
        
        if (isCanceled) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 w-fit">
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 w-fit">
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

  const toolbarContent = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Quick Time Range Presets (Shortcut Waktu) */}
      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => handlePresetClick('all')}
          className={cn(
            "px-2.5 py-1 rounded-lg transition-all text-xs",
            timeRangeFilter === 'all'
              ? "bg-white dark:bg-slate-900 shadow-xs font-semibold text-slate-900 dark:text-slate-100"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick('today')}
          className={cn(
            "px-2.5 py-1 rounded-lg transition-all text-xs",
            timeRangeFilter === 'today'
              ? "bg-white dark:bg-slate-900 shadow-xs font-semibold text-slate-900 dark:text-slate-100"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick('yesterday')}
          className={cn(
            "px-2.5 py-1 rounded-lg transition-all text-xs",
            timeRangeFilter === 'yesterday'
              ? "bg-white dark:bg-slate-900 shadow-xs font-semibold text-slate-900 dark:text-slate-100"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Kemarin
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick('7days')}
          className={cn(
            "px-2.5 py-1 rounded-lg transition-all text-xs",
            timeRangeFilter === '7days'
              ? "bg-white dark:bg-slate-900 shadow-xs font-semibold text-slate-900 dark:text-slate-100"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          7 Hari
        </button>
        <button
          type="button"
          onClick={() => handlePresetClick('this_month')}
          className={cn(
            "px-2.5 py-1 rounded-lg transition-all text-xs",
            timeRangeFilter === 'this_month'
              ? "bg-white dark:bg-slate-900 shadow-xs font-semibold text-slate-900 dark:text-slate-100"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Bulan Ini
        </button>
      </div>

      {/* Date Range Picker (Pilih Rentang Tanggal Kalender) */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs rounded-xl gap-1.5 font-medium border-slate-200 dark:border-slate-800",
              timeRangeFilter === 'custom' && "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-semibold"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {timeRangeFilter === 'custom' && customDateRange?.from ? (
                customDateRange.to ? (
                  `${format(customDateRange.from, "d MMM", { locale: idLocale })} - ${format(customDateRange.to, "d MMM yyyy", { locale: idLocale })}`
                ) : (
                  format(customDateRange.from, "d MMM yyyy", { locale: idLocale })
                )
              ) : (
                "Pilih Rentang"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={customDateRange?.from || new Date()}
              selected={customDateRange}
              onSelect={(range) => {
                setCustomDateRange(range);
                if (range?.from) {
                  setTimeRangeFilter('custom');
                }
              }}
              numberOfMonths={1}
              locale={idLocale}
            />
            {customDateRange?.from && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomDateRange(undefined);
                    setTimeRangeFilter('all');
                    setIsCalendarOpen(false);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                >
                  Reset
                </button>
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-lg px-3"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Selesai
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sorting Dropdown (Newest / Oldest / Amount) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5 font-medium border-slate-200 dark:border-slate-800"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {sortBy === 'newest' && 'Terbaru (Waktu ↓)'}
              {sortBy === 'oldest' && 'Terlama (Waktu ↑)'}
              {sortBy === 'amount_high' && 'Nominal Terbesar'}
              {sortBy === 'amount_low' && 'Nominal Terkecil'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'newest' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSortBy('newest')}
          >
            Terbaru (Waktu ↓)
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'oldest' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSortBy('oldest')}
          >
            Terlama (Waktu ↑)
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'amount_high' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSortBy('amount_high')}
          >
            Nominal Terbesar
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sortBy === 'amount_low' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSortBy('amount_low')}
          >
            Nominal Terkecil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Channel Filter (Kasir vs Storefront) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5 font-medium border-slate-200 dark:border-slate-800"
          >
            {sourceFilter === 'storefront' ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Monitor className="w-3.5 h-3.5 text-slate-500" />}
            <span>
              {sourceFilter === 'all' && 'Semua Channel'}
              {sourceFilter === 'pos' && 'Kasir POS'}
              {sourceFilter === 'storefront' && 'Storefront Online'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sourceFilter === 'all' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSourceFilter('all')}
          >
            Semua Channel
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sourceFilter === 'pos' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSourceFilter('pos')}
          >
            Kasir POS
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn("text-xs py-2 px-3 rounded-lg cursor-pointer", sourceFilter === 'storefront' && "font-semibold text-blue-600 dark:text-blue-400")}
            onClick={() => setSourceFilter('storefront')}
          >
            Storefront Online
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Riwayat Penjualan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredData.length}</span> transaksi
            {timeRangeFilter !== 'all' && (
              <span> ({
                timeRangeFilter === 'today' ? 'Hari ini' :
                timeRangeFilter === 'yesterday' ? 'Kemarin' :
                timeRangeFilter === '7days' ? '7 hari terakhir' :
                timeRangeFilter === 'this_month' ? 'Bulan ini' :
                customDateRange?.from ? (
                  customDateRange.to ? (
                    `${format(customDateRange.from, 'd MMM yyyy', { locale: idLocale })} - ${format(customDateRange.to, 'd MMM yyyy', { locale: idLocale })}`
                  ) : (
                    format(customDateRange.from, 'd MMM yyyy', { locale: idLocale })
                  )
                ) : 'Rentang Kustom'
              })</span>
            )}
            {' • '}
            Total pemasukan: <span className="font-normal font-inter text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        searchKey="id" 
        searchPlaceholder="Cari no transaksi / ID..." 
        onRowClick={handleRowClick}
        infiniteScroll={true}
        initialPageSize={10}
        batchSize={10}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        toolbar={toolbarContent}
      />

      {/* DETAIL TRANSAKSI MODAL (Clean Center Modal ala Fintech) */}
      <AnimatePresence>
        {isDetailOpen && selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              key="detail-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsDetailOpen(false)}
              aria-hidden="true"
            />

            {/* Center Modal Dialog */}
            <motion.div
              key="detail-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tx-detail-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar with Channel & Close Button */}
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                    getOrderSourceInfo(selectedTxDetail.transaction.source).badgeClass
                  )}>
                    {getOrderSourceInfo(selectedTxDetail.transaction.source).isStorefront ? (
                      <Globe className="w-3.5 h-3.5" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5" />
                    )}
                    {getOrderSourceInfo(selectedTxDetail.transaction.source).label}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {(selectedTxDetail.transaction.orderType || 'DINE_IN').replace('_', ' ')}
                    {selectedTxDetail.transaction.tableNumber ? ` (Meja ${selectedTxDetail.transaction.tableNumber})` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Tutup panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Hero Incoming Amount (Transaksi Masuk) */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                    Total Pembayaran
                  </span>
                  <div className="flex items-baseline gap-2">
                    <div id="tx-detail-title" className={cn(
                      "text-3xl sm:text-4xl font-normal font-inter tracking-tight",
                      selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED'
                        ? 'line-through text-slate-400 dark:text-slate-600'
                        : 'text-slate-900 dark:text-slate-100'
                    )}>
                      {selectedTxDetail.transaction.status !== 'CANCELLED' && selectedTxDetail.transaction.paymentStatus !== 'CANCELED' && (
                        <span className="text-emerald-600 font-normal mr-1">+</span>
                      )}
                      {formatCurrency(parseFloat(selectedTxDetail.transaction.grandTotal || '0'))}
                    </div>
                  </div>
                </div>

                {/* Clean Key-Value Properties (Like Reference Image) */}
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {/* Status */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Status</span>
                    {selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400">
                        Batal / Void
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Sukses
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Waktu Transaksi</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {(() => {
                        const d = new Date(selectedTxDetail.transaction.createdAt);
                        const { dateStr, timeStr } = formatFriendlyDate(d);
                        return `${dateStr} • ${timeStr}`;
                      })()}
                    </span>
                  </div>

                  {/* Customer (Hanya untuk Kasir POS, jika Storefront nama tidak ditampilkan) */}
                  {!getOrderSourceInfo(selectedTxDetail.transaction.source).isStorefront && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground block text-[11px]">Pelanggan</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {selectedTxDetail.transaction.customerName || 'Pelanggan Umum (Guest)'}
                      </span>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Metode Pembayaran</span>
                    <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">
                      {paymentMethodMap[selectedTxDetail.transaction.paymentMethod] || selectedTxDetail.transaction.paymentMethod || 'TUNAI'}
                    </span>
                  </div>

                  {/* Order Number & Transaction Hash with Copy */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[11px]">No. Pesanan / ID Transaksi</span>
                    <div className="flex items-center gap-2">
                      <span className="font-inter font-normal text-blue-600 dark:text-blue-400 text-xs">
                        {selectedTxDetail.transaction.orderNumber || `#${selectedTxDetail.transaction.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(e, selectedTxDetail.transaction.orderNumber || selectedTxDetail.transaction.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
                        title="Salin No. Transaksi"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Cashier / PIC (Hanya untuk Kasir POS, jika Storefront tidak perlu) */}
                  {!getOrderSourceInfo(selectedTxDetail.transaction.source).isStorefront && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground block text-[11px]">Kasir / Petugas</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedTxDetail.transaction.cashierName || 'Kasir Toko'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Breakdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between pb-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Item Pesanan
                    </h4>
                    <span className="text-xs text-muted-foreground font-inter font-normal">
                      {isLoadingDetail ? 'Memuat...' : `${selectedTxDetail.items.length} item`}
                    </span>
                  </div>

                  {isLoadingDetail ? (
                    <div className="py-3 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center animate-pulse">
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-1/3" />
                          </div>
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                        </div>
                      ))}
                    </div>
                  ) : selectedTxDetail.items.length === 0 ? (
                    <p className="py-3 text-xs text-muted-foreground italic">Tidak ada item tercatat.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {selectedTxDetail.items.map((item: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-start justify-between text-xs gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{item.quantity}×</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                            </div>
                            {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                              <div className="text-[11px] text-muted-foreground pl-5 flex flex-wrap gap-1">
                                {item.modifiers.map((m: any, mIdx: number) => (
                                  <span key={mIdx} className="inline-block bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-inter font-normal">
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
                          <div className="font-normal font-inter text-slate-900 dark:text-slate-100 text-right shrink-0">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Produk</span>
                    <span className="font-inter font-normal">{formatCurrency(parseFloat(selectedTxDetail.transaction.totalAmount || '0'))}</span>
                  </div>
                  {parseFloat(selectedTxDetail.transaction.discount || '0') > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Diskon {selectedTxDetail.transaction.promoCode ? `(${selectedTxDetail.transaction.promoCode})` : ''}</span>
                      <span className="font-inter font-normal">-{formatCurrency(parseFloat(selectedTxDetail.transaction.discount || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.tax || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak (PB1)</span>
                      <span className="font-inter font-normal">{formatCurrency(parseFloat(selectedTxDetail.transaction.tax || '0'))}</span>
                    </div>
                  )}
                  {parseFloat(selectedTxDetail.transaction.serviceCharge || '0') > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Biaya Layanan</span>
                      <span className="font-inter font-normal">{formatCurrency(parseFloat(selectedTxDetail.transaction.serviceCharge || '0'))}</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">Total Pembayaran</span>
                    <span className="font-normal text-lg font-inter text-primary">
                      {formatCurrency(parseFloat(selectedTxDetail.transaction.grandTotal || '0'))}
                    </span>
                  </div>
                </div>

                {/* Audit Void Alert */}
                {(selectedTxDetail.transaction.status === 'CANCELLED' || selectedTxDetail.transaction.paymentStatus === 'CANCELED') && selectedTxDetail.transaction.voidReason && (
                  <div className="border-l-4 border-l-red-500 bg-red-500/10 rounded-r-xl p-3.5 text-xs space-y-1">
                    <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Informasi Pembatalan (Void)
                    </div>
                    <p className="text-red-700 dark:text-red-300">
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

              {/* Footer Actions Pinned at Bottom */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/40">
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
                      className="rounded-xl text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG VOID TRANSAKSI (Smooth Spring Popup & Clean Hierarchy - Anti-Fraud Audit) */}
      <AnimatePresence>
        {selectedTxForVoid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              key="void-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmittingVoid && setSelectedTxForVoid(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog */}
            <motion.div
              key="void-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="void-dialog-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.12 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 flex flex-col p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleConfirmVoid} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <h3 id="void-dialog-title" className="text-base font-bold">Batalkan (Void) Transaksi</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transaksi yang dibatalkan akan ditandai <strong>BATAL</strong> dan tetap tersimpan di audit trail anti-fraud.
                  </p>
                </div>

                {/* Clean metadata without nested border box */}
                <div className="border-l-4 border-l-red-500 bg-red-500/10 rounded-r-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID Transaksi</span>
                    <span className="font-inter font-normal text-slate-800 dark:text-slate-200">{selectedTxForVoid.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">No. Order / Meja</span>
                    <span className="font-medium">
                      {selectedTxForVoid.orderNumber || '-'} {selectedTxForVoid.tableNumber ? `(Meja ${selectedTxForVoid.tableNumber})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Nominal Transaksi</span>
                    <span className="font-normal font-inter text-slate-900 dark:text-slate-100">{formatCurrency(parseFloat(selectedTxForVoid.grandTotal))}</span>
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

                <div className="flex items-center justify-end gap-2 pt-2">
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
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIPT PRINTER FOR REPRINT */}
      <ReceiptPrinter data={printData} settings={printSettings} printMode={printMode} />
    </div>
  );
}

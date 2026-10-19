'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPaymentMethodLabel } from '@/lib/utils/format';
import {
  Banknote,
  QrCode,
  CreditCard,
  ArrowRightLeft,
  Loader2,
  Delete,
  Check,
  X,
  Printer,
  ReceiptText,
  ChevronDown,
  ChefHat,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatTableDisplay, formatQueueNumber } from '@/lib/orders/queue-number';

export type PaymentMethodOption = 'cash' | 'qris_static' | 'qris_dynamic' | 'card' | 'transfer';

export interface OrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  posSettings?: any;
  onConfirm?: (payload: {
    paymentMethod: 'CASH' | 'QRIS_STATIC' | 'QRIS_DYNAMIC' | 'CARD' | 'TRANSFER';
    cashReceived?: number;
    change?: number;
    printReceipt?: boolean;
    rounding?: number;
    grandTotal?: number;
  }) => Promise<void>;
  onStatusChange?: (orderId: string, nextStatus: string) => Promise<void>;
  onToggleItem?: (orderId: string, itemId: string, isCompleted: boolean) => Promise<void>;
  onPrintReceipt?: (order: any, type: 'all' | 'customer' | 'kitchen') => void;
  onCheckMidtrans?: (order: any) => Promise<void>;
  isProcessing?: boolean;
  updatingOrderId?: string | null;
  syncingOrderId?: string | null;
}

function formatOrderDateTime(dateInput: Date | string): { dateStr: string; timeStr: string } {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const dateStr = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
    const timeStr =
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d) + ' WIB';
    return { dateStr, timeStr };
  } catch {
    return { dateStr: '', timeStr: '--:--' };
  }
}

export function OrderPaymentModal({
  isOpen,
  onClose,
  order,
  posSettings,
  onConfirm,
  onStatusChange,
  onToggleItem,
  onPrintReceipt,
  onCheckMidtrans,
  isProcessing = false,
  updatingOrderId,
  syncingOrderId,
}: OrderPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodOption>('cash');
  const [cashReceivedStr, setCashReceivedStr] = React.useState('');
  const [shouldPrintReceipt, setShouldPrintReceipt] = React.useState(true);

  const isPaid = order?.paymentStatus === 'PAID';

  const subtotal = React.useMemo(() => {
    if (!order) return 0;
    if (order.totalAmount && Number(order.totalAmount) > 0) {
      return Number(order.totalAmount);
    }
    return (order.items || []).reduce((sum: number, it: any) => sum + Number(it.subtotal || 0), 0);
  }, [order]);

  const discount = React.useMemo(() => Number(order?.discount || 0), [order]);
  const tax = React.useMemo(() => Number(order?.tax || 0), [order]);
  const serviceCharge = React.useMemo(() => Number(order?.serviceCharge || 0), [order]);
  const platformFee = React.useMemo(() => Number(order?.platformFee || 0), [order]);

  const rounding = React.useMemo(() => {
    if (!order) return 0;
    const existingRounding = Number(order.rounding || 0);
    if (existingRounding > 0) return existingRounding;
    if (!isPaid && posSettings?.posRounding) {
      const raw = Math.max(0, subtotal - discount + tax + serviceCharge + platformFee);
      const roundedInt = Math.round(raw);
      const remainder = roundedInt % 100;
      return remainder > 0 ? 100 - remainder : 0;
    }
    return 0;
  }, [order, isPaid, posSettings?.posRounding, subtotal, discount, tax, serviceCharge, platformFee]);

  const grandTotal = React.useMemo(() => {
    if (!order) return 0;
    const existingRounding = Number(order.rounding || 0);
    if (existingRounding > 0) {
      return parseFloat(order.grandTotal || '0') || 0;
    }
    if (!isPaid && posSettings?.posRounding && rounding > 0) {
      const raw = Math.max(0, subtotal - discount + tax + serviceCharge + platformFee);
      return Math.round(raw) + rounding;
    }
    return parseFloat(order.grandTotal || '0') || 0;
  }, [order, isPaid, posSettings?.posRounding, rounding, subtotal, discount, tax, serviceCharge, platformFee]);

  const totalItemsCount = React.useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  }, [order]);

  // Reset state when opened or order changed
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setCashReceivedStr('');
      setShouldPrintReceipt(true);
    }
  }, [isOpen, order?.id]);

  const cashReceived = React.useMemo(() => {
    return parseInt(cashReceivedStr.replace(/\D/g, ''), 10) || 0;
  }, [cashReceivedStr]);

  const change = React.useMemo(() => {
    return paymentMethod === 'cash' ? cashReceived - grandTotal : 0;
  }, [paymentMethod, cashReceived, grandTotal]);

  const isCashSufficient = React.useMemo(() => {
    return paymentMethod !== 'cash' || cashReceived >= grandTotal;
  }, [paymentMethod, cashReceived, grandTotal]);

  const handleNumpadInput = (val: string) => {
    if (val === 'CLEAR') {
      setCashReceivedStr('');
      return;
    }
    if (val === 'BACKSPACE') {
      setCashReceivedStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '00') {
      if (!cashReceivedStr || cashReceivedStr === '0') return;
      setCashReceivedStr((prev) => prev + '00');
      return;
    }
    setCashReceivedStr((prev) => (prev === '0' ? val : prev + val));
  };

  const handlePresetAmount = (amount: number) => {
    setCashReceivedStr(amount.toString());
  };

  // Smart suggested cash denominations
  const suggestedAmounts = React.useMemo(() => {
    const amounts = new Set<number>();
    const steps = [10000, 20000, 50000, 100000, 200000, 500000];
    for (const step of steps) {
      const rounded = Math.ceil(grandTotal / step) * step;
      if (rounded > grandTotal) {
        amounts.add(rounded);
      }
      if (amounts.size >= 3) break;
    }

    const sorted = Array.from(amounts).sort((a, b) => a - b);
    while (sorted.length < 3) {
      const last = sorted[sorted.length - 1] || grandTotal;
      sorted.push(last + 50000);
    }
    return sorted.slice(0, 3);
  }, [grandTotal]);

  const handleSubmitPayment = async () => {
    if (!isCashSufficient || isProcessing || !order || !onConfirm) return;

    const methodMap: Record<PaymentMethodOption, 'CASH' | 'QRIS_STATIC' | 'QRIS_DYNAMIC' | 'CARD' | 'TRANSFER'> = {
      cash: 'CASH',
      qris_static: 'QRIS_STATIC',
      qris_dynamic: 'QRIS_DYNAMIC',
      card: 'CARD',
      transfer: 'TRANSFER',
    };

    await onConfirm({
      paymentMethod: methodMap[paymentMethod],
      cashReceived: paymentMethod === 'cash' ? cashReceived : grandTotal,
      change: paymentMethod === 'cash' ? Math.max(0, change) : 0,
      printReceipt: shouldPrintReceipt,
      rounding,
      grandTotal,
    });
  };

  // Keyboard shortcut support
  React.useEffect(() => {
    if (!isOpen || isPaid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      if (paymentMethod === 'cash') {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          setCashReceivedStr((prev) => (prev === '0' ? e.key : prev + e.key));
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setCashReceivedStr((prev) => prev.slice(0, -1));
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setCashReceivedStr('');
        }
      }

      if (e.key === 'Enter' && isCashSufficient) {
        e.preventDefault();
        handleSubmitPayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPaid, paymentMethod, isCashSufficient, isProcessing, cashReceivedStr, grandTotal]);

  if (!order) return null;

  const queueLabel = formatQueueNumber(order.queueNumber, 3);
  const tableDisplay = formatTableDisplay(order.tableNumber, order.orderType);
  const { dateStr, timeStr } = formatOrderDateTime(order.createdAt);

  const orderTypeLabel =
    order.orderType === 'DINE_IN'
      ? 'Dine In'
      : order.orderType === 'TAKE_AWAY' || order.orderType === 'TAKEAWAY'
      ? 'Takeaway'
      : order.orderType === 'ONLINE'
      ? 'Online'
      : 'Pesanan';

  const paymentMethodDetails = [
    { id: 'cash', label: 'Tunai (Cash)', icon: Banknote },
    { id: 'qris_static', label: 'QRIS Statis Toko', icon: QrCode },
    { id: 'qris_dynamic', label: 'QRIS Dinamis Menuin', icon: QrCode },
    { id: 'card', label: 'Kartu EDC', icon: CreditCard },
    { id: 'transfer', label: 'Transfer Bank', icon: ArrowRightLeft },
  ] as const;

  const currentMethodItem = paymentMethodDetails.find((m) => m.id === paymentMethod) || paymentMethodDetails[0];
  const CurrentMethodIcon = currentMethodItem.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] sm:max-w-[460px] w-full p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl max-h-[92vh] overflow-y-auto scrollbar-hide flex flex-col gap-3"
      >
        {/* Header (Title + Close Button) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {isPaid ? 'Detail Pesanan' : 'Pembayaran Kasir'}
          </DialogTitle>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            aria-label="Tutup"
            title="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Customer & Order Header (Sama persis dengan kartu kanban) */}
        <div className="space-y-1">
          {/* Baris 1: Nama Pelanggan (kiri) sejajar dengan Nomor Antrean (kanan) */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
              {order.customerName || 'Tamu / Umum'}
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums shrink-0">
              {queueLabel}
            </span>
          </div>

          {/* Baris 2: Nomor Order (kiri) sejajar dengan Nomor Meja / Order Type (kanan) */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              #{order.orderNumber || '-'}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md tracking-tight shrink-0">
              {tableDisplay}
            </span>
          </div>

          {/* Baris 3: Tanggal & Waktu */}
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium pt-1.5 pb-0.5">
            <span>{dateStr}</span>
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Items List Table & Subtotal (Jarak Rapat & Kompak) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Items Header */}
          <div className="grid grid-cols-12 text-[10px] font-medium text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800/80 px-1">
            <span className="col-span-7">Items</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3 text-right">Price</span>
          </div>

          {/* Items Rows */}
          <div className="space-y-0.5 max-h-44 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-hide">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className={cn(
                  'grid grid-cols-12 items-center text-xs py-1 px-1 rounded transition-colors',
                  onToggleItem && 'group/item cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
                onClick={() => {
                  if (onToggleItem) {
                    onToggleItem(order.id, item.id, !item.isCompleted);
                  }
                }}
                title={onToggleItem ? 'Klik untuk menandai menu selesai/belum' : undefined}
              >
                <div className="col-span-7 flex items-center gap-1.5 min-w-0 pr-1">
                  <div
                    className={cn(
                      'w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors',
                      item.isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-70 group-hover/item:opacity-100'
                    )}
                  >
                    {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        'truncate text-xs block leading-tight',
                        item.isCompleted
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 font-normal'
                      )}
                    >
                      {item.productName}
                    </span>
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 italic block truncate">
                        "{item.notes}"
                      </span>
                    )}
                  </div>
                </div>
                <span className="col-span-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                  {item.quantity}
                </span>
                <span className="col-span-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                  {formatCurrency(Number(item.subtotal || item.price * item.quantity || 0))}
                </span>
              </div>
            ))}
          </div>

          {/* Subtotal & Fee Breakdown (Jarak rapat ke items) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs font-normal">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Diskon {order.promoCode ? `(${order.promoCode})` : ''}</span>
                <span className="tabular-nums font-semibold">-{formatCurrency(discount)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Pajak (PB1)</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  +{formatCurrency(tax)}
                </span>
              </div>
            )}

            {serviceCharge > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Biaya Layanan</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  +{formatCurrency(serviceCharge)}
                </span>
              </div>
            )}

            {platformFee > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Biaya Platform</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  +{formatCurrency(platformFee)}
                </span>
              </div>
            )}

            {rounding > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Pembulatan (Rounding)</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  +{formatCurrency(rounding)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Informasi Pembayaran & Status / Payment Processing */}
        {isPaid ? (
          /* Case 1: Order is Already Paid (Detail Pesanan) */
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Metadata Grid (Clean 2x2 Grid, Aligned Badges, No Borders, px-2) */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Status Pembayaran</span>
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Lunas
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right flex flex-col items-end">
                <span className="text-[11px] text-slate-400 font-medium block">Metode Bayar</span>
                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {formatPaymentMethodLabel(order.paymentMethod)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Tipe Pemesanan</span>
                <div className="flex items-center">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {orderTypeLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right flex flex-col items-end">
                <span className="text-[11px] text-slate-400 font-medium block">Kasir / Saluran</span>
                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-full">
                    {order.source === 'POS' ? 'Kasir Utama' : 'Self Order (QR)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Tepat 2 Tombol (Struk Pelanggan & Tombol Proses Utama) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Tombol 1: Struk Pelanggan */}
              {onPrintReceipt && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintReceipt(order, 'customer')}
                  className={cn(
                    "h-10 text-xs font-semibold rounded-full border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-2xs gap-1.5 cursor-pointer transition-colors",
                    (!onStatusChange || !['NEW', 'PROCESSING', 'READY'].includes(order.status)) && "col-span-2"
                  )}
                  title={posSettings?.kitchenPrintEnabled ? "Cetak struk pelanggan & tiket dapur (otomatis aktif dari pengaturan)" : "Cetak struk pelanggan"}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Struk Pelanggan</span>
                </Button>
              )}

              {/* Tombol 2: Tombol Proses Utama */}
              {onStatusChange && (
                <>
                  {order.status === 'NEW' && (
                    <Button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => onStatusChange(order.id, 'PROCESSING')}
                      className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-xs transition-transform active:scale-98 gap-1.5 cursor-pointer"
                    >
                      {updatingOrderId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <ChefHat className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">Mulai Siapkan</span>
                    </Button>
                  )}

                  {order.status === 'PROCESSING' && (
                    <Button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => onStatusChange(order.id, 'READY')}
                      className="h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-semibold shadow-xs transition-transform active:scale-98 gap-1.5 cursor-pointer"
                    >
                      {updatingOrderId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">Tandai Siap</span>
                    </Button>
                  )}

                  {order.status === 'READY' && (
                    <Button
                      type="button"
                      disabled={updatingOrderId === order.id}
                      onClick={() => onStatusChange(order.id, 'COMPLETED')}
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-xs transition-transform active:scale-98 gap-1.5 cursor-pointer"
                    >
                      {updatingOrderId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">Selesaikan</span>
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Midtrans Online Check button if pending online */}
            {order.status === 'PENDING' && (order.orderType === 'ONLINE' || order.paymentMethod === 'ONLINE') && onCheckMidtrans && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onCheckMidtrans(order)}
                disabled={syncingOrderId === order.id}
                className="w-full h-9 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-semibold gap-1.5 disabled:opacity-50 rounded-full cursor-pointer"
              >
                {syncingOrderId === order.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Periksa Status Pembayaran Online
              </Button>
            )}
          </div>
        ) : (
          /* Case 2: Unpaid Order (Cashier Payment View) */
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Payment Method Dropdown */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Metode Pembayaran
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <CurrentMethodIcon className="w-4 h-4 text-blue-600" />
                      <span className="truncate">{currentMethodItem.label}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[260px] p-1 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
                >
                  {paymentMethodDetails.map((method) => {
                    const Icon = method.icon;
                    return (
                      <DropdownMenuItem
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethodOption)}
                        className={cn(
                          'text-xs py-2 px-2.5 rounded-lg flex items-center gap-2 font-medium cursor-pointer',
                          paymentMethod === method.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                        <span>{method.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {paymentMethod === 'cash' ? (
              /* Cash Mode: Large Amount Display, Preset Chips, 3x4 Numpad */
              <div className="space-y-2.5">
                {/* Amount Display */}
                <div className="py-1 flex flex-col items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums flex items-center justify-center">
                    <span className="text-slate-400 font-normal mr-1 text-xl sm:text-2xl">Rp</span>
                    <span>{cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : '0'}</span>
                    <span className="w-0.5 h-5 sm:h-6 bg-blue-600 animate-pulse ml-0.5 inline-block" />
                  </div>

                  {/* Kembalian / Kurang Status Badge */}
                  {cashReceived > 0 && (
                    <div
                      className={cn(
                        'mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        change >= 0
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      )}
                    >
                      <span>
                        {change >= 0
                          ? `Kembalian: ${formatCurrency(change)}`
                          : `Kurang: ${formatCurrency(Math.abs(change))}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Preset Chips (Rounded Full) */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(grandTotal)}
                    className="py-1.5 px-1 rounded-full bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 font-semibold text-xs text-center border border-blue-200/60 dark:border-blue-900/40 transition-colors cursor-pointer active:scale-95"
                  >
                    Uang Pas
                  </button>
                  {suggestedAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className="py-1.5 px-1 rounded-full bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs text-center border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95 tabular-nums truncate"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>

                {/* 3x4 Touch Numpad */}
                <div className="grid grid-cols-3 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'BACKSPACE'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleNumpadInput(btn)}
                      className={cn(
                        'h-9 sm:h-10 rounded-xl text-base font-medium flex items-center justify-center transition-all active:scale-[0.96] cursor-pointer select-none border border-slate-200/70 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs',
                        btn === 'BACKSPACE' && 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {btn === 'BACKSPACE' ? <Delete className="w-4 h-4 stroke-[2]" /> : btn}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Non-Cash Guidance */
              <div className="space-y-2 py-1">
                {paymentMethod === 'qris_static' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      QRIS Statis Toko
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Arahkan pelanggan memindai QRIS fisik toko nominal{' '}
                      <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>.
                    </p>
                  </div>
                )}

                {paymentMethod === 'qris_dynamic' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 mx-auto flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      QRIS Dinamis Menuin
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Nominal otomatis terkunci sebesar{' '}
                      <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>.
                    </p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 mx-auto flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Mesin EDC Toko
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Gesek atau tap kartu pada EDC untuk nominal{' '}
                      <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>.
                    </p>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 mx-auto flex items-center justify-center">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Transfer Bank Manual
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Pastikan dana transfer pelanggan sudah masuk mutasi sebelum menyelesaikan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Print Receipt Checkbox */}
            <div className="pt-0.5 px-0.5 flex items-center justify-between text-xs">
              <label
                htmlFor="modal-print-receipt-check"
                className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 font-medium select-none"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-all',
                    shouldPrintReceipt
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  )}
                  onClick={() => setShouldPrintReceipt(!shouldPrintReceipt)}
                >
                  {shouldPrintReceipt && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Cetak struk belanja transaksi
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                {shouldPrintReceipt ? 'Otomatis' : 'Lewati'}
              </span>
            </div>

            {/* Bottom Action Buttons: Tepat 2 Tombol (Struk Pelanggan & Bayar Sekarang) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onPrintReceipt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onPrintReceipt(order, 'customer')}
                  className="h-10 text-xs font-semibold rounded-full border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-2xs gap-1.5 cursor-pointer"
                  title={posSettings?.kitchenPrintEnabled ? "Cetak struk tagihan & tiket dapur" : "Cetak struk tagihan"}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Struk Pelanggan</span>
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmitPayment}
                disabled={!isCashSufficient || isProcessing}
                className={cn(
                  "h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5",
                  !onPrintReceipt && "col-span-2"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="truncate">Memproses...</span>
                  </>
                ) : (
                  <span className="truncate">Bayar Sekarang</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

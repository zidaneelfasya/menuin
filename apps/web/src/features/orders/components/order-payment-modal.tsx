'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatPaymentMethodLabel } from '@/lib/utils/format';
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
  Clock,
  ChefHat,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
  UtensilsCrossed,
  ShoppingBag,
  Store,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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

function getTableBadge(order: { tableNumber?: string | null; orderType?: string | null }) {
  if (order.tableNumber) {
    const raw = order.tableNumber.trim();
    const cleaned = raw.replace(/^meja\s*/i, '').trim();
    if (/^\d+$/.test(cleaned)) {
      return {
        label: cleaned.padStart(2, '0'),
        isTable: true,
      };
    }
    return {
      label: cleaned.toUpperCase().substring(0, 3),
      isTable: true,
    };
  }
  const isTakeaway = order.orderType === 'TAKE_AWAY' || order.orderType === 'TAKEAWAY';
  if (isTakeaway) return { label: 'TA', isTable: false };
  if (order.orderType === 'ONLINE') return { label: 'ON', isTable: false };
  return { label: 'POS', isTable: false };
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

  // Smart suggested cash denominations (guarantee 3 items so presets have exactly 4 items)
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

  const tableBadge = getTableBadge(order);
  const { dateStr, timeStr } = formatOrderDateTime(order.createdAt);

  const displayTable = order.tableNumber
    ? order.tableNumber.trim().toLowerCase().startsWith('meja')
      ? order.tableNumber.trim()
      : `Meja ${order.tableNumber.trim()}`
    : 'Bawa Pulang';

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
        className="max-w-[780px] sm:max-w-[800px] w-full p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header (Payment / Detail Title + Close Button) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {isPaid ? 'Detail Pesanan' : 'Payment'}
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

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-3.5">
          {/* LEFT COLUMN: Customer Info + Transaction Details Card */}
          <div className="flex flex-col space-y-3">
            {/* Customer Info Section */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Customer Info
              </span>
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Clean Slate Table Badge */}
                  <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {tableBadge.label}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {order.customerName || 'Tamu / Umum'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Order #{order.orderNumber || '-'} • {orderTypeLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  <div>{dateStr}</div>
                  <div className="text-slate-400">{timeStr}</div>
                </div>
              </div>
            </div>

            {/* Transaction Details (Clean Card — No AI-slop Sawtooth) */}
            <div className="bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Transaction Details
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {totalItemsCount} Menu
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide py-0.5">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between text-sm"
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                        {item.productName}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 pt-0.5 tabular-nums">
                        {formatCurrency(Number(item.price || (item.subtotal ? item.subtotal / item.quantity : 0)))}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 italic pt-0.5">
                          "{item.notes}"
                        </div>
                      )}
                    </div>

                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0 pt-0.5">
                      {item.quantity}x
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Fee Breakdown */}
              <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
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
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      +{formatCurrency(tax)}
                    </span>
                  </div>
                )}

                {serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Biaya Layanan</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      +{formatCurrency(serviceCharge)}
                    </span>
                  </div>
                )}

                {platformFee > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Biaya Platform</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      +{formatCurrency(platformFee)}
                    </span>
                  </div>
                )}

                {rounding > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Pembulatan (Rounding)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      +{formatCurrency(rounding)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/70 dark:border-slate-800 font-semibold text-sm">
                  <span className="text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-sm sm:text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Print Actions Underneath Left Card */}
            {onPrintReceipt && (
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintReceipt(order, 'customer')}
                  className="h-8 text-xs font-medium rounded-lg border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-2xs gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Struk Pelanggan</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintReceipt(order, 'kitchen')}
                  className="h-8 text-xs font-medium rounded-lg border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-2xs gap-1.5 cursor-pointer"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tiket Dapur</span>
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Payment Processing OR Order Detail Status Progression */}
          <div className="flex flex-col space-y-3">
            {!isPaid ? (
              /* Case 1: Unpaid Order (Cashier Payment View) */
              <div className="space-y-3">
                {/* Select a payment method */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Select a payment method
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <CurrentMethodIcon className="w-4 h-4 text-[#0e59f9]" />
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
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0e59f9] dark:text-blue-300 font-semibold'
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
                      <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums flex items-center justify-center">
                        <span className="text-slate-400 font-normal mr-1 text-2xl sm:text-3xl">Rp</span>
                        <span>{cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : '0'}</span>
                        <span className="w-0.5 h-6 sm:h-7 bg-[#0e59f9] animate-pulse ml-0.5 inline-block" />
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

                    {/* Preset Chips (Menuin Slate & Blue Palette — No AI-slop Neon Green) */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePresetAmount(grandTotal)}
                        className="py-1.5 px-1 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/50 text-[#0e59f9] dark:text-blue-300 font-semibold text-xs text-center border border-blue-200/60 dark:border-blue-900/40 transition-colors cursor-pointer active:scale-95"
                      >
                        Uang Pas
                      </button>
                      {suggestedAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handlePresetAmount(amt)}
                          className="py-1.5 px-1 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs text-center border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer active:scale-95 tabular-nums truncate"
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>

                    {/* 3x4 Touch Numpad (Clean, Structured) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'BACKSPACE'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => handleNumpadInput(btn)}
                          className={cn(
                            'h-10 sm:h-11 rounded-lg text-base font-medium flex items-center justify-center transition-all active:scale-[0.96] cursor-pointer select-none border border-slate-200/70 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs',
                            btn === 'BACKSPACE' && 'text-slate-500 hover:text-slate-800'
                          )}
                        >
                          {btn === 'BACKSPACE' ? <Delete className="w-4 h-4 stroke-[2]" /> : btn}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Non-Cash Guidance (QRIS, EDC, Transfer) */
                  <div className="space-y-3 py-1">
                    {paymentMethod === 'qris_static' && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
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
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0e59f9] mx-auto flex items-center justify-center">
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
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 mx-auto flex items-center justify-center">
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
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
                        <div className="w-9 h-9 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 mx-auto flex items-center justify-center">
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
                          ? 'bg-[#0e59f9] border-[#0e59f9] text-white'
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

                {/* Bottom Action Button (Pay Now) */}
                <Button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={!isCashSufficient || isProcessing}
                  className="w-full h-11 bg-[#0e59f9] hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Pembayaran...</span>
                    </>
                  ) : (
                    <span>Pay Now (Enter)</span>
                  )}
                </Button>
              </div>
            ) : (
              /* Case 2: Order is Already Paid (Detail Pesanan View) */
              <div className="space-y-3.5 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Informasi Pembayaran & Status
                  </span>

                  {/* Payment Details Card */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                      <span className="text-xs text-slate-500 font-medium">Status Pembayaran</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lunas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Metode Bayar</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatPaymentMethodLabel(order.paymentMethod)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Tipe Pemesanan</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {orderTypeLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Meja / Lokasi</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {displayTable}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">Kasir / Saluran</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.source === 'POS' ? 'Kasir Utama' : 'Self Order (QR)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Midtrans Online Check button if pending online */}
                  {order.status === 'PENDING' && (order.orderType === 'ONLINE' || order.paymentMethod === 'ONLINE') && onCheckMidtrans && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCheckMidtrans(order)}
                      disabled={syncingOrderId === order.id}
                      className="w-full h-9 text-xs border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-semibold gap-1.5 disabled:opacity-50 rounded-lg"
                    >
                      {syncingOrderId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Periksa Status Pembayaran Midtrans
                    </Button>
                  )}
                </div>

                {/* Status Progression Button at Bottom */}
                {onStatusChange && (
                  <div className="pt-2">
                    {order.status === 'NEW' && (
                      <Button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => onStatusChange(order.id, 'PROCESSING')}
                        className="w-full h-11 bg-[#0e59f9] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.99] gap-2 cursor-pointer"
                      >
                        {updatingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChefHat className="w-4 h-4" />
                        )}
                        <span>Mulai Siapkan Pesanan</span>
                      </Button>
                    )}

                    {order.status === 'PROCESSING' && (
                      <Button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => onStatusChange(order.id, 'READY')}
                        className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.99] gap-2 cursor-pointer"
                      >
                        {updatingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Tandai Siap Disajikan</span>
                      </Button>
                    )}

                    {order.status === 'READY' && (
                      <Button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() => onStatusChange(order.id, 'COMPLETED')}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.99] gap-2 cursor-pointer"
                      >
                        {updatingOrderId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        <span>Selesaikan Pesanan</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

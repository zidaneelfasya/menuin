'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  ArrowRightLeft, 
  Loader2, 
  Delete, 
  Check, 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike,
  X
} from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalAmount: number;
  onConfirm: (payload: {
    cashReceived: number;
    change: number;
    paymentMethod: string;
    orderType: string;
    customerName?: string;
    tableNumber?: string;
    discount: number;
    promoCode?: string;
    tax: number;
    serviceCharge: number;
    platformFee: number;
    grandTotal: number;
  }) => Promise<void>;
  posSettings: any;
}

export function PaymentModal({
  isOpen,
  onClose,
  subtotalAmount,
  onConfirm,
  posSettings,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'qris' | 'card' | 'transfer'>('cash');
  const [cashReceivedStr, setCashReceivedStr] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { orderType, customerName, tableNumber, appliedPromo, discount: storeDiscount } = useCartStore();

  // Reset state when opened
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setCashReceivedStr('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Rates
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const discountAmount = storeDiscount || (appliedPromo ? appliedPromo.discountAmount : 0);

  const taxableSubtotal = Math.max(0, subtotalAmount - discountAmount);
  const taxAmount = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
  const serviceChargeAmount = serviceRate > 0 ? (taxableSubtotal * serviceRate) / 100 : 0;
  const grandTotal = Math.round(taxableSubtotal + taxAmount + serviceChargeAmount);

  // Platform commissions (for online food orders)
  let platformCommissionRate = 0;
  if (orderType === 'GRABFOOD') platformCommissionRate = parseFloat(posSettings?.grabFoodFeeRate || '20');
  else if (orderType === 'SHOPEEFOOD') platformCommissionRate = parseFloat(posSettings?.shopeeFoodFeeRate || '20');
  else if (orderType === 'GOFOOD') platformCommissionRate = parseFloat(posSettings?.goFoodFeeRate || '20');

  const platformFeeAmount = (taxableSubtotal * platformCommissionRate) / 100;

  const cashReceived = parseInt(cashReceivedStr.replace(/\D/g, ''), 10) || 0;
  const change = paymentMethod === 'cash' ? cashReceived - grandTotal : 0;
  const isCashSufficient = paymentMethod !== 'cash' || cashReceived >= grandTotal;

  // Keyboard support for cash input & Enter to submit
  React.useEffect(() => {
    if (!isOpen) return;

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
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMethod, isCashSufficient, isProcessing, cashReceivedStr, grandTotal]);

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
    // Round to nearest 10k, 20k, 50k, 100k
    const next10k = Math.ceil(grandTotal / 10000) * 10000;
    const next20k = Math.ceil(grandTotal / 20000) * 20000;
    const next50k = Math.ceil(grandTotal / 50000) * 50000;
    const next100k = Math.ceil(grandTotal / 100000) * 100000;

    if (next10k > grandTotal) amounts.add(next10k);
    if (next20k > grandTotal) amounts.add(next20k);
    if (next50k > grandTotal) amounts.add(next50k);
    if (next100k > grandTotal) amounts.add(next100k);

    const sorted = Array.from(amounts).sort((a, b) => a - b);
    return sorted.slice(0, 3);
  }, [grandTotal]);

  const handleSubmit = async () => {
    if (!isCashSufficient || isProcessing) return;

    setIsProcessing(true);
    await onConfirm({
      cashReceived: paymentMethod === 'cash' ? cashReceived : grandTotal,
      change: Math.max(0, change),
      paymentMethod,
      orderType: orderType || 'DINE_IN',
      customerName: customerName || undefined,
      tableNumber: tableNumber || undefined,
      discount: discountAmount,
      promoCode: appliedPromo?.name,
      tax: taxAmount,
      serviceCharge: serviceChargeAmount,
      platformFee: platformFeeAmount,
      grandTotal,
    });
    setIsProcessing(false);
  };

  // Human-readable Order Type description
  const orderTypeLabel = 
    orderType === 'DINE_IN' ? 'Makan di Tempat' :
    orderType === 'TAKEAWAY' ? 'Bawa Pulang' :
    orderType === 'GRABFOOD' ? 'GrabFood' :
    orderType === 'SHOPEEFOOD' ? 'ShopeeFood' :
    orderType === 'GOFOOD' ? 'GoFood' : 'Delivery';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[460px] p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-border/80 shadow-xl">
        <DialogHeader className="p-4 pb-3 border-b bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                Pembayaran Kasir
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">{orderTypeLabel}</span>
                {tableNumber && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 font-medium">Meja {tableNumber}</span>
                  </>
                )}
                {customerName && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="truncate">{customerName}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {/* Grand Total Badge */}
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block font-medium leading-none mb-0.5">Total Tagihan</span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 leading-tight">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* High-visibility Close Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                aria-label="Tutup"
                title="Tutup"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-3.5">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer",
                paymentMethod === 'cash'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={cn(
                "py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer",
                paymentMethod === 'qris'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer",
                paymentMethod === 'card'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CreditCard className="w-4 h-4" />
              <span>Kartu EDC</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={cn(
                "py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer",
                paymentMethod === 'transfer'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Cash Payment View (Touch Numpad & Tenders) */}
          {paymentMethod === 'cash' ? (
            <div className="space-y-3">
              {/* Cash Display & Change Status */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Uang Diterima</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {cashReceived > 0 ? formatCurrency(cashReceived) : 'Rp 0'}
                    </span>
                    {cashReceivedStr && (
                      <button
                        type="button"
                        onClick={() => setCashReceivedStr('')}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Kembalian / Kekurangan indicator */}
                {cashReceived > 0 && (
                  <div
                    className={cn(
                      "flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors",
                      change >= 0
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    )}
                  >
                    <span className="font-medium">
                      {change >= 0 ? 'Kembalian Pelanggan' : 'Uang Kurang'}
                    </span>
                    <span className="font-semibold text-sm">
                      {formatCurrency(Math.abs(change))}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide text-xs">
                <button
                  type="button"
                  onClick={() => handlePresetAmount(grandTotal)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 font-semibold text-blue-600 dark:text-blue-400 shrink-0 transition-colors cursor-pointer"
                >
                  Uang Pas
                </button>
                {suggestedAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetAmount(amt)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 font-medium text-foreground shrink-0 transition-colors cursor-pointer"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* 3x4 Touch Numpad */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'BACKSPACE'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleNumpadInput(btn)}
                    className={cn(
                      "h-11 rounded-xl text-base font-medium flex items-center justify-center border transition-all active:scale-[0.97] cursor-pointer select-none",
                      btn === 'BACKSPACE'
                        ? "bg-slate-100 dark:bg-slate-800/80 text-muted-foreground border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                        : "bg-white dark:bg-slate-900 text-foreground border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 shadow-2xs"
                    )}
                  >
                    {btn === 'BACKSPACE' ? <Delete className="w-5 h-5" /> : btn}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Non-cash Payment Guidance */
            <div className="py-6 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                {paymentMethod === 'qris' && <QrCode className="w-5 h-5" />}
                {paymentMethod === 'card' && <CreditCard className="w-5 h-5" />}
                {paymentMethod === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
              </div>
              <p className="text-xs font-semibold text-foreground">
                {paymentMethod === 'qris' && 'Instruksi Pembayaran QRIS'}
                {paymentMethod === 'card' && 'Instruksi Mesin EDC'}
                {paymentMethod === 'transfer' && 'Instruksi Transfer Bank'}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                {paymentMethod === 'qris' && 'Tunjukkan kode QR dinamis/statis kepada pelanggan. Setelah verifikasi pembayaran berhasil di aplikasi, klik Selesaikan.'}
                {paymentMethod === 'card' && 'Gesek atau tap kartu pelanggan pada terminal EDC kasir. Pastikan struk EDC tercetak.'}
                {paymentMethod === 'transfer' && 'Verifikasi dana masuk pada mutasi rekening toko sebelum menyelesaikan transaksi ini.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 pt-3 border-t bg-slate-50/70 dark:bg-slate-900/50 flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-11 text-xs rounded-xl font-medium"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isCashSufficient || isProcessing}
            className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Selesaikan & Cetak Struk (Enter)</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

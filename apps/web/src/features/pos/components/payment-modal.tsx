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
    rounding?: number;
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
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'qris_static' | 'qris_dynamic' | 'card' | 'transfer'>('cash');
  const [cashReceivedStr, setCashReceivedStr] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const { orderType, customerName, tableNumber, appliedPromo, discount: storeDiscount } = useCartStore();
  // QRIS dinamis hanya aktif bila outlet sudah terhubung ke DOKU (lihat getPosQrisAvailability).
  const qrisDynamicEnabled = Boolean(posSettings?.qrisDynamicEnabled);

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
  const rawTotal = taxableSubtotal + taxAmount + serviceChargeAmount;
  let roundingAmount = 0;
  if (posSettings?.posRounding) {
    const roundedInt = Math.round(rawTotal);
    const remainder = roundedInt % 100;
    if (remainder > 0) {
      roundingAmount = 100 - remainder;
    }
  }
  const grandTotal = Math.round(rawTotal) + roundingAmount;

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

  const submittingRef = React.useRef(false);

  const handleSubmit = async () => {
    if (!isCashSufficient || isProcessing || submittingRef.current) return;

    submittingRef.current = true;
    setIsProcessing(true);
    try {
      await onConfirm({
        cashReceived: paymentMethod === 'cash' ? cashReceived : grandTotal,
        change: Math.max(0, change),
        paymentMethod,
        orderType: orderType || 'DINE_IN',
        customerName: customerName || undefined,
        tableNumber: tableNumber || undefined,
        discount: discountAmount,
        promoCode: appliedPromo?.code || appliedPromo?.name || undefined,
        tax: taxAmount,
        serviceCharge: serviceChargeAmount,
        platformFee: platformFeeAmount,
        rounding: roundingAmount,
        grandTotal,
      });
    } finally {
      setIsProcessing(false);
      submittingRef.current = false;
    }
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
      <DialogContent showCloseButton={false} className="max-w-[460px] p-0 overflow-hidden rounded-2xl bg-white border border-[#EAEFF8] shadow-xl">
        <DialogHeader className="p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold text-slate-900 truncate">
                Pembayaran Kasir
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700 shrink-0">{orderTypeLabel}</span>
                {tableNumber && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 font-medium text-slate-600">Meja {tableNumber}</span>
                  </>
                )}
                {customerName && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="truncate text-slate-600">{customerName}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {/* Grand Total Badge */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase leading-none mb-0.5">Total Tagihan</span>
                <span className="text-xl font-semibold text-[#0e59f9] leading-tight font-financial tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* High-visibility Close Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                aria-label="Tutup"
                title="Tutup"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-3.5">
          {/* Payment Method Selector Tabs (5 Options: Tunai, QRIS Toko, QR Dinamis, EDC, Transfer) */}
          <div className="grid grid-cols-5 p-1 bg-white dark:bg-slate-900 rounded-full gap-1 shadow-md">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "py-2 px-1 rounded-full text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center",
                paymentMethod === 'cash'
                  ? "bg-[#0e59f9] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
              )}
            >
              <Banknote className={cn("w-4 h-4 shrink-0", paymentMethod === 'cash' ? "text-white" : "text-slate-500")} />
              <span className="truncate w-full text-[11px] leading-tight">Tunai</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('qris_static')}
              className={cn(
                "py-2 px-1 rounded-full text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center",
                paymentMethod === 'qris_static'
                  ? "bg-[#0e59f9] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
              )}
              title="QRIS Statis Toko (Stiker fisik merchant, bebas fee MDR)"
            >
              <QrCode className={cn("w-4 h-4 shrink-0", paymentMethod === 'qris_static' ? "text-white" : "text-slate-500")} />
              <span className="truncate w-full text-[11px] leading-tight">QRIS Toko</span>
            </button>
            <button
              type="button"
              onClick={() => qrisDynamicEnabled && setPaymentMethod('qris_dynamic')}
              disabled={!qrisDynamicEnabled}
              className={cn(
                "py-2 px-1 rounded-full text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed",
                paymentMethod === 'qris_dynamic'
                  ? "bg-[#0e59f9] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
              )}
              title={qrisDynamicEnabled
                ? "QRIS Dinamis (nominal terkunci otomatis, dikonfirmasi DOKU)"
                : "QRIS Dinamis belum aktif untuk outlet ini"}
            >
              <QrCode className={cn("w-4 h-4 shrink-0", paymentMethod === 'qris_dynamic' ? "text-white" : "text-[#0e59f9]")} />
              <span className="truncate w-full text-[11px] leading-tight">QR Dinamis</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "py-2 px-1 rounded-full text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center",
                paymentMethod === 'card'
                  ? "bg-[#0e59f9] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
              )}
            >
              <CreditCard className={cn("w-4 h-4 shrink-0", paymentMethod === 'card' ? "text-white" : "text-slate-500")} />
              <span className="truncate w-full text-[11px] leading-tight">Kartu EDC</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('transfer')}
              className={cn(
                "py-2 px-1 rounded-full text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center",
                paymentMethod === 'transfer'
                  ? "bg-[#0e59f9] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
              )}
            >
              <ArrowRightLeft className={cn("w-4 h-4 shrink-0", paymentMethod === 'transfer' ? "text-white" : "text-slate-500")} />
              <span className="truncate w-full text-[11px] leading-tight">Transfer</span>
            </button>
          </div>

          {/* Cash Payment View (Touch Numpad & Tenders) */}
          {paymentMethod === 'cash' ? (
            <div className="space-y-3">
              {/* Cash Display & Change Status */}
              <div className="p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Uang Diterima</span>
                  <div className="flex items-center gap-2">
                    <span className="font-financial tabular-nums text-2xl font-semibold text-slate-900">
                      {cashReceived > 0 ? formatCurrency(cashReceived) : 'Rp 0'}
                    </span>
                    {cashReceivedStr && (
                      <button
                        type="button"
                        onClick={() => setCashReceivedStr('')}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 hover:bg-slate-300 transition-colors font-medium cursor-pointer"
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
                      "flex items-center justify-between text-xs text-slate-600  py-1.5 rounded-lg transition-colors",
                      change >= 0
                        ? ""
                        : "bg-rose-50 text-rose-800 "
                    )}
                  >
                    <span className="font-medium">
                      {change >= 0 ? 'Kembalian Pelanggan' : 'Uang Kurang'}
                    </span>
                    <span className="font-semibold text-sm font-financial tabular-nums">
                      {formatCurrency(Math.abs(change))}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto  scrollbar-hide text-xs py-2">
                <button
                  type="button"
                  onClick={() => handlePresetAmount(grandTotal)}
                  className={cn(
                    "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all cursor-pointer font-financial tabular-nums text-xs",
                    cashReceived === grandTotal
                      ? "bg-[#0e59f9] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm-md font-medium"
                  )}
                >
                  Uang Pas
                </button>
                {suggestedAmounts.map((amt) => {
                  const isSelected = cashReceived === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handlePresetAmount(amt)}
                      className={cn(
                        "px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer font-financial tabular-nums text-xs",
                        isSelected
                          ? "bg-[#0e59f9] text-white shadow-xs font-semibold"
                          : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-sm-md font-medium"
                      )}
                    >
                      {formatCurrency(amt)}
                    </button>
                  );
                })}
              </div>

              {/* 3x4 Touch Numpad */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'BACKSPACE'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleNumpadInput(btn)}
                    className={cn(
                      "h-11 rounded-xl text-base font-medium flex items-center justify-center transition-all active:scale-[0.97] cursor-pointer select-none font-financial tabular-nums",
                      btn === 'BACKSPACE'
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                        : "text-slate-900 hover:bg-slate-100 active:bg-slate-200 font-semibold"
                    )}
                  >
                    {btn === 'BACKSPACE' ? <Delete className="w-5 h-5" /> : btn}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Non-cash Payment Guidance */
            <div className="space-y-3">
              {paymentMethod === 'qris_static' && (
                <div className="py-5 px-4 rounded-xl   text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600  mx-auto shadow-sm flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      QRIS Statis Toko
                    </p>
                    
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
                    Arahkan pelanggan memindai stiker QRIS fisik toko Anda dan mengetik nominal <span className="font-semibold text-slate-900 font-financial tabular-nums">{formatCurrency(grandTotal)}</span>. Setelah kasir memverifikasi dana masuk di notifikasi/mutasi m-banking toko, klik Selesaikan.
                  </p>
                </div>
              )}

              {paymentMethod === 'qris_dynamic' && (
                <div className="py-5 px-4 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9]/10 text-[#0e59f9] mx-auto shadow-sm flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      QRIS Dinamis Menuin
                    </p>
                    
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
                    Kode QR akan tampil dengan nominal terkunci <span className="font-semibold text-slate-900 font-financial tabular-nums">{formatCurrency(grandTotal)}</span>. Transaksi otomatis lunas setelah pembayaran dikonfirmasi DOKU. Kasir tidak perlu memeriksa mutasi.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="py-5 px-4 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 mx-auto shadow-sm flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Instruksi Mesin EDC Toko
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed font-normal">
                    Gesek atau tap kartu pelanggan pada terminal EDC kasir toko Anda. Pastikan struk transaksi EDC fisik telah berhasil keluar dari mesin.
                  </p>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="py-5 px-4 rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 mx-auto flex shadow-sm items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Instruksi Transfer Bank Manual
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed font-normal">
                    Verifikasi dana transfer pelanggan di mutasi rekening bank toko Anda sebelum menyelesaikan transaksi ini.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 pt-3 flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-11 text-xs border-none shadow-md rounded-full font-medium bg-white hover:bg-slate-100 text-slate-700 cursor-pointer transition-all"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isCashSufficient || isProcessing}
            className="flex-[2] h-11 bg-[#0e59f9] hover:bg-[#0b4de0] text-white rounded-full text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{paymentMethod === 'qris_dynamic' ? 'Tampilkan QR (Enter)' : 'Selesaikan & Cetak Struk'}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

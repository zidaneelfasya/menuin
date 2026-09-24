'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Tag, 
  Percent, 
  Bike, 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Check, 
  X, 
  Loader2, 
  Info,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { validatePromotion, getActivePromotions } from '@/lib/actions/promotions';
import { toast } from 'sonner';

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

export function PaymentModal({ isOpen, onClose, subtotalAmount, onConfirm, posSettings }: PaymentModalProps) {
  const [cashReceivedStr, setCashReceivedStr] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const [tableNumber, setTableNumber] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('cash');
  
  // Order Type / Channel
  const [orderType, setOrderType] = React.useState(
    posSettings?.posOrderTypeSelection === 'MANUAL' ? 'DINE_IN' : (posSettings?.posOrderTypeSelection || 'DINE_IN')
  );

  // Promo State
  const [appliedPromo, setAppliedPromo] = React.useState<{
    id: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [manualDiscount, setManualDiscount] = React.useState<number>(0);
  const [isValidatingPromo, setIsValidatingPromo] = React.useState(false);
  const [activePromosList, setActivePromosList] = React.useState<any[]>([]);

  // Load active promos when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCashReceivedStr('');
      setIsProcessing(false);
      setCustomerName('');
      setTableNumber('');
      setPaymentMethod('cash');
      setAppliedPromo(null);
      setManualDiscount(0);
      setOrderType(posSettings?.posOrderTypeSelection === 'MANUAL' ? 'DINE_IN' : (posSettings?.posOrderTypeSelection || 'DINE_IN'));
      
      getActivePromotions().then(res => {
        if (res.success && res.data) {
          setActivePromosList(res.data);
        }
      });
    }
  }, [isOpen, posSettings]);

  // Tax and rates
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const taxName = posSettings?.taxName || 'Pajak (PB1)';

  // Platform commission rates
  const grabRate = parseFloat(posSettings?.grabFoodFeeRate || '20');
  const shopeeRate = parseFloat(posSettings?.shopeeFoodFeeRate || '20');
  const goFoodRate = parseFloat(posSettings?.goFoodFeeRate || '20');

  // Calculations
  const discountAmount = (appliedPromo ? appliedPromo.discountAmount : 0) + manualDiscount;
  const taxableSubtotal = Math.max(0, subtotalAmount - discountAmount);
  const taxAmount = (taxableSubtotal * taxRate) / 100;
  const serviceChargeAmount = (taxableSubtotal * serviceRate) / 100;
  const grandTotal = taxableSubtotal + taxAmount + serviceChargeAmount;

  // Platform Fee calculation
  let platformCommissionRate = 0;
  if (orderType === 'GRABFOOD') platformCommissionRate = grabRate;
  else if (orderType === 'SHOPEEFOOD') platformCommissionRate = shopeeRate;
  else if (orderType === 'GOFOOD') platformCommissionRate = goFoodRate;

  const platformFeeAmount = (taxableSubtotal * platformCommissionRate) / 100;
  const estimatedNetAmount = grandTotal - platformFeeAmount;

  const cashReceived = parseInt(cashReceivedStr.replace(/\D/g, ''), 10) || 0;
  const change = paymentMethod === 'cash' ? (cashReceived - grandTotal) : 0;

  const handleSelectPromo = async (promo: any) => {
    if (appliedPromo?.id === promo.id) {
      setAppliedPromo(null);
      toast.info('Promo dibatalkan');
      return;
    }

    const minOrder = parseFloat(promo.minOrder || '0');
    if (subtotalAmount < minOrder) {
      toast.error(`Minimal transaksi Rp ${minOrder.toLocaleString('id-ID')} untuk menggunakan promo "${promo.name}"`);
      return;
    }

    setIsValidatingPromo(true);
    const res = await validatePromotion(promo.id, subtotalAmount);
    setIsValidatingPromo(false);

    if (res.success && res.data) {
      setAppliedPromo({
        id: res.data.id,
        name: res.data.name,
        discountAmount: res.data.discountAmount,
      });
      toast.success(`Promo "${res.data.name}" dipilih! Diskon ${formatCurrency(res.data.discountAmount)}`);
    } else {
      toast.error(res.error || 'Promo tidak dapat digunakan');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.info('Promo dibatalkan');
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setCashReceivedStr(rawValue);
  };

  const handleExactChange = () => {
    setCashReceivedStr(grandTotal.toString());
  };

  const handlePreset = (amount: number) => {
    setCashReceivedStr(amount.toString());
  };

  const requireCustomerName = posSettings?.customerNameRequired;
  const requireTableNumber = posSettings?.tableNumberRequired;
  const isCashSufficient = paymentMethod !== 'cash' || cashReceived >= grandTotal;
  const isFormValid = isCashSufficient && 
                      (!requireCustomerName || customerName.trim() !== '') && 
                      (!requireTableNumber || orderType !== 'DINE_IN' || tableNumber.trim() !== '') && 
                      orderType !== '';

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsProcessing(true);
    await onConfirm({
      cashReceived: paymentMethod === 'cash' ? cashReceived : grandTotal,
      change: Math.max(0, change),
      paymentMethod,
      orderType,
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

  // Generate suggested quick cash amounts based on grandTotal
  const suggestedAmounts = React.useMemo(() => {
    const amounts = new Set<number>();
    if (grandTotal < 20000) amounts.add(20000);
    if (grandTotal < 50000) amounts.add(50000);
    if (grandTotal < 100000) amounts.add(100000);

    const nearest10k = Math.ceil(grandTotal / 10000) * 10000;
    const nearest50k = Math.ceil(grandTotal / 50000) * 50000;
    const nearest100k = Math.ceil(grandTotal / 100000) * 100000;

    if (nearest10k > grandTotal) amounts.add(nearest10k);
    if (nearest50k > grandTotal) amounts.add(nearest50k);
    if (nearest100k > grandTotal) amounts.add(nearest100k);

    return Array.from(amounts).sort((a, b) => a - b).slice(0, 3);
  }, [grandTotal]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Pembayaran Kasir</DialogTitle>
          <DialogDescription className="text-center">
            Pilih channel penjualan, diskon/promo, dan selesaikan transaksi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* 1. CHANNEL / TIPE PESANAN */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Channel / Tipe Pesanan
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Button
                type="button"
                variant={orderType === 'DINE_IN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('DINE_IN')}
                className="flex flex-col h-auto py-2.5 px-2 text-xs gap-1"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>Dine-In</span>
              </Button>
              <Button
                type="button"
                variant={orderType === 'TAKEAWAY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('TAKEAWAY')}
                className="flex flex-col h-auto py-2.5 px-2 text-xs gap-1"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Takeaway</span>
              </Button>
              <Button
                type="button"
                variant={orderType === 'GRABFOOD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('GRABFOOD')}
                className={`flex flex-col h-auto py-2.5 px-2 text-xs gap-1 ${orderType === 'GRABFOOD' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-300 text-green-700 dark:text-green-400'}`}
              >
                <Bike className="h-4 w-4" />
                <span>GrabFood</span>
              </Button>
              <Button
                type="button"
                variant={orderType === 'SHOPEEFOOD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('SHOPEEFOOD')}
                className={`flex flex-col h-auto py-2.5 px-2 text-xs gap-1 ${orderType === 'SHOPEEFOOD' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-300 text-orange-700 dark:text-orange-400'}`}
              >
                <Bike className="h-4 w-4" />
                <span>ShopeeFood</span>
              </Button>
              <Button
                type="button"
                variant={orderType === 'GOFOOD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('GOFOOD')}
                className={`flex flex-col h-auto py-2.5 px-2 text-xs gap-1 ${orderType === 'GOFOOD' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-300 text-red-700 dark:text-red-400'}`}
              >
                <Bike className="h-4 w-4" />
                <span>GoFood</span>
              </Button>
              <Button
                type="button"
                variant={orderType === 'DELIVERY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('DELIVERY')}
                className="flex flex-col h-auto py-2.5 px-2 text-xs gap-1"
              >
                <Truck className="h-4 w-4" />
                <span>Delivery</span>
              </Button>
            </div>
          </div>

          {/* Customer / Table Info */}
          {(posSettings?.customerNameRequired || posSettings?.tableNumberRequired || orderType === 'DINE_IN') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Pelanggan {posSettings?.customerNameRequired && <span className="text-destructive">*</span>}</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Misal: Budi"
                  className="h-9 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              {orderType === 'DINE_IN' && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nomor Meja {posSettings?.tableNumberRequired && <span className="text-destructive">*</span>}</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Misal: Meja 05"
                    className="h-9 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. PROMO & VOUCHER SECTION */}
          <div className="p-3.5 bg-card border rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
                <Tag className="h-4 w-4" />
                Pilih Promo & Potongan Diskon
              </Label>
              {appliedPromo && (
                <button 
                  onClick={handleRemovePromo} 
                  className="text-xs text-destructive hover:underline flex items-center gap-0.5 font-medium"
                >
                  <X className="h-3.5 w-3.5" /> Batalkan Promo
                </button>
              )}
            </div>

            {appliedPromo ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-green-200/80 dark:bg-green-900/60 flex items-center justify-center text-green-700 dark:text-green-300">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{appliedPromo.name}</span>
                    <span className="text-[11px] text-green-700 dark:text-green-400">Promo berhasil diterapkan</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-green-700 dark:text-green-300">
                  -{formatCurrency(appliedPromo.discountAmount)}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {activePromosList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePromosList.map((p) => {
                      const minOrder = parseFloat(p.minOrder || '0');
                      const isEligible = subtotalAmount >= minOrder;
                      const val = parseFloat(p.value);
                      const discountTag = p.type === 'PERCENTAGE' ? `Diskon ${val}%` : `Potongan ${formatCurrency(val)}`;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isValidatingPromo}
                          onClick={() => handleSelectPromo(p)}
                          className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                            !isEligible 
                              ? 'opacity-60 bg-muted/40 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50' 
                              : 'bg-card hover:bg-primary/5 hover:border-primary/50 border-border active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-foreground line-clamp-1">{p.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                              {discountTag}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                            <span>{minOrder > 0 ? `Min. ${formatCurrency(minOrder)}` : 'Tanpa Min.'}</span>
                            <span className={`font-semibold ${isEligible ? 'text-primary' : 'text-muted-foreground'}`}>
                              {isEligible ? 'Pilih Promo ➔' : 'Belum Memenuhi'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-2 text-center bg-muted/30 rounded-lg">
                    Tidak ada promo aktif saat ini.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. CALCULATION BREAKDOWN */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal Produk:</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotalAmount)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                <span>Potongan Promo / Diskon:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{taxName} ({taxRate}%):</span>
                <span>+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {serviceRate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Biaya Layanan ({serviceRate}%):</span>
                <span>+{formatCurrency(serviceChargeAmount)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-bold text-sm">Total Tagihan:</span>
              <span className="font-extrabold text-2xl text-primary">{formatCurrency(grandTotal)}</span>
            </div>

            {/* Platform online food deduction info */}
            {platformCommissionRate > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="flex justify-between text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                  <span>Potongan Komisi {orderType} ({platformCommissionRate}%):</span>
                  <span>-{formatCurrency(platformFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold text-xs pt-1 border-t border-amber-200/50">
                  <span>Estimasi Bersih Diterima Toko:</span>
                  <span>{formatCurrency(estimatedNetAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. PAYMENT METHOD SELECTOR */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Metode Pembayaran</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('cash')}
                className="text-xs gap-1 h-10"
              >
                <Banknote className="h-4 w-4" />
                Tunai
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('qris')}
                className="text-xs gap-1 h-10"
              >
                <QrCode className="h-4 w-4" />
                QRIS
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('transfer')}
                className="text-xs gap-1 h-10"
              >
                <CreditCard className="h-4 w-4" />
                Transfer
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('card')}
                className="text-xs gap-1 h-10"
              >
                <CreditCard className="h-4 w-4" />
                Kartu
              </Button>
            </div>
          </div>

          {/* 5. CASH INPUT SECTION */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-1">
              <Label className="text-xs font-semibold">Jumlah Uang Diterima</Label>
              <Input
                type="text"
                autoFocus
                value={cashReceivedStr ? formatCurrency(cashReceived).replace('Rp', '').trim() : ''}
                onChange={handleCashChange}
                className="text-right text-2xl font-bold h-12"
                placeholder="0"
                disabled={isProcessing}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleExactChange} className="flex-1 text-xs" disabled={isProcessing}>
                  Uang Pas
                </Button>
                {suggestedAmounts.map((amt) => (
                  <Button key={amt} type="button" size="sm" variant="outline" onClick={() => handlePreset(amt)} className="flex-1 text-xs" disabled={isProcessing}>
                    {formatCurrency(amt)}
                  </Button>
                ))}
              </div>

              {cashReceived > 0 && (
                <div className={`p-3 rounded-xl text-center ${change >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  <span className="text-xs font-medium block mb-0.5">
                    {change >= 0 ? 'Kembalian' : 'Uang Kurang'}
                  </span>
                  <span className="text-2xl font-extrabold">
                    {formatCurrency(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-11" disabled={isProcessing}>
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="flex-1 h-11 text-base font-bold shadow-md" 
            disabled={!isFormValid || isProcessing}
          >
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Bayar & Cetak Struk'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike, 
  Tag, 
  X, 
  Check, 
  ChevronDown,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useCartStore } from '../stores/use-cart-store';
import { formatCurrency } from '@/lib/utils/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getActivePromotions, validatePromotion, validatePosPromoCode } from '@/lib/actions/promotions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getPosCardPalette, getPosCardPaletteByName, getProductInitials } from '../lib/pos-card-theme';

interface ShoppingCartProps {
  posSettings?: any;
  onCheckout?: () => void;
  isProcessing?: boolean;
}

export function ShoppingCart({ posSettings, onCheckout, isProcessing }: ShoppingCartProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = React.useState(false);
  const [activePromosList, setActivePromosList] = React.useState<any[]>([]);
  const [promoCodeInput, setPromoCodeInput] = React.useState('');
  const [isValidatingPromo, setIsValidatingPromo] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [promoTab, setPromoTab] = React.useState<'promo' | 'manual'>('promo');
  const [manualDiscountType, setManualDiscountType] = React.useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [manualDiscountValue, setManualDiscountValue] = React.useState('');

  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getSubtotal, 
    discount,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    appliedPromo,
    setAppliedPromo,
    displayMode
  } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loadPromos = React.useCallback(() => {
    getActivePromotions().then(res => {
      if (res.success && res.data) {
        setActivePromosList(res.data);
      }
    });
  }, []);

  const handleOpenPromoModal = () => {
    setPromoCodeInput('');
    setManualDiscountValue('');
    setPromoTab('promo');
    loadPromos();
    setIsPromoModalOpen(true);
  };

  const handleApplyPromoCode = async (codeToUse?: string) => {
    const code = (codeToUse || promoCodeInput).trim().toUpperCase();
    if (!code) {
      toast.error('Masukkan kode promo terlebih dahulu');
      return;
    }
    const subtotal = getSubtotal();
    setIsValidatingPromo(true);
    const res = await validatePosPromoCode(code, subtotal);
    setIsValidatingPromo(false);

    if (res.success && res.data) {
      setAppliedPromo({
        id: res.data.id,
        code: res.data.code,
        name: res.data.name,
        discountAmount: res.data.discountAmount,
      });
      setIsPromoModalOpen(false);
      setPromoCodeInput('');
      toast.success(`Promo "${res.data.name}" (${res.data.code}) diterapkan`);
    } else {
      toast.error(res.error || 'Promo tidak dapat digunakan');
    }
  };

  // Kasir langsung apply promo outlet dengan 1 klik
  const handleSelectPromo = async (promo: any) => {
    const subtotal = getSubtotal();
    const minOrder = parseFloat(promo.minOrder || '0');
    if (subtotal < minOrder) {
      toast.error(`Minimal belanja Rp ${minOrder.toLocaleString('id-ID')} untuk promo ini.`);
      return;
    }

    setIsValidatingPromo(true);
    const res = await validatePromotion(promo.id, subtotal);
    setIsValidatingPromo(false);

    if (res.success && res.data) {
      setAppliedPromo({
        id: res.data.id,
        code: res.data.code,
        name: res.data.name,
        discountAmount: res.data.discountAmount,
      });
      setIsPromoModalOpen(false);
      toast.success(`Diskon "${res.data.name}" langsung diterapkan (-${formatCurrency(res.data.discountAmount)})`);
    } else {
      toast.error(res.error || 'Promo tidak dapat digunakan');
    }
  };

  // Kasir memasukkan diskon manual langsung (Nominal Rp atau Persentase %)
  const handleApplyManualDiscount = () => {
    const val = parseFloat(manualDiscountValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Masukkan nilai potongan diskon yang valid');
      return;
    }
    const currentSubtotal = getSubtotal();
    if (currentSubtotal <= 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    let discAmount = 0;
    if (manualDiscountType === 'PERCENTAGE') {
      if (val > 100) {
        toast.error('Diskon persen maksimal 100%');
        return;
      }
      discAmount = (currentSubtotal * val) / 100;
    } else {
      discAmount = Math.min(val, currentSubtotal);
    }

    setAppliedPromo({
      id: 'manual',
      code: 'MANUAL',
      name: `Diskon Manual (${manualDiscountType === 'PERCENTAGE' ? `${val}%` : formatCurrency(val)})`,
      discountAmount: discAmount,
    });
    setIsPromoModalOpen(false);
    setManualDiscountValue('');
    toast.success(`Diskon manual ${formatCurrency(discAmount)} berhasil diterapkan`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.info('Promo dibatalkan');
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-card border border-border/80 rounded-2xl shadow-xs p-4 animate-pulse">
        <div className="h-9 bg-muted rounded-xl w-full mb-3"></div>
        <div className="h-8 bg-muted rounded-xl w-3/4 mb-4"></div>
        <div className="flex-1 space-y-3">
          <div className="h-14 bg-muted rounded-xl w-full"></div>
          <div className="h-14 bg-muted rounded-xl w-full"></div>
        </div>
        <div className="h-32 bg-muted rounded-xl w-full mt-4"></div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const taxRate = parseFloat(posSettings?.posTaxRate || '0');
  const serviceRate = parseFloat(posSettings?.serviceChargeRate || '0');
  const taxName = posSettings?.taxName || 'Pajak (PB1)';
  const serviceName = posSettings?.serviceChargeName || 'Biaya Layanan';

  const taxableSubtotal = Math.max(0, subtotal - discount);
  const serviceChargeAmount = serviceRate > 0 ? (taxableSubtotal * serviceRate) / 100 : 0;
  const taxAmount = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
  const total = taxableSubtotal + serviceChargeAmount + taxAmount;

  const handleMinus = (itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, currentQty - 1);
    }
  };

  const handlePlus = (itemId: string, currentQty: number) => {
    updateQuantity(itemId, currentQty + 1);
  };

  const isOjolType = ['GRABFOOD', 'SHOPEEFOOD', 'GOFOOD', 'DELIVERY'].includes(orderType);

  return (
    <div className="flex flex-col h-full bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
      {/* 1. ORDER CONFIGURATION HEADER */}
      <div className="p-3 sm:p-3.5 border-b border-border/70 bg-slate-50/50 dark:bg-slate-900/30 space-y-2.5">
        {/* Order Type Segmented Switcher */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs">
          <button
            type="button"
            onClick={() => setOrderType('DINE_IN')}
            className={cn(
              "py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              orderType === 'DINE_IN'
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dine-In</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType('TAKEAWAY')}
            className={cn(
              "py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              orderType === 'TAKEAWAY'
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeaway</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isOjolType) setOrderType('GRABFOOD');
            }}
            className={cn(
              "py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              isOjolType
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Ojol / Antar</span>
          </button>
        </div>

        {/* Sub-channel picker for Ojol/Delivery */}
        {isOjolType && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-hide text-[11px]">
            {[
              { id: 'GRABFOOD', label: 'GrabFood' },
              { id: 'SHOPEEFOOD', label: 'ShopeeFood' },
              { id: 'GOFOOD', label: 'GoFood' },
              { id: 'DELIVERY', label: 'Kurir Toko' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setOrderType(sub.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium border transition-colors whitespace-nowrap",
                  orderType === sub.id
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-slate-900 text-muted-foreground border-border hover:bg-slate-50"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Customer & Table Inputs */}
        <div className="flex items-center gap-2">
          {orderType === 'DINE_IN' && (
            <div className="w-24 sm:w-28 shrink-0">
              <Input
                placeholder="No. Meja *"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-slate-900 rounded-sm px-2.5 font-medium border-border/80"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Input
              placeholder={posSettings?.customerNameRequired ? "Nama Pelanggan *" : "Nama Pelanggan (opsional)"}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-slate-900 rounded-sm px-2.5 font-medium border-border/80"
            />
          </div>
        </div>

        {/* Cart Item Header Bar & Clear Action */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            Daftar Item
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] text-muted-foreground font-semibold">
              {items.length}
            </span>
          </span>

          {items.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-destructive font-medium">Hapus semua?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setShowClearConfirm(false);
                    toast.info('Keranjang dikosongkan');
                  }}
                  className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-medium cursor-pointer"
                >
                  Ya
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="text-[10px] text-muted-foreground px-1 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded"
              >
                <Trash2 size={12} />
                <span>Kosongkan</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. CART ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
        {items.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-muted-foreground text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mb-2.5 text-muted-foreground/60">
              <ShoppingBag size={22} />
            </div>
            <p className="text-xs font-semibold text-foreground">Pesanan masih kosong</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pilih menu dari katalog untuk mulai mencatat</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <div className="h-11 w-11 rounded-xl shrink-0 overflow-hidden relative flex items-center justify-center">
                <CartItemThumbnail 
                  src={item.imageUrl} 
                  alt={item.name} 
                  fallbackName={item.name} 
                  displayMode={displayMode}
                  colorIndex={item.colorIndex}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-semibold text-xs truncate leading-snug">{item.name}</h4>
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-0.5 cursor-pointer shrink-0"
                    title="Hapus menu"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {item.modifiers.map(m => m.name).join(', ')}
                  </p>
                )}

                {item.notes && (
                  <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">
                    "{item.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between mt-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button"
                      onClick={() => handleMinus(item.id, item.quantity)}
                      className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center shadow-2xs active:scale-90 cursor-pointer"
                      aria-label="Kurangi kuantitas"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="text-xs font-semibold min-w-5 text-center text-foreground select-none">
                      {item.quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => handlePlus(item.id, item.quantity)}
                      className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                      aria-label="Tambah kuantitas"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                  <span className="font-semibold text-xs text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. PROMO & FINANCIAL SUMMARY FOOTER */}
      <div className="p-3 border-t border-border/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
        {/* Promo trigger in Cart */}
        {appliedPromo ? (
          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <Tag size={13} className="shrink-0 text-emerald-600" />
              {appliedPromo.code && (
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-bold">
                  {appliedPromo.code}
                </span>
              )}
              <span className="font-semibold truncate">{appliedPromo.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold">-{formatCurrency(appliedPromo.discountAmount)}</span>
              <button 
                type="button"
                onClick={handleRemovePromo}
                className="text-emerald-700 hover:text-destructive p-0.5 cursor-pointer"
                title="Batalkan promo"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenPromoModal}
            className="w-full flex items-center justify-between text-xs py-2 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Tag size={13} />
              Pasang Promo / Diskon
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Pilih ➔</span>
          </button>
        )}

        {/* Calculation summary lines */}
        <div className="space-y-1 text-xs pt-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal Produk</span>
            <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Potongan Promo</span>
              <span className="font-medium">-{formatCurrency(discount)}</span>
            </div>
          )}

          {serviceRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{serviceName} ({serviceRate}%)</span>
              <span className="font-medium text-foreground">+{formatCurrency(serviceChargeAmount)}</span>
            </div>
          )}

          {taxRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{taxName} ({taxRate}%):</span>
              <span className="font-medium text-foreground">+{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border/80 flex justify-between items-center">
            <span className="font-semibold text-sm text-foreground">Total Tagihan</span>
            <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Unified Checkout Button */}
        {onCheckout && (
          <button
            type="button"
            onClick={onCheckout}
            disabled={items.length === 0 || isProcessing}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-between px-4 mt-2"
          >
            <span>Bayar Sekarang</span>
            <span className="font-semibold text-sm">{formatCurrency(total)}</span>
          </button>
        )}
      </div>

      {/* 4. ACTIVE PROMO SELECTOR MODAL */}
      <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="p-4 pb-3 border-b bg-slate-50/70 dark:bg-slate-900/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Kelola Diskon & Promo Transaksi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih promo outlet langsung terapkan, atau berikan diskon manual kasir.
            </DialogDescription>

            {/* TAB SELECTOR */}
            <div className="flex bg-muted/60 p-1 rounded-xl mt-3">
              <button
                type="button"
                onClick={() => setPromoTab('promo')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  promoTab === 'promo' 
                    ? "bg-background text-foreground shadow-2xs" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Promo Outlet (1-Klik)
              </button>
              <button
                type="button"
                onClick={() => setPromoTab('manual')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  promoTab === 'manual' 
                    ? "bg-background text-foreground shadow-2xs" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Diskon Manual / Kode
              </button>
            </div>
          </DialogHeader>

          {promoTab === 'promo' ? (
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              <p className="text-[11px] text-muted-foreground pb-1">
                Klik promo di bawah untuk langsung memasang diskon ke transaksi kasir:
              </p>
              {activePromosList.length > 0 ? (
                activePromosList.map((p) => {
                  const minOrder = parseFloat(p.minOrder || '0');
                  const isEligible = subtotal >= minOrder;
                  const val = parseFloat(p.value);
                  const discountTag = p.type === 'PERCENTAGE' ? `Diskon ${val}%` : `Potongan ${formatCurrency(val)}`;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isValidatingPromo}
                      onClick={() => handleSelectPromo(p)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",
                        !isEligible
                          ? "opacity-60 bg-muted/30 border-dashed border-border cursor-not-allowed"
                          : "bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-blue-300 border-border active:scale-[0.99]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {p.code && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-bold">
                              {p.code}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-foreground truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 shrink-0">
                          {discountTag}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between">
                        <span>{minOrder > 0 ? `Min. Belanja ${formatCurrency(minOrder)}` : 'Tanpa Minimum'}</span>
                        <span className={cn("font-semibold", isEligible ? "text-blue-600" : "text-muted-foreground")}>
                          {isEligible ? "Langsung Terapkan ➔" : "Belum Memenuhi"}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Tidak ada promo aktif yang terdaftar di outlet.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Diskon Manual Kasir */}
              <div className="space-y-3 p-3.5 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/30">
                <span className="text-xs font-semibold text-foreground block">
                  Potongan Diskon Manual Kasir
                </span>
                <div className="flex gap-2">
                  <div className="flex bg-muted/60 p-0.5 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setManualDiscountType('FIXED')}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                        manualDiscountType === 'FIXED'
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualDiscountType('PERCENTAGE')}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                        manualDiscountType === 'PERCENTAGE'
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      %
                    </button>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={manualDiscountValue}
                    onChange={(e) => setManualDiscountValue(e.target.value)}
                    placeholder={manualDiscountType === 'FIXED' ? 'Misal: 10000' : 'Misal: 10'}
                    className="h-9 text-xs bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyManualDiscount}
                    disabled={!manualDiscountValue.trim()}
                    className="h-9 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  >
                    Terapkan
                  </Button>
                </div>
              </div>

              {/* Atau Pakai Kode Promo Khusus */}
              <div className="space-y-2 pt-1 border-t border-border">
                <span className="text-xs font-semibold text-foreground block">
                  Atau Input Kode Promo Khusus
                </span>
                <div className="flex gap-2">
                  <Input
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyPromoCode();
                      }
                    }}
                    placeholder="Masukkan kode promo (misal: HEMAT50)"
                    className="h-9 text-xs font-mono uppercase bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyPromoCode()}
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="h-9 px-3.5 text-xs bg-slate-800 hover:bg-slate-900 text-white shrink-0"
                  >
                    {isValidatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Validasi'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CartItemThumbnail({ 
  src, 
  alt, 
  fallbackName, 
  displayMode = 'image', 
  colorIndex 
}: { 
  src?: string | null; 
  alt: string; 
  fallbackName: string;
  displayMode?: 'image' | 'color';
  colorIndex?: number;
}) {
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
  }, [src]);

  const initials = getProductInitials(fallbackName);
  const palette = typeof colorIndex === 'number' 
    ? getPosCardPalette(colorIndex) 
    : getPosCardPaletteByName(fallbackName);

  if (displayMode === 'color') {
    return (
      <div
        style={{
          backgroundColor: palette.bgHex,
          color: palette.textPrimaryHex,
          borderColor: palette.borderHex,
        }}
        className="w-full h-full rounded-xl border flex items-center justify-center font-semibold text-xs select-none tracking-wider shadow-2xs"
        title={fallbackName}
      >
        {initials}
      </div>
    );
  }

  if (src && !error) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden border border-border/40 bg-muted/60 flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: palette.bgHex,
        color: palette.textPrimaryHex,
        borderColor: palette.borderHex,
      }}
      className="w-full h-full rounded-xl border flex items-center justify-center font-semibold text-xs select-none tracking-wider"
      title={fallbackName}
    >
      {initials}
    </div>
  );
}

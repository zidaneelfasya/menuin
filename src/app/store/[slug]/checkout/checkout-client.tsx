"use client";

import { useCartStore } from "@/lib/store/cart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOnlineOrder } from "@/lib/actions/public-catalog";
import { getPublicPromotions } from "@/lib/actions/promotions";
import Script from "next/script";
import { ArrowLeft, Loader2, Minus, Plus, Utensils, ShoppingBag, Car, Tag, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";

declare global {
  interface Window {
    snap: any;
  }
}

type CheckoutClientProps = {
  tenantSlug: string;
  settings: {
    dineInEnabled: boolean;
    takeAwayEnabled: boolean;
    deliveryEnabled: boolean;
    customerNameRequired: boolean;
    customerPhoneRequired: boolean;
    tableNumberRequired: boolean;
    midtransEnvironment: string | null;
    midtransClientKey: string | null;
  };
};

export function CheckoutClient({ tenantSlug, settings }: CheckoutClientProps) {
  const router = useRouter();
  const { items, tableNumber, orderType, setOrderType, getTotalPrice, updateQuantity, clearCart, setTableNumber } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: tableNumber || "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  // Promotions
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string;
    name: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !isSuccess) {
      router.replace(`/store/${tenantSlug}`);
    }

    // Fetch store promotions
    getPublicPromotions(tenantSlug).then((res) => {
      if (res.success && res.data) {
        setAvailablePromos(res.data);
      }
    });
  }, [items.length, router, tenantSlug, isSuccess]);

  useEffect(() => {
    // Reset loading state if page is restored from BFCache (when user clicks Back button)
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(false);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const subTotal = getTotalPrice();

  // Recalculate promo discount whenever subtotal or applied promo changes
  const promoDiscount = (() => {
    if (!appliedPromo) return 0;
    const promo = availablePromos.find(p => p.id === appliedPromo.id);
    if (!promo) return 0;

    const minOrder = parseFloat(promo.minOrder || '0');
    if (subTotal < minOrder) return 0;

    const promoVal = parseFloat(promo.value);
    let disc = 0;
    if (promo.type === 'PERCENTAGE') {
      disc = (subTotal * promoVal) / 100;
      if (promo.maxDiscount) {
        const maxDisc = parseFloat(promo.maxDiscount);
        if (disc > maxDisc) disc = maxDisc;
      }
    } else {
      disc = promoVal;
    }
    return Math.min(disc, subTotal);
  })();

  const grandTotal = Math.max(0, subTotal - promoDiscount);

  if (!mounted) return null;

  const snapScriptUrl = settings.midtransEnvironment === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const handleClaimPromo = (promo: any) => {
    if (appliedPromo?.id === promo.id) {
      setAppliedPromo(null);
      toast.info('Promo dibatalkan');
      return;
    }

    const minOrder = parseFloat(promo.minOrder || '0');
    if (subTotal < minOrder) {
      toast.error(`Minimal belanja Rp ${minOrder.toLocaleString('id-ID')} untuk klaim promo "${promo.name}"`);
      return;
    }

    const promoVal = parseFloat(promo.value);
    let disc = 0;
    if (promo.type === 'PERCENTAGE') {
      disc = (subTotal * promoVal) / 100;
      if (promo.maxDiscount) {
        const maxDisc = parseFloat(promo.maxDiscount);
        if (disc > maxDisc) disc = maxDisc;
      }
    } else {
      disc = promoVal;
    }
    disc = Math.min(disc, subTotal);

    setAppliedPromo({
      id: promo.id,
      name: promo.name,
      type: promo.type,
      value: promoVal,
      discountAmount: disc,
    });
    toast.success(`Promo "${promo.name}" berhasil diklaim! Hemat ${formatCurrency(disc)}`);
  };

  const handleOrder = async () => {
    if (settings.customerNameRequired && !formData.customerName) {
      return toast.error("Nama wajib diisi");
    }
    if (settings.customerPhoneRequired && !formData.customerPhone) {
      return toast.error("Nomor Telepon wajib diisi");
    }
    if (orderType === 'DINE_IN' && settings.tableNumberRequired && !formData.tableNumber) {
      return toast.error("Nomor Meja wajib diisi");
    }

    // Sync to store just in case they go back
    setTableNumber(formData.tableNumber);

    setIsLoading(true);

    try {
      const statusUrl = window.location.pathname.replace('/checkout', '/status');

      const result = await createOnlineOrder({
        tenantSlug,
        orderType,
        tableNumber: formData.tableNumber || undefined,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        items: items.map(i => ({ 
          id: i.productId, 
          quantity: i.quantity,
          modifiers: i.modifiers,
          notes: i.notes
        })),
        paymentMethod: 'ONLINE',
        returnUrl: `${window.location.origin}${statusUrl}`
      });

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.orderNumber) {
        localStorage.setItem(`menuin_active_order_${tenantSlug}`, result.orderNumber);
      }

      // Append the query param for the local router redirect
      const paymentUrl = `${window.location.pathname.replace('/checkout', '/payment')}?order=${encodeURIComponent(result.orderNumber || "")}`;

      setIsSuccess(true);
      clearCart();
      toast.success("Pesanan berhasil dibuat! Silakan pilih metode pembayaran.");
      
      // Use window.location.href to guarantee navigation and prevent Next.js router transition hangs
      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Terjadi kesalahan pada sistem. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {settings.midtransClientKey && (
        <Script src={snapScriptUrl} data-client-key={settings.midtransClientKey} strategy="afterInteractive" />
      )}
      
      <div className="space-y-8">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.cartItemId} className="flex gap-4">
              <div className="h-20 w-20 bg-gray-100 rounded-xl flex-shrink-0 border overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400 w-full h-full flex items-center justify-center">No Image</span>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="font-semibold text-sm leading-tight text-gray-800">{item.name}</div>
                  <div className="text-gray-500 text-sm mt-1">{formatCurrency(item.price)}</div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.modifiers.map(m => m.name).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">
                      "{item.notes}"
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-1 w-fit">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="h-7 w-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="h-7 w-7 flex items-center justify-center bg-catalog-primary text-white rounded shadow-sm hover:bg-catalog-primary/90"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="font-bold text-gray-800 py-1">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Promo Claim Section */}
        {availablePromos.length > 0 && (
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 rounded-2xl border border-amber-200 dark:border-amber-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Klaim Promo & Diskon Toko</span>
              </div>
              {appliedPromo && (
                <button
                  onClick={() => setAppliedPromo(null)}
                  className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <X className="w-3.5 h-3.5" /> Batalkan
                </button>
              )}
            </div>

            {appliedPromo ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-800 dark:text-green-300">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-700 font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{appliedPromo.name}</span>
                    <span className="text-[11px] text-green-700 dark:text-green-400">Promo berhasil diklaim</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-green-700 dark:text-green-300">
                  -{formatCurrency(promoDiscount)}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Pilih promo di bawah untuk klaim diskon belanja Anda:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availablePromos.map((promo) => {
                    const minOrder = parseFloat(promo.minOrder || '0');
                    const isEligible = subTotal >= minOrder;
                    const val = parseFloat(promo.value);
                    const tag = promo.type === 'PERCENTAGE' ? `Diskon ${val}%` : `Potongan ${formatCurrency(val)}`;

                    return (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => handleClaimPromo(promo)}
                        className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          !isEligible
                            ? 'opacity-60 bg-gray-50 border-dashed border-gray-200'
                            : 'bg-white hover:border-amber-400 hover:shadow-sm border-gray-200 active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-xs text-gray-900 line-clamp-1">{promo.name}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                            {tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
                          <span>{minOrder > 0 ? `Min. ${formatCurrency(minOrder)}` : 'Tanpa Minimum'}</span>
                          <span className={`font-bold ${isEligible ? 'text-amber-700' : 'text-gray-400'}`}>
                            {isEligible ? 'Klaim Promo' : 'Belum Memenuhi'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Menu</span>
            <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
          </div>

          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Diskon Promo ({appliedPromo?.name})</span>
              <span>-{formatCurrency(promoDiscount)}</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-800">
            <span>Total Pembayaran</span>
            <span className="text-catalog-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Order Details Form */}
        <div className="space-y-5 pt-6 border-t">
          <h3 className="font-bold text-lg text-gray-800">Detail Pesanan</h3>
          
          <div className="space-y-3">
            <Label className="text-gray-600 font-medium">Tipe Pesanan</Label>
            <div className="grid grid-cols-3 gap-3">
              {settings.dineInEnabled && (
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`flex flex-col items-center justify-center py-3 px-2 text-sm font-medium border-2 rounded-xl transition-all ${orderType === 'DINE_IN' ? 'bg-catalog-primary/5 border-catalog-primary text-catalog-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Utensils className="w-5 h-5 mb-1" />
                  Dine-In
                </button>
              )}
              {settings.takeAwayEnabled && (
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`flex flex-col items-center justify-center py-3 px-2 text-sm font-medium border-2 rounded-xl transition-all ${orderType === 'TAKEAWAY' ? 'bg-catalog-primary/5 border-catalog-primary text-catalog-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <ShoppingBag className="w-5 h-5 mb-1" />
                  Bawa Pulang
                </button>
              )}
              {settings.deliveryEnabled && (
                <button
                  onClick={() => setOrderType('DELIVERY')}
                  className={`flex flex-col items-center justify-center py-3 px-2 text-sm font-medium border-2 rounded-xl transition-all ${orderType === 'DELIVERY' ? 'bg-catalog-primary/5 border-catalog-primary text-catalog-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Car className="w-5 h-5 mb-1" />
                  Delivery
                </button>
              )}
            </div>
          </div>

          {orderType === 'DINE_IN' && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="table" className="text-gray-600 font-medium">Nomor Meja {settings.tableNumberRequired && <span className="text-red-500">*</span>}</Label>
              <Input 
                id="table" 
                className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl font-bold text-lg"
                placeholder="Misal: Meja 12" 
                value={formData.tableNumber}
                onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
              />
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-600 font-medium">Nama Lengkap {settings.customerNameRequired && <span className="text-red-500">*</span>}</Label>
              <Input 
                id="name" 
                className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl"
                placeholder="Masukkan nama Anda" 
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-600 font-medium">Nomor WhatsApp {settings.customerPhoneRequired && <span className="text-red-500">*</span>}</Label>
              <Input 
                id="phone" 
                type="tel"
                className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl"
                placeholder="0812..." 
                value={formData.customerPhone}
                onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex gap-3">
          <Button asChild variant="outline" className="w-14 h-14 rounded-2xl flex-shrink-0 border-2 border-gray-200 text-gray-600">
            <Link href={`/store/${tenantSlug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button 
            onClick={handleOrder}
            disabled={isLoading || items.length === 0}
            className="flex-1 h-14 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-2xl font-bold text-lg shadow-lg"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
            ) : (
              `Buat Pesanan - ${formatCurrency(grandTotal)}`
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

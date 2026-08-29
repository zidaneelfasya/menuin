"use client";

import { useCartStore } from "@/lib/store/cart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOnlineOrder } from "@/lib/actions/public-catalog";
import Script from "next/script";
import { ArrowLeft, Loader2, Minus, Plus, Utensils, ShoppingBag, Car } from "lucide-react";
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

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !isSuccess) {
      router.replace(`/store/${tenantSlug}`);
    }
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

  if (!mounted) return null;

  const snapScriptUrl = settings.midtransEnvironment === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

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

    const result = await createOnlineOrder({
      tenantSlug,
      orderType,
      tableNumber: formData.tableNumber || undefined,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      paymentMethod: 'ONLINE'
    });

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result.snapToken && window.snap) {
      window.snap.pay(result.snapToken, {
        onSuccess: function () {
          setIsSuccess(true);
          clearCart();
          toast.success("Pembayaran berhasil!");
          router.push(`/status?order=${encodeURIComponent(result.orderNumber)}`);
        },
        onPending: function () {
          setIsSuccess(true);
          clearCart();
          toast.info("Menunggu pembayaran Anda");
          router.push(`/status?order=${encodeURIComponent(result.orderNumber)}`);
        },
        onError: function () {
          toast.error("Pembayaran gagal atau dibatalkan");
          setIsLoading(false);
        },
        onClose: function () {
          toast.error("Anda menutup jendela pembayaran");
          setIsLoading(false);
        }
      });
    } else {
      setIsSuccess(true);
      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      router.push(`/status?order=${encodeURIComponent(result.orderNumber)}`);
    }
  };

  return (
    <>
      {settings.midtransClientKey && (
        <Script src={snapScriptUrl} data-client-key={settings.midtransClientKey} strategy="lazyOnload" />
      )}
      
      <div className="space-y-8">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4">
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
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-1 w-fit">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-7 w-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
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

        <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-800">
          <span>Total Keseluruhan</span>
          <span className="text-catalog-primary">{formatCurrency(getTotalPrice())}</span>
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
            <Link href="/">
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
              `Bayar ${formatCurrency(getTotalPrice())}`
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

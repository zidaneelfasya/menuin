"use client";

import { useCartStore, type CartItem } from "@/lib/store/cart";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOnlineOrder } from "@/lib/actions/public-catalog";
import { getPublicPromotions } from "@/lib/actions/promotions";
import Script from "next/script";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Utensils,
  ShoppingBag,
  Car,
  Tag,
  Check,
  X,
  CreditCard,
  Banknote,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import {
  ProductDetailSheet,
  type Product,
  type ModifierGroup,
  type Modifier,
} from "@/components/shared/product-detail-sheet";

declare global {
  interface Window {
    snap: any;
  }
}

type CheckoutClientProps = {
  tenantSlug: string;
  settings: {
    tenantName?: string;
    dineInEnabled: boolean;
    takeAwayEnabled: boolean;
    deliveryEnabled: boolean;
    customerNameRequired: boolean;
    customerPhoneRequired: boolean;
    tableNumberRequired: boolean;
    midtransEnvironment: string | null;
    midtransClientKey: string | null;
    onlinePaymentEnabled?: boolean;
    taxRate?: number;
    taxName?: string;
    serviceChargeRate?: number;
  };
  products?: Product[];
  modifierGroups?: ModifierGroup[];
};

export function CheckoutClient({
  tenantSlug,
  settings,
  products = [],
  modifierGroups = [],
}: CheckoutClientProps) {
  const router = useRouter();
  const {
    items,
    tableNumber,
    orderType,
    setOrderType,
    getTotalPrice,
    updateQuantity,
    clearCart,
    setTableNumber,
    removeItem,
    addItem,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit Cart Item Sheet state
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [selectedProductForSheet, setSelectedProductForSheet] = useState<Product | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  // Default to ONLINE if enabled, otherwise CASH
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE">(
    settings.onlinePaymentEnabled ? "ONLINE" : "CASH"
  );

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: tableNumber || "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  // Open Edit Sheet
  const handleOpenEditSheet = (item: CartItem) => {
    const foundProduct = products.find((p) => p.id === item.productId);
    if (foundProduct) {
      setSelectedProductForSheet(foundProduct);
    } else {
      const extraModPrice = (item.modifiers || []).reduce(
        (sum: number, m: any) => sum + Number(m.price || 0),
        0
      );
      setSelectedProductForSheet({
        id: item.productId,
        name: item.name,
        price: Math.max(0, item.price - extraModPrice),
        imageUrl: item.imageUrl,
        description: null,
        modifierGroupIds: (modifierGroups || []).map((g) => g.id),
      });
    }
    setEditingCartItem(item);
    setIsEditSheetOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: true }, "", window.location.href);
    }
  };

  const handleCloseEditSheet = () => {
    setIsEditSheetOpen(false);
    setEditingCartItem(null);
    setSelectedProductForSheet(null);
  };

  const handleUpdateCartFromSheet = (
    product: Product,
    selectedModifiers: Modifier[],
    notes: string,
    quantity: number,
    editingId?: string | null
  ) => {
    let extraPrice = 0;
    selectedModifiers.forEach((m) => (extraPrice += Number(m.price)));

    if (editingId) {
      removeItem(editingId);
    }

    addItem(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price) + extraPrice,
        imageUrl: product.imageUrl,
        modifiers: selectedModifiers,
        notes,
      },
      quantity
    );

    toast.success(`${product.name} diperbarui`);
    handleCloseEditSheet();
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isEditSheetOpen) {
        setIsEditSheetOpen(false);
        setEditingCartItem(null);
        setSelectedProductForSheet(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isEditSheetOpen]);

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

    // Fetch store promotions
    getPublicPromotions(tenantSlug).then((res) => {
      if (res.success && res.data) {
        setAvailablePromos(res.data);
      }
    });
  }, [tenantSlug]);

  useEffect(() => {
    // Reset loading state if page is restored from BFCache
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const subTotal = getTotalPrice();

  // Recalculate promo discount whenever subtotal or applied promo changes
  const promoDiscount = (() => {
    if (!appliedPromo) return 0;
    const promo = availablePromos.find((p) => p.id === appliedPromo.id);
    if (!promo) return 0;

    const minOrder = parseFloat(promo.minOrder || "0");
    if (subTotal < minOrder) return 0;

    const promoVal = parseFloat(promo.value);
    let disc = 0;
    if (promo.type === "PERCENTAGE") {
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

  const taxableSubtotal = Math.max(0, subTotal - promoDiscount);
  const taxRate = settings.taxRate || 0;
  const serviceChargeRate = settings.serviceChargeRate || 0;
  const taxAmount = (taxableSubtotal * taxRate) / 100;
  const serviceChargeAmount = (taxableSubtotal * serviceChargeRate) / 100;
  const grandTotal = Math.max(0, taxableSubtotal + taxAmount + serviceChargeAmount);

  if (!mounted) return null;

  const snapScriptUrl =
    settings.midtransEnvironment === "production"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  const handleClaimPromo = (promo: any) => {
    if (appliedPromo?.id === promo.id) {
      setAppliedPromo(null);
      toast.info("Promo dibatalkan");
      return;
    }

    const minOrder = parseFloat(promo.minOrder || "0");
    if (subTotal < minOrder) {
      toast.error(
        `Minimal belanja Rp ${minOrder.toLocaleString("id-ID")} untuk klaim promo "${promo.name}"`
      );
      return;
    }

    const promoVal = parseFloat(promo.value);
    let disc = 0;
    if (promo.type === "PERCENTAGE") {
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
    toast.success(
      `Promo "${promo.name}" berhasil diklaim! Hemat ${formatCurrency(disc)}`
    );
  };

  // Direct Submission to Payment: creates order and proceeds directly to payment/status
  const handleProceedToPayment = async () => {
    if (items.length === 0) {
      return toast.error("Keranjang Anda masih kosong");
    }
    if (settings.customerNameRequired && !formData.customerName.trim()) {
      return toast.error("Nama lengkap pemesan wajib diisi");
    }
    if (settings.customerPhoneRequired && !formData.customerPhone.trim()) {
      return toast.error("Nomor WhatsApp wajib diisi");
    }
    if (orderType === "DINE_IN" && settings.tableNumberRequired && !formData.tableNumber.trim()) {
      return toast.error("Nomor Meja wajib diisi untuk pesanan Dine-In");
    }

    // Sync table number to cart store
    setTableNumber(formData.tableNumber.trim());

    setIsLoading(true);

    try {
      const statusUrl = window.location.pathname.replace("/checkout", "/status");

      const result = await createOnlineOrder({
        tenantSlug,
        orderType,
        tableNumber: formData.tableNumber ? formData.tableNumber.trim() : undefined,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        promoName: appliedPromo ? appliedPromo.name : undefined,
        promoId: appliedPromo ? appliedPromo.id : undefined,
        discount: promoDiscount,
        items: items.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          modifiers: i.modifiers,
          notes: i.notes,
        })),
        paymentMethod: paymentMethod,
        returnUrl: `${window.location.origin}${statusUrl}`,
      });

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      if (result.orderNumber) {
        localStorage.setItem(`menuin_active_order_${tenantSlug}`, result.orderNumber);
        window.dispatchEvent(new Event("menuin_active_order_updated"));
      }

      setIsSuccess(true);
      clearCart();

      if (paymentMethod === "ONLINE") {
        toast.success("Pesanan berhasil dibuat! Mengalihkan ke pembayaran...");
        const paymentUrl = `${window.location.pathname.replace(
          "/checkout",
          "/payment"
        )}?order=${encodeURIComponent(result.orderNumber || "")}`;
        window.location.href = paymentUrl;
      } else {
        toast.success("Pesanan berhasil dibuat! Silakan bayar di kasir.");
        const finalStatusUrl = `${window.location.pathname.replace(
          "/checkout",
          "/status"
        )}?order=${encodeURIComponent(result.orderNumber || "")}`;
        window.location.href = finalStatusUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Terjadi kesalahan pada sistem. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {settings.midtransClientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={settings.midtransClientKey}
          strategy="afterInteractive"
        />
      )}

      {/* Sticky Cart Top Navigation Header (Taller & Prominent) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 h-20 sm:h-20 flex items-center justify-between">
          <div className="w-11 flex items-center justify-start">
            <Link
              href={`/store/${tenantSlug}${tableNumber ? `?table=${tableNumber}` : ''}`}
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-gray-800 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke Menu"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </Link>
          </div>

          <h1 className="font-semibold text-xl sm:text-2xl text-gray-900 tracking-tight text-center truncate px-2">
            Keranjang
          </h1>

          <div className="w-11 shrink-0" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Container with generous bottom padding for taller sticky footer */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-5 pb-48 sm:pb-52 w-full space-y-6">
        {items.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4 my-4 sm:my-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
              <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Keranjang Masih Kosong</h2>
              <p className="text-sm text-gray-500">
                Belum ada menu yang dipilih. Silakan kembali ke menu untuk memilih pesanan Anda.
              </p>
            </div>
            <Link
              href={`/store/${tenantSlug}${tableNumber ? `?table=${tableNumber}` : ""}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-catalog-primary text-white font-semibold text-sm hover:bg-catalog-primary/90 transition-all shadow-sm active:scale-98 cursor-pointer mt-2"
            >
              <span>Pilih Menu Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200 shadow-sm space-y-7 sm:space-y-8">
            {/* 1. INFORMASI PEMESANAN (DI PALING ATAS) */}
          <div className="space-y-5">
            <div className="border-b border-gray-100 pb-3.5">
              <h2 className="font-semibold text-xl sm:text-2xl text-gray-900 tracking-tight">
                Informasi Pemesanan
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Pilih tipe layanan dan lengkapi rincian pemesanan Anda
              </p>
            </div>

            {/* Order Type Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800">Tipe Pesanan</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {settings.dineInEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("DINE_IN")}
                    className={`flex flex-col items-center justify-center py-3 px-3 text-sm sm:text-base font-semibold border-2 rounded-2xl transition-all cursor-pointer ${
                      orderType === "DINE_IN"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Utensils className="w-5 h-5 mb-1.5" />
                    Dine-In
                  </button>
                )}
                {settings.takeAwayEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={`flex flex-col items-center justify-center py-3.5 px-3 text-sm font-semibold border-2 rounded-2xl transition-all cursor-pointer ${
                      orderType === "TAKEAWAY"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mb-1.5" />
                    Bawa Pulang
                  </button>
                )}
                {settings.deliveryEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`flex flex-col items-center justify-center py-3.5 px-3 text-sm font-semibold border-2 rounded-2xl transition-all cursor-pointer ${
                      orderType === "DELIVERY"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Car className="w-5 h-5 mb-1.5" />
                    Delivery
                  </button>
                )}
              </div>
            </div>

            {orderType === "DINE_IN" && (
              <div className="space-y-2">
                <Label htmlFor="table" className="text-sm font-semibold text-gray-800">
                  Nomor Meja {settings.tableNumberRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="table"
                  className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl font-semibold text-base px-3.5"
                  placeholder="Contoh: Meja 12"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-800">
                  Nama Pemesan {settings.customerNameRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="name"
                  className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl text-base px-3.5"
                  placeholder="Nama Anda"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-800">
                  Nomor WhatsApp {settings.customerPhoneRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl text-base px-3.5"
                  placeholder="0812..."
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Promo Claim Section */}
            {availablePromos.length > 0 && (
              <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-3.5 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm uppercase tracking-wider">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Klaim Promo & Diskon Outlet</span>
                  </div>
                  {appliedPromo && (
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-xs sm:text-sm text-red-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" /> Batalkan
                    </button>
                  )}
                </div>

                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold shrink-0">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm block">{appliedPromo.name}</span>
                        <span className="text-xs text-emerald-700">Promo berhasil dipasang</span>
                      </div>
                    </div>
                    <span className="font-semibold text-sm sm:text-base text-emerald-700">
                      -{formatCurrency(promoDiscount)}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Pilih voucher promo aktif untuk mendapatkan potongan harga:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availablePromos.map((promo) => {
                        const minOrder = parseFloat(promo.minOrder || "0");
                        const isEligible = subTotal >= minOrder;
                        const val = parseFloat(promo.value);
                        const tag =
                          promo.type === "PERCENTAGE"
                            ? `Diskon ${val}%`
                            : `Potongan ${formatCurrency(val)}`;

                        return (
                          <button
                            key={promo.id}
                            type="button"
                            onClick={() => handleClaimPromo(promo)}
                            className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                              !isEligible
                                ? "opacity-60 bg-gray-50 border-dashed border-gray-200 cursor-not-allowed"
                                : "bg-white hover:border-amber-400 hover:shadow-xs border-gray-200 active:scale-[0.99]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-semibold text-sm text-gray-900 line-clamp-1">
                                {promo.name}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                                {tag}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2.5 flex items-center justify-between">
                              <span>
                                {minOrder > 0
                                  ? `Min. ${formatCurrency(minOrder)}`
                                  : "Tanpa Minimum"}
                              </span>
                              <span
                                className={`font-semibold ${
                                  isEligible ? "text-amber-700" : "text-gray-400"
                                }`}
                              >
                                {isEligible ? "Klaim" : "Belum Cukup"}
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
          </div>

          {/* 2. DAFTAR MENU YANG DIPILIH */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="text-sm sm:text-sm font-medium tracking-wider text-gray-500">
                Daftar Menu Dipilih ({items.reduce((acc, i) => acc + i.quantity, 0)} item)
              </div>
              <Link
                href={`/store/${tenantSlug}${tableNumber ? `?table=${tableNumber}` : ''}`}
                className="text-sm sm:text-sm font-semibold text-catalog-primary hover:bg-catalog-primary/5 px-3.5 py-1.5 rounded-xl border border-catalog-primary/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
                <span>Add Item</span>
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.cartItemId} className="py-4 sm:py-5 flex gap-4 sm:gap-5 items-start">
                  <div className="h-28 w-28 sm:h-24 sm:w-24 bg-gray-50 rounded-2xl flex-shrink-0 border border-gray-100 overflow-hidden relative flex items-center justify-center">
                    <CheckoutItemThumbnail
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackName={item.name}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2">
                        {item.name}
                      </div>
                      <div className="font-semibold text-base sm:text-lg text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mt-0.5">
                      {formatCurrency(item.price)} / porsi
                    </div>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div
                        onClick={() => handleOpenEditSheet(item)}
                        className="text-sm text-gray-600 mt-1 cursor-pointer hover:text-gray-900 transition-colors line-clamp-2"
                        title="Klik untuk mengubah pilihan"
                      >
                        {item.modifiers
                          .map((m: any) =>
                            m.price > 0
                              ? `${m.name} (+${formatCurrency(m.price)})`
                              : m.name
                          )
                          .join(", ")}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-xs sm:text-sm text-gray-600 italic mt-1.5 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1 line-clamp-2">
                        "{item.notes}"
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3.5 pt-1">
                      {/* Stepper: Circular buttons without outer container border */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <span className="text-base sm:text-lg font-semibold w-7 sm:w-8 text-center text-gray-900 tabular-nums select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-catalog-primary text-white hover:bg-catalog-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSheet(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-catalog-primary bg-catalog-primary/10 hover:bg-catalog-primary/20 border border-catalog-primary/20 transition-all active:scale-95 cursor-pointer"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="w-4 h-4 stroke-[2.2]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. SUBTOTAL MENU & TOTAL ESTIMASI (FLAT ON PARENT CONTAINER) */}
          <div className="space-y-3.5 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight">
              Rincian Pembayaran
            </h3>

            <div className="space-y-2.5 text-sm sm:text-base pt-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} menu)</span>
                <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo ({appliedPromo?.name})</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}

              {serviceChargeRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan ({serviceChargeRate}%)</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(serviceChargeAmount)}
                  </span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>
                    {settings.taxName || "Pajak (PB1)"} ({taxRate}%)
                  </span>
                  <span className="font-semibold text-gray-800">{formatCurrency(taxAmount)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline font-semibold text-base sm:text-lg text-gray-900">
                <span>Total Estimasi</span>
                <span className="text-xl sm:text-2xl text-catalog-primary font-semibold tracking-tight">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. PILIH METODE PEMBAYARAN */}
          <div className="space-y-3.5 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base sm:text-base tracking-wider text-gray-500">
                Pilih Metode Pembayaran
              </h3>
              <span className="text-xs text-gray-400">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: Bayar di Kasir (Cash / Counter) */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3.5 group cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "bg-catalog-primary/5 border-catalog-primary shadow-xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      paymentMethod === "CASH"
                        ? "bg-catalog-primary text-white"
                        : "bg-gray-100 text-gray-600 group-hover:bg-gray-200/70"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                      <span>Bayar di Kasir</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                      Pesan sekarang dan bayar langsung ke kasir outlet saat pesanan diproses.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                    paymentMethod === "CASH"
                      ? "border-catalog-primary bg-catalog-primary text-white scale-100"
                      : "border-gray-300 bg-white group-hover:border-gray-400"
                  }`}
                >
                  {paymentMethod === "CASH" && (
                    <Check className="w-3.5 h-3.5 stroke-[3] animate-in zoom-in-50 duration-150" />
                  )}
                </div>
              </button>

              {/* Option 2: Bayar Online (Midtrans) */}
              {settings.onlinePaymentEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3.5 group cursor-pointer ${
                    paymentMethod === "ONLINE"
                      ? "bg-catalog-primary/5 border-catalog-primary shadow-xs"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        paymentMethod === "ONLINE"
                          ? "bg-catalog-primary text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200/70"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <span>Bayar Online Instan</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Instan & Otomatis
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                        QRIS, GoPay, OVO, ShopeePay, Virtual Account & Kartu Kredit.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                      paymentMethod === "ONLINE"
                        ? "border-catalog-primary bg-catalog-primary text-white scale-100"
                        : "border-gray-300 bg-white group-hover:border-gray-400"
                    }`}
                  >
                    {paymentMethod === "ONLINE" && (
                      <Check className="w-3.5 h-3.5 stroke-[3] animate-in zoom-in-50 duration-150" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Helper note */}
            <div className="pt-2 text-center">
              <p className="text-xs text-gray-400">
                Pastikan pesanan dan data Anda sudah benar sebelum melanjutkan ke pembayaran.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>

    {/* Sticky Bottom Footer (Taller & Prominent with Rounded Top) */}
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-[32px] sm:rounded-t-[36px] border-t border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.09)]">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4">
        {/* Left: Total Pembayaran */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Total Pembayaran</span>
          <span className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        {/* Right: Action Button */}
        <Button
          type="button"
          onClick={handleProceedToPayment}
          disabled={items.length === 0 || isLoading}
          className="h-14 sm:h-15 px-7 sm:px-9 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-2xl font-semibold text-base sm:text-lg shadow-sm active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>Membuat Pesanan...</span>
            </div>
          ) : (
            <span>
              {paymentMethod === "ONLINE"
                ? "Lanjutkan ke Pembayaran"
                : "Lanjutkan & Bayar di Kasir"}
            </span>
          )}
        </Button>
      </div>
    </footer>

      {/* Product Detail & Modifier Sheet for Editing Cart Items */}
      <ProductDetailSheet
        isOpen={isEditSheetOpen}
        onClose={handleCloseEditSheet}
        product={selectedProductForSheet}
        allModifierGroups={modifierGroups || []}
        initialModifiers={editingCartItem?.modifiers}
        initialNotes={editingCartItem?.notes}
        initialQuantity={editingCartItem?.quantity}
        editingCartItemId={editingCartItem?.cartItemId}
        onAddToCart={handleUpdateCartFromSheet}
      />
    </>
  );
}

function CheckoutItemThumbnail({
  src,
  alt,
  fallbackName,
}: {
  src?: string | null;
  alt: string;
  fallbackName: string;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center font-semibold text-gray-400 bg-gray-50 text-xl uppercase select-none">
      {fallbackName.charAt(0)}
    </div>
  );
}

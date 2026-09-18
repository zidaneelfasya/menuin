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
  Receipt,
  CreditCard,
  Banknote,
  ChevronRight,
  ShieldCheck,
  Info,
  Calendar,
  Clock,
  User,
  Phone,
  FileText
} from "lucide-react";
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
};

export function CheckoutClient({ tenantSlug, settings }: CheckoutClientProps) {
  const router = useRouter();
  const {
    items,
    tableNumber,
    orderType,
    setOrderType,
    getTotalPrice,
    updateQuantity,
    clearCart,
    setTableNumber
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");
  
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

  // Step 1 Validation & Proceed to Step 2 (Review)
  const handleProceedToReview = () => {
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

    // Switch to review step WITHOUT creating any database order
    setStep("review");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 2 Final Submission: ONLY NOW creates the transaction in database!
  const handleFinalOrderSubmit = async () => {
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
      }

      setIsSuccess(true);
      clearCart();

      if (paymentMethod === "ONLINE") {
        toast.success("Pesanan berhasil dibuat! Silakan selesaikan pembayaran.");
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

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const currentTimeFormatted = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {settings.midtransClientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={settings.midtransClientKey}
          strategy="afterInteractive"
        />
      )}

      {/* Step Progress Header */}
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {step === "review" ? (
            <button
              onClick={() => {
                setStep("input");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <Link
              href={`/store/${tenantSlug}`}
              className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu</span>
            </Link>
          )}
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`px-2.5 py-1 rounded-full border transition-all ${
              step === "input"
                ? "bg-catalog-primary text-white border-transparent shadow-xs"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            1. Form & Opsi
          </span>
          <span className="text-gray-300">→</span>
          <span
            className={`px-2.5 py-1 rounded-full border transition-all ${
              step === "review"
                ? "bg-catalog-primary text-white border-transparent shadow-xs"
                : "bg-gray-100 text-gray-400 border-gray-200"
            }`}
          >
            2. Nota Final
          </span>
        </div>
      </div>

      {/* STEP 1: INPUT FORM & ORDER CONFIG */}
      {step === "input" && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-7">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="font-bold text-xl text-gray-900 tracking-tight">
              Rincian Pesanan
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Periksa pilihan item dan lengkapi rincian pemesanan Anda
            </p>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Daftar Menu Dipilih ({items.reduce((acc, i) => acc + i.quantity, 0)} item)
            </div>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
              {items.map((item) => (
                <div key={item.cartItemId} className="p-3.5 flex gap-3.5 items-start">
                  <div className="h-16 w-16 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 overflow-hidden relative flex items-center justify-center">
                    <CheckoutItemThumbnail
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackName={item.name}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm text-gray-900 leading-snug line-clamp-1">
                        {item.name}
                      </div>
                      <div className="font-bold text-sm text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatCurrency(item.price)} / porsi
                    </div>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.modifiers.map((m: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                          >
                            +{m.name}
                            {m.price > 0 && ` (${formatCurrency(m.price)})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-[11px] text-gray-500 italic mt-1 bg-amber-50/60 border border-amber-200/50 rounded px-2 py-0.5 line-clamp-2">
                        "{item.notes}"
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-1">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center bg-white rounded shadow-xs text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-semibold w-5 text-center text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center bg-catalog-primary text-white rounded shadow-xs hover:bg-catalog-primary/90 transition-colors"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Claim Section */}
          {availablePromos.length > 0 && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Klaim Promo & Diskon Outlet</span>
                </div>
                {appliedPromo && (
                  <button
                    type="button"
                    onClick={() => setAppliedPromo(null)}
                    className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3.5 h-3.5" /> Batalkan
                  </button>
                )}
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">{appliedPromo.name}</span>
                      <span className="text-[11px] text-emerald-700">Promo berhasil dipasang</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-700">
                    -{formatCurrency(promoDiscount)}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Pilih voucher promo aktif untuk mendapatkan potongan harga:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                            !isEligible
                              ? "opacity-60 bg-gray-50 border-dashed border-gray-200 cursor-not-allowed"
                              : "bg-white hover:border-amber-400 hover:shadow-xs border-gray-200 active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs text-gray-900 line-clamp-1">
                              {promo.name}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                              {tag}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-2 flex items-center justify-between">
                            <span>
                              {minOrder > 0
                                ? `Min. ${formatCurrency(minOrder)}`
                                : "Tanpa Minimum"}
                            </span>
                            <span
                              className={`font-bold ${
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

          {/* Order Details Form */}
          <div className="space-y-5 pt-3 border-t border-gray-100">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">
              Informasi Pemesanan
            </h3>

            {/* Order Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Tipe Pesanan</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {settings.dineInEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("DINE_IN")}
                    className={`flex flex-col items-center justify-center py-3 px-2 text-xs font-semibold border-2 rounded-xl transition-all ${
                      orderType === "DINE_IN"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Utensils className="w-4 h-4 mb-1" />
                    Dine-In
                  </button>
                )}
                {settings.takeAwayEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={`flex flex-col items-center justify-center py-3 px-2 text-xs font-semibold border-2 rounded-xl transition-all ${
                      orderType === "TAKEAWAY"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mb-1" />
                    Bawa Pulang
                  </button>
                )}
                {settings.deliveryEnabled && (
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`flex flex-col items-center justify-center py-3 px-2 text-xs font-semibold border-2 rounded-xl transition-all ${
                      orderType === "DELIVERY"
                        ? "bg-catalog-primary/10 border-catalog-primary text-catalog-primary shadow-xs"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Car className="w-4 h-4 mb-1" />
                    Delivery
                  </button>
                )}
              </div>
            </div>

            {orderType === "DINE_IN" && (
              <div className="space-y-1.5">
                <Label htmlFor="table" className="text-xs font-semibold text-gray-700">
                  Nomor Meja {settings.tableNumberRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="table"
                  className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl font-bold text-sm"
                  placeholder="Contoh: Meja 12"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                  Nama Pemesan {settings.customerNameRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="name"
                  className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl text-sm"
                  placeholder="Nama Anda"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                  Nomor WhatsApp {settings.customerPhoneRequired && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-catalog-primary rounded-xl text-sm"
                  placeholder="0812..."
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                Pilih Metode Pembayaran
              </h3>
              <span className="text-[11px] text-gray-400">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Bayar di Kasir (Cash / Counter) */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between gap-3 ${
                  paymentMethod === "CASH"
                    ? "bg-catalog-primary/5 border-catalog-primary shadow-xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentMethod === "CASH"
                        ? "bg-catalog-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>Bayar di Kasir (Tunai / Kasir POS)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pesan sekarang dan bayar langsung ke kasir outlet saat pesanan diproses.
                    </p>
                  </div>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMethod === "CASH"
                      ? "border-catalog-primary bg-catalog-primary text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {paymentMethod === "CASH" && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Option 2: Bayar Online (Midtrans) */}
              {settings.onlinePaymentEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start justify-between gap-3 ${
                    paymentMethod === "ONLINE"
                      ? "bg-catalog-primary/5 border-catalog-primary shadow-xs"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === "ONLINE"
                          ? "bg-catalog-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <span>Bayar Online Instan</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Instan & Otomatis
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        QRIS, GoPay, OVO, ShopeePay, Virtual Account & Kartu Kredit.
                      </p>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      paymentMethod === "ONLINE"
                        ? "border-catalog-primary bg-catalog-primary text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {paymentMethod === "ONLINE" && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Temporary Cost Preview */}
          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal Menu</span>
              <span className="font-medium text-gray-800">{formatCurrency(subTotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Diskon Promo ({appliedPromo?.name})</span>
                <span>-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            {serviceChargeRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan ({serviceChargeRate}%)</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(serviceChargeAmount)}
                </span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  {settings.taxName || "Pajak (PB1)"} ({taxRate}%)
                </span>
                <span className="font-medium text-gray-800">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
              <span>Total Estimasi</span>
              <span className="text-catalog-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Action to Step 2 */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleProceedToReview}
              disabled={items.length === 0}
              className="w-full h-13 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Lihat Rincian Nota & Hitungan Final</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-[11px] text-center text-gray-400 mt-2">
              Pesanan belum dibentuk. Anda dapat memeriksa rincian nota di langkah berikutnya.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: NOTA FINAL REVIEW (PRE-BILL RECEIPT) */}
      {step === "review" && (
        <div className="space-y-4">
          {/* Physical / Digital Clean Receipt Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Receipt Top Header */}
            <div className="bg-gray-50/80 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  PRATINJAU NOTA (PRE-BILL)
                </div>
                <h2 className="font-bold text-lg text-gray-900 uppercase tracking-tight mt-0.5">
                  {settings.tenantName || "MENUIN OUTLET"}
                </h2>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  Belum Dibuat
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Order Meta info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">
                    Pelanggan
                  </span>
                  <span className="font-semibold text-gray-800 block truncate">
                    {formData.customerName || "-"}
                  </span>
                  {formData.customerPhone && (
                    <span className="text-gray-500 block truncate">{formData.customerPhone}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">
                    Layanan & Meja
                  </span>
                  <span className="font-semibold text-gray-800 block">
                    {orderType === "DINE_IN"
                      ? `Dine-In (${formData.tableNumber || "Tanpa Meja"})`
                      : orderType === "TAKEAWAY"
                      ? "Bawa Pulang (Takeaway)"
                      : "Delivery"}
                  </span>
                  <span className="text-gray-500 block">
                    {currentDateFormatted} • {currentTimeFormatted}
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Metode Pembayaran:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    {paymentMethod === "ONLINE" ? (
                      <>
                        <CreditCard className="w-3.5 h-3.5 text-catalog-primary" />
                        <span>Bayar Online Instan (QRIS / E-Wallet)</span>
                      </>
                    ) : (
                      <>
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bayar di Kasir (Tunai)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-gray-300 -mx-1" />

              {/* Itemized Table */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Rincian Menu ({items.reduce((acc, i) => acc + i.quantity, 0)} item)
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-gray-900 leading-snug">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Modifiers list */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="pl-3 mt-1 space-y-0.5 text-[11px] text-gray-500">
                          {item.modifiers.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>• {m.name}</span>
                              {m.price > 0 && <span>+{formatCurrency(m.price)}</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="pl-3 mt-0.5 text-[11px] text-gray-400 italic">
                          Catatan: "{item.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-gray-300 -mx-1" />

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Menu</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subTotal)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
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
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                )}

                {/* Double dashed separator */}
                <div className="border-t-2 border-dashed border-gray-300 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                      TOTAL PEMBAYARAN FINAL
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {paymentMethod === "ONLINE"
                        ? "Akan diproses melalui Midtrans"
                        : "Dibayarkan langsung ke kasir"}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-catalog-primary tracking-tight">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Reassurance Notice */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Pesanan Belum Masuk ke Antrean</span>
              <p className="text-blue-800 leading-relaxed">
                Rincian di atas adalah pratinjau nota akhir. Tekan tombol konfirmasi di bawah untuk
                membuat pesanan resmi. Jika ingin mengubah item atau data, tekan "Ubah Rincian".
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              onClick={handleFinalOrderSubmit}
              disabled={isLoading}
              className="w-full h-14 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Membuat Pesanan...</span>
                </>
              ) : (
                <>
                  {paymentMethod === "ONLINE" ? (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Lanjutkan Pembayaran Online • {formatCurrency(grandTotal)}</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-5 h-5" />
                      <span>Konfirmasi & Bayar di Kasir • {formatCurrency(grandTotal)}</span>
                    </>
                  )}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("input");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={isLoading}
              className="w-full h-11 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ubah Rincian Pesanan / Kembali</span>
            </Button>
          </div>
        </div>
      )}
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
    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 bg-gray-50 text-base uppercase select-none">
      {fallbackName.charAt(0)}
    </div>
  );
}

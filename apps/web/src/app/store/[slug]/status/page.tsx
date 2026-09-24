"use client";

import { use, useEffect, useState, useCallback } from "react";
import { getPublicOrderByNumber } from "@/lib/actions/orders";
import { verifyOnlinePaymentStatus } from "@/lib/actions/public-catalog";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Receipt,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import Script from "next/script";
import { OrderStatusCard, resolveOrderStatus } from "@/components/store/order-status/order-status-card";
import { OrderStatusDemoSwitcher } from "@/components/store/order-status/order-status-demo-switcher";
import { OrderStatusType } from "@/components/store/order-status/order-status-visual";

declare global {
  interface Window {
    snap: any;
  }
}

function StatusItemThumbnail({
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
    <div className="w-full h-full flex items-center justify-center font-semibold text-gray-400 bg-gray-50 text-xs uppercase select-none">
      {fallbackName.charAt(0)}
    </div>
  );
}

function formatOrderDate(dateString?: string | Date | null) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

export default function OrderStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderNumber = searchParams.get("order") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!initialOrderNumber);
  const [error, setError] = useState("");
  const [previewStatus, setPreviewStatus] = useState<OrderStatusType | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchOrder = useCallback(async (orderNum: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError("");

    const formattedOrderNum = orderNum.trim().toUpperCase();

    try {
      // Auto-verify with Midtrans if coming back from payment or status code in URL
      const hasPaymentParams = searchParams.get("transaction_status") || searchParams.get("status_code");
      if (hasPaymentParams) {
        await verifyOnlinePaymentStatus(formattedOrderNum, unwrappedParams.slug);
      }

      const data = await getPublicOrderByNumber(formattedOrderNum, unwrappedParams.slug);
      if (data) {
        // If order is ONLINE & still PENDING, double check Midtrans status
        if (data.paymentMethod === "ONLINE" && data.paymentStatus === "PENDING") {
          const verifyRes = await verifyOnlinePaymentStatus(formattedOrderNum, unwrappedParams.slug);
          if (verifyRes.success && verifyRes.paymentStatus === "PAID") {
            data.paymentStatus = "PAID";
            data.status = verifyRes.status || "NEW";
          }
        }
        setOrder(data);
      } else {
        if (!isSilent) setError("Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.");
        setOrder(null);
      }
    } catch (err) {
      if (!isSilent) setError("Terjadi kesalahan saat mengambil data pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [unwrappedParams.slug, searchParams]);

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber, fetchOrder]);

  const orderStatus = order?.status;
  const currentOrderNumber = order?.orderNumber;

  // Polling every 10 seconds if we have an active order
  useEffect(() => {
    if (!orderStatus || !currentOrderNumber || ["COMPLETED", "CANCELLED", "REJECTED"].includes(orderStatus)) return;

    const interval = setInterval(() => {
      fetchOrder(currentOrderNumber, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [orderStatus, currentOrderNumber, fetchOrder]);

  // Clean up active order in localStorage when order completes or cancels
  useEffect(() => {
    if (!order) return;
    const computed = resolveOrderStatus(order);
    const terminalStatuses = ["COMPLETED", "CANCELLED", "CANCELED", "REJECTED", "PAYMENT_FAILED"];
    const currentStatusUpper = (order.status || "").toUpperCase();
    const isTerminal = terminalStatuses.includes(computed) || terminalStatuses.includes(currentStatusUpper);

    if (isTerminal) {
      const storageKey = `menuin_active_order_${unwrappedParams.slug}`;
      if (localStorage.getItem(storageKey)) {
        localStorage.removeItem(storageKey);
        window.dispatchEvent(new Event("menuin_active_order_updated"));
      }
    }
  }, [order, unwrappedParams.slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    router.push(`${window.location.pathname}?order=${encodeURIComponent(orderNumber)}`);
  };

  const handlePayNow = () => {
    if (order?.orderNumber) {
      window.location.href = `/store/${unwrappedParams.slug}/payment?order=${encodeURIComponent(order.orderNumber)}`;
    }
  };

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const snapScriptUrl = order?.tenantSettings?.midtransEnvironment === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const outletPrimaryColor = order?.tenantSettings?.primaryColor || "#0E59F9";

  const totalItemsCount = order?.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0) || 0;

  const paymentBadge = order?.paymentStatus === "PAID"
    ? { label: "Lunas", className: " text-emerald-700 " }
    : order?.paymentMethod === "CASH"
    ? { label: "Bayar di Kasir", className: " text-amber-800 " }
    : { label: "Menunggu Pembayaran", className: "text-blue-700" };

  return (
    <>
      {order?.tenantSettings?.midtransClientKey && (
        <Script src={snapScriptUrl} data-client-key={order.tenantSettings.midtransClientKey} strategy="afterInteractive" />
      )}

      {/* 1. FIXED TOP NAVIGATION HEADER (Edge-to-edge with shadow) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] pt-[env(safe-area-inset-top)]">
        <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="w-9 flex items-center justify-start">
            <Link
              href={`/store/${unwrappedParams.slug}${order?.tableNumber ? `?table=${order.tableNumber}` : ""}`}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-gray-800 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke Menu"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </Link>
          </div>

          <h1 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight text-center truncate px-2">
            Status Pesanan
          </h1>

          <div className="w-9 shrink-0" aria-hidden="true" />
        </div>
      </header>

      {/* DEDICATED HEADER SPACER: Guarantees zero overlapping/clipping on any device (iPhone 16 safe-area) */}
      <div className="w-full h-14 sm:h-16 pt-[env(safe-area-inset-top)] shrink-0" aria-hidden="true" />

      {/* Main Container */}
      <div
        style={{
          "--outlet-primary": outletPrimaryColor,
          "--catalog-primary": outletPrimaryColor,
        } as React.CSSProperties}
        className="w-full flex flex-col relative text-gray-900 selection:bg-blue-100"
      >
        <main className="max-w-md mx-auto px-4 pt-3 pb-36 w-full space-y-4">
          {/* State 1: No Order Loaded / Search Screen */}
          {!order && !isLoading && (
            <div className="space-y-4 pt-2">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <h2 className="text-base font-semibold text-gray-900">Lacak Pesanan Anda</h2>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mb-5 leading-relaxed">
                  Masukkan nomor pesanan (cth: #A1B2C3) untuk melihat perkembangan status pesanan Anda.
                </p>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orderNumber" className="text-xs font-semibold text-gray-600">
                      Nomor Pesanan
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="orderNumber"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="#XXXXXX"
                        className="pl-10 h-11 uppercase text-base font-semibold tracking-wider rounded-xl border-gray-200 focus-visible:ring-1"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-semibold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: "var(--outlet-primary, #2563eb)" }}
                  >
                    Cari Pesanan
                  </Button>
                </form>
              </div>

              {/* Dev-only Interactive Preview */}
              {process.env.NODE_ENV === "development" && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Dev Preview Animasi
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      Localhost Only
                    </span>
                  </div>
                  <OrderStatusCard
                    status={previewStatus || "PROCESSING"}
                    orderNumber={orderNumber || "#A024"}
                    primaryColor={outletPrimaryColor}
                    variant="unboxed"
                  />
                  <OrderStatusDemoSwitcher
                    currentStatus={previewStatus || "PROCESSING"}
                    onSelectStatus={(st) => setPreviewStatus(st)}
                  />
                </div>
              )}
            </div>
          )}

          {/* State 2: Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-28 text-gray-400 space-y-3">
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: "var(--outlet-primary, #2563eb)" }}
              />
              <p className="text-xs font-medium text-gray-500">Mencari data pesanan...</p>
            </div>
          )}

          {/* State 3: Order Found & Displayed (Layout strictly follows Screenshot 3) */}
          {order && !isLoading && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-150 shadow-2xs space-y-4">
              {/* 2. ORDER TYPE PILL (Directly below header) */}
              <div className="px-3.5 py-2.5 rounded-xl border border-pink-200/60 bg-pink-50/30 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 font-medium">Order Type</span>
                <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                  {order.orderType === "DINE_IN"
                    ? `Dine-In${order.tableNumber ? ` (Meja ${order.tableNumber})` : ""}`
                    : order.orderType === "TAKEAWAY"
                    ? "Pick Up"
                    : "Delivery"}
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                </span>
              </div>

              {/* 3. DATE & ORDER NUMBER (Directly below Order Type) */}
              <div className="flex items-start justify-between text-xs sm:text-sm pt-0.5 px-0.5">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Date</span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {formatOrderDate(order.createdAt)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 block mb-0.5">Order Number</span>
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="inline-flex items-center gap-1 font-sans font-semibold text-xs sm:text-sm text-gray-900 hover:text-catalog-primary transition-colors cursor-pointer"
                    title="Klik untuk menyalin"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span>{order.orderNumber}</span>
                  </button>
                </div>
              </div>

              {/* 4. CENTER STAGE: STATUS PESANAN SVG (Prominent & Centered, replacing the QR code) */}
              {(() => {
                const computedStatus = resolveOrderStatus(order);
                const effectiveStatus = previewStatus || computedStatus;
                return (
                  <div className="pt-2 pb-1 flex flex-col items-center select-none text-center">
                    <OrderStatusCard
                      status={effectiveStatus}
                      orderNumber={order.orderNumber}
                      primaryColor={outletPrimaryColor}
                      variant="unboxed"
                    />

                    {/* Subtle Live Kitchen Connection Indicator */}
                    
                    {/* Pending Payment Notice Banner (Matching Screenshot 3 Notice Box) */}
                    {order.paymentStatus === "PENDING" && order.paymentMethod === "CASH" && (
                      <div className="mt-4 w-full bg-amber-50/90 border border-amber-200/90 text-amber-900 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          Silakan menuju kasir untuk melakukan pembayaran tunai sebesar{" "}
                          <strong className="font-semibold text-gray-900">
                            {formatCurrency(Number(order.grandTotal))}
                          </strong>.
                        </div>
                      </div>
                    )}

                    {order.paymentStatus === "PENDING" && order.paymentMethod === "ONLINE" && (
                      <div className="mt-4 w-full bg-blue-50/90 border border-blue-200/90 text-blue-950 p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left leading-relaxed">
                        <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          Pembayaran online belum selesai. Tekan <strong>Bayar Sekarang</strong> pada footer untuk menyelesaikan transaksi sebesar{" "}
                          <strong className="font-semibold text-gray-900">
                            {formatCurrency(Number(order.grandTotal))}
                          </strong>.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SEPARATOR DIVIDER */}
              <div className="border-t border-gray-100 my-2" />

              {/* 5. ORDERED ITEMS (Clean typography & layout matching Screenshot 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 tracking-tight">
                    Ordered Items
                  </h3>
                  <span className="text-xs text-gray-400">
                    {totalItemsCount} item
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {(order.items || []).map((item: any) => {
                    const itemPrice = Number(item.price || item.subtotal / (item.quantity || 1));
                    const itemSubtotal = Number(item.subtotal || itemPrice * item.quantity);

                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Compact fixed thumbnail (strictly 44px, never breaks layout) */}
                          {item.imageUrl ? (
                            <div className="w-11 h-11 min-w-[2.75rem] max-w-[2.75rem] min-h-[2.75rem] max-h-[2.75rem] rounded-xl bg-gray-50 border border-gray-150 overflow-hidden shrink-0 flex items-center justify-center">
                              <StatusItemThumbnail
                                src={item.imageUrl}
                                alt={item.productName}
                                fallbackName={item.productName}
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-900 shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-gray-900">
                                {item.productName}
                              </span>
                            </div>

                            {/* Modifiers List */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                                {item.modifiers
                                  .map((m: any) =>
                                    Number(m.price) > 0
                                      ? `${m.name} (+${formatCurrency(Number(m.price))})`
                                      : m.name
                                  )
                                  .join(", ")}
                              </div>
                            )}

                            {/* Customer Notes */}
                            {item.notes && (
                              <div className="text-[11px] text-gray-500 italic mt-0.5 leading-snug">
                                "{item.notes}"
                              </div>
                            )}

                            {/* Kitchen Completed Badge */}
                            {item.isCompleted && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Selesai
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price aligned right */}
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(itemSubtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEPARATOR DIVIDER */}
              <div className="border-t border-gray-100 my-2" />

              {/* 6. SUBTOTAL & TOTAL PAYMENT BREAKDOWN (Matching Screenshot 3) */}
              <div className="space-y-2 text-xs sm:text-sm pt-0.5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItemsCount} menu)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                </div>

                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Promo {order.promoCode ? `(${order.promoCode})` : ""}</span>
                    <span>-{formatCurrency(Number(order.discount))}</span>
                  </div>
                )}

                {Number(order.serviceCharge) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Layanan</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(Number(order.serviceCharge))}
                    </span>
                  </div>
                )}

                {Number(order.tax) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Pajak (PB1)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(Number(order.tax))}
                    </span>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between items-baseline font-semibold text-sm sm:text-base text-gray-900">
                  <span>Total Tagihan</span>
                  <span
                    className="text-lg sm:text-xl font-semibold tracking-tight"
                    style={{ color: "var(--outlet-primary, #2563eb)" }}
                  >
                    {formatCurrency(Number(order.grandTotal))}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <span>Status Pembayaran</span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full  ${paymentBadge.className}`}
                  >
                    {paymentBadge.label}
                  </span>
                </div>
              </div>

              {/* Dev-only Interactive Preview Switcher (Kept cleanly at the bottom) */}
              {process.env.NODE_ENV === "development" && (
                <div className="pt-3 border-t border-gray-100">
                  <OrderStatusDemoSwitcher
                    currentStatus={previewStatus || resolveOrderStatus(order)}
                    onSelectStatus={(st) => setPreviewStatus(st)}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 7. FIXED BOTTOM FOOTER (Matching Checkout & Payment) */}
     
    </>
  );
}


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
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { OrderStatusCard, resolveOrderStatus } from "@/components/store/order-status/order-status-card";
import { OrderStatusDemoSwitcher } from "@/components/store/order-status/order-status-demo-switcher";
import { OrderStatusType } from "@/components/store/order-status/order-status-visual";
import { OrderQrModal } from "@/components/store/order-status/order-qr-modal";

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchOrder = useCallback(async (orderNum: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError("");

    const formattedOrderNum = orderNum.trim().toUpperCase();

    try {
      const data = await getPublicOrderByNumber(formattedOrderNum, unwrappedParams.slug);
      if (data) {
        // Status final datang dari webhook DOKU; ini hanya fallback (dibatasi di server).
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
  }, [unwrappedParams.slug]);

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

  const outletPrimaryColor = order?.tenantSettings?.primaryColor || "#0E59F9";

  const totalItemsCount = order?.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0) || 0;

  const paymentBadge = order?.paymentStatus === "PAID"
    ? { label: "Lunas", className: "bg-emerald-50 text-emerald-700" }
    : order?.paymentMethod === "CASH"
    ? { label: "Bayar di Kasir", className: "bg-amber-50 text-amber-800" }
    : { label: "Menunggu Pembayaran", className: "bg-blue-50 text-blue-700" };

  return (
    <>
      {/* 1. FIXED TOP NAVIGATION HEADER (Edge-to-edge with shadow) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 shadow-xs pt-[env(safe-area-inset-top)]">
        <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="w-9 flex items-center justify-start">
            <Link
              href={`/store/${unwrappedParams.slug}${order?.tableNumber ? `?table=${order.tableNumber}` : ""}`}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-slate-800 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke Menu"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </Link>
          </div>

          <h1 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight text-center truncate px-2">
            Status Pesanan
          </h1>

          <div className="w-9 shrink-0" aria-hidden="true" />
        </div>
      </header>

      {/* DEDICATED HEADER SPACER: Guarantees zero overlapping/clipping on any device (iPhone safe-area) */}
      <div className="w-full h-14 sm:h-16 pt-[env(safe-area-inset-top)] shrink-0" aria-hidden="true" />

      {/* Main Container */}
      <div
        style={{
          "--outlet-primary": outletPrimaryColor,
          "--catalog-primary": outletPrimaryColor,
        } as React.CSSProperties}
        className="w-full flex flex-col relative text-slate-900 selection:bg-blue-100"
      >
        <main className="max-w-md mx-auto px-4 pt-3 pb-36 w-full space-y-4">
          {/* State 1: No Order Loaded / Search Screen */}
          {!order && !isLoading && (
            <div className="space-y-4 pt-2">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border-none shadow-sm-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <h2 className="text-base font-semibold text-slate-900">Lacak Pesanan Anda</h2>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mb-5 leading-relaxed">
                  Masukkan nomor pesanan (cth: #A1B2C3) untuk melihat perkembangan status pesanan Anda.
                </p>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orderNumber" className="text-xs font-semibold text-slate-700">
                      Nomor Pesanan
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="orderNumber"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="#XXXXXX"
                        className="pl-10 h-10 uppercase text-sm font-semibold tracking-wider rounded-full border-none bg-slate-50 shadow-sm-md focus-visible:ring-2 focus-visible:ring-catalog-primary"
                      />
                    </div>
                  </div>

                  {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}

                  <button
                    type="submit"
                    className="w-full h-11 rounded-full text-xs sm:text-sm font-semibold text-white shadow-sm-md transition-all active:scale-[0.98] cursor-pointer border-none flex items-center justify-center"
                    style={{ backgroundColor: outletPrimaryColor }}
                  >
                    Cari Pesanan
                  </button>
                </form>
              </div>

              {/* Dev-only Interactive Preview */}
              {process.env.NODE_ENV === "development" && (
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Dev Preview Animasi
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
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
            <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: outletPrimaryColor }}
              />
              <p className="text-xs font-medium text-slate-500">Mencari data pesanan...</p>
            </div>
          )}

          {/* State 3: Order Found & Displayed (Clean Menuin Design) */}
          {order && !isLoading && (
            <div className="space-y-6 pt-1">
              {/* 1. INFORMASI DASAR (Tipe Pesanan, Waktu, Nomor Pesanan) */}
              <div className="space-y-3">
                {/* Tipe Pesanan Pill - Clean borderless */}
                <div className="px-4 py-3 rounded-2xl bg-slate-50 shadow-sm-md flex items-center justify-between text-xs sm:text-sm border-none">
                  <span className="text-slate-500 font-medium">Tipe Pesanan</span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    <span>
                      {order.orderType === "DINE_IN"
                        ? `Dine-In${order.tableNumber ? ` (Meja ${order.tableNumber})` : ""}`
                        : order.orderType === "TAKEAWAY"
                        ? "Bawa Pulang"
                        : "Delivery"}
                    </span>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center p-0.5 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </span>
                </div>

                {/* Date & Order Number */}
                <div className="flex items-center justify-between text-xs sm:text-sm px-1 pt-0.5">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Waktu Pemesanan</span>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm font-numeric tabular-nums">
                      {formatOrderDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Nomor Pesanan</span>
                    <button
                      type="button"
                      onClick={handleCopyOrderNumber}
                      className="inline-flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-900 hover:text-catalog-primary font-numeric tabular-nums px-2.5 py-1 rounded-full bg-slate-50 shadow-2xs hover:bg-slate-100 transition-all cursor-pointer border-none"
                      title="Klik untuk menyalin"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{order.orderNumber}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. CENTER STAGE: STATUS PESANAN & STEPPER */}
              {(() => {
                const computedStatus = resolveOrderStatus(order);
                const effectiveStatus = previewStatus || computedStatus;
                return (
                  <div className="pt-1 pb-1 flex flex-col items-center select-none text-center">
                    <OrderStatusCard
                      status={effectiveStatus}
                      orderNumber={order.orderNumber}
                      primaryColor={outletPrimaryColor}
                      variant="unboxed"
                    />

                    {/* Pending Payment Notice Banner */}
                    {order.paymentStatus === "PENDING" && order.paymentMethod === "CASH" && (
                      <div className="mt-5 w-full bg-amber-50/80 border border-amber-200/70 text-amber-900 p-4 rounded-2xl text-xs sm:text-sm shadow-sm-md space-y-3 text-left leading-relaxed">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            Silakan menuju kasir untuk melakukan pembayaran tunai sebesar{" "}
                            <strong className="font-semibold text-slate-900 font-numeric tabular-nums">
                              {formatCurrency(Number(order.grandTotal))}
                            </strong>.
                          </div>
                        </div>

                        {/* Modern Action Button: Tampilkan QR Pembayaran */}
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-between transition-all shadow-sm-md active:scale-[0.98] cursor-pointer border-none"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                              <QrCode className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-slate-900">Tampilkan QR Pesanan</span>
                          </div>
                          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                            Buka QR &rarr;
                          </span>
                        </button>

                        {/* QR Code Popup Modal */}
                        <OrderQrModal
                          isOpen={isQrModalOpen}
                          onClose={() => setIsQrModalOpen(false)}
                          orderNumber={order.orderNumber}
                          grandTotal={Number(order.grandTotal)}
                          customerName={order.customerName}
                          tableNumber={order.tableNumber}
                          orderType={order.orderType}
                          primaryColor={outletPrimaryColor}
                          paymentStatus={order.paymentStatus}
                          status={order.status}
                        />
                      </div>
                    )}

                    {order.paymentStatus === "PENDING" && order.paymentMethod === "ONLINE" && (
                      <div className="mt-5 w-full bg-blue-50/80 border border-blue-200/70 text-blue-950 p-4 rounded-2xl text-xs sm:text-sm shadow-sm-md flex items-start gap-2.5 text-left leading-relaxed">
                        <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          Pembayaran online belum selesai. Tekan <strong>Bayar Sekarang</strong> pada bagian bawah untuk menyelesaikan transaksi sebesar{" "}
                          <strong className="font-semibold text-slate-900 font-numeric tabular-nums">
                            {formatCurrency(Number(order.grandTotal))}
                          </strong>.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 3. DAFTAR MENU DIPESAN */}
              <div className="space-y-3 pt-6 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight">
                    Daftar Menu Dipesan
                  </h3>
                  <span className="text-xs text-slate-400 font-normal">
                    {totalItemsCount} item
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {(order.items || []).map((item: any) => {
                    const itemPrice = Number(item.price || item.subtotal / (item.quantity || 1));
                    const itemSubtotal = Number(item.subtotal || itemPrice * item.quantity);

                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-start gap-3 min-w-0">
                          {item.imageUrl ? (
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-150 shadow-2xs overflow-hidden shrink-0 flex items-center justify-center aspect-square">
                              <StatusItemThumbnail
                                src={item.imageUrl}
                                alt={item.productName}
                                fallbackName={item.productName}
                              />
                            </div>
                          ) : null}

                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 shrink-0 font-numeric tabular-nums">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-slate-900">
                                {item.productName}
                              </span>
                            </div>

                            {/* Modifiers List */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-xs text-slate-500 mt-0.5 leading-snug">
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
                              <div className="text-[11px] text-slate-600 italic mt-1 bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1 line-clamp-2">
                                "{item.notes}"
                              </div>
                            )}

                            {/* Kitchen Completed Badge */}
                            {item.isCompleted && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 border-none">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price aligned right */}
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-slate-900 whitespace-nowrap font-numeric tabular-nums">
                            {formatCurrency(itemSubtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. RINCIAN PEMBAYARAN */}
              <div className="space-y-3 pt-6 border-t border-slate-200/80">
                <h3 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight">
                  Rincian Pembayaran
                </h3>

                <div className="space-y-2 text-xs sm:text-sm pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({totalItemsCount} menu)</span>
                    <span className="font-semibold text-slate-900 font-numeric tabular-nums">
                      {formatCurrency(Number(order.totalAmount))}
                    </span>
                  </div>

                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Diskon Promo {order.promoCode ? `(${order.promoCode})` : ""}</span>
                      <span className="font-numeric tabular-nums">-{formatCurrency(Number(order.discount))}</span>
                    </div>
                  )}

                  {Number(order.serviceCharge) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Layanan</span>
                      <span className="font-semibold text-slate-900 font-numeric tabular-nums">
                        {formatCurrency(Number(order.serviceCharge))}
                      </span>
                    </div>
                  )}

                  {Number(order.tax) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak (PB1)</span>
                      <span className="font-semibold text-slate-900 font-numeric tabular-nums">
                        {formatCurrency(Number(order.tax))}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline font-semibold text-sm sm:text-base text-slate-900">
                    <span>Total Tagihan</span>
                    <span
                      className="text-xl sm:text-2xl font-semibold text-catalog-primary font-numeric tabular-nums tracking-tight"
                      style={{ color: outletPrimaryColor }}
                    >
                      {formatCurrency(Number(order.grandTotal))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <span>Status Pembayaran</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-none ${paymentBadge.className}`}
                    >
                      {paymentBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dev-only Interactive Preview Switcher (Kept cleanly at the bottom) */}
              {process.env.NODE_ENV === "development" && (
                <div className="pt-3 border-t border-slate-100">
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

      {/* 5. FIXED BOTTOM FOOTER (Consistent with Menuin Storefront) */}
      {order && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex flex-col shrink-0 justify-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-1">
                Total Tagihan
              </span>
              <span className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight whitespace-nowrap font-numeric tabular-nums">
                {formatCurrency(Number(order.grandTotal))}
              </span>
            </div>

            {order.paymentStatus === "PENDING" && order.paymentMethod === "ONLINE" ? (
              <button
                type="button"
                onClick={handlePayNow}
                className="h-11 sm:h-12 px-6 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white font-semibold text-xs sm:text-sm shadow-sm-md active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                style={{ backgroundColor: outletPrimaryColor }}
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang</span>
              </button>
            ) : (
              <Link
                href={`/store/${unwrappedParams.slug}${order.tableNumber ? `?table=${order.tableNumber}` : ""}`}
                className="h-11 sm:h-12 px-6 rounded-full bg-catalog-primary hover:bg-catalog-primary/90 text-white font-semibold text-xs sm:text-sm shadow-sm-md active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center"
                style={{ backgroundColor: outletPrimaryColor }}
              >
                <span>Pesan Menu Lain</span>
              </Link>
            )}
          </div>
        </footer>
      )}
    </>
  );
}


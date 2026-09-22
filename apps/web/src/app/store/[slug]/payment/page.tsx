"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { getPublicOrderByNumber } from "@/lib/actions/orders";
import {
  generatePaymentToken,
  updateOrderPaymentToCash,
  verifyOnlinePaymentStatus,
} from "@/lib/actions/public-catalog";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Banknote,
  CreditCard,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import Script from "next/script";

declare global {
  interface Window {
    snap: any;
  }
}

function PaymentItemThumbnail({
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

export default function OnlinePaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order") || "";

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwitchingToCash, setIsSwitchingToCash] = useState(false);
  const [error, setError] = useState("");
  const [snapReady, setSnapReady] = useState(false);

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!orderNumber) {
      router.replace(`/store/${unwrappedParams.slug}`);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getPublicOrderByNumber(orderNumber, unwrappedParams.slug);
        if (data) {
          // If already paid, cancelled, or selected CASH, redirect directly to status page
          if (
            data.paymentStatus === "PAID" ||
            data.status === "CANCELLED" ||
            data.paymentMethod === "CASH"
          ) {
            window.location.replace(
              `/store/${unwrappedParams.slug}/status?order=${encodeURIComponent(orderNumber)}`
            );
            return;
          }
          setOrder(data);
        } else {
          setError("Pesanan tidak ditemukan.");
        }
      } catch (err) {
        setError("Terjadi kesalahan saat mengambil data pesanan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, unwrappedParams.slug, router]);

  const handlePayCash = async () => {
    setIsSwitchingToCash(true);
    try {
      const res = await updateOrderPaymentToCash(orderNumber, unwrappedParams.slug);
      if (res.error) {
        toast.error(res.error);
        setIsSwitchingToCash(false);
      } else {
        toast.success("Metode pembayaran dialihkan ke kasir. Silakan bayar kepada staf kasir.");
        window.location.href = `/store/${unwrappedParams.slug}/status?order=${encodeURIComponent(
          orderNumber
        )}`;
      }
    } catch (err) {
      toast.error("Gagal memproses pengalihan ke pembayaran kasir.");
      setIsSwitchingToCash(false);
    }
  };

  const handlePayOnline = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/store/${unwrappedParams.slug}/status?order=${encodeURIComponent(
        orderNumber
      )}`;
      const res = await generatePaymentToken(orderNumber, unwrappedParams.slug, returnUrl);

      if (res.error) {
        toast.error(res.error);
        setIsProcessing(false);
        return;
      }

      if (res.snapToken && window.snap) {
        window.snap.pay(res.snapToken, {
          onSuccess: async function () {
            toast.loading("Memverifikasi pembayaran...");
            const verifyRes = await verifyOnlinePaymentStatus(orderNumber, unwrappedParams.slug);
            toast.dismiss();
            if (verifyRes.success && verifyRes.paymentStatus === "PAID") {
              toast.success("Pembayaran berhasil dikonfirmasi!");
            } else {
              toast.info("Pembayaran sedang diproses, silakan cek status berkala.");
            }
            window.location.href = returnUrl;
          },
          onPending: function () {
            toast.info("Menunggu penyelesaian pembayaran Anda");
            window.location.href = returnUrl;
          },
          onError: function () {
            toast.error("Pembayaran gagal atau dibatalkan");
            setIsProcessing(false);
          },
          onClose: function () {
            toast.info("Jendela pembayaran ditutup. Tekan tombol di bawah untuk membuka kembali.");
            setIsProcessing(false);
          },
        });
      } else {
        toast.error("Sistem pembayaran belum siap atau pesanan tidak valid.");
        setIsProcessing(false);
      }
    } catch (err) {
      toast.error("Gagal memproses pembayaran online.");
      setIsProcessing(false);
    }
  }, [orderNumber, unwrappedParams.slug, isProcessing]);

  // Auto trigger Midtrans Snap popup as soon as order and snap.js are ready
  useEffect(() => {
    if (
      order &&
      order.paymentMethod === "ONLINE" &&
      snapReady &&
      !hasAutoStarted.current &&
      !isProcessing
    ) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => {
        handlePayOnline();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [order, snapReady, handlePayOnline, isProcessing]);

  const snapScriptUrl =
    order?.tenantSettings?.midtransEnvironment === "production"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-catalog-primary mb-4" />
        <p className="text-gray-500 font-medium text-sm">Menyiapkan pembayaran...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center space-y-4">
          <p className="text-red-500 font-medium text-sm">{error || "Pesanan tidak ditemukan"}</p>
          <Button
            asChild
            className="w-full bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl h-12 font-semibold text-sm cursor-pointer"
          >
            <Link href={`/store/${unwrappedParams.slug}`}>Kembali ke Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalItemsCount = (order.items || []).reduce(
    (acc: number, i: any) => acc + (i.quantity || 0),
    0
  );

  return (
    <>
      {order?.tenantSettings?.midtransClientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={order.tenantSettings.midtransClientKey}
          strategy="afterInteractive"
          onReady={() => setSnapReady(true)}
        />
      )}

      {/* Sticky Payment Top Navigation Header (Taller & Prominent - matches Cart page) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 h-20 sm:h-20 flex items-center justify-between">
          <div className="w-11 flex items-center justify-start">
            <Link
              href={`/store/${unwrappedParams.slug}${
                order.tableNumber ? `?table=${order.tableNumber}` : ""
              }`}
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-gray-800 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke Menu"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </Link>
          </div>

          <h1 className="font-semibold text-xl sm:text-2xl text-gray-900 tracking-tight text-center truncate px-2">
            Pembayaran
          </h1>

          <div className="w-11 shrink-0 flex items-center justify-end">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0 whitespace-nowrap">
              Menunggu Bayar
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container with generous bottom padding for taller sticky footer */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-5 pb-48 sm:pb-52 w-full space-y-6">
        {/* Main Summary Card - Matches Cart Page Style */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-gray-200 shadow-sm space-y-7 sm:space-y-8">
          {/* 1. INFORMASI PEMESANAN */}
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3.5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-xl sm:text-2xl text-gray-900 tracking-tight">
                  Informasi Pemesanan
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Rincian pemesan dan data layanan pesanan
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] uppercase font-semibold text-gray-400 block tracking-wider">
                  No. Pesanan
                </span>
                <span className="font-semibold text-sm sm:text-base text-gray-900">
                  {order.orderNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block">
                  Nama Pemesan
                </span>
                <span className="font-semibold text-base text-gray-900 block truncate">
                  {order.customerName || "-"}
                </span>
                {order.customerPhone && (
                  <span className="text-sm text-gray-500 block truncate">
                    {order.customerPhone}
                  </span>
                )}
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block">
                  Tipe Layanan
                </span>
                <span className="font-semibold text-base text-gray-900 block">
                  {order.orderType === "DINE_IN"
                    ? `Dine-In (${order.tableNumber ? `Meja ${order.tableNumber}` : "Tanpa Meja"})`
                    : order.orderType === "TAKEAWAY"
                    ? "Bawa Pulang (Takeaway)"
                    : "Delivery"}
                </span>
                <span className="text-sm text-gray-500 block">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. DAFTAR MENU DIPILIH (TANPA TOMBOL EDIT/TAMBAH/STEPPER) */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="pb-3 border-b border-gray-100">
              <div className="text-sm font-medium tracking-wider text-gray-500">
                Daftar Menu ({totalItemsCount} item)
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {(order.items || []).map((item: any) => {
                const itemPrice = Number(item.price || item.subtotal / (item.quantity || 1));
                const itemSubtotal = Number(item.subtotal || itemPrice * item.quantity);

                return (
                  <div key={item.id} className="py-4 sm:py-5 flex gap-4 sm:gap-5 items-start">
                    <div className="h-24 w-24 sm:h-20 sm:w-20 bg-gray-50 rounded-2xl flex-shrink-0 border border-gray-100 overflow-hidden relative flex items-center justify-center">
                      <PaymentItemThumbnail
                        src={item.imageUrl}
                        alt={item.productName}
                        fallbackName={item.productName}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-semibold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2">
                          {item.productName}
                        </div>
                        <div className="font-semibold text-base sm:text-lg text-gray-900 whitespace-nowrap">
                          {formatCurrency(itemSubtotal)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 mt-0.5">
                        {formatCurrency(itemPrice)} / porsi
                      </div>

                      {/* Modifiers list */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.modifiers
                            .map((m: any) =>
                              Number(m.price) > 0
                                ? `${m.name} (+${formatCurrency(Number(m.price))})`
                                : m.name
                            )
                            .join(", ")}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-xs sm:text-sm text-gray-600 italic mt-1.5 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1 line-clamp-2">
                          "{item.notes}"
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {item.quantity} porsi
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SUBTOTAL MENU & RINCIAN PEMBAYARAN */}
          <div className="space-y-3.5 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 tracking-tight">
              Rincian Pembayaran
            </h3>

            <div className="space-y-2.5 text-sm sm:text-base pt-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItemsCount} menu)</span>
                <span className="font-semibold text-gray-800">
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
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(Number(order.serviceCharge))}
                  </span>
                </div>
              )}

              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Pajak</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(Number(order.tax))}
                  </span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-baseline font-semibold text-base sm:text-lg text-gray-900">
                <span>Total Tagihan</span>
                <span className="text-xl sm:text-2xl text-catalog-primary font-semibold tracking-tight">
                  {formatCurrency(Number(order.grandTotal))}
                </span>
              </div>
            </div>
          </div>

          {/* 4. METODE PEMBAYARAN ONLINE */}
          <div className="space-y-3.5 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base tracking-wider text-gray-500">
                Metode Pembayaran
              </h3>
              
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border-2 border-catalog-primary bg-catalog-primary/5 flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-catalog-primary text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                  <span>Pembayaran Online Instan</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Mendukung pembayaran melalui <strong>QRIS</strong>, <strong>GoPay</strong>,{" "}
                  <strong>ShopeePay</strong>, <strong>OVO</strong>, <strong>Virtual Account</strong>, dan{" "}
                  <strong>Kartu Kredit</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback Option: Kendala Pembayaran Online -> Bayar di Kasir */}
        <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200/80 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-amber-950">
                Kendala Pembayaran Online?
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Jika saldo e-wallet tidak cukup, QRIS gagal dipindai, atau terjadi gangguan transaksi, Anda dapat mengubah metode pembayaran ke kasir.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handlePayCash}
            disabled={isSwitchingToCash || isProcessing}
            className="w-full h-12 bg-white hover:bg-amber-100/50 border-amber-300 text-amber-950 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {isSwitchingToCash ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
                <span>Mengalihkan ke Kasir...</span>
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Bayar di Kasir Saja</span>
                <ChevronRight className="w-4 h-4 text-amber-600 ml-auto" />
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Sticky Bottom Footer (Taller & Prominent with Rounded Top - matches Cart page) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-[32px] sm:rounded-t-[36px] border-t border-gray-100 shadow-[0_-12px_40px_rgba(0,0,0,0.09)]">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4">
          {/* Left: Total Tagihan */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Total Tagihan</span>
            <span className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">
              {formatCurrency(Number(order.grandTotal))}
            </span>
          </div>

          {/* Right: Action Button */}
          <Button
            type="button"
            onClick={handlePayOnline}
            disabled={isProcessing || isSwitchingToCash}
            className="h-14 sm:h-15 px-7 sm:px-9 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-2xl font-semibold text-base sm:text-lg shadow-sm active:scale-[0.98] transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <span>Membuka Pembayaran...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 shrink-0" />
                <span>Bayar Sekarang</span>
              </div>
            )}
          </Button>
        </div>
      </footer>
    </>
  );
}

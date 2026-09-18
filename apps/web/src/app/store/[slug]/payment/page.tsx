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
  Wallet,
  Banknote,
  CreditCard,
  ShieldCheck,
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
            className="w-full bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl h-12 font-semibold text-sm"
          >
            <Link href={`/store/${unwrappedParams.slug}`}>Kembali ke Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative pb-24">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <Link
                href={`/store/${unwrappedParams.slug}/status?order=${encodeURIComponent(
                  orderNumber
                )}`}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold text-base text-gray-900 leading-tight">
                Pembayaran Online
              </h1>
              <p className="text-[11px] text-gray-500">Selesaikan transaksi Anda</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            Menunggu Bayar
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Main Online Payment Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Total Tagihan
                </span>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5 tracking-tight">
                  {formatCurrency(Number(order.grandTotal))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  Nomor Pesanan
                </span>
                <span className="font-extrabold text-xs text-gray-800 mt-0.5 block">
                  {order.orderNumber}
                </span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <ShieldCheck className="w-4 h-4 text-catalog-primary" />
                <span>Pembayaran Resmi Midtrans</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mendukung pembayaran instan melalui <strong>QRIS</strong>, <strong>GoPay</strong>,{" "}
                <strong>ShopeePay</strong>, <strong>OVO</strong>, <strong>Virtual Account</strong>, dan{" "}
                <strong>Kartu Kredit</strong>.
              </p>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={handlePayOnline}
              disabled={isProcessing || isSwitchingToCash}
              className="w-full h-14 bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Membuka Pembayaran...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Bayar Sekarang (Buka Midtrans)</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-gray-400">
              Jendela pembayaran Midtrans akan terbuka secara otomatis di layar Anda.
            </p>
          </div>

          {/* Fallback / Jaga-jaga: Tombol Peringatan & Ganti ke Bayar di Kasir */}
          <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200/80 space-y-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-amber-950">
                  Kendala Pembayaran Online?
                </h3>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  Jika terjadi masalah dengan sistem pembayaran online, saldo e-wallet tidak cukup,
                  atau QRIS gagal dipindai, silakan klik tombol di bawah untuk melakukan pembayaran di
                  kasir.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handlePayCash}
              disabled={isSwitchingToCash || isProcessing}
              className="w-full h-12 bg-white hover:bg-amber-100/50 border-amber-300 text-amber-950 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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
        </div>
      </div>
    </>
  );
}

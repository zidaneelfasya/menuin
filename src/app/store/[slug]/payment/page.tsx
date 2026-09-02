"use client";

import { use, useEffect, useState } from "react";
import { getPublicOrderByNumber } from "@/lib/actions/orders";
import { generatePaymentToken, updateOrderPaymentToCash } from "@/lib/actions/public-catalog";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Wallet, Banknote } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import Script from "next/script";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PaymentSelectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order") || "";

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      router.replace(`/store/${unwrappedParams.slug}`);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getPublicOrderByNumber(orderNumber, unwrappedParams.slug);
        if (data) {
          // If already paid or cancelled, or method already selected (and not ONLINE pending), go to status
          if (data.paymentStatus === 'PAID' || data.status === 'CANCELLED' || (data.paymentMethod === 'CASH')) {
            router.replace(`/store/${unwrappedParams.slug}/status?order=${orderNumber}`);
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
    setIsProcessing(true);
    try {
      const res = await updateOrderPaymentToCash(orderNumber, unwrappedParams.slug);
      if (res.error) {
        toast.error(res.error);
        setIsProcessing(false);
      } else {
        toast.success("Metode pembayaran tunai dipilih. Silakan menuju kasir.");
        window.location.href = `/store/${unwrappedParams.slug}/status?order=${orderNumber}`;
      }
    } catch (err) {
      toast.error("Gagal memproses pembayaran tunai.");
      setIsProcessing(false);
    }
  };

  const handlePayOnline = async () => {
    setIsProcessing(true);
    try {
      const returnUrl = `${window.location.origin}/store/${unwrappedParams.slug}/status?order=${orderNumber}`;
      const res = await generatePaymentToken(orderNumber, unwrappedParams.slug, returnUrl);
      
      if (res.error) {
        toast.error(res.error);
        setIsProcessing(false);
        return;
      }

      if (res.snapToken && window.snap) {
        window.snap.pay(res.snapToken, {
          onSuccess: function () {
            toast.success("Pembayaran berhasil!");
            window.location.href = returnUrl;
          },
          onPending: function () {
            toast.info("Menunggu pembayaran Anda");
            window.location.href = returnUrl;
          },
          onError: function () {
            toast.error("Pembayaran gagal atau dibatalkan");
            window.location.href = returnUrl;
          },
          onClose: function () {
            toast.error("Anda menutup jendela pembayaran");
            window.location.href = returnUrl;
          }
        });
      } else {
        toast.error("Sistem pembayaran belum siap atau pesanan tidak valid.");
      }
    } catch (err) {
      toast.error("Gagal memproses pembayaran online.");
    } finally {
      setIsProcessing(false);
    }
  };

  const snapScriptUrl = order?.tenantSettings?.midtransEnvironment === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-catalog-primary mb-4" />
        <p className="text-gray-500 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center space-y-4">
          <p className="text-red-500 font-medium">{error || "Pesanan tidak ditemukan"}</p>
          <Button asChild className="w-full bg-catalog-primary hover:bg-catalog-primary/90 text-white rounded-xl h-12 font-semibold">
            <Link href={`/store/${unwrappedParams.slug}`}>
              Kembali ke Menu
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {order?.tenantSettings?.midtransClientKey && (
        <Script src={snapScriptUrl} data-client-key={order.tenantSettings.midtransClientKey} strategy="afterInteractive" />
      )}
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative pb-24">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0 rounded-full hover:bg-gray-100">
              <Link href={`/store/${unwrappedParams.slug}/status?order=${orderNumber}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-bold text-lg text-gray-800">Pilih Pembayaran</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm text-gray-500 font-medium mb-1">Total Tagihan</h2>
            <div className="text-3xl font-black text-gray-900 mb-2">{formatCurrency(Number(order.grandTotal))}</div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Nomor Pesanan</span>
              <span className="font-semibold text-gray-800">{order.orderNumber}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 text-lg">Pilih Metode Pembayaran</h3>
            
            {order.tenantSettings?.midtransClientKey && order.tenantSettings?.onlinePaymentEnabled && (
              <button 
                onClick={handlePayOnline}
                disabled={isProcessing}
                className="w-full bg-white border-2 border-gray-100 hover:border-catalog-primary/50 transition-colors rounded-2xl p-4 flex items-center gap-4 text-left group"
              >
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">Bayar Online</div>
                  <div className="text-sm text-gray-500 mt-0.5">QRIS, GoPay, OVO, Virtual Account</div>
                </div>
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <ArrowLeft className="h-5 w-5 text-gray-300 rotate-180" />}
              </button>
            )}

            <button 
              onClick={handlePayCash}
              disabled={isProcessing}
              className="w-full bg-white border-2 border-gray-100 hover:border-catalog-primary/50 transition-colors rounded-2xl p-4 flex items-center gap-4 text-left group"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-lg">Bayar Tunai di Kasir</div>
                <div className="text-sm text-gray-500 mt-0.5">Bayar langsung kepada staf kami</div>
              </div>
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <ArrowLeft className="h-5 w-5 text-gray-300 rotate-180" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

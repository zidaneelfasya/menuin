"use client";

import { use, useEffect, useState } from "react";
import { getPublicOrderByNumber } from "@/lib/actions/orders";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowLeft, CheckCircle2, Clock, Utensils, ChefHat } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import Script from "next/script";

declare global {
  interface Window {
    snap: any;
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
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = async (orderNum: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError("");
    
    try {
      const data = await getPublicOrderByNumber(orderNum, unwrappedParams.slug);
      if (data) {
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
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber, unwrappedParams.slug]);

  // Polling every 10 seconds if we have an active order
  useEffect(() => {
    if (!order || ['COMPLETED', 'CANCELLED'].includes(order.status)) return;
    
    const interval = setInterval(() => {
      fetchOrder(order.orderNumber, true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [order?.status, order?.orderNumber, unwrappedParams.slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    router.push(`${window.location.pathname}?order=${encodeURIComponent(orderNumber)}`);
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'NEW': return { label: 'Menunggu Konfirmasi', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock };
      case 'PROCESSING': return { label: 'Sedang Dimasak', color: 'text-amber-600', bg: 'bg-amber-100', icon: ChefHat };
      case 'READY': return { label: 'Siap Disajikan', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Utensils };
      case 'COMPLETED': return { label: 'Selesai', color: 'text-slate-600', bg: 'bg-slate-100', icon: CheckCircle2 };
      default: return { label: status, color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock };
    }
  };

  const handlePayNow = () => {
    if (order?.snapToken && window.snap) {
      window.snap.pay(order.snapToken, {
        onSuccess: function () {
          toast.success("Pembayaran berhasil!");
          fetchOrder(order.orderNumber, true);
        },
        onPending: function () {
          toast.info("Menunggu pembayaran Anda");
          fetchOrder(order.orderNumber, true);
        },
        onError: function () {
          toast.error("Pembayaran gagal atau dibatalkan");
        },
        onClose: function () {
          toast.error("Anda menutup jendela pembayaran");
        }
      });
    } else {
      toast.error("Sistem pembayaran belum siap atau pesanan tidak valid.");
    }
  };

  const snapScriptUrl = order?.tenantSettings?.midtransEnvironment === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

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
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-lg text-gray-800">Cek Status Pesanan</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!order && !isLoading && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Lacak Pesanan Anda</h2>
            <p className="text-gray-500 text-sm mb-6">Masukkan nomor pesanan (cth: #A1B2C3) untuk melihat status pesanan Anda saat ini.</p>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Nomor Pesanan</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    id="orderNumber"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    placeholder="#XXXXXX"
                    className="pl-10 h-12 uppercase text-lg font-bold tracking-widest"
                  />
                </div>
              </div>
              
              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
              
              <Button type="submit" className="w-full h-12 rounded-xl text-md font-bold">
                Cari Pesanan
              </Button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-catalog-primary" />
            <p className="font-medium">Mencari pesanan...</p>
          </div>
        )}

        {order && !isLoading && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Nomor Pesanan</p>
                <p className="text-2xl font-black text-gray-900 tracking-wider">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Total</p>
                <p className="text-lg font-bold text-catalog-primary">{formatCurrency(Number(order.grandTotal))}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <p className="text-sm text-gray-500 font-medium mb-4">Status Pesanan Saat Ini</p>
              
              {(() => {
                const statusInfo = getStatusDisplay(order.status);
                const Icon = statusInfo.icon;
                return (
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full ${statusInfo.bg} ${statusInfo.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-10 h-10" />
                    </div>
                    <h3 className={`text-2xl font-black ${statusInfo.color}`}>{statusInfo.label}</h3>
                    
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Otomatis update (Live)
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {order.status === 'PENDING' && order.snapToken && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">Menunggu Pembayaran</p>
                  <p className="text-xs text-gray-500">Selesaikan pembayaran untuk memproses pesanan</p>
                </div>
                <Button 
                  onClick={handlePayNow}
                  className="w-full h-12 rounded-xl text-md font-bold bg-catalog-primary hover:bg-catalog-primary/90 text-white shadow-lg"
                >
                  Bayar Sekarang
                </Button>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">Detail Item</h3>
              <div className="space-y-3">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-gray-50 bg-gray-50/50">
                    <div className={`flex items-center gap-3 ${item.isCompleted ? 'opacity-60' : ''}`}>
                      <span className={`font-bold px-2 py-0.5 rounded-md text-sm ${item.isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-900'}`}>{item.quantity}x</span>
                      <span className={`font-medium text-sm ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                        {item.productName}
                      </span>
                    </div>
                    {item.isCompleted && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

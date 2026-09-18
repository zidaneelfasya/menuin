"use client";

import { use, useEffect, useState, useCallback } from "react";
import { getPublicOrderByNumber } from "@/lib/actions/orders";
import { verifyOnlinePaymentStatus } from "@/lib/actions/public-catalog";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowLeft, CheckCircle2, Clock, Utensils, ChefHat } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import Script from "next/script";
import { OrderStatusCard, resolveOrderStatus } from "@/components/store/order-status/order-status-card";
import { OrderStatusDemoSwitcher } from "@/components/store/order-status/order-status-demo-switcher";
import { OrderStatusType } from "@/components/store/order-status/order-status-visual";
import { OrderIllustrationDisclaimer } from "@/components/store/order-status/order-illustration-disclaimer";

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
  const [previewStatus, setPreviewStatus] = useState<OrderStatusType | null>(null);

  const fetchOrder = useCallback(async (orderNum: string, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError("");
    
    let formattedOrderNum = orderNum.trim().toUpperCase();
    if (!formattedOrderNum.startsWith('#')) {
      formattedOrderNum = '#' + formattedOrderNum;
    }

    try {
      // Auto-verify with Midtrans if coming back from payment or status code in URL
      const hasPaymentParams = searchParams.get("transaction_status") || searchParams.get("status_code");
      if (hasPaymentParams) {
        await verifyOnlinePaymentStatus(formattedOrderNum, unwrappedParams.slug);
      }

      const data = await getPublicOrderByNumber(formattedOrderNum, unwrappedParams.slug);
      if (data) {
        // If order is ONLINE & still PENDING, double check Midtrans status
        if (data.paymentMethod === 'ONLINE' && data.paymentStatus === 'PENDING') {
          const verifyRes = await verifyOnlinePaymentStatus(formattedOrderNum, unwrappedParams.slug);
          if (verifyRes.success && verifyRes.paymentStatus === 'PAID') {
            data.paymentStatus = 'PAID';
            data.status = verifyRes.status || 'NEW';
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
    if (!orderStatus || !currentOrderNumber || ['COMPLETED', 'CANCELLED'].includes(orderStatus)) return;
    
    const interval = setInterval(() => {
      fetchOrder(currentOrderNumber, true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [orderStatus, currentOrderNumber, fetchOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    router.push(`${window.location.pathname}?order=${encodeURIComponent(orderNumber)}`);
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'PENDING': return { label: 'Menunggu Konfirmasi', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock };
      case 'NEW':
      case 'CONFIRMED': return { label: 'Pesanan Diterima', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock };
      case 'PROCESSING': return { label: 'Sedang Disiapkan', color: 'text-amber-600', bg: 'bg-amber-100', icon: ChefHat };
      case 'READY': return { label: 'Pesanan Sudah Siap', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Utensils };
      case 'COMPLETED': return { label: 'Pesanan Selesai', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 };
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

  const outletPrimaryColor = order?.tenantSettings?.primaryColor || "#0E59F9";

  return (
    <>
      {order?.tenantSettings?.midtransClientKey && (
        <Script src={snapScriptUrl} data-client-key={order.tenantSettings.midtransClientKey} strategy="afterInteractive" />
      )}
      <div
        style={{ "--outlet-primary": outletPrimaryColor } as React.CSSProperties}
        className="max-w-md mx-auto min-h-screen bg-gray-50/70 flex flex-col relative pb-24 text-gray-900 selection:bg-blue-100"
      >
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xs border-b border-gray-150 px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100">
              <Link href="/" aria-label="Kembali ke menu">
                <ArrowLeft className="h-4.5 w-4.5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-bold text-base text-gray-900 tracking-tight">Status Pesanan</h1>
              <p className="text-[11px] text-gray-400">Pantau progres pesanan secara langsung</p>
            </div>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {!order && !isLoading && (
            <>
              {/* Search Order Card */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-150">
                <h2 className="text-base font-bold text-gray-900 mb-1">Lacak Pesanan Anda</h2>
                <p className="text-gray-500 text-xs sm:text-sm mb-5">
                  Masukkan nomor pesanan (cth: #A1B2C3) untuk melihat status pesanan terkini.
                </p>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orderNumber" className="text-xs font-semibold text-gray-500">
                      Nomor Pesanan
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        id="orderNumber"
                        value={orderNumber}
                        onChange={e => setOrderNumber(e.target.value)}
                        placeholder="#XXXXXX"
                        className="pl-10 h-11 uppercase text-base font-bold tracking-widest rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                  
                  {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                  
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                    style={{ backgroundColor: "var(--outlet-primary, #2563eb)" }}
                  >
                    Cari Pesanan
                  </Button>
                </form>
              </div>

              {/* Dev-only Interactive Preview */}
              {process.env.NODE_ENV === "development" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
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
                  />
                  <OrderStatusDemoSwitcher
                    currentStatus={previewStatus || "PROCESSING"}
                    onSelectStatus={(st) => setPreviewStatus(st)}
                  />
                </div>
              )}
            </>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: "var(--outlet-primary, #2563eb)" }}
              />
              <p className="text-xs font-medium text-gray-500">Mencari data pesanan...</p>
            </div>
          )}

          {order && !isLoading && (
            <div className="space-y-4">
              {/* 1. Order Summary Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-150 flex items-center justify-between transition-all">
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Nomor Pesanan
                    </p>
                    <OrderIllustrationDisclaimer />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 font-mono tracking-wider">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Total
                  </p>
                  <p
                    className="text-base sm:text-lg font-extrabold tracking-tight"
                    style={{ color: "var(--outlet-primary, #2563eb)" }}
                  >
                    {formatCurrency(Number(order.grandTotal))}
                  </p>
                </div>
              </div>

              {/* 2. Order Status Card & Stepper */}
              {(() => {
                const computedStatus = resolveOrderStatus(order);
                const effectiveStatus = previewStatus || computedStatus;
                return (
                  <div className="space-y-3.5">
                    <OrderStatusCard
                      status={effectiveStatus}
                      orderNumber={order.orderNumber}
                      primaryColor={outletPrimaryColor}
                    />

                    {/* Subtle Live Kitchen Connection Indicator */}
                    {effectiveStatus !== "COMPLETED" &&
                      effectiveStatus !== "CANCELLED" &&
                      effectiveStatus !== "REJECTED" && (
                        <div className="flex justify-center">
                          <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 bg-white/95 px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-2xs select-none">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Terhubung langsung dengan dapur (live)</span>
                          </div>
                        </div>
                      )}

                    {/* Dev-only Interactive Preview Switcher */}
                    {process.env.NODE_ENV === "development" && (
                      <OrderStatusDemoSwitcher
                        currentStatus={effectiveStatus}
                        onSelectStatus={(st) => setPreviewStatus(st)}
                      />
                    )}
                  </div>
                );
              })()}

              {/* 3. Pending Payment Alert & Action */}
              {order.paymentStatus === 'PENDING' && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-150 flex flex-col gap-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menunggu Pembayaran</p>
                  </div>
                  {order.paymentMethod === 'CASH' ? (
                    <div className="bg-amber-50/80 border border-amber-200/80 text-amber-900 p-3.5 rounded-xl text-center text-xs sm:text-sm font-medium leading-relaxed">
                      Silakan menuju kasir untuk melakukan pembayaran sebesar{" "}
                      <strong className="font-extrabold text-gray-900">{formatCurrency(Number(order.grandTotal))}</strong> secara Tunai.
                    </div>
                  ) : order.paymentMethod === 'ONLINE' && order.snapToken ? (
                    <div className="space-y-2.5">
                      <div className="bg-blue-50/70 border border-blue-200/70 text-blue-950 p-3.5 rounded-xl text-center text-xs sm:text-sm font-medium leading-relaxed">
                        Silakan lanjutkan pembayaran online sebesar{" "}
                        <strong className="font-extrabold text-gray-900">{formatCurrency(Number(order.grandTotal))}</strong>.
                      </div>
                      <Button 
                        onClick={handlePayNow}
                        className="w-full h-11 rounded-xl text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                        style={{ backgroundColor: "var(--outlet-primary, #2563eb)" }}
                      >
                        Lanjutkan Pembayaran Online
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 4. Order Details (Detail Item) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-150">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detail Item</h3>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className={`flex items-center gap-2.5 ${item.isCompleted ? 'opacity-50' : ''}`}>
                        <span className="font-bold text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                          {item.quantity}x
                        </span>
                        <span className={`font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {item.productName}
                        </span>
                      </div>
                      {item.isCompleted && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

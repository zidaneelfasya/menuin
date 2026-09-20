"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Clock, ChefHat, Utensils, CreditCard, X } from "lucide-react";
import { getActiveOrderStatus } from "@/lib/actions/orders";

interface ActiveOrderInfo {
  orderNumber: string;
  status: string | null | undefined;
  paymentStatus: string | null | undefined;
}

export function ActiveOrderBanner({ tenantSlug }: { tenantSlug: string }) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkOrder = useCallback(async () => {
    try {
      const storageKey = `menuin_active_order_${tenantSlug}`;
      const orderNum = localStorage.getItem(storageKey);
      if (!orderNum) {
        setActiveOrder(null);
        return;
      }

      const res = await getActiveOrderStatus(orderNum, tenantSlug);
      if (!res.isActive) {
        // Order is finished (COMPLETED / CANCELLED / REJECTED) or expired
        localStorage.removeItem(storageKey);
        setActiveOrder(null);
      } else {
        setActiveOrder({
          orderNumber: res.orderNumber || orderNum,
          status: res.status ?? null,
          paymentStatus: res.paymentStatus ?? null,
        });
      }
    } catch (err) {
      console.error("Failed to check active order status:", err);
    }
  }, [tenantSlug]);

  useEffect(() => {
    checkOrder();

    // Re-check when window regains focus (e.g. customer returns to this tab)
    const handleFocus = () => checkOrder();
    window.addEventListener("focus", handleFocus);

    // Listen to custom event for active order updates
    const handleOrderUpdate = () => checkOrder();
    window.addEventListener("menuin_active_order_updated", handleOrderUpdate);

    // Listen to cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `menuin_active_order_${tenantSlug}`) {
        checkOrder();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Polling every 15 seconds while active to catch order completion in background
    const interval = setInterval(checkOrder, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("menuin_active_order_updated", handleOrderUpdate);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [checkOrder, tenantSlug]);

  if (!activeOrder || isDismissed) return null;

  // Determine status visual & copy
  const statusUpper = (activeOrder.status || "").toUpperCase();
  const paymentUpper = (activeOrder.paymentStatus || "").toUpperCase();

  let statusLabel = "Pantau pesanan Anda";
  let statusBadge = "Pesanan Aktif";
  let IconComponent = Clock;
  let iconBg = "bg-blue-500/20 text-blue-400";
  let ringBorder = "ring-blue-500/20";
  let isPulsing = false;

  if (statusUpper === "READY") {
    statusBadge = "Pesanan Sudah Siap!";
    statusLabel = "Silakan ambil atau tunggu diantarkan";
    IconComponent = Utensils;
    iconBg = "bg-emerald-500/20 text-emerald-400";
    ringBorder = "ring-emerald-500/30";
    isPulsing = true;
  } else if (statusUpper === "PROCESSING") {
    statusBadge = "Sedang Disiapkan";
    statusLabel = "Dapur sedang memproses pesanan Anda";
    IconComponent = ChefHat;
    iconBg = "bg-amber-500/20 text-amber-400";
    ringBorder = "ring-amber-500/20";
  } else if (paymentUpper === "PENDING" || statusUpper === "PENDING") {
    statusBadge = "Menunggu Pembayaran";
    statusLabel = "Selesaikan pembayaran untuk memproses pesanan";
    IconComponent = CreditCard;
    iconBg = "bg-blue-500/20 text-blue-400";
    ringBorder = "ring-blue-500/20";
  } else if (statusUpper === "CONFIRMED" || statusUpper === "NEW") {
    statusBadge = "Pesanan Diterima";
    statusLabel = "Pesanan telah masuk ke antrean dapur";
    IconComponent = Clock;
    iconBg = "bg-blue-500/20 text-blue-400";
    ringBorder = "ring-blue-500/20";
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto relative group">
        <Link
          href={`/store/${tenantSlug}/status?order=${encodeURIComponent(activeOrder.orderNumber)}`}
          className="block"
        >
          <div
            className={`bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 hover:bg-slate-800/95 transition-all cursor-pointer ring-4 ${ringBorder}`}
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-6">
              <div className={`p-2.5 rounded-xl shrink-0 ${iconBg} relative`}>
                <IconComponent className="w-5 h-5" />
                {isPulsing && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm tracking-tight text-white truncate">
                    {statusBadge}
                  </p>
                  <span className="text-[11px] font-mono font-semibold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                    {activeOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {statusLabel}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-white/20 text-slate-400 hover:text-white flex items-center justify-center shadow-md transition-colors"
          title="Tutup banner pesanan aktif"
          aria-label="Tutup banner pesanan aktif"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

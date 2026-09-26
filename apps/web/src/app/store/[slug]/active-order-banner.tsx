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
  let iconBg = "bg-blue-50 text-blue-600 border border-blue-200/60";
  let badgeColor = "bg-blue-50 text-blue-700 border-blue-200/80";
  let isPulsing = false;

  if (statusUpper === "READY") {
    statusBadge = "Pesanan Sudah Siap!";
    statusLabel = "Silakan ambil atau tunggu diantarkan";
    IconComponent = Utensils;
    iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    isPulsing = true;
  } else if (statusUpper === "PROCESSING") {
    statusBadge = "Sedang Disiapkan";
    statusLabel = "Dapur sedang memproses pesanan Anda";
    IconComponent = ChefHat;
    iconBg = "bg-amber-50 text-amber-600 border border-amber-200/60";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (paymentUpper === "PENDING" || statusUpper === "PENDING") {
    statusBadge = "Menunggu Pembayaran";
    statusLabel = "Selesaikan pembayaran untuk memproses pesanan";
    IconComponent = CreditCard;
    iconBg = "bg-blue-50 text-blue-600 border border-blue-200/60";
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200/80";
  } else if (statusUpper === "CONFIRMED" || statusUpper === "NEW") {
    statusBadge = "Pesanan Diterima";
    statusLabel = "Pesanan telah masuk ke antrean dapur";
    IconComponent = Clock;
    iconBg = "bg-blue-50 text-blue-600 border border-blue-200/60";
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200/80";
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-5 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto relative group">
        <Link
          href={`/store/${tenantSlug}/status?order=${encodeURIComponent(activeOrder.orderNumber)}`}
          className="block"
        >
          <div className="bg-white/95 backdrop-blur-md text-gray-900 p-3.5 sm:p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] flex items-center justify-between border border-gray-200/90 hover:border-gray-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)] transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className={`p-2.5 rounded-xl shrink-0 ${iconBg} relative`}>
                <IconComponent className="w-5 h-5" />
                {isPulsing && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm tracking-tight text-gray-900 truncate">
                    {statusBadge}
                  </p>
                  <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                    {activeOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {statusLabel}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          title="Tutup banner pesanan aktif"
          aria-label="Tutup banner pesanan aktif"
        >
          <X className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}

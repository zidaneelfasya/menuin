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

interface ActiveOrderBannerProps {
  tenantSlug: string;
  primaryColor?: string | null;
}

export function ActiveOrderBanner({ tenantSlug, primaryColor }: ActiveOrderBannerProps) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrderInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const themeColor = primaryColor || "var(--catalog-primary, #0e59f9)";

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

    // Refresh immediately when tab/phone screen becomes visible
    const handleVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        checkOrder();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Polling every 15 seconds while active (pauses when phone is locked / tab is hidden to save server resources)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      checkOrder();
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("menuin_active_order_updated", handleOrderUpdate);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
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
  let iconClass = "bg-slate-100 text-slate-700";
  let iconStyle: React.CSSProperties | undefined = undefined;
  let badgeClass = "bg-slate-100 text-slate-700";
  let badgeStyle: React.CSSProperties | undefined = undefined;
  let isPulsing = false;

  if (statusUpper === "READY") {
    statusBadge = "Pesanan Sudah Siap!";
    statusLabel = "Silakan ambil atau tunggu diantarkan";
    IconComponent = Utensils;
    iconClass = "bg-emerald-50 text-emerald-600";
    badgeClass = "bg-emerald-50 text-emerald-700";
    isPulsing = true;
  } else if (statusUpper === "PROCESSING") {
    statusBadge = "Sedang Disiapkan";
    statusLabel = "Dapur sedang memproses pesanan Anda";
    IconComponent = ChefHat;
    iconClass = "bg-amber-50 text-amber-600";
    badgeClass = "bg-amber-50 text-amber-700";
  } else if (paymentUpper === "PENDING" || statusUpper === "PENDING") {
    statusBadge = "Menunggu Pembayaran";
    statusLabel = "Selesaikan pembayaran untuk memproses pesanan";
    IconComponent = CreditCard;
    iconClass = "";
    iconStyle = { backgroundColor: `color-mix(in srgb, ${themeColor} 12%, white)`, color: themeColor };
    badgeClass = "";
    badgeStyle = { backgroundColor: `color-mix(in srgb, ${themeColor} 12%, white)`, color: themeColor };
  } else if (statusUpper === "CONFIRMED" || statusUpper === "NEW") {
    statusBadge = "Pesanan Diterima";
    statusLabel = "Pesanan telah masuk ke antrean dapur";
    IconComponent = Clock;
    iconClass = "";
    iconStyle = { backgroundColor: `color-mix(in srgb, ${themeColor} 12%, white)`, color: themeColor };
    badgeClass = "";
    badgeStyle = { backgroundColor: `color-mix(in srgb, ${themeColor} 12%, white)`, color: themeColor };
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 px-4 z-50 animate-in slide-in-from-bottom-5 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto relative group">
        <Link
          href={`/store/${tenantSlug}/status?order=${encodeURIComponent(activeOrder.orderNumber)}`}
          className="block"
        >
          <div className="bg-white text-slate-900 p-3.5 sm:p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between border-none">
            <div className="flex items-center gap-3 min-w-0 pr-3">
              {/* Icon Anchor: w-10 h-10 rounded-full border-none */}
              <div
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center relative border-none ${iconClass}`}
                style={iconStyle}
              >
                <IconComponent className="w-5 h-5 stroke-[2]" />
                {isPulsing && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm tracking-tight text-slate-900 truncate">
                    {statusBadge}
                  </p>
                  <span
                    className={`text-[10px] font-numeric tabular-nums font-semibold px-2 py-0.5 rounded-full border-none shrink-0 ${badgeClass}`}
                    style={badgeStyle}
                  >
                    {activeOrder.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                  {statusLabel}
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        {/* Dismiss Button: pure white, borderless, shadow-sm-md */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-sm-md border-none transition-all active:scale-95 cursor-pointer"
          title="Tutup banner pesanan aktif"
          aria-label="Tutup banner pesanan aktif"
        >
          <X className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
}

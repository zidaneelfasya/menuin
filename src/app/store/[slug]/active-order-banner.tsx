"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

export function ActiveOrderBanner({ tenantSlug }: { tenantSlug: string }) {
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const orderNum = localStorage.getItem(`menuin_active_order_${tenantSlug}`);
    if (orderNum) {
      setActiveOrderNumber(orderNum);
    }
  }, [tenantSlug]);

  if (!activeOrderNumber) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-5 pointer-events-none">
      <Link href={`/status?order=${encodeURIComponent(activeOrderNumber)}`} className="pointer-events-auto block max-w-md mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 hover:bg-slate-800/95 transition-colors cursor-pointer ring-4 ring-catalog-primary/20">
          <div className="flex items-center gap-3">
            <div className="bg-catalog-primary/20 p-2 rounded-full">
              <Clock className="w-5 h-5 text-catalog-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Pesanan Aktif ({activeOrderNumber})</p>
              <p className="text-xs text-slate-300">Selesaikan atau pantau pesanan Anda</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </Link>
    </div>
  );
}

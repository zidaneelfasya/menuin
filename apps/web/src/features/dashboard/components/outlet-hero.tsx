'use client';

import * as React from 'react';
import { OutletOverviewData } from '@/lib/actions/dashboard';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  ShoppingBag, 
  Package, 
  Clock, 
  Smartphone, 
  AlertCircle,
  ChevronRight,
  Store
} from 'lucide-react';
import Link from 'next/link';

interface OutletHeroProps {
  outlet: OutletOverviewData;
  activeShift?: {
    id: string;
    cashierName: string;
    startedAt: string;
    startingCash: number;
    hoursOpen: number;
  } | null;
  onScrollToAttention?: () => void;
}

export function OutletHero({ outlet, activeShift, onScrollToAttention }: OutletHeroProps) {
  const [copied, setCopied] = React.useState(false);

  const publicUrl = outlet.slug 
    ? `https://${outlet.slug}.menuin.id` 
    : `https://${outlet.outletKey}.menuin.id`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200/90 rounded-xl p-5 lg:p-6 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Sisi Kiri: Identitas Outlet & Public Link */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 truncate">
              {outlet.outletName}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Outlet Aktif
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 select-all">
              {publicUrl}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-6 text-[11px] font-mono px-2 py-0.5 border-gray-200 text-gray-600 hover:bg-gray-50 rounded active:scale-[0.97] transition-transform"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1 text-gray-400" />
                  Copy
                </>
              )}
            </Button>

            {outlet.storefrontEnabled && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-1.5 text-gray-500 hover:text-gray-900 active:scale-[0.97] transition-transform"
                title="Buka Halaman Publik Storefront"
              >
                <Link href={`/store/${outlet.slug || outlet.outletKey}`} target="_blank">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Storefront
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Status Kasir & Aksi Cepat Operasional */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Status Shift Kasir Ringkas */}
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-lg bg-gray-50 border border-gray-200/70 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {activeShift ? (
                <span>
                  Shift: <strong className="font-semibold text-gray-900">{activeShift.cashierName}</strong> ({activeShift.startedAt})
                </span>
              ) : (
                <span className="text-gray-500">Belum ada shift kasir aktif</span>
              )}
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Smartphone className="w-3.5 h-3.5 text-gray-400" />
              <span>{outlet.deviceCount} POS</span>
            </div>
          </div>

          {/* Quick Actions (Taktil, Fast Feedback) */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.97] transition-transform"
            >
              <Link href={`/outlet/${outlet.outletKey}/products`}>
                <Package className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                Menu & Stok
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-[0.97] transition-transform"
            >
              <Link href={`/outlet/${outlet.outletKey}/pos`}>
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                Buka POS Kasir
              </Link>
            </Button>
          </div>
        </div>

      </div>

      {/* Operational Alert Strip (Hanya muncul jika ada isu kritis) */}
      {outlet.activeAlertCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-lg px-3.5 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong className="font-semibold">{outlet.activeAlertCount} Perhatian Operasional:</strong> {outlet.criticalAlerts.join(' • ')}
            </span>
          </div>
          {onScrollToAttention && (
            <button
              type="button"
              onClick={onScrollToAttention}
              className="text-amber-950 font-semibold hover:underline shrink-0 flex items-center text-[11px] active:scale-[0.97] transition-transform"
            >
              Tinjau <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

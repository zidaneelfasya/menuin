'use client';

import * as React from 'react';
import { OutletOverviewData } from '@/lib/actions/dashboard';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Receipt, 
  Users, 
  Store, 
  AlertCircle,
  ChevronRight,
  ShoppingCart,
  ChefHat,
  Package
} from 'lucide-react';
import Link from 'next/link';

interface OutletHeroProps {
  outlet: OutletOverviewData;
  onScrollToAttention?: () => void;
}

export function OutletHero({ outlet, onScrollToAttention }: OutletHeroProps) {
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Outlet Name & Public URL */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/50 shrink-0 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {outlet.outletName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat monitoring operasional cabang & analitik transaksi
              </p>
            </div>
          </div>

          {/* Public Store URL */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60 select-all">
              {publicUrl}
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs font-medium px-2.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Salin URL
                  </>
                )}
              </Button>

              {outlet.storefrontEnabled && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Buka Halaman Publik"
                >
                  <Link href={`/store/${outlet.slug || outlet.outletKey}`} target="_blank">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Katalog Publik
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
          >
            <Link href={`/outlet/${outlet.outletKey}/pos`}>
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Buka Kasir POS
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg shadow-xs"
          >
            <Link href={`/outlet/${outlet.outletKey}/orders`}>
              <ChefHat className="w-3.5 h-3.5 mr-1.5" />
              Pesanan Masuk
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded-lg shadow-xs"
          >
            <Link href={`/outlet/${outlet.outletKey}/items`}>
              <Package className="w-3.5 h-3.5 mr-1.5" />
              Daftar Menu
            </Link>
          </Button>
        </div>

      </div>

      {/* Operational Highlights Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        
        {/* Tile 1: Total Transaksi Selesai */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Transaksi
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
              {outlet.totalLifetimeTransactions.toLocaleString('id-ID')} Pesanan
            </span>
          </div>
        </div>

        {/* Tile 2: Perangkat POS Terhubung */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Perangkat POS
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
              {outlet.deviceCount} Terdaftar
            </span>
          </div>
        </div>

        {/* Tile 3: Tim & Karyawan Outlet */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Staf & Kasir
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
              {outlet.staffCount} Anggota
            </span>
          </div>
        </div>

        {/* Tile 4: Status Operasional */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            outlet.activeAlertCount > 0 
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' 
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Kondisi Stok
            </span>
            <span className={`text-sm font-bold truncate block ${
              outlet.activeAlertCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {outlet.activeAlertCount > 0 ? `${outlet.activeAlertCount} Perhatian` : 'Semua Aman'}
            </span>
          </div>
        </div>

      </div>

      {/* Operational Alert Strip (If Any Issues Exist) */}
      {outlet.activeAlertCount > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>{outlet.activeAlertCount} Isu Operasional:</strong> {outlet.criticalAlerts.join(' • ')}
            </span>
          </div>
          {onScrollToAttention && (
            <button
              type="button"
              onClick={onScrollToAttention}
              className="text-amber-950 dark:text-amber-200 font-semibold hover:underline shrink-0 flex items-center gap-0.5"
            >
              Tinjau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { OutletOverviewData } from '@/lib/actions/dashboard';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Cpu, 
  GitBranch, 
  Smartphone, 
  Receipt, 
  Package, 
  Store, 
  Network, 
  Globe, 
  AlertCircle,
  ChevronRight,
  ShieldCheck
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
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
      {/* 2-Column Grand Supabase Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: Identity & 6 Status Tiles (approx 5 cols or 6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          
          {/* Outlet Title & Public URL Pill */}
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              {outlet.outletName}
            </h1>

            {/* URL with Copy Button (Supabase Style) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-mono text-gray-500 hover:text-gray-700 select-all">
                {publicUrl}
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 text-[11px] font-mono px-2 py-0.5 border-gray-200 text-gray-600 hover:bg-gray-50 rounded"
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
                    className="h-6 text-[11px] px-1.5 text-gray-400 hover:text-gray-700"
                    title="Buka Halaman Publik"
                  >
                    <Link href={`/store/${outlet.slug || outlet.outletKey}`} target="_blank">
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* 6 Tiles Grid (2 columns x 3 rows) - Exact Supabase Anatomy */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-6 pt-2">
            
            {/* Tile 1: STATUS */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                {/* Supabase 6-dots healthy status icon */}
                <div className="grid grid-cols-3 gap-0.5 p-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  STATUS
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                  <span>Healthy / Aktif</span>
                </div>
              </div>
            </div>

            {/* Tile 2: SISTEM POS (Compute) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 shrink-0 shadow-2xs">
                <Cpu className="w-4 h-4 text-gray-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  SISTEM POS
                </div>
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>

            {/* Tile 3: SHIFT KASIR (like GitHub / Branch) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 shrink-0 shadow-2xs">
                <GitBranch className="w-4 h-4 text-gray-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  SHIFT KASIR
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  Shift Aktif Berjalan
                </div>
              </div>
            </div>

            {/* Tile 4: PERANGKAT POS */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 shrink-0 shadow-2xs">
                <Smartphone className="w-4 h-4 text-gray-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  PERANGKAT POS
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {outlet.deviceCount} Terhubung
                </div>
              </div>
            </div>

            {/* Tile 5: TOTAL TRANSAKSI */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 shrink-0 shadow-2xs">
                <Receipt className="w-4 h-4 text-gray-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  TOTAL TRANSAKSI
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {outlet.totalLifetimeTransactions.toLocaleString('id-ID')} Selesai
                </div>
              </div>
            </div>

            {/* Tile 6: STATUS STOK */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200/90 bg-white flex items-center justify-center text-gray-500 shrink-0 shadow-2xs">
                <Package className="w-4 h-4 text-gray-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  STATUS STOK
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {outlet.activeAlertCount > 0 ? (
                    <span className="text-amber-600 font-semibold">Perlu Perhatian</span>
                  ) : (
                    <span className="text-gray-900">Semua Aman</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Operational Alert Strip (If Any Issues Exist) */}
          {outlet.activeAlertCount > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-3 flex items-center justify-between gap-3 text-xs mt-2">
              <div className="flex items-center gap-2 text-amber-900 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  <strong>{outlet.activeAlertCount} Isu:</strong> {outlet.criticalAlerts.join(' • ')}
                </span>
              </div>
              {onScrollToAttention && (
                <button
                  type="button"
                  onClick={onScrollToAttention}
                  className="text-amber-950 font-semibold hover:underline shrink-0 flex items-center"
                >
                  Tinjau <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Supabase Dotted Topology Canvas (approx 6 cols) */}
        <div className="lg:col-span-6">
          <div 
            className="w-full h-full min-h-[360px] lg:min-h-[420px] rounded-xl border border-gray-200/80 bg-white relative overflow-hidden flex items-center justify-center p-6 select-none"
            style={{ 
              backgroundImage: 'radial-gradient(#d1d5db 1.2px, transparent 1.2px)', 
              backgroundSize: '16px 16px' 
            }}
          >
            {/* Top-Right Canvas Tools (Exact Supabase Placement) */}
            <div className="absolute top-3 right-3 flex items-center gap-1 border border-gray-200/80 bg-white/95 backdrop-blur-xs rounded-lg p-1 shadow-2xs z-20">
              <button 
                type="button"
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Topologi Cabang"
              >
                <Network className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Realtime Network Hub"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Connected Satellite Node 1 (Top Left) */}
            <div className="absolute top-8 left-8 hidden sm:flex items-center gap-2 bg-white/90 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-xs text-[11px] font-mono text-gray-600 z-10 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>POS-Terminal-1 (Ready)</span>
            </div>

            {/* Interactive Connected Satellite Node 2 (Bottom Right) */}
            <div className="absolute bottom-8 right-8 hidden sm:flex items-center gap-2 bg-white/90 border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-xs text-[11px] font-mono text-gray-600 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Kitchen-Display (Sync)</span>
            </div>

            {/* Subtle connecting lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-gray-300 stroke-dasharray-4">
              <line x1="25%" y1="20%" x2="50%" y2="50%" strokeDasharray="3 3" />
              <line x1="75%" y1="80%" x2="50%" y2="50%" strokeDasharray="3 3" />
            </svg>

            {/* Center Floating Node: Primary Outlet Hub (Exact Supabase Primary Database Card) */}
            <div className="relative z-10 bg-white border border-gray-200/90 rounded-xl shadow-md p-4 w-full max-w-[340px] hover:shadow-lg transition-all">
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      Primary Outlet Hub
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {outlet.outletName}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      menuin-node • {outlet.slug || 'core.outlet'}
                    </div>
                  </div>
                </div>

                {/* Status indicator dot */}
                <div className="shrink-0 pt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                </div>
              </div>

              {/* Bottom Specs Strip (Like CPU 4% • Disk 16% • RAM 54% in Supabase) */}
              <div className="border-t border-gray-100 pt-2.5 mt-3 flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>POS 100%</span>
                <span>•</span>
                <span>Sync 12ms</span>
                <span>•</span>
                <span>{outlet.staffCount} Staf</span>
                <span>•</span>
                <span>{outlet.deviceCount} POS</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

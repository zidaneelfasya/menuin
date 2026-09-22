'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Share2, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { OutletDetailModal } from './outlet-detail-modal';

export interface StoreHeroHeaderProps {
  tenant: {
    id: string;
    name: string;
    slug: string | null;
    storeLogoUrl?: string | null;
    storeBannerUrl?: string | null;
    storeDescription?: string | null;
    primaryColor?: string | null;
    dineInEnabled?: boolean;
    takeAwayEnabled?: boolean;
    deliveryEnabled?: boolean;
    onlinePaymentEnabled?: boolean;
    receiptHeader?: string | null;
    receiptFooter?: string | null;
    receiptCustomNote?: string | null;
  };
  tableNumber?: string | null;
  statusLink: string;
  homeLink: string;
  totalSold?: number;
  totalProducts?: number;
}

export function StoreHeroHeader({
  tenant,
  tableNumber,
  statusLink,
  homeLink,
  totalSold = 0,
  totalProducts = 0,
}: StoreHeroHeaderProps) {
  const pathname = usePathname();
  const [isOutletDetailOpen, setIsOutletDetailOpen] = useState(false);

  // Suppress hero banner and outlet card on cart/checkout routes
  if (pathname?.includes('/checkout')) {
    return null;
  }

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window !== 'undefined') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: tenant.name,
            text: tenant.storeDescription || `Pesan menu lezat di ${tenant.name}`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link toko berhasil disalin ke clipboard!');
        }
      } catch {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link toko berhasil disalin ke clipboard!');
        } catch {
          // ignore
        }
      }
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* 1. Hero Banner Area (Clickable to view full outlet photo) */}
      <div
        onClick={() => setIsOutletDetailOpen(true)}
        className="w-full h-36 sm:h-44 md:h-52 relative overflow-hidden bg-slate-900 cursor-pointer group"
      >
        {tenant.storeBannerUrl ? (
          <img
            src={tenant.storeBannerUrl}
            alt={tenant.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full relative flex items-center justify-center opacity-90"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, var(--catalog-primary, #f43f5e) 85%, #0f172a), #0f172a)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
        )}

        {/* Top Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35" />

        {/* Floating Top Action Bar over Banner */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 max-w-2xl mx-auto flex items-center justify-between z-20 pointer-events-auto"
        >
          {/* Left: Back / Home Link */}
          <Link
            href={homeLink}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs transition-all active:scale-95 cursor-pointer"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </Link>

          {/* Right: Cek Pesanan + Share Button */}
          <div className="flex items-center gap-2">
            <Link
              href={statusLink}
              className="bg-black/35 hover:bg-black/55 text-white backdrop-blur-md text-xs font-semibold px-3 py-2 rounded-full border border-white/20 transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cek Pesanan</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-black/35 hover:bg-black/55 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs transition-all active:scale-95 cursor-pointer"
              aria-label="Bagikan toko"
              title="Bagikan tautan outlet"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Floating Outlet Card (Clickable to open Outlet Details) */}
      <div className="max-w-2xl mx-auto px-4 -mt-7 sm:-mt-8 relative z-10">
        <div
          onClick={() => setIsOutletDetailOpen(true)}
          className="bg-white rounded-2xl sm:rounded-3xl border border-gray-150 shadow-sm hover:shadow-md px-6 pb-4 pt-9 sm:px-6 sm:pb-5 sm:pt-10 text-center relative cursor-pointer transition-all active:scale-[0.995] group"
        >
          {/* Centered Profile Logo: Strictly sized and bounded */}
          <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-20 sm:h-20 max-w-[72px] max-h-[72px] rounded-full border-[1px] border-white shadow-md bg-white overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-gray-100 z-10 group-hover:scale-105 transition-transform duration-300">
            {tenant.storeLogoUrl ? (
              <img
                src={tenant.storeLogoUrl}
                alt={tenant.name}
                className="w-full h-full object-cover max-w-full max-h-full rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-catalog-primary text-white font-semibold text-xl sm:text-2xl flex items-center justify-center rounded-full">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Card Content: Name -> Status Buka -> Description -> Click affordance */}
          <div className="space-y-1">
            {/* 1. Nama Outlet */}
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-snug line-clamp-1 max-w-md mx-auto group-hover:text-catalog-primary transition-colors flex items-center justify-center gap-1">
              <span>{tenant.name}</span>
            </h1>

            {/* 2. Keterangan Buka: Murni teks warna hijau */}
            <p className="text-xs sm:text-sm font-bold text-emerald-600">
              Buka
            </p>

            {/* 3. Deskripsi Outlet */}
            {tenant.storeDescription && (
              <p className="text-xs text-gray-500 max-w-md mx-auto line-clamp-2 leading-relaxed pt-0.5">
                {tenant.storeDescription}
              </p>
            )}

            {/* Nomor Meja jika ada */}
            {tableNumber && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-catalog-primary/10 text-catalog-primary border border-catalog-primary/20 text-[11px] font-bold">
                  Meja #{tableNumber}
                </span>
              </div>
            )}

            {/* Subtle Affordance Hint: Detail Outlet */}
           
          </div>
        </div>
      </div>

      {/* Outlet Detail Modal */}
      <OutletDetailModal
        isOpen={(false)}
        onClose={() => setIsOutletDetailOpen(false)}
        tenant={tenant}
        totalSold={totalSold}
        totalProducts={totalProducts}
      />
    </div>
  );
}

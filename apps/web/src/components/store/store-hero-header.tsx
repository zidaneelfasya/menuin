'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { OutletDetailModal } from './outlet-detail-modal';
import { StoreHamburgerMenu } from './store-hamburger-menu';

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

  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* 1. Hero Banner Area */}
      <div className="w-full h-36 sm:h-44 md:h-52 relative bg-slate-900">
        {/* Banner Image Container (Clickable to view full outlet photo) */}
        <div
          onClick={() => setIsOutletDetailOpen(true)}
          className="absolute inset-0 w-full h-full overflow-hidden cursor-pointer group"
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
        </div>

        {/* Floating Top Action Bar over Banner */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between z-30 pointer-events-auto"
        >
          {/* Left: Back / Home Link */}
          <Link
            href={homeLink}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs transition-all active:scale-95 cursor-pointer"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Right: Modern Hamburger Menu with Animation & Rich Options */}
          <StoreHamburgerMenu
            tenant={tenant}
            tableNumber={tableNumber}
            statusLink={statusLink}
            onOpenOutletDetail={() => setIsOutletDetailOpen(true)}
          />
        </div>
      </div>

      {/* 2. Floating Outlet Card (Clickable to open Outlet Details) */}
      <div className="w-full px-3.5 sm:px-4 -mt-6 relative z-10">
        <div
          onClick={() => setIsOutletDetailOpen(true)}
          className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-sm px-4 pb-3.5 pt-8 text-center relative cursor-pointer transition-all active:scale-[0.995] group"
        >
          {/* Centered Profile Logo */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 max-w-[56px] max-h-[56px] rounded-full border-2 border-white shadow-md bg-white overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-gray-100 z-10 group-hover:scale-105 transition-transform duration-300">
            {tenant.storeLogoUrl ? (
              <img
                src={tenant.storeLogoUrl}
                alt={tenant.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-catalog-primary text-white font-semibold text-xl flex items-center justify-center rounded-full">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Card Content: Name -> Status Buka -> Description */}
          <div className="space-y-0.5">
            {/* 1. Nama Outlet */}
            <h1 className="text-base font-semibold text-gray-900 tracking-tight leading-snug line-clamp-1 group-hover:text-catalog-primary transition-colors">
              {tenant.name}
            </h1>

            {/* 2. Keterangan Buka */}
            <p className="text-xs font-semibold text-emerald-600">
              Buka
            </p>

            {/* 3. Deskripsi Outlet */}
            {tenant.storeDescription && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pt-0.5">
                {tenant.storeDescription}
              </p>
            )}

            {/* Nomor Meja jika ada */}
            {tableNumber && (
              <div className="pt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-catalog-primary/10 text-catalog-primary border border-catalog-primary/20 text-[11px] font-semibold">
                  Meja #{tableNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outlet Detail Modal */}
      <OutletDetailModal
        isOpen={isOutletDetailOpen}
        onClose={() => setIsOutletDetailOpen(false)}
        tenant={tenant}
        totalSold={totalSold}
        totalProducts={totalProducts}
      />
    </div>
  );
}

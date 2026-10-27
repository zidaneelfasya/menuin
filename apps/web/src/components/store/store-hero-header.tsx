'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { toast } from 'sonner';
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
    openHours?: string | null;
    address?: string | null;
    city?: string | null;
    mapsUrl?: string | null;
    cuisineType?: string | null;
    wifiSsid?: string | null;
    wifiPassword?: string | null;
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
  activePromotions?: any[];
}

export function StoreHeroHeader({
  tenant,
  tableNumber: initialTableNumber,
  statusLink,
  homeLink,
  totalSold = 0,
  totalProducts = 0,
}: StoreHeroHeaderProps) {
  const themeColor = tenant.primaryColor || 'var(--catalog-primary, #0e59f9)';
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isOutletDetailOpen, setIsOutletDetailOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cart store for service type
  const { orderType, setOrderType, tableNumber: cartTableNumber } = useCartStore();
  const activeOrderType = isMounted ? orderType : 'DINE_IN';
  const currentTable = cartTableNumber || initialTableNumber;

  // Suppress hero banner and outlet card on cart/checkout routes
  if (pathname?.includes('/checkout')) {
    return null;
  }

  // Format sales count
  const formatSold = (sold: number) => {
    if (sold >= 1000) {
      const thousands = sold / 1000;
      const formatted = (Math.floor(thousands * 10) / 10)
        .toFixed(1)
        .replace('.0', '')
        .replace('.', ',');
      return `${formatted}rb+ Terjual`;
    }
    if (sold > 0) {
      return `${sold}+ Terjual`;
    }
    return null;
  };

  // Format open status based on openHours if standard "HH:mm - HH:mm"
  const getOpenStatus = () => {
    if (!tenant.openHours) {
      return { isOpen: true, text: 'Buka Sekarang' };
    }

    const trimmed = tenant.openHours.trim();
    const match = trimmed.match(/(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/);
    if (match) {
      const startH = parseInt(match[1], 10);
      const startM = parseInt(match[2], 10);
      const endH = parseInt(match[3], 10);
      const endM = parseInt(match[4], 10);

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const isCurrentOpen =
        startMinutes <= endMinutes
          ? nowMinutes >= startMinutes && nowMinutes <= endMinutes
          : nowMinutes >= startMinutes || nowMinutes <= endMinutes;

      if (isCurrentOpen) {
        return {
          isOpen: true,
          text: `Buka sampai ${match[3].padStart(2, '0')}:${match[4]}`,
        };
      } else {
        return {
          isOpen: false,
          text: `Tutup • Buka ${match[1].padStart(2, '0')}:${match[2]}`,
        };
      }
    }

    return { isOpen: true, text: `Buka • ${tenant.openHours}` };
  };

  const openStatus = getOpenStatus();
  const soldText = formatSold(totalSold);
  const cityText = tenant.city || 'Banyuwangi';

  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* 1. Hero Banner Area */}
      <div className="w-full h-36 sm:h-44 md:h-52 relative bg-slate-900">
        {/* Banner Image Container */}
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
                background: `linear-gradient(135deg, color-mix(in srgb, var(--catalog-primary, #0e59f9) 85%, #0f172a), #0f172a)`,
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
          )}

          {/* Top Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/30" />
        </div>

        {/* Floating Top Action Bar over Banner */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between z-30 pointer-events-auto"
        >
          {/* Left: Back / Home Link (White pill with shadow-sm-md) */}
          <Link
            href={homeLink}
            className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-sm-md border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </Link>

          {/* Right: Modern Hamburger Menu */}
          <StoreHamburgerMenu
            tenant={tenant}
            tableNumber={currentTable}
            statusLink={statusLink}
            onOpenOutletDetail={() => setIsOutletDetailOpen(true)}
          />
        </div>
      </div>

      {/* 2. Floating Outlet Card (Clean, Essential-Only, Zero-Emoji) */}
      <div className="w-full px-3.5 sm:px-4 -mt-7 relative z-10 mb-4 sm:mb-5">
        <div className="bg-white rounded-2xl shadow-md p-3.5 sm:p-4 text-left transition-all">
          {/* Top Row: Logo Thumbnail + Name & Info + Detail Chevron (No border on Chevron) */}
          <div
            onClick={() => setIsOutletDetailOpen(true)}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {/* Logo Thumbnail (Rounded Box on Left) */}
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl border border-slate-150 shadow-2xs bg-white overflow-hidden flex items-center justify-center shrink-0">
              {tenant.storeLogoUrl ? (
                <img
                  src={tenant.storeLogoUrl}
                  alt={tenant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-full bg-catalog-primary text-white font-semibold text-lg flex items-center justify-center"
                  style={{ backgroundColor: themeColor }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Merchant Identity & Subtitle */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight leading-snug truncate group-hover:text-catalog-primary transition-colors">
                  {tenant.name}
                </h1>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({cityText})
                </span>
              </div>

              {/* Sub-kategori / Konsep Resto */}
              <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {tenant.cuisineType || tenant.storeDescription || 'Kuliner Pilihan & Minuman Segar'}
              </p>

              {/* Status Jam Buka & Status Tag */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                    openStatus.isOpen ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      openStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{openStatus.text}</span>
                </span>

                <span className="text-slate-300 font-normal">•</span>

                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0 stroke-[2.2]" />
                  <span>Mitra Resmi</span>
                </span>
              </div>
            </div>

            {/* Chevron Arrow to open Detail Modal (Clean, No border, No circle) */}
            <div className="flex items-center text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 pl-1">
              <ChevronRight className="w-5 h-5 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Real Metrics Text (Zero Emoji, No decorative icons, No harsh border) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-normal pt-2.5">
            {soldText && (
              <>
                <span className="font-medium text-slate-700">{soldText}</span>
                <span className="text-slate-300">•</span>
              </>
            )}
            <span>
              {totalProducts > 0 ? `${totalProducts} Pilihan Menu` : 'Menu Lengkap'}
            </span>
          </div>

          {/* Service Type Switcher (White Container Pill with shadow-md & Solid Menuin Blue Active Pill) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-full shadow-md mt-3.5 border-none">
            <button
              type="button"
              onClick={() => {
                setOrderType('DINE_IN');
                toast.success('Mode pesanan: Makan di Tempat');
              }}
              className={`py-2 px-3 rounded-full text-xs font-semibold text-center transition-all cursor-pointer ${
                activeOrderType === 'DINE_IN'
                  ? 'bg-catalog-primary text-white shadow-sm-md'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 font-medium'
              }`}
              style={activeOrderType === 'DINE_IN' ? { backgroundColor: themeColor } : undefined}
            >
              Makan di Sini
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderType('TAKEAWAY');
                toast.success('Mode pesanan: Bawa Pulang');
              }}
              className={`py-2 px-3 rounded-full text-xs font-semibold text-center transition-all cursor-pointer ${
                activeOrderType === 'TAKEAWAY'
                  ? 'bg-catalog-primary text-white shadow-sm-md'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 font-medium'
              }`}
              style={activeOrderType === 'TAKEAWAY' ? { backgroundColor: themeColor } : undefined}
            >
              Bawa Pulang
            </button>
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

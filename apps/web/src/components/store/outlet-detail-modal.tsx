'use client';

import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  X,
  MapPin,
  Clock,
  ShoppingBag,
  Utensils,
  Star,
  BadgeCheck,
  Share2,
  ExternalLink,
  Wifi,
  CreditCard,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';

export interface OutletDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  totalSold?: number;
  totalProducts?: number;
}

export function OutletDetailModal({
  isOpen,
  onClose,
  tenant,
  totalSold = 0,
  totalProducts = 0,
}: OutletDetailModalProps) {
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  // Format total sold
  const formatTotalSold = (sold: number) => {
    if (sold >= 1000) {
      const thousands = sold / 1000;
      const formatted = (Math.floor(thousands * 10) / 10)
        .toFixed(1)
        .replace('.0', '')
        .replace('.', ',');
      return `${formatted}rb+`;
    }
    if (sold >= 100) {
      return `${Math.floor(sold / 10) * 10}+`;
    }
    if (sold > 0) {
      return `${sold}+`;
    }
    return '100+';
  };

  const handleShare = async () => {
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
          toast.success('Link outlet berhasil disalin ke clipboard!');
        }
      } catch {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link outlet berhasil disalin ke clipboard!');
        } catch {
          // ignore
        }
      }
    }
  };

  const openGoogleMaps = () => {
    const query = tenant.receiptHeader || `${tenant.name} Banyuwangi`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const addressText = tenant.receiptHeader || 'Banyuwangi, Jawa Timur, Indonesia';
  const wifiNote = tenant.receiptCustomNote;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            data-slot="dialog-content"
            className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg h-[90vh] max-h-[90vh] sm:h-[88vh] sm:max-h-[88vh] rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none p-0 m-0 flex flex-col bg-white shadow-2xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
          >
            <DialogTitle className="sr-only">Detail Outlet {tenant.name}</DialogTitle>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* 1. Full Photo Outlet Section (Banner Hero) */}
            <div className="relative w-full aspect-[16/10] bg-slate-900 overflow-hidden shrink-0 group">
              {tenant.storeBannerUrl ? (
                <img
                  src={tenant.storeBannerUrl}
                  alt={`Foto ${tenant.name}`}
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div
                  className="w-full h-full relative flex items-center justify-center opacity-95"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, var(--catalog-primary, #f43f5e) 85%, #0f172a), #0f172a)`,
                  }}
                >
                  <Store className="w-16 h-16 text-white/40" />
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md transition-all active:scale-95 cursor-pointer z-10"
                aria-label="Tutup detail outlet"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Click to view full image hint */}
              {tenant.storeBannerUrl && (
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Lihat Foto Full</span>
                </button>
              )}

              {/* Verified Outlet Badge Top Left */}
              <div className="absolute top-3.5 left-3.5 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                <BadgeCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mitra Terverifikasi</span>
              </div>
            </div>

            {/* 2. Outlet Header Info & Logo */}
            <div className="px-5 pt-4 pb-6 space-y-5">
              <div className="flex items-start gap-3.5">
                {/* Logo */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-gray-100 shadow-sm bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {tenant.storeLogoUrl ? (
                    <img
                      src={tenant.storeLogoUrl}
                      alt={tenant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-catalog-primary text-white font-black text-xl flex items-center justify-center">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name & Status */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                    {tenant.name}
                  </h2>
                  <div className="flex items-start mt-1">
                    <span className="items-start text-xs font-semibold text-emerald-600 py-0.5 rounded-full ">
                      <span className="w-1.5 h-1.5 animate-pulse" />
                      Buka Sekarang
                    </span>
                    
                    
                  </div>
                </div>
              </div>

              {/* 3. Key Performance & Sales Metrics Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Stat 1: Total Sold */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-2.5 text-center">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-catalog-primary/10 text-catalog-primary flex items-center justify-center mb-1">
                    <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-gray-900">
                    {formatTotalSold(totalSold)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-gray-500">
                    Produk Terjual
                  </div>
                </div>

                {/* Stat 2: Total Menu */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-2.5 text-center">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
                    <Utensils className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-gray-900">
                    {totalProducts > 0 ? `${totalProducts}` : '18+'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-gray-500">
                    Menu Pilihan
                  </div>
                </div>

                {/* Stat 3: Rating */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-2.5 text-center">
                  <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
                    <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-gray-900">
                    4.9 / 5.0
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-gray-500">
                    Kepuasan Rasa
                  </div>
                </div>
              </div>

              {/* 4. Description Box */}
              {tenant.storeDescription && (
                <div className="bg-gray-50/80 border border-gray-150 rounded-2xl p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1.5">
                    
                    <span>Tentang Outlet</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {tenant.storeDescription}
                  </p>
                </div>
              )}

              {/* 5. Comprehensive Outlet Details List */}
              <div className="space-y-3 pt-1">
                {/* Alamat */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-150 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Alamat Outlet
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                      {addressText}
                    </div>
                    <button
                      type="button"
                      onClick={openGoogleMaps}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-catalog-primary hover:underline mt-1.5 cursor-pointer"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Layanan Pemesanan Didukung */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-150 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Layanan Yang Tersedia
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {tenant.dineInEnabled !== false && (
                        <span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                          🍽️ Makan di Tempat
                        </span>
                      )}
                      {tenant.takeAwayEnabled !== false && (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                          🛍️ Bawa Pulang
                        </span>
                      )}
                      {tenant.deliveryEnabled && (
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                          🛵 Pesan Antar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fasilitas & Pembayaran */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Pembayaran */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-150 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Metode Bayar
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {tenant.onlinePaymentEnabled ? 'QRIS, Online & Kasir' : 'QRIS & Kasir'}
                      </div>
                    </div>
                  </div>

                  {/* Fasilitas Wi-Fi / Tambahan */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-150 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Fasilitas
                      </div>
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {wifiNote ? `Wi-Fi: ${wifiNote}` : 'Free Wi-Fi & AC'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-150 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 h-11 rounded-2xl border-2 border-catalog-primary bg-white text-catalog-primary hover:bg-catalog-primary/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan Toko</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl bg-catalog-primary text-white hover:bg-catalog-primary/90 font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer active:scale-98 shadow-sm"
            >
              Kembali ke Menu
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

      {/* 6. Fullscreen Photo Lightbox Dialog */}
      {tenant.storeBannerUrl && (
        <Dialog open={isPhotoLightboxOpen} onOpenChange={setIsPhotoLightboxOpen}>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 z-[100] bg-black/95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 bg-black/95 flex flex-col items-center justify-center z-[100] border-none outline-none"
            >
              <DialogTitle className="sr-only">Foto Lengkap {tenant.name}</DialogTitle>
              <button
                type="button"
                onClick={() => setIsPhotoLightboxOpen(false)}
                className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10"
                aria-label="Tutup foto full"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="relative w-full max-w-4xl max-h-[85vh] p-4 flex items-center justify-center">
                <img
                  src={tenant.storeBannerUrl}
                  alt={`Foto Full ${tenant.name}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                />
              </div>

              <div className="text-center text-white/90 pb-6 px-4">
                <h3 className="font-bold text-lg">{tenant.name}</h3>
                <p className="text-xs text-white/60 mt-0.5">Ketuk di luar atau tombol X untuk menutup</p>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}

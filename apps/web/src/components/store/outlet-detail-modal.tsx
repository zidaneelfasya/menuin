'use client';

import * as React from 'react';
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import {
  X,
  MapPin,
  Clock,
  BadgeCheck,
  Share2,
  ExternalLink,
  Utensils,
  Check,
  Navigation,
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
            text: tenant.storeDescription || `Pesan menu dari ${tenant.name}`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link outlet berhasil disalin ke clipboard');
        }
      } catch {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link outlet berhasil disalin ke clipboard');
        } catch {
          // ignore
        }
      }
    }
  };

  const openGoogleMaps = () => {
    if (tenant.mapsUrl && tenant.mapsUrl.trim() !== '') {
      window.open(tenant.mapsUrl, '_blank');
      return;
    }
    const query = tenant.address || tenant.receiptHeader || `${tenant.name} ${tenant.city || 'Banyuwangi'}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const fullAddress =
    tenant.address ||
    tenant.receiptHeader ||
    'Jl. Jaksa Agung Suprapto No. 7A, Kel. Penganjuran, Kec. Banyuwangi';
  const openHoursText = tenant.openHours || '09:00 - 22:00';
  const cuisineCategory = tenant.cuisineType || tenant.storeDescription || 'Kuliner Pilihan & Minuman Segar';

  const facilitiesList = [
    {
      title: 'Mode Pemesanan Fleksibel',
      desc: 'Makan di Tempat (Dine-in) & Bawa Pulang (Takeaway)',
    },
    {
      title: 'Pemesanan Mandiri (Self-Order QR)',
      desc: 'Pesan langsung dari meja tanpa harus antre di kasir',
    },
    {
      title: 'Metode Pembayaran Lengkap',
      desc: tenant.onlinePaymentEnabled
        ? 'QRIS Dinamis, Transfer Bank & Pembayaran Kasir'
        : 'QRIS Dinamis & Pembayaran di Kasir',
    },
    {
      title: 'Sinkronisasi Dapur Cepat',
      desc: 'Pesanan langsung masuk ke sistem dan disiapkan kru dapur',
    },
    {
      title: 'Kustomisasi Catatan Pesanan',
      desc: 'Bebas request varian rasa, level pedas, es, dan catatan khusus',
    },
    {
      title: 'Struk & Ringkasan Digital',
      desc: 'Bukti pembayaran digital serta cetak struk kasir resmi',
    },
    {
      title: 'Kenyamanan Tempat Santap',
      desc: 'Area meja bersih, nyaman, dan ramah pengunjung',
    },
    {
      title: 'Harga Transparan',
      desc: 'Sesuai harga menu resmi tanpa biaya aplikasi tersembunyi',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className="fixed bottom-0 left-0 right-0 z-50 w-full sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md h-[90vh] max-h-[90vh] rounded-t-2xl p-0 m-0 flex flex-col bg-slate-50 shadow-xl overflow-hidden outline-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300"
        >
          <DialogTitle className="sr-only">Informasi Outlet {tenant.name}</DialogTitle>

          {/* Header Nav */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-150 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>

            <span className="text-xs font-semibold text-slate-800 tracking-tight">
              Informasi Resto
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Bagikan"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-6 space-y-4">
            {/* Header Profile Section */}
            <div className="bg-white pb-5 pt-3 px-4 border-b border-slate-150">
              <div className="flex flex-col items-center text-center">
                {/* Round Logo */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white shadow-sm bg-white overflow-hidden shrink-0 flex items-center justify-center mb-2 ring-1 ring-slate-150">
                  {tenant.storeLogoUrl ? (
                    <img
                      src={tenant.storeLogoUrl}
                      alt={tenant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-catalog-primary text-white font-semibold text-xl flex items-center justify-center">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-snug">
                  {tenant.name}
                </h2>

                {/* Cuisine Subtitle */}
                <p className="text-xs text-slate-500 font-normal mt-0.5 max-w-xs">
                  {cuisineCategory}
                </p>

                {/* Mitra Resmi Tag */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium mt-2">
                  <BadgeCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Mitra Terverifikasi Menuin</span>
                </div>
              </div>
            </div>

            {/* Card Info Resto */}
            <div className="px-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Lokasi & Jam Buka
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                {/* Top Part: Alamat (Kiri) + Mini Map (Kanan) */}
                <div className="p-4 flex items-start gap-3 justify-between">
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed line-clamp-3">
                      {fullAddress}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-catalog-primary shrink-0" />
                      <span>{tenant.city || 'Banyuwangi'}</span>
                    </div>
                  </div>

                  {/* Stylized Mini Map Thumbnail */}
                  <div
                    onClick={openGoogleMaps}
                    className="w-24 h-24 rounded-xl border border-slate-200 shadow-2xs overflow-hidden relative shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform"
                    title="Buka rute di Google Maps"
                  >
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full bg-[#e8ecf1]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="100" height="100" fill="#e5e9ec" />
                      <path d="M0,20 Q40,30 60,0 L100,0 L100,40 Q70,50 50,30 Z" fill="#d9e8d4" opacity="0.8" />
                      <path d="M20,100 Q40,65 100,75 L100,100 Z" fill="#d9e8d4" opacity="0.8" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="8" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#ffffff" strokeWidth="8" />
                      <line x1="15" y1="15" x2="85" y2="85" stroke="#ffffff" strokeWidth="5" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#ffde9e" strokeWidth="3" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#ffde9e" strokeWidth="3" />
                    </svg>

                    {/* Red Round Pin in Center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-rose-600 text-white shadow-xs flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                        <Utensils className="w-3 h-3 stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Bottom Overlay Label */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center">
                      <span className="text-[9px] font-semibold text-white flex items-center justify-center gap-0.5">
                        <span>Buka Peta</span>
                        <ExternalLink className="w-2 h-2" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jam Operasional Bar */}
                <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate">
                      Jam Buka: {openHoursText}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Card Layanan & Fasilitas (Diperkaya dengan Icon Fill Check Warna Hijau) */}
            <div className="px-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Layanan & Fasilitas
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-6 overflow-hidden">
                {facilitiesList.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 leading-snug">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>

                    {/* Icon Fill Check Hijau */}
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Aktivitas Resto */}
            <div className="px-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Aktivitas Resto
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs text-center">
                  <div className="text-base font-semibold text-slate-900 font-numeric">
                    {formatTotalSold(totalSold)}
                  </div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Total Produk Terjual
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs text-center">
                  <div className="text-base font-semibold text-slate-900 font-numeric">
                    {totalProducts > 0 ? `${totalProducts}` : '18+'}
                  </div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Pilihan Menu Aktif
                  </div>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            {tenant.storeDescription && (
              <div className="px-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Tentang Toko
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {tenant.storeDescription}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3.5 bg-white border-t border-slate-150 flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openGoogleMaps}
              className="flex-1 h-10 rounded-xl bg-catalog-primary text-white hover:bg-catalog-primary/90 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Rute Google Maps</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-98"
            >
              Kembali ke Menu
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

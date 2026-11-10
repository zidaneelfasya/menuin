'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Share2,
  Store,
  Bell,
  UtensilsCrossed,
  Check,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Hash,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/store/cart';

export interface StoreHamburgerMenuProps {
  tenant: {
    id: string;
    name: string;
    slug: string | null;
    storeLogoUrl?: string | null;
    storeBannerUrl?: string | null;
    storeDescription?: string | null;
    primaryColor?: string | null;
    receiptHeader?: string | null;
    receiptFooter?: string | null;
    receiptCustomNote?: string | null;
  };
  tableNumber?: string | null;
  statusLink: string;
  onOpenOutletDetail: () => void;
}

export function StoreHamburgerMenu({
  tenant,
  tableNumber: initialTableNumber,
  statusLink,
  onOpenOutletDetail,
}: StoreHamburgerMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrderNum, setActiveOrderNum] = useState<string | null>(null);
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [staffCalled, setStaffCalled] = useState(false);
  const [isChangeTableOpen, setIsChangeTableOpen] = useState(false);
  const [newTableInput, setNewTableInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cart store for table number
  const { tableNumber: cartTableNumber, setTableNumber } = useCartStore();
  const currentTable = cartTableNumber || initialTableNumber;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check active order in localStorage
  useEffect(() => {
    const checkActiveOrder = () => {
      if (typeof window !== 'undefined' && tenant.slug) {
        const orderNum = localStorage.getItem(`menuin_active_order_${tenant.slug}`);
        setActiveOrderNum(orderNum || null);
      }
    };

    checkActiveOrder();
    window.addEventListener('storage', checkActiveOrder);
    window.addEventListener('menuin_active_order_updated', checkActiveOrder);

    return () => {
      window.removeEventListener('storage', checkActiveOrder);
      window.removeEventListener('menuin_active_order_updated', checkActiveOrder);
    };
  }, [tenant.slug]);

  // Click outside listener when menu is open
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      try {
        if (navigator.share) {
          await navigator.share({
            title: tenant.name,
            text: tenant.storeDescription || `Pesan produk di ${tenant.name}`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link toko berhasil disalin!');
        }
      } catch {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link toko berhasil disalin!');
        } catch {
          // ignore
        }
      }
    }
  };

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onOpenOutletDetail();
  };

  const handleCallStaff = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (staffCalled) {
      toast.info('Panggilan pelayan sudah dikirim sebelumnya.');
      return;
    }

    setIsCallingStaff(true);
    setTimeout(() => {
      setIsCallingStaff(false);
      setStaffCalled(true);
      if (currentTable) {
        toast.success(`Pelayan telah dipanggil ke Meja #${currentTable}!`, {
          description: 'Staf outlet akan segera menghampiri meja Anda.',
        });
      } else {
        toast.success('Panggilan bantuan terkirim!', {
          description: 'Staf outlet terdekat akan segera membantu Anda.',
        });
      }
      setTimeout(() => setStaffCalled(false), 30000);
    }, 600);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTableInput.trim();
    if (trimmed) {
      setTableNumber(trimmed);
      toast.success(`Nomor meja diatur ke #${trimmed}`);
    } else {
      setTableNumber(null);
      toast.info('Nomor meja dihapus');
    }
    setIsChangeTableOpen(false);
  };

  const themeColor = tenant.primaryColor || 'var(--catalog-primary, #0e59f9)';

  return (
    <div className="relative inline-block text-left">
      {/* 1. Base Hamburger Button in Top Action Bar: Symmetrical white circular pill with shadow-sm-md */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center gap-[3.5px] border border-slate-200/80 bg-white/95 hover:bg-white text-slate-800 shadow-sm-md transition-all duration-200 active:scale-95 cursor-pointer z-20 focus:outline-none ${
          isOpen ? 'opacity-0 pointer-events-none' : ''
        }`}
        aria-label="Buka menu"
        aria-expanded={isOpen}
      >
        {/* 3 Clean dark hamburger bars */}
        <span className="w-3.5 h-[2px] bg-slate-800 rounded-full transition-transform duration-300 ease-in-out" />
        <span className="w-3.5 h-[2px] bg-slate-800 rounded-full transition-all duration-200 ease-in-out" />
        <span className="w-3.5 h-[2px] bg-slate-800 rounded-full transition-transform duration-300 ease-in-out" />
      </button>

      {/* 2. Global Portal for Backdrop, 'X' Toggle Button & Dropdown Menu */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[100] flex justify-center pointer-events-none">
                {/* Full-screen Dark Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto cursor-pointer"
                />

                {/* Mobile-aligned Container matching StoreLayoutClient max-w-md */}
                <div className="w-full max-w-md relative pointer-events-none h-full">
                  {/* Top-Right Container for X Button & Menu Dropdown */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 pointer-events-auto flex flex-col items-end">
                    {/* Clean White X Close Button matching top action bar */}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer z-50 focus:outline-none"
                      aria-label="Tutup menu"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>

                    {/* Menu Card: Borderless, rounded-2xl, shadow-2xl */}
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, scale: 0.94, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-2 w-[280px] sm:w-[300px] bg-white rounded-2xl border-none shadow-2xl p-2.5 z-50 text-left overflow-hidden select-none font-sans"
                    >
                      {/* Outlet Header Summary */}
                      <div className="px-2 py-2 flex items-center justify-between border-b border-slate-100 mb-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border-none">
                            {tenant.storeLogoUrl ? (
                              <img
                                src={tenant.storeLogoUrl}
                                alt={tenant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-700">
                                {tenant.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate leading-snug">
                              {tenant.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium text-emerald-600">
                                Buka Sekarang
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentTable && (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border-none font-numeric tabular-nums shrink-0">
                            Meja #{currentTable}
                          </span>
                        )}
                      </div>

                      {/* Menu Actions List */}
                      <div className="py-0.5 space-y-0.5">
                        {/* 1. Cek Status Pesanan */}
                        <Link
                          href={
                            activeOrderNum
                              ? `${statusLink}?order=${encodeURIComponent(activeOrderNum)}`
                              : statusLink
                          }
                          onClick={() => setIsOpen(false)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer"
                        >
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-900 group-hover:text-catalog-primary transition-colors">
                                Cek Status Pesanan
                              </span>
                              {activeOrderNum && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border-none shrink-0 font-numeric tabular-nums">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {activeOrderNum
                                ? `Pesanan ${activeOrderNum} siap dipantau`
                                : 'Lacak status & riwayat pesanan'}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                        </Link>

                        {/* 2. Bagikan Menu (Share) */}
                        <button
                          type="button"
                          onClick={handleShare}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer text-left"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-catalog-primary transition-colors block">
                              Bagikan Menu
                            </span>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              Kirim link ke teman atau kerabat
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                        </button>

                        {/* 3. Informasi Outlet & Jam Buka */}
                        <button
                          type="button"
                          onClick={handleOpenInfo}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer text-left"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-catalog-primary transition-colors block">
                              Informasi Outlet
                            </span>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              Alamat, jam operasional & fasilitas
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                        </button>

                        {/* 4. Panggil Pelayan / Bantuan */}
                        <button
                          type="button"
                          disabled={isCallingStaff}
                          onClick={handleCallStaff}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer text-left disabled:opacity-60"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-catalog-primary transition-colors block">
                              {staffCalled ? 'Panggilan Terkirim' : 'Panggil Pelayan'}
                            </span>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {currentTable
                                ? `Bantuan staf untuk Meja #${currentTable}`
                                : 'Minta bantuan staf outlet'}
                            </p>
                          </div>
                          {staffCalled ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                          )}
                        </button>

                        {/* 5. Ganti Nomor Meja */}
                        <div>
                          {!isChangeTableOpen ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewTableInput(currentTable || '');
                                setIsChangeTableOpen(true);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer text-left"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-slate-900 group-hover:text-catalog-primary transition-colors block">
                                  {currentTable ? `Ganti Nomor Meja (#${currentTable})` : 'Atur Nomor Meja'}
                                </span>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {currentTable ? 'Pindah ke meja lain' : 'Masukkan nomor meja Anda'}
                                </p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                            </button>
                          ) : (
                            <form
                              onSubmit={handleSaveTable}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 bg-slate-50 rounded-xl border-none shadow-2xs space-y-2 my-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-800">
                                  Nomor Meja
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsChangeTableOpen(false)}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={newTableInput}
                                  onChange={(e) => setNewTableInput(e.target.value)}
                                  placeholder="Misal: 12"
                                  className="flex-1 h-8 px-3 text-xs bg-white border-none shadow-2xs rounded-full focus:outline-none focus:ring-1.5 focus:ring-slate-300 font-numeric"
                                />
                                <button
                                  type="submit"
                                  className="h-8 px-3.5 text-xs font-semibold text-white rounded-full shadow-sm-md hover:opacity-90 active:scale-95 transition-all cursor-pointer bg-catalog-primary"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  Simpan
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Minimalist Footer */}
                      <div className="pt-2 pb-0.5 border-t border-slate-100 text-center mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Menuin &bull; Smart Dining
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

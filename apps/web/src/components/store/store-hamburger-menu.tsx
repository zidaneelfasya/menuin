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
            text: tenant.storeDescription || `Pesan menu lezat di ${tenant.name}`,
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

  return (
    <div className="relative inline-block text-left">
      {/* 1. Base Hamburger Button in Top Action Bar */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center gap-[4px] border backdrop-blur-md shadow-xs transition-all duration-200 active:scale-95 cursor-pointer z-20 focus:outline-none ${
          isOpen
            ? 'opacity-0 pointer-events-none'
            : 'bg-black/40 hover:bg-black/60 text-white border-white/20'
        }`}
        aria-label="Buka menu"
        aria-expanded={isOpen}
      >
        {/* Pulsing indicator if active order exists & menu is closed */}
       

        {/* 3 Hamburger bars */}
        <span className="w-3.5 h-[2px] bg-white rounded-full transition-transform duration-300 ease-in-out" />
        <span className="w-3.5 h-[2px] bg-white rounded-full transition-all duration-200 ease-in-out" />
        <span className="w-3.5 h-[2px] bg-white rounded-full transition-transform duration-300 ease-in-out" />
      </button>

      {/* 2. Global Portal for Backdrop, 'X' Toggle Button & Dropdown Menu */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[100] flex justify-center pointer-events-none">
                {/* Full-screen Dark Backdrop (covers search bar, categories, order banners, and entire page) */}
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
                    {/* Morphing X Button */}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center gap-[4px] border border-white/40 bg-black/75 text-white backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer z-50 ring-2 ring-white/20 focus:outline-none"
                      aria-label="Tutup menu"
                    >
                      <span className="w-3.5 h-[2px] bg-white rounded-full rotate-45 translate-y-[6px] transition-transform duration-300 ease-in-out origin-center" />
                      <span className="w-3.5 h-[2px] bg-white rounded-full opacity-0 scale-x-0 transition-all duration-200 ease-in-out" />
                      <span className="w-3.5 h-[2px] bg-white rounded-full -rotate-45 -translate-y-[6px] transition-transform duration-300 ease-in-out origin-center" />
                    </button>

                    {/* Menu Card */}
                    <motion.div
                      ref={menuRef}
                      initial={{ opacity: 0, scale: 0.93, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.93, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-2 w-[275px] sm:w-[295px] bg-white rounded-2xl border border-gray-200/90 shadow-2xl p-2 z-50 text-left overflow-hidden select-none font-sans"
                    >
                      {/* Outlet Header Summary */}
                      <div className="px-2.5 py-2 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                            {tenant.storeLogoUrl ? (
                              <img
                                src={tenant.storeLogoUrl}
                                alt={tenant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-gray-700">
                                {tenant.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate leading-snug">
                              {tenant.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              
                              <span className="text-[10px] font-semibold text-emerald-600">
                                Buka Sekarang
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentTable && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-semibold border border-gray-200 shrink-0">
                            Meja #{currentTable}
                          </span>
                        )}
                      </div>

                      {/* Menu Actions List separated by thin lines */}
                      <div className="py-0.5 divide-y divide-gray-100">
                        {/* 1. Cek Status Pesanan */}
                        <div className="py-0.5">
                          <Link
                            href={
                              activeOrderNum
                                ? `${statusLink}?order=${encodeURIComponent(activeOrderNum)}`
                                : statusLink
                            }
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    Cek Status Pesanan
                                  </span>
                                  {activeOrderNum && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-semibold ">
                                      Aktif
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {activeOrderNum
                                    ? `Pesanan ${activeOrderNum} siap dipantau`
                                    : 'Lacak status & riwayat pesanan'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                          </Link>
                        </div>

                        {/* 2. Bagikan Menu (Share) */}
                        <div className="py-0.5">
                          <button
                            type="button"
                            onClick={handleShare}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors block">
                                  Bagikan Menu
                                </span>
                                <p className="text-[10px] text-gray-500 truncate">
                                  Kirim link ke teman atau kerabat
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                          </button>
                        </div>

                        {/* 3. Informasi Outlet & Jam Buka */}
                        <div className="py-0.5">
                          <button
                            type="button"
                            onClick={handleOpenInfo}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors block">
                                  Informasi Outlet
                                </span>
                                <p className="text-[10px] text-gray-500 truncate">
                                  Alamat, jam operasional & fasilitas
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                          </button>
                        </div>

                        {/* 4. Panggil Pelayan / Bantuan */}
                        <div className="py-0.5">
                          <button
                            type="button"
                            disabled={isCallingStaff}
                            onClick={handleCallStaff}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer text-left disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                             
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-gray-900 group-hover:text-rose-600 transition-colors block">
                                  {staffCalled ? 'Panggilan Terkirim' : 'Panggil Pelayan'}
                                </span>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {currentTable
                                    ? `Bantuan staf untuk Meja #${currentTable}`
                                    : 'Minta bantuan staf outlet'}
                                </p>
                              </div>
                            </div>
                            {staffCalled ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* 5. Ganti Nomor Meja */}
                        <div className="py-0.5">
                          {!isChangeTableOpen ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewTableInput(currentTable || '');
                                setIsChangeTableOpen(true);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group cursor-pointer text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-gray-900 group-hover:text-slate-700 transition-colors block">
                                    {currentTable ? `Ganti Nomor Meja (#${currentTable})` : 'Atur Nomor Meja'}
                                  </span>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {currentTable ? 'Pindah ke meja lain' : 'Masukkan nomor meja Anda'}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
                            </button>
                          ) : (
                            <form
                              onSubmit={handleSaveTable}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2 my-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-gray-800">
                                  Nomor Meja
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsChangeTableOpen(false)}
                                  className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
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
                                  className="flex-1 h-7 px-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-catalog-primary"
                                />
                                <button
                                  type="submit"
                                  className="h-7 px-2.5 text-[11px] font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Minimalist Footer */}
                      <div className="pt-2 pb-1 border-t border-gray-100 text-center">
                        <span className="text-[10px] text-gray-400 font-medium">
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

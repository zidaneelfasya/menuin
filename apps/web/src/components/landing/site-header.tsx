"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarButton,
  NavItemType,
} from "@/components/ui/resizable-navbar";
import {
  ArrowRight,
  QrCode,
  ChefHat,
  MonitorCheck,
  BarChart3,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { usePageTransition } from "@/components/providers/page-transition-provider";

export default function SiteHeader({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { navigateWithTransition } = usePageTransition();
  const userInitial = (userName || "U").trim().charAt(0).toUpperCase();

  const navItems: NavItemType[] = [
    {
      name: "Tentang",
      link: "/tentang",
    },
    {
      name: "Fitur",
      link: "/fitur",
      children: (
        <div className="text-sm grid grid-cols-2 gap-3 p-1">
          <a
            href="/fitur#alur"
            className="group flex space-x-3.5 rounded-xl p-2.5 transition-colors hover:bg-slate-50 max-w-[280px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0E59F9] transition-transform group-hover:scale-105">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                  QR Meja Mandiri
                </h4>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0E59F9]">
                  Populer
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Pelanggan scan, pesan, &amp; bayar QRIS langsung dari meja tanpa antre.
              </p>
            </div>
          </a>

          <a
            href="/fitur#dapur"
            className="group flex space-x-3.5 rounded-xl p-2.5 transition-colors hover:bg-slate-50 max-w-[280px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                  Kitchen Display (KDS)
                </h4>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  Real-time
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Pesanan seketika masuk ke dapur dengan timer warna, nol tiket kertas hilang.
              </p>
            </div>
          </a>

          <a
            href="/fitur#pos"
            className="group flex space-x-3.5 rounded-xl p-2.5 transition-colors hover:bg-slate-50 max-w-[280px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-105">
              <MonitorCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                  Kasir POS Cloud
                </h4>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Multi-perangkat tablet/web, split bill instan, dan cetak struk Bluetooth/LAN.
              </p>
            </div>
          </a>

          <a
            href="/fitur#laporan"
            className="group flex space-x-3.5 rounded-xl p-2.5 transition-colors hover:bg-slate-50 max-w-[280px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                  Laporan &amp; Analitik
                </h4>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Otomatis
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Analisis omset harian, jam sibuk (peak hours), dan rekap laporan berkala.
              </p>
            </div>
          </a>
        </div>
      ),
    },
    {
      name: "Harga",
      link: "/harga",
    },
    {
      name: "Hubungi kami",
      link: "/kontak",
    },
    {
      name: "Lainnya",
      link: "/faq",
      children: (
        <div className="flex flex-col space-y-1 w-56 p-1">
          <Link
            href="/faq"
            className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0E59F9]"
          >
            <HelpCircle className="h-4 w-4 text-[#0E59F9]" />
            <div>
              <p className="font-semibold text-slate-900">Tanya Jawab (FAQ)</p>
              <p className="text-[11px] text-slate-500">Pertanyaan umum seputar Menuin</p>
            </div>
          </Link>
          <Link
            href="/keamanan"
            className="flex items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#0E59F9]"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="font-semibold text-slate-900">Keamanan Data</p>
              <p className="text-[11px] text-slate-500">Standar enkripsi &amp; proteksi data resto</p>
            </div>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        {/* Brand Logo */}
        <Link
          href="/"
          className="relative z-20 mr-4 flex items-center"
          aria-label="Menuin, ke beranda"
        >
          <Image
            src="/menuin.png"
            alt="Menuin"
            width={220}
            height={60}
            className="h-7 w-auto md:h-8"
            priority
          />
        </Link>

        {/* Center Nav Items with Menuin Theme Bubble Hover */}
        <NavItems items={navItems} />

        {/* Right Actions: Auth or Dashboard */}
        <div className="relative z-20 flex items-center space-x-3">
          {isLoggedIn ? (
            <a
              href="/select-tenant"
              onClick={(e) => {
                e.preventDefault();
                navigateWithTransition("/select-tenant");
              }}
              className="group flex h-9 items-center gap-2 rounded-full bg-slate-900 pl-2 pr-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0E59F9] text-[11px] font-bold text-white shadow-xs">
                {userInitial}
              </div>
              <span>Buka dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </a>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[14px] font-semibold text-slate-700 transition-colors hover:text-[#0E59F9] hover:bg-[#0E59F9]/[0.08] px-3.5 py-1.5 rounded-full"
              >
                Masuk
              </Link>

              <NavbarButton
                href="/auth/signup"
                variant="primary"
                className="bg-[#0E59F9] hover:bg-[#0C4CD6] text-white text-[14px] font-semibold px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <span>Coba gratis</span>
              </NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <Link href="/" className="flex items-center">
            <Image
              src="/menuin.png"
              alt="Menuin"
              width={220}
              height={60}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          <div className="flex flex-col space-y-2 py-2">
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-nav-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[14px] font-medium text-slate-700 hover:text-[#0E59F9] px-2 py-1.5 rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-black/[0.06] flex flex-col space-y-2 w-full">
            {isLoggedIn ? (
              <a
                href="/select-tenant"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  navigateWithTransition("/select-tenant");
                }}
                className="flex h-11 items-center justify-center gap-2.5 rounded-full bg-slate-900 text-[14px] font-semibold text-white"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0E59F9] text-[11px] font-bold text-white">
                  {userInitial}
                </div>
                <span>Buka dashboard</span>
              </a>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-[14px] font-semibold text-slate-800 rounded-full border border-slate-200 hover:bg-slate-50 transition"
                >
                  Masuk
                </Link>
                <NavbarButton
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full py-2.5 text-center justify-center"
                >
                  <span>Coba gratis</span>
                </NavbarButton>
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

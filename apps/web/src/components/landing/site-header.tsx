"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { usePageTransition } from "@/components/providers/page-transition-provider";
import { moreNav, primaryNav } from "@/components/landing/site-config";

export default function SiteHeader({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const pathname = usePathname();
  const { navigateWithTransition } = usePageTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const userInitial = (userName || "U").trim().charAt(0).toUpperCase();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = moreNav.some((i) => isActive(i.href));

  // Tutup menu saat pindah halaman.
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Tutup dropdown "Lainnya" saat klik di luar.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const linkClass = (href: string) =>
    `transition-colors ${isActive(href) ? "text-[#0a0a0a]" : "text-slate-600 hover:text-[#0a0a0a]"}`;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="Menuin, ke beranda">
          <Image src="/menuin.png" alt="Menuin" width={220} height={60} className="h-7 w-auto md:h-8" priority />
        </Link>

        <nav className="hidden items-center gap-8 text-[14px] font-medium md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={`flex items-center gap-1 transition-colors ${
                moreActive ? "text-[#0a0a0a]" : "text-slate-600 hover:text-[#0a0a0a]"
              }`}
            >
              Lainnya
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-1/2 top-9 w-48 -translate-x-1/2 rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.3)]">
                {moreNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3.5 py-2.5 text-[14px] transition-colors hover:bg-[#fafafa] ${
                      isActive(item.href) ? "text-[#0a0a0a]" : "text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isLoggedIn ? (
            <a
              href="/select-tenant"
              onClick={(e) => {
                e.preventDefault();
                navigateWithTransition("/select-tenant");
              }}
              className="group flex h-10 items-center gap-2.5 rounded-full bg-slate-900 pl-2 pr-4 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0E59F9] text-[12px] font-bold text-white shadow-sm">
                {userInitial}
              </div>
              <span>Buka dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </a>
          ) : (
            <>
              <a href="/auth/login" className="mr-2 text-[14px] font-semibold text-slate-700 transition-colors hover:text-[#0E59F9]">
                Masuk
              </a>
              <a
                href="/auth/signup"
                className="flex h-10 items-center rounded-full bg-[#0E59F9] px-5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#0C4CD6] hover:shadow-md"
              >
                Coba gratis
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 md:hidden"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6L18 18" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 12H20M4 6H20M4 18H20" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 top-[64px] w-full space-y-5 border-b border-black/[0.06] bg-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4 text-[15px] font-medium">
            {[{ label: "Beranda", href: "/" }, ...primaryNav, ...moreNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "text-[#0E59F9]" : "text-slate-700"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="h-px bg-slate-100" />
          <div className="flex flex-col gap-3">
            {isLoggedIn ? (
              <a
                href="/select-tenant"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
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
                <a href="/auth/login" className="flex h-11 items-center justify-center rounded-full border border-slate-200 text-[14px] font-semibold text-slate-800">
                  Masuk
                </a>
                <a href="/auth/signup" className="flex h-11 items-center justify-center rounded-full bg-[#0E59F9] text-[14px] font-semibold text-white">
                  Coba gratis
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

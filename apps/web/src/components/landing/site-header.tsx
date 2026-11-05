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
    },
  ];

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        {/* Brand Logo */}
        <Link
          href="/"
          className="relative z-20 mr-4 flex items-center shrink-0"
          aria-label="Menuin, ke beranda"
        >
          <Image
            src="/menuin.png"
            alt="Menuin"
            width={220}
            height={60}
            className="h-7 w-auto md:h-8 shrink-0 object-contain"
            priority
          />
        </Link>

        {/* Center Nav Items with Menuin Theme Bubble Hover */}
        <NavItems items={navItems} />

        {/* Right Actions: Auth or Dashboard */}
        <div className="relative z-20 flex items-center space-x-3 shrink-0">
          {isLoggedIn ? (
            <a
              href="/select-tenant"
              onClick={(e) => {
                e.preventDefault();
                navigateWithTransition("/select-tenant");
              }}
              className="group flex h-9 items-center gap-2 rounded-full pl-2.5 pr-4 text-[13px] font-semibold text-white bg-[#0e59f9] hover:bg-[#0b4de0] active:scale-[0.98] transition-all duration-150 ease-out whitespace-nowrap shadow-none cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                {userInitial}
              </div>
              <span>Buka dashboard</span>
              
            </a>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="relative block rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white hover:shadow-[2px_4px_12px_rgba(160,175,200,0.42),-2px_-2px_8px_rgba(255,255,255,0.9)] whitespace-nowrap"
              >
                Masuk
              </Link>

              <NavbarButton
                href="/auth/signup"
                variant="primary"
                className="text-[14px] font-semibold px-5 py-2 whitespace-nowrap"
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
                className="text-[14px] font-medium text-slate-700 hover:shadow-[2px_4px_10px_rgba(160,175,200,0.35)] hover:bg-white px-3 py-2 rounded-xl transition-all"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex flex-col space-y-2 w-full">
            {isLoggedIn ? (
              <a
                href="/select-tenant"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  navigateWithTransition("/select-tenant");
                }}
                className="flex h-11 items-center justify-center gap-2.5 rounded-full text-[14px] font-semibold text-white bg-[#0e59f9] hover:bg-[#0b4de0] active:scale-[0.98] transition-all duration-150 ease-out shadow-none cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white">
                  {userInitial}
                </div>
                <span>Buka dashboard</span>
              </a>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-[14px] font-semibold text-slate-700 rounded-full bg-white shadow-[2px_4px_10px_rgba(160,175,200,0.35)] hover:shadow-[3px_5px_14px_rgba(160,175,200,0.45)] transition"
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

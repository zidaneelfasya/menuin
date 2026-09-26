"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import SmoothScroll from "@/components/landing/smooth-scroll";
import SiteHeader from "@/components/landing/site-header";
import FooterReadyToBegin from "@/components/ui/footer-ready-to-begin";
import FooterSuperfluidStyle from "@/components/ui/footer-superfluid-style";

/**
 * Kerangka bersama semua halaman marketing: navbar, isi halaman, CTA, footer.
 *
 * Lenis dipasang ulang setiap pindah halaman (key = pathname) supaya posisi
 * scroll dan ScrollTrigger tidak terbawa dari halaman sebelumnya.
 */
export default function SiteShell({
  isLoggedIn,
  userName,
  children,
}: {
  isLoggedIn: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="landing-root min-h-screen bg-white text-[#111] antialiased selection:bg-[#0E59F9] selection:text-white">
      <SmoothScroll key={pathname} />
      <SiteHeader isLoggedIn={isLoggedIn} userName={userName} />
      <main>{children}</main>
      <FooterReadyToBegin />
      <FooterSuperfluidStyle />
    </div>
  );
}

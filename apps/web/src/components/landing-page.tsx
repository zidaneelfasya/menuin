"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import OrderJourney from "@/components/landing/order-journey";
import ComparisonScroll from "@/components/landing/comparison-scroll";
import { HeroIntro } from "@/components/landing/scroll-reveal";
import HeroParallax from "@/components/landing/hero-parallax";
import FeatureTeaser from "@/components/landing/feature-teaser";
import { PricingSection } from "@/components/landing/pricing-section";
import { usePageTransition } from "@/components/providers/page-transition-provider";

export default function LandingPage({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const { navigateWithTransition } = usePageTransition();

  return (
    <>
      {/* HERO */}
      <HeroParallax
        heading={
          <HeroIntro>
            <div data-hero-item>
              <p className="mx-auto flex w-fit items-center gap-3 text-[13.5px] font-medium tracking-[-0.01em] text-[#52525b]">
                <Image
                  src="/img/landing/hero/menuin-wordmark.png"
                  alt="Menuin"
                  width={1271}
                  height={258}
                  className="h-[14px] w-auto"
                />
                <span aria-hidden="true" className="h-3.5 w-px bg-black/15" />
                <span>Simple Ways to Run F&amp;B</span>
              </p>
            </div>
            <div data-hero-item>
              <h1 className="mx-auto mt-4 text-center font-display text-[clamp(32px,4.6vw,64px)] font-semibold leading-[1.02] tracking-[-0.045em] text-[#0a0a0a]">
                <span className="block">Satu sentuhan di meja.</span>
                <span className="block">Kasir bergerak kilat.</span>
                <span className="block">Dapur tepat waktu.</span>
              </h1>
            </div>
            <div data-hero-item>
              <p className="mx-auto mt-4 max-w-[56ch] text-center text-[15px] leading-relaxed text-[#52525b] md:text-[16px]">
                Pemesanan mandiri lewat QR, kasir cloud untuk jam sibuk, dan layar dapur tanpa
                kertas, dalam satu sistem yang sama.
              </p>
            </div>
          </HeroIntro>
        }
        actions={
          <div className="flex flex-col items-center">
            <div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
              <a
                href={isLoggedIn ? "/select-tenant" : "/auth/signup"}
                onClick={(e) => {
                  if (isLoggedIn) {
                    e.preventDefault();
                    navigateWithTransition("/select-tenant");
                  }
                }}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0E59F9] px-7 text-[15px] font-medium text-white transition-colors hover:bg-[#0C4CD6] active:scale-[0.98] shadow-none sm:w-auto"
              >
                {isLoggedIn ? "Buka dashboard" : "Mulai uji coba 14 hari"}
              </a>
              <a
                href="#alur"
                className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-white px-7 text-[15px] font-medium text-[#0a0a0a] shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.06] transition-colors hover:bg-[#fafafa] sm:w-auto"
              >
                Lihat cara kerjanya
                <ArrowRight className="h-4 w-4 text-[#71717a]" />
              </a>
            </div>
            <p className="mt-4 rounded-full bg-white/85 px-4 py-1.5 text-center text-[12.5px] text-[#52525b] backdrop-blur">
              Tanpa kartu kredit · Setup 5 menit<span className="hidden sm:inline"> · Printer Bluetooth &amp; LAN</span>
            </p>
          </div>
        }
      />

      {/* SEBELUM & SESUDAH — masalah jam sibuk yang hilang */}
      <ComparisonScroll />

      {/* CARA KERJA — dari scan QR sampai transaksi tercatat */}
      <OrderJourney />

      {/* CUPLIKAN FITUR — detail lengkap di /fitur */}
      <FeatureTeaser />

      {/* HARGA — ringkas; tabel lengkap di /harga */}
      <PricingSection />
    </>
  );
}

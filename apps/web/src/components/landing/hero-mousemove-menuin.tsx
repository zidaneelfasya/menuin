"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const rowImages: string[][] = [
  // Row 0
  [
    "/hero/pos-cashier-screen.png",
    "/hero/outlet-dashboard.png",
    "/hero/online-store-qr-catalog.png",
    "/hero/best-seller-analytics.png",
    "/hero/executive-summary.png",
  ],
  // Row 1
  [
    "/hero/hero-storefront.png",
    "/hero/financial-analytics.png",
    "/hero/menu-management.png",
    "/hero/business-performance-report.png",
    "/hero/pos-device-management.png",
  ],
  // Row 2
  [
    "/hero/hero-status-pesanan.png",
    "/hero/peak-hours-analytics.png",
    "/hero/menu-customization.png",
    "/hero/outlet-comparison-report.png",
    "/hero/sales-report-analytics.png",
  ],
  // Row 3
  [
    "/hero/sales-summary-report.png",
    "/hero/transaction-history.png",
    "/hero/discount-promotions.png",
    "/hero/store-settings.png",
    "/hero/team-management.png",
  ],
  // Row 4
  [
    "/hero/pos-cashier-screen.png",
    "/hero/outlet-dashboard.png",
    "/hero/online-store-qr-catalog.png",
    "/hero/hero-storefront.png",
    "/hero/financial-analytics.png",
  ],
];

export function HeroMousemoveMenuin() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0.5); // 0 to 1, centered at 0.5

  const smoothX = useSpring(mouseX, {
    stiffness: 90,
    damping: 24,
    mass: 0.6,
  });

  // Exactly matching the horizontal parallax translation logic from Aceternity UI
  const row0X = useTransform(smoothX, [0, 1], [-200, 200]);
  const row1X = useTransform(smoothX, [0, 1], [160, -160]);
  const row2X = useTransform(smoothX, [0, 1], [-140, 140]);
  const row3X = useTransform(smoothX, [0, 1], [180, -180]);
  const row4X = useTransform(smoothX, [0, 1], [-90, 90]);

  const rowTransforms = [row0X, row1X, row2X, row3X, row4X];

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth || 1920;
      const normalized = Math.min(Math.max(e.clientX / windowWidth, 0), 1);
      mouseX.set(normalized);
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, [mouseX]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[92vh] lg:min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-16 md:py-24 lg:py-32"
    >
      {/* Background Masonry Card Rows with Mousemove Parallax and Radial Gradient Mask */}
      <div
        className="pointer-events-none absolute inset-0 flex h-full w-full flex-col justify-center gap-3.5 sm:gap-4 md:gap-5 overflow-hidden opacity-45 select-none"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle at center, transparent 15%, rgba(0, 0, 0, 0.4) 40%, black 75%)",
          maskImage:
            "radial-gradient(circle at center, transparent 15%, rgba(0, 0, 0, 0.4) 40%, black 75%)",
        }}
      >
        {rowImages.map((row, rowIdx) => {
          // Duplicate items to ensure wide screen edge-to-edge coverage
          const cards = [...row, ...row, ...row];
          return (
            <motion.div
              key={`row-${rowIdx}`}
              style={{ x: rowTransforms[rowIdx] }}
              className="flex items-center justify-center gap-3.5 sm:gap-4 md:gap-5 shrink-0 will-change-transform"
            >
              {cards.map((imgSrc, cardIdx) => (
                <div
                  key={`card-${rowIdx}-${cardIdx}`}
                  className="h-28 w-48 sm:h-36 sm:w-64 md:h-48 md:w-80 shrink-0 overflow-hidden rounded-2xl bg-white shadow-md shadow-black/5 ring-1 ring-black/[0.08]"
                >
                  <img
                    src={imgSrc}
                    alt="Menuin App Feature"
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* Center Foreground Hero Content */}
      <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-4">
        {/* Top Badge */}
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-black/[0.08] bg-white/95 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs backdrop-blur-md">
          <Image
            src="/img/landing/hero/menuin-wordmark.png"
            alt="Menuin"
            width={1271}
            height={258}
            className="h-3.5 w-auto"
          />
          <span aria-hidden="true" className="h-3.5 w-px bg-black/15" />
          <span className="text-[#0E59F9] font-medium">Simple Ways to Run F&amp;B</span>
        </div>

        {/* Main Headline */}
        <h1 className="max-w-4xl text-center font-display text-[clamp(32px,5vw,62px)] font-bold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Satu Sentuhan di Meja.{" "}
          <span className="text-[#0E59F9]">Kasir Bergerak Kilat.</span>{" "}
          Dapur Tepat Waktu.
        </h1>

        {/* Subtitle Description */}
        <p className="mt-5 max-w-xl text-center text-[15px] sm:text-base leading-relaxed text-slate-600 md:text-[17px]">
          Pemesanan mandiri lewat QR, kasir cloud untuk jam sibuk, dan layar dapur tanpa kertas, dalam satu ekosistem pintar terintegrasi.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <a
            href="/auth/signup"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-[#0E59F9] px-8 text-[15px] font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-[#0C4CD6] hover:shadow-lg active:scale-95"
          >
            Mulai Uji Coba 14 Hari
          </a>
          <a
            href="#alur"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-slate-200/90 bg-white px-7 text-[15px] font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            Pelajari Cara Kerja
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Gratis uji coba 14 hari</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Tanpa kontrak mengikat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Setup hanya 5 menit</span>
          </div>
        </div>
      </div>
    </section>
  );
}

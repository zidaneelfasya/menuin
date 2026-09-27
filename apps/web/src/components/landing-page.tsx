"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import OrderJourney from "@/components/landing/order-journey";
import ComparisonScroll from "@/components/landing/comparison-scroll";
import { HeroIntro } from "@/components/landing/scroll-reveal";
import HeroParallax from "@/components/landing/hero-parallax";
import FeatureTeaser from "@/components/landing/feature-teaser";
import { PricingCards } from "@/components/landing/pricing";
import { usePageTransition } from "@/components/providers/page-transition-provider";

const testimonialsData = [
  {
    name: 'Budi Santoso',
    role: 'Founder, Sunset Coffee Bar',
    avatar: 'https://i.pravatar.cc/150?u=budi',
    rating: 5.0,
    text: 'Long register lines disappeared immediately. Guests order and pay right from their tables. The POS register runs remarkably fast!',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Siti Aminah',
    role: 'General Manager, Raya Resto Chain',
    avatar: 'https://i.pravatar.cc/150?u=siti',
    rating: 4.8,
    text: 'Stock management is outstanding. We get automated low-inventory alerts before ingredients run out. It keeps our daily operations spotless.',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Andi Wijaya',
    role: 'Owner, Burger Bros',
    avatar: 'https://i.pravatar.cc/150?u=andi',
    rating: 5.0,
    text: 'Instant QRIS checkout processes seamlessly with zero latency. Sales reports provide granular insights into our best-selling items.',
    sentiment: 'Top Recommended'
  },
  {
    name: 'Dewi Lestari',
    role: 'Proprietor, Artisan Bakery Cafe',
    avatar: 'https://i.pravatar.cc/150?u=dewi',
    rating: 4.9,
    text: 'The interface is sleek and very intuitive for our kitchen crew. Table orders sync directly to the kitchen display with zero error.',
    sentiment: 'Highly Satisfied'
  },
  {
    name: 'Reza Rahadian',
    role: 'Co-Founder, Brew & Roast Co.',
    avatar: 'https://i.pravatar.cc/150?u=reza',
    rating: 5.0,
    text: 'Exceptional uptime even during peak weekend rushes. It has been the most reliable tech investment for our hospitality business.',
    sentiment: 'Top Recommended'
  },
  {
    name: 'Ayu Pratama',
    role: 'Multi-Unit Operator, Gourmet Bites',
    avatar: 'https://i.pravatar.cc/150?u=ayu',
    rating: 4.7,
    text: 'Opening a new branch takes only minutes to configure. Multi-outlet reports give me complete financial visibility from anywhere.',
  }
];

const shiftedTestimonialsData = [
  ...testimonialsData.slice(3),
  ...testimonialsData.slice(0, 3)
];

function SkeletonCard() {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper pointer-events-none select-none">
      <div className="w-full h-full bg-slate-50/90 rounded-[24px] p-4 border border-slate-200/60 flex flex-col shadow-xs opacity-60 grayscale testimonial-inner origin-center will-change-transform transform-gpu">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="w-20 max-w-full h-2.5 bg-slate-200 rounded" />
              <div className="w-16 max-w-full h-2 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="w-14 h-2 bg-slate-200 rounded" />
            <div className="w-16 h-4 bg-slate-100 rounded-full" />
          </div>
        </div>

        {/* Text Body */}
        <div className="flex flex-col gap-1 mt-auto mb-1">
          <div className="w-full h-2 bg-slate-200 rounded" />
          <div className="w-[85%] h-2 bg-slate-100 rounded" />
        </div>

      </div>
    </div>
  );
}

function RealCard({ data }: { data: any }) {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper">
      <div className="w-full h-full bg-white rounded-[24px] p-4 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col testimonial-inner origin-center will-change-transform transform-gpu">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <img
              src={data.avatar}
              alt={data.name}
              loading="lazy"
              decoding="async"
              className="w-8 h-8 rounded-full object-cover shadow-xs shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[12px] font-bold text-[#111] leading-tight truncate block">{data.name.toLowerCase()}</span>
              <span className="text-[10px] text-[#888] truncate block">{data.role.toLowerCase()}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-[9px] ${i < Math.floor(data.rating) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
              ))}
              <span className="text-[10px] font-bold text-[#111] ml-1">{data.rating}</span>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#139E60] text-[8px] font-black tracking-wide uppercase border border-[#D0EBE0]">
              {data.sentiment}
            </span>
          </div>
        </div>

        {/* Text Body */}
        <p className="text-[11px] text-[#666] leading-relaxed line-clamp-2 mt-auto mb-1">
          "{data.text}"
        </p>

      </div>
    </div>
  );
}

export default function LandingPage({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const { navigateWithTransition } = usePageTransition();
  const marqueeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let startTime = performance.now();
    let cache: any = null;
    let isVisible = false;

    const buildCache = () => {
      if (!marqueeContainerRef.current) return null;

      const contentsList = Array.from(marqueeContainerRef.current.querySelectorAll('.marquee-content')) as HTMLElement[];
      const oldTransforms = contentsList.map(c => c.style.transform);
      contentsList.forEach(c => c.style.transform = 'none');

      const containerRect = marqueeContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const halfContainerWidth = containerWidth / 2 || 1;

      const tracks = Array.from(marqueeContainerRef.current.querySelectorAll('.row-top, .row-middle, .row-bottom')).map(track => {
        const isMiddle = track.classList.contains('row-middle');
        const isBottom = track.classList.contains('row-bottom');
        let delay = 0;
        if (isMiddle) delay = -12;

        const contents = Array.from(track.querySelectorAll('.marquee-content')).map(content => {
          const contentEl = content as HTMLElement;
          const contentRect = contentEl.getBoundingClientRect();
          const contentWidth = contentRect.width;

          const wrappers = Array.from(content.querySelectorAll('.testimonial-wrapper')).map(wrapper => {
            const el = wrapper as HTMLElement;
            const inner = el.querySelector('.testimonial-inner') as HTMLElement;
            const isTopRow = el.closest('.row-top') !== null;
            const isBottomRow = el.closest('.row-bottom') !== null;

            const rect = el.getBoundingClientRect();
            const initialCenter = rect.left + rect.width / 2;

            return { inner, initialCenter, isTopRow, isBottomRow };
          });

          return { content: contentEl, contentWidth, wrappers };
        });

        return { delay, contents };
      });

      contentsList.forEach((c, i) => c.style.transform = oldTransforms[i]);

      return { containerWidth, containerCenter, halfContainerWidth, tracks };
    };

    // Logic untuk membuat animasi testimonial lengkung & sangat halus
    const updateCards = (time: number) => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }

      if (!cache) {
        cache = buildCache();
        if (!cache) {
          animationFrameId = requestAnimationFrame(updateCards);
          return;
        }
      }

      if (!marqueeContainerRef.current) return;
      const { containerCenter, halfContainerWidth, tracks } = cache;
      const duration = 22; // Durasi gliding lebih halus dan stabil
      const elapsed = (time - startTime) / 1000;

      for (let i = 0; i < tracks.length; i++) {
        const trackInfo = tracks[i];
        const totalElapsed = elapsed - trackInfo.delay;
        let progress = (totalElapsed % duration) / duration;
        if (progress < 0) progress += 1;

        const translateXPercent = -100 + (progress * 100);

        for (let j = 0; j < trackInfo.contents.length; j++) {
          const contentInfo = trackInfo.contents[j];
          if (!contentInfo.content || !contentInfo.content.isConnected) continue;
          const translateXPixels = (translateXPercent / 100) * contentInfo.contentWidth;

          contentInfo.content.style.transform = `translate3d(${translateXPercent.toFixed(3)}%, 0, 0)`;

          for (let k = 0; k < contentInfo.wrappers.length; k++) {
            const wrapperInfo = contentInfo.wrappers[k];
            if (!wrapperInfo.inner || !wrapperInfo.inner.isConnected) continue;

            const currentCenter = wrapperInfo.initialCenter + translateXPixels;
            const distanceFromCenter = (currentCenter - containerCenter) / halfContainerWidth;

            // Skip offscreen elements to avoid unnecessary transform calculations
            if (distanceFromCenter < -2.2 || distanceFromCenter > 2.2) {
              continue;
            }

            const clampedDistance = Math.max(-1.5, Math.min(1.5, distanceFromCenter));
            const curveIntensity = clampedDistance * clampedDistance;

            const maxOffset = 170;
            const maxRotation = 14;

            let translateY = 0;
            let rotateZ = 0;

            if (wrapperInfo.isTopRow) {
              translateY = -curveIntensity * maxOffset;
              rotateZ = -clampedDistance * maxRotation;
            } else if (wrapperInfo.isBottomRow) {
              translateY = curveIntensity * maxOffset;
              rotateZ = clampedDistance * maxRotation;
            }

            wrapperInfo.inner.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) rotate(${rotateZ.toFixed(2)}deg)`;
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateCards);
    };

    cache = buildCache();

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          if (!animationFrameId) {
            startTime = performance.now();
            animationFrameId = requestAnimationFrame(updateCards);
          }
        } else {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      },
      { rootMargin: '200px 0px' }
    );

    if (marqueeContainerRef.current) {
      observer.observe(marqueeContainerRef.current);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cache = buildCache();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);


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
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0E59F9] px-7 text-[15px] font-medium text-white shadow-[0_12px_30px_-10px_rgba(14,89,249,0.6)] transition-colors hover:bg-[#0C4CD6] sm:w-auto"
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

      {/* WRAPPER FOR TESTIMONIAL & PRICING */}
      <div className="relative overflow-hidden bg-[#FAFAFA]">

        {/* BACKGROUND DIVIDER SVG */}
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-[1922px] pointer-events-none z-20 flex justify-center">
          <img src="/divider/divider.svg" alt="Divider Background" className="w-full h-auto" />
        </div>
        {/* TESTIMONIALS REVEAL */}
        <section
          ref={marqueeContainerRef}
          id="testimonials"
          className="relative pt-10 md:pt-14 pb-24 md:pb-32 z-10"
        >
          {/* HEADER */}
          <div className="relative z-[60] mx-auto mb-6 max-w-[1200px] px-6 text-center md:mb-8">
            <h2 className="text-[clamp(44px,7.2vw,78px)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#111]">
              What they said <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E59F9] via-[#2563EB] to-[#0941B8]">
                about us.
              </span>
            </h2>
          </div>

          {/* TESTIMONIAL CANVAS */}
          <div className="relative h-[760px] w-full">

            {/* ========================================= */}
            {/* TESTIMONIAL MARQUEE */}
            {/* ========================================= */}

            {/* TOP ROW */}
            <div className="row-top absolute left-0 top-[170px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel1-t-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel2-t-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL TESTIMONIAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real1-t-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].map((t, i) => (
                      <RealCard
                        key={`real2-t-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW */}
            <div className="row-middle absolute left-0 top-[315px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <SkeletonCard key={`skel1-m-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <SkeletonCard key={`skel2-m-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <RealCard
                        key={`real1-m-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData, ...testimonialsData].reverse().map((t, i) => (
                      <RealCard
                        key={`real2-m-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="row-bottom absolute left-0 top-[460px] z-10 w-full">
              <div className="relative flex h-[120px] w-full">

                {/* SKELETON */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...shiftedTestimonialsData, ...shiftedTestimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel1-b-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...shiftedTestimonialsData, ...shiftedTestimonialsData].map((t, i) => (
                      <SkeletonCard key={`skel2-b-${i}`} />
                    ))}
                  </div>
                </div>

                {/* REAL */}
                <div
                  className="absolute inset-0 z-20 flex"
                  style={{
                    clipPath: "inset(-200px 0 -200px 50%)",
                  }}
                >
                  <div className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5">
                    {[...shiftedTestimonialsData, ...shiftedTestimonialsData].map((t, i) => (
                      <RealCard
                        key={`real1-b-${i}`}
                        data={t}
                      />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...shiftedTestimonialsData, ...shiftedTestimonialsData].map((t, i) => (
                      <RealCard
                        key={`real2-b-${i}`}
                        data={t}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* EDGE FADE */}
            {/* ========================================= */}

            <div
              className="
        pointer-events-none
        absolute
        inset-y-0
        left-0
        z-[55]
        w-[18%]
        bg-gradient-to-r
        from-[#FAFAFA]
        via-[#FAFAFA]/80
        to-transparent
      "
            />

            <div
              className="
        pointer-events-none
        absolute
        inset-y-0
        right-0
        z-[55]
        w-[18%]
        bg-gradient-to-l
        from-[#FAFAFA]
        via-[#FAFAFA]/80
        to-transparent
      "
            />
          </div>
        </section>

        {/* HARGA — ringkas; tabel lengkap di /harga */}
        <section className="relative z-30 mt-16 px-6 pb-28 pt-36 md:mt-24 md:pb-36 md:pt-52" id="pricing">
          <div className="relative z-10 mx-auto max-w-[1240px]">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">Harga</p>
                <h2 className="mt-4 max-w-[18ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
                  Bayar bulanan, tanpa kontrak tahunan.
                </h2>
              </div>
              <Link
                href="/harga"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0E59F9] hover:text-[#0C4CD6]"
              >
                Bandingkan semua fitur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-12">
              <PricingCards />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

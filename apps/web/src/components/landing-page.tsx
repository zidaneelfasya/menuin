"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SmoothScroll from "@/components/landing/smooth-scroll";
import AboutSection from "@/components/landing/about-section";
import OrderJourney from "@/components/landing/order-journey";
import ComparisonScroll from "@/components/landing/comparison-scroll";
import FeatureShowcase from "@/components/landing/feature-showcase";
import SecuritySection from "@/components/landing/security-section";
import { HeroIntro } from "@/components/landing/scroll-reveal";
import HeroParallax from "@/components/landing/hero-parallax";
import FaqEditorial from "@/components/ui/faq-editorial";
import FooterReadyToBegin from "@/components/ui/footer-ready-to-begin";
import FooterSuperfluidStyle from "@/components/ui/footer-superfluid-style";
import { usePageTransition } from "@/components/providers/page-transition-provider";



function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold, rootMargin: "60px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// TODO(sales): ganti dengan nomor WhatsApp tim yang sebenarnya sebelum rilis.
const CONTACT_WHATSAPP =
  "https://wa.me/628123456789?text=Halo%20Menuin%2C%20saya%20ingin%20berdiskusi%20soal%20paket%20Enterprise";



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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const userInitial = (userName || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="landing-root min-h-screen bg-white text-[#111] antialiased selection:bg-[#0E59F9] selection:text-white">
      <SmoothScroll />

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="mx-auto max-w-[1280px] h-[64px] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image src="/menuin.png" alt="Menuin" width={220} height={60} className="h-7 w-auto md:h-8" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#tentang" className="hover:text-[#0a0a0a] transition-colors">Tentang</a>
            <a href="#alur" className="hover:text-[#0a0a0a] transition-colors">Cara kerja</a>
            <a href="#fitur" className="hover:text-[#0a0a0a] transition-colors">Fitur</a>
            <a href="#pricing" className="hover:text-[#0a0a0a] transition-colors">Harga</a>
            <a href="#faq" className="hover:text-[#0a0a0a] transition-colors">Tanya jawab</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <a
                href="/select-tenant"
                onClick={(e) => {
                  e.preventDefault();
                  navigateWithTransition('/select-tenant');
                }}
                className="h-10 pl-2 pr-4 flex items-center rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-all gap-2.5 shadow-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-[#0E59F9] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
                  {userInitial}
                </div>
                <span>Buka dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-[14px] font-semibold text-slate-700 hover:text-[#0E59F9] transition-colors mr-2">Masuk</a>
                <a href="/auth/signup" className="h-10 px-5 flex items-center rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold hover:bg-[#0C4CD6] transition-all shadow-sm hover:shadow-md">
                  Coba gratis
                </a>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
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

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-black/[0.06] px-6 py-6 space-y-5">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-slate-700">
              <a href="#tentang" onClick={() => setMobileOpen(false)}>Tentang</a>
              <a href="#alur" onClick={() => setMobileOpen(false)}>Cara kerja</a>
              <a href="#fitur" onClick={() => setMobileOpen(false)}>Fitur</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)}>Harga</a>
              <a href="#faq" onClick={() => setMobileOpen(false)}>Tanya jawab</a>
            </nav>
            <div className="h-px bg-slate-100" />
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <a 
                  href="/select-tenant" 
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileOpen(false);
                    navigateWithTransition('/select-tenant');
                  }}
                  className="flex items-center justify-center gap-2.5 h-11 rounded-full bg-slate-900 text-white text-[14px] font-semibold"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0E59F9] text-white flex items-center justify-center font-bold text-[11px]">
                    {userInitial}
                  </div>
                  <span>Buka dashboard</span>
                </a>
              ) : (
                <>
                  <a href="/auth/login" className="flex items-center justify-center h-11 rounded-full border border-slate-200 text-[14px] font-semibold text-slate-800">Masuk</a>
                  <a href="/auth/signup" className="flex items-center justify-center h-11 rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold">Coba gratis</a>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <HeroParallax
        heading={
          <HeroIntro>
            <div data-hero-item>
              <p className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#0E59F9]/[0.07] px-3.5 py-1.5 text-[12.5px] font-semibold tracking-[-0.005em] text-[#0E59F9]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0E59F9]" />
                Simple Ways to Run F&amp;B
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

      {/* TENTANG — siapa Menuin dan untuk siapa */}
      <AboutSection />

      {/* SEBELUM & SESUDAH — masalah jam sibuk yang hilang */}
      <ComparisonScroll />

      {/* CARA KERJA — dari scan QR sampai transaksi tercatat */}
      <OrderJourney />

      {/* FITUR UNGGULAN — operasional di luar alur pesanan */}
      <FeatureShowcase />

      {/* KEAMANAN — keraguan terakhir sebelum harga */}
      <SecuritySection />

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

        {/* PRICING (Side-by-Side Editorial Layout inside wrapper with SVG Background) */}
        <section className="relative z-30 pt-36 md:pt-52 pb-28 md:pb-36 px-6 sm:px-10 lg:px-14 mt-16 md:mt-24" id="pricing">
          <div className="mx-auto max-w-[1240px] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

              {/* Column 1: Left Editorial Typographic Header */}
              <FadeIn className="lg:col-span-4 pr-0 lg:pr-4 pt-3">
                <div className="space-y-1">
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900">
                    Langganan bulanan,
                  </h2>
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0E59F9]">
                    tanpa kontrak tahunan.
                  </h2>
                </div>

                <p className="text-slate-500 text-sm sm:text-[14.5px] mt-6 leading-relaxed">
                  Bayar per bulan, per outlet. Tidak ada biaya pemasangan awal, tidak ada potongan komisi per transaksi menu, dan tidak ada kontrak yang mengikat.
                </p>

                <div className="mt-8 flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E59F9]" />
                  <span>Aktivasi instan dan bantuan setup dari tim kami</span>
                </div>
              </FadeIn>

              {/* Column 2 & 3: Pro & Custom White Cards */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">

                {/* Pro Card */}
                <FadeIn delay={0.1}>
                  <div className="flex flex-col justify-between p-7 sm:p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all h-full">
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                        Pro
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-[-0.035em] tabular-nums">
                          Rp 199.000
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400">
                          /bulan per outlet
                        </span>
                      </div>

                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {[
                          "Kasir cloud dan cetak struk termal",
                          "QR meja tanpa batas jumlah pesanan",
                          "QRIS dinamis terverifikasi otomatis",
                          "Papan pesanan dan tiket dapur otomatis",
                          "Hak akses Owner, Manajer, dan Kasir",
                          "Stok berjalan dan peringatan stok menipis",
                          "Laporan penjualan, shift, dan laba",
                          "Printer kasir Bluetooth dan LAN (58/80 mm)",
                          "Ekspor data ke Excel dan PDF",
                        ].map((feat, idx) => (
                          <div key={idx} className="py-2.5 text-[12.5px] sm:text-[13px] font-medium text-slate-700 leading-snug">
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-4">
                      <a
                        href="/auth/signup?plan=pro"
                        className="inline-flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0E59F9] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                          Mulai sekarang
                        </span>
                      </a>
                    </div>
                  </div>
                </FadeIn>

                {/* Custom Card */}
                <FadeIn delay={0.2}>
                  <div className="flex flex-col justify-between p-7 sm:p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all h-full">
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">
                        Enterprise
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-[-0.035em] tabular-nums">
                          Hubungi kami
                        </span>
                      </div>

                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {[
                          "Outlet tanpa batas dalam satu jaringan",
                          "Seluruh fitur paket Pro",
                          "Domain sendiri dan white-label",
                          "Integrasi API dan ERP eksternal",
                          "Account manager khusus dan onboarding",
                          "Dukungan prioritas dengan SLA tertulis",
                          "Setup perangkat dan pelatihan staf",
                          "Pengembangan fitur sesuai kebutuhan",
                          "Migrasi data historis dan menu",
                        ].map((feat, idx) => (
                          <div key={idx} className="py-2.5 text-[12.5px] sm:text-[13px] font-medium text-slate-700 leading-snug">
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-4">
                      <a
                        href={CONTACT_WHATSAPP}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0E59F9] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                          Mulai sekarang
                        </span>
                      </a>
                    </div>
                  </div>
                </FadeIn>

              </div>
            </div>
          </div>

        </section>
      </div>

      {/* FAQ EDITORIAL (SPLIT 2-COLUMN LAYOUT) */}
      <FaqEditorial />

      {/* READY TO BEGIN CTA BANNER */}
      <FooterReadyToBegin />

      {/* SUPERFLUID-INSPIRED BRUTALIST BRAND FOOTER */}
      <FooterSuperfluidStyle />

    </div>
  );
}

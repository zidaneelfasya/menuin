"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface BusinessCase {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  imageAlt: string;
  layout: "wide" | "right" | "left";
  hint: string;
}

const BUSINESS_CASES: BusinessCase[] = [
  {
    id: "restaurant",
    number: "01",
    title: "Restoran & Fine Dining",
    category: "Hospitality & Dine-in",
    description:
      "Tamu memesan dan membayar mandiri langsung dari meja via QR tanpa unduh aplikasi. Pesanan sinkron otomatis ke kitchen display system (KDS) dengan estimasi waktu masak transparan dan dukungan split bill.",
    tags: [
      "Smart QR Meja",
      "Kitchen Display (KDS)",
      "Split Bill",
      "Multi-Printer Dapur",
    ],
    image: "/landing/cases/01-restaurant.jpg",
    imageAlt: "Meja restoran fine dining dengan stand QR dan sajian kuliner",
    layout: "wide",
    hint: "Solusi Restoran & QR Meja",
  },
  {
    id: "retail",
    number: "02",
    title: "Toko Ritel & Butik Fashion",
    category: "Retail & Apparel",
    description:
      "Proses kasir kilat dengan pemindaian barcode USB/Bluetooth instan atau scan visual produk langsung tanpa barcode via kamera tablet. Sinkronisasi inventori real-time dan pengingat stok menipis otomatis.",
    tags: [
      "Barcode Scanner USB/BT",
      "AI Visual Scan",
      "Peringatan Stok Menipis",
      "Cetak Label Harga",
    ],
    image: "/landing/cases/02-retail.jpg",
    imageAlt: "Kasir butik ritel modern dengan tablet POS dan scanner barcode",
    layout: "right",
    hint: "Solusi Ritel & Barcode",
  },
  {
    id: "coffeeshop",
    number: "03",
    title: "Kedai Kopi & Artisan Cafe",
    category: "Coffee & Beverage",
    description:
      "Transaksi kasir kilat sub-150ms untuk mengurai antrean panjang jam sibuk. Kustomisasi pesanan fleksibel (level gula, jenis susu nabati, ekstra espresso shot), cetak struk bluetooth, dan audit kas laci per shift.",
    tags: [
      "POS Kasir Sub-150ms",
      "Varian Modifiers",
      "Audit Kas Laci Shift",
      "Thermal Bluetooth",
    ],
    image: "/landing/cases/03-coffeeshop.jpg",
    imageAlt: "Barista menyeduh kopi manual brew di brew bar kafe estetik",
    layout: "left",
    hint: "Solusi Cafe & Kasir Kilat",
  },
  {
    id: "multioutlet",
    number: "04",
    title: "Food Court & Multi-Cabang",
    category: "Enterprise & Multi-Tenant",
    description:
      "Kelola puluhan tenant makanan atau jaringan cabang dari satu akun terpusat. Pantau konsolidasi omzet real-time, mutasi bahan baku antar-outlet, dan kontrol hak akses bertingkat untuk pemilik, manajer, serta kasir.",
    tags: [
      "Multi-Tenant Food Court",
      "Dashboard Terpusat",
      "Mutasi Bahan Baku",
      "Izin Akses Peran",
    ],
    image: "/landing/cases/04-multioutlet.jpg",
    imageAlt: "Food court multi-outlet dua lantai yang luas dan ramai pengunjung",
    layout: "wide",
    hint: "Solusi Multi-Cabang",
  },
];

interface CaseCoverProps {
  imageSrc: string;
  imageAlt: string;
  hintText: string;
}

function CaseCover({ imageSrc, imageAlt, hintText }: CaseCoverProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const quickToX = useRef<((val: number) => void) | null>(null);
  const quickToY = useRef<((val: number) => void) | null>(null);

  useEffect(() => {
    if (!hintRef.current) return;

    gsap.set(hintRef.current, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.6,
      autoAlpha: 0,
    });

    quickToX.current = gsap.quickTo(hintRef.current, "x", {
      duration: 0.6,
      ease: "power3",
    });
    quickToY.current = gsap.quickTo(hintRef.current, "y", {
      duration: 0.6,
      ease: "power3",
    });
  }, []);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !coverRef.current || !hintRef.current) return;
    const rect = coverRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(hintRef.current, { x, y });
    gsap.to(hintRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !coverRef.current) return;
    const rect = coverRef.current.getBoundingClientRect();
    quickToX.current?.(e.clientX - rect.left);
    quickToY.current?.(e.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    if (!hintRef.current) return;
    gsap.to(hintRef.current, {
      autoAlpha: 0,
      scale: 0.6,
      duration: 0.3,
      ease: "power2.in",
      overwrite: "auto",
    });
  };

  return (
    <div
      ref={coverRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="cover-container relative w-full h-full overflow-hidden rounded-[20px] md:rounded-[32px] bg-[#E8E6E3] select-none cursor-pointer group/cover"
      style={{
        clipPath: "inset(12% 8% 12% 8%)",
        WebkitClipPath: "inset(12% 8% 12% 8%)",
      }}
    >
      {/* Parallax Container: 16% taller than parent (-inset-y-[8%]) */}
      <div className="cover-media absolute inset-x-0 -inset-y-[8%] will-change-transform">
        {/* Scale Container: Counter-scale on scroll (1.2 -> 1.0) and CSS hover zoom (scale 1.04) */}
        <div className="cover-zoom absolute inset-0 will-change-transform">
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cover:scale-[1.04]"
          />
        </div>
      </div>

      {/* Gentle tone overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60 pointer-events-none" />

      {/* Cursor Follower Badge (Desktop only) */}
      <span
        ref={hintRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-20 hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-tight text-[#111] bg-white/95 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-white/70 whitespace-nowrap"
      >
        <svg className="w-2.5 h-2.5 shrink-0 text-[#0E59F9]" viewBox="0 0 10 10">
          <path
            d="M5 0v10M0 5h10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <span>{hintText}</span>
      </span>

      {/* Static Pill Badge (Mobile only) */}
      <div className="md:hidden absolute bottom-3.5 left-3.5 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#111] bg-white/90 backdrop-blur-md shadow-md border border-white/60">
        <svg className="w-2.5 h-2.5 shrink-0 text-[#0E59F9]" viewBox="0 0 10 10">
          <path
            d="M5 0v10M0 5h10"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <span>{hintText}</span>
      </div>
    </div>
  );
}

export default function BusinessCasesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const isReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const cards = gsap.utils.toArray<HTMLElement>(".business-case-card");

      cards.forEach((card) => {
        const cover = card.querySelector<HTMLElement>(".cover-container");
        const media = card.querySelector<HTMLElement>(".cover-media");
        const zoom = card.querySelector<HTMLElement>(".cover-zoom");

        if (!cover || !media) return;

        if (isReduced) {
          gsap.set(cover, { clipPath: "inset(0% 0% 0% 0%)" });
          gsap.set(media, { yPercent: 0 });
          if (zoom) gsap.set(zoom, { scale: 1 });
          return;
        }

        // 1. ClipPath Reveal Animation: Inset 12% 8% -> Inset 0%
        gsap.fromTo(
          cover,
          { clipPath: "inset(12% 8% 12% 8%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "power1.out",
            scrollTrigger: {
              trigger: cover,
              start: "top bottom",
              end: "top 35%",
              scrub: true,
            },
          },
        );

        // 2. Counter-Scale: Scale 1.2 -> 1.0 (aperture zoom effect)
        if (zoom) {
          gsap.fromTo(
            zoom,
            { scale: 1.2 },
            {
              scale: 1.0,
              ease: "power1.out",
              scrollTrigger: {
                trigger: cover,
                start: "top bottom",
                end: "top 35%",
                scrub: true,
              },
            },
          );
        }

        // 3. Parallax Vertical Drift: -6% -> +6%
        gsap.fromTo(
          media,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: cover,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="solusi-bisnis"
      className="relative w-full bg-[#FAFAFA] py-24 md:py-36 px-6 md:px-12 lg:px-16 overflow-hidden"
    >
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header: Exovio style meta & rule */}
        <div className="flex items-center justify-between text-xs md:text-sm tracking-tight text-[#666] font-mono">
          <div className="flex items-center gap-2">
            <svg
              className="w-2.5 h-2.5 text-[#0E59F9]"
              viewBox="0 0 10 10"
              aria-hidden="true"
            >
              <path
                d="M5 0v10M0 5h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span>(Solusi Bisnis & Industri)</span>
          </div>
          <span className="font-mono text-[#888]">(04 Solusi Utama)</span>
        </div>

        <div className="h-px w-full bg-[#111]/12 mt-4 mb-10 md:mb-16" />

        {/* Big Editorial Headline */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 md:mb-28">
          <div>
            <h2 className="text-[clamp(32px,5.2vw,68px)] font-normal tracking-[-0.04em] text-[#111] leading-[1.02]">
              Satu Ekosistem. <br />
              <span className="text-[#0E59F9]">Segala Karakter</span> Bisnis.
            </h2>
          </div>
          <p className="max-w-lg text-sm md:text-base text-[#666] leading-relaxed">
            Dari kedai kopi single-origin hingga jaringan restoran multi-cabang
            dengan puluhan tenant kuliner. Menuin dirancang fleksibel untuk
            mengikuti ritme operasional Anda.
          </p>
        </div>

        {/* Asymmetric Editorial Grid Cards */}
        <div className="flex flex-col gap-24 md:gap-40 lg:gap-48">
          {BUSINESS_CASES.map((item) => {
            if (item.layout === "wide") {
              return (
                <div
                  key={item.id}
                  className="business-case-card group flex flex-col"
                >
                  {/* Meta Top: 12-Column Subgrid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3 md:gap-x-6 items-baseline mb-4 md:mb-6">
                    <span className="col-span-1 md:col-span-1 text-sm font-mono text-[#888]">
                      ({item.number})
                    </span>

                    <div className="col-span-1 md:col-span-6">
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-normal tracking-tight text-[#111] leading-none">
                        <span className="inline-flex flex-col overflow-hidden h-[1.18em] leading-[1.18] align-top select-none">
                          <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform">
                            {item.title}
                          </span>
                          <span
                            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform text-[#0E59F9] font-medium"
                            aria-hidden="true"
                          >
                            {item.title}
                          </span>
                        </span>
                      </h3>
                      <p className="mt-2.5 text-sm md:text-base text-[#666] leading-relaxed max-w-xl">
                        {item.description}
                      </p>
                    </div>

                    <div className="col-span-1 md:col-span-5 flex flex-wrap md:justify-end gap-2 text-xs md:text-sm text-[#777]">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs text-[#555] border border-slate-200/60"
                        >
                          ({tag})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Media Panoramic (Aspect 2:1 on desktop, 4:3 on mobile) */}
                  <div className="w-full aspect-[4/3] md:aspect-[2/1]">
                    <CaseCover
                      imageSrc={item.image}
                      imageAlt={item.imageAlt}
                      hintText={item.hint}
                    />
                  </div>
                </div>
              );
            }

            if (item.layout === "right") {
              return (
                <div
                  key={item.id}
                  className="business-case-card group grid grid-cols-1 md:grid-cols-12 gap-y-8 md:gap-x-8 items-end"
                >
                  {/* Meta on Left (Cols 1-5, aligned bottom) */}
                  <div className="col-span-1 md:col-span-5 lg:col-span-5 md:pb-6">
                    <span className="text-sm font-mono text-[#888] block mb-2">
                      ({item.number})
                    </span>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-normal tracking-tight text-[#111] leading-none">
                      <span className="inline-flex flex-col overflow-hidden h-[1.18em] leading-[1.18] align-top select-none">
                        <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform">
                          {item.title}
                        </span>
                        <span
                          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform text-[#0E59F9] font-medium"
                          aria-hidden="true"
                        >
                          {item.title}
                        </span>
                      </span>
                    </h3>
                    <p className="mt-3 text-sm md:text-base text-[#666] leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2 text-xs md:text-sm text-[#777]">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs text-[#555] border border-slate-200/60"
                        >
                          ({tag})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Media on Right (Cols 7-12, Aspect 4:5 portrait) */}
                  <div className="col-span-1 md:col-start-7 md:col-span-6 aspect-[4/5] w-full">
                    <CaseCover
                      imageSrc={item.image}
                      imageAlt={item.imageAlt}
                      hintText={item.hint}
                    />
                  </div>
                </div>
              );
            }

            // item.layout === "left"
            return (
              <div
                key={item.id}
                className="business-case-card group grid grid-cols-1 md:grid-cols-12 gap-y-8 md:gap-x-8 items-end"
              >
                {/* Media on Left (Cols 1-6, Aspect 4:5 portrait) */}
                <div className="order-2 md:order-1 col-span-1 md:col-span-6 aspect-[4/5] w-full">
                  <CaseCover
                    imageSrc={item.image}
                    imageAlt={item.imageAlt}
                    hintText={item.hint}
                  />
                </div>

                {/* Meta on Right (Cols 8-12, aligned bottom) */}
                <div className="order-1 md:order-2 col-span-1 md:col-start-8 md:col-span-5 md:pb-6">
                  <span className="text-sm font-mono text-[#888] block mb-2">
                    ({item.number})
                  </span>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-normal tracking-tight text-[#111] leading-none">
                    <span className="inline-flex flex-col overflow-hidden h-[1.18em] leading-[1.18] align-top select-none">
                      <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform">
                        {item.title}
                      </span>
                      <span
                        className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full will-change-transform text-[#0E59F9] font-medium"
                        aria-hidden="true"
                      >
                        {item.title}
                      </span>
                    </span>
                  </h3>
                  <p className="mt-3 text-sm md:text-base text-[#666] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs md:text-sm text-[#777]">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs text-[#555] border border-slate-200/60"
                      >
                        ({tag})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation CTA */}
        <div className="mt-24 md:mt-36 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-[#111]/10">
          <p className="text-sm text-[#666]">
            Punya kebutuhan operasional khusus untuk bisnis Anda?
          </p>
          <Link
            href="/fitur"
            className="group inline-flex items-center gap-2 rounded-full bg-[#111] px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#0E59F9] hover:shadow-lg hover:shadow-[#0E59F9]/20"
          >
            <span>Bandingkan seluruh fitur sesuai skala bisnis Anda</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

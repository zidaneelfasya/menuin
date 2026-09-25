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
import SpecBento from "@/components/landing/spec-bento";
import { HeroIntro } from "@/components/landing/scroll-reveal";
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

// Hanya mitra pembayaran & teknologi yang benar-benar terintegrasi.
// Logo lembaga pemerintah sengaja tidak ditampilkan di sini — lihat
// docs/landing-revamp/IMPLEMENTATION-PLAN.md §8 R1.
// Semua di-host lokal; tidak ada lagi hotlink ke Wikimedia.
// `midtrans-ink.svg` adalah salinan wordmark Midtrans yang fill putihnya
// ditukar ke abu tinta — berkas aslinya dibuat untuk latar gelap.
// Tinggi dipakai untuk menyamakan bobot optis, bukan tinggi kotaknya.
const logos = [
  { name: "Midtrans", src: "/img/brand_logo/midtrans-ink.svg", h: 18 },
  { name: "QRIS", src: "/img/brand_logo/qris.svg", h: 22 },
  { name: "BCA", src: "/img/brand_logo/bca.svg", h: 20 },
  { name: "Bank Mandiri", src: "/img/brand_logo/mandiri.svg", h: 18 },
  { name: "BNI", src: "/img/brand_logo/bni.svg", h: 22 },
];

/**
 * Visual hero: foto kasir Menuin dipakai di gerai sungguhan.
 * Screenshot lama di public/img/hero/*.png tidak dipakai karena masih
 * memperlihatkan tenant kosong ("Tidak ada data" / "Rp 0").
 */
function HeroPhoto() {
  return (
    <figure className="relative mx-auto w-full max-w-[1280px]">
      <div className="overflow-hidden rounded-[24px] bg-[#f4f4f5] shadow-[var(--landing-lift-lg)]">
        <Image
          src="/img/landing/hero-kasir.webp"
          alt="Kasir sebuah coffee shop memproses pesanan lewat Menuin di tablet"
          width={1357}
          height={1024}
          priority
          sizes="(max-width: 1100px) 100vw, 1100px"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Kartu status pesanan — sisi tamu dari transaksi yang sama */}
      <div className="absolute -bottom-6 left-4 hidden w-[220px] rounded-2xl border border-black/[0.06] bg-white/95 p-4 shadow-[var(--landing-lift-lg)] backdrop-blur md:block lg:-left-6 lg:w-[248px]">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-[#71717a]">Meja 12</span>
          <span className="font-display text-[11px] tabular-nums text-[#71717a]">02:14</span>
        </div>
        <p className="mt-1 text-[14px] font-semibold leading-snug text-[#0a0a0a]">
          Sedang disiapkan barista
        </p>
        <ol className="mt-3 flex items-center gap-1.5">
          {[true, true, false, false].map((done, i) => (
            <li
              key={i}
              className={`h-1 flex-1 rounded-full ${done ? "bg-[#0E59F9]" : "bg-slate-200"}`}
            />
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-[#71717a]">Diterima · Disiapkan · Siap · Selesai</p>
      </div>
    </figure>
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
      <section className="relative px-6 pt-32 md:pt-40">
        <HeroIntro>
        <div className="mx-auto max-w-[1280px]">
          <div data-hero-item>
            <p className="text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Ekosistem operasional F&amp;B
            </p>
          </div>

          <div data-hero-item>
            <h1 className="mx-auto mt-6 max-w-[20ch] text-center font-display text-[clamp(34px,6.2vw,76px)] font-semibold leading-[1.03] tracking-[-0.04em] text-[#0a0a0a] text-balance">
              Satu sentuhan di meja.
              <span className="block">Kasir bergerak kilat.</span>
              <span className="block">Dapur tepat waktu.</span>
            </h1>
          </div>

          <div data-hero-item>
            <p className="mx-auto mt-7 max-w-[62ch] text-center text-[16px] leading-relaxed text-[#52525b] md:text-[17px]">
              Menuin menyatukan pemesanan mandiri lewat QR di meja, kasir cloud untuk jam sibuk, dan
              layar dapur tanpa kertas — dalam satu sistem yang sama.
            </p>
          </div>

          <div data-hero-item>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={isLoggedIn ? "/select-tenant" : "/auth/signup"}
                onClick={(e) => {
                  if (isLoggedIn) {
                    e.preventDefault();
                    navigateWithTransition("/select-tenant");
                  }
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0E59F9] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#0C4CD6] sm:w-auto"
              >
                {isLoggedIn ? "Buka dashboard" : "Mulai uji coba 14 hari"}
              </a>
              <a
                href="#alur"
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-black/[0.08] px-6 text-[15px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#fafafa] sm:w-auto"
              >
                Lihat cara kerjanya
                <ArrowRight className="h-4 w-4 text-[#71717a]" />
              </a>
            </div>
          </div>

          <div data-hero-item>
            <p className="mt-5 text-center text-[13px] text-[#71717a]">
              Tanpa kartu kredit · Setup 5 menit · Printer Bluetooth &amp; LAN
            </p>
          </div>

          <div data-hero-item>
            <div className="mt-14 md:mt-16">
              <HeroPhoto />
            </div>
          </div>
        </div>
        </HeroIntro>
      </section>

      {/* MITRA PEMBAYARAN */}
      <section className="border-y border-black/[0.06] bg-[#fafafa] px-6 py-8" aria-label="Mitra pembayaran">
        <div className="mx-auto max-w-[1280px] text-center">
          <p className="text-[12px] uppercase tracking-[0.14em] text-[#a1a1aa]">
            Pembayaran diproses lewat penyelenggara berizin
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {logos.map((logo) => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                loading="lazy"
                style={{ height: logo.h }}
                className="w-auto opacity-55 grayscale transition-opacity hover:opacity-100"
              />
            ))}
          </div>
        </div>
      </section>

      {/* TENTANG — siapa Menuin dan untuk siapa, dengan angka kunci */}
      <AboutSection />

      {/* ALUR PESANAN — dari scan QR sampai transaksi tercatat */}
      <OrderJourney />

      <ComparisonScroll />

      {/* FITUR UNGGULAN */}
      <FeatureShowcase />

      <SpecBento />

      {/* WRAPPER FOR PRICING */}
      <div className="relative overflow-hidden bg-[#FAFAFA]">

        {/* BACKGROUND DIVIDER SVG */}
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-[1922px] pointer-events-none z-20 flex justify-center">
          <img src="/divider/divider.svg" alt="Divider Background" className="w-full h-auto" />
        </div>
        {/* PRICING (Side-by-Side Editorial Layout inside wrapper with SVG Background) */}
        <section className="relative z-30 pt-36 md:pt-52 pb-28 md:pb-36 px-6 sm:px-10 lg:px-14" id="pricing">
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
                          "Hak akses Owner, Manajer, Kasir, dan Staf",
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

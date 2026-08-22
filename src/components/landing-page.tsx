"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, ChevronDown, ArrowRight } from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
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

const faqs = [
  { q: "Apa itu MENUIN?", a: "MENUIN adalah platform SaaS untuk bisnis F&B \u2014 mengelola menu digital, pesanan, pembayaran, kasir POS, dan data bisnis dalam satu sistem." },
  { q: "Apakah pelanggan harus install aplikasi?", a: "Tidak. Pelanggan mengakses katalog bisnis Anda langsung dari browser melalui link MENUIN." },
  { q: "Apakah MENUIN punya POS?", a: "Ya. Sistem POS terintegrasi untuk mengelola transaksi dine-in, take-away, dan pesanan online dalam satu dashboard." },
  { q: "Cocok untuk bisnis kecil?", a: "Ya. MENUIN dirancang untuk bisnis F&B dari warung kopi hingga restoran multi-cabang." },
  { q: "Bisa untuk banyak user?", a: "Ya. Setiap bisnis dapat memiliki beberapa user sesuai paket yang dipilih." },
];

const steps = [
  { num: "01", title: "Buat bisnis Anda", desc: "Daftarkan nama bisnis dan atur profil dalam hitungan menit." },
  { num: "02", title: "Tambahkan menu", desc: "Masukkan produk, harga, kategori, dan foto." },
  { num: "03", title: "Bagikan link", desc: "Pelanggan langsung bisa lihat katalog dari HP mereka." },
  { num: "04", title: "Kelola pesanan", desc: "Pesanan masuk, diproses, dan tercatat otomatis." },
];

const features = [
  { tag: "01 \u2014 Digital Menu", title: "Buat katalog digital yang mudah dibagikan.", desc: "Setiap bisnis memiliki link katalog sendiri. Pelanggan melihat menu langsung dari meja mereka.", mockupLabel: "menuin.id/kopikami", mockupSub: "12 Kategori \u00b7 45 Menu" },
  { tag: "02 \u2014 Online Ordering", title: "Terima pesanan langsung dari pelanggan.", desc: "Pelanggan memilih menu, checkout mandiri, dan membayar melalui gateway yang terintegrasi.", mockupLabel: "Keranjang Belanja", mockupSub: "2 Items \u00b7 Total Rp 64.000", badge: "Siap Checkout" },
  { tag: "03 \u2014 POS", title: "Pesanan online dan kasir dalam satu sistem.", desc: "Kelola pesanan dine-in maupun take-away langsung dari dashboard kasir.", mockupLabel: "Tampilan Kasir POS", mockupSub: "Meja 04 \u00b7 Menunggu Pembayaran", badge: "Proses Kasir" },
  { tag: "04 \u2014 Dashboard", title: "Pahami bisnis Anda melalui data.", desc: "Pantau revenue, pesanan, produk terlaris, dan kinerja tim dari satu halaman.", mockupLabel: "Laporan Bulanan", mockupSub: "Revenue Naik +18.2%", badge: "Analytics" },
];

const featureIcons = ["\uD83C\uDF7D\uFE0F", "\uD83D\uDED2", "\uD83D\uDCBB", "\uD83D\uDCC8"];

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-[1200px] h-16 flex items-center justify-between px-6">
          <a href="/" className="flex items-center">
            <Image src="/logo-nemuin.jpeg" alt="Menuin" width={110} height={32} priority />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#666]">
            <a href="#product" className="hover:text-[#111] transition-colors">Product</a>
            <a href="#pricing" className="hover:text-[#111] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#111] transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <a href="/pos" className="h-10 px-5 flex items-center rounded-full bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors">
                Dashboard
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-[13px] font-medium text-[#666] hover:text-[#111] transition-colors">Login</a>
                <a href="/auth/signup" className="h-10 px-5 flex items-center rounded-full bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1D4ED8] transition-colors">
                  Mulai Gratis
                </a>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-colors"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {mobileOpen ? (
                <path d="M5 5L15 15M15 5L5 15" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 6H17" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 10H17" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3 14H17" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#E5E5E5] bg-white px-6 py-6 space-y-4">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-[#666]">
              <a href="#product" onClick={() => setMobileOpen(false)}>Product</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
              <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
            </nav>
            <div className="h-px bg-[#E5E5E5]" />
            {isLoggedIn ? (
              <a href="/pos" className="flex items-center justify-center h-11 rounded-full bg-[#111] text-white text-[14px] font-semibold">Dashboard</a>
            ) : (
              <>
                <a href="/auth/login" className="flex items-center justify-center h-11 rounded-full border border-[#E5E5E5] text-[14px] font-medium text-[#666]">Login</a>
                <a href="/auth/signup" className="flex items-center justify-center h-11 rounded-full bg-[#2563EB] text-white text-[14px] font-semibold">Mulai Gratis</a>
              </>
            )}
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#2563EB] mb-6">
              Platform F&amp;B Modern
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[clamp(40px,7vw,80px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-[#111] max-w-[800px]">
              Kelola bisnis F&amp;B.
              <br />
              <span className="text-[#2563EB]">Lebih sederhana.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-8 text-[17px] text-[#666] leading-relaxed max-w-[480px]">
              Menu digital, pesanan, pembayaran, dan kasir &#8212; semuanya dalam satu platform untuk bisnis kuliner modern.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={isLoggedIn ? "/pos" : "/auth/signup"}
                className="h-12 px-7 flex items-center rounded-full bg-[#2563EB] text-white text-[15px] font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                {isLoggedIn ? "Buka Dashboard" : "Mulai Gratis"}
              </a>
              <a
                href="#product"
                className="h-12 px-7 flex items-center rounded-full border border-[#E5E5E5] text-[15px] font-semibold text-[#111] hover:bg-[#F9F9F9] transition-colors gap-2"
              >
                Pelajari Selengkapnya
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4} className="mt-20 md:mt-28">
            <div className="relative rounded-2xl overflow-hidden border border-[#E5E5E5]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#FAFAFA] border-b border-[#E5E5E5]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <div className="mx-auto flex items-center h-6 px-4 rounded-md bg-white border border-[#E5E5E5] text-[11px] text-[#999] font-mono">
                  dashboard.menuin.id
                </div>
                <div className="w-14" />
              </div>

              <div className="bg-[#F8F9FA] p-6 md:p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Revenue", value: "Rp 8.4M", sub: "+12.4%", accent: true },
                    { label: "Orders", value: "142", sub: "Hari ini", accent: false },
                    { label: "Active", value: "8", sub: "Diproses", accent: true },
                    { label: "Avg Bill", value: "Rp 53K", sub: "Stabil", accent: false },
                  ].map((m, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-[#E5E5E5]">
                      <div className="text-[11px] text-[#999] font-medium mb-1">{m.label}</div>
                      <div className="text-[18px] font-bold text-[#111]">{m.value}</div>
                      <div className={`text-[11px] mt-1 font-medium ${m.accent ? "text-[#2563EB]" : "text-[#999]"}`}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-white rounded-xl p-5 border border-[#E5E5E5]">
                    <div className="text-[12px] font-bold text-[#111] mb-4">Penjualan Mingguan</div>
                    <div className="h-32 flex items-end gap-2">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end h-full">
                          <div
                            className={`rounded-t-sm ${i === 5 ? "bg-[#2563EB]" : "bg-[#E5E5E5]"}`}
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-[#999] mt-3 font-mono">
                      <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-[#E5E5E5]">
                    <div className="text-[12px] font-bold text-[#111] mb-3">Menu Terlaris</div>
                    <div className="space-y-3">
                      {[
                        { name: "Kopi Susu Aren", qty: "48" },
                        { name: "Nasi Goreng", qty: "32" },
                        { name: "Croissant", qty: "28" },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[12px]">
                          <span className="text-[#333] font-medium">{item.name}</span>
                          <span className="text-[#999]">{item.qty} pcs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-y border-[#E5E5E5] py-6 overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 text-[13px] font-semibold text-[#BBB] select-none tracking-wide uppercase">
            <span>Restaurant</span>
            <span>Coffee Shop</span>
            <span>Bakery</span>
            <span>Cloud Kitchen</span>
            <span>Food Business</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 md:py-36 px-6" id="product">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <div className="max-w-[700px]">
              <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#2563EB] mb-6">Masalah</p>
              <h2 className="text-[clamp(30px,4.5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#111]">
                Operasional F&amp;B tidak harus serumit itu.
              </h2>
              <p className="mt-6 text-[17px] text-[#666] leading-relaxed max-w-[520px]">
                Menu terpisah. Pesanan dari berbagai tempat. Kasir bekerja sendiri. Data penjualan sulit dipantau.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: "01", label: "Menu Cetak / PDF" },
                { num: "02", label: "Order manual WA" },
                { num: "03", label: "Kasir / POS offline" },
                { num: "04", label: "Rekap excel manual" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border-2 border-dashed border-[#E5E5E5] text-center">
                  <div className="text-[11px] font-bold text-[#BBB] uppercase tracking-widest mb-2">{item.num}</div>
                  <div className="text-[14px] font-bold text-[#111]">{item.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="mt-14 flex flex-col items-center text-center">
              <span className="text-[12px] font-bold text-[#999] uppercase tracking-widest">Terpecah &amp; tidak sinkron</span>
              <div className="h-8 w-px bg-[#DDD] my-3" />
              <div className="inline-flex items-center h-11 px-6 rounded-full bg-[#2563EB] text-white text-[14px] font-semibold">
                MENUIN menyatukannya.
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SOLUTION FLOW */}
      <section className="py-24 md:py-36 bg-[#FAFAFA] border-y border-[#E5E5E5]">
        <div className="mx-auto max-w-[1200px] px-6">
          <FadeIn>
            <div className="text-center max-w-[600px] mx-auto mb-16">
              <p className="text-[13px] font-semibold tracking-[0.08em] uppercase text-[#2563EB] mb-6">Solusi</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#111]">
                Satu platform untuk seluruh alur bisnis Anda.
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2 max-w-[900px] mx-auto">
              {[
                { icon: "Menu", label: "MENU", sub: "Katalog Digital QR" },
                { icon: "Cart", label: "ORDER", sub: "Pesanan Langsung" },
                { icon: "Pay", label: "PAYMENT", sub: "E-Wallet &amp; QRIS" },
                { icon: "POS", label: "POS", sub: "Sistem Kasir Utama" },
                { icon: "Chart", label: "DASHBOARD", sub: "Laporan Real-Time", active: true },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center text-center w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[13px] font-bold mb-3 ${step.active ? "bg-[#2563EB] text-white" : "bg-white border border-[#E5E5E5] text-[#2563EB]"}`}>
                      {step.icon === "Menu" && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>}
                      {step.icon === "Cart" && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.34-1.872l1.836-8.028A1.125 1.125 0 0018.054 3H5.106" /></svg>}
                      {step.icon === "Pay" && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>}
                      {step.icon === "POS" && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.41A2.25 2.25 0 012.25 5.494V5.25" /></svg>}
                      {step.icon === "Chart" && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
                    </div>
                    <div className={`text-[12px] font-bold tracking-wide ${step.active ? "text-[#2563EB]" : "text-[#111]"}`}>{step.label}</div>
                    <div className="text-[11px] text-[#999] mt-0.5">{step.sub}</div>
                  </div>
                  {i < 4 && (
                    <div className="hidden md:block h-px flex-1 bg-[#E5E5E5] min-w-[20px]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 md:py-36 px-6">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <div className="text-center max-w-[600px] mx-auto mb-16">
              <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#111]">
                Yang Anda butuhkan untuk menjalankan F&amp;B.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-8 rounded-2xl border border-[#E5E5E5] hover:border-[#2563EB]/30 transition-colors group">
                  <div className="text-[12px] font-bold text-[#2563EB] tracking-wider mb-3">{f.tag}</div>
                  <h3 className="text-[18px] font-bold text-[#111] mb-3 leading-snug">{f.title}</h3>
                  <p className="text-[14px] text-[#666] leading-relaxed mb-6">{f.desc}</p>
                  <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[16px]">
                        {featureIcons[i]}
                      </div>
                      <div>
                        <div className="text-[12px] font-bold text-[#111]">{f.mockupLabel}</div>
                        <div className="text-[10px] text-[#999]">{f.mockupSub}</div>
                      </div>
                    </div>
                    {f.badge && (
                      <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2.5 py-1 rounded-full font-bold">{f.badge}</span>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-36 bg-[#FAFAFA] border-y border-[#E5E5E5]" id="how-it-works">
        <div className="mx-auto max-w-[1200px] px-6">
          <FadeIn>
            <div className="text-center max-w-[600px] mx-auto mb-16">
              <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#111]">
                Mulai dalam beberapa langkah.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[900px] mx-auto">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl border border-[#E5E5E5] bg-white">
                  <div className="text-[36px] font-extrabold text-[#E5E5E5] mb-3 tracking-tight">{step.num}</div>
                  <h4 className="text-[15px] font-bold text-[#111] mb-2">{step.title}</h4>
                  <p className="text-[13px] text-[#666] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 md:py-36 px-6" id="pricing">
        <div className="mx-auto max-w-[1200px] px-6">
          <FadeIn>
            <div className="text-center max-w-[600px] mx-auto mb-16">
              <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#111]">
                Pilih paket yang sesuai.
              </h2>
              <p className="mt-4 text-[16px] text-[#666]">Mulai sederhana. Tingkatkan saat bisnis berkembang.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto items-stretch">
            <FadeIn delay={0}>
              <div className="p-8 rounded-2xl border border-[#E5E5E5] flex flex-col justify-between h-full">
                <div>
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#999] mb-3">Starter</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[32px] font-extrabold text-[#111]">Rp99K</span>
                    <span className="text-[13px] text-[#999]">/ bulan</span>
                  </div>
                  <p className="text-[13px] text-[#666] mb-6">Untuk bisnis kecil yang baru mulai digital.</p>
                  <div className="h-px bg-[#E5E5E5] mb-6" />
                  <ul className="space-y-3 text-[13px] text-[#666] mb-8">
                    {["Digital Menu", "Custom Catalog Link", "Online Ordering", "Basic Dashboard", "1 User"].map((item, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href={isLoggedIn ? "/checkout?plan=starter" : "/auth/signup?plan=starter"} className="block text-center py-3 rounded-xl border border-[#E5E5E5] text-[13px] font-bold text-[#111] hover:bg-[#F9F9F9] transition-colors">
                  {isLoggedIn ? "Pilih Starter" : "Mulai Sekarang"}
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="p-8 rounded-2xl border-2 border-[#2563EB] flex flex-col justify-between h-full relative shadow-lg">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Populer
                </span>
                <div>
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#2563EB] mb-3 mt-1">Business</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[32px] font-extrabold text-[#111]">Rp199K</span>
                    <span className="text-[13px] text-[#999]">/ bulan</span>
                  </div>
                  <p className="text-[13px] text-[#666] mb-6">Untuk bisnis F&amp;B yang butuh operasional lebih lengkap.</p>
                  <div className="h-px bg-[#E5E5E5] mb-6" />
                  <ul className="space-y-3 text-[13px] text-[#666] mb-8">
                    {["Semua fitur Starter", "Sistem POS / Kasir", "Payment Integration", "Order Management", "Advanced Dashboard", "Multiple Users"].map((item, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <span className={j === 0 ? "font-medium text-[#111]" : ""}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href={isLoggedIn ? "/checkout?plan=business" : "/auth/signup?plan=business"} className="block text-center py-3 rounded-xl bg-[#2563EB] text-[13px] font-bold text-white hover:bg-[#1D4ED8] transition-colors">
                  {isLoggedIn ? "Pilih Business" : "Mulai Sekarang"}
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="p-8 rounded-2xl border border-[#E5E5E5] flex flex-col justify-between h-full">
                <div>
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#999] mb-3">Enterprise</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[32px] font-extrabold text-[#111]">Custom</span>
                  </div>
                  <p className="text-[13px] text-[#666] mb-6">Untuk bisnis dengan kebutuhan dan skala yang lebih besar.</p>
                  <div className="h-px bg-[#E5E5E5] mb-6" />
                  <ul className="space-y-3 text-[13px] text-[#666] mb-8">
                    {["Semua fitur Business", "Multi-Cabang", "Advanced User Management", "Custom Integration (API)", "Priority Support"].map((item, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                        <span className={j === 0 ? "font-medium text-[#111]" : ""}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="mailto:hello@menuin.id?subject=Enterprise%20Inquiry" className="block text-center py-3 rounded-xl border border-[#E5E5E5] text-[13px] font-bold text-[#111] hover:bg-[#F9F9F9] transition-colors">
                  Hubungi Kami
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-36 bg-[#FAFAFA] border-t border-[#E5E5E5]" id="faq">
        <div className="mx-auto max-w-[700px] px-6">
          <FadeIn>
            <h2 className="text-[clamp(28px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#111] text-center mb-14">
              Pertanyaan umum.
            </h2>
          </FadeIn>
          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="border-b border-[#E5E5E5]">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="flex w-full items-center justify-between py-5 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[#111] pr-4">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#999] shrink-0 transition-transform duration-300 ${activeFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${activeFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                    <p className="text-[14px] text-[#666] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-36 px-6">
        <div className="mx-auto max-w-[600px] text-center">
          <FadeIn>
            <h2 className="text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#111] mb-6">
              Saatnya bisnis F&amp;B Anda lebih sederhana.
            </h2>
            <p className="text-[16px] text-[#666] mb-8 max-w-[400px] mx-auto">
              Kelola menu, pesanan, kasir, dan data dalam satu platform.
            </p>
            <div className="flex flex-col items-center gap-3">
              <a
                href={isLoggedIn ? "/pos" : "/auth/signup"}
                className="h-12 px-8 flex items-center rounded-full bg-[#2563EB] text-white text-[15px] font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                {isLoggedIn ? "Buka Dashboard" : "Mulai Gratis"}
              </a>
              {!isLoggedIn && <span className="text-[12px] text-[#999]">Tanpa kartu kredit.</span>}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E5E5] py-10 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Image src="/logo-nemuin.jpeg" alt="Menuin" width={90} height={26} />
            <span className="text-[12px] text-[#999]">Simple tools for modern F&amp;B.</span>
          </div>
          <div className="flex flex-wrap gap-6 text-[13px] font-medium text-[#999]">
            <a href="#product" className="hover:text-[#111] transition-colors">Product</a>
            <a href="#pricing" className="hover:text-[#111] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#111] transition-colors">FAQ</a>
            {isLoggedIn ? (
              <a href="/pos" className="hover:text-[#111] transition-colors">Dashboard</a>
            ) : (
              <a href="/auth/login" className="hover:text-[#111] transition-colors">Login</a>
            )}
          </div>
          <span className="text-[12px] text-[#CCC]">&copy; 2026 MENUIN</span>
        </div>
      </footer>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  ChevronDown, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Smartphone, 
  ShoppingCart, 
  Monitor, 
  BarChart3, 
  Plus, 
  Clock, 
  DollarSign, 
  Coffee, 
  UtensilsCrossed, 
  TrendingUp, 
  ArrowUpRight 
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [revenueTimeframe, setRevenueTimeframe] = useState<"day" | "week" | "month">("day");
  
  // Animation triggers on load
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const steps = [
    { number: "01", title: "Buat bisnis Anda", desc: "Daftarkan bisnis dan mulai setup." },
    { number: "02", title: "Tambahkan menu", desc: "Masukkan produk, harga, kategori, dan foto." },
    { number: "03", title: "Bagikan link", desc: "Bagikan katalog MENUIN kepada pelanggan." },
    { number: "04", title: "Terima pesanan", desc: "Pesanan masuk dan dapat dikelola melalui sistem MENUIN." }
  ];

  const faqs = [
    {
      q: "Apa itu MENUIN?",
      a: "MENUIN adalah platform SaaS untuk membantu bisnis F&B mengelola menu, pesanan, pembayaran, kasir, dan data bisnis dalam satu sistem."
    },
    {
      q: "Apakah pelanggan harus menginstall aplikasi?",
      a: "Tidak. Pelanggan dapat mengakses katalog bisnis melalui link MENUIN."
    },
    {
      q: "Apakah MENUIN memiliki POS?",
      a: "Ya. MENUIN menyediakan sistem POS untuk membantu kasir mengelola transaksi dan pesanan."
    },
    {
      q: "Apakah MENUIN cocok untuk bisnis kecil?",
      a: "Ya. MENUIN dirancang untuk bisnis F&B mulai dari bisnis kecil hingga bisnis dengan kebutuhan operasional yang lebih kompleks."
    },
    {
      q: "Apakah bisa digunakan oleh banyak user?",
      a: "Ya. Setiap bisnis dapat memiliki beberapa user sesuai dengan paket dan kebutuhan mereka."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F172A] selection:bg-[#EFF6FF] selection:text-[#2563EB] font-sans antialiased overflow-x-hidden">
      
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <a href="#" className="flex items-center group">
            <img src="/logo/logo.jpeg" alt="MENUIN Logo" className="h-14 w-auto rounded-md transition-transform duration-300 group-hover:scale-105" />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#product" className="transition-colors hover:text-[#2563EB]">Product</a>
            <a href="#pricing" className="transition-colors hover:text-[#2563EB]">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-[#2563EB]">FAQ</a>
          </nav>

          {/* Right Side CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/auth/login" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#2563EB]">Login</a>
            <a 
              href="/auth/signup" 
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563EB] px-5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-md hover:shadow-blue-500/10 active:scale-95"
            >
              Mulai Sekarang
            </a>
          </div>

          {/* Hamburger Mobile Menu */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex p-1.5 text-[#0F172A] transition-colors hover:bg-slate-50 rounded-lg md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col gap-4 text-base font-medium text-[#64748B]">
              <a href="#product" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2563EB]">Product</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2563EB]">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2563EB]">FAQ</a>
            </nav>
            <div className="h-px bg-[#E2E8F0] my-4" />
            <div className="flex flex-col gap-3">
              <a href="/auth/login" className="flex items-center justify-center h-10 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-slate-50">
                Login
              </a>
              <a href="/auth/signup" className="flex items-center justify-center h-10 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1D4ED8]">
                Mulai Sekarang
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pb-24 lg:pt-20 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className={`lg:col-span-6 space-y-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3.5 py-1 text-xs font-semibold tracking-wide text-[#2563EB]">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>All-in-One F&B Solution</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl leading-[1.1]">
                Kelola bisnis F&B.<br />
                <span className="text-[#2563EB]">Lebih sederhana.</span>
              </h1>
              <p className="max-w-md text-lg text-[#64748B] leading-relaxed">
                MENUIN menyatukan menu digital, pesanan, pembayaran, dan kasir dalam satu platform untuk bisnis F&B modern.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/auth/signup" 
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-[#2563EB] px-7 text-base font-semibold text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/15 active:scale-95"
                >
                  Mulai Gratis
                </a>
                <a 
                  href="#how-it-works" 
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-[#E2E8F0] px-7 text-base font-semibold text-[#0F172A] transition-all hover:bg-slate-50"
                >
                  Lihat Cara Kerja
                </a>
              </div>

              <div className="text-xs text-[#64748B]">
                Tanpa instalasi. Siap digunakan kapan saja.
              </div>
            </div>

            {/* Right Product UI Mockup */}
            <div className={`lg:col-span-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
              <div className="relative mx-auto max-w-xl lg:max-w-none rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-2xl shadow-slate-200/60">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="h-4 w-40 sm:w-60 bg-slate-50 border border-slate-100 rounded-md mx-auto flex items-center justify-center text-[10px] text-slate-400 font-mono">
                    menuin.id/dashboard
                  </div>
                </div>

                {/* Dashboard layout UI */}
                <div className="p-4 bg-slate-50/50 rounded-b-lg">
                  {/* Dashboard header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <img src="/logo/logo.jpeg" alt="MENUIN Logo" className="h-8 w-auto rounded" />
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Store
                    </span>
                  </div>

                  {/* Top metrics grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/30 transition-all duration-300">
                      <div className="text-[10px] text-[#64748B] font-medium">Revenue</div>
                      <div className="text-sm font-bold text-[#0F172A] mt-0.5">Rp 8.4M</div>
                      <div className="text-[9px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="h-2 w-2" /> +12.4%
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/30 transition-all duration-300">
                      <div className="text-[10px] text-[#64748B] font-medium">Orders</div>
                      <div className="text-sm font-bold text-[#0F172A] mt-0.5">142</div>
                      <div className="text-[9px] text-[#64748B] mt-0.5">Hari ini</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/30 transition-all duration-300">
                      <div className="text-[10px] text-[#64748B] font-medium">Active Orders</div>
                      <div className="text-sm font-bold text-[#2563EB] mt-0.5">8</div>
                      <div className="text-[9px] text-[#2563EB] mt-0.5 animate-pulse">Sedang diproses</div>
                    </div>
                  </div>

                  {/* Content columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sales Mini Chart Simulation */}
                    <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold text-[#0F172A]">Sales Overview</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setRevenueTimeframe("day")} 
                            className={`text-[8px] px-1.5 py-0.5 rounded ${revenueTimeframe === "day" ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#64748B]"}`}
                          >
                            Day
                          </button>
                          <button 
                            onClick={() => setRevenueTimeframe("week")} 
                            className={`text-[8px] px-1.5 py-0.5 rounded ${revenueTimeframe === "week" ? "bg-[#EFF6FF] text-[#2563EB] font-bold" : "text-[#64748B]"}`}
                          >
                            Week
                          </button>
                        </div>
                      </div>
                      
                      {/* Fake bars chart */}
                      <div className="h-24 flex items-end gap-3 pt-2">
                        {[45, 60, 35, 80, 55, 90, 70].map((h, i) => (
                          <div key={i} className="w-full bg-slate-100 rounded-t-sm flex flex-col justify-end h-full">
                            <div 
                              className={`rounded-t-sm transition-all duration-500 ${i === 5 ? "bg-[#2563EB]" : "bg-slate-300/80 hover:bg-[#2563EB]/70"}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-[#64748B] mt-2 font-mono">
                        <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
                      </div>
                    </div>

                    {/* Popular Menu & Recent Orders */}
                    <div className="space-y-3">
                      {/* Popular Menu */}
                      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <span className="text-[11px] font-bold text-[#0F172A] block mb-2">Popular Menu</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <Coffee className="h-3 w-3 text-amber-600" />
                              <span className="font-medium">Kopi Susu Aren</span>
                            </div>
                            <span className="text-[#64748B]">48 pcs</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <UtensilsCrossed className="h-3 w-3 text-orange-600" />
                              <span className="font-medium">Nasi Goreng Spesial</span>
                            </div>
                            <span className="text-[#64748B]">32 pcs</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Orders */}
                      <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm">
                        <span className="text-[11px] font-bold text-[#0F172A] block mb-2">Recent Orders</span>
                        <div className="space-y-1.5 text-[9px]">
                          <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                            <span className="font-bold text-[#0F172A]">#1042</span>
                            <span className="bg-blue-50 text-[#2563EB] px-1 rounded font-medium">Baru</span>
                            <span className="text-slate-400 font-mono">Rp 45,000</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#0F172A]">#1041</span>
                            <span className="bg-slate-100 text-slate-600 px-1 rounded font-medium">Selesai</span>
                            <span className="text-slate-400 font-mono">Rp 120,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Float Indicator Card */}
                <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-lg animate-bounce duration-1000">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Order Baru Masuk</div>
                    <div className="text-xs font-bold text-[#0F172A]">1x Caramel Macchiato</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust / Social Proof Section */}
      <section className="border-t border-[#E2E8F0] py-8 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-[#64748B] mb-6">
            Dibuat untuk bisnis F&B yang ingin tumbuh lebih sederhana
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm font-semibold text-slate-400 select-none">
            <span className="hover:text-[#0F172A] transition-colors duration-200 cursor-default">Restaurant</span>
            <span className="hover:text-[#0F172A] transition-colors duration-200 cursor-default">Coffee Shop</span>
            <span className="hover:text-[#0F172A] transition-colors duration-200 cursor-default">Bakery</span>
            <span className="hover:text-[#0F172A] transition-colors duration-200 cursor-default">Cloud Kitchen</span>
            <span className="hover:text-[#0F172A] transition-colors duration-200 cursor-default">Food Business</span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 sm:py-28 bg-white border-t border-[#E2E8F0]" id="product">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Operasional F&B tidak harus serumit itu.
            </h2>
            <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Menu terpisah. Pesanan masuk dari berbagai tempat. Kasir bekerja sendiri. Data penjualan sulit dipantau.
            </p>
          </div>

          {/* Fragmented Visual Flow */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              
              <div className="bg-white p-5 rounded-lg border-2 border-dashed border-[#E2E8F0] relative overflow-hidden group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sistem 01</div>
                <div className="text-sm font-bold text-[#0F172A]">Menu Cetak / PDF</div>
                <div className="h-1 bg-red-400/40 w-12 mx-auto mt-4 rounded-full" />
              </div>

              <div className="bg-white p-5 rounded-lg border-2 border-dashed border-[#E2E8F0] relative overflow-hidden group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sistem 02</div>
                <div className="text-sm font-bold text-[#0F172A]">Order manual WA</div>
                <div className="h-1 bg-amber-400/40 w-12 mx-auto mt-4 rounded-full" />
              </div>

              <div className="bg-white p-5 rounded-lg border-2 border-dashed border-[#E2E8F0] relative overflow-hidden group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sistem 03</div>
                <div className="text-sm font-bold text-[#0F172A]">Kasir / POS offline</div>
                <div className="h-1 bg-orange-400/40 w-12 mx-auto mt-4 rounded-full" />
              </div>

              <div className="bg-white p-5 rounded-lg border-2 border-dashed border-[#E2E8F0] relative overflow-hidden group">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sistem 04</div>
                <div className="text-sm font-bold text-[#0F172A]">Rekap excel manual</div>
                <div className="h-1 bg-rose-400/40 w-12 mx-auto mt-4 rounded-full" />
              </div>

            </div>

            {/* Split connection text */}
            <div className="flex flex-col items-center justify-center mt-12 space-y-4">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Terpecah & tidak sinkron</span>
              <div className="h-8 w-px bg-slate-300" />
              <div className="bg-[#EFF6FF] text-[#2563EB] px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide border border-blue-100 hover:scale-105 transition-transform duration-300">
                MENUIN menyatukannya.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 sm:py-28 bg-slate-50/50 border-t border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Satu platform untuk seluruh alur bisnis Anda.
            </h2>
            <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Dari pelanggan melihat menu hingga transaksi tercatat di kasir, semuanya terhubung dalam satu sistem.
            </p>
          </div>

          {/* Connected Flow Visualizer */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-3 bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm">
              
              {/* Step item */}
              <div className="flex flex-col items-center text-center space-y-2.5 w-full md:w-1/5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">MENU</h4>
                  <span className="text-[11px] text-[#64748B]">Katalog Digital QR</span>
                </div>
              </div>

              {/* Connecting line */}
              <div className="hidden md:block h-0.5 bg-[#EFF6FF] flex-1 relative"><div className="absolute inset-0 bg-[#2563EB]/40 w-1/2 rounded animate-pulse" /></div>

              {/* Step item */}
              <div className="flex flex-col items-center text-center space-y-2.5 w-full md:w-1/5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">ORDER</h4>
                  <span className="text-[11px] text-[#64748B]">Pesanan Langsung</span>
                </div>
              </div>

              {/* Connecting line */}
              <div className="hidden md:block h-0.5 bg-[#EFF6FF] flex-1 relative"><div className="absolute inset-0 bg-[#2563EB]/40 w-2/3 rounded animate-pulse" /></div>

              {/* Step item */}
              <div className="flex flex-col items-center text-center space-y-2.5 w-full md:w-1/5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">PAYMENT</h4>
                  <span className="text-[11px] text-[#64748B]">E-Wallet & QRIS</span>
                </div>
              </div>

              {/* Connecting line */}
              <div className="hidden md:block h-0.5 bg-[#EFF6FF] flex-1 relative"><div className="absolute inset-0 bg-[#2563EB]/40 w-1/3 rounded animate-pulse" /></div>

              {/* Step item */}
              <div className="flex flex-col items-center text-center space-y-2.5 w-full md:w-1/5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">POS</h4>
                  <span className="text-[11px] text-[#64748B]">Sistem Kasir Utama</span>
                </div>
              </div>

              {/* Connecting line */}
              <div className="hidden md:block h-0.5 bg-[#EFF6FF] flex-1 relative"><div className="absolute inset-0 bg-[#2563EB]/40 w-4/5 rounded animate-pulse" /></div>

              {/* Step item */}
              <div className="flex flex-col items-center text-center space-y-2.5 w-full md:w-1/5 relative z-10">
                <div className="h-12 w-12 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2563EB]">DASHBOARD</h4>
                  <span className="text-[11px] text-[#64748B]">Laporan Real-Time</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-white border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Yang Anda butuhkan untuk menjalankan F&B.
            </h2>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Feature 01 */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 group">
              <div className="text-xs font-bold text-[#2563EB] tracking-wider mb-2">01 — Digital Menu</div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">Buat katalog digital yang mudah dibagikan.</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Setiap bisnis memiliki link katalog sendiri yang dapat digunakan pelanggan untuk melihat menu langsung dari meja mereka.
              </p>
              {/* Feature Mockup Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-lg font-bold text-[#2563EB]">🍽</div>
                  <div>
                    <div className="text-xs font-bold">menuin.id/kopikami</div>
                    <div className="text-[10px] text-slate-400">12 Kategori • 45 Menu</div>
                  </div>
                </div>
                <span className="text-[10px] text-[#2563EB] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Lihat Link <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>

            {/* Feature 02 */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 group">
              <div className="text-xs font-bold text-[#2563EB] tracking-wider mb-2">02 — Online Ordering</div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">Terima pesanan langsung dari pelanggan.</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Pelanggan dapat memilih menu, melakukan checkout mandiri, dan membayar melalui gateway pembayaran yang terintegrasi.
              </p>
              {/* Feature Mockup Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-lg">🛒</div>
                  <div>
                    <div className="text-xs font-bold">Keranjang Belanja</div>
                    <div className="text-[10px] text-slate-400">2 Items • Total Rp 64.000</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Siap Checkout</span>
              </div>
            </div>

            {/* Feature 03 */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 group">
              <div className="text-xs font-bold text-[#2563EB] tracking-wider mb-2">03 — POS</div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">Pesanan online dan kasir dalam satu sistem.</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Kelola pesanan dine-in maupun take-away langsung dari dashboard kasir, menyatukan seluruh transaksi ke dalam sistem POS terpadu.
              </p>
              {/* Feature Mockup Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-lg">💻</div>
                  <div>
                    <div className="text-xs font-bold">Tampilan Kasir POS</div>
                    <div className="text-[10px] text-slate-400">Meja 04 • Menunggu Pembayaran</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">Proses Kasir</span>
              </div>
            </div>

            {/* Feature 04 */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-300 group">
              <div className="text-xs font-bold text-[#2563EB] tracking-wider mb-2">04 — Business Dashboard</div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">Pahami bisnis Anda melalui data.</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Pantau total revenue, jumlah pesanan, produk terlaris, dan kinerja staf F&B Anda dari satu halaman analitik sederhana.
              </p>
              {/* Feature Mockup Box */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-lg">📈</div>
                  <div>
                    <div className="text-xs font-bold">Laporan Ringkasan Bulanan</div>
                    <div className="text-[10px] text-slate-400">Revenue Naik +18.2% bulan ini</div>
                  </div>
                </div>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Analytics</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-20 sm:py-28 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Bukan hanya digital menu.<br />
              <span className="text-[#2563EB]">Ini sistem untuk bisnis Anda.</span>
            </h2>
          </div>

          {/* Large Mockup dashboard window */}
          <div className="relative mx-auto max-w-5xl rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-2xl shadow-slate-200/50">
            {/* Header window control */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="text-xs text-[#64748B] font-mono">dashboard.menuin.id/analytics</div>
              <div className="w-12" />
            </div>

            {/* Simulated UI App Body */}
            <div className="p-4 sm:p-6 bg-slate-50/50 rounded-b-lg">
              
              {/* Row 1 Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Total Revenue</div>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">Rp 128.450.000</div>
                  <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +18.4%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Total Orders</div>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">2.418</div>
                  <div className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +6.1%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Today's Sales</div>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">Rp 4.210.000</div>
                  <div className="text-[10px] text-[#64748B] mt-1">112 orders masuk</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Average Bill</div>
                  <div className="text-xl font-bold text-[#0F172A] mt-1">Rp 53.120</div>
                  <div className="text-[10px] text-blue-600 mt-1 font-medium">Stabil</div>
                </div>
              </div>

              {/* Row 2 Main Analytics content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Large graph chart container */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">Analisis Penjualan Mingguan</h4>
                      <p className="text-[11px] text-[#64748B]">Membandingkan target penjualan minggu ini</p>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg">Maret 2026</span>
                  </div>

                  {/* SVG Chart graph simulation */}
                  <div className="relative h-48 w-full">
                    <svg className="w-full h-full" viewBox="0 0 500 150">
                      {/* Lines/Grid */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" />
                      
                      {/* Smooth Path Area Fill */}
                      <path 
                        d="M 0 120 C 50 110, 100 80, 150 95 C 200 110, 250 50, 300 65 C 350 80, 400 20, 450 35 L 500 15 L 500 150 L 0 150 Z" 
                        fill="url(#gradient-blue)" 
                        opacity="0.08" 
                      />
                      
                      {/* Line Path */}
                      <path 
                        d="M 0 120 C 50 110, 100 80, 150 95 C 200 110, 250 50, 300 65 C 350 80, 400 20, 450 35 L 500 15" 
                        fill="none" 
                        stroke="#2563EB" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />

                      {/* Accent Dot */}
                      <circle cx="450" cy="35" r="4.5" fill="#2563EB" stroke="white" strokeWidth="1.5" />

                      <defs>
                        <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="flex justify-between text-[10px] text-[#64748B] mt-4 font-mono">
                      <span>Senin</span>
                      <span>Selasa</span>
                      <span>Rabu</span>
                      <span>Kamis</span>
                      <span>Jumat</span>
                      <span>Sabtu</span>
                      <span>Minggu</span>
                    </div>
                  </div>
                </div>

                {/* Popular items & orders sidebar */}
                <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A] mb-3">Popular Products</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#0F172A]">Caramel Latte</span>
                        <div className="text-right">
                          <span className="font-bold text-[#0F172A]">240x</span>
                          <span className="text-[10px] text-slate-400 block">Rp 7.2M</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#0F172A]">Croissant Butter</span>
                        <div className="text-right">
                          <span className="font-bold text-[#0F172A]">180x</span>
                          <span className="text-[10px] text-slate-400 block">Rp 5.4M</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#0F172A]">Spaghetti Carbonara</span>
                        <div className="text-right">
                          <span className="font-bold text-[#0F172A]">95x</span>
                          <span className="text-[10px] text-slate-400 block">Rp 4.7M</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-[#0F172A] mb-3">Recent Active Orders</h4>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="font-bold text-[#0F172A]">Order #1024</span>
                          <span className="text-[9px] text-[#64748B] block mt-0.5">Meja 12 • Take-away</span>
                        </div>
                        <span className="bg-blue-50 text-[#2563EB] font-bold px-2 py-0.5 rounded text-[9px]">DIPROSES</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <span className="font-bold text-[#0F172A]">Order #1023</span>
                          <span className="text-[9px] text-[#64748B] block mt-0.5">Meja 03 • Dine-in</span>
                        </div>
                        <span className="bg-[#EFF6FF] text-[#2563EB] font-bold px-2 py-0.5 rounded text-[9px]">DIANTAR</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Floating Live Badge cards */}
            <div className="absolute -top-6 -right-6 hidden lg:flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-lg animate-pulse">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-[11px] font-bold text-[#0F172A]">New Order #1024 - Rp 85.000</div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-28 bg-white border-t border-b border-[#E2E8F0]" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Mulai dalam beberapa langkah.
            </h2>
          </div>

          {/* 4 horizontal steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative bg-white p-6 rounded-lg border border-[#E2E8F0] group hover:border-[#2563EB]/40 transition-colors"
                onMouseEnter={() => setActiveStep(idx)}
              >
                <div className={`text-4xl font-extrabold tracking-tight mb-4 transition-colors ${activeStep === idx ? "text-[#2563EB]" : "text-slate-200"}`}>
                  {step.number}
                </div>
                <h4 className="text-base font-bold text-[#0F172A] mb-2">{step.title}</h4>
                <p className="text-xs text-[#64748B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 sm:py-28 bg-[#FFFFFF] border-b border-[#E2E8F0]" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Pilih paket yang sesuai dengan bisnis Anda.
            </h2>
            <p className="text-base text-[#64748B] max-w-2xl mx-auto">
              Mulai sederhana. Tingkatkan ketika bisnis Anda berkembang.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* STARTER */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] flex flex-col justify-between shadow-sm hover:border-[#2563EB]/30 transition-all duration-300">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#64748B] mb-2">STARTER</h4>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-extrabold text-[#0F172A]">Rp99K</span>
                  <span className="text-xs text-[#64748B]">/ bulan</span>
                </div>
                <p className="text-xs text-[#64748B] mb-6">Untuk bisnis kecil yang baru mulai digital.</p>
                <div className="h-px bg-slate-100 my-4" />
                <ul className="space-y-3 text-xs text-[#64748B] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Digital Menu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Custom Catalog Link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Online Ordering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Basic Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>1 User</span>
                  </li>
                </ul>
              </div>
              <a 
                href="/auth/signup?plan=starter" 
                className="block text-center py-2.5 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                Mulai Sekarang
              </a>
            </div>

            {/* BUSINESS - Prominent */}
            <div className="bg-white p-8 rounded-xl border-2 border-[#2563EB] flex flex-col justify-between shadow-lg relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                PALING POPULER
              </span>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#2563EB] mb-2 mt-2">BUSINESS</h4>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-extrabold text-[#0F172A]">Rp199K</span>
                  <span className="text-xs text-[#64748B]">/ bulan</span>
                </div>
                <p className="text-xs text-[#64748B] mb-6">Untuk bisnis F&B yang membutuhkan operasional lebih lengkap.</p>
                <div className="h-px bg-slate-100 my-4" />
                <ul className="space-y-3 text-xs text-[#64748B] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span className="font-medium text-[#0F172A]">Semua fitur Starter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Sistem POS / Kasir</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Payment Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Order Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Advanced Dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Multiple Users</span>
                  </li>
                </ul>
              </div>
              <a 
                href="/auth/signup?plan=business" 
                className="block text-center py-2.5 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8] transition-colors"
              >
                Mulai Sekarang
              </a>
            </div>

            {/* ENTERPRISE */}
            <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] flex flex-col justify-between shadow-sm hover:border-[#2563EB]/30 transition-all duration-300">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#64748B] mb-2">ENTERPRISE</h4>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-extrabold text-[#0F172A]">Custom</span>
                </div>
                <p className="text-xs text-[#64748B] mb-6">Untuk bisnis dengan kebutuhan dan skala yang lebih besar.</p>
                <div className="h-px bg-slate-100 my-4" />
                <ul className="space-y-3 text-xs text-[#64748B] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span className="font-medium text-[#0F172A]">Semua fitur Business</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Multiple Branch (Multi-Cabang)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Advanced User Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Custom Integration (API)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
              <a 
                href="mailto:hello@menuin.id?subject=Enterprise Inquiry" 
                className="block text-center py-2.5 rounded-lg border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                Hubungi Kami
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-28 bg-[#FFFFFF] border-b border-[#E2E8F0]" id="faq">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
              Pertanyaan yang sering ditanyakan.
            </h2>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-[#E2E8F0] pb-4">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between py-3 text-left font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform duration-300 ${activeFaq === idx ? "rotate-180 text-[#2563EB]" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="mt-2 text-sm text-[#64748B] leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#EFF6FF]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">
            Saatnya bisnis F&B Anda lebih sederhana.
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto">
            Kelola menu, pesanan, kasir, dan bisnis Anda dalam satu platform.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a 
              href="/auth/signup" 
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#2563EB] px-8 text-base font-bold text-white transition-all hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-blue-500/10"
            >
              Mulai Gratis
            </a>
            <span className="text-xs text-[#64748B]">Tidak perlu kartu kredit.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-12 bg-white text-[#64748B] text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center">
                <img src="/logo/logo.jpeg" alt="MENUIN Logo" className="h-16 w-auto rounded-md" />
              </div>
              <p className="text-[#64748B]">Simple tools for modern F&B.</p>
            </div>
            
            <div className="flex flex-wrap gap-8 font-medium">
              <a href="#product" className="hover:text-[#2563EB] transition-colors">Product</a>
              <a href="#pricing" className="hover:text-[#2563EB] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#2563EB] transition-colors">FAQ</a>
              <a href="/auth/login" className="hover:text-[#2563EB] transition-colors">Login</a>
            </div>
          </div>
          
          <div className="border-t border-[#E2E8F0] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#64748B]">
            <span>© 2026 MENUIN. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

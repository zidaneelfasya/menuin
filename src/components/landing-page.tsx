"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, ChevronDown, ArrowRight, PlayCircle } from "lucide-react";


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
  { q: "Apa itu MENUIN?", a: "MENUIN adalah platform SaaS untuk bisnis F&B — mengelola menu digital, pesanan, pembayaran, kasir POS, dan data bisnis dalam satu sistem." },
  { q: "Apakah pelanggan harus install aplikasi?", a: "Tidak. Pelanggan mengakses katalog bisnis Anda langsung dari browser melalui link MENUIN." },
  { q: "Apakah MENUIN punya POS?", a: "Ya. Sistem POS terintegrasi untuk mengelola transaksi dine-in, take-away, dan pesanan online dalam satu dashboard." },
  { q: "Cocok untuk bisnis kecil?", a: "Ya. MENUIN dirancang untuk bisnis F&B dari warung kopi hingga restoran multi-cabang." },
  { q: "Bisa untuk banyak user?", a: "Ya. Setiap bisnis dapat memiliki beberapa user sesuai paket yang dipilih." },
];

const features = [
  { title: "Katalog Digital yang Elegan", desc: "Setiap bisnis memiliki link katalog sendiri. Pelanggan melihat menu langsung dari meja mereka tanpa perlu instal aplikasi.", icon: "📱" },
  { title: "Pesanan & Pembayaran Instan", desc: "Pelanggan memilih menu, checkout mandiri, dan membayar melalui gateway QRIS atau E-Wallet yang terintegrasi.", icon: "💳" },
  { title: "Sistem Kasir (POS) Utama", desc: "Kelola pesanan dine-in maupun take-away langsung dari dashboard kasir. Sinkronisasi real-time tanpa delay.", icon: "💻" },
  { title: "Analitik & Laporan Mendalam", desc: "Pantau revenue, pesanan, produk terlaris, dan kinerja tim dari satu halaman dashboard pintar.", icon: "📈" },
];

const logos = [
  { name: "Midtrans", src: "/img/brand_logo/midtrans.svg" },
  { name: "QRIS", src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/QRIS_logo.svg" },
  { name: "BCA", src: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { name: "Mandiri", src: "/img/brand_logo/mandiri.svg" },
  { name: "BNI", src: "/img/brand_logo/bni.svg" },
  { name: "Komdigi", src: "/img/brand_logo/komdigi.svg" },
  { name: "Kemenparekraf", src: "/img/brand_logo/kemenparkraf.svg" },
  { name: "Pesona Indonesia", src: "/img/brand_logo/pesona_indo.svg" }
];

function HeroImageStack() {
  const images = ["/img/hero/img1.png", "/img/hero/img2.png", "/img/hero/img3.png"];

  const [indexes, setIndexes] = useState({
    front: 0,
    middle: 1,
    back: 2,
    collapsing: -1,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      // Mulai animasi collapse untuk gambar depan
      setIndexes(prev => ({
        ...prev,
        collapsing: prev.front,
      }));

      // Waktu tunggu disesuaikan dengan durasi transisi CSS yang baru (1200ms)
      setTimeout(() => {
        setIndexes(prev => ({
          front: prev.middle,
          middle: prev.back,
          back: prev.collapsing,
          collapsing: -1,
        }));
      }, 1200);
    }, 5000); // Ganti gambar setiap 5 detik agar bisa menikmati tampilannya
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[1000px] mx-auto aspect-[16/10] md:aspect-[16/9] mt-20 perspective-[1200px]">
      {images.map((src, i) => {
        let style: React.CSSProperties = {
          // Menggunakan custom cubic-bezier untuk efek yang sangat smooth dan memukau seperti pegas lambat
          transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        };
        let className = "absolute top-0 left-0 w-full h-full rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-[1200ms] border border-[#E5E5E5] bg-white overflow-hidden";

        if (i === indexes.front) {
          style = { ...style, transform: "translate3d(0, 0, 0) scale(1)", opacity: 1, zIndex: 30 };
        } else if (i === indexes.middle) {
          style = { ...style, transform: "translate3d(0, -6%, -50px) scale(0.94)", opacity: 0.6, zIndex: 20 };
        } else if (i === indexes.back) {
          style = { ...style, transform: "translate3d(0, -12%, -100px) scale(0.88)", opacity: 0.3, zIndex: 10 };
        } else if (i === indexes.collapsing) {
          // Jatuh perlahan ke depan, berputar lebih dramatis, dan menghilang
          style = { ...style, transform: "translate3d(0, 20%, 150px) scale(1.02) rotateX(-8deg)", opacity: 0, zIndex: 40 };
        } else {
          // Posisi standby di belakang saat baru selesai collapse
          style = { ...style, transform: "translate3d(0, -15%, -150px) scale(0.85)", opacity: 0, zIndex: 0 };
        }

        return (
          <div key={i} className={className} style={style}>
            <Image
              src={src}
              alt={`Dashboard preview ${i + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 1000px"
              className="object-cover object-top"
              priority={i === indexes.front || i === indexes.collapsing} // Prioritaskan gambar depan
            />
          </div>
        );
      })}
    </div>
  );
}

const testimonialsData = [
  {
    name: 'Budi Santoso',
    role: 'Owner Warung Kopi Senja',
    avatar: 'https://i.pravatar.cc/150?u=budi',
    rating: 5.0,
    text: 'Sejak pakai Menuin, antrean panjang di kasir hilang. Pelanggan bisa langsung pesan dari meja. Sistem POS-nya juga sangat lancar!',
    sentiment: 'Sangat Puas'
  },
  {
    name: 'Siti Aminah',
    role: 'Manager Resto Padang Raya',
    avatar: 'https://i.pravatar.cc/150?u=siti',
    rating: 4.8,
    text: 'Fitur manajemen stoknya juara. Saya bisa tahu kapan harus restock bahan baku sebelum habis. Sangat membantu operasional harian.',
    sentiment: 'Sangat Puas'
  },
  {
    name: 'Andi Wijaya',
    role: 'Founder Burger Bros',
    avatar: 'https://i.pravatar.cc/150?u=andi',
    rating: 5.0,
    text: 'Checkout mandiri pakai QRIS langsung masuk tanpa delay. Laporan penjualannya juga detail banget. Menuin emang the best!',
    sentiment: 'Sangat Direkomendasikan'
  },
  {
    name: 'Dewi Lestari',
    role: 'Pemilik Cafe Kekinian',
    avatar: 'https://i.pravatar.cc/150?u=dewi',
    rating: 4.9,
    text: 'Tampilannya elegan dan gampang banget dipake sama tim kitchen. Proses order dari meja langsung ke dapur tanpa ada yang miss.',
    sentiment: 'Sangat Puas'
  },
  {
    name: 'Reza Rahadian',
    role: 'CEO Kedai Kopi Lokal',
    avatar: 'https://i.pravatar.cc/150?u=reza',
    rating: 5.0,
    text: 'Supportnya responsif dan sistemnya jarang banget down walau lagi peak hours. Investasi terbaik untuk bisnis F&B saya.',
    sentiment: 'Sangat Direkomendasikan'
  },
  {
    name: 'Ayu Ting Ting',
    role: 'Owner Ayam Geprek',
    avatar: 'https://i.pravatar.cc/150?u=ayu',
    rating: 4.7,
    text: 'Gampang banget set up cabang baru pake Menuin. Semua laporan terintegrasi jadi satu. Sangat recommended buat yang mau scale up.',
    sentiment: 'Sangat Puas'
  }
];

function SkeletonCard() {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper">
      <div className="w-full h-full bg-white/50 backdrop-blur-sm rounded-[24px] p-4 border border-gray-100 flex flex-col shadow-sm opacity-50 grayscale testimonial-inner origin-center will-change-transform">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="w-20 max-w-full h-2.5 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 max-w-full h-2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="w-14 h-2 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Text Body */}
        <div className="flex flex-col gap-1 mt-auto mb-1">
          <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
          <div className="w-[85%] h-2 bg-gray-100 rounded animate-pulse" />
        </div>

      </div>
    </div>
  );
}

function RealCard({ data }: { data: any }) {
  return (
    <div className="w-[300px] shrink-0 h-[120px] testimonial-wrapper">
      <div className="w-full h-full bg-white rounded-[24px] p-4 border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-shadow flex flex-col testimonial-inner origin-center will-change-transform">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center flex-1 min-w-0 mr-2">
            <img src={data.avatar} alt={data.name} className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0" />
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

function TestimonialForm() {
  return (
    <div className="w-full max-w-[600px] mx-auto mt-16 bg-white rounded-3xl p-8 border border-black/[0.04] shadow-[0_4px_25px_rgba(0,0,0,0.04)] relative z-20">
      <div className="text-center mb-8">
        <h3 className="text-[20px] font-bold text-[#111]">Bagikan Pengalaman Anda</h3>
        <p className="text-[14px] text-[#666] mt-2">Masukkan testimonial Anda agar masukan dan saran Anda bisa masuk ke dalam jajaran testimoni Menuin.</p>
      </div>
      <form className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Nama Lengkap" className="h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-[14px] outline-none focus:border-[#0E59F9] focus:bg-white transition-all" />
          <input type="text" placeholder="Jabatan / Bisnis" className="h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-[14px] outline-none focus:border-[#0E59F9] focus:bg-white transition-all" />
        </div>
        <select className="h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-[14px] outline-none focus:border-[#0E59F9] focus:bg-white transition-all text-[#666]">
          <option value="5">⭐⭐⭐⭐⭐ Sangat Puas</option>
          <option value="4">⭐⭐⭐⭐ Puas</option>
        </select>
        <textarea placeholder="Tulis cerita sukses bisnis Anda dengan Menuin..." className="h-32 rounded-xl bg-gray-50 border border-gray-100 p-4 text-[14px] outline-none focus:border-[#0E59F9] focus:bg-white transition-all resize-none" />
        <button type="button" onClick={() => alert('Terima kasih! Testimonial Anda telah disimpan di database (Simulasi).')} className="h-12 mt-2 rounded-xl bg-[#0E59F9] text-white font-semibold hover:bg-[#0C4CD6] transition-colors shadow-lg shadow-blue-500/25">
          Kirim Testimonial
        </button>
      </form>
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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const marqueeContainerRef = useRef<HTMLElement>(null);

  const userInitial = (userName || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();
    let cache: any = null;

    const buildCache = () => {
      if (!marqueeContainerRef.current) return null;

      const contentsList = Array.from(marqueeContainerRef.current.querySelectorAll('.marquee-content')) as HTMLElement[];
      const oldTransforms = contentsList.map(c => c.style.transform);
      contentsList.forEach(c => c.style.transform = 'none');

      const containerRect = marqueeContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerCenter = containerRect.left + containerRect.width / 2;

      const tracks = Array.from(marqueeContainerRef.current.querySelectorAll('.row-top, .row-middle, .row-bottom')).map(track => {
        const isMiddle = track.classList.contains('row-middle');
        const isBottom = track.classList.contains('row-bottom');
        let delay = 0;
        if (isMiddle) delay = -12.5;
        if (isBottom) delay = -6;

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

      return { containerWidth, containerCenter, tracks };
    };
    // logic untuk membuat animasi testimonial
    const updateCards = (time: number) => {
      if (!cache) {
        cache = buildCache();
        if (!cache) {
          animationFrameId = requestAnimationFrame(updateCards);
          return;
        }
      }

      const { containerWidth, containerCenter, tracks } = cache;
      const duration = 15;
      const elapsed = (time - startTime) / 1000;

      for (let i = 0; i < tracks.length; i++) {
        const trackInfo = tracks[i];
        const totalElapsed = elapsed - trackInfo.delay;
        let progress = (totalElapsed % duration) / duration;
        if (progress < 0) progress += 1;

        const translateXPercent = -100 + (progress * 100);

        for (let j = 0; j < trackInfo.contents.length; j++) {
          const contentInfo = trackInfo.contents[j];
          const translateXPixels = (translateXPercent / 100) * contentInfo.contentWidth;

          contentInfo.content.style.transform = `translate3d(${translateXPercent}%, 0, 0)`;

          for (let k = 0; k < contentInfo.wrappers.length; k++) {
            const wrapperInfo = contentInfo.wrappers[k];

            const currentCenter = wrapperInfo.initialCenter + translateXPixels;
            const distanceFromCenter = (currentCenter - containerCenter) / (containerWidth / 2);

            const clampedDistance = Math.max(-1.5, Math.min(1.5, distanceFromCenter));
            const curveIntensity = clampedDistance * clampedDistance;

            const maxOffset = 180;
            const maxRotation = 15;

            let translateY = 0;
            let rotateZ = 0;

            if (wrapperInfo.isTopRow) {
              translateY = -curveIntensity * maxOffset;
              rotateZ = -clampedDistance * maxRotation;
            } else if (wrapperInfo.isBottomRow) {
              translateY = curveIntensity * maxOffset;
              rotateZ = clampedDistance * maxRotation;
            }

            wrapperInfo.inner.style.transform = `translate3d(0, ${translateY}px, 0) rotateZ(${rotateZ}deg) scale(1)`;
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateCards);
    };

    cache = buildCache();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cache = buildCache();
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(updateCards);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased selection:bg-[#0E59F9] selection:text-white overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="mx-auto max-w-[1200px] h-[72px] flex items-center justify-between px-6">
          <a href="/" className="flex items-center">
            <Image src="/menuin.png" alt="MENUIN - Sistem POS Pintar" width={110} height={32} style={{ width: "auto" }} priority />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#" className="text-slate-900 font-semibold">Beranda</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Fitur Barcode</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Paket POS</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <a
                href="/pos"
                className="h-10 pl-2 pr-4 flex items-center rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-800 transition-all gap-2.5 shadow-sm group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0E59F9] to-[#3B82F6] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
                  {userInitial}
                </div>
                <span>Buka Kasir POS</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ) : (
              <>
                <a href="/auth/login" className="text-[14px] font-semibold text-slate-700 hover:text-[#0E59F9] transition-colors mr-2">Masuk</a>
                <a href="/auth/signup" className="h-10 px-5 flex items-center rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold hover:bg-[#0C4CD6] transition-all shadow-sm hover:shadow-md">
                  Coba POS Gratis
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
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-slate-200 px-6 py-6 space-y-5 shadow-xl">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-slate-700">
              <a href="#" onClick={() => setMobileOpen(false)} className="text-slate-900 font-semibold">Beranda</a>
              <a href="#features" onClick={() => setMobileOpen(false)}>Fitur Barcode</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)}>Paket POS</a>
              <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimoni</a>
              <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
            </nav>
            <div className="h-px bg-slate-100" />
            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <a href="/pos" className="flex items-center justify-center gap-2.5 h-11 rounded-full bg-slate-900 text-white text-[14px] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-[#0E59F9] text-white flex items-center justify-center font-bold text-[11px]">
                    {userInitial}
                  </div>
                  <span>Buka Kasir POS</span>
                </a>
              ) : (
                <>
                  <a href="/auth/login" className="flex items-center justify-center h-11 rounded-full border border-slate-200 text-[14px] font-semibold text-slate-800">Masuk</a>
                  <a href="/auth/signup" className="flex items-center justify-center h-11 rounded-full bg-[#0E59F9] text-white text-[14px] font-semibold">Coba POS Gratis</a>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-32 md:pt-44 px-6 overflow-hidden z-0">
        {/* Soft Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#E0EDFF]/80 to-[#B8D0FC] -z-10" />

        {/* Abstract intense blue glow behind the dashboard */}
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[400px] md:h-[600px] -z-10 pointer-events-none">
          {/* Blob 1 (Main thick core) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] md:w-[80%] h-[120%] bg-[#0E59F9]/40 blur-[90px] md:blur-[140px] rounded-[100%] rotate-6" />
          {/* Blob 2 (Left side organic shape) */}
          <div className="absolute top-[30%] left-[-20%] md:left-[5%] w-[100%] md:w-[55%] h-[100%] bg-[#4989F8]/50 blur-[90px] md:blur-[130px] rounded-[40%_60%_70%_30%] -rotate-12" />
          {/* Blob 3 (Right side organic shape) */}
          <div className="absolute top-[40%] right-[-20%] md:right-[5%] w-[110%] md:w-[65%] h-[110%] bg-[#0C4CD6]/40 blur-[100px] md:blur-[150px] rounded-[60%_40%_30%_70%] rotate-45" />
        </div>

        <div className="mx-auto max-w-[1200px] text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
              <span className="flex h-5 items-center px-2 rounded-full bg-[#0E59F9] text-white text-[10px] font-bold uppercase tracking-wider">Next-Gen POS</span>
              <span className="text-[12px] font-medium text-slate-600 pr-1">Sistem POS Pintar Berbasis Barcode Meja</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[clamp(36px,5.2vw,64px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 max-w-[900px] mx-auto">
              Sistem POS Cerdas dengan <br className="hidden sm:inline" />
              <span className="text-[#0E59F9]">Integrasi Barcode Meja & Kasir</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-[16px] md:text-[18px] text-slate-600 leading-relaxed max-w-[680px] mx-auto">
              Tamu cukup scan barcode di meja untuk memesan dan membayar mandiri via QRIS. Pesanan langsung masuk ke dapur dan kasir secara teratur tanpa antrean menumpuk.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={isLoggedIn ? "/pos" : "/auth/signup"}
                className="h-12 px-7 flex items-center justify-center rounded-full bg-[#0E59F9] text-white text-[15px] font-semibold hover:bg-[#0C4CD6] transition-all shadow-md shadow-blue-500/20 hover:shadow-lg w-full sm:w-auto gap-2"
              >
                <span>{isLoggedIn ? "Masuk ke POS Kasir" : "Coba POS Barcode Gratis"}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="h-12 px-7 flex items-center justify-center rounded-full bg-white border border-slate-200 text-[15px] font-semibold text-slate-800 hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto gap-2"
              >
                <PlayCircle className="w-4 h-4 text-slate-600" />
                Lihat Cara Kerja Barcode
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            {/* Negative margin bottom pulls the section's bottom edge up, effectively clipping the image via overflow-hidden */}
            <div className="mt-16 md:mt-24 -mb-16 md:-mb-32">
              <HeroImageStack />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="relative z-20 py-12 md:py-16 border-b border-black/[0.04] bg-white shadow-[0_-50px_50px_rgba(14,89,249,0.15)] overflow-hidden">
        <div className="mx-auto max-w-[1200px] text-center">
          <p className="text-[14px] font-medium text-[#666] mb-4">Didukung oleh:</p>

          <div
            className="flex overflow-hidden relative w-full pt-6 pb-4 group"
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
          >
            <div className="flex shrink-0 animate-marquee items-center justify-around gap-16 min-w-full pr-16 group-hover:[animation-play-state:paused]">
              {logos.map((logo, i) => (
                <img
                  key={`logo1-${i}`}
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 md:h-12 w-auto object-contain brightness-0 opacity-40 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                />
              ))}
            </div>
            <div className="flex shrink-0 animate-marquee items-center justify-around gap-16 min-w-full pr-16 group-hover:[animation-play-state:paused]" aria-hidden="true">
              {logos.map((logo, i) => (
                <img
                  key={`logo2-${i}`}
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 md:h-12 w-auto object-contain brightness-0 opacity-40 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES (Grid Layout like the image) */}
      <section className="py-16 md:py-16 px-6 bg-[#FAFAFA]" id="features">
        <div className="mx-auto max-w-[1200px]">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <span className="text-[#0E59F9] text-[12px] font-semibold uppercase tracking-wider">Core Features</span>
              </div>
              <h2 className="text-[clamp(32px,5vw,48px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#111]">
                The Smarter Way.<br /><span className="text-[#0E59F9]">Make your F&B run better.</span>
              </h2>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-6 max-w-[1100px] mx-auto">
            {/* TOP ROW - 2 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Analytics & Reporting */}
              <FadeIn delay={0.1} className="h-full">
                <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#F0F6FF] to-[#E0EDFF] rounded-[20px] p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[260px]">
                    {/* Mockup Line Chart */}
                    <div className="w-full max-w-[280px] bg-white rounded-xl p-4 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#111]">Pendapatan Harian</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">Minggu ini</span>
                      </div>
                      <div className="w-full h-24 flex items-end">
                        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                          <path d="M0,45 L10,40 L20,48 L30,30 L40,35 L50,15 L60,25 L70,10 L80,15 L90,5 L100,8" fill="none" stroke="#0E59F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M0,50 L15,45 L25,50 L35,40 L45,45 L55,30 L65,35 L75,20 L85,25 L95,10 L100,15" fill="none" stroke="#4989F8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 mt-auto">
                    <h3 className="text-[20px] font-bold text-[#111] mb-2">Analytics & Reporting</h3>
                    <p className="text-[14px] text-[#666] leading-relaxed">
                      Pantau metrik utama, data penjualan, dan performa bisnis Anda secara real-time dari satu dashboard interaktif.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 2: Workflow Automation */}
              <FadeIn delay={0.2} className="h-full">
                <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#F0F6FF] to-[#E0EDFF] rounded-[20px] p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[260px]">
                    {/* Mockup Donut Chart */}
                    <div className="w-full max-w-[280px] bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[#111]">Metode Pembayaran</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full bg-[#0E59F9]" />
                          <span className="text-[10px] text-[#666]">QRIS (75%)</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-[#E0EDFF]" />
                          <span className="text-[10px] text-[#666]">Tunai (25%)</span>
                        </div>
                      </div>
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                          <circle cx="50" cy="50" r="35" stroke="#E0EDFF" strokeWidth="16" fill="none" />
                          <circle cx="50" cy="50" r="35" stroke="#0E59F9" strokeWidth="16" fill="none" strokeDasharray="219.9" strokeDashoffset="55" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 mt-auto">
                    <h3 className="text-[20px] font-bold text-[#111] mb-2">Workflow Automation</h3>
                    <p className="text-[14px] text-[#666] leading-relaxed">
                      Otomatiskan pesanan pelanggan langsung ke dapur dan kasir. Kurangi kesalahan manual dan kelola dengan cepat.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* BOTTOM ROW - 3 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 3: Manajemen Antrean */}
              <FadeIn delay={0.3} className="h-full">
                <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#F0F6FF] to-[#E0EDFF] rounded-[20px] p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
                    <div className="w-full max-w-[200px] flex flex-col gap-2">
                      {[
                        { title: "Meja 04", stat: "Menunggu", color: "bg-rose-100 text-rose-600" },
                        { title: "Meja 12", stat: "Diproses", color: "bg-amber-100 text-amber-600" },
                        { title: "Takeaway", stat: "Selesai", color: "bg-emerald-100 text-emerald-600" }
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#111]">{item.title}</span>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${item.color}`}>{item.stat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 mt-auto">
                    <h3 className="text-[18px] font-bold text-[#111] mb-2">Manajemen Antrean</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">Pantau status pesanan dan meja secara langsung dari layar dapur maupun kasir.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 4: AI Assistant / Smart Suggestion */}
              <FadeIn delay={0.4} className="h-full">
                <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#F0F6FF] to-[#E0EDFF] rounded-[20px] p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
                    <div className="w-full max-w-[200px] bg-white rounded-xl p-3 shadow-sm flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-[#111] mb-1">Rekomendasi Pintar</span>
                      <div className="w-full h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center px-3">
                        <span className="text-[10px] text-gray-500">Stok menipis: Kopi Arabica</span>
                      </div>
                      <div className="w-4/5 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center px-3">
                        <span className="text-[10px] text-gray-500">Buka rekap shift pagi</span>
                      </div>
                      <div className="mt-1 w-full h-8 border-2 border-[#0E59F9]/20 rounded-lg bg-blue-50/50 flex items-center justify-between px-2">
                        <span className="text-[10px] text-blue-900/40">Tanya asisten...</span>
                        <div className="w-5 h-5 bg-[#0E59F9] rounded flex items-center justify-center"><span className="text-white text-[8px] font-bold">↑</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 mt-auto">
                    <h3 className="text-[18px] font-bold text-[#111] mb-2">Smart Assistant</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">Dapatkan notifikasi pintar tentang stok bahan dan saran optimasi jam operasional.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 5: Integrasi Sistem */}
              <FadeIn delay={0.5} className="h-full">
                <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] border border-black/[0.04] transition-all flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#F0F6FF] to-[#E0EDFF] rounded-[20px] p-6 flex items-center justify-center relative overflow-hidden min-h-[220px]">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <div className="w-12 h-12 bg-[#0E59F9] rounded-xl flex items-center justify-center z-10 shadow-lg text-white font-black text-xl tracking-tighter">m.</div>
                      <div className="absolute inset-2 border-2 border-dashed border-blue-200 rounded-full animate-[spin_20s_linear_infinite]" />
                      <div className="absolute top-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center -translate-y-1/2">
                        <span className="text-[10px] font-bold text-green-500">Go</span>
                      </div>
                      <div className="absolute bottom-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center translate-y-1/2">
                        <span className="text-[10px] font-bold text-orange-500">Sh</span>
                      </div>
                      <div className="absolute left-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center -translate-x-1/2">
                        <span className="text-[10px] font-bold text-blue-500">Q</span>
                      </div>
                      <div className="absolute right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center translate-x-1/2">
                        <span className="text-[10px] font-bold text-purple-600">Ovo</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 mt-auto">
                    <h3 className="text-[18px] font-bold text-[#111] mb-2">Connect Tools</h3>
                    <p className="text-[13px] text-[#666] leading-relaxed">Terhubung langsung dengan pembayaran digital, e-wallet, dan platform pihak ketiga.</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE LIST (Side by side) */}
      <section className="py-24 md:py-32 px-6">
        <div className="mx-auto max-w-[1200px] flex flex-col lg:flex-row items-center gap-16">
          <FadeIn className="w-full lg:w-1/2">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/[0.04] bg-[#F8F9FA] aspect-square max-h-[600px] flex items-center justify-center">
              <Image src="/img/hero/img2.png" alt="Feature showcase" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-left" />
            </div>
          </FadeIn>

          <div className="w-full lg:w-1/2">
            <FadeIn delay={0.1}>
              <h2 className="text-[clamp(30px,4vw,40px)] font-bold leading-[1.15] tracking-[-0.02em] text-[#111] mb-4">
                Mendukung Pertumbuhan <br /> <span className="text-[#0E59F9]">Bisnis Anda</span>
              </h2>
              <p className="text-[16px] text-[#666] mb-10 leading-relaxed">
                Temukan bagaimana MENUIN dapat membantu Anda tetap terorganisir, menghemat waktu, dan mengembangkan bisnis F&B Anda.
              </p>
            </FadeIn>

            <div className="space-y-8">
              {features.map((f, i) => (
                <FadeIn key={i} delay={0.15 + (i * 0.1)}>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[20px] shrink-0 text-[#0E59F9]">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="text-[18px] font-bold text-[#111] mb-2">{f.title}</h4>
                      <p className="text-[15px] text-[#666] leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

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
          className="relative py-24 md:py-32 z-10"
        >
          {/* HEADER */}
          <div className="relative z-[60] mx-auto mb-16 max-w-[1200px] px-6 text-center md:mb-20">
            <h2 className="text-[clamp(32px,5vw,48px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#111]">
              Testimonial Menuin
              <br />

              <span className="text-[#0E59F9]">
                Hall of Fame.
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
                    {testimonialsData.map((t, i) => (
                      <SkeletonCard key={`skel1-t-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {testimonialsData.map((t, i) => (
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
                    {testimonialsData.map((t, i) => (
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
                    {testimonialsData.map((t, i) => (
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
                    {[...testimonialsData].reverse().map((t, i) => (
                      <SkeletonCard key={`skel1-m-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {[...testimonialsData].reverse().map((t, i) => (
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
                    {[...testimonialsData].reverse().map((t, i) => (
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
                    {[...testimonialsData].reverse().map((t, i) => (
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
                    {testimonialsData.map((t, i) => (
                      <SkeletonCard key={`skel1-b-${i}`} />
                    ))}
                  </div>

                  <div
                    className="marquee-content flex min-w-full shrink-0 items-center gap-5 pr-5"
                    aria-hidden="true"
                  >
                    {testimonialsData.map((t, i) => (
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
                    {testimonialsData.map((t, i) => (
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
                    {testimonialsData.map((t, i) => (
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

        {/* PRICING (Transparent to show SVG background) */}
        <section className="relative z-30 py-24 md:py-32 px-6" id="pricing">
          <div className="mx-auto max-w-[1200px]">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 shadow-sm mb-6">
                  <span className="text-[#0E59F9] text-[12px] font-semibold uppercase tracking-wider">Pricing</span>
                </div>
                <h2 className="text-[clamp(32px,5vw,48px)] font-bold leading-[1.1] tracking-[-0.02em] text-[#111]">
                  Choose <span className="text-[#0E59F9]">Your Plan</span>
                </h2>

                <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-gray-100 border border-gray-200">
                  <button className="px-6 py-2 rounded-full bg-white text-[#111] text-[14px] font-bold shadow-sm">Monthly</button>
                  <button className="px-6 py-2 rounded-full text-gray-500 text-[14px] font-medium hover:text-[#111] transition-colors">Yearly <span className="text-[10px] text-[#0E59F9] font-bold ml-1">Save 20%</span></button>
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1050px] mx-auto items-center">
              {/* Starter Plan */}
              <FadeIn delay={0}>
                <div className="p-8 rounded-3xl bg-[#131E3A] border border-white/10 flex flex-col h-full">
                  <h4 className="text-[20px] font-bold text-white mb-1">Starter Plan</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[36px] font-bold text-white">Free</span>
                    <span className="text-[14px] text-white/50">/month</span>
                  </div>
                  <p className="text-[14px] text-white/60 mb-8">Perfect for small business.</p>
                  <a href="/auth/signup" className="block text-center py-3.5 rounded-xl bg-white text-[15px] font-bold text-[#111] hover:bg-gray-100 transition-colors mb-8">
                    Get Started
                  </a>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4">Features</div>
                  <ul className="space-y-4 text-[14px] text-white/70">
                    {["Digital Menu Catalog", "QR Code Generation", "Basic Online Ordering", "Single User Access", "Standard Support"].map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#4989F8] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>

              {/* Professional Plan (Highlighted) */}
              <FadeIn delay={0.1}>
                <div className="p-8 rounded-3xl bg-[#1A2A54] border border-[#4989F8]/50 flex flex-col relative transform md:scale-105 shadow-2xl shadow-blue-900/20 z-10 h-full">
                  <div className="absolute -top-4 right-8 bg-white text-[#111] text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                  <h4 className="text-[20px] font-bold text-white mb-1">Professional</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[36px] font-bold text-white">Rp 199k</span>
                    <span className="text-[14px] text-white/50">/month</span>
                  </div>
                  <p className="text-[14px] text-white/60 mb-8">Perfect for growing business.</p>
                  <a href="/auth/signup?plan=pro" className="block text-center py-3.5 rounded-xl bg-[#0E59F9] text-[15px] font-bold text-white hover:bg-[#0C4CD6] transition-colors mb-8 shadow-lg shadow-blue-500/25">
                    Get Started
                  </a>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4">Features</div>
                  <ul className="space-y-4 text-[14px] text-white/90">
                    {["Everything in Starter", "Integrated POS System", "Payment Gateway (QRIS)", "Advanced Dashboard Analytics", "Multiple Users / Roles", "Priority Support"].map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#4989F8] shrink-0" />
                        <span className={j === 0 ? "font-semibold" : ""}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>

              {/* Enterprise Plan */}
              <FadeIn delay={0.2}>
                <div className="p-8 rounded-3xl bg-[#131E3A] border border-white/10 flex flex-col h-full">
                  <h4 className="text-[20px] font-bold text-white mb-1">Enterprise</h4>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[36px] font-bold text-white">Custom</span>
                  </div>
                  <p className="text-[14px] text-white/60 mb-8">Perfect for large scale business.</p>
                  <a href="mailto:hello@menuin.id" className="block text-center py-3.5 rounded-xl bg-white text-[15px] font-bold text-[#111] hover:bg-gray-100 transition-colors mb-8">
                    Contact Us
                  </a>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4">Features</div>
                  <ul className="space-y-4 text-[14px] text-white/70">
                    {["Everything in Professional", "Multi-Branch Management", "Custom API Integrations", "Dedicated Account Manager", "White-label Options"].map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#4989F8] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* ========================================= */}
          {/* EDGE FADE FOR PRICING                     */}
          {/* ========================================= */}
          <div
            className="
            hidden md:block
            pointer-events-none
            absolute
            inset-y-0
            left-0
            z-[40]
            w-[18%]
            bg-gradient-to-r
            from-[#FAFAFA]
            via-[#FAFAFA]/80
            to-transparent
          "
          />
          <div
            className="
            hidden md:block
            pointer-events-none
            absolute
            inset-y-0
            right-0
            z-[40]
            w-[18%]
            bg-gradient-to-l
            from-[#FAFAFA]
            via-[#FAFAFA]/80
            to-transparent
          "
          />
        </section>
      </div>



      {/* FAQ */}
      <section className="py-20 md:py-28 bg-slate-50/50 border-t border-slate-200/80" id="faq">
        <div className="mx-auto max-w-[720px] px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
                <span className="text-[#0E59F9] text-[11px] font-bold uppercase tracking-wider">Tanya Jawab</span>
              </div>
              <h2 className="text-[clamp(26px,3.5vw,36px)] font-bold leading-[1.2] tracking-[-0.02em] text-slate-900">
                Pertanyaan yang Sering Diajukan
              </h2>
            </div>
          </FadeIn>
          
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="flex w-full items-center justify-between p-5 md:p-6 text-left transition-colors hover:bg-slate-50/60"
                  >
                    <span className="text-[15px] md:text-[16px] font-bold text-slate-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${activeFaq === i ? "rotate-180 text-[#0E59F9]" : ""}`} />
                  </button>
                  {activeFaq === i && (
                    <div className="px-5 md:px-6 pb-5 pt-0 text-[14px] md:text-[15px] text-slate-600 leading-relaxed border-t border-slate-100/80">
                      <p className="pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>



      {/* FOOTER - PUTIH ELEGAN, MODERN & CLEAN */}
      <footer className="border-t border-slate-200/80 bg-white text-slate-800 pt-16 pb-12 px-6">
        <div className="mx-auto max-w-[1200px]">
          
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/80">
            
            {/* Column 1: Brand & Status (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/menuin.png"
                  alt="MENUIN - Smart F&B POS"
                  width={115}
                  height={32}
                  style={{ width: "auto" }}
                />
              </div>

              <p className="text-[14px] text-slate-500 leading-relaxed max-w-[340px]">
                Sistem POS pintar berbasis Barcode & QR. Mempercepat transaksi meja, kasir, dan dapur untuk bisnis kuliner modern di Indonesia.
              </p>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[12px] text-slate-600 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Seluruh Layanan POS Normal</span>
              </div>

              {/* Quick Contacts */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-[13px]">
                <a
                  href="mailto:halo@menuin.id"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition-all shadow-sm"
                >
                  halo@menuin.id
                </a>
                <a
                  href="https://wa.me/628123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-medium border border-slate-200 transition-all shadow-sm"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>

            {/* Column 2: Fitur Produk */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-4">
                Fitur Produk
              </h4>
              <ul className="space-y-2.5 text-[14px] text-slate-500 font-medium">
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Barcode Meja (Self-Order)</a></li>
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Sistem Kasir POS Cepat</a></li>
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Barcode QRIS Dinamis</a></li>
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Kitchen Display Dapur (KDS)</a></li>
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Kontrol Stok & Bahan Baku</a></li>
                <li><a href="#features" className="hover:text-[#0E59F9] transition-colors">Laporan Penjualan & Laba</a></li>
              </ul>
            </div>

            {/* Column 3: Solusi Bisnis */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-4">
                Solusi Bisnis
              </h4>
              <ul className="space-y-2.5 text-[14px] text-slate-500 font-medium">
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Kedai Kopi & Cafe</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Restoran Dine-In</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Food Court & Pujasera</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Bakery & Pastry</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Gerai Booth & Street Food</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Jaringan Multi-Cabang</a></li>
              </ul>
            </div>

            {/* Column 4: Bantuan & Legal */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-900 mb-4">
                Bantuan & Akses
              </h4>
              <ul className="space-y-2.5 text-[14px] text-slate-500 font-medium">
                <li><a href="#faq" className="hover:text-[#0E59F9] transition-colors">Tanya Jawab (FAQ)</a></li>
                <li><a href="/auth/login" className="hover:text-[#0E59F9] transition-colors">Masuk ke Kasir POS</a></li>
                <li><a href="/auth/signup" className="hover:text-[#0E59F9] transition-colors">Daftar Akun Baru</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Syarat & Ketentuan</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#pricing" className="hover:text-[#0E59F9] transition-colors">Keamanan Data SSL</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>&copy; 2026 MENUIN Indonesia. Hak cipta dilindungi undang-undang.</span>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-slate-600 font-medium">
                🇮🇩 Indonesia (IDR)
              </span>
              <span className="text-slate-600">
                Dibuat untuk memajukan bisnis F&B Indonesia
              </span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

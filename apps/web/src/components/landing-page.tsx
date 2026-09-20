"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  CreditCard,
  Monitor,
  Printer,
  ShieldCheck,
  RefreshCw,
  Layers,
  Building2,
  Laptop,
  Tv,
} from "lucide-react";
import EcosystemGallery from "@/components/landing/ecosystem-gallery";
import { HeroIntro, ScrollReveal } from "@/components/landing/scroll-reveal";
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

// Setiap angka di sini harus bisa dijelaskan asalnya (lihat catatan kaki).
const keyNumbers = [
  { value: "< 200", unit: "ms", label: "Pesanan meja sampai ke layar dapur", note: 1 },
  { value: "Rp 0", unit: "", label: "Target selisih kas saat tutup shift", note: 2 },
  { value: "58/80", unit: "mm", label: "Printer termal Bluetooth & LAN", note: null },
  { value: "0", unit: "", label: "Aplikasi yang perlu diunduh tamu", note: null },
];

const keyNumberNotes = [
  "Waktu tempuh event Supabase Realtime dari kasir ke layar dapur pada jaringan stabil. Bukan jaminan SLA.",
  "Target operasional: sistem mencocokkan hitungan uang fisik dengan catatan kasir. Selisih tetap mungkin terjadi dan akan tercatat rinci.",
];

const comparisonRows = [
  {
    old: "Tamu melambaikan tangan menunggu pelayan datang membawa buku menu.",
    now: "Tamu scan QR di meja, membuka menu, dan memesan saat itu juga.",
  },
  {
    old: "Antrean pembayaran menumpuk saat jam makan siang.",
    now: "Pesanan dan pembayaran terbagi otomatis. Kasir fokus pada takeaway.",
  },
  {
    old: 'Pesanan salah masak karena catatan tangan "sambal dipisah" terlewat.',
    now: "Catatan kustom tamu tampil persis di layar dapur dan struk.",
  },
  {
    old: "Uang laci tekor saat pergantian shift, sumbernya tidak ketahuan.",
    now: "Modal awal, kas keluar, dan hitungan fisik direkonsiliasi sistem.",
  },
  {
    old: "Owner tidak berani meninggalkan outlet saat jam ramai.",
    now: "Omzet tiap cabang bisa dipantau dari ponsel secara langsung.",
  },
];

const pillars = [
  {
    index: "01",
    eyebrow: "QR Self-Order",
    title: "Scan. Pilih rasa. Bayar dari meja.",
    body: "Tamu membuka katalog di browser bawaan ponsel — tanpa unduh aplikasi, tanpa daftar akun. Pilih varian susu, tingkat gula, catatan khusus, lalu bayar lewat QRIS dinamis yang terverifikasi otomatis.",
    specs: [
      { k: "Tanpa instalasi", v: "Terbuka di Safari & Chrome mobile" },
      { k: "Modifier", v: "Varian, topping, catatan per item" },
      { k: "Pembayaran", v: "QRIS dinamis via Midtrans, atau bayar di kasir" },
    ],
    icon: QrCode,
    visual: { kind: "image", src: "/img/landing/katalog-iphone.webp", alt: "Katalog menu Menuin di layar ponsel", w: 900, h: 1019, narrow: true },
  },
  {
    index: "02",
    eyebrow: "Kasir Cloud POS",
    title: "Cepat di kasir. Tenang di pembukuan.",
    body: "Dirancang untuk antrean jam sibuk: cari produk, pilih, selesai. PB1, service charge, dan potongan komisi aplikasi online food dihitung otomatis supaya laba bersih tidak meleset.",
    specs: [
      { k: "Printer", v: "Bluetooth & LAN, kertas 58 mm dan 80 mm" },
      { k: "Perhitungan", v: "PB1 10%, service charge, komisi ojol" },
      { k: "Pembayaran", v: "Tunai, debit, kartu, QRIS, transfer" },
    ],
    icon: Monitor,
    visual: { kind: "image", src: "/img/landing/pos-ipad.webp", alt: "Kasir POS Menuin di layar tablet", w: 1800, h: 1382, narrow: false },
  },
  {
    index: "03",
    eyebrow: "Kitchen Display",
    title: "Dapur lebih cepat. Tiket tanpa kertas.",
    body: "Tiket dari meja dan dari kasir muncul di layar dapur seketika, dengan penanda lama tunggu dan status yang bergerak dari Diterima sampai Selesai. Tidak ada lagi nota basah atau pesanan terlewat.",
    specs: [
      { k: "Prioritas", v: "Kode warna otomatis berdasarkan lama tunggu" },
      { k: "Stasiun", v: "Filter terpisah untuk bar dan dapur utama" },
      { k: "Notifikasi", v: "Peringatan audio saat tiket baru masuk" },
    ],
    icon: Tv,
    visual: { kind: "kds" },
  },
  {
    index: "04",
    eyebrow: "Audit Kas Shift",
    title: "Tutup shift jam berapa pun, kas tetap terlacak.",
    body: "Kasir wajib mencatat modal awal sebelum register bisa dipakai, setiap kas keluar tercatat, dan saat tutup shift uang fisik dihitung dulu sebelum sistem menampilkan totalnya.",
    specs: [
      { k: "Starting float", v: "Wajib diisi sebelum transaksi pertama" },
      { k: "Blind cash count", v: "Kasir menghitung tanpa melihat total sistem" },
      { k: "Void", v: "Pembatalan struk butuh PIN manajer" },
    ],
    icon: ShieldCheck,
    visual: { kind: "shift" },
  },
  {
    index: "05",
    eyebrow: "Multi-Outlet",
    title: "Satu cabang atau dua puluh, satu tempat kendali.",
    body: "Laporan penjualan terkonsolidasi, menu terpusat, dan hak akses yang dipisah per peran. Data tiap cabang terisolasi lewat tenant ID sendiri di PostgreSQL.",
    specs: [
      { k: "Laporan", v: "Laba kotor, HPP/COGS, menu terlaris" },
      { k: "Akses", v: "Superadmin, manajer outlet, kasir" },
      { k: "Ekspor", v: "Excel dan PDF, sekali klik" },
    ],
    icon: Building2,
    visual: { kind: "image", src: "/img/landing/dashboard-macbook.webp", alt: "Kasir Menuin berjalan di browser laptop", w: 1800, h: 1145, narrow: false },
  },
];

const specs = [
  {
    value: "Realtime",
    title: "Sinkronisasi tanpa refresh",
    body: "Perubahan status pesanan dikirim lewat Supabase Realtime di atas PostgreSQL. Layar dapur, kasir, dan ponsel tamu melihat status yang sama tanpa perlu memuat ulang halaman.",
    icon: RefreshCw,
    wide: true,
  },
  {
    value: "Tanpa hardware khusus",
    title: "Jalan di perangkat yang sudah Anda punya",
    body: "iPad, tablet Android, laptop, atau ponsel kasir. Cukup browser modern.",
    icon: Laptop,
    wide: false,
  },
  {
    value: "PCI-DSS via Midtrans",
    title: "Kredensial pembayaran tidak disimpan di sistem kami",
    body: "Transaksi diproses Midtrans sebagai penyelenggara berizin, token diisolasi per tenant.",
    icon: CreditCard,
    wide: false,
  },
  {
    value: "Isolasi per tenant",
    title: "Data tiap outlet terpisah di level basis data",
    body: "Setiap cabang punya tenant ID sendiri, dipakai di seluruh query dan kebijakan akses.",
    icon: Layers,
    wide: true,
  },
];

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
    <figure className="relative mx-auto w-full max-w-[1100px]">
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

/**
 * Layar dapur. Dibuat gelap karena KDS sungguhan memang dipasang gelap
 * supaya tiket terbaca dari seberang dapur.
 */
function KdsPanel() {
  const tickets = [
    {
      table: "Meja 12",
      status: "Disiapkan",
      wait: "02:14",
      tone: "accent",
      items: [
        { qty: 2, name: "Es Kopi Gula Aren", note: "Less ice, less sugar" },
        { qty: 1, name: "Butter Croissant", note: "" },
      ],
    },
    {
      table: "Meja 04",
      status: "Diterima",
      wait: "00:38",
      tone: "neutral",
      items: [
        { qty: 1, name: "Kopi Susu Panas", note: "Tanpa gula" },
        { qty: 2, name: "Kastengel Keju", note: "" },
      ],
    },
    {
      table: "Takeaway 118",
      status: "Siap",
      wait: "05:02",
      tone: "done",
      items: [
        { qty: 1, name: "New York Cheesecake", note: "Kotak terpisah" },
        { qty: 3, name: "Butter Croissant", note: "" },
      ],
    },
  ];

  return (
    <div className="overflow-hidden rounded-[20px] bg-[#0b0b0c] text-white shadow-[var(--landing-lift-lg)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold">Layar Dapur</span>
          <span className="text-[12px] text-white/45">Stasiun Utama</span>
        </div>
        <div className="flex items-center gap-2 font-display text-[12px] tabular-nums text-white/45">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>3 tiket aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-3">
        {tickets.map((t) => (
          <div key={t.table} className="flex min-h-[172px] flex-col bg-[#0b0b0c] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold">{t.table}</span>
              <span className="font-display text-[12px] tabular-nums text-white/45">{t.wait}</span>
            </div>

            <span
              className={`mt-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                t.tone === "accent"
                  ? "bg-[#0E59F9]/20 text-[#7aa8ff]"
                  : t.tone === "done"
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-white/10 text-white/70"
              }`}
            >
              {t.status}
            </span>

            <ul className="mt-3 space-y-2 text-[12px] leading-snug">
              {t.items.map((item) => (
                <li key={item.name} className="flex gap-2">
                  <span className="font-display tabular-nums text-white/90">{item.qty}×</span>
                  <span className="min-w-0">
                    <span className="block truncate">{item.name}</span>
                    {item.note && <span className="block text-[11px] text-white/45">{item.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ringkasan tutup shift — angka yang dilihat kasir saat menghitung laci. */
function ShiftPanel() {
  const rows = [
    { k: "Modal awal laci", v: "Rp 200.000" },
    { k: "Penjualan tunai", v: "+Rp 1.425.000" },
    { k: "Kas keluar (petty cash)", v: "−Rp 25.000" },
  ];

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[var(--landing-lift)]">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Tutup shift · Sarah Rahma</span>
        <span className="font-display text-[12px] tabular-nums text-[#71717a]">15.02</span>
      </div>

      <dl className="mt-5">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between border-t border-black/[0.06] py-2.5">
            <dt className="text-[13px] text-[#52525b]">{r.k}</dt>
            <dd className="font-display text-[13px] tabular-nums text-[#0a0a0a]">{r.v}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/[0.06] py-2.5">
          <dt className="text-[13px] text-[#52525b]">Kas seharusnya</dt>
          <dd className="font-display text-[13px] tabular-nums text-[#0a0a0a]">Rp 1.600.000</dd>
        </div>
        <div className="flex justify-between border-t border-black/[0.06] py-2.5">
          <dt className="text-[13px] text-[#52525b]">Uang fisik dihitung</dt>
          <dd className="font-display text-[13px] tabular-nums text-[#0a0a0a]">Rp 1.600.000</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-[13px] font-medium text-emerald-900">Selisih</span>
        <span className="font-display text-[15px] font-semibold tabular-nums text-emerald-700">
          Rp 0
        </span>
      </div>
    </div>
  );
}

type PillarVisualSpec =
  | { kind: "image"; src: string; alt: string; w: number; h: number; narrow: boolean }
  | { kind: "kds" }
  | { kind: "shift" };

function PillarVisual({ visual }: { visual: PillarVisualSpec }) {
  if (visual.kind === "kds") return <KdsPanel />;
  if (visual.kind === "shift") return <ShiftPanel />;

  return (
    <Image
      src={visual.src}
      alt={visual.alt}
      width={visual.w}
      height={visual.h}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 540px"
      className={`h-auto w-full ${visual.narrow ? "mx-auto max-w-[280px]" : ""}`}
    />
  );
}


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

// --- UNIFIED HIGH-FIDELITY POS WORKSPACE SHOWCASE ---


export default function LandingPage({
  isLoggedIn = false,
  userName = "",
}: {
  isLoggedIn?: boolean;
  userName?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
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
    <div className="min-h-screen bg-white text-[#111] font-sans antialiased selection:bg-[#0E59F9] selection:text-white overflow-x-hidden">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="mx-auto max-w-[1100px] h-[64px] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image src="/menuin.png" alt="Menuin" width={220} height={60} className="h-7 w-auto md:h-8" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            <a href="#ekosistem" className="hover:text-[#0a0a0a] transition-colors">Produk</a>
            <a href="#pilar" className="hover:text-[#0a0a0a] transition-colors">Fitur</a>
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
              <a href="#ekosistem" onClick={() => setMobileOpen(false)}>Produk</a>
              <a href="#pilar" onClick={() => setMobileOpen(false)}>Fitur</a>
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
        <div className="mx-auto max-w-[1100px]">
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
                href="#ekosistem"
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

      {/* ANGKA KUNCI */}
      <section className="px-6 py-16 md:py-20" aria-label="Angka kunci">
        <div className="mx-auto max-w-[1100px]">
          {/* Garis pemisah tipis menahan angka-angka ini supaya tidak
              mengambang di tengah ruang putih. */}
          <ScrollReveal className="grid grid-cols-2 border-t border-black/[0.08] md:grid-cols-4" stagger={0.1}>
            {keyNumbers.map((n, i) => (
              <FadeIn
                key={n.label}
                delay={i * 0.05}
                className={`border-b border-black/[0.08] px-0 py-7 md:border-b-0 md:py-8 ${
                  i > 0 ? "md:border-l md:border-black/[0.08] md:pl-7" : ""
                } ${i % 2 === 1 ? "border-l border-black/[0.08] pl-6 md:pl-7" : ""}`}
              >
                <div className="font-display text-[clamp(32px,4vw,46px)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#0a0a0a]">
                  {n.value}
                  {n.unit && (
                    <span className="ml-1 text-[0.45em] font-medium tracking-normal text-[#71717a]">
                      {n.unit}
                    </span>
                  )}
                </div>
                <p className="mt-3 max-w-[20ch] text-[13.5px] leading-snug text-[#52525b]">
                  {n.label}
                  {n.note && <sup className="ml-0.5 text-[#a1a1aa]">{n.note}</sup>}
                </p>
              </FadeIn>
            ))}
          </ScrollReveal>

          <ol className="mt-8 space-y-1.5 border-t border-black/[0.08] pt-5 text-[12px] leading-relaxed text-[#71717a]">
            {keyNumberNotes.map((note, i) => (
              <li key={i}>
                <sup className="mr-1">{i + 1}</sup>
                {note}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MITRA PEMBAYARAN */}
      <section className="border-y border-black/[0.06] bg-[#fafafa] px-6 py-8" aria-label="Mitra pembayaran">
        <div className="mx-auto max-w-[1100px] text-center">
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

      {/* EKOSISTEM — showcase perangkat */}
      <section className="px-6 py-24 md:py-32" id="ekosistem">
        <div className="mx-auto max-w-[1100px]">
          <FadeIn>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Ekosistem
            </p>
            <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0a0a0a] text-balance">
              Empat layar, satu pesanan yang sama.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-[#52525b]">
              Meja tamu, kasir, laci uang, dan kantor pusat melihat data yang sama pada detik yang
              sama. Pindah tab untuk melihat masing-masing sisi.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-12">
            <EcosystemGallery />
          </FadeIn>
        </div>
      </section>

      {/* CARA LAMA vs MENUIN */}
      <section className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <FadeIn>
            <h2 className="max-w-[20ch] font-display text-[clamp(28px,3.8vw,44px)] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0a0a0a] text-balance">
              Lima hal yang berubah sejak hari pertama.
            </h2>
          </FadeIn>

          <ScrollReveal className="mt-12 border-t border-black/[0.08]" stagger={0.06} y={18}>
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 border-b border-black/[0.08] py-6 md:grid-cols-12 md:gap-8"
              >
                <div className="md:col-span-1">
                  <span className="font-display text-[13px] tabular-nums text-[#a1a1aa]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed text-[#a1a1aa] line-through decoration-[#d4d4d8] md:col-span-5">
                  {row.old}
                </p>
                <p className="text-[15px] leading-relaxed text-[#0a0a0a] md:col-span-6">
                  {row.now}
                </p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* PILAR PRODUK */}
      <section className="px-6 py-24 md:py-32" id="pilar">
        <div className="mx-auto max-w-[1100px]">
          <FadeIn>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Yang dikerjakan Menuin
            </p>
          </FadeIn>

          <div className="mt-10 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              // Sisi visual berganti kiri–kanan supaya lima pilar tidak
              // terbaca sebagai satu dinding teks.
              const visualFirst = i % 2 === 1;

              return (
                <FadeIn key={pillar.index} delay={i * 0.04}>
                  <article className="grid grid-cols-1 items-center gap-8 py-14 md:grid-cols-12 md:gap-12 md:py-20">
                    <div
                      className={`md:col-span-6 ${visualFirst ? "md:order-2" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[13px] tabular-nums text-[#a1a1aa]">
                          {pillar.index}
                        </span>
                        <Icon className="h-4 w-4 text-[#0E59F9]" strokeWidth={1.5} />
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
                          {pillar.eyebrow}
                        </span>
                      </div>

                      <h3 className="mt-5 max-w-[16ch] font-display text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0a0a0a] text-balance">
                        {pillar.title}
                      </h3>

                      <p className="mt-5 max-w-[52ch] text-[15.5px] leading-relaxed text-[#52525b]">
                        {pillar.body}
                      </p>

                      <dl className="mt-7">
                        {pillar.specs.map((spec) => (
                          <div
                            key={spec.k}
                            className="grid grid-cols-1 gap-1 border-t border-black/[0.06] py-3 sm:grid-cols-12 sm:gap-4"
                          >
                            <dt className="text-[13px] text-[#71717a] sm:col-span-4">{spec.k}</dt>
                            <dd className="text-[14px] text-[#0a0a0a] sm:col-span-8">{spec.v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className={`md:col-span-6 ${visualFirst ? "md:order-1" : ""}`}>
                      <PillarVisual visual={pillar.visual as PillarVisualSpec} />
                    </div>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* SPESIFIKASI TEKNIS */}
      <section className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <FadeIn>
            <h2 className="max-w-[20ch] font-display text-[clamp(28px,3.8vw,44px)] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0a0a0a] text-balance">
              Di balik layarnya.
            </h2>
          </FadeIn>

          <ScrollReveal className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-black/[0.08] bg-black/[0.08] md:grid-cols-6" stagger={0.09} y={18}>
            {specs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.title}
                  className={`bg-white p-7 md:p-9 ${spec.wide ? "md:col-span-4" : "md:col-span-2"}`}
                >
                  <Icon className="h-5 w-5 text-[#0E59F9]" strokeWidth={1.5} />
                  <p className="mt-6 font-display text-[clamp(20px,2.2vw,26px)] font-semibold leading-tight tracking-[-0.03em] text-[#0a0a0a]">
                    {spec.value}
                  </p>
                  <h3 className="mt-2 text-[14px] font-medium text-[#0a0a0a]">{spec.title}</h3>
                  <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-[#71717a]">
                    {spec.body}
                  </p>
                  <span className="sr-only">{i + 1}</span>
                </div>
              );
            })}
          </ScrollReveal>
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
          className="relative pt-10 md:pt-14 pb-24 md:pb-32 z-10"
        >
          {/* HEADER */}
          <div className="relative z-[60] mx-auto mb-6 max-w-[1200px] px-6 text-center md:mb-8">
            <h2 className="text-[clamp(44px,7.2vw,78px)] font-extrabold leading-[0.96] tracking-[-0.04em] text-[#111]">
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
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-black leading-[1.08] tracking-[-0.04em] text-slate-900">
                    Langganan bulanan,
                  </h2>
                  <h2 className="text-[clamp(32px,3.8vw,46px)] font-black leading-[1.08] tracking-[-0.04em] text-[#0E59F9]">
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
                      <h3 className="text-xl font-bold text-slate-900">
                        Pro
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
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
                          "Layar dapur (KDS) tanpa kertas",
                          "Hak akses kasir, manajer, dan superadmin",
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
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
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
                      <h3 className="text-xl font-bold text-slate-900">
                        Enterprise
                      </h3>
                      <div className="flex items-baseline gap-1 mt-2 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
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
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#0E59F9] transition-colors">
                          Mulai sekarang
                        </span>
                      </a>
                    </div>
                  </div>
                </FadeIn>

              </div>
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

      {/* FAQ EDITORIAL (SPLIT 2-COLUMN LAYOUT) */}
      <FaqEditorial />

      {/* READY TO BEGIN CTA BANNER */}
      <FooterReadyToBegin />

      {/* SUPERFLUID-INSPIRED BRUTALIST BRAND FOOTER */}
      <FooterSuperfluidStyle />

    </div>
  );
}

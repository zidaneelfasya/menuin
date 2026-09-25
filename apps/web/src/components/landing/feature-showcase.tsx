"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  QrCode,
  Monitor,
  LayoutGrid,
  ShieldCheck,
  BarChart3,
  Building2,
  Check,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Fitur unggulan — menggantikan lima pilar yang berderet kiri–kanan.
 *
 * Satu visual besar dan satu tab aktif dalam satu waktu: pengunjung memilih
 * fitur yang ingin dilihat, bukan menggulir dinding teks. Semua klaim di sini
 * dicocokkan dengan fitur yang benar-benar ada di aplikasi (label status
 * mengikuti papan pesanan di features/orders/kanban-board.tsx).
 */

/** Papan pesanan — cerminan kanban di halaman Pesanan outlet. */
function OrderBoardPanel() {
  const columns = [
    {
      title: "Pesanan Baru",
      tone: "bg-[#0E59F9]",
      cards: [{ id: "Meja 04", items: "1× Kopi Susu Panas", wait: "00:38" }],
    },
    {
      title: "Sedang Disiapkan",
      tone: "bg-amber-400",
      cards: [
        { id: "Meja 12", items: "2× Es Kopi Gula Aren", wait: "02:14" },
        { id: "Takeaway 118", items: "3× Butter Croissant", wait: "03:40" },
      ],
    },
    {
      title: "Siap Disajikan",
      tone: "bg-emerald-500",
      cards: [{ id: "Meja 07", items: "1× New York Cheesecake", wait: "05:02" }],
    },
  ];

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-[#fafafa] shadow-[var(--landing-lift-lg)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] bg-white px-5 py-3.5">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Pesanan · Kopi Ruang Teduh</span>
        <span className="flex items-center gap-2 text-[12px] tabular-nums text-[#71717a]">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          4 pesanan aktif
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${col.tone}`} />
              <span className="text-[12px] font-semibold text-[#0a0a0a]">{col.title}</span>
              <span className="text-[11px] tabular-nums text-[#a1a1aa]">{col.cards.length}</span>
            </div>
            {col.cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-black/[0.06] bg-white p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] font-semibold text-[#0a0a0a]">{c.id}</span>
                  <span className="text-[11px] tabular-nums text-[#a1a1aa]">{c.wait}</span>
                </div>
                <p className="mt-1 truncate text-[11.5px] text-[#52525b]">{c.items}</p>
              </div>
            ))}
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
    { k: "Kas keluar", v: "−Rp 25.000" },
    { k: "Kas seharusnya", v: "Rp 1.600.000" },
    { k: "Uang fisik dihitung", v: "Rp 1.600.000" },
  ];

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[var(--landing-lift-lg)]">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Tutup shift · Sarah Rahma</span>
        <span className="text-[12px] tabular-nums text-[#71717a]">15.02</span>
      </div>

      <dl className="mt-5">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between border-t border-black/[0.06] py-2.5">
            <dt className="text-[13px] text-[#52525b]">{r.k}</dt>
            <dd className="text-[13px] tabular-nums text-[#0a0a0a]">{r.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
        <span className="text-[13px] font-medium text-emerald-900">Selisih</span>
        <span className="text-[15px] font-semibold tabular-nums text-emerald-700">Rp 0</span>
      </div>
    </div>
  );
}

/** Pemilih outlet — satu akun, beberapa cabang. */
function OutletPanel() {
  const outlets = [
    { name: "Kopi Ruang Teduh · Dago", omzet: "Rp 4.318.600", active: true },
    { name: "Kopi Ruang Teduh · Setiabudi", omzet: "Rp 3.102.400", active: false },
    { name: "Kopi Ruang Teduh · Antapani", omzet: "Rp 2.487.900", active: false },
  ];

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[var(--landing-lift-lg)]">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Pilih outlet</span>
        <span className="text-[12px] text-[#71717a]">Hari ini</span>
      </div>

      <ul className="mt-5 space-y-2">
        {outlets.map((o) => (
          <li
            key={o.name}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              o.active ? "border-[#0E59F9]/40 bg-[#0E59F9]/[0.04]" : "border-black/[0.06]"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-semibold ${
                  o.active ? "bg-[#0E59F9] text-white" : "bg-slate-100 text-[#52525b]"
                }`}
              >
                {o.name.split("· ")[1].charAt(0)}
              </span>
              <span className="text-[13px] text-[#0a0a0a]">{o.name}</span>
            </span>
            <span className="text-[12.5px] tabular-nums text-[#52525b]">{o.omzet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-4 gap-2 text-center">
        {["Owner", "Manajer", "Kasir", "Staf"].map((r) => (
          <span key={r} className="rounded-lg bg-[#fafafa] py-2 text-[11.5px] text-[#52525b]">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

type Visual =
  | { kind: "image"; src: string; alt: string; w: number; h: number; narrow?: boolean }
  | { kind: "board" }
  | { kind: "shift" }
  | { kind: "outlet" };

const features: {
  id: string;
  tab: string;
  icon: React.ElementType;
  title: string;
  body: string;
  points: string[];
  visual: Visual;
}[] = [
  {
    id: "qr",
    tab: "QR Self-Order",
    icon: QrCode,
    title: "Meja Anda kini punya kasir sendiri.",
    body: "Tamu memindai QR, katalog langsung terbuka di browser ponsel. Pilih varian, tulis catatan, lalu bayar dengan QRIS atau pilih bayar di kasir.",
    points: [
      "Tanpa unduh aplikasi, tanpa daftar akun",
      "Varian, topping, dan catatan per item",
      "QRIS lewat Midtrans atau bayar di kasir",
    ],
    visual: { kind: "image", src: "/img/landing/katalog-iphone.webp", alt: "Katalog menu Menuin di layar ponsel", w: 900, h: 1019, narrow: true },
  },
  {
    id: "pos",
    tab: "Kasir POS",
    icon: Monitor,
    title: "Antrean jam makan siang, selesai lebih cepat.",
    body: "Cari produk, pilih, bayar. Pajak dan service charge dihitung otomatis, struk langsung tercetak di printer termal yang sudah Anda punya.",
    points: [
      "Tunai, QRIS, debit, kartu, dan transfer",
      "Printer Bluetooth & LAN, 58 dan 80 mm",
      "Pajak dan service charge terhitung sendiri",
    ],
    visual: { kind: "image", src: "/img/landing/pos-ipad.webp", alt: "Kasir POS Menuin di layar tablet", w: 1800, h: 1382 },
  },
  {
    id: "board",
    tab: "Papan Pesanan",
    icon: LayoutGrid,
    title: "Semua pesanan di satu papan, dari masuk sampai selesai.",
    body: "Pesanan dari meja dan dari kasir berkumpul di papan yang sama. Pindahkan dari Pesanan Baru ke Sedang Disiapkan, Siap Disajikan, lalu Selesai. Status di ponsel tamu ikut berubah.",
    points: [
      "Tiket dapur tercetak saat pesanan diproses",
      "Status di ponsel tamu diperbarui seketika",
      "Selesaikan satu kolom sekaligus saat ramai",
    ],
    visual: { kind: "board" },
  },
  {
    id: "shift",
    tab: "Shift & Kas",
    icon: ShieldCheck,
    title: "Selisih kas ketahuan hari ini, bukan akhir bulan.",
    body: "Setiap shift dibuka dengan modal awal, setiap uang keluar dicatat, dan saat tutup shift uang di laci dibandingkan dengan yang seharusnya ada.",
    points: [
      "Modal awal wajib dicatat per shift",
      "Kas masuk dan kas keluar tercatat",
      "Pembatalan transaksi wajib disertai alasan",
    ],
    visual: { kind: "shift" },
  },
  {
    id: "report",
    tab: "Laporan",
    icon: BarChart3,
    title: "Tahu menu yang paling untung, bukan cuma yang paling laku.",
    body: "Omzet, laba kotor, menu terlaris, dan riwayat transaksi tersusun sendiri dari setiap pesanan. Tidak ada lagi rekap manual di akhir hari.",
    points: [
      "Omzet dan laba kotor per periode",
      "Menu terlaris dan tren penjualan",
      "Riwayat transaksi lengkap dengan metode bayar",
    ],
    visual: { kind: "image", src: "/img/landing/dashboard-macbook.webp", alt: "Dashboard laporan Menuin di laptop", w: 1800, h: 1145 },
  },
  {
    id: "outlet",
    tab: "Multi-Outlet",
    icon: Building2,
    title: "Buka cabang baru tanpa mulai dari nol.",
    body: "Kelola beberapa outlet dari satu akun. Tiap outlet punya menu, tim, dan laporannya sendiri, dengan hak akses yang dipisah per peran.",
    points: [
      "Pindah outlet dalam satu klik",
      "Peran Owner, Manajer, Kasir, dan Staf",
      "Data tiap outlet tersimpan terpisah",
    ],
    visual: { kind: "outlet" },
  },
];

function FeatureVisual({ visual }: { visual: Visual }) {
  if (visual.kind === "board") return <OrderBoardPanel />;
  if (visual.kind === "shift") return <ShiftPanel />;
  if (visual.kind === "outlet") return <OutletPanel />;

  return (
    <Image
      src={visual.src}
      alt={visual.alt}
      width={visual.w}
      height={visual.h}
      loading="lazy"
      sizes="(max-width: 1024px) 100vw, 640px"
      className={`h-auto w-full ${visual.narrow ? "mx-auto max-w-[300px]" : ""}`}
    />
  );
}

export default function FeatureShowcase() {
  const [activeId, setActiveId] = useState(features[0].id);
  const active = features.find((f) => f.id === activeId) ?? features[0];

  return (
    <section id="fitur" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <ScrollReveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
            Fitur unggulan
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
            Semua yang dibutuhkan outlet Anda. Tidak lebih.
          </h2>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[#52525b]">
            Enam alat yang dipakai setiap hari, dari meja tamu sampai laporan pemilik, dan
            semuanya membaca data yang sama.
          </p>
        </ScrollReveal>

        {/* Tab: pills yang bisa digeser di layar sempit */}
        <div
          role="tablist"
          aria-label="Fitur unggulan"
          className="-mx-6 mt-12 flex gap-2 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {features.map((f) => {
            const Icon = f.icon;
            const selected = f.id === active.id;
            return (
              <button
                key={f.id}
                role="tab"
                id={`tab-${f.id}`}
                aria-selected={selected}
                aria-controls={`panel-${f.id}`}
                onClick={() => setActiveId(f.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors ${
                  selected
                    ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                    : "border-black/[0.08] text-[#52525b] hover:border-black/20 hover:text-[#0a0a0a]"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.6} />
                {f.tab}
              </button>
            );
          })}
        </div>

        <div
          key={active.id}
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="mt-8 grid grid-cols-1 items-center gap-10 rounded-[28px] border border-black/[0.06] bg-[#fafafa] p-6 animate-in fade-in duration-500 sm:p-10 lg:grid-cols-12 lg:gap-14 lg:p-14"
        >
          <div className="lg:col-span-5">
            <h3 className="max-w-[18ch] text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0a0a0a] text-balance">
              {active.title}
            </h3>
            <p className="mt-5 max-w-[48ch] text-[15.5px] leading-relaxed text-[#52525b]">
              {active.body}
            </p>
            <ul className="mt-7 space-y-3">
              {active.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[14.5px] text-[#0a0a0a]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E59F9]/10">
                    <Check className="h-3 w-3 text-[#0E59F9]" strokeWidth={2.5} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <FeatureVisual visual={active.visual} />
          </div>
        </div>
      </div>
    </section>
  );
}

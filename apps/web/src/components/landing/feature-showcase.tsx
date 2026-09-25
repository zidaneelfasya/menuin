"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Monitor,
  Wallet,
  Package,
  TicketPercent,
  Users,
  Building2,
  Check,
} from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Fitur unggulan — operasional di luar alur pesanan.
 *
 * Alur pesanan (scan, pesan, bayar, dapur, laporan) sudah diceritakan
 * di section Cara kerja. Section ini menjawab pertanyaan berikutnya:
 * "apa lagi yang diurus Menuin?" — kasir, kas, stok, promo, tim, cabang.
 *
 * Klaim dicocokkan dengan kode: stok per produk berkurang saat transaksi
 * (lib/actions/transactions.ts), batas minimum stok (products.minStock),
 * HPP dari products.costPrice, promo berbasis kode dengan minimal belanja,
 * potongan maksimal, dan periode aktif (promotions). Matriks akses di
 * TeamPanel mengikuti daftar `roles` di components/layout/sidebar.tsx.
 *
 * Visual yang bertanda `shot` memakai tangkapan layar aplikasi; sisanya
 * ilustrasi sampai tangkapan layarnya tersedia.
 */

/** Bingkai jendela browser untuk tangkapan layar dashboard. */
function BrowserShot({ src, alt, w, h, url }: { src: string; alt: string; w: number; h: number; url: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex items-center gap-3 border-b border-black/[0.06] bg-[#fafafa] px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-[11px] text-[#71717a] ring-1 ring-black/[0.06]">
          {url}
        </span>
      </div>
      <Image src={src} alt={alt} width={w} height={h} loading="lazy" sizes="(max-width: 1024px) 100vw, 680px" className="block h-auto w-full" />
    </div>
  );
}

function ShiftPanel() {
  const rows = [
    { k: "Modal awal laci", v: "Rp 200.000" },
    { k: "Penjualan tunai", v: "+Rp 1.425.000" },
    { k: "Kas keluar", v: "−Rp 25.000" },
    { k: "Kas seharusnya", v: "Rp 1.600.000" },
    { k: "Uang fisik dihitung", v: "Rp 1.600.000" },
  ];

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
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


/** Daftar stok — sisa, batas minimum, dan HPP per produk. */
function StockPanel() {
  const rows = [
    { name: "Es Kopi Gula Aren", stock: 42, min: 10, cost: "Rp 7.500", price: "Rp 18.000" },
    { name: "Butter Croissant", stock: 4, min: 8, cost: "Rp 9.000", price: "Rp 20.000" },
    { name: "Nasi Goreng Kampung", stock: 18, min: 5, cost: "Rp 14.000", price: "Rp 43.000" },
    { name: "Thai Tea", stock: 0, min: 10, cost: "Rp 6.000", price: "Rp 20.000" },
  ];
  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Stok produk</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-medium text-amber-700">2 perlu diisi ulang</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 px-5 pt-3 text-[11px] uppercase tracking-wider text-[#a1a1aa] sm:grid-cols-[1fr_auto_auto_auto]">
        <span>Produk</span>
        <span className="text-right">Sisa</span>
        <span className="hidden text-right sm:block">HPP</span>
        <span className="text-right">Margin</span>
      </div>
      <ul className="px-5 pb-2">
        {rows.map((r) => {
          const low = r.stock <= r.min;
          const margin = Math.round((1 - Number(r.cost.replace(/\D/g, "")) / Number(r.price.replace(/\D/g, ""))) * 100);
          return (
            <li key={r.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-t border-black/[0.06] py-3 first:border-t-0 sm:grid-cols-[1fr_auto_auto_auto]">
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-[#0a0a0a]">{r.name}</span>
                <span className="text-[11px] text-[#a1a1aa]">Min. {r.min}</span>
              </span>
              <span className={`text-right text-[13px] font-semibold tabular-nums ${r.stock === 0 ? "text-red-600" : low ? "text-amber-600" : "text-[#0a0a0a]"}`}>
                {r.stock === 0 ? "Habis" : r.stock}
              </span>
              <span className="hidden text-right text-[12.5px] tabular-nums text-[#52525b] sm:block">{r.cost}</span>
              <span className="text-right text-[12.5px] font-medium tabular-nums text-emerald-700">{margin}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Daftar kode promo. */
function PromoPanel() {
  const promos = [
    { code: "HAPPYHOUR", name: "Happy hour 14.00–16.00", value: "20%", rule: "Min. belanja Rp 50.000 · maks. Rp 25.000", active: true },
    { code: "NGOPIPAGI", name: "Diskon sarapan", value: "Rp 10.000", rule: "Min. belanja Rp 40.000", active: true },
    { code: "GAJIAN", name: "Promo akhir bulan", value: "15%", rule: "Berlaku 25–31 Okt", active: false },
  ];
  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Diskon & Promo</span>
        <span className="text-[12px] text-[#71717a]">Kasir & katalog online</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {promos.map((p) => (
          <li key={p.code} className="flex items-center gap-4 rounded-xl border border-dashed border-black/[0.12] px-4 py-3">
            <span className="flex h-11 w-[84px] shrink-0 items-center justify-center rounded-lg bg-[#0E59F9]/[0.06] text-[13px] font-semibold tabular-nums text-[#0E59F9]">
              {p.value}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[12.5px] font-semibold tracking-wide text-[#0a0a0a]">{p.code}</span>
              <span className="block truncate text-[11.5px] text-[#71717a]">{p.name} · {p.rule}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-[#71717a]"}`}>
              {p.active ? "Aktif" : "Terjadwal"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Anggota tim dan aksesnya per peran. */
function TeamPanel() {
  const areas = ["Kasir", "Pesanan", "Stok", "Laporan", "Tim"];
  const members = [
    { name: "Andi", role: "Owner", access: [1, 1, 1, 1, 1] },
    { name: "Dimas", role: "Manajer", access: [1, 1, 1, 1, 0] },
    { name: "Sarah", role: "Kasir", access: [1, 1, 0, 0, 0] },
  ];
  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
        <span className="text-[13px] font-semibold text-[#0a0a0a]">Tim & Karyawan</span>
        <span className="text-[12px] text-[#71717a]">3 anggota</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[#a1a1aa]">
              <th className="px-5 pb-2 pt-3 font-medium">Anggota</th>
              {areas.map((a) => (
                <th key={a} className="px-2 pb-2 pt-3 text-center font-medium">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.name} className="border-t border-black/[0.06]">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0E59F9]/10 text-[11.5px] font-semibold text-[#0E59F9]">{m.name.charAt(0)}</span>
                    <span>
                      <span className="block text-[13px] text-[#0a0a0a]">{m.name}</span>
                      <span className="block text-[11px] text-[#71717a]">{m.role}</span>
                    </span>
                  </span>
                </td>
                {m.access.map((on, i) => (
                  <td key={i} className="px-2 py-3 text-center">
                    {on ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                    ) : (
                      <span className="mx-auto block h-px w-3 bg-black/20" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutletPanel() {
  const outlets = [
    { name: "Kopi Ruang Teduh · Dago", omzet: "Rp 4.318.600", active: true },
    { name: "Kopi Ruang Teduh · Setiabudi", omzet: "Rp 3.102.400", active: false },
    { name: "Kopi Ruang Teduh · Antapani", omzet: "Rp 2.487.900", active: false },
  ];

  return (
    <div className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.4)]">
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

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {["Owner", "Manajer", "Kasir"].map((r) => (
          <span key={r} className="rounded-lg bg-[#fafafa] py-2 text-[11.5px] text-[#52525b]">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

type Visual =
  | { kind: "shot"; src: string; alt: string; w: number; h: number; url: string }
  | { kind: "device"; src: string; alt: string; w: number; h: number }
  | { kind: "shift" }
  | { kind: "stock" }
  | { kind: "promo" }
  | { kind: "team" }
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
    id: "pos",
    tab: "Kasir POS",
    icon: Monitor,
    title: "Pelanggan walk-in? Beberapa ketukan, struk tercetak.",
    body: "Tunai, QRIS, debit, kartu, dan transfer di satu layar. Pajak dihitung otomatis dan struk langsung keluar dari printer termal yang sudah Anda punya.",
    points: [
      "Cari produk, pilih varian, bayar",
      "Printer Bluetooth & LAN, 58 dan 80 mm",
      "Pesanan kasir langsung masuk antrean dapur",
    ],
    visual: { kind: "device", src: "/img/landing/pos-ipad.webp", alt: "Kasir POS Menuin di layar tablet", w: 1800, h: 1382 },
  },
  {
    id: "shift",
    tab: "Shift & Kas",
    icon: Wallet,
    title: "Selisih kas ketahuan hari ini, bukan akhir bulan.",
    body: "Setiap shift dibuka dengan modal awal, setiap uang keluar dicatat, dan saat tutup shift isi laci dicocokkan dengan yang seharusnya ada.",
    points: [
      "Modal awal wajib dicatat per shift",
      "Kas masuk dan kas keluar tercatat",
      "Pembatalan transaksi wajib disertai alasan",
    ],
    visual: { kind: "shift" },
  },
  {
    id: "stock",
    tab: "Stok & HPP",
    icon: Package,
    title: "Tahu modal setiap menu, bukan cuma harga jualnya.",
    body: "Stok berkurang otomatis setiap ada penjualan, dan produk yang menyentuh batas minimum langsung ditandai. Dari harga modal, laba kotor terhitung sendiri.",
    points: [
      "Stok berkurang otomatis saat terjual",
      "Tanda stok menipis sesuai batas minimum",
      "HPP dan margin per produk",
    ],
    visual: { kind: "stock" },
  },
  {
    id: "promo",
    tab: "Diskon & Promo",
    icon: TicketPercent,
    title: "Promo happy hour tanpa hitung manual di kasir.",
    body: "Buat kode promo sekali, potongannya terhitung otomatis di kasir maupun di checkout katalog online.",
    points: [
      "Potongan persen atau nominal",
      "Minimal belanja dan batas potongan",
      "Periode aktif yang bisa dijadwalkan",
    ],
    visual: { kind: "promo" },
  },
  {
    id: "team",
    tab: "Tim & Akses",
    icon: Users,
    title: "Kasir cukup membuka kasir. Laporan dan stok tetap di tangan Anda.",
    body: "Undang anggota tim dan beri peran Owner, Manajer, atau Kasir. Setiap orang hanya membuka bagian yang memang jadi tugasnya.",
    points: [
      "Peran Owner, Manajer, dan Kasir",
      "Undang anggota lewat email",
      "Laporan dan stok tertutup untuk kasir",
    ],
    visual: { kind: "team" },
  },
  {
    id: "outlet",
    tab: "Multi-Outlet",
    icon: Building2,
    title: "Buka cabang kedua tanpa mulai dari nol.",
    body: "Kelola beberapa outlet dari satu akun. Tiap outlet punya menu, tim, dan laporannya sendiri, dan pindah antar-outlet cukup satu klik.",
    points: [
      "Pindah outlet dalam satu klik",
      "Menu, tim, dan laporan per cabang",
      "Data tiap outlet tersimpan terpisah",
    ],
    visual: { kind: "outlet" },
  },
];

function FeatureVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "shift":
      return <ShiftPanel />;
    case "stock":
      return <StockPanel />;
    case "promo":
      return <PromoPanel />;
    case "team":
      return <TeamPanel />;
    case "outlet":
      return <OutletPanel />;
    case "shot":
      return <BrowserShot {...visual} />;
    case "device":
      return (
        <Image
          src={visual.src}
          alt={visual.alt}
          width={visual.w}
          height={visual.h}
          loading="lazy"
          sizes="(max-width: 1024px) 100vw, 640px"
          className="h-auto w-full"
        />
      );
  }
}

export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Fitur yang teksnya sedang melintasi tengah layar menjadi fitur aktif;
  // panggung sticky di kanan menampilkan visualnya.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index);
            setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = itemRefs.current[i];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + el.offsetHeight / 2;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="fitur" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <ScrollReveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
            Fitur unggulan
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
            Di luar pesanan, operasional outlet juga ikut rapi.
          </h2>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[#52525b]">
            Satu aplikasi untuk kasir, kas, stok, promo, tim, dan cabang. Tidak perlu lima
            langganan berbeda.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-x-16 lg:mt-8 lg:grid-cols-12">
          {/* Kiri: penjelasan tiap fitur, di-scroll */}
          <div className="lg:col-span-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              const on = i === active;
              return (
                <article
                  key={f.id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  data-index={i}
                  className="border-t border-black/[0.08] py-12 first:border-t-0 lg:flex lg:min-h-[78vh] lg:items-center lg:border-t-0 lg:py-0"
                >
                  <div
                    className={`transition-opacity duration-500 ${on ? "lg:opacity-100" : "lg:opacity-30"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-500 ${
                          on ? "bg-[#0E59F9] text-white" : "bg-[#0E59F9]/[0.08] text-[#0E59F9]"
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E59F9]">
                        {f.tab}
                      </span>
                      <span className="ml-auto text-[12px] tabular-nums text-[#a1a1aa]">
                        {String(i + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 max-w-[20ch] text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.12] tracking-[-0.035em] text-[#0a0a0a] text-balance">
                      {f.title}
                    </h3>
                    <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-[#52525b]">
                      {f.body}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-[14.5px] text-[#0a0a0a]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E59F9]/10">
                            <Check className="h-3 w-3 text-[#0E59F9]" strokeWidth={2.5} />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>

                    {/* Layar sempit: visual ikut di bawah teksnya */}
                    <div className="mt-8 rounded-[24px] bg-[#fafafa] p-4 ring-1 ring-black/[0.05] sm:p-6 lg:hidden">
                      <FeatureVisual visual={f.visual} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Kanan: panggung sticky, visual berganti mengikuti fitur aktif */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-[64px] flex h-[calc(100vh-64px)] flex-col justify-center py-8">
              <div className="relative">
                {/* Navigasi kecil */}
                <div className="mb-8 flex flex-wrap gap-1.5">
                  {features.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                        i === active
                          ? "bg-[#0a0a0a] text-white"
                          : "text-[#71717a] hover:bg-black/[0.04] hover:text-[#0a0a0a]"
                      }`}
                    >
                      {f.tab}
                    </button>
                  ))}
                </div>

                {/* Semua visual ditumpuk di sel yang sama; hanya yang aktif terlihat */}
                <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
                  {features.map((f, i) => (
                    <div
                      key={f.id}
                      aria-hidden={i !== active}
                      className={`self-center transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        i === active
                          ? "translate-y-0 scale-100 opacity-100"
                          : `pointer-events-none scale-[0.97] opacity-0 ${i < active ? "-translate-y-6" : "translate-y-6"}`
                      }`}
                    >
                      <FeatureVisual visual={f.visual} />
                    </div>
                  ))}
                </div>

                {/* Progres */}
                <div className="mt-8 flex gap-1.5" aria-hidden="true">
                  {features.map((f, i) => (
                    <span
                      key={f.id}
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        i <= active ? "bg-[#0E59F9]" : "bg-black/[0.08]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

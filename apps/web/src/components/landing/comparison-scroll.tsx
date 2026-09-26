"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Printer, Smartphone, User, X } from "lucide-react";

/**
 * Sebelum dan sesudah — "satu hari di outlet".
 *
 * Panggung sticky setinggi layar. Kiri: jam yang berjalan mengikuti scroll
 * dan masalah yang sedang dibahas. Kanan: tumpukan kartu. Setiap masalah
 * punya dua babak: kartu "Tanpa Menuin" muncul lebih dulu, lalu kartu
 * "Dengan Menuin" naik menutupinya sementara kartu lama mundur ke belakang.
 *
 * Progres dihitung dari posisi scroll kontainer tinggi (tanpa pin GSAP),
 * jadi tidak ada spacer yang perlu dihitung ulang. Di layar sempit semua
 * masalah tampil sebagai pasangan kartu bertumpuk biasa.
 */

/* ------------------------------------------------------------------ */
/* Visual "Dulu"                                                       */
/* ------------------------------------------------------------------ */

function OldNote() {
  return (
    <div className="relative mx-auto w-[210px] rotate-[-4deg] rounded-sm bg-[#fffdf5] px-5 py-4 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06]">
      <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-amber-200/70" />
      <p className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa]">Meja 12</p>
      <p className="mt-2 font-serif text-[17px] italic leading-snug text-[#52525b]">
        2 es kopi aren
        <br />
        <span className="relative">
          tnp gula?
          <span className="absolute -inset-x-1 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#a1a1aa]/40 blur-[2px]" />
        </span>
        <br />1 croisan
      </p>
    </div>
  );
}

function OldQueue() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-1 sm:gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4d4d8] sm:h-9 sm:w-9"
            style={{ transform: `translateY(${i % 2 ? 3 : 0}px)` }}
          >
            <User className="h-3.5 w-3.5 text-[#71717a] sm:h-4 sm:w-4" />
          </span>
        ))}
        <span className="ml-1.5 rounded-md bg-[#a1a1aa] px-2 py-2.5 text-[9.5px] sm:ml-2 sm:px-2.5 sm:py-3 sm:text-[10px] font-semibold uppercase tracking-wider text-white">
          Kasir
        </span>
      </div>
      <p className="mt-4 text-[12px] tabular-nums text-[#71717a]">7 orang menunggu · 12.15</p>
    </div>
  );
}

function OldCash() {
  return (
    <div className="mx-auto w-[240px] rounded-xl bg-white/70 p-4 ring-1 ring-black/[0.06]">
      {[
        ["Kas seharusnya", "Rp 1.600.000"],
        ["Uang di laci", "Rp 1.550.000"],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between py-1.5 text-[12.5px] text-[#71717a]">
          <span>{k}</span>
          <span className="tabular-nums">{v}</span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
        <span className="text-[12.5px] text-red-700">Selisih</span>
        <span className="text-[14px] font-semibold tabular-nums text-red-600">−Rp 50.000 ?</span>
      </div>
    </div>
  );
}

function OldRecap() {
  return (
    <div className="relative mx-auto h-[150px] w-[240px]">
      {[-10, 6, -3, 9].map((r, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-4 h-[110px] w-[90px] rounded-sm bg-[#fffdf5] p-2 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.06]"
          style={{ transform: `translateX(${-45 + (i - 1.5) * 34}px) rotate(${r}deg)` }}
        >
          {Array.from({ length: 6 }).map((_, j) => (
            <span key={j} className="mb-1.5 block h-[3px] rounded bg-[#d4d4d8]" style={{ width: `${60 + ((i + j) % 3) * 15}%` }} />
          ))}
        </div>
      ))}
      <span className="absolute bottom-0 right-2 rounded-full bg-[#27272a] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white">
        23.40
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visual "Dengan Menuin"                                              */
/* ------------------------------------------------------------------ */

function NewTicket() {
  return (
    <div className="mx-auto w-[230px] rounded-xl bg-white p-4 shadow-[var(--landing-lift-lg)] ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#0a0a0a]">Tiket dapur · Meja 12</span>
        <Printer className="h-3.5 w-3.5 text-[#0E59F9]" />
      </div>
      <div className="mt-3 space-y-2 text-[12.5px]">
        <div>
          <p className="text-[#0a0a0a]">2× Es Kopi Gula Aren</p>
          <p className="mt-0.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">
            Tanpa gula
          </p>
        </div>
        <p className="text-[#0a0a0a]">1× Butter Croissant</p>
      </div>
    </div>
  );
}

function NewTables() {
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-4 gap-2.5">
        {[2, 4, 7, 9, 11, 12, 14, 15].map((n, i) => (
          <span
            key={n}
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-xl text-[10px] ${
              i % 3 === 1 ? "bg-[#fafafa] text-[#a1a1aa] ring-1 ring-black/[0.06]" : "bg-[#0E59F9]/[0.08] text-[#0E59F9]"
            }`}
          >
            <span className="text-[12px] font-semibold tabular-nums">{n}</span>
            {i % 3 !== 1 && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-[#52525b]">Dibayar dari meja lewat QRIS</p>
    </div>
  );
}

function NewCash() {
  return (
    <div className="mx-auto w-[240px] rounded-xl bg-white p-4 shadow-[var(--landing-lift-lg)] ring-1 ring-black/[0.06]">
      {[
        ["Modal awal", "Rp 200.000"],
        ["Penjualan tunai", "+Rp 1.425.000"],
        ["Kas keluar", "−Rp 25.000"],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between py-1 text-[12.5px]">
          <span className="text-[#52525b]">{k}</span>
          <span className="tabular-nums text-[#0a0a0a]">{v}</span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
        <span className="text-[12.5px] text-emerald-900">Selisih</span>
        <span className="text-[14px] font-semibold tabular-nums text-emerald-700">Rp 0</span>
      </div>
    </div>
  );
}

function NewRecap() {
  const bars = [38, 52, 44, 61, 73, 58, 86];
  return (
    <div className="mx-auto w-[200px] rounded-[26px] bg-[#0a0a0a] p-[5px] shadow-[var(--landing-lift-lg)]">
      <div className="rounded-[21px] bg-white px-4 pb-4 pt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold tabular-nums text-[#0a0a0a]">
          <span>21.05</span>
          <Smartphone className="h-3 w-3 text-[#a1a1aa]" />
        </div>
        <p className="mt-3 text-[10.5px] text-[#71717a]">Omzet hari ini</p>
        <p className="text-[17px] font-semibold tabular-nums tracking-[-0.02em] text-[#0a0a0a]">Rp 4.318.600</p>
        <div className="mt-3 flex h-12 items-end gap-1" aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-sm ${i === bars.length - 1 ? "bg-[#0E59F9]" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[10.5px] text-emerald-700">Laba kotor 60,2%</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const items = [
  {
    time: "12.15",
    moment: "Jam makan siang",
    topic: "Pesanan salah",
    before: "Catatan \u201ctanpa gula\u201d hilang di antara kasir dan dapur.",
    after: "Catatan tamu sampai ke dapur persis seperti yang ditulis.",
    oldVisual: <OldNote />,
    newVisual: <NewTicket />,
  },
  {
    time: "13.30",
    moment: "Antrean memuncak",
    topic: "Antrean kasir",
    before: "Antrean memanjang dan tamu mulai pergi.",
    after: "Tamu bayar dari meja. Kasir fokus melayani yang datang langsung.",
    oldVisual: <OldQueue />,
    newVisual: <NewTables />,
  },
  {
    time: "21.40",
    moment: "Tutup shift",
    topic: "Kas selisih",
    before: "Uang laci kurang dan tidak ada yang tahu sebabnya.",
    after: "Setiap rupiah tercatat, dari modal awal sampai tutup shift.",
    oldVisual: <OldCash />,
    newVisual: <NewCash />,
  },
  {
    time: "23.40",
    moment: "Setelah tutup",
    topic: "Rekap malam",
    before: "Pemilik merekap nota sampai larut malam.",
    after: "Omzet dan laba tersusun sendiri, sudah bisa dicek sejak tadi.",
    oldVisual: <OldRecap />,
    newVisual: <NewRecap />,
  },
];

/* ------------------------------------------------------------------ */
/* Kartu                                                               */
/* ------------------------------------------------------------------ */

function StoryCard({
  tone,
  text,
  visual,
  large = false,
}: {
  tone: "old" | "new";
  text?: string;
  visual: React.ReactNode;
  large?: boolean;
}) {
  const isNew = tone === "new";
  return (
    <div
      className={`flex h-full flex-col rounded-[28px] p-6 sm:p-8 ${
        isNew
          ? "bg-white shadow-[0_40px_80px_-40px_rgba(14,89,249,0.45)] ring-1 ring-[#0E59F9]/15"
          : "bg-[#f6f3ec] shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.06]"
      }`}
    >
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
          isNew ? "bg-[#0E59F9] text-white" : "bg-black/[0.07] text-[#71717a]"
        }`}
      >
        {isNew ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
        {isNew ? "Dengan Menuin" : "Tanpa Menuin"}
      </span>
      <div className={`flex flex-1 items-center justify-center py-6 ${isNew ? "" : "grayscale-[0.5]"}`}>
        <div className={large ? "scale-[1.35]" : ""}>{visual}</div>
      </div>
      {text && (
      <p
        className={`text-[clamp(16px,1.5vw,19px)] leading-snug tracking-[-0.015em] ${
          isNew ? "font-medium text-[#0a0a0a]" : "text-[#71717a]"
        }`}
      >
        {text}
      </p>
      )}
    </div>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Posisi "jatuh" tiap kartu di tumpukan — sedikit acak supaya terasa kertas. */
const PILE = [
  { r: -4, x: -10, fromX: -60, spin: -14 },
  { r: 3, x: 12, fromX: 70, spin: 12 },
  { r: -2, x: -4, fromX: -40, spin: -10 },
  { r: 5, x: 8, fromX: 80, spin: 16 },
  { r: -5, x: -14, fromX: -70, spin: -12 },
  { r: 2, x: 6, fromX: 50, spin: 10 },
  { r: -3, x: -8, fromX: -55, spin: -14 },
  { r: 4, x: 10, fromX: 65, spin: 12 },
];
const smooth = (v: number) => v * v * (3 - 2 * v);

export default function ComparisonScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setP(total > 0 ? clamp01(-r.top / total) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const n = items.length;
  // Tumpukan berisi 2n kartu: Tanpa₁, Dengan₁, Tanpa₂, Dengan₂, …
  // s berjalan 0 → 2n-1; kartu ke-k jatuh ke tumpukan saat s melewati k-1 → k.
  const cards = items.flatMap((it, i) => [
    { key: `old-${i}`, tone: "old" as const, visual: it.oldVisual },
    { key: `new-${i}`, tone: "new" as const, visual: it.newVisual },
  ]);
  const s = p * (cards.length - 1) * 1.08; // sedikit jeda di akhir
  const active = s < 1 ? 0 : Math.min(n - 1, Math.floor((s + 1) / 2));
  const reveal = smooth(clamp01(s - 2 * active));
  const local = clamp01((s - (2 * active - 1)) / 2);
  const item = items[active];

  return (
    <section className="relative border-t border-black/[0.06] bg-[#fafafa]">
      {/* Desktop: panggung sticky */}
      <div ref={trackRef} className="relative hidden lg:block" style={{ height: `${n * 100 + 40}vh` }}>
        <div className="sticky top-[64px] flex h-[calc(100vh-64px)] items-center">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-12 items-center gap-12 px-6">
            {/* Kiri */}
            <div className="col-span-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                Sebelum dan sesudah
              </p>
              <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] text-balance">
                Satu hari di outlet, dua cara menjalaninya.
              </h2>

              {/* Jam */}
              <div className="mt-10 flex items-end gap-4">
                <span
                  key={item.time}
                  className="animate-in fade-in slide-in-from-bottom-2 text-[clamp(56px,6vw,84px)] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[#0a0a0a] duration-500"
                >
                  {item.time}
                </span>
                <span className="pb-2 text-[14px] text-[#71717a]">{item.moment}</span>
              </div>

              {/* Masalah aktif */}
              <div key={item.topic} className="mt-6 min-h-[132px] animate-in fade-in duration-500">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E59F9]">
                  {String(active + 1).padStart(2, "0")} · {item.topic}
                </p>
                <p
                  className="mt-3 max-w-[40ch] text-[16px] leading-relaxed text-[#71717a] decoration-[#a1a1aa]"
                  style={{ textDecorationLine: reveal > 0.2 ? "line-through" : "none", opacity: 1 - reveal * 0.45 }}
                >
                  {item.before}
                </p>
                <p
                  className="mt-2 max-w-[40ch] text-[19px] font-medium leading-snug tracking-[-0.015em] text-[#0a0a0a] transition-none"
                  style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 10}px)` }}
                >
                  {item.after}
                </p>
              </div>

              {/* Linimasa */}
              <ol className="mt-8 grid grid-cols-4 gap-2">
                {items.map((it, i) => {
                  const fill = i < active ? 1 : i === active ? local : 0;
                  return (
                    <li key={it.time}>
                      <span className="block h-1 overflow-hidden rounded-full bg-black/[0.08]">
                        <span className="block h-full bg-[#0E59F9]" style={{ width: `${fill * 100}%` }} />
                      </span>
                      <span
                        className={`mt-2 block text-[12px] tabular-nums ${
                          i === active ? "font-medium text-[#0a0a0a]" : "text-[#a1a1aa]"
                        }`}
                      >
                        {it.time}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Kanan: tumpukan kartu */}
            <div className="col-span-7">
              <div className="relative mx-auto h-[min(62vh,500px)] w-full max-w-[540px]">
                {cards.map((c, k) => {
                  const inT = k === 0 ? 1 : smooth(clamp01(s - (k - 1)));
                  if (inT <= 0) return null;
                  const depth = Math.max(0, s - k); // berapa kartu sudah menimpanya
                  if (depth > 4.5) return null;
                  const rest = PILE[k % PILE.length];
                  const falling = 1 - inT;
                  const settle = Math.min(depth, 4);
                  return (
                    <div
                      key={c.key}
                      className="absolute inset-0 will-change-transform"
                      style={{
                        zIndex: k,
                        transform: [
                          `translate(${rest.x + falling * rest.fromX}px, ${falling * 115 - settle * 3}%)`,
                          `rotate(${rest.r + falling * rest.spin}deg)`,
                          `scale(${1 - settle * 0.035})`,
                        ].join(" "),
                        opacity: depth > 3.5 ? clamp01(4.5 - depth) : 1,
                        filter: `brightness(${1 - Math.min(settle, 3) * 0.04})`,
                      }}
                    >
                      <StoryCard tone={c.tone} visual={c.visual} large />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layar sempit: pasangan kartu bertumpuk */}
      <div className="px-6 py-24 lg:hidden">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
          Sebelum dan sesudah
        </p>
        <h2 className="mt-4 max-w-[18ch] text-[clamp(28px,7vw,36px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Satu hari di outlet, dua cara menjalaninya.
        </h2>
        <ol className="mt-10 space-y-12">
          {items.map((it, i) => (
            <li key={it.time}>
              <div className="flex items-baseline gap-3">
                <span className="text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-[#0a0a0a]">{it.time}</span>
                <span className="text-[13px] text-[#71717a]">
                  {String(i + 1).padStart(2, "0")} · {it.topic}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-[340px]">
                  <StoryCard tone="old" text={it.before} visual={it.oldVisual} />
                </div>
                <div className="relative z-10 -mt-10 ml-4 h-[340px]">
                  <StoryCard tone="new" text={it.after} visual={it.newVisual} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

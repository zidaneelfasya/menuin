"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ChevronsLeftRight, Printer, Smartphone, User } from "lucide-react";

/**
 * Sebelum dan sesudah — empat masalah jam sibuk.
 *
 * Setiap kartu adalah slider before/after yang dijalankan scroll: kartu
 * masuk dalam keadaan "Dulu" (kusam, berantakan), lalu saat mendekati
 * tengah layar lapisan "Dengan Menuin" menyapu dari kiri dengan garis
 * pembatas biru. Isi kedua lapisan berupa gambaran kecil, bukan kalimat
 * yang dicoret, supaya perubahannya terlihat, bukan hanya terbaca.
 *
 * Tanpa JS atau dengan reduced-motion, kartu langsung tampil dalam
 * keadaan "Dengan Menuin".
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
    topic: "Pesanan salah",
    before: "Catatan “tanpa gula” hilang di antara kasir dan dapur.",
    after: "Catatan tamu sampai ke dapur persis seperti yang ditulis.",
    oldVisual: <OldNote />,
    newVisual: <NewTicket />,
  },
  {
    topic: "Antrean kasir",
    before: "Antrean memanjang setiap jam makan siang.",
    after: "Tamu bayar dari meja. Kasir fokus melayani yang datang langsung.",
    oldVisual: <OldQueue />,
    newVisual: <NewTables />,
  },
  {
    topic: "Kas selisih",
    before: "Uang laci kurang dan tidak ada yang tahu sebabnya.",
    after: "Setiap rupiah tercatat, dari modal awal sampai tutup shift.",
    oldVisual: <OldCash />,
    newVisual: <NewCash />,
  },
  {
    topic: "Rekap malam",
    before: "Pemilik merekap nota sampai larut malam.",
    after: "Omzet dan laba tersusun sendiri, bisa dicek dari ponsel.",
    oldVisual: <OldRecap />,
    newVisual: <NewRecap />,
  },
];

/* ------------------------------------------------------------------ */
/* Kartu                                                               */
/* ------------------------------------------------------------------ */

function Layer({
  tone,
  index,
  topic,
  text,
  visual,
}: {
  tone: "old" | "new";
  index: number;
  topic: string;
  text: string;
  visual: React.ReactNode;
}) {
  const isNew = tone === "new";
  return (
    <div
      className={`flex h-full flex-col p-6 sm:p-8 ${
        isNew ? "bg-gradient-to-br from-white via-white to-[#eef4ff]" : "bg-[#f1f1f2]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-baseline gap-2.5">
          <span className={`text-[13px] tabular-nums ${isNew ? "text-[#0E59F9]" : "text-[#a1a1aa]"}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={`text-[15px] font-semibold tracking-[-0.01em] ${isNew ? "text-[#0a0a0a]" : "text-[#71717a]"}`}>
            {topic}
          </span>
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${
            isNew ? "bg-[#0E59F9] text-white" : "bg-black/[0.06] text-[#71717a]"
          }`}
        >
          {isNew ? "Dengan Menuin" : "Dulu"}
        </span>
      </div>

      <div className={`flex flex-1 items-center justify-center py-8 ${isNew ? "" : "grayscale-[0.4]"}`}>
        {visual}
      </div>

      <p
        className={`text-[clamp(17px,1.6vw,20px)] leading-snug tracking-[-0.015em] ${
          isNew ? "font-medium text-[#0a0a0a]" : "text-[#71717a]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CompareCard({ item, index }: { item: (typeof items)[number]; index: number }) {
  return (
    <article
      data-compare-card
      className="relative h-[430px] overflow-hidden rounded-[28px] ring-1 ring-black/[0.06] sm:h-[460px]"
    >
      {/* Lapisan bawah: kondisi dulu */}
      <div className="absolute inset-0">
        <Layer tone="old" index={index} topic={item.topic} text={item.before} visual={item.oldVisual} />
      </div>

      {/* Lapisan atas: dengan Menuin, dibuka oleh clip-path */}
      <div data-compare-new className="absolute inset-0" style={{ clipPath: "inset(0 0 0 0)" }}>
        <Layer tone="new" index={index} topic={item.topic} text={item.after} visual={item.newVisual} />
      </div>

      {/* Garis pembatas + pegangan */}
      <div
        data-compare-handle
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-full w-0 opacity-0"
      >
        <span className="absolute inset-y-0 -left-px w-[2px] bg-[#0E59F9]" />
        <span className="absolute left-0 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0E59F9] text-white shadow-[0_8px_20px_-6px_rgba(14,89,249,0.6)]">
          <ChevronsLeftRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

export default function ComparisonScroll() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-compare-card]", rootRef.current);
      const ease = gsap.parseEase("power1.inOut");

      const triggers = cards.map((card) => {
        const layer = card.querySelector<HTMLElement>("[data-compare-new]")!;
        const handle = card.querySelector<HTMLElement>("[data-compare-handle]")!;

        // p = 0: semua "Dulu"; p = 1: semua "Dengan Menuin".
        const set = (p: number) => {
          const pct = p * 100;
          layer.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
          handle.style.left = `${pct}%`;
          handle.style.opacity = p > 0.01 && p < 0.99 ? "1" : "0";
        };
        set(0);

        return ScrollTrigger.create({
          trigger: card,
          start: "top 75%",
          end: "top 25%",
          onUpdate: (self) => set(ease(self.progress)),
          onRefresh: (self) => set(ease(self.progress)),
        });
      });

      return () => {
        triggers.forEach((t) => t.kill());
        cards.forEach((card) => {
          const layer = card.querySelector<HTMLElement>("[data-compare-new]");
          const handle = card.querySelector<HTMLElement>("[data-compare-handle]");
          if (layer) layer.style.clipPath = "inset(0 0 0 0)";
          if (handle) handle.style.opacity = "0";
        });
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Sebelum dan sesudah
            </p>
            <h2 className="mt-4 max-w-[18ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
              Yang biasanya bikin pusing di jam sibuk, sekarang beres sendiri.
            </h2>
          </div>
          <p className="max-w-[44ch] text-[16px] leading-relaxed text-[#52525b] md:col-span-5 md:justify-self-end">
            Empat masalah yang paling sering dikeluhkan pemilik outlet. Gulir untuk melihat apa
            yang berubah.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {items.map((item, i) => (
            <CompareCard key={item.topic} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Perbandingan cara lama vs Menuin.
 *
 * Versi sebelumnya menaruh keduanya berdampingan dengan coretan di kolom
 * kiri — terbaca datar, karena mata membaca sepuluh kalimat sekaligus dan
 * tidak merasakan bedanya.
 *
 * Di sini pembaca yang memilih sisinya. Satu saklar mengganti seluruh
 * daftar, jadi kontrasnya terasa sebagai perubahan, bukan sebagai tabel.
 */

const rows = [
  {
    topic: "Memesan",
    before: "Tamu melambaikan tangan menunggu pelayan datang membawa buku menu.",
    after: "Tamu memindai QR di meja, membuka menu berfoto, dan memesan saat itu juga.",
    metricBefore: "4–8 menit",
    metricAfter: "Saat itu juga",
  },
  {
    topic: "Membayar",
    before: "Antrean pembayaran menumpuk di kasir saat jam makan siang.",
    after: "Tamu membayar dari meja lewat QRIS. Kasir fokus pada pesanan takeaway.",
    metricBefore: "Satu antrean",
    metricAfter: "Tanpa antre",
  },
  {
    topic: "Catatan pesanan",
    before: 'Pesanan salah masak karena catatan tangan "sambal dipisah" terlewat.',
    after: "Catatan tamu tampil persis di layar dapur dan tercetak di struk.",
    metricBefore: "Tulisan tangan",
    metricAfter: "Teks digital",
  },
  {
    topic: "Tutup shift",
    before: "Uang laci tekor saat pergantian shift dan sumbernya tidak ketahuan.",
    after: "Modal awal, kas keluar, dan hitungan fisik direkonsiliasi sistem.",
    metricBefore: "Dicatat manual",
    metricAfter: "Tercatat otomatis",
  },
  {
    topic: "Mengawasi",
    before: "Pemilik tidak berani meninggalkan outlet saat jam ramai.",
    after: "Omzet tiap cabang bisa dipantau dari ponsel secara langsung.",
    metricBefore: "Harus di tempat",
    metricAfter: "Dari mana saja",
  },
];

type Side = "before" | "after";

export default function ComparisonSwitch() {
  const [side, setSide] = useState<Side>("after");
  const listRef = useRef<HTMLUListElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = listRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-row-body]",
        { opacity: 0, y: side === "after" ? 14 : -14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.045 }
      );
    }, el);

    return () => ctx.revert();
  }, [side]);

  return (
    <section className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[18ch] font-display text-[clamp(28px,3.8vw,44px)] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0a0a0a] text-balance">
            Lima hal yang berubah sejak hari pertama.
          </h2>

          {/* Saklar: pembaca memilih sisi mana yang ingin dilihat */}
          <div
            role="tablist"
            aria-label="Bandingkan cara lama dan Menuin"
            className="inline-flex shrink-0 rounded-full border border-black/[0.08] bg-white p-1"
          >
            {(
              [
                ["before", "Cara lama"],
                ["after", "Dengan Menuin"],
              ] as [Side, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={side === key}
                onClick={() => setSide(key)}
                className={`rounded-full px-5 py-2 text-[13.5px] font-medium transition-colors ${
                  side === key
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#52525b] hover:text-[#0a0a0a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul ref={listRef} className="mt-14 border-t border-black/[0.08]">
          {rows.map((row, i) => (
            <li
              key={row.topic}
              className="group grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-black/[0.08] py-7 transition-colors hover:bg-white md:grid-cols-12"
            >
              <span className="font-display text-[13px] tabular-nums text-[#a1a1aa] md:col-span-1">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span className="text-[13px] uppercase tracking-[0.12em] text-[#71717a] md:col-span-2">
                {row.topic}
              </span>

              <p
                data-row-body
                className={`text-[16px] leading-relaxed md:col-span-6 ${
                  side === "before" ? "text-[#a1a1aa]" : "text-[#0a0a0a]"
                }`}
              >
                {side === "before" ? row.before : row.after}
              </p>

              <span
                data-row-body
                className={`justify-self-start rounded-full px-3 py-1 text-[12.5px] font-medium md:col-span-3 md:justify-self-end ${
                  side === "before"
                    ? "bg-black/[0.04] text-[#71717a]"
                    : "bg-[#0E59F9]/[0.08] text-[#0E59F9]"
                }`}
              >
                {side === "before" ? row.metricBefore : row.metricAfter}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

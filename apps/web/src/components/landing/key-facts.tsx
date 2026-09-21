"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Empat angka kunci.
 *
 * Catatan revisi:
 * - Catatan kaki berisi bantahan ("bukan jaminan SLA") dibuang bersama
 *   angka yang menuntutnya. Empat angka di sini benar menurut definisi
 *   produknya sendiri, jadi tidak butuh pagar hukum.
 * - Latar gelap dibatalkan. Bidang hitam yang muncul mendadak di tengah
 *   halaman terang terbaca sebagai potongan dari desain lain, bukan
 *   sebagai jeda berirama.
 *
 * Yang memberi section ini bobot sekarang adalah garis yang ditarik oleh
 * scroll: garis mengisi dari kiri ke kanan dan tiap angka menyala saat
 * garis melewatinya.
 */

const facts = [
  { value: "4", unit: "layar", label: "Meja, kasir, dapur, dan pemilik membaca pesanan yang sama." },
  { value: "0", unit: "aplikasi", label: "Tamu cukup memindai QR. Tidak ada yang perlu dipasang." },
  { value: "Rp 0", unit: "", label: "Komisi per transaksi. Langganan dihitung per outlet, per bulan." },
  { value: "58/80", unit: "mm", label: "Printer termal Bluetooth dan LAN yang sudah Anda punya." },
];

export default function KeyFacts() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = rootRef.current;
      if (!el) return;

      const line = el.querySelector<HTMLElement>("[data-line]");
      const items = gsap.utils.toArray<HTMLElement>("[data-fact]", el);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 78%",
          end: "bottom 65%",
          scrub: 0.8,
        },
      });

      // Garis ditarik oleh scroll; angka menyala menyusul di belakangnya.
      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: items.length });

      items.forEach((item, i) => {
        tl.fromTo(
          item,
          { opacity: 0.12, y: 16 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.6 },
          i * 0.85
        );
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="px-6 py-24 md:py-28" aria-label="Angka kunci">
      <div className="mx-auto max-w-[1280px]">
        {/* Rel yang ditarik scroll */}
        <div className="relative h-px w-full bg-black/[0.08]">
          <div
            data-line
            className="absolute inset-0 origin-left bg-[#0a0a0a]"
            aria-hidden="true"
          />
        </div>

        <div className="grid grid-cols-1 gap-y-12 pt-10 sm:grid-cols-2 md:grid-cols-4 md:gap-x-8">
          {facts.map((f, i) => (
            <div
              key={f.value + f.unit}
              data-fact
              className={`md:px-8 ${i > 0 ? "md:border-l md:border-black/[0.08]" : "md:pl-0"} ${
                i === facts.length - 1 ? "md:pr-0" : ""
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[clamp(44px,5vw,64px)] font-semibold leading-none tracking-[-0.045em] tabular-nums text-[#0a0a0a]">
                  {f.value}
                </span>
                {f.unit && (
                  <span className="font-display text-[16px] font-medium text-[#a1a1aa]">
                    {f.unit}
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-[#52525b]">
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

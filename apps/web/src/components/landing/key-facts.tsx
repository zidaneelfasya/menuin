"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Angka kunci.
 *
 * Versi sebelumnya memajang catatan kaki berisi bantahan ("bukan jaminan
 * SLA", "selisih tetap mungkin terjadi") — itu bahasa halaman syarat &
 * ketentuan, bukan halaman jualan. Akar masalahnya bukan catatan kakinya,
 * melainkan angkanya: klaim latensi dan target selisih kas memang menuntut
 * pagar hukum.
 *
 * Empat angka di bawah ini benar menurut definisi produknya sendiri, jadi
 * tidak butuh pagar apa pun.
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

      const items = el.querySelectorAll("[data-fact]");
      const tween = gsap.from(items, {
        opacity: 0,
        yPercent: 40,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: "top 80%", once: true },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="bg-[#0b0b0c] px-6 py-20 text-white md:py-24"
      aria-label="Angka kunci"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 md:grid-cols-4 md:gap-x-8">
          {facts.map((f, i) => (
            <div
              key={f.value + f.unit}
              data-fact
              className={`md:px-8 ${i > 0 ? "md:border-l md:border-white/12" : "md:pl-0"} ${
                i === facts.length - 1 ? "md:pr-0" : ""
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[clamp(44px,5vw,64px)] font-semibold leading-none tracking-[-0.045em] tabular-nums">
                  {f.value}
                </span>
                {f.unit && (
                  <span className="font-display text-[16px] font-medium text-white/45">
                    {f.unit}
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-white/60">
                {f.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

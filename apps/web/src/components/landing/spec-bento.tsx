"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * "Di balik layarnya" — klaim teknis.
 *
 * Versi sebelumnya empat kotak berisi ikon dan paragraf, dengan ruang
 * kosong besar di kotak yang lebar. Klaim teknis lebih meyakinkan kalau
 * ditunjukkan daripada dikatakan, jadi tiap kotak sekarang berisi demo
 * kecil dari hal yang diklaimnya.
 */

/** Status pesanan berpindah sendiri — memperlihatkan sinkronisasi realtime. */
function RealtimeDemo() {
  const steps = ["Diterima", "Disiapkan", "Siap", "Selesai"];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(1);
      return;
    }
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), 1600);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="mt-7 space-y-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              i <= active ? "bg-[#0E59F9]" : "bg-black/[0.08]"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {["Ponsel tamu", "Layar kasir", "Layar dapur"].map((screen) => (
          <div key={screen} className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[12.5px] text-[#52525b]">{screen}</span>
            <span className="font-display text-[12.5px] font-medium tabular-nums text-[#0a0a0a]">
              {steps[active]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Perangkat yang didukung, digambar sebagai layar dengan rasio berbeda. */
function DeviceDemo() {
  const devices = [
    { name: "iPad", w: "w-14", h: "h-10" },
    { name: "Android", w: "w-6", h: "h-11" },
    { name: "Laptop", w: "w-16", h: "h-10" },
    { name: "Ponsel", w: "w-5", h: "h-9" },
  ];

  return (
    <div className="mt-7 flex items-end gap-3" aria-hidden="true">
      {devices.map((d) => (
        <div key={d.name} className="flex flex-col items-center gap-2">
          <div
            className={`${d.w} ${d.h} rounded-md border border-black/[0.12] bg-white shadow-[var(--landing-lift)]`}
          >
            <div className="m-1 h-1 w-3 rounded-full bg-[#0E59F9]/30" />
          </div>
          <span className="text-[11px] text-[#71717a]">{d.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Nomor kartu yang tersamar — kredensial tidak singgah di sistem kami. */
function PaymentDemo() {
  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5">
        <span className="font-display text-[14px] tracking-[0.18em] tabular-nums text-[#0a0a0a]">
          •••• •••• •••• 4821
        </span>
        <span className="text-[11px] text-[#71717a]">Midtrans</span>
      </div>
      <p className="text-[12.5px] text-[#71717a]">
        Menuin hanya menyimpan token transaksi, tidak pernah nomor kartunya.
      </p>
    </div>
  );
}

/** Dua outlet dengan tenant ID berbeda — pemisahan data di level basis data. */
function TenantDemo() {
  const tenants = [
    { name: "Kopi Ruang Teduh", id: "t_9f2e…a14" },
    { name: "Sweet Crust Bakery", id: "t_41bd…c07" },
  ];

  return (
    <div className="mt-7 space-y-2">
      {tenants.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5"
        >
          <span className="text-[13px] text-[#0a0a0a]">{t.name}</span>
          <span className="font-mono text-[11.5px] text-[#71717a]">{t.id}</span>
        </div>
      ))}
      <p className="text-[12.5px] text-[#71717a]">
        Setiap query membawa tenant ID-nya sendiri. Data cabang tidak pernah bertemu.
      </p>
    </div>
  );
}

const tiles = [
  {
    kicker: "Realtime",
    title: "Satu status, tiga layar, tanpa refresh",
    demo: <RealtimeDemo />,
    wide: true,
  },
  {
    kicker: "Perangkat",
    title: "Jalan di layar yang sudah Anda punya",
    demo: <DeviceDemo />,
    wide: false,
  },
  {
    kicker: "Pembayaran",
    title: "Kartu tidak singgah di sistem kami",
    demo: <PaymentDemo />,
    wide: false,
  },
  {
    kicker: "Multi-tenant",
    title: "Data tiap outlet terpisah di level basis data",
    demo: <TenantDemo />,
    wide: true,
  },
];

export default function SpecBento() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = rootRef.current;
      if (!el) return;

      const tween = gsap.from(el.querySelectorAll("[data-tile]"), {
        opacity: 0,
        y: 22,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 78%", once: true },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-t border-black/[0.06] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="max-w-[20ch] font-display text-[clamp(28px,3.8vw,44px)] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0a0a0a] text-balance">
          Di balik layarnya.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          {tiles.map((t) => (
            <article
              key={t.kicker}
              data-tile
              className={`rounded-2xl border border-black/[0.08] bg-white p-7 transition-colors hover:border-black/20 md:p-8 ${
                t.wide ? "md:col-span-4" : "md:col-span-2"
              }`}
            >
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
                {t.kicker}
              </span>
              <h3 className="mt-3 max-w-[26ch] font-display text-[clamp(18px,1.9vw,22px)] font-semibold leading-snug tracking-[-0.025em] text-[#0a0a0a]">
                {t.title}
              </h3>
              {t.demo}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

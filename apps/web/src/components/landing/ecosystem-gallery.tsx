"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CreditCard, Printer } from "lucide-react";

/**
 * Galeri horizontal ala halaman produk Apple: panel bergerak ke kiri
 * seiring halaman di-scroll ke bawah, dengan section yang di-pin.
 *
 * Yang ditampilkan adalah satu pesanan yang sama (#MN-8921 dari Meja 12)
 * dilihat dari empat layar berbeda — itu inti janji produknya.
 *
 * Tanpa GSAP (mobile atau prefers-reduced-motion) markup yang sama tetap
 * berfungsi sebagai scroller horizontal biasa dengan snap.
 */

const panels = [
  { id: "meja", index: "01", label: "Ponsel tamu", at: "12.04.00", caption: "Tamu memesan dan membayar dari mejanya." },
  { id: "kasir", index: "02", label: "Layar kasir", at: "12.04.00", caption: "Tiket meja masuk ke antrean kasir pada detik yang sama." },
  { id: "dapur", index: "03", label: "Layar dapur", at: "12.04.01", caption: "Barista membaca pesanan berikut catatannya." },
  { id: "owner", index: "04", label: "Dashboard pemilik", at: "12.06.15", caption: "Transaksi selesai dan masuk ke omzet hari ini." },
];

function ScreenFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-black/[0.08] bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
        <span className="text-[12px] font-medium text-[#0a0a0a]">{label}</span>
        <span className="font-display text-[11px] tabular-nums text-[#a1a1aa]">#MN-8921</span>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function PanelMeja() {
  return (
    <ScreenFrame label="menuin.id/meja/12">
      <div className="space-y-2.5 text-[12px]">
        {[
          { q: 2, n: "Es Kopi Gula Aren", note: "Less ice, less sugar", p: "Rp 36.000" },
          { q: 1, n: "Butter Croissant", note: "Potong 2", p: "Rp 20.000" },
        ].map((i) => (
          <div key={i.n} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-[#0a0a0a]">
                {i.q}× {i.n}
              </span>
              <span className="block text-[11px] text-[#71717a]">{i.note}</span>
            </span>
            <span className="font-display shrink-0 tabular-nums text-[#0a0a0a]">{i.p}</span>
          </div>
        ))}

        <div className="space-y-1 border-t border-black/[0.06] pt-2.5 text-[11px] text-[#71717a]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-display tabular-nums">Rp 56.000</span>
          </div>
          <div className="flex justify-between">
            <span>Pajak layanan (10%)</span>
            <span className="font-display tabular-nums">Rp 5.600</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between border-t border-black/[0.06] pt-2.5">
          <span className="text-[11px] text-[#71717a]">Total</span>
          <span className="font-display text-[15px] font-semibold tabular-nums text-[#0a0a0a]">
            Rp 61.600
          </span>
        </div>

        <div className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0E59F9] text-[12px] font-medium text-white">
          <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
          Bayar dengan QRIS
        </div>
      </div>
    </ScreenFrame>
  );
}

function PanelKasir() {
  return (
    <ScreenFrame label="Kasir · Terminal 01">
      <div className="space-y-3 text-[12px]">
        <div className="flex items-center justify-between rounded-xl bg-[#0E59F9]/[0.06] px-3 py-2">
          <span className="text-[12px] font-medium text-[#0E59F9]">Pesanan baru dari Meja 12</span>
          <span className="font-display text-[11px] tabular-nums text-[#0E59F9]">baru saja</span>
        </div>

        <dl className="space-y-2">
          {[
            ["Meja", "12 · Dine-in"],
            ["Item", "3 item"],
            ["Pembayaran", "QRIS — lunas"],
            ["PB1 10%", "Sudah dihitung"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-black/[0.06] pb-2">
              <dt className="text-[#71717a]">{k}</dt>
              <dd className="text-[#0a0a0a]">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex h-9 items-center justify-center gap-2 rounded-xl border border-black/[0.08] text-[12px] font-medium text-[#0a0a0a]">
          <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
          Cetak struk 58 mm
        </div>
      </div>
    </ScreenFrame>
  );
}

function PanelDapur() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-[#0b0b0c] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-[12px] font-medium">Stasiun Bar</span>
        <span className="font-display text-[11px] tabular-nums text-white/45">#MN-8921</span>
      </div>
      <div className="flex-1 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold">Meja 12</span>
          <span className="font-display text-[12px] tabular-nums text-white/45">02:14</span>
        </div>
        <span className="mt-2 inline-flex rounded-full bg-[#0E59F9]/20 px-2 py-0.5 text-[11px] text-[#7aa8ff]">
          Disiapkan
        </span>
        <ul className="mt-3 space-y-2 text-[12px] leading-snug">
          <li>
            <span className="font-display tabular-nums">2×</span> Es Kopi Gula Aren
            <span className="block text-[11px] text-white/45">Less ice, less sugar</span>
          </li>
          <li>
            <span className="font-display tabular-nums">1×</span> Butter Croissant
            <span className="block text-[11px] text-white/45">Potong 2</span>
          </li>
        </ul>
        <div className="mt-4 flex h-9 items-center justify-center rounded-xl bg-emerald-500 text-[12px] font-medium text-emerald-950">
          Tandai siap
        </div>
      </div>
    </div>
  );
}

function PanelOwner() {
  const bars = [38, 52, 44, 61, 73, 58, 86];
  return (
    <ScreenFrame label="Kopi Ruang Teduh · hari ini">
      <div className="space-y-4">
        <div>
          <span className="text-[11px] text-[#71717a]">Omzet berjalan</span>
          <p className="font-display text-[22px] font-semibold tabular-nums leading-tight text-[#0a0a0a]">
            Rp 4.318.600
          </p>
        </div>

        <div className="flex h-20 items-end gap-1.5" aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-sm ${i === bars.length - 1 ? "bg-[#0E59F9]" : "bg-slate-200"}`}
            />
          ))}
        </div>

        <dl className="space-y-2 text-[12px]">
          {[
            ["Transaksi", "128"],
            ["Rata-rata per nota", "Rp 33.739"],
            ["Menu terlaris", "Es Kopi Gula Aren"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-t border-black/[0.06] pt-2">
              <dt className="text-[#71717a]">{k}</dt>
              <dd className="font-display tabular-nums text-[#0a0a0a]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ScreenFrame>
  );
}

const panelBody: Record<string, React.ReactNode> = {
  meja: <PanelMeja />,
  kasir: <PanelKasir />,
  dapur: <PanelDapur />,
  owner: <PanelOwner />,
};

export default function EcosystemGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    // Pin dipasang di semua desktop, termasuk saat reduced-motion aktif:
    // geseran panel di sini bukan hiasan, melainkan satu-satunya cara
    // melihat keempat layar. Yang dihormati untuk reduced-motion adalah
    // penghalusannya — scrub: true mengikat gerak 1:1 ke input scroll,
    // tanpa easing atau kelembaman.
    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        motionOk: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { isDesktop, motionOk } = ctx.conditions as {
          isDesktop: boolean;
          motionOk: boolean;
        };
        if (!isDesktop) return;

        const track = trackRef.current;
        const scroller = scrollerRef.current;
        const section = sectionRef.current;
        if (!track || !scroller || !section) return;

        // Saat di-pin, scroll horizontal native dimatikan supaya tidak
        // berebut kendali dengan GSAP.
        scroller.style.overflowX = "hidden";

        // Jarak tempuh = selisih lebar track dengan layar, plus satu gutter
        // supaya panel terakhir tidak mepet tepi kanan.
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            anticipatePin: 1,
            scrub: motionOk ? 0.6 : true,
            invalidateOnRefresh: true,
            onUpdate: (self) => setProgress(self.progress),
          },
        });

        // Gambar panel dimuat belakangan; hitung ulang setelah semuanya siap.
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);

        return () => {
          window.removeEventListener("load", onLoad);
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { x: 0 });
          scroller.style.overflowX = "";
        };
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="ekosistem" className="relative overflow-hidden py-20 md:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
          Ekosistem
        </p>
        <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0a0a0a] text-balance">
          Empat layar, satu pesanan yang sama.
        </h2>
        <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-[#52525b]">
          Satu pesanan dari Meja 12, dilihat dari empat sisi. Ponsel tamu, layar kasir, layar
          dapur, dan dashboard pemilik — semuanya membaca data yang sama pada detik yang sama.
        </p>
      </div>

      {/* Track full-bleed: sengaja keluar dari container supaya bisa
          berjalan melintasi layar seperti galeri halaman produk Apple.

          Scroller ini tetap bisa di-scroll menyamping walau GSAP tidak
          aktif (layar sempit, JS gagal, atau pin di-kill). Galeri tidak
          boleh pernah jadi deretan panel yang terpotong dan tak
          terjangkau — itu bug yang sempat terjadi. */}
      <div
        ref={scrollerRef}
        className="mt-12 overflow-x-auto pb-4 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={trackRef}
          className="flex w-max snap-x snap-mandatory gap-5 px-6 md:gap-6 md:pl-[max(24px,calc((100vw-1280px)/2))] md:pr-8"
        >
          {panels.map((p) => (
            <article
              key={p.id}
              data-panel
              className="w-[82vw] max-w-[360px] shrink-0 snap-start transition-opacity duration-300 md:w-[460px] md:max-w-none lg:w-[520px]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[13px] tabular-nums text-[#a1a1aa]">
                    {p.index}
                  </span>
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#0a0a0a]">
                    {p.label}
                  </h3>
                </div>
                {/* Cap waktu membuat keempat panel terbaca sebagai satu alur
                    pesanan, bukan empat kartu fitur yang berdiri sendiri. */}
                <span className="font-display text-[12.5px] tabular-nums text-[#a1a1aa]">
                  {p.at}
                </span>
              </div>

              <div className="mt-3 h-px w-full bg-black/[0.08]">
                <div className="h-px w-10 bg-[#0E59F9]" />
              </div>

              <p className="mt-3 min-h-[40px] max-w-[36ch] text-[13.5px] leading-snug text-[#52525b]">
                {p.caption}
              </p>
              <div className="mt-5 h-[420px]">{panelBody[p.id]}</div>
            </article>
          ))}
        </div>
      </div>

      {/* Indikator posisi — bergerak seiring track berjalan */}
      <div className="mx-auto mt-10 hidden w-full max-w-[1280px] px-6 md:block">
        <div className="h-px w-[200px] bg-black/[0.08]">
          <div
            className="h-px bg-[#0a0a0a]"
            style={{ width: `${Math.max(10, progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ScanLine } from "lucide-react";

/**
 * Alur pesanan — satu pesanan diikuti dari tamu memindai QR sampai
 * transaksinya masuk ke laporan pemilik.
 *
 * Tahapan disusun di sepanjang garis putus-putus yang meliuk ke bawah.
 * Saat halaman di-scroll, garis biru mengisi putus-putusnya dan sebuah
 * panah berjalan mengikuti lintasan. Setiap kali panah melewati satu
 * tahap, mockup berisi tangkapan layar aplikasi "muncul" di sampingnya.
 *
 * Lintasan tidak digambar dengan koordinat tetap: posisinya dihitung dari
 * titik-titik tahap di DOM, jadi garis selalu melewati titik yang benar
 * di lebar layar berapa pun.
 */

/* ------------------------------------------------------------------ */
/* Mockup perangkat                                                    */
/* ------------------------------------------------------------------ */

function PhoneMockup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-[200px] rounded-[34px] bg-[#0a0a0a] p-[6px] shadow-[0_30px_60px_-30px_rgba(15,23,42,0.55)] ring-1 ring-black/10 sm:w-[220px] ${className}`}
    >
      <div className="relative overflow-hidden rounded-[28px] bg-white">
        <span className="absolute left-1/2 top-2 z-10 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-[#0a0a0a]" />
        <div className="pt-7">{children}</div>
      </div>
    </div>
  );
}

function PhoneShot({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={356}
      height={797}
      sizes="220px"
      className="block h-auto w-full"
    />
  );
}

function BrowserMockup({
  src,
  alt,
  url,
  width,
  height,
}: {
  src: string;
  alt: string;
  url: string;
  width: number;
  height: number;
}) {
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
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 1024px) 90vw, 560px"
        className="block h-auto w-full"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layar tamu yang belum ada tangkapan layarnya — ilustrasi sementara  */
/* ------------------------------------------------------------------ */

function GuestScanScreen() {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center px-4 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0a0a0a]">
        <div className="grid grid-cols-5 gap-1" aria-hidden="true">
          {[1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1].map((on, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-[2px] ${on ? "bg-white" : "bg-white/10"}`} />
          ))}
        </div>
        <span className="absolute inset-x-2 top-1/2 h-px bg-[#0E59F9] shadow-[0_0_12px_2px_rgba(14,89,249,0.6)]" />
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-[#0a0a0a]">
        <ScanLine className="h-3.5 w-3.5 text-[#0E59F9]" />
        QR meja terbaca
      </p>
      <p className="mt-1 text-[11px] text-[#71717a]">Membuka menu Kopi Jotos…</p>
    </div>
  );
}

const GUEST_STEPS = ["Menunggu", "Diterima", "Disiapkan", "Siap", "Selesai"];

function GuestStatusScreen({ step }: { step: number }) {
  return (
    <div className="px-4 pb-5 pt-1">
      <p className="text-center text-[12px] font-semibold text-[#0a0a0a]">Status Pesanan</p>
      <div className="mt-3 rounded-xl border border-black/[0.06] px-2.5 py-2">
        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">No. pesanan</span>
        <p className="font-mono text-[11px] font-bold tracking-wide text-[#0a0a0a]">KOJ3BWNQ5GK</p>
      </div>
      <p className="mt-4 text-[15px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">Pesanan siap!</p>
      <p className="mt-0.5 text-[11px] text-[#52525b]">Pesanan sedang diantar ke meja Anda.</p>
      <ol className="mt-4 space-y-2.5">
        {GUEST_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                i < step
                  ? "bg-[#0E59F9] text-white"
                  : i === step
                    ? "border-2 border-[#0E59F9]"
                    : "border border-black/[0.12]"
              }`}
            >
              {i < step && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span
              className={`text-[11.5px] ${
                i === step ? "font-semibold text-[#0a0a0a]" : i < step ? "text-[#0a0a0a]" : "text-[#a1a1aa]"
              }`}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data tahapan                                                        */
/* ------------------------------------------------------------------ */

type Stage = {
  label: string;
  title: string;
  body: string;
  who: string;
  visual: React.ReactNode;
};

const stages: Stage[] = [
  {
    label: "Scan QR",
    who: "Tamu & outlet",
    title: "Pindai QR. Menu langsung terbuka.",
    body: "Setiap meja punya QR sendiri yang dibuat dari menu Meja & QR Code. Tamu memindainya, katalog terbuka di browser ponsel, dan nomor meja terisi otomatis saat checkout.",
    visual: (
      <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
        <PhoneMockup className="mx-auto !w-[150px] sm:mx-0">
          <GuestScanScreen />
        </PhoneMockup>
        <BrowserMockup
          src="/img/landing/journey/outlet-meja-qr.webp"
          alt="Halaman Meja & QR Code di dashboard Menuin"
          url="Katalog Menu · Meja & QR Code"
          width={1140}
          height={620}
        />
      </div>
    ),
  },
  {
    label: "Pesan",
    who: "Tamu",
    title: "Pesan tanpa memanggil pelayan.",
    body: "Tamu memilih dine-in atau bawa pulang, menambah varian seperti level pedas dan topping, lalu menulis catatan untuk dapur. Semua dari ponselnya sendiri.",
    visual: (
      <PhoneMockup className="mx-auto">
        <PhoneShot src="/img/landing/journey/tamu-keranjang.webp" alt="Keranjang pesanan tamu di katalog Menuin" />
      </PhoneMockup>
    ),
  },
  {
    label: "Bayar",
    who: "Tamu",
    title: "Bayar dari meja, atau nanti di kasir.",
    body: "Pilih Bayar Online Instan lewat QRIS, e-wallet, virtual account, atau kartu, atau pilih Bayar di Kasir. Pajak dihitung otomatis, jadi total sudah jelas sebelum lanjut.",
    visual: (
      <PhoneMockup className="mx-auto">
        <PhoneShot src="/img/landing/journey/tamu-bayar.webp" alt="Pilihan metode pembayaran di checkout Menuin" />
      </PhoneMockup>
    ),
  },
  {
    label: "Pesanan masuk",
    who: "Kasir",
    title: "Pesanan masuk. Tidak ada yang ditulis ulang.",
    body: "Pesanan yang sudah lunas langsung muncul di kolom Pesanan Baru, lengkap dengan nomor meja dan isi pesanannya. Kasir cukup menekan Mulai Siapkan.",
    visual: (
      <BrowserMockup
        src="/img/landing/journey/outlet-kolom-pesanan-baru.webp"
        alt="Papan Pesanan Masuk dengan pesanan baru yang sudah lunas"
        url="Pesanan Masuk"
        width={1180}
        height={280}
      />
    ),
  },
  {
    label: "Disajikan",
    who: "Dapur & pelayan",
    title: "Siapkan, sajikan, selesaikan.",
    body: "Kartu pesanan bergeser ke Sedang Disiapkan lalu Siap Disajikan. Pelayan tahu harus mengantar ke meja mana, lalu menekan Selesaikan. Tamu memantau statusnya dari ponsel.",
    visual: (
      <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-[minmax(0,1fr)_150px]">
        <BrowserMockup
          src="/img/landing/journey/outlet-kolom-siap-disajikan.webp"
          alt="Pesanan berada di kolom Siap Disajikan dengan tombol Selesaikan"
          url="Pesanan Masuk"
          width={1180}
          height={280}
        />
        <PhoneMockup className="mx-auto !w-[150px] sm:mx-0">
          <GuestStatusScreen step={3} />
        </PhoneMockup>
      </div>
    ),
  },
  {
    label: "Tercatat",
    who: "Pemilik",
    title: "Pesanan selesai. Laporan sudah jalan sendiri.",
    body: "Setiap transaksi langsung masuk ke Laporan Penjualan: omzet, modal (HPP), laba kotor, pajak, dan kanal pembayaran. Bisa diekspor ke PDF kapan saja.",
    visual: (
      <BrowserMockup
        src="/img/landing/journey/outlet-laporan.webp"
        alt="Laporan Penjualan & Keuangan di dashboard Menuin"
        url="Laporan Penjualan"
        width={1270}
        height={600}
      />
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Lintasan                                                            */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

/** Kurva halus melewati semua titik, meliuk di antara dua titik. */
function buildPath(pts: Pt[], lead: number, amp: number): string {
  if (pts.length === 0) return "";
  const first = pts[0];
  const last = pts[pts.length - 1];
  let d = `M ${first.x} ${first.y - lead} L ${first.x} ${first.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const dy = q.y - p.y;
    // Di antara dua tahap garis dibelokkan lewat satu titik ayun di
    // tengah, berselang-seling kiri–kanan, supaya lintasannya meliuk.
    const dir = i % 2 === 0 ? -1 : 1;
    const m = { x: (p.x + q.x) / 2 + dir * amp, y: p.y + dy / 2 };
    const k = dy * 0.28;
    d += ` C ${p.x} ${p.y + k}, ${m.x} ${m.y - k}, ${m.x} ${m.y}`;
    d += ` C ${m.x} ${m.y + k}, ${q.x} ${q.y - k}, ${q.x} ${q.y}`;
  }
  d += ` L ${last.x} ${last.y + lead}`;
  return d;
}

/** Panjang lintasan saat mencapai ketinggian y (lintasan selalu turun). */
function lengthAtY(path: SVGPathElement, total: number, y: number): number {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).y < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export default function OrderJourney() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const basePathRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<SVGGElement>(null);
  const stopsRef = useRef<number[]>([]);
  const totalRef = useRef(0);

  const [geom, setGeom] = useState({ d: "", w: 0, h: 0 });
  const [reached, setReached] = useState(-1);
  // Mockup disembunyikan hanya setelah JS siap dan gerak diizinkan, supaya
  // konten tidak pernah hilang kalau skrip gagal jalan.
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    const pts = nodeRefs.current
      .filter((n): n is HTMLSpanElement => !!n)
      .map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
    const amp = Math.min(110, Math.max(14, box.width * 0.07));
    setGeom({ d: buildPath(pts, 72, amp), w: box.width, h: box.height });
  }, []);

  // Panah selalu berada di titik lintasan yang sejajar garis 65% layar,
  // jadi mockup muncul tepat saat tahapnya terlihat.
  const paint = useCallback(() => {
    const path = basePathRef.current;
    const wrap = wrapRef.current;
    const total = totalRef.current;
    if (!path || !wrap || !total) return;
    const y = window.innerHeight * 0.65 - wrap.getBoundingClientRect().top;
    const startY = path.getPointAtLength(0).y;
    const endY = path.getPointAtLength(total).y;
    const len = y <= startY ? 0 : y >= endY ? total : lengthAtY(path, total, y);

    maskPathRef.current?.setAttribute("stroke-dashoffset", String(total - len));

    const a = path.getPointAtLength(Math.max(0, len));
    const b = path.getPointAtLength(Math.min(total, len + 1));
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    arrowRef.current?.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${angle})`);

    const stops = stopsRef.current;
    let idx = -1;
    for (let i = 0; i < stops.length; i++) if (len >= stops[i] - 2) idx = i;
    setReached((prev) => (prev === idx ? prev : idx));
  }, []);

  // Ukur ulang saat ukuran berubah (gambar selesai dimuat, resize, dll.)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  // Setelah lintasan baru dirender: hitung panjang dan posisi tiap tahap.
  useEffect(() => {
    const path = basePathRef.current;
    if (!path || !geom.d) return;
    const total = path.getTotalLength();
    totalRef.current = total;
    maskPathRef.current?.setAttribute("stroke-dasharray", `${total} ${total}`);
    const box = wrapRef.current!.getBoundingClientRect();
    stopsRef.current = nodeRefs.current.map((n) => {
      if (!n) return total;
      const r = n.getBoundingClientRect();
      return lengthAtY(path, total, r.top + r.height / 2 - box.top);
    });
    paint();
  }, [geom, paint]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnimate(!reduce);

    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: () => paint(),
    });
    return () => st.kill();
  }, [paint]);

  return (
    <section id="alur" className="relative overflow-hidden border-t border-black/[0.06] bg-white py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
          Cara kerja
        </p>
        <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Dari scan QR sampai laporan, dalam satu alur.
        </h2>
        <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-[#52525b]">
          Ikuti satu pesanan dari meja tamu sampai tercatat di laporan pemilik. Semua tangkapan
          layar di bawah diambil langsung dari aplikasi Menuin.
        </p>

        <div ref={wrapRef} className="relative mt-16 md:mt-20">
          {/* Garis putus-putus + progres + panah */}
          {geom.d && (
            <svg
              className="pointer-events-none absolute inset-0 z-0 overflow-visible"
              width={geom.w}
              height={geom.h}
              viewBox={`0 0 ${geom.w} ${geom.h}`}
              aria-hidden="true"
            >
              <defs>
                <mask id="journey-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width={geom.w} height={geom.h}>
                  <path ref={maskPathRef} d={geom.d} fill="none" stroke="#fff" strokeWidth="12" />
                </mask>
              </defs>
              <path
                ref={basePathRef}
                d={geom.d}
                fill="none"
                stroke="rgba(10,10,10,0.14)"
                strokeWidth="2.5"
                strokeDasharray="10 10"
                strokeLinecap="round"
              />
              <path
                d={geom.d}
                fill="none"
                stroke="#0E59F9"
                strokeWidth="3"
                strokeDasharray="10 10"
                strokeLinecap="round"
                mask="url(#journey-reveal)"
              />
            </svg>
          )}

          {/* Panah di lapisan paling atas supaya tidak tertutup titik tahap */}
          {geom.d && (
            <svg
              className="pointer-events-none absolute inset-0 z-20 overflow-visible"
              width={geom.w}
              height={geom.h}
              viewBox={`0 0 ${geom.w} ${geom.h}`}
              aria-hidden="true"
            >
              <g ref={arrowRef}>
                <circle r="21" fill="#0E59F9" opacity="0.15" />
                <circle r="15" fill="#0E59F9" />
                <path d="M -4 -6 L 4 0 L -4 6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          )}

          <ol className="relative z-10">
            {stages.map((s, i) => {
              const textLeft = i % 2 === 0;
              const on = !animate || reached >= i;
              return (
                <li
                  key={s.label}
                  className={`grid grid-cols-[44px_1fr] gap-x-5 py-12 lg:items-center lg:gap-x-0 lg:py-16 ${
                    textLeft
                      ? "lg:grid-cols-[minmax(0,5fr)_200px_minmax(0,7fr)]"
                      : "lg:grid-cols-[minmax(0,7fr)_200px_minmax(0,5fr)]"
                  }`}
                >
                  {/* Titik tahap — dibaca oleh lintasan */}
                  <div
                    className={`row-span-2 flex lg:col-start-2 lg:row-span-1 lg:row-start-1 ${
                      textLeft ? "lg:justify-start lg:pl-6" : "lg:justify-end lg:pr-6"
                    } ${i % 2 === 0 ? "pl-0" : "pl-3"} lg:pl-0`}
                  >
                    <span
                      ref={(el) => {
                        nodeRefs.current[i] = el;
                      }}
                      className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-[13px] font-semibold tabular-nums transition-colors duration-300 lg:mt-0 lg:h-12 lg:w-12 ${
                        on ? "border-[#0E59F9] text-[#0E59F9]" : "border-black/[0.12] text-[#a1a1aa]"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Teks */}
                  <div
                    className={`col-start-2 lg:row-start-1 ${
                      textLeft ? "lg:col-start-1 lg:pr-10 lg:text-right" : "lg:col-start-3 lg:pl-10"
                    }`}
                  >
                    <div className={`flex items-center gap-2 ${textLeft ? "lg:justify-end" : ""}`}>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E59F9]">
                        {s.label}
                      </span>
                      <span className="text-[12px] text-[#a1a1aa]">· {s.who}</span>
                    </div>
                    <h3
                      className={`mt-3 max-w-[22ch] text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.12] tracking-[-0.035em] text-[#0a0a0a] text-balance ${
                        textLeft ? "lg:ml-auto" : ""
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p
                      className={`mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#52525b] ${
                        textLeft ? "lg:ml-auto" : ""
                      }`}
                    >
                      {s.body}
                    </p>
                  </div>

                  {/* Mockup yang "muncul" saat panah melewati tahap ini */}
                  <div
                    className={`col-start-2 mt-8 lg:row-start-1 lg:mt-0 ${
                      textLeft ? "lg:col-start-3 lg:pl-10" : "lg:col-start-1 lg:pr-10"
                    }`}
                  >
                    <div
                      className={`origin-center transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        on ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.9] opacity-0"
                      }`}
                    >
                      {s.visual}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

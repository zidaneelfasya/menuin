"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Check,
  CreditCard,
  Printer,
  ScanLine,
  ShieldCheck,
  ConciergeBell,
} from "lucide-react";

/**
 * Alur pesanan — satu pesanan (#MN-8921, Meja 12) diikuti dari tamu
 * memindai QR sampai transaksinya masuk ke laporan pemilik.
 *
 * Tiap tahap memperlihatkan dua sisi sekaligus: layar tamu dan layar
 * outlet. Label status sengaja disamakan dengan aplikasi
 * (order-status-stepper.tsx untuk tamu, kanban-board.tsx untuk outlet)
 * supaya calon pelanggan yang lanjut mencoba demo langsung merasa kenal.
 *
 * Desktop: kontainer tinggi + panggung sticky; tahap aktif dihitung dari
 * progres scroll. Sengaja memakai position: sticky, bukan pin GSAP, supaya
 * tidak ada spacer yang dihitung ulang saat gambar di atasnya selesai dimuat.
 * Layar sempit: enam kartu bertumpuk, tanpa efek scroll sama sekali.
 */

type Step = {
  index: string;
  label: string;
  at: string;
  title: string;
  body: string;
  guest: React.ReactNode;
  outlet: React.ReactNode;
  outletLabel: string;
};

/* ------------------------------------------------------------------ */
/* Kerangka layar                                                      */
/* ------------------------------------------------------------------ */

function PhoneFrame({ at, children }: { at: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[250px] rounded-[34px] border border-black/[0.08] bg-[#0a0a0a] p-[7px] shadow-[var(--landing-lift-lg)]">
      <div className="flex h-[400px] flex-col sm:h-[440px] overflow-hidden rounded-[28px] bg-white">
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-semibold tabular-nums text-[#0a0a0a]">
          <span>{at}</span>
          <span className="h-[5px] w-12 rounded-full bg-black/80" />
          <span>5G</span>
        </div>
        <div className="mx-3 mb-2 rounded-lg bg-[#f4f4f5] px-3 py-1.5 text-center text-[10px] text-[#71717a]">
          menuin.id/store/kopi-ruang-teduh
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}

function OutletFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[var(--landing-lift-lg)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-medium text-[#0a0a0a]">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-black/10" />
            <span className="h-2 w-2 rounded-full bg-black/10" />
            <span className="h-2 w-2 rounded-full bg-black/10" />
          </span>
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-[#a1a1aa]">#MN-8921</span>
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sisi tamu                                                           */
/* ------------------------------------------------------------------ */

const GUEST_STEPS = ["Menunggu", "Diterima", "Disiapkan", "Siap", "Selesai"];

function GuestStatus({
  step,
  title,
  note,
}: {
  step: number;
  title: string;
  note: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-[11px] text-[#71717a]">Meja 12 · #MN-8921</span>
      <p className="mt-1 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-[#0a0a0a]">
        {title}
      </p>
      <p className="mt-1.5 text-[11.5px] leading-snug text-[#52525b]">{note}</p>

      <ol className="mt-5 space-y-3">
        {GUEST_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  done
                    ? "bg-[#0E59F9] text-white"
                    : current
                      ? "border-2 border-[#0E59F9] bg-white"
                      : "border border-black/[0.12] bg-white"
                }`}
              >
                {done && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span
                className={`text-[12px] ${
                  current ? "font-semibold text-[#0a0a0a]" : done ? "text-[#0a0a0a]" : "text-[#a1a1aa]"
                }`}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto rounded-xl bg-[#fafafa] px-3 py-2.5 text-[11px] text-[#52525b]">
        2× Es Kopi Gula Aren · 1× Butter Croissant
      </div>
    </div>
  );
}

function GuestScan() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl bg-[#0a0a0a]">
        {/* QR sederhana — pola kotak, bukan kode yang bisa dipindai */}
        <div className="grid grid-cols-5 gap-1" aria-hidden="true">
          {[1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1].map((on, i) => (
            <span key={i} className={`h-4 w-4 rounded-[3px] ${on ? "bg-white" : "bg-white/10"}`} />
          ))}
        </div>
        <span className="absolute inset-x-3 top-1/2 h-px bg-[#0E59F9] shadow-[0_0_12px_2px_rgba(14,89,249,0.6)]" />
      </div>
      <p className="mt-5 flex items-center gap-1.5 text-[12px] font-medium text-[#0a0a0a]">
        <ScanLine className="h-3.5 w-3.5 text-[#0E59F9]" />
        QR Meja 12 terbaca
      </p>
      <p className="mt-1 text-[11px] text-[#71717a]">Membuka menu Kopi Ruang Teduh…</p>
    </div>
  );
}

function GuestOrder() {
  return (
    <div className="flex flex-1 flex-col gap-2.5 text-[12px]">
      <span className="text-[11px] text-[#71717a]">Keranjang · Meja 12</span>
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
          <span className="shrink-0 tabular-nums text-[#0a0a0a]">{i.p}</span>
        </div>
      ))}
      <div className="space-y-1 border-t border-black/[0.06] pt-2.5 text-[11px] text-[#71717a]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">Rp 56.000</span>
        </div>
        <div className="flex justify-between">
          <span>Pajak (10%)</span>
          <span className="tabular-nums">Rp 5.600</span>
        </div>
      </div>
      <div className="flex items-baseline justify-between border-t border-black/[0.06] pt-2.5">
        <span className="text-[11px] text-[#71717a]">Total</span>
        <span className="text-[15px] font-semibold tabular-nums text-[#0a0a0a]">Rp 61.600</span>
      </div>
      <div className="mt-auto flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0E59F9] text-[12px] font-medium text-white">
        <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
        Bayar dengan QRIS
      </div>
      <p className="text-center text-[10.5px] text-[#a1a1aa]">atau bayar di kasir</p>
    </div>
  );
}

function GuestDone() {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
      </span>
      <p className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
        Selamat menikmati!
      </p>
      <p className="mt-1 text-[11.5px] text-[#52525b]">Pesanan Meja 12 sudah selesai.</p>
      <dl className="mt-6 w-full space-y-2 rounded-xl bg-[#fafafa] p-3 text-left text-[11.5px]">
        {[
          ["No. pesanan", "#MN-8921"],
          ["Pembayaran", "QRIS · Lunas"],
          ["Total", "Rp 61.600"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-[#71717a]">{k}</dt>
            <dd className="tabular-nums text-[#0a0a0a]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sisi outlet                                                         */
/* ------------------------------------------------------------------ */

const BOARD_COLUMNS = ["Pesanan Baru", "Sedang Disiapkan", "Siap Disajikan"] as const;

function OrderBoard({
  column,
  action,
  extra,
}: {
  column: number;
  action: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid flex-1 grid-cols-3 gap-2">
        {BOARD_COLUMNS.map((title, i) => (
          <div key={title} className="flex flex-col gap-2 rounded-xl bg-[#fafafa] p-2">
            <span className="truncate text-[10.5px] font-semibold text-[#52525b]">{title}</span>
            {i === column ? (
              <div className="rounded-lg border border-[#0E59F9]/40 bg-white p-2 shadow-[0_0_0_3px_rgba(14,89,249,0.08)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] font-semibold text-[#0a0a0a]">Meja 12</span>
                  <span className="text-[9.5px] tabular-nums text-[#a1a1aa]">QRIS ✓</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-snug text-[#52525b]">2× Es Kopi Gula Aren</p>
                <p className="text-[10.5px] leading-snug text-[#52525b]">1× Butter Croissant</p>
                <p className="mt-1 text-[9.5px] text-[#a1a1aa]">Less ice, less sugar</p>
              </div>
            ) : (
              <div className="h-12 rounded-lg border border-dashed border-black/[0.08]" />
            )}
            {i !== column && i === 0 && (
              <div className="h-12 rounded-lg border border-black/[0.06] bg-white" />
            )}
          </div>
        ))}
      </div>
      {extra}
      <div className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] text-[12px] font-medium text-white">
        {action}
      </div>
    </div>
  );
}

function OutletIdle() {
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-[11px] text-[#71717a]">Meja & QR</span>
      <div className="mt-3 grid flex-1 grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`flex flex-col items-center justify-center rounded-xl border text-[11px] ${
              n === 12
                ? "border-[#0E59F9]/40 bg-[#0E59F9]/[0.05] text-[#0E59F9]"
                : "border-black/[0.06] text-[#71717a]"
            }`}
          >
            <span className="text-[13px] font-semibold tabular-nums">{n}</span>
            {n === 12 && <span className="text-[9.5px]">membuka menu</span>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-[#52525b]">
        Setiap meja punya QR sendiri, jadi pesanan otomatis tahu asalnya.
      </p>
    </div>
  );
}

function OutletPayment() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-3">
        <span className="flex items-center gap-2 text-[12.5px] font-medium text-emerald-900">
          <ShieldCheck className="h-4 w-4" />
          Pembayaran terverifikasi
        </span>
        <span className="text-[11px] tabular-nums text-emerald-700">12.05.02</span>
      </div>
      <dl className="mt-4 space-y-2 text-[12px]">
        {[
          ["Metode", "QRIS · Midtrans"],
          ["Meja", "12 · Dine-in"],
          ["Pajak 10%", "Rp 5.600"],
          ["Total diterima", "Rp 61.600"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-black/[0.06] pb-2">
            <dt className="text-[#71717a]">{k}</dt>
            <dd className="tabular-nums text-[#0a0a0a]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto pt-3 text-[11.5px] text-[#52525b]">
        Tidak ada yang perlu dicek manual. Pesanan langsung diteruskan ke papan pesanan.
      </p>
    </div>
  );
}

function KitchenTicket() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/[0.12] px-3 py-2">
      <Printer className="h-4 w-4 shrink-0 text-[#71717a]" strokeWidth={1.5} />
      <span className="text-[11px] leading-snug text-[#52525b]">
        Tiket dapur tercetak: <span className="text-[#0a0a0a]">Meja 12 · 2× Es Kopi Gula Aren (less ice, less sugar)</span>
      </span>
    </div>
  );
}

function ServeNote() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#fafafa] px-3 py-2">
      <ConciergeBell className="h-4 w-4 shrink-0 text-[#71717a]" strokeWidth={1.5} />
      <span className="text-[11px] leading-snug text-[#52525b]">
        Pelayan mengantar ke <span className="text-[#0a0a0a]">Meja 12</span>, lalu pesanan ditandai selesai.
      </span>
    </div>
  );
}

function OwnerReport() {
  const bars = [38, 52, 44, 61, 73, 58, 86];
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[11px] text-[#71717a]">Omzet hari ini</span>
          <p className="text-[22px] font-semibold tabular-nums leading-tight tracking-[-0.02em] text-[#0a0a0a]">
            Rp 4.318.600
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-emerald-700">
          +Rp 61.600
        </span>
      </div>
      <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
        {bars.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-sm ${i === bars.length - 1 ? "bg-[#0E59F9]" : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div>
        <span className="text-[11px] text-[#71717a]">Transaksi terbaru</span>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-[#0E59F9]/30 bg-[#0E59F9]/[0.04] px-3 py-2.5 text-[12px]">
          <span className="text-[#0a0a0a]">#MN-8921 · Meja 12</span>
          <span className="text-[#71717a]">QRIS</span>
          <span className="tabular-nums text-[#0a0a0a]">Rp 61.600</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-3 py-1.5 text-[12px] text-[#a1a1aa]">
          <span>#MN-8920 · Takeaway</span>
          <span>Tunai</span>
          <span className="tabular-nums">Rp 38.500</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data alur                                                           */
/* ------------------------------------------------------------------ */

const steps: Step[] = [
  {
    index: "01",
    label: "Scan",
    at: "12.04",
    title: "Pindai QR. Menu langsung terbuka.",
    body: "Tamu cukup mengarahkan kamera ke QR di meja. Menu terbuka di browser, nomor meja sudah terisi. Tanpa unduh aplikasi, tanpa daftar akun.",
    guest: <GuestScan />,
    outletLabel: "Dashboard · Meja & QR",
    outlet: <OutletIdle />,
  },
  {
    index: "02",
    label: "Pesan & bayar",
    at: "12.05",
    title: "Pesan dan bayar tanpa memanggil pelayan.",
    body: "Tamu memilih menu, menulis catatan seperti “less sugar”, lalu membayar dengan QRIS. Pembayaran diverifikasi otomatis, jadi kasir tidak perlu mencocokkan bukti transfer.",
    guest: <GuestOrder />,
    outletLabel: "Kasir · Pembayaran",
    outlet: <OutletPayment />,
  },
  {
    index: "03",
    label: "Pesanan masuk",
    at: "12.05",
    title: "Pesanan masuk. Tidak ada yang ditulis ulang.",
    body: "Pesanan Meja 12 muncul di kolom Pesanan Baru, lengkap dengan catatannya. Satu ketukan untuk menerima dan mencetak tiket dapur.",
    guest: (
      <GuestStatus
        step={1}
        title="Pesanan diterima"
        note="Outlet sudah menerima pesanan Anda."
      />
    ),
    outletLabel: "Dashboard · Pesanan",
    outlet: <OrderBoard column={0} action="Siapkan pesanan & cetak" />,
  },
  {
    index: "04",
    label: "Diproses",
    at: "12.06",
    title: "Tamu tidak perlu bertanya “sudah sampai mana?”",
    body: "Begitu dapur mulai menyiapkan, status di ponsel tamu ikut bergerak. Tiket berisi catatan yang sama persis dengan yang ditulis tamu.",
    guest: (
      <GuestStatus
        step={2}
        title="Sedang disiapkan"
        note="Barista sedang meracik pesanan Anda."
      />
    ),
    outletLabel: "Dashboard · Pesanan",
    outlet: <OrderBoard column={1} action="Tandai siap disajikan" extra={<KitchenTicket />} />,
  },
  {
    index: "05",
    label: "Diantar",
    at: "12.14",
    title: "Sampai di meja yang benar, dengan catatan yang benar.",
    body: "Pesanan yang siap pindah ke kolom Siap Disajikan. Pelayan tahu persis harus mengantar ke meja mana, lalu menandainya selesai.",
    guest: (
      <GuestStatus
        step={3}
        title="Pesanan siap"
        note="Pesanan sedang diantar ke Meja 12."
      />
    ),
    outletLabel: "Dashboard · Pesanan",
    outlet: <OrderBoard column={2} action="Selesaikan pesanan" extra={<ServeNote />} />,
  },
  {
    index: "06",
    label: "Tercatat",
    at: "12.15",
    title: "Pesanan selesai. Pembukuan sudah jalan sendiri.",
    body: "Transaksi langsung masuk ke omzet hari ini, lengkap dengan metode bayar dan menu yang terjual. Pemilik bisa memantaunya dari mana saja.",
    guest: <GuestDone />,
    outletLabel: "Dashboard pemilik · Hari ini",
    outlet: <OwnerReport />,
  },
];

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

function StepCopy({ step }: { step: Step }) {
  return (
    <>
      <div className="flex items-baseline gap-3">
        <span className="text-[13px] tabular-nums text-[#a1a1aa]">{step.index}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E59F9]">
          {step.label}
        </span>
        <span className="text-[12px] tabular-nums text-[#a1a1aa]">{step.at}</span>
      </div>
      <h3 className="mt-3 max-w-[20ch] text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.12] tracking-[-0.035em] text-[#0a0a0a] text-balance">
        {step.title}
      </h3>
      <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#52525b]">{step.body}</p>
    </>
  );
}

export default function OrderJourney() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const track = trackRef.current;
      if (!track) return;

      const st = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          setProgress(self.progress);
          setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
        },
      });

      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  const step = steps[active];

  return (
    <section id="alur" className="relative border-t border-black/[0.06] bg-white pt-24 md:pt-32">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
          Cara kerja
        </p>
        <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Dari meja tamu sampai laporan pemilik, dalam satu alur.
        </h2>
        <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-[#52525b]">
          Ikuti satu pesanan dari Meja 12. Apa yang dilihat tamu di ponselnya dan apa yang
          dikerjakan tim Anda di outlet, berjalan di sistem yang sama pada detik yang sama.
        </p>
      </div>

      {/* Desktop: kontainer tinggi, panggung sticky */}
      <div
        ref={trackRef}
        className="relative hidden lg:block"
        style={{ height: `${steps.length * 70 + 30}vh` }}
      >
        <div className="sticky top-[64px] flex h-[calc(100vh-64px)] items-center">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-12 items-center gap-10 px-6">
            {/* Daftar tahap */}
            <div className="col-span-4">
              <ol className="space-y-1">
                {steps.map((s, i) => (
                  <li
                    key={s.index}
                    className={`flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                      i === active ? "bg-[#fafafa]" : ""
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors duration-300 ${
                        i < active
                          ? "bg-[#0E59F9]/10 text-[#0E59F9]"
                          : i === active
                            ? "bg-[#0E59F9] text-white"
                            : "border border-black/[0.08] text-[#a1a1aa]"
                      }`}
                    >
                      {i < active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : s.index}
                    </span>
                    <span
                      className={`text-[15px] transition-colors duration-300 ${
                        i === active ? "font-semibold text-[#0a0a0a]" : "text-[#71717a]"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="ml-auto text-[12px] tabular-nums text-[#a1a1aa]">{s.at}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 h-px w-full bg-black/[0.08]">
                <div className="h-px bg-[#0a0a0a]" style={{ width: `${Math.max(4, progress * 100)}%` }} />
              </div>

              <div key={step.index} className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <StepCopy step={step} />
              </div>
            </div>

            {/* Panggung dua layar */}
            <div className="col-span-8">
              <div key={step.index} className="grid grid-cols-[250px_1fr] items-stretch gap-6 animate-in fade-in duration-500">
                <div>
                  <p className="mb-3 text-center text-[12px] font-medium text-[#71717a]">Ponsel tamu</p>
                  <PhoneFrame at={step.at}>{step.guest}</PhoneFrame>
                </div>
                <div className="flex flex-col">
                  <p className="mb-3 text-[12px] font-medium text-[#71717a]">Layar outlet</p>
                  <div className="flex flex-1 items-center">
                    <OutletFrame label={step.outletLabel}>{step.outlet}</OutletFrame>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layar sempit: kartu bertumpuk */}
      <ol className="mx-auto mt-12 max-w-[640px] space-y-6 px-6 pb-24 lg:hidden">
        {steps.map((s) => (
          <li key={s.index} className="rounded-[24px] border border-black/[0.06] bg-[#fafafa] p-5 sm:p-7">
            <StepCopy step={s} />
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr]">
              <PhoneFrame at={s.at}>{s.guest}</PhoneFrame>
              <OutletFrame label={s.outletLabel}>{s.outlet}</OutletFrame>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden pb-24 lg:block" />
    </section>
  );
}

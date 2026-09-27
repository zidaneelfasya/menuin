import React from "react";
import { Check, Receipt, Settings2, Wallet } from "lucide-react";

/**
 * Report & Analytics — tiga jenis laporan.
 * DATA SEMENTARA: modul laporan sedang dirombak; sesuaikan isi poin di sini
 * begitu rinciannya final.
 */
const reports = [
  {
    icon: Receipt,
    title: "Penjualan",
    body: "Apa yang laku, kapan, dan lewat metode bayar apa.",
    points: ["Omzet per hari, minggu, bulan", "Menu terlaris", "Metode pembayaran"],
  },
  {
    icon: Settings2,
    title: "Operasional",
    body: "Bagaimana outlet berjalan dari shift ke shift.",
    points: ["Rekap shift & kasir", "Jumlah dan jenis pesanan", "Perbandingan antar outlet"],
  },
  {
    icon: Wallet,
    title: "Keuangan",
    body: "Berapa yang benar-benar tersisa setelah modal dan pajak.",
    points: ["Laba kotor & HPP", "Pajak & service charge", "Ekspor PDF"],
  },
];

export default function ReportTypes() {
  return (
    <section className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">Report & Analytics</p>
        <h2 className="mt-4 max-w-[22ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Tiga sudut pandang untuk membaca bisnis Anda.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {reports.map((r) => {
            const Icon = r.icon;
            return (
              <article key={r.title} className="rounded-[28px] bg-white p-8 ring-1 ring-black/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E59F9]/[0.08] text-[#0E59F9]">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.03em] text-[#0a0a0a]">Laporan {r.title.toLowerCase()}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#52525b]">{r.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14px] text-[#0a0a0a]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0E59F9]" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Monitor, Package, QrCode, Wallet } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Cuplikan fitur di landing. Penjelasan lengkap (scrollytelling) ada di
 * halaman /fitur.
 */

const tiles = [
  { icon: QrCode, title: "QR pesan dari meja", body: "Tamu memesan dan membayar dari ponselnya sendiri." },
  { icon: Monitor, title: "Kasir POS", body: "Walk-in dan takeaway selesai dalam beberapa ketukan." },
  { icon: Wallet, title: "Shift & kas", body: "Selisih kas ketahuan hari ini, bukan akhir bulan." },
  { icon: Package, title: "Stok & HPP", body: "Stok berkurang otomatis, margin per menu terlihat." },
  { icon: BarChart3, title: "Report & Analytics", body: "Laporan penjualan, operasional, dan keuangan." },
  { icon: Building2, title: "Multi-outlet", body: "Buka cabang baru tanpa mulai dari nol." },
];

export default function FeatureTeaser() {
  return (
    <section className="border-t border-black/[0.06] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">Fitur</p>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
              Satu aplikasi untuk seluruh operasional outlet.
            </h2>
          </ScrollReveal>
          <Link
            href="/fitur"
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0E59F9] hover:text-[#0C4CD6]"
          >
            Lihat semua fitur
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ScrollReveal className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                href="/fitur"
                className="group rounded-[24px] bg-[#fafafa] p-7 ring-1 ring-black/[0.05] transition-colors hover:bg-white hover:ring-black/[0.1]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0E59F9] ring-1 ring-black/[0.06] transition-colors group-hover:bg-[#0E59F9] group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">{t.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#52525b]">{t.body}</p>
              </Link>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}

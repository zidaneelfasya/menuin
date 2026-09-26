import React from "react";
import { Building2, Coffee, Croissant, UtensilsCrossed } from "lucide-react";

const audiences = [
  { icon: Coffee, title: "Coffee shop", body: "Antrean pagi dan pesanan dengan banyak varian, tanpa salah catat." },
  { icon: UtensilsCrossed, title: "Restoran dine-in", body: "Tamu pesan dari meja, dapur menerima pesanan yang utuh." },
  { icon: Croissant, title: "Bakery & kafe", body: "Stok produk harian terpantau, promo jam tertentu gampang diatur." },
  { icon: Building2, title: "Usaha multi-cabang", body: "Setiap cabang punya menu, tim, dan laporannya sendiri." },
];

/** Untuk siapa Menuin — halaman /tentang. */
export default function AudienceGrid() {
  return (
    <section className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">Untuk siapa</p>
        <h2 className="mt-4 max-w-[20ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
          Dari satu kedai sampai jaringan cabang.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.title} className="rounded-[24px] bg-white p-7 ring-1 ring-black/[0.06]">
                <Icon className="h-6 w-6 text-[#0E59F9]" strokeWidth={1.6} />
                <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">{a.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#52525b]">{a.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import KeyFacts from "@/components/landing/key-facts";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Tentang Menuin — menjawab "ini apa dan untuk siapa" sebelum pengunjung
 * masuk ke alur dan fitur. Angka kunci ditaruh di sini sebagai bukti
 * dari pernyataan di atasnya, bukan berdiri sendiri di bawah hero.
 */

const audiences = ["Coffee shop", "Restoran dine-in", "Bakery & kafe", "Usaha multi-cabang"];

export default function AboutSection() {
  return (
    <section id="tentang" className="pt-24 md:pt-32">
      <div className="mx-auto max-w-[1280px] px-6">
        <ScrollReveal className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Tentang Menuin
            </p>
            <h2 className="mt-4 max-w-[16ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
              Dibuat untuk jam paling sibuk di outlet Anda.
            </h2>
          </div>

          <div className="lg:col-span-6 lg:pt-10">
            <p className="text-[17px] leading-relaxed text-[#0a0a0a]">
              Di banyak kafe dan restoran, satu pesanan ditulis ulang berkali-kali: dari meja ke
              kasir, dari kasir ke dapur, dari nota ke buku kas. Setiap salinan membuka celah
              salah catat.
            </p>
            <p className="mt-5 text-[16px] leading-relaxed text-[#52525b]">
              Menuin menyatukan semuanya menjadi satu pesanan yang dibaca bersama oleh tamu, kasir,
              dapur, dan pemilik. Tim Anda bekerja lebih cepat, tamu tahu pesanannya sampai mana,
              dan pembukuan tersusun sendiri.
            </p>

            <div className="mt-8">
              <p className="text-[13px] text-[#71717a]">Cocok untuk</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {audiences.map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-black/[0.08] px-3.5 py-1.5 text-[13.5px] text-[#0a0a0a]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <KeyFacts />
    </section>
  );
}

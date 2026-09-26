import React from "react";
import Image from "next/image";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Tentang Menuin — menjawab "ini apa dan untuk siapa" sebelum pengunjung
 * masuk ke masalah, alur, dan fitur.
 *
 * Foto kiri memakai foto hero (kasir memakai Menuin di gerai sungguhan);
 * kanan berisi pernyataan dan empat hal yang dikerjakan Menuin.
 */

const pillars = [
  {
    title: "Pesan dari meja, tanpa aplikasi",
    body: "Tamu memindai QR, memilih menu, dan membayar dari ponselnya sendiri tanpa menunggu pelayan.",
  },
  {
    title: "Kasir cepat di jam sibuk",
    body: "Pesanan walk-in dan takeaway selesai dalam beberapa ketukan, struk langsung tercetak.",
  },
  {
    title: "Dapur menerima pesanan yang utuh",
    body: "Pesanan dan catatan tamu sampai ke dapur tanpa ditulis ulang, jadi tidak ada lagi salah masak.",
  },
  {
    title: "Laporan yang tersusun sendiri",
    body: "Omzet, laba, dan kas per shift bisa dipantau dari mana saja, untuk satu outlet maupun banyak cabang.",
  },
];

export default function AboutSection() {
  return (
    <section id="tentang" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-16">
        {/* Foto */}
        <ScrollReveal className="lg:col-span-6">
          <div className="relative">
            <div className="overflow-hidden rounded-[28px] bg-[#f4f4f5] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.06]">
              <Image
                src="/img/landing/hero-kasir.webp"
                alt="Kasir sebuah coffee shop memproses pesanan lewat Menuin di tablet"
                width={1357}
                height={1024}
                sizes="(max-width: 1024px) 100vw, 600px"
                className="h-auto w-full object-cover"
              />
            </div>

            {/* Kartu kecil — satu pesanan dibaca semua pihak */}
            <div className="absolute -bottom-6 right-4 hidden rounded-2xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-[var(--landing-lift-lg)] backdrop-blur sm:block lg:-right-6">
              <p className="text-[11px] text-[#71717a]">Satu pesanan, dibaca bersama</p>
              <div className="mt-2 flex items-center gap-1.5">
                {["Tamu", "Kasir", "Dapur", "Pemilik"].map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-[#0E59F9]/[0.07] px-2.5 py-1 text-[11.5px] font-medium text-[#0E59F9]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Teks */}
        <div className="lg:col-span-6">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Tentang Menuin
            </p>
            <h2 className="mt-4 text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-balance">
              <span className="block text-[#0a0a0a]">Dibuat untuk jam sibuk</span>
              <span className="block text-[#0E59F9]">outlet F&amp;B Anda.</span>
            </h2>
            <p className="mt-6 max-w-[54ch] text-[16px] leading-relaxed text-[#52525b]">
              Di banyak kafe dan restoran, satu pesanan ditulis ulang berkali-kali: dari meja ke
              kasir, dari kasir ke dapur, dari nota ke buku kas. Menuin menyatukannya menjadi satu
              pesanan yang dibaca bersama, untuk coffee shop, restoran, bakery, sampai usaha
              multi-cabang.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <figure className="mt-8 border-l-2 border-[#0E59F9] pl-5">
              <figcaption className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0E59F9]">
                Misi kami
              </figcaption>
              <blockquote className="mt-2 text-[clamp(19px,1.8vw,23px)] font-medium leading-snug tracking-[-0.02em] text-[#0a0a0a]">
                To make running and growing an F&amp;B business simpler.
              </blockquote>
            </figure>
          </ScrollReveal>

          <ScrollReveal className="mt-10 space-y-3" stagger={0.1}>
            {pillars.map((p) => (
              <div
                key={p.title}
                className="group border-l-2 border-black/[0.08] py-2 pl-5 transition-colors hover:border-[#0E59F9]"
              >
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
                  {p.title}
                </h3>
                <p className="mt-1.5 max-w-[52ch] text-[14.5px] leading-relaxed text-[#52525b]">
                  {p.body}
                </p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { CreditCard, Database, History, MonitorSmartphone } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

/**
 * Keamanan & keandalan — menjawab keraguan terakhir sebelum harga:
 * "uang saya aman? data saya aman? harus beli alat baru?"
 *
 * Menggantikan "Di balik layar": demo realtime di sana sudah terjawab oleh
 * section Cara kerja. Logo mitra pembayaran dipindah ke sini supaya tampil
 * bersama konteksnya, bukan berdiri sendiri di bawah hero.
 */

const points = [
  {
    icon: CreditCard,
    title: "Pembayaran berizin",
    body: "Pembayaran online diproses Midtrans, penyelenggara jasa pembayaran berizin. Menuin tidak menyimpan data kartu.",
  },
  {
    icon: Database,
    title: "Data tiap outlet terpisah",
    body: "Data setiap outlet disimpan terpisah di basis data dan tidak pernah bercampur dengan outlet lain.",
  },
  {
    icon: History,
    title: "Setiap perubahan tercatat",
    body: "Akses dibatasi sesuai peran, dan setiap pembatalan transaksi wajib disertai alasan.",
  },
  {
    icon: MonitorSmartphone,
    title: "Tanpa beli perangkat baru",
    body: "Jalan di tablet, laptop, dan ponsel yang sudah ada, dengan printer termal 58 atau 80 mm.",
  },
];

// Hanya mitra pembayaran yang benar-benar terintegrasi, semua di-host lokal.
// `midtrans-ink.svg` adalah wordmark Midtrans yang fill putihnya ditukar ke
// abu tinta. Tinggi menyamakan bobot optis, bukan tinggi kotaknya.
const logos = [
  { name: "Midtrans", src: "/img/brand_logo/midtrans-ink.svg", h: 18 },
  { name: "QRIS", src: "/img/brand_logo/qris.svg", h: 22 },
  { name: "BCA", src: "/img/brand_logo/bca.svg", h: 20 },
  { name: "Bank Mandiri", src: "/img/brand_logo/mandiri.svg", h: 18 },
  { name: "BNI", src: "/img/brand_logo/bni.svg", h: 22 },
];

export default function SecuritySection() {
  return (
    <section id="keamanan" className="border-t border-black/[0.06] px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <ScrollReveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
            Keamanan
          </p>
          <h2 className="mt-4 max-w-[18ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[#0a0a0a] text-balance">
            Aman untuk uang Anda. Tenang untuk data Anda.
          </h2>
        </ScrollReveal>

        <ScrollReveal className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 border-t border-black/[0.08] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E59F9]/[0.07]">
                  <Icon className="h-5 w-5 text-[#0E59F9]" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
                  {p.title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-[14.5px] leading-relaxed text-[#52525b]">
                  {p.body}
                </p>
              </div>
            );
          })}
        </ScrollReveal>

        <div className="mt-16 flex flex-col items-start gap-6 rounded-2xl bg-[#fafafa] px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="text-[13px] text-[#71717a]">Metode pembayaran yang didukung</p>
          <div className="flex flex-wrap items-center gap-x-9 gap-y-4">
            {logos.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                loading="lazy"
                style={{ height: logo.h }}
                className="w-auto opacity-60 grayscale transition-opacity hover:opacity-100"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

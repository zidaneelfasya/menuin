"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lima hal yang berubah — dijalankan oleh scroll.
 *
 * Dua versi sebelumnya gagal karena alasan yang sama: keduanya menyajikan
 * sepuluh kalimat sekaligus. Tabel dua kolom membuat mata membaca semuanya
 * dan tidak merasakan apa pun; saklar Cara lama / Dengan Menuin menuntut
 * pembaca menekan tombol dulu sebelum ada yang terjadi.
 *
 * Di sini section di-pin dan scroll yang menjalankan ceritanya: satu
 * perubahan pada satu waktu, kalimat lama tergeser oleh kalimat baru.
 * Pembaca tidak perlu memutuskan apa pun — cukup terus menggulir.
 */

const steps = [
  {
    topic: "Memesan",
    before: "Tamu melambaikan tangan menunggu pelayan datang membawa buku menu.",
    after: "Tamu memindai QR di meja, membuka menu berfoto, dan memesan saat itu juga.",
    from: "4–8 menit",
    to: "Saat itu juga",
  },
  {
    topic: "Membayar",
    before: "Antrean pembayaran menumpuk di kasir saat jam makan siang.",
    after: "Tamu membayar dari meja lewat QRIS. Kasir fokus pada pesanan takeaway.",
    from: "Satu antrean",
    to: "Tanpa antre",
  },
  {
    topic: "Catatan pesanan",
    before: 'Pesanan salah masak karena catatan tangan "sambal dipisah" terlewat.',
    after: "Catatan tamu tampil persis di layar dapur dan tercetak di struk.",
    from: "Tulisan tangan",
    to: "Teks digital",
  },
  {
    topic: "Tutup shift",
    before: "Uang laci tekor saat pergantian shift dan sumbernya tidak ketahuan.",
    after: "Modal awal, kas keluar, dan hitungan fisik direkonsiliasi sistem.",
    from: "Dicatat manual",
    to: "Tercatat otomatis",
  },
  {
    topic: "Mengawasi",
    before: "Pemilik tidak berani meninggalkan outlet saat jam ramai.",
    after: "Omzet tiap cabang bisa dipantau dari ponsel secara langsung.",
    from: "Harus di tempat",
    to: "Dari mana saja",
  },
];

export default function ComparisonScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const prevIndex = useRef(0);

  // Jalankan cerita dari scroll.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const section = sectionRef.current;
      if (!section) return;

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${steps.length * 420}`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setProgress(self.progress);
          const next = Math.min(
            steps.length - 1,
            Math.floor(self.progress * steps.length)
          );
          setIndex(next);
        },
      });

      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  // Animasikan pergantian langkah.
  useEffect(() => {
    if (prevIndex.current === index) return;
    const dir = index > prevIndex.current ? 1 : -1;
    prevIndex.current = index;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = stageRef.current;
    if (!stage) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-stage-item]",
        { opacity: 0, y: 26 * dir },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 }
      );
    }, stage);

    return () => ctx.revert();
  }, [index]);

  const step = steps[index];

  return (
    <section
      ref={sectionRef}
      className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-20 md:flex md:min-h-screen md:items-center md:py-0"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        {/* Di bawah 768px pin tidak dipasang, jadi panggung yang berganti isi
            tidak akan pernah maju. Semua langkah dirender sebagai daftar biasa
            supaya tidak ada yang tak terjangkau. */}
        <div className="md:hidden">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
            Sebelum dan sesudah
          </p>
          <h2 className="mt-4 font-display text-[clamp(28px,7vw,36px)] font-semibold leading-[1.08] tracking-[-0.035em] text-[#0a0a0a] text-balance">
            Lima hal yang berubah sejak hari pertama.
          </h2>

          <ol className="mt-10 border-t border-black/[0.08]">
            {steps.map((s, i) => (
              <li key={s.topic} className="border-b border-black/[0.08] py-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[13px] tabular-nums text-[#a1a1aa]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[12.5px] uppercase tracking-[0.12em] text-[#71717a]">
                    {s.topic}
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-[#a1a1aa] line-through decoration-[#d4d4d8]">
                  {s.before}
                </p>
                <p className="mt-2 text-[16px] font-medium leading-snug text-[#0a0a0a]">
                  {s.after}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[12.5px] text-[#a1a1aa] line-through">{s.from}</span>
                  <span className="text-[#c4c4c8]">→</span>
                  <span className="rounded-full bg-[#0E59F9]/[0.08] px-3 py-1 text-[12.5px] font-medium text-[#0E59F9]">
                    {s.to}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="hidden grid-cols-1 gap-12 md:grid md:grid-cols-12 md:gap-16">
          {/* Kiri: judul tetap + rel langkah */}
          <div className="md:col-span-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">
              Sebelum dan sesudah
            </p>
            <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(30px,4vw,48px)] font-semibold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] text-balance">
              Lima hal yang berubah sejak hari pertama.
            </h2>

            <ol className="mt-10 hidden md:block">
              {steps.map((s, i) => (
                <li
                  key={s.topic}
                  className="flex items-center gap-4 border-t border-black/[0.08] py-3"
                >
                  <span
                    className={`font-display text-[12px] tabular-nums transition-colors ${
                      i === index ? "text-[#0a0a0a]" : "text-[#c4c4c8]"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-[13.5px] transition-colors ${
                      i === index ? "text-[#0a0a0a]" : "text-[#a1a1aa]"
                    }`}
                  >
                    {s.topic}
                  </span>
                  <span className="ml-auto h-px w-16 bg-black/[0.08]">
                    <span
                      className="block h-px bg-[#0E59F9] transition-[width] duration-200"
                      style={{ width: i === index ? "100%" : i < index ? "100%" : "0%" }}
                    />
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Kanan: panggung yang berganti isi */}
          <div ref={stageRef} className="md:col-span-7">
            <div className="flex items-baseline gap-4">
              <span
                data-stage-item
                className="font-display text-[clamp(56px,7vw,88px)] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[#0a0a0a]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                data-stage-item
                className="text-[13px] uppercase tracking-[0.14em] text-[#71717a]"
              >
                {step.topic}
              </span>
            </div>

            <div className="mt-10 space-y-6">
              <div data-stage-item className="flex gap-4">
                <span className="mt-1 w-16 shrink-0 text-[11.5px] uppercase tracking-[0.12em] text-[#a1a1aa]">
                  Dulu
                </span>
                <p className="max-w-[46ch] text-[16px] leading-relaxed text-[#a1a1aa] line-through decoration-[#d4d4d8]">
                  {step.before}
                </p>
              </div>

              <div data-stage-item className="flex gap-4">
                <span className="mt-1 w-16 shrink-0 text-[11.5px] uppercase tracking-[0.12em] text-[#0E59F9]">
                  Kini
                </span>
                <p className="max-w-[46ch] text-[clamp(18px,2vw,22px)] font-medium leading-snug tracking-[-0.02em] text-[#0a0a0a]">
                  {step.after}
                </p>
              </div>
            </div>

            <div data-stage-item className="mt-10 flex items-center gap-3">
              <span className="rounded-full bg-black/[0.04] px-3.5 py-1.5 text-[13px] text-[#71717a] line-through decoration-[#d4d4d8]">
                {step.from}
              </span>
              <span className="text-[#c4c4c8]">→</span>
              <span className="rounded-full bg-[#0E59F9]/[0.08] px-3.5 py-1.5 text-[13px] font-medium text-[#0E59F9]">
                {step.to}
              </span>
            </div>
          </div>
        </div>

        {/* Progres keseluruhan */}
        <div className="mt-14 hidden h-px w-full bg-black/[0.08] md:block">
          <div
            className="h-px bg-[#0a0a0a]"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

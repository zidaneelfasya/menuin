"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Apakah pelanggan harus mengunduh aplikasi untuk memesan?',
    answer:
      'Tidak. Pelanggan cukup mengarahkan kamera ponsel ke kode QR di meja, dan menu digital langsung terbuka di browser mereka. Tidak ada aplikasi yang perlu dipasang dan tidak ada pendaftaran akun.',
  },
  {
    question: 'Bisakah Menuin dipakai dengan printer kasir yang sudah saya miliki?',
    answer:
      'Bisa, selama printer termal Anda memakai koneksi Bluetooth atau jaringan LAN/WiFi dengan kertas 58 mm atau 80 mm. Struk tamu dan tiket dapur bisa dicetak otomatis.',
  },
  {
    question: 'Bagaimana jika pelanggan ingin membayar tunai di kasir?',
    answer:
      'Tamu bebas memilih. Mereka dapat memesan lewat QR lalu membayar tunai di kasir, atau kasir yang menginput pesanan langsung lewat POS Menuin.',
  },
  {
    question: 'Apakah ada batasan jumlah menu atau transaksi harian?',
    answer:
      'Tidak ada batasan jumlah menu maupun jumlah transaksi pada paket Pro. Biaya berlangganan dihitung per outlet per bulan, bukan per transaksi.',
  },
  {
    question: 'Bagaimana dana dari pembayaran QRIS dicairkan?',
    answer:
      'Pembayaran online diproses melalui Midtrans sebagai penyelenggara jasa pembayaran berizin, lalu diteruskan ke rekening bisnis Anda mengikuti jadwal settlement Midtrans.',
  },
  {
    question: 'Apakah saya perlu membeli iPad atau perangkat khusus?',
    answer:
      'Tidak. Menuin berjalan di perangkat apa pun dengan browser modern: tablet Android, iPad, laptop, maupun ponsel. Tidak ada hardware proprietary yang wajib dibeli.',
  },
  {
    question: 'Bagaimana hak akses kasir, manajer, dan pemilik dipisahkan?',
    answer:
      'Setiap anggota tim diberi peran: Owner, Manajer, Kasir, atau Staf. Data keuangan dan pengaturan sensitif hanya terbuka untuk peran yang berhak, dan setiap pembatalan transaksi wajib disertai alasan sehingga tetap bisa ditelusuri.',
  },
  {
    question: 'Bisakah berhenti berlangganan kapan saja?',
    answer:
      'Bisa. Langganan diperpanjang bulanan tanpa kontrak berjangka. Anda dapat menaikkan, menurunkan, atau menghentikan paket kapan pun tanpa biaya penalti.',
  },
];

export default function FaqEditorial() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-white text-slate-900 pt-24 md:pt-36 pb-36 md:pb-52 px-6 sm:px-10 lg:px-14 border-t border-slate-200" id="faq">
      <div className="mx-auto max-w-[1360px]">
        
        {/* Main 2-Column Split Layout matching the exact reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Clean White & Black Editorial Heading with Blue Accent */}
          <div className="lg:col-span-4 pr-0 lg:pr-6">
            <h2 className="text-[clamp(30px,4.2vw,48px)] font-semibold tracking-[-0.04em] text-[#0a0a0a] leading-[1.05]">
              Tanya jawab.
            </h2>
            <p className="text-slate-500 text-sm sm:text-[15px] mt-4 leading-relaxed max-w-sm">
              Hal-hal yang paling sering ditanyakan pemilik usaha sebelum mulai memakai Menuin.
            </p>
          </div>

          {/* Right Column: Clean Accordion Rows with Full-Width Dividers in Pure White, Black & Blue */}
          <div className="lg:col-span-8 border-t border-slate-200">
            {faqData.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border-b border-slate-200 transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-4 sm:py-5 flex items-center justify-between text-left group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] sm:text-[16.5px] font-medium tracking-[-0.01em] text-[#0a0a0a] group-hover:text-[#0E59F9] transition-colors pr-6 leading-snug">
                      {faq.question}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Subtle Open Badge on Desktop Hover */}
                      <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 group-hover:text-[#0E59F9] opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOpen ? "TUTUP" : "BUKA"}
                      </span>
                      
                      {/* Minimalist Plus / Minus Indicator */}
                      <span className="w-6 h-6 flex items-center justify-center text-slate-900 group-hover:text-[#0E59F9] transition-all">
                        {isOpen ? (
                          <Minus className="w-4 h-4 text-[#0E59F9] transition-transform duration-200" />
                        ) : (
                          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Smooth Animated Answer Body */}
                  {isOpen && (
                    <div className="pb-5 sm:pb-6 pt-1 text-slate-600 text-sm sm:text-[14.5px] leading-relaxed max-w-2xl pr-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}

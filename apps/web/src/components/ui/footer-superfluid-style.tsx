"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function FooterSuperfluidStyle() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#0E59F9] text-white overflow-hidden pt-16 pb-8 px-6 sm:px-10 lg:px-14 select-none">
      <div className="mx-auto max-w-[1400px]">
        
        {/* Top Section: Newsletter (Left) & Nav Columns (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-14 items-start">
          
          {/* Left Column: Heading + Underline Email Input */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold tracking-[-0.035em] leading-[1.1] max-w-md">
                Tetap kabari saya soal Menuin.
              </h3>
            </div>

            {/* Minimal Underlined Email Input */}
            <form onSubmit={handleSubmit} className="mt-8 max-w-sm">
              <div className="relative border-b-2 border-white pb-2 flex items-center justify-between group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Anda"
                  required
                  className="bg-transparent text-sm sm:text-base font-medium placeholder:text-white/60 focus:outline-none w-full text-white"
                />
                <button
                  type="submit"
                  className="text-sm font-semibold hover:text-white/80 active:scale-95 transition-all pl-3 shrink-0"
                >
                  Kirim
                </button>
              </div>

              <p className="text-[12px] mt-2.5 text-white/80">
                {subscribed ? (
                  <span className="text-emerald-300">✓ Terima kasih, email Anda sudah kami catat.</span>
                ) : (
                  "Kabar fitur baru dan tips operasional outlet, sesekali saja."
                )}
              </p>
            </form>
          </div>

          {/* Right Column: 3 Nav Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 text-[13px]">
            
            {/* Kolom 1: Produk */}
            <div className="space-y-3">
              <h4 className="font-semibold uppercase text-[11px] text-white/90 tracking-[0.14em]">
                Produk
              </h4>
              <ul className="space-y-2 text-white/80">
                <li><a href="#fitur" className="hover:text-white hover:underline transition-all">QR Self-Order</a></li>
                <li><a href="#fitur" className="hover:text-white hover:underline transition-all">Kasir POS</a></li>
                <li><a href="#fitur" className="hover:text-white hover:underline transition-all">Papan Pesanan</a></li>
                <li><a href="#fitur" className="hover:text-white hover:underline transition-all">Shift &amp; Kas</a></li>
                <li><a href="#fitur" className="hover:text-white hover:underline transition-all">Laporan</a></li>
              </ul>
            </div>

            {/* Kolom 2: Menuin */}
            <div className="space-y-3">
              <h4 className="font-semibold uppercase text-[11px] text-white/90 tracking-[0.14em]">
                Menuin
              </h4>
              <ul className="space-y-2 text-white/80">
                <li><a href="#tentang" className="hover:text-white hover:underline transition-all">Tentang</a></li>
                <li><a href="#alur" className="hover:text-white hover:underline transition-all">Cara kerja</a></li>
                <li><a href="#pricing" className="hover:text-white hover:underline transition-all">Harga</a></li>
                <li><a href="#faq" className="hover:text-white hover:underline transition-all">Tanya jawab</a></li>
                <li><a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Hubungi kami</a></li>
              </ul>
            </div>

            {/* Kolom 3: Ikuti kami */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-semibold uppercase text-[11px] text-white/90 tracking-[0.14em]">
                Ikuti kami
              </h4>
              <ul className="space-y-2 text-white/80">
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Instagram</a></li>
                <li><a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">WhatsApp</a></li>
                <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">TikTok</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Facebook</a></li>
              </ul>
            </div>

          </div>

        </div>

        {/* HERO OFFICIAL WHITE LOGO: menuin-putih.png */}
        <div className="w-full py-4 my-2 flex items-center justify-center">
          <Image
            src="/menuin-putih.png"
            alt="MENUIN"
            width={1200}
            height={280}
            className="w-full max-w-[1300px] h-auto object-contain select-none pointer-events-none drop-shadow-sm"
            priority
            unoptimized={true}
          />
        </div>

        {/* Bottom Bar: Copyright Only */}
        <div className="pt-8 border-t border-white/20 flex items-center justify-center text-center text-xs text-white/80">
          <p>&copy; 2026 Menuin. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

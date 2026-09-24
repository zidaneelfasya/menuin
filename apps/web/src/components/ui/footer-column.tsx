"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Linkedin,
  ArrowUpRight,
} from "lucide-react";

const data = {
  facebookLink: "https://facebook.com",
  instaLink: "https://instagram.com",
  twitterLink: "https://twitter.com",
  linkedinLink: "https://linkedin.com",
  whatsappLink: "https://wa.me/628123456789",
  services: [
    { text: "Barcode Meja (Self-Order)", href: "#features", tag: "HOT" },
    { text: "Sistem Kasir POS Cepat", href: "#features", tag: "POPULAR" },
    { text: "Barcode QRIS Dinamis", href: "#features", tag: "NEW" },
    { text: "Kitchen Display (KDS)", href: "#features" },
    { text: "Kontrol Stok & Bahan", href: "#features" },
    { text: "Laporan Penjualan & Laba", href: "#features" },
  ],
  solutions: [
    { text: "Kedai Kopi & Cafe", href: "#pricing" },
    { text: "Restoran Dine-In", href: "#pricing" },
    { text: "Food Court & Pujasera", href: "#pricing" },
    { text: "Bakery & Pastry", href: "#pricing" },
    { text: "Gerai Booth & Street Food", href: "#pricing" },
    { text: "Jaringan Multi-Cabang", href: "#pricing" },
  ],
  help: [
    { text: "Tanya Jawab (FAQ)", href: "#faq" },
    { text: "Masuk ke Kasir POS", href: "/auth/login" },
    { text: "Daftar Akun Baru", href: "/auth/signup" },
    { text: "Harga & Paket", href: "#pricing" },
    { text: "Live Chat WhatsApp", href: "https://wa.me/628123456789", hasIndicator: true },
  ],
  company: {
    name: "MENUIN",
    description:
      "Sistem POS pintar berbasis Barcode & QR. Mempercepat transaksi meja, kasir, dapur, dan kelola stok untuk bisnis kuliner modern dari satu gerai hingga multi-cabang.",
    address: "Jakarta Selatan, Indonesia",
    email: "halo@menuin.id",
    phone: "+62 812-3456-7890",
  },
};

export default function FooterColumn() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full overflow-hidden pt-16 pb-10 bg-slate-50/50">
      {/* Background Smooth Blue Glow Blurs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 z-0 h-full w-full -translate-x-1/2 select-none"
      >
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-[680px] rounded-full bg-sky-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Glassmorphic Main Card Container */}
        <div className="relative z-10 rounded-3xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(14,89,249,0.08)] p-6 sm:p-10 md:p-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            
            {/* Column 1: Brand Info (Spans 5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
              <Link href="/" className="mb-4 inline-flex items-center gap-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E59F9] to-[#1D4ED8] p-2 shadow-lg shadow-blue-500/25 transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/favicon.ico"
                    alt="MENUIN Logo"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <span className="bg-gradient-to-r from-[#0E59F9] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                  {data.company.name}
                </span>
              </Link>

              <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
                {data.company.description}
              </p>

              {/* Status Badge */}
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Seluruh Layanan POS Normal (99.9% Uptime)</span>
              </div>

              {/* Social Media Icons */}
              <div className="mt-6 flex items-center gap-3">
                <a
                  href={data.instaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-[#0E59F9] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={data.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={data.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-[#1877F2] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={data.twitterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-slate-900 hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={data.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 rounded-xl bg-slate-100/80 hover:bg-[#0A66C2] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Navigation 3 Columns Grid (Spans 7 cols on lg) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
              
              {/* Column 1: Produk */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">
                  Produk
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {data.services.map((item) => (
                    <li key={item.text}>
                      <a
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0E59F9] transition-colors"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {item.text}
                        </span>
                        {item.tag && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                              item.tag === "HOT"
                                ? "bg-rose-100 text-rose-600"
                                : item.tag === "NEW"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Solusi Bisnis */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">
                  Solusi Bisnis
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {data.solutions.map((item) => (
                    <li key={item.text}>
                      <a
                        href={item.href}
                        className="group inline-flex items-center text-slate-600 hover:text-[#0E59F9] transition-colors"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {item.text}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Bantuan & Kontak */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">
                  Bantuan & Akses
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {data.help.map((item) => (
                    <li key={item.text}>
                      <a
                        href={item.href}
                        className="group inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0E59F9] transition-colors"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {item.text}
                        </span>
                        {item.hasIndicator && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Quick Support Contact info */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{data.company.email}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{data.company.address}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Bar Section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 px-2">
          <div>
            <span>&copy; {currentYear} {data.company.name} Indonesia. All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#pricing" className="hover:text-blue-600 transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">
              Keamanan Data SSL
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export const FooterGlow = FooterColumn;
export const Footer4Col = FooterColumn;
export const Component = FooterColumn;

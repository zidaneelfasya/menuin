"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react";

function WhatsAppIcon({
  className,
  strokeWidth = 1.75,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function TikTokIcon({
  className,
  strokeWidth = 1.75,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const WHATSAPP_NUMBER = "6282235594074";

export default function FooterSuperfluidStyle() {
  const [message, setMessage] = useState("");

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = message.trim() || "Halo Menuin, saya ingin bertanya.";
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(query)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <footer className="w-full min-h-screen min-h-[100dvh] bg-[#0E59F9] text-white overflow-hidden pt-12 sm:pt-16 lg:pt-20 pb-4 sm:pb-8 px-6 sm:px-10 lg:px-14 select-none flex flex-col justify-between">
      <div className="mx-auto w-full max-w-[1400px] flex-1 flex flex-col justify-between">
        {/* Top Section: 4 Columns styled after the reference image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          
          {/* Column 1: Contact Us & WhatsApp Input Field */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <h4 className="font-semibold uppercase text-[11px] sm:text-[12px] text-white/50 tracking-[0.22em] mb-5">
              Contact Us
            </h4>
            
            <p className="text-[22px] sm:text-[24px] lg:text-[26px] font-medium leading-tight tracking-[-0.02em] text-white mb-12">
              Ada pertanyaan?
            </p>

            <form onSubmit={handleWhatsAppSubmit} className="max-w-sm">
              <div className="relative border-b-2 border-white/70 focus-within:border-white pb-2 flex items-center justify-between group transition-colors">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ketik pesan Anda..."
                  className="bg-transparent text-[15px] sm:text-[16px] font-normal placeholder:text-white/60 focus:outline-none w-full text-white pr-3"
                />
                <button
                  type="submit"
                  aria-label="Kirim ke WhatsApp"
                  className="text-[14px] font-semibold text-white hover:text-white/80 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span>Kirim</span>
                  
                </button>
              </div>
             
            </form>
          </div>

          {/* Column 2: Navigation (Large editorial typography matching reference) */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <h4 className="font-semibold uppercase text-[11px] sm:text-[12px] text-white/50 tracking-[0.22em] mb-5">
              Navigation
            </h4>
            <ul className="space-y-2 text-[22px] sm:text-[24px] lg:text-[26px] font-medium leading-tight tracking-[-0.02em] text-white">
              <li>
                <Link
                  href="/tentang"
                  className="hover:text-white/75 transition-colors inline-block"
                >
                  Tentang
                </Link>
              </li>
              <li>
                <Link
                  href="/fitur"
                  className="hover:text-white/75 transition-colors inline-block"
                >
                  Fitur
                </Link>
              </li>
              <li>
                <Link
                  href="/harga"
                  className="hover:text-white/75 transition-colors inline-block"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  href="/kontak"
                  className="hover:text-white/75 transition-colors inline-block"
                >
                  Hubungi kami
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white/75 transition-colors inline-block"
                >
                  Tanya jawab
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Mission (Large editorial typography matching reference) */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <h4 className="font-semibold uppercase text-[11px] sm:text-[12px] text-white/50 tracking-[0.22em] mb-5">
              Our Mission
            </h4>
            <p className="text-[22px] sm:text-[24px] lg:text-[26px] font-medium leading-[1.3] tracking-[-0.02em] text-white max-w-[320px]">
              To make running and growing business simpler.
            </p>
          </div>

          {/* Column 4: Follow Us (Horizontal stroke icons aligned with reference) */}
          <div className="lg:col-span-2 flex flex-col justify-start">
            <h4 className="font-semibold uppercase text-[11px] sm:text-[12px] text-white/50 tracking-[0.22em] mb-5">
              Follow Us
            </h4>
            <div className="flex items-center gap-5 pt-1 text-white/85">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <Twitter className="h-6 w-6" strokeWidth={1.75} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <Instagram className="h-6 w-6" strokeWidth={1.75} />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <WhatsAppIcon className="h-6 w-6" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <TikTokIcon className="h-6 w-6" strokeWidth={1.75} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-white hover:scale-110 transition-all duration-200"
              >
                <Facebook className="h-6 w-6" strokeWidth={1.75} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Group: Tagline + Big Logo anchored to bottom */}
        <div className="w-full flex flex-col items-center pt-8">
          {/* Tagline & misi (di atas logo dengan jarak yang rapat) */}
          <div className="pt-2 pb-0 text-center">
            <p className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.01em] text-white">
              Simple Ways to Run Business
            </p>
           
          </div>

          {/* HERO OFFICIAL WHITE LOGO: menuin-putih.png (di bawah tagline dengan jarak sangat rapat) */}
          <div className="w-full -mt-6 sm:-mt-12 md:-mt-16 lg:-mt-20 flex items-center justify-center">
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
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Zap, Heart } from "lucide-react";

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
              <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight leading-[1.1] max-w-md">
                UPGRADE YOUR BUSINESS WITH MENUIN
              </h3>
            </div>

            {/* Minimal Underlined Email Input */}
            <form onSubmit={handleSubmit} className="mt-8 max-w-sm">
              <div className="relative border-b-2 border-white pb-2 flex items-center justify-between group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL"
                  required
                  className="bg-transparent text-sm sm:text-base font-bold uppercase placeholder:text-white/60 focus:outline-none w-full tracking-wider text-white"
                />
                <button
                  type="submit"
                  className="text-xs font-black tracking-widest uppercase hover:text-white/80 active:scale-95 transition-all pl-3 shrink-0"
                >
                  OK
                </button>
              </div>

              <p className="text-[10.5px] font-bold tracking-wider uppercase mt-2.5 text-white/80">
                {subscribed ? (
                  <span className="text-emerald-300">✓ THANK YOU! WE WILL REACH OUT SHORTLY.</span>
                ) : (
                  "FREE POS CONSULTATION & FEATURE UPDATES"
                )}
              </p>
            </form>
          </div>

          {/* Right Column: 3 Nav Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 text-xs tracking-wider">
            
            {/* Column 1: HELP & FEATURES */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[11px] text-white/90 tracking-widest">
                HELP & FEATURES
              </h4>
              <ul className="space-y-2 text-white/80 font-bold">
                <li><a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Contact Us</a></li>
                <li><a href="#faq" className="hover:text-white hover:underline transition-all">FAQs</a></li>
                <li><a href="#features" className="hover:text-white hover:underline transition-all">QR Table Ordering</a></li>
                <li><a href="#features" className="hover:text-white hover:underline transition-all">POS Cashier System</a></li>
                <li><a href="#features" className="hover:text-white hover:underline transition-all">Dynamic QRIS</a></li>
                <li><a href="#features" className="hover:text-white hover:underline transition-all">Kitchen Display (KDS)</a></li>
              </ul>
            </div>

            {/* Column 2: LEGAL & INFO */}
            <div className="space-y-3">
              <h4 className="font-black uppercase text-[11px] text-white/90 tracking-widest">
                LEGAL & INFO
              </h4>
              <ul className="space-y-2 text-white/80 font-bold">
                <li><a href="#pricing" className="hover:text-white hover:underline transition-all">Privacy Policy</a></li>
                <li><a href="#pricing" className="hover:text-white hover:underline transition-all">Terms & Conditions</a></li>
                <li><a href="#pricing" className="hover:text-white hover:underline transition-all">SSL Security</a></li>
                <li><a href="#pricing" className="hover:text-white hover:underline transition-all">Pricing Plans</a></li>
                <li><a href="#partner" className="hover:text-white hover:underline transition-all">Partner Program</a></li>
              </ul>
            </div>

            {/* Column 3: FOLLOW US */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-black uppercase text-[11px] text-white/90 tracking-widest">
                FOLLOW US
              </h4>
              <ul className="space-y-2 text-white/80 font-bold">
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">Instagram</a></li>
                <li><a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-all">WhatsApp Support</a></li>
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
          />
        </div>

        {/* Bottom Bar: Trust Badges (Left) & Copyright + Payments (Right) */}
        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold text-white/85">
          
          {/* Left: Value / Trust Badges with minimal icons */}
          <div className="flex items-center gap-6 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>LIGHTNING FAST POS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-BIT SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>CRAFTED IN INDONESIA</span>
            </div>
          </div>

          {/* Right: Copyright & Supported Gateways */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-5">
            <span>&copy; 2026 MENUIN Indonesia. All Rights Reserved.</span>
            <div className="flex items-center gap-2 opacity-90 text-[10px] uppercase tracking-wider font-extrabold bg-white/10 px-3 py-1 rounded-md">
              <span>QRIS</span>
              <span>•</span>
              <span>BCA</span>
              <span>•</span>
              <span>MANDIRI</span>
              <span>•</span>
              <span>MIDTRANS</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}

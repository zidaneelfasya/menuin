"use client";

import React from "react";
import Link from "next/link";

export default function FooterReadyToBegin({
  title = "Ready to Transform Your F&B Business?",
  subtitle = "Digitize orders, cashier POS, table QR codes, kitchen display, inventory, and analytics in one powerful platform.",
  buttonText = "Get Started Now",
  buttonLink = "/auth/signup",
}: {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}) {
  return (
    <section className="w-full bg-[#0E59F9] text-white py-20 px-6 sm:px-8">
      <div className="mx-auto max-w-4xl flex flex-col items-center text-center">
        {/* Brand Favicon Logo Badge */}
        <div className="mb-6 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <div className="w-full h-full rounded-2xl bg-white shadow-md flex items-center justify-center p-3 transition-transform duration-200 hover:scale-105">
            <img
              src="/favicon.ico"
              alt="MENUIN Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-white leading-tight mb-3">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed mb-8">
          {subtitle}
        </p>

        {/* White Pill CTA Button */}
        <Link
          href={buttonLink}
          className="inline-flex items-center gap-1.5 px-8 py-3.5 rounded-full bg-white text-[#0E59F9] font-bold text-sm sm:text-base shadow-lg shadow-blue-950/20 hover:bg-white/95 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span>{buttonText}</span>
          <span className="font-bold ml-0.5">&gt;</span>
        </Link>
      </div>
    </section>
  );
}

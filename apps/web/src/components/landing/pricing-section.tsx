"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PricingCards } from "./pricing-cards";

export function PricingHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start justify-between gap-6 md:flex-row md:items-end ${className}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Harga
        </p>
        <h2
          id="pricing-heading"
          className="mt-3.5 max-w-[18ch] text-[clamp(30px,4.2vw,48px)] font-semibold leading-[1.08] tracking-[-0.04em] text-zinc-950 text-balance"
        >
          Harga jelas, bayar bulanan atau tahunan.
        </h2>
      </div>
      <Link
        href="/harga"
        className="inline-flex items-center gap-1.5 text-sm sm:text-[15px] font-medium text-[#0E59F9] hover:text-[#0C4CD6] transition-colors group"
      >
        <span>Bandingkan semua fitur</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="relative w-full bg-white px-4 py-20 sm:px-6 sm:py-28 md:py-32"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* HEADER */}
        <PricingHeader />

        {/* PRICING CARDS */}
        <div className="mt-12 sm:mt-16">
          <PricingCards />
        </div>
      </div>
    </section>
  );
}

export default PricingSection;

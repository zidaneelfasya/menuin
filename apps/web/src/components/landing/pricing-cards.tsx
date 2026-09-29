"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  ANNUAL_FREE_MONTHS,
  planPrice,
  plans,
  type BillingCycle,
} from "@/components/landing/pricing-data";

const cycles: { id: BillingCycle; label: string }[] = [
  { id: "monthly", label: "Bulanan" },
  { id: "annual", label: "Tahunan" },
];

/**
 * Warna kartu: Kasir putih, Kasir Plus dan Custom biru muda,
 * Lengkap biru penuh sebagai paket unggulan.
 */
const tones = [
  { card: "bg-white ring-1 ring-black/[0.08]", dark: false, text: "" },
  { card: "bg-[#f3f7ff] ring-1 ring-[#0E59F9]/15", dark: false, text: "" },
  { card: "bg-[#0E59F9] ring-1 ring-[#0E59F9]", dark: true, text: "text-[#0E59F9]" },
  { card: "bg-[#f3f7ff] ring-1 ring-[#0E59F9]/15", dark: false, text: "" },
];

/** Kartu paket — dipakai di landing (ringkas) dan di /harga. */
export function PricingCards() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div role="radiogroup" aria-label="Siklus tagihan" className="inline-flex rounded-full bg-[#0a0a0a]/[0.04] p-1">
          {cycles.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={cycle === c.id}
              onClick={() => setCycle(c.id)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-medium transition-colors ${
                cycle === c.id ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#52525b] hover:text-[#0a0a0a]"
              }`}
            >
              {c.label}
              {c.id === "annual" && (
                <span className="rounded-full bg-[#0E59F9]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0E59F9]">
                  Hemat {ANNUAL_FREE_MONTHS} bulan
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {plans.map((plan, i) => {
          const tone = tones[Math.min(i, tones.length - 1)];
          const dark = tone.dark;
          const { price, original, period } = planPrice(plan, cycle);
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-[28px] p-7 ${tone.card} ${
                plan.highlight
                  ? "shadow-[0_40px_80px_-40px_rgba(14,89,249,0.6)] lg:py-10"
                  : "lg:my-6"
              }`}
            >
              {plan.highlight && (
                <span className="absolute right-6 top-6 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0E59F9]">
                  Paling lengkap
                </span>
              )}
              <h3
                className={`text-[18px] font-semibold tracking-[-0.02em] ${
                  dark ? "text-white" : plan.highlight ? "text-[#0E59F9]" : "text-[#0a0a0a]"
                }`}
              >
                {plan.name}
              </h3>
              <p className={`mt-1.5 min-h-[42px] text-[14px] leading-snug ${dark ? "text-white/75" : "text-[#71717a]"}`}>
                {plan.tagline}
              </p>

              <div className="mt-6 min-h-[20px]">
                {original && (
                  <span
                    className={`text-[14px] line-through tabular-nums ${
                      dark ? "text-white/60 decoration-white/60" : "text-[#a1a1aa] decoration-[#ef4444]/70"
                    }`}
                  >
                    {original}
                  </span>
                )}
              </div>
              <div className={`flex flex-wrap items-baseline gap-x-1.5 ${dark ? "text-white" : "text-[#0a0a0a]"}`}>
                <span className="text-[clamp(26px,2.4vw,32px)] font-semibold tracking-[-0.035em] tabular-nums">{price}</span>
                {period && (
                  <span className={`text-[13px] ${dark ? "text-white/70" : "text-[#71717a]"}`}>{period}</span>
                )}
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.bullets.map((b) => {
                  const featured = plan.featured?.includes(b);
                  return (
                    <li key={b} className="flex items-start gap-3 text-[14px] leading-snug">
                      <span
                        className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                          dark ? (featured ? "bg-white" : "bg-white/20") : featured ? "bg-[#0E59F9]" : "bg-[#0E59F9]/10"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${dark ? (featured ? "text-[#0E59F9]" : "text-white") : featured ? "text-white" : "text-[#0E59F9]"}`}
                          strokeWidth={3}
                        />
                      </span>
                      <span
                        className={
                          dark ? (featured ? "font-semibold text-white" : "text-white/90") : featured ? "font-semibold text-[#0a0a0a]" : "text-[#3f3f46]"
                        }
                      >
                        {b}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href={plan.cta.href}
                className={`mt-8 inline-flex h-11 items-center justify-center gap-1.5 rounded-full text-[14.5px] font-medium transition-colors ${
                  dark
                    ? `bg-white ${tone.text} hover:bg-white/90`
                    : "bg-white text-[#0a0a0a] ring-1 ring-black/[0.08] hover:bg-[#fafafa]"
                }`}
              >
                {plan.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

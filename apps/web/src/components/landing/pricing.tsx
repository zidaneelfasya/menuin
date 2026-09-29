import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { comparison, plans, type Cell } from "@/components/landing/pricing-data";

/**
 * Warna kartu dari kiri ke kanan: makin ke kanan makin biru.
 * Kartu Lengkap memakai biru penuh, Custom biru tua yang lebih gelap.
 */
const tones = [
  { card: "bg-white ring-1 ring-black/[0.08]", dark: false, text: "" },
  { card: "bg-[#f3f7ff] ring-1 ring-[#0E59F9]/15", dark: false, text: "" },
  { card: "bg-[#0E59F9] ring-1 ring-[#0E59F9]", dark: true, text: "text-[#0E59F9]" },
  { card: "bg-[#0B2A6F] ring-1 ring-[#0B2A6F]", dark: true, text: "text-[#0B2A6F]" },
];

/** Kartu paket — dipakai di landing (ringkas) dan di /harga. */
export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {plans.map((plan, i) => {
        const tone = tones[Math.min(i, tones.length - 1)];
        const dark = tone.dark;
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
              {plan.originalPrice && (
                <span
                  className={`text-[14px] line-through tabular-nums ${
                    dark ? "text-white/60 decoration-white/60" : "text-[#a1a1aa] decoration-[#ef4444]/70"
                  }`}
                >
                  {plan.originalPrice}
                </span>
              )}
            </div>
            <div className={`flex flex-wrap items-baseline gap-x-1.5 ${dark ? "text-white" : "text-[#0a0a0a]"}`}>
              <span className="text-[clamp(26px,2.4vw,32px)] font-semibold tracking-[-0.035em] tabular-nums">{plan.price}</span>
              {plan.period && (
                <span className={`text-[13px] ${dark ? "text-white/70" : "text-[#71717a]"}`}>{plan.period}</span>
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
  );
}

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#0E59F9]/10">
        <Check className="h-3.5 w-3.5 text-[#0E59F9]" strokeWidth={3} />
        <span className="sr-only">Termasuk</span>
      </span>
    );
  if (value === false)
    return (
      <span className="mx-auto flex h-6 w-6 items-center justify-center">
        <Minus className="h-4 w-4 text-[#d4d4d8]" />
        <span className="sr-only">Tidak termasuk</span>
      </span>
    );
  return <span className="text-[13.5px] font-medium text-[#0a0a0a]">{value}</span>;
}

/** Tabel perbandingan fitur per paket — halaman /harga. */
export function PricingTable() {
  return (
    <div className="overflow-x-auto rounded-[28px] ring-1 ring-black/[0.08]">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead className="sticky top-0">
          <tr className="bg-white">
            <th className="w-[32%] px-6 py-5 text-[13px] font-medium text-[#71717a]">Fitur</th>
            {plans.map((p) => (
              <th key={p.id} className="px-4 py-5 text-center">
                <span className={`text-[15px] font-semibold ${p.highlight ? "text-[#0E59F9]" : "text-[#0a0a0a]"}`}>{p.name}</span>
                <span className="mt-0.5 block text-[12px] font-normal text-[#71717a]">{p.price}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((g) => (
            <React.Fragment key={g.group}>
              <tr>
                <td colSpan={plans.length + 1} className="bg-[#fafafa] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#52525b]">
                  {g.group}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label} className="border-t border-black/[0.05]">
                  <td className="px-6 py-4">
                    <span className="block text-[14.5px] text-[#0a0a0a]">{r.label}</span>
                    {r.hint && <span className="mt-0.5 block text-[12.5px] text-[#71717a]">{r.hint}</span>}
                  </td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`px-4 py-4 text-center ${plans[i].highlight ? "bg-[#0E59F9]/[0.03]" : ""}`}>
                      <CellValue value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

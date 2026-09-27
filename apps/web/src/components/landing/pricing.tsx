import React from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { comparison, plans, type Cell } from "@/components/landing/pricing-data";

/** Kartu paket — dipakai di landing (ringkas) dan di /harga. */
export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`relative flex flex-col rounded-[28px] p-7 sm:p-8 ${
            plan.highlight
              ? "bg-[#0a0a0a] text-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.6)]"
              : "bg-white ring-1 ring-black/[0.08]"
          }`}
        >
          {plan.highlight && (
            <span className="absolute right-6 top-6 rounded-full bg-[#0E59F9] px-2.5 py-1 text-[11px] font-semibold text-white">
              Paling dipilih
            </span>
          )}
          <h3 className={`text-[18px] font-semibold tracking-[-0.02em] ${plan.highlight ? "text-white" : "text-[#0a0a0a]"}`}>
            {plan.name}
          </h3>
          <p className={`mt-1.5 text-[14px] ${plan.highlight ? "text-white/60" : "text-[#71717a]"}`}>{plan.tagline}</p>

          <div className="mt-7 flex items-baseline gap-1.5">
            <span className="text-[clamp(28px,3vw,36px)] font-semibold tracking-[-0.035em] tabular-nums">{plan.price}</span>
            {plan.period && (
              <span className={`text-[13px] ${plan.highlight ? "text-white/55" : "text-[#71717a]"}`}>{plan.period}</span>
            )}
          </div>

          <ul className="mt-7 flex-1 space-y-3">
            {plan.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[14px]">
                <Check
                  className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-[#7aa8ff]" : "text-[#0E59F9]"}`}
                  strokeWidth={2.5}
                />
                <span className={plan.highlight ? "text-white/85" : "text-[#3f3f46]"}>{b}</span>
              </li>
            ))}
          </ul>

          <Link
            href={plan.cta.href}
            className={`mt-8 inline-flex h-11 items-center justify-center gap-1.5 rounded-full text-[14.5px] font-medium transition-colors ${
              plan.highlight
                ? "bg-[#0E59F9] text-white hover:bg-[#0C4CD6]"
                : "bg-[#0a0a0a]/[0.04] text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.08]"
            }`}
          >
            {plan.cta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      ))}
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
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="sticky top-0">
          <tr className="bg-white">
            <th className="w-[40%] px-6 py-5 text-[13px] font-medium text-[#71717a]">Fitur</th>
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
                <td colSpan={4} className="bg-[#fafafa] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#52525b]">
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

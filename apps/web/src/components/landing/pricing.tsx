import React from "react";
import { Check, Minus } from "lucide-react";
import { comparison, planPrice, plans, type Cell } from "@/components/landing/pricing-data";

export { PricingCards } from "@/components/landing/pricing-cards";

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
                <span className="mt-0.5 block text-[12px] font-normal text-[#71717a]">{planPrice(p, "monthly").price}</span>
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

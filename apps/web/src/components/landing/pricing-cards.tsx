"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  ANNUAL_FREE_MONTHS,
  planPrice,
  plans,
  type BillingCycle,
} from "@/components/landing/pricing-data";

const cycles: { id: BillingCycle; label: string; badge?: string }[] = [
  { id: "monthly", label: "1 Bulan" },
  { id: "quarterly", label: "3 Bulan" },
  { id: "annual", label: "1 Tahun", badge: "Best Deal" },
];

/**
 * PricingCards:
 * - Basic: Abu samar halus (bg-[#F6F7F9]) dengan inner card putih (bg-white) dan tombol putih.
 * - Pro (Tengah): Biru solid Menuin (bg-[#0E59F9]) dengan inner card putih bersih (bg-white) dan tombol putih teks biru.
 * - Promax (Kanan): Hitam charcoal / zinc-900 (bg-[#18181b]) persis gaya referensi,
 *   dengan inner card zinc-800 (bg-[#27272a]), checkmark icon zinc-800 bulat, dan tombol biru Menuin (#0E59F9).
 * - Switcher siklus: 1 Bulan, 3 Bulan, 1 Tahun [Best Deal].
 * - Persen hemat dihitung dari harga asli 1 bulan dan ditampilkan di dalam kartu harga 3 bulan dan 1 tahun.
 * - Semua outer card: 100% borderless (border-none) dan tanpa shadow (shadow-none).
 * - Ketinggian kartu berjenjang (Basic ringkas, Pro sedang, Promax paling tinggi).
 */
export function PricingCards() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const displayPlans = plans.filter((p) => p.id !== "custom");

  return (
    <div>
      {/* Billing Cycle Switcher - 1 Bulan | 3 Bulan | 1 Tahun (Best Deal) */}
      <div className="mb-12 flex justify-center">
        <div
          role="radiogroup"
          aria-label="Siklus tagihan"
          className="grid w-full max-w-[540px] grid-cols-3 rounded-full bg-[#F5F6F8] p-1.5 border-none shadow-none select-none"
        >
          {cycles.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={cycle === c.id}
              onClick={() => setCycle(c.id)}
              className={`h-11 rounded-full px-2 sm:px-4 text-[12.5px] sm:text-[13.5px] font-medium transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                cycle === c.id
                  ? "bg-[#0E59F9] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <span>{c.label}</span>
              {c.badge && (
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    cycle === c.id
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-[#0E59F9]"
                  }`}
                >
                  {c.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid 3 Kartu Pricing: Basic (+ Pro Teaser) | Pro (+ Promax Teaser) | Promax */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-7">
        {displayPlans.map((plan) => {
          const { price, original, period, savingsPercent } = planPrice(plan, cycle);
          const isBasic = plan.id === "basic";
          const isPro = plan.id === "pro";
          const isPromax = plan.id === "promax";

          // Skema warna kartu luar (outer card)
          // Promax menggunakan zinc-900 (#18181b) persis seperti kartu hitam pada gambar referensi
          const outerBg = isBasic
            ? "bg-[#F6F7F9] text-slate-900"
            : isPro
            ? "bg-[#0E59F9] text-white"
            : "bg-[#18181b] text-white";

          // Skema warna kartu dalam (inner header card)
          // Pro menggunakan inner card putih (bg-white) sesuai permintaan user
          const innerCardBg = isBasic
            ? "bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
            : isPro
            ? "bg-white text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            : "bg-[#27272a] text-white shadow-none";

          // Skema warna tombol CTA (Promax tetap menggunakan tombol biru Menuin sesuai instruksi "selain tombolnya")
          const ctaBtnStyle = isBasic
            ? "bg-white text-slate-800 hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            : isPro
            ? "bg-white text-[#0E59F9] hover:bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.15)] font-semibold"
            : "bg-[#0E59F9] text-white hover:bg-[#0b4de0] shadow-[0_4px_16px_rgba(0,0,0,0.3)] font-semibold";

          // Skema warna garis pembatas putus-putus
          const dividerBorder = isBasic
            ? "border-slate-300/80"
            : isPro
            ? "border-white/25"
            : "border-zinc-800";

          // Skema warna sub-header cakupan paket
          const subHeaderColor = isBasic
            ? "text-slate-400"
            : isPro
            ? "text-white/70"
            : "text-zinc-400";

          return (
            <div key={plan.id} className="flex flex-col gap-4 sm:gap-5">
              <article
                className={`relative flex flex-col rounded-[32px] ${outerBg} p-1.5 sm:p-2 pb-8 sm:pb-9 border-none shadow-none transition-all duration-200 ${
                  isPromax ? "h-full justify-between" : ""
                }`}
              >
                {/* INNER CARD (Nama Tier & Deskripsi) - Bersih tanpa badge */}
                <div className={`rounded-[24px] ${innerCardBg} px-6 sm:px-7 py-9 sm:py-11 border-none`}>
                  <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-2.5 min-h-[42px] text-[13.5px] leading-relaxed ${
                      isBasic || isPro
                        ? "text-slate-500"
                        : "text-zinc-400"
                    }`}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* AREA HARGA, CTA & FITUR */}
                <div className="px-4 sm:px-5">
                  {/* Nominal Harga, Strikethrough & Persen Hemat */}
                  <div className="mt-6">
                    {original ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13px] line-through tabular-nums ${
                            isBasic
                              ? "text-slate-400 decoration-slate-400/80"
                              : isPro
                              ? "text-white/70 decoration-white/70"
                              : "text-zinc-500 decoration-zinc-500/80"
                          }`}
                        >
                          {original}
                        </span>
                        {savingsPercent && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                              isBasic
                                ? "bg-emerald-100 text-emerald-700"
                                : isPro
                                ? "bg-white/20 text-white"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            }`}
                          >
                            {savingsPercent}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}

                    <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[clamp(28px,2.5vw,34px)] font-semibold tracking-[-0.035em] tabular-nums">
                        {price}
                      </span>
                      {period && (
                        <span
                          className={`text-[13px] font-normal ${
                            isBasic
                              ? "text-slate-500"
                              : isPro
                              ? "text-white/80"
                              : "text-zinc-400"
                          }`}
                        >
                          {period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tombol CTA Langsung di Bawah Harga */}
                  <div className="mt-6 ">
                    <Link
                      href={plan.cta.href}
                      className={`inline-flex py-7 h-11 w-full items-center justify-center rounded-full text-[14px] transition-all duration-150 cursor-pointer border-none select-none active:scale-[0.98] ${ctaBtnStyle}`}
                    >
                      {plan.cta.label}
                    </Link>
                  </div>

                  {/* Garis Pembatas Putus-Putus */}
                  <div className={`my-6 border-t border-dotted ${dividerBorder}`} />

                  {/* Sub-Header Cakupan Paket */}
                  <div className={`mb-4 text-[11px] font-semibold ${subHeaderColor}`}>
                    {plan.includedLabel} 
                  </div>

                  {/* Daftar Fitur - Bersih tanpa label badge */}
                  <ul className="space-y-3.5">
                    {plan.features.map((item, idx) => {
                      // 1. Fitur warisan / bawaan tier sebelumnya
                      if (item.isInherited) {
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                isBasic
                                  ? "bg-white text-slate-400 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                                  : isPro
                                  ? "bg-white/15 text-white/90"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </span>
                            <span
                              className={
                                isBasic
                                  ? "text-slate-500 font-normal"
                                  : isPro
                                  ? "text-white/75 font-normal"
                                  : "text-zinc-400 font-normal"
                              }
                            >
                              {item.text}
                            </span>
                          </li>
                        );
                      }

                      // 2. Fitur baru yang di-unlock di tier ini
                      if (item.isNew) {
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-[14px] leading-snug">
                            <span
                              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full shadow-xs ${
                                isPro
                                  ? "bg-white text-[#0E59F9]"
                                  : isPromax
                                  ? "bg-zinc-800 text-white"
                                  : "bg-[#0E59F9] text-white"
                              }`}
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <div className="flex-1">
                              <span className={`font-medium ${isPromax ? "text-white" : ""}`}>{item.text}</span>
                            </div>
                          </li>
                        );
                      }

                      // 3. Default fitur Basic
                      return (
                        <li key={idx} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-white text-[#0E59F9] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          </span>
                          <span className="text-slate-700 font-medium">{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>

              {/* Card Callout / Teaser di Bawah Basic (Gaya Pro Biru) */}
              {isBasic && (
                <div className="flex flex-1 flex-col justify-between rounded-[28px] bg-[#0E59F9] p-6 text-white border-none shadow-none transition-all duration-200">
                  <div>
                    <span className="text-sm font-semibold text-blue-200">
                      Tingkatkan ke Pro
                    </span>
                    <h4 className="mt-2 text-[17px] font-medium leading-snug text-white">
                      Ingin Scan AI, Kelola Stok Bahan & Modifier?
                    </h4>
                  
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/auth/signup?plan=pro"
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-[13.5px] font-semibold text-[#0E59F9] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Pilih Paket Pro
                    </Link>
                  </div>
                </div>
              )}

              {/* Card Callout / Teaser di Bawah Pro (Gaya Promax Hitam Charcoal) */}
              {isPro && (
                <div className="flex flex-1 flex-col justify-between rounded-[28px] bg-[#18181b] p-6 text-white border-none shadow-none transition-all duration-200">
                  <div>
                    <span className="text-sm font-semibold text-zinc-400">
                      Tingkatkan ke Promax
                    </span>
                    <h4 className="mt-2 text-[17px] font-medium leading-snug text-white">
                      Siap untuk Self-Order Meja & Alur Dapur KDS?
                    </h4>
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/auth/signup?plan=promax"
                      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0E59F9] text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#0b4de0] active:scale-[0.98]"
                    >
                      Pilih Paket Promax
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

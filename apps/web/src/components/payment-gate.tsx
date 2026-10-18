"use client";

import { useState } from "react";
import { Check, Lock, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/actions/auth";
import { DISPLAY_PLAN_GROUPS, type BillingCycle } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/utils/format";

export function PaymentGate({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0E59F9]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-16 space-y-8">
        {/* Locked header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <Lock className="h-6 w-6 text-[#0E59F9]" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#0E59F9] uppercase tracking-wider block">
              {user.restaurantName ?? "Bisnis Anda"}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard Terkunci
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hai {user.name}, akun Anda sudah dibuat tetapi belum aktif. Pilih paket langganan untuk membuka akses penuh ke dashboard MENUIN.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="pt-2 flex justify-center">
            <div
              role="radiogroup"
              aria-label="Siklus tagihan"
              className="inline-flex items-center rounded-full bg-white p-1 ring-1 ring-slate-200 shadow-sm"
            >
              <button
                type="button"
                role="radio"
                aria-checked={cycle === "monthly"}
                onClick={() => setCycle("monthly")}
                className={`h-9 px-4 rounded-full text-xs font-semibold transition-all ${
                  cycle === "monthly"
                    ? "bg-[#0E59F9] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={cycle === "annual"}
                onClick={() => setCycle("annual")}
                className={`h-9 px-4 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  cycle === "annual"
                    ? "bg-[#0E59F9] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tahunan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    cycle === "annual"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  Hemat 2 Bulan
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {DISPLAY_PLAN_GROUPS.map((group) => {
            const plan = group[cycle];
            const isHighlighted = group.highlighted;

            return (
              <div
                key={group.id}
                className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                  isHighlighted
                    ? "ring-2 ring-[#0E59F9] shadow-md shadow-blue-500/5"
                    : "ring-1 ring-slate-200 hover:ring-slate-300 shadow-sm"
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0E59F9] text-white text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Paling Lengkap
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-base font-bold ${
                        isHighlighted ? "text-[#0E59F9]" : "text-slate-900"
                      }`}
                    >
                      {group.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                    {group.tagline}
                  </p>

                  <div className="mb-4">
                    {plan.originalAmount && (
                      <span className="text-xs text-slate-400 line-through block">
                        {formatCurrency(plan.originalAmount)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(plan.amount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        /{cycle === "annual" ? "tahun" : "30 hari"}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-4" />

                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Fitur Termasuk:
                    </span>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      {group.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[#0E59F9] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a
                  href={`/checkout?plan=${plan.code}`}
                  className={`block text-center py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                    isHighlighted
                      ? "bg-[#0E59F9] text-white hover:bg-[#0c4ad4] shadow-sm"
                      : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Pilih {group.name}
                </a>
              </div>
            );
          })}
        </div>

        {/* Secure note + logout footer */}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0E59F9] shrink-0" />
            <p className="text-xs text-slate-600">
              Pembayaran diproses aman melalui <strong>DOKU</strong>, payment gateway berizin Bank Indonesia.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

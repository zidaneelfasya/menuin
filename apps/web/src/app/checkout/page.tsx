import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Check, ShieldCheck } from "lucide-react";
import { getCurrentContext } from "@/lib/actions/auth-context";
import { BILLING_PLANS, getBillingPlan } from "@/lib/billing/plans";
import { formatCurrency } from "@/lib/utils/format";
import { BackButton, PayButton } from "./checkout-client";

export const metadata = { title: "Checkout Langganan - MENUIN" };

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  await connection();
  const context = await getCurrentContext();
  if (!context) redirect("/auth/login");

  const { plan: planParam } = await searchParams;
  const plan = getBillingPlan(planParam) ?? BILLING_PLANS.lengkap_monthly;
  const isOwner = context.membership.role === "OWNER" || (context.membership.role as string) === "SYSTEM_ADMIN";

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0E59F9]" />

      <div className="relative mx-auto max-w-5xl px-4 py-10 md:py-16">
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Detail Pelanggan</h2>
              <div className="h-px bg-slate-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="min-w-0">
                  <span className="text-slate-400 block text-xs">Nama Bisnis</span>
                  <span className="font-semibold text-slate-800 block truncate">{context.tenant.name}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-xs">Email Kontak</span>
                  <span className="font-semibold text-slate-800 block truncate">{context.account.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-100/80 space-y-3">
              <div className="flex items-center gap-2 text-[#0E59F9]">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wide">Transaksi Aman & Terenkripsi</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pembayaran diproses oleh <strong>DOKU</strong>, penyelenggara jasa pembayaran berizin Bank Indonesia.
                Tersedia QRIS, Virtual Account, e-wallet, dan kartu. Langganan aktif otomatis setelah pembayaran terkonfirmasi.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#0E59F9] uppercase tracking-wider block">
                    Pilihan Paket
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {plan.cycle === "annual" ? "Tahunan (365 Hari)" : "Bulanan (30 Hari)"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Paket {plan.name}</h3>

                <div className="mt-3">
                  {plan.originalAmount && (
                    <span className="text-xs text-slate-400 line-through block">
                      {formatCurrency(plan.originalAmount)}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0E59F9]">
                      {formatCurrency(plan.amount)}
                    </span>
                    <span className="text-xs text-slate-400">
                      /{plan.cycle === "annual" ? "tahun" : "30 hari"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Fitur Utama
                </span>
                <ul className="space-y-2 text-xs text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#0E59F9] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-px bg-slate-100" />

              {isOwner ? (
                <PayButton planCode={plan.code} />
              ) : (
                <p className="text-xs text-slate-500 text-center">
                  Hanya pemilik (OWNER) yang dapat membayar langganan. Hubungi pemilik bisnis Anda.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

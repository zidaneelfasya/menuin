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
  const plan = getBillingPlan(planParam) ?? BILLING_PLANS.starter;
  const isOwner = context.membership.role === "OWNER" || (context.membership.role as string) === "SYSTEM_ADMIN";

  return (
    <div className="min-h-screen bg-slate-50/30 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-20">
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 space-y-4">
              <h2 className="font-rounded text-xl font-bold text-slate-900">Detail Pelanggan</h2>
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

            <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-[#2563EB]">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold font-heading uppercase tracking-wide">Transaksi Aman & Terenkripsi</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pembayaran diproses oleh <strong>DOKU</strong>, penyelenggara jasa pembayaran berizin Bank Indonesia.
                Tersedia QRIS, Virtual Account, e-wallet, dan kartu. Langganan aktif otomatis setelah pembayaran terkonfirmasi.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
              <div>
                <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-1">Pilihan Paket</span>
                <h3 className="font-rounded text-2xl font-bold text-slate-900">{plan.name} Plan</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-[#2563EB]">{formatCurrency(plan.amount)}</span>
                  <span className="text-xs text-slate-400">/{plan.periodDays} hari</span>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fitur Utama</span>
                <ul className="space-y-2 text-xs text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{feature}</span>
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

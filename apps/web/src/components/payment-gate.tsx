"use client";

import { Check, Lock, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/actions/auth";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "Rp 99.000",
    period: "/ bulan",
    desc: "Untuk bisnis kecil yang baru mulai digital.",
    features: [
      "Digital Menu & QR Code",
      "Custom Catalog Link",
      "Online Ordering",
      "Basic Analytics Dashboard",
      "1 User Kasir",
    ],
    highlighted: false,
  },
  {
    id: "business",
    name: "Business",
    price: "Rp 199.000",
    period: "/ bulan",
    desc: "Untuk operasional F&B yang lebih lengkap.",
    features: [
      "Semua fitur Starter",
      "Sistem Kasir / POS Utama",
      "Payment Gateway Integration",
      "Real-time Order Management",
      "Advanced Analytics & Charts",
      "Multi-User Staf",
    ],
    highlighted: true,
  },
];

export function PaymentGate({ user }: { user: UserProfile }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/30 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-20 space-y-10">
        {/* Locked header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white border border-slate-100 shadow-lg shadow-slate-100/50">
            <Lock className="h-7 w-7 text-[#2563EB]" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block">
              {user.restaurantName ?? "Bisnis Anda"}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Dashboard Terkunci
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hai {user.name}, akun Anda sudah dibuat tetapi belum aktif. Selesaikan pembayaran untuk membuka akses penuh ke dashboard MENUIN.
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white p-8 rounded-xl flex flex-col justify-between shadow-sm transition-all duration-300 ${
                plan.highlighted
                  ? "border-2 border-[#2563EB] shadow-lg relative"
                  : "border border-slate-200 hover:border-[#2563EB]/30"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Paling Populer
                </span>
              )}
              <div>
                <h4
                  className={`text-sm font-bold uppercase tracking-wider mb-2 ${plan.highlighted ? "text-[#2563EB]" : "text-slate-500"}`}
                >
                  {plan.name}
                </h4>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                <div className="h-px bg-slate-100 my-4" />
                <ul className="space-y-3 text-xs text-slate-600 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`/checkout?email=${encodeURIComponent(user.email)}&plan=${plan.id}`}
                className={`block text-center py-3 rounded-lg text-xs font-bold transition-colors ${
                  plan.highlighted
                    ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                    : "border border-slate-200 text-slate-900 hover:bg-slate-50"
                }`}
              >
                Pilih {plan.name}
              </a>
            </div>
          ))}
        </div>

        {/* Secure note + logout */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#2563EB] shrink-0" />
            <p className="text-xs text-slate-500">
              Pembayaran diproses aman melalui payment gateway resmi (Midtrans).
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

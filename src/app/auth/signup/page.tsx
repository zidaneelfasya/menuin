"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Layout } from "lucide-react";

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save to localStorage for the checkout page
    localStorage.setItem("menuin_dummy_business", businessName);
    localStorage.setItem("menuin_dummy_email", email);

    // Redirect to checkout with the plan parameter
    setTimeout(() => {
      router.push(`/checkout?plan=${plan}`);
    }, 800);
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <img src="/logo/logo.jpeg" alt="MENUIN Logo" className="h-14 w-auto rounded-md" />
        </div>
        <h2 className="font-rounded text-2xl font-bold text-slate-900">Mulai bisnis F&B Anda</h2>
        <p className="text-xs text-slate-500 font-sans">
          Daftarkan akun kasir & menu digital Anda dalam 1 menit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-heading">
            Nama Bisnis / Restoran
          </label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="cth. Kopi Sejahtera"
            className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-sans"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-heading">
            Email Pengguna
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cth. admin@kopisejahtera.com"
            className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-sans"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-heading">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
        >
          {isLoading ? "Menyiapkan Akun..." : "Daftar & Lanjutkan"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 font-sans border-t border-slate-50 pt-4">
        Sudah memiliki akun?{" "}
        <Link href="/auth/login" className="text-[#2563EB] font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-slate-100 shadow-xl flex items-center justify-center min-h-[400px]">
          <span className="text-sm text-slate-500 animate-pulse">Memuat form...</span>
        </div>
      }>
        <SignUpFormContent />
      </Suspense>
    </div>
  );
}

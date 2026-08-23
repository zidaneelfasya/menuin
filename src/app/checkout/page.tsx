"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowLeft, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

import { getDashboardDetailsByEmail, markDashboardAsPaidAction } from "@/lib/actions/auth";

declare global {
  interface Window {
    snap: any;
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve user details from database (by email query) or dummy signup and safely inject Midtrans SDK script
  useEffect(() => {
    const fetchDetails = async () => {
      const paramEmail = searchParams.get("email");
      if (paramEmail) {
        const details = await getDashboardDetailsByEmail(paramEmail);
        if (details) {
          setBusinessName(details.restaurantName);
          setEmail(details.email);
          return;
        }
      }
      
      const storedBusiness = localStorage.getItem("menuin_dummy_business") || "Restoran Baru";
      const storedEmail = localStorage.getItem("menuin_dummy_email") || "owner@menuin.id";
      setBusinessName(storedBusiness);
      setEmail(storedEmail);
    };

    fetchDetails();

    // Inject Midtrans Snap script manually to bypass Next/React HMR removeChild issues
    const scriptId = "midtrans-snap-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
      const isSandbox = clientKey.startsWith("SB-");
      const snapUrl = isSandbox
        ? "https://app.sandbox.midtrans.com/snap/snap.js"
        : "https://app.midtrans.com/snap/snap.js";

      script = document.createElement("script");
      script.src = snapUrl;
      script.id = scriptId;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [searchParams]);

  const planDetails = {
    starter: {
      name: "Starter Plan",
      price: "Rp 99.000",
      rawPrice: 99000,
      period: "bulan",
      features: [
        "Digital Menu & QR Code",
        "Custom Catalog Link",
        "Online Ordering (Self-Checkout)",
        "Basic Analytics Dashboard",
        "1 User Kasir",
      ],
    },
    business: {
      name: "Business Plan",
      price: "Rp 199.000",
      rawPrice: 199000,
      period: "bulan",
      features: [
        "Semua Fitur Starter",
        "Sistem Kasir / POS Utama",
        "Payment Gateway Integration",
        "Real-time Order Management",
        "Advanced Analytics & Charts",
        "Multi-User Staf",
      ],
    },
  }[plan === "business" ? "business" : "starter"];

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email,
          businessName,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menginisialisasi pembayaran");
      }

      const { token } = await response.json();

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async function (result: any) {
            console.log("Success:", result);
            setIsLoading(true);
            try {
              const res = await markDashboardAsPaidAction(email);
              if (res.error) {
                setError(res.error);
              } else {
                router.push("/pos");
              }
            } catch (err: any) {
              setError("Gagal memperbarui status pembayaran: " + err.message);
            } finally {
              setIsLoading(false);
            }
          },
          onPending: function (result: any) {
            console.log("Pending:", result);
            alert("Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran.");
          },
          onError: function (result: any) {
            console.error("Error:", result);
            setError("Pembayaran gagal. Silakan coba kembali.");
            setIsLoading(false);
          },
          onClose: function () {
            setIsLoading(false);
          },
        });
      } else {
        throw new Error("Midtrans SDK tidak termuat dengan benar");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20 font-sans">

      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#2563EB] mb-8 group transition-colors"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary and User info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100/30 space-y-4">
            <h2 className="font-rounded text-xl font-bold text-slate-900">Detail Pelanggan</h2>
            <div className="h-px bg-slate-100" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Nama Bisnis</span>
                <span className="font-semibold text-slate-800">{businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Email Kontak</span>
                <span className="font-semibold text-slate-800">{email}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#EFF6FF] p-6 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold font-heading uppercase tracking-wide">Transaksi Aman & Terenkripsi</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh pembayaran diproses langsung oleh payment gateway resmi kami (**Midtrans**) dengan jaminan enkripsi standar PCI-DSS kelas dunia.
            </p>
          </div>
        </div>

        {/* Right Side: Plan details and Checkout Actions */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-1">Pilihan Paket</span>
              <h3 className="font-rounded text-2xl font-bold text-slate-900">{planDetails.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-[#2563EB]">{planDetails.price}</span>
                <span className="text-xs text-slate-400">/{planDetails.period}</span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fitur Utama</span>
              <ul className="space-y-2 text-xs text-slate-600">
                {planDetails.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px bg-slate-100" />

            {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-blue-500/10"
            >
              <CreditCard className="h-4 w-4" />
              {isLoading ? "Memproses Transaksi..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2563EB]" />
      
      {/* Background circles decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-sm text-slate-400 animate-pulse">Menyiapkan checkout...</span>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

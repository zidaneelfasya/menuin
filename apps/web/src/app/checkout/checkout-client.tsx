"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { startSubscriptionCheckout } from "@/lib/actions/billing";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#2563EB] mb-8 group transition-colors"
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
      Kembali
    </button>
  );
}

export function PayButton({ planCode }: { planCode: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await startSubscriptionCheckout(planCode);
      if (!res.success || !res.paymentUrl) {
        setError(res.error || "Gagal memproses pembayaran.");
        setIsLoading(false);
        return;
      }
      // Halaman pembayaran DOKU; setelah selesai diarahkan ke /checkout/status.
      window.location.assign(res.paymentUrl);
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-blue-500/10"
      >
        <CreditCard className="h-4 w-4" />
        {isLoading ? "Membuka Pembayaran..." : "Bayar Sekarang"}
      </button>
    </>
  );
}

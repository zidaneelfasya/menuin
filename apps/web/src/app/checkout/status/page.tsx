"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { getSubscriptionCheckoutStatus } from "@/lib/actions/billing";

type StatusResult = Awaited<ReturnType<typeof getSubscriptionCheckoutStatus>>;

const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 60; // ± 5 menit, setelah itu pengguna bisa cek manual

function StatusContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice") || "";
  const [result, setResult] = useState<StatusResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const polls = useRef(0);

  const check = useCallback(async () => {
    if (!invoiceId) return;
    setIsChecking(true);
    try {
      setResult(await getSubscriptionCheckoutStatus(invoiceId));
    } finally {
      setIsChecking(false);
    }
  }, [invoiceId]);

  const status = result && "status" in result ? result.status : null;

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (status !== "PENDING" && status !== null) return;
    if (polls.current >= MAX_POLLS) return;
    const timer = setTimeout(() => {
      polls.current += 1;
      check();
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [status, result, check]);

  if (!invoiceId || (result && "error" in result && result.error)) {
    return (
      <Card icon={<XCircle className="h-10 w-10 text-red-500" />} title="Tagihan tidak ditemukan">
        <p>{(result && "error" in result && result.error) || "Tautan pembayaran tidak valid."}</p>
        <Link href="/select-tenant" className="text-[#2563EB] font-semibold">Kembali ke dashboard</Link>
      </Card>
    );
  }

  if (!result || !status) {
    return (
      <Card icon={<Loader2 className="h-10 w-10 text-[#2563EB] animate-spin" />} title="Memeriksa pembayaran...">
        <p>Mohon tunggu sebentar.</p>
      </Card>
    );
  }

  if (status === "PAID") {
    const periodEnd = "periodEnd" in result && result.periodEnd
      ? new Date(result.periodEnd).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : null;
    return (
      <Card icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />} title="Pembayaran berhasil">
        <p>Langganan Anda sudah aktif{periodEnd ? ` hingga ${periodEnd}` : ""}.</p>
        <Link
          href="/select-tenant"
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold"
        >
          Buka Dashboard
        </Link>
      </Card>
    );
  }

  if (status === "CANCELED") {
    return (
      <Card icon={<XCircle className="h-10 w-10 text-amber-500" />} title="Tagihan dibatalkan">
        <p>Tagihan ini sudah digantikan oleh tagihan baru.</p>
        <Link href="/select-tenant" className="text-[#2563EB] font-semibold">Kembali ke dashboard</Link>
      </Card>
    );
  }

  return (
    <Card icon={<Clock className="h-10 w-10 text-amber-500" />} title="Menunggu pembayaran">
      <p>
        Jika Anda sudah membayar, konfirmasi biasanya masuk dalam beberapa detik. Halaman ini akan
        diperbarui otomatis.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={check}
          disabled={isChecking}
          className="h-11 px-5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isChecking ? "Memeriksa..." : "Cek Status"}
        </button>
        {"planCode" in result && result.planCode && (
          <Link
            href={`/checkout?plan=${encodeURIComponent(result.planCode)}`}
            className="h-11 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold inline-flex items-center justify-center"
          >
            Bayar Ulang
          </Link>
        )}
      </div>
    </Card>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 max-w-md w-full text-center space-y-4 text-sm text-slate-600">
      <div className="flex justify-center">{icon}</div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {children}
    </div>
  );
}

export default function SubscriptionStatusPage() {
  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center px-4 py-12 font-sans">
      <Suspense fallback={<Loader2 className="h-8 w-8 text-[#2563EB] animate-spin" />}>
        <StatusContent />
      </Suspense>
    </div>
  );
}

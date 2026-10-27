import { Metadata } from "next";
import { Suspense } from "react";
import { requireFeature } from "@/lib/actions/auth-context";
import { getFinanceReport } from "@/lib/actions/reports";
import { FinanceReportClient } from "@/components/reports/finance-report-client";
import FinanceLoading from "./loading";

export const metadata: Metadata = {
  title: "Laporan Keuangan & Arus Kas - MENUIN",
  description: "Arus kas masuk & keluar, pencatatan biaya operasional, dan rekonsiliasi shift kasir.",
};

async function FinanceReportDataWrapper({ outletKey }: { outletKey: string }) {
  await requireFeature("FINANCE");
  const res = await getFinanceReport(outletKey, { period: "this_month" });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-none shadow-sm-md">
        {res.error || "Gagal memuat laporan keuangan."}
      </div>
    );
  }

  return <FinanceReportClient initialData={res.data} outletKey={outletKey} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  return (
    <Suspense fallback={<FinanceLoading />}>
      <FinanceReportDataWrapper outletKey={outletKey} />
    </Suspense>
  );
}

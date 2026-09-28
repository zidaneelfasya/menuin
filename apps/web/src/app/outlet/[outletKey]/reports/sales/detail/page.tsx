import { Metadata } from "next";
import { requireFeature } from "@/lib/actions/auth-context";
import { getSalesReport, ReportPeriod } from "@/lib/actions/reports";
import { SalesDetailClient } from "@/components/reports/sales-detail-client";

export const metadata: Metadata = {
  title: "Rincian Penjualan (Sales Detail) - MENUIN",
  description: "Rincian perolehan transaksi penjualan, potongan diskon, biaya gateway, dan data item.",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ outletKey: string }>;
  searchParams?: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}) {
  await requireFeature("REPORTS");
  const { outletKey } = await params;
  const search = searchParams ? await searchParams : undefined;

  const res = await getSalesReport(outletKey, {
    period: (search?.period as ReportPeriod) || "this_month",
    startDate: search?.startDate,
    endDate: search?.endDate,
  });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        {res.error || "Gagal memuat rincian laporan penjualan."}
      </div>
    );
  }

  return <SalesDetailClient initialData={res.data} outletKey={outletKey} />;
}

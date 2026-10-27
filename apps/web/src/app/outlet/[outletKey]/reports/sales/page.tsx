import { Metadata } from "next";
import { Suspense } from "react";
import { requireFeature } from "@/lib/actions/auth-context";
import { getSalesReport } from "@/lib/actions/reports";
import { SalesReportClient } from "@/components/reports/sales-report-client";
import SalesLoading from "./loading";

export const metadata: Metadata = {
  title: "Laporan Penjualan (Sales Analytics) - MENUIN",
  description: "Analisis performa omset, AOV, tren penjualan, dan rekapitulasi pembayaran.",
};

async function SalesReportDataWrapper({ outletKey }: { outletKey: string }) {
  await requireFeature("REPORTS");
  const res = await getSalesReport(outletKey, { period: "this_month" });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-none shadow-sm-md">
        {res.error || "Gagal memuat laporan penjualan."}
      </div>
    );
  }

  return <SalesReportClient initialData={res.data} outletKey={outletKey} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  return (
    <Suspense fallback={<SalesLoading />}>
      <SalesReportDataWrapper outletKey={outletKey} />
    </Suspense>
  );
}

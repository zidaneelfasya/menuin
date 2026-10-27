import { Metadata } from "next";
import { Suspense } from "react";
import { requireFeature } from "@/lib/actions/auth-context";
import { getReportsOverview } from "@/lib/actions/reports";
import { OverviewReportClient } from "@/components/reports/overview-report-client";
import ReportsLoading from "./loading";

export const metadata: Metadata = {
  title: "Ringkasan Eksekutif (Reports Overview) - MENUIN",
  description: "Sintesis performa 360° outlet: penjualan, operasional jam ramai, dan arus kas likuiditas.",
};

async function ReportsOverviewDataWrapper({ outletKey }: { outletKey: string }) {
  await requireFeature("REPORTS");
  const res = await getReportsOverview(outletKey, { period: "this_month" });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-none shadow-sm-md">
        {res.error || "Gagal memuat ringkasan laporan."}
      </div>
    );
  }

  return <OverviewReportClient initialData={res.data} outletKey={outletKey} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsOverviewDataWrapper outletKey={outletKey} />
    </Suspense>
  );
}

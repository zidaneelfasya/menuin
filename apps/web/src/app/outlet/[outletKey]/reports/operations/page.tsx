import { Metadata } from "next";
import { Suspense } from "react";
import { requireFeature } from "@/lib/actions/auth-context";
import { getOperationsReport } from "@/lib/actions/reports";
import { OperationsReportClient } from "@/components/reports/operations-report-client";
import OperationsLoading from "./loading";

export const metadata: Metadata = {
  title: "Laporan Operasional & Peak Hours - MENUIN",
  description: "Heatmap jam ramai, distribusi pesanan, dan menu terlaris.",
};

async function OperationsReportDataWrapper({ outletKey }: { outletKey: string }) {
  await requireFeature("REPORTS");
  const res = await getOperationsReport(outletKey, { period: "this_month" });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-none shadow-sm-md">
        {res.error || "Gagal memuat laporan operasional."}
      </div>
    );
  }

  return <OperationsReportClient initialData={res.data} outletKey={outletKey} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ outletKey: string }>;
}) {
  const { outletKey } = await params;
  return (
    <Suspense fallback={<OperationsLoading />}>
      <OperationsReportDataWrapper outletKey={outletKey} />
    </Suspense>
  );
}

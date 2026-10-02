import { Metadata } from "next";
import { requireFeature } from "@/lib/actions/auth-context";
import { getOperationsReport } from "@/lib/actions/reports";
import { OperationsReportClient } from "@/components/reports/operations-report-client";

export const metadata: Metadata = {
  title: "Laporan Operasional & Peak Hours - MENUIN",
  description: "Heatmap jam ramai, distribusi pesanan, dan menu terlaris.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ outletKey: string }>;
}) {
  await requireFeature("REPORTS");
  const { outletKey } = await params;
  const res = await getOperationsReport(outletKey, { period: "this_month" });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        {res.error || "Gagal memuat laporan operasional."}
      </div>
    );
  }

  return <OperationsReportClient initialData={res.data} outletKey={outletKey} />;
}

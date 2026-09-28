"use client";

import * as React from "react";
import { Clock, Flame, UtensilsCrossed, Package, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PeakHoursHeatmap } from "./peak-hours-heatmap";
import { ReportFilterBar } from "./report-filter-bar";
import { getOperationsReport, ReportPeriod } from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type OperationsReportData = NonNullable<Awaited<ReturnType<typeof getOperationsReport>>["data"]>;

interface OperationsReportClientProps {
  initialData: OperationsReportData;
  outletKey: string;
}

export function OperationsReportClient({ initialData, outletKey }: OperationsReportClientProps) {
  const [data, setData] = React.useState<OperationsReportData>(initialData);
  const [period, setPeriod] = React.useState<ReportPeriod>("this_month");
  const [isLoading, setIsLoading] = React.useState(false);

  const loadData = async (newPeriod: ReportPeriod, customStart?: string, customEnd?: string) => {
    setIsLoading(true);
    try {
      const res = await getOperationsReport(outletKey, {
        period: newPeriod,
        startDate: customStart,
        endDate: customEnd,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || "Gagal memuat laporan operasional");
      }
    } catch (err: any) {
      toast.error("Terjadi kendala saat memperbarui laporan operasional.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: ReportPeriod, customStart?: string, customEnd?: string) => {
    setPeriod(newPeriod);
    loadData(newPeriod, customStart, customEnd);
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Peak Hours Summary
      const summaryRows = [
        { Indikator: "Jam Tersibuk", Nilai: `${data.peakKpis.busiestHour.label} (${data.peakKpis.busiestHour.orderCount} pesanan)` },
        { Indikator: "Jam Tersepi", Nilai: `${data.peakKpis.slowestHour.label} (${data.peakKpis.slowestHour.orderCount} pesanan)` },
        { Indikator: "Hari Tersibuk", Nilai: `${data.peakKpis.busiestDay.dayName} (Rp ${data.peakKpis.busiestDay.revenue.toLocaleString("id-ID")})` },
        { Indikator: "Hari Tersepi", Nilai: `${data.peakKpis.slowestDay.dayName} (Rp ${data.peakKpis.slowestDay.revenue.toLocaleString("id-ID")})` },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Peak Hours");

      // Hourly Distribution Sheet
      const hourlyRows = data.hourlyDistribution.map((h) => ({
        Jam: h.label,
        "Jumlah Pesanan": h.orderCount,
        "Omset (Rp)": h.revenue,
      }));
      const hourlySheet = XLSX.utils.json_to_sheet(hourlyRows);
      XLSX.utils.book_append_sheet(workbook, hourlySheet, "Pesanan per Jam");

      // Day of Week Sheet
      const dayRows = data.dayDistribution.map((d) => ({
        Hari: d.dayFullName,
        "Jumlah Pesanan": d.orderCount,
        "Omset (Rp)": d.revenue,
      }));
      const daySheet = XLSX.utils.json_to_sheet(dayRows);
      XLSX.utils.book_append_sheet(workbook, daySheet, "Omset per Hari");

      // Top Products Sheet
      const productRows = data.topProducts.map((p, i) => ({
        Peringkat: i + 1,
        "Nama Menu": p.name,
        Kategori: p.categoryName,
        "Jumlah Terjual (Qty)": p.totalQty,
        "Total Omset (Rp)": p.totalRevenue,
      }));
      const productSheet = XLSX.utils.json_to_sheet(productRows);
      XLSX.utils.book_append_sheet(workbook, productSheet, "Produk Terlaris");

      const fileName = `Laporan_Operasional_PeakHours_${data.tenant.name.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel operasional berhasil diunduh.");
    } catch (e) {
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { heatmapGrid, peakKpis, hourlyDistribution, dayDistribution, topProducts, period: reportPeriod, tenant } = data;

  return (
    <div className="space-y-6 print:p-0">
      {/* Printable Header */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Analisis Operasional, Heatmap Peak Hours & Menu</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode</div>
          <div className="text-sm font-semibold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Operasional & Peak Hours</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis waktu tersibuk, heatmap jam ramai, serta ranking produk terlaris di outlet.
          </p>
        </div>
      </div>

      {/* Shared Filter Bar */}
      <ReportFilterBar
        period={period}
        onPeriodChange={handlePeriodChange}
        isLoading={isLoading}
        onRefresh={() => loadData(period)}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        formattedRange={`${reportPeriod.formattedStart} - ${reportPeriod.formattedEnd}`}
      />

      {/* Peak Hours Heatmap Component (Reference 1 GranetPro) */}
      <PeakHoursHeatmap
        grid={heatmapGrid}
        peakKpis={peakKpis}
        hourlyDistribution={hourlyDistribution}
        dayDistribution={dayDistribution}
      />

      {/* Top Products Table */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-[#0e59f9]" />
              Ranking Menu Terlaris (Top Selling Items)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menu dengan volume penjualan dan kontribusi omset tertinggi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Qty Terjual</th>
                <th className="py-3 px-4 text-right">Total Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data penjualan menu pada periode ini.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-semibold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {p.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {p.totalQty} porsi
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono">
                      Rp {p.totalRevenue.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { 
  Banknote, 
  ShoppingCart, 
  TrendingUp, 
  CreditCard, 
  Receipt, 
  Store, 
  Search, 
  Calendar,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoundedBlockBarChart } from "./rounded-block-bar-chart";
import { ReportFilterBar } from "./report-filter-bar";
import { getSalesReport, ReportPeriod } from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type SalesReportData = NonNullable<Awaited<ReturnType<typeof getSalesReport>>["data"]>;

interface SalesReportClientProps {
  initialData: SalesReportData;
  outletKey: string;
}

export function SalesReportClient({ initialData, outletKey }: SalesReportClientProps) {
  const [data, setData] = React.useState<SalesReportData>(initialData);
  const [period, setPeriod] = React.useState<ReportPeriod>("this_month");
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const loadData = async (newPeriod: ReportPeriod, customStart?: string, customEnd?: string) => {
    setIsLoading(true);
    try {
      const res = await getSalesReport(outletKey, {
        period: newPeriod,
        startDate: customStart,
        endDate: customEnd,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || "Gagal memuat laporan penjualan");
      }
    } catch (err: any) {
      toast.error("Terjadi kendala saat memperbarui laporan.");
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

      // Summary sheet
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Penjualan Bersih (Net Sales)", Nilai: data.kpis.netSales },
        { Indikator: "Penjualan Kotor (Gross Sales)", Nilai: data.kpis.grossSales },
        { Indikator: "Total Diskon Promo", Nilai: data.kpis.totalDiscount },
        { Indikator: "Total Pajak (PB1)", Nilai: data.kpis.totalTax },
        { Indikator: "Total Service Charge", Nilai: data.kpis.totalService },
        { Indikator: "Total Penerimaan (Total Collected)", Nilai: data.kpis.totalCollected },
        { Indikator: "Total Pesanan", Nilai: data.kpis.totalOrders },
        { Indikator: "Rata-rata Order (AOV)", Nilai: Math.round(data.kpis.aov) },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      // Daily Breakdown sheet
      const dailyRows = data.chartData.map((d) => ({
        Tanggal: d.date,
        Label: d.label,
        "Net Sales (Rp)": d.netSales,
        "Total Pesanan": d.orders,
        "Target Baseline": d.projected,
      }));
      const dailySheet = XLSX.utils.json_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Penjualan Harian");

      // Payment Tender sheet
      const paymentRows = data.paymentMethods.map((pm) => ({
        "Metode Pembayaran": pm.method,
        "Jumlah Transaksi": pm.count,
        "Total Nominal (Rp)": pm.total,
        "Porsi (%)": pm.percentage.toFixed(1) + "%",
      }));
      const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "Metode Pembayaran");

      // Transactions sheet
      const trxRows = data.recentTransactions.map((t) => ({
        "No. Order": t.orderNumber || t.id.slice(0, 8),
        Waktu: t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : "-",
        Kanal: t.source || "POS",
        Tipe: t.orderType || "DINE_IN",
        Pelanggan: t.customerName || "-",
        Metode: t.paymentMethod || "TUNAI",
        Subtotal: parseFloat(t.totalAmount || "0"),
        Diskon: parseFloat(t.discount || "0"),
        Pajak: parseFloat(t.tax || "0"),
        Total: parseFloat(t.grandTotal || "0"),
        Status: t.status,
      }));
      const trxSheet = XLSX.utils.json_to_sheet(trxRows);
      XLSX.utils.book_append_sheet(workbook, trxSheet, "Daftar Transaksi");

      const fileName = `Laporan_Penjualan_${data.tenant.name.replace(/\s+/g, "_")}_${data.period.type}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel berhasil diunduh.");
    } catch (e: any) {
      console.error("Export error:", e);
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { kpis, chartData, paymentMethods, channels, recentTransactions, period: reportPeriod, tenant } = data;

  const filteredTransactions = recentTransactions.filter((trx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      trx.orderNumber?.toLowerCase().includes(term) ||
      trx.customerName?.toLowerCase().includes(term) ||
      trx.paymentMethod?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 print:p-0">
      {/* Printable Header */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Analisis Penjualan & Performa Transaksi</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode</div>
          <div className="text-sm font-bold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Penjualan (Sales)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analitik pendapatan bersih, volume pesanan, rata-rata order, dan perbandingan performa.
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

      {/* KPI Cards (Clean layout with comparison pill badges like Reference 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Penjualan Bersih (Net Sales)
              </span>
              <div className={cn(
                "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
                kpis.netSalesGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {kpis.netSalesGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpis.netSalesGrowth >= 0 ? `+${kpis.netSalesGrowth.toFixed(1)}%` : `${kpis.netSalesGrowth.toFixed(1)}%`}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {kpis.netSales.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                Bandingkan Rp {kpis.prevNetSales.toLocaleString("id-ID")} (periode lalu)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Pesanan
              </span>
              <div className={cn(
                "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
                kpis.ordersGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {kpis.ordersGrowth >= 0 ? `+${Math.round(kpis.ordersGrowth)}%` : `${Math.round(kpis.ordersGrowth)}%`}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {kpis.totalOrders} <span className="text-sm font-normal text-slate-500">Order</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                Bandingkan {kpis.prevOrders} order (periode lalu)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AOV */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-rata Order (AOV)
              </span>
              <div className={cn(
                "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
                kpis.aovGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {kpis.aovGrowth >= 0 ? `+${kpis.aovGrowth.toFixed(1)}%` : `${kpis.aovGrowth.toFixed(1)}%`}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {Math.round(kpis.aov).toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">
                Bandingkan Rp {Math.round(kpis.prevAov).toLocaleString("id-ID")} (periode lalu)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Penerimaan Kasir
              </span>
              <div className="h-6 w-6 rounded-lg bg-blue-50 text-[#0e59f9] flex items-center justify-center">
                <Receipt className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                Rp {kpis.totalCollected.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>Diskon: Rp {kpis.totalDiscount.toLocaleString("id-ID")}</span>
                <span>Pajak: Rp {kpis.totalTax.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Novel Bar Chart with Rounded Square Blocks (Reference 2) */}
      <RoundedBlockBarChart
        data={chartData}
        title="Revenue Analytics — Performa Penjualan Harian"
        onExport={handleExportExcel}
      />

      {/* Tender & Channel Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#0e59f9]" />
                Rekapitulasi Kanal Pembayaran (Payment Tenders)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporsi penerimaan kasir berdasarkan metode pembayaran yang digunakan pelanggan
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {paymentMethods.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi pembayaran pada periode ini.
              </div>
            ) : (
              paymentMethods.map((pm) => (
                <div key={pm.method} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 uppercase tracking-wide">
                      {pm.method} ({pm.count} transaksi)
                    </span>
                    <span className="font-bold text-slate-900">
                      Rp {pm.total.toLocaleString("id-ID")}{" "}
                      <span className="text-slate-400 font-normal">({pm.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0e59f9] rounded-full transition-all duration-500"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Channel Breakdown (1 Col) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Store className="h-4 w-4 text-[#0e59f9]" />
              Kanal Penjualan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              POS Kasir vs Storefront QR Meja
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {channels.map((ch) => {
              const pct = kpis.totalCollected > 0 ? (ch.total / kpis.totalCollected) * 100 : 0;
              return (
                <div key={ch.channel} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">{ch.channel}</span>
                    <span className="text-xs font-bold text-slate-900">
                      Rp {ch.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>{ch.count} pesanan</span>
                    <span>{pct.toFixed(1)}% dari omset</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Daftar Transaksi ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian seluruh transaksi pesanan selama periode ini
            </p>
          </div>

          <div className="print:hidden w-full sm:w-64 relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Cari no order / pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-xs bg-slate-50/60 border-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Tipe & Meja</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Diskon</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isCanceled =
                    trx.status === "CANCELLED" ||
                    trx.status === "CANCELED" ||
                    trx.paymentStatus === "CANCELED" ||
                    trx.paymentStatus === "REFUNDED";

                  return (
                    <tr
                      key={trx.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isCanceled && "opacity-50 line-through bg-slate-50/40"
                      )}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {trx.orderNumber || trx.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">
                        {trx.createdAt
                          ? new Date(trx.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-slate-800 uppercase">
                          {trx.orderType || "DINE_IN"}
                        </span>
                        {trx.tableNumber && (
                          <span className="text-slate-500 text-[11px] block">
                            Meja {trx.tableNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700">
                        {trx.customerName || "-"}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {trx.paymentMethod || "TUNAI"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        Rp {parseFloat(trx.totalAmount || "0").toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-sans">
                        {parseFloat(trx.discount || "0") > 0
                          ? `-Rp ${parseFloat(trx.discount || "0").toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        Rp {parseFloat(trx.grandTotal || "0").toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

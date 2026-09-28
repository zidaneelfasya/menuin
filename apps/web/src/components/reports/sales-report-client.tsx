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
  ArrowDownRight,
  Percent,
  Coins,
  Info,
  ArrowRight,
  ShieldCheck,
  Tag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoundedBlockBarChart } from "./rounded-block-bar-chart";
import { ReportFilterBar } from "./report-filter-bar";
import { getSalesReport, ReportPeriod } from "@/lib/actions/reports";
import { toast } from "sonner";
import { formatPaymentMethodLabel } from "@/lib/utils/format";
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

      // Chronological 4-step financial summary sheet
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "1. Pendapatan Bruto (Total Tagihan Kasir)", Nilai: data.kpis.totalCollected },
        { Indikator: "   - Titipan Pajak Restoran (PB1 11%)", Nilai: data.kpis.totalTax },
        { Indikator: "   - Biaya Layanan (Service Charge)", Nilai: data.kpis.totalService },
        { Indikator: "2. Penjualan Kotor (Gross Sales Menu)", Nilai: data.kpis.grossSales },
        { Indikator: "   - Diskon & Promo Toko", Nilai: data.kpis.totalDiscount },
        { Indikator: "   - MDR Payment Gateway (DOKU QRIS 0.7%)", Nilai: data.kpis.totalGatewayFee },
        { Indikator: "3. Penjualan Bersih (Net Sales / Kas Masuk Riil)", Nilai: data.kpis.netSales },
        { Indikator: "   - Beban Pokok Penjualan (HPP / COGS Resep)", Nilai: data.kpis.totalHpp },
        { Indikator: "4. Laba Kotor (Gross Profit)", Nilai: data.kpis.grossProfit },
        { Indikator: "   - Gross Profit Margin (%)", Nilai: `${data.kpis.grossProfitMargin.toFixed(1)}%` },
        { Indikator: "Total Volume Pesanan", Nilai: data.kpis.totalOrders },
        { Indikator: "Rata-rata Nilai Order (AOV)", Nilai: Math.round(data.kpis.aov) },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Penjualan");

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
      const paymentRows = data.paymentMethods.map((pm) => {
        const isCash = pm.method.toUpperCase().includes("CASH") || pm.method.toUpperCase().includes("TUNAI");
        const estimatedFee = isCash ? 0 : Math.round(pm.total * 0.007);
        const netAmount = Math.max(0, pm.total - estimatedFee);
        return {
          "Metode Pembayaran": pm.method,
          "Jumlah Transaksi": pm.count,
          "Total Nominal (Rp)": pm.total,
          "MDR Gateway Fee (Rp)": estimatedFee,
          "Pencairan Bersih (Rp)": netAmount,
          "Porsi (%)": pm.percentage.toFixed(1) + "%",
        };
      });
      const paymentSheet = XLSX.utils.json_to_sheet(paymentRows);
      XLSX.utils.book_append_sheet(workbook, paymentSheet, "Metode Pembayaran");

      // Transactions sheet
      const trxRows = data.recentTransactions.map((t) => {
        const rawUpper = (t.paymentMethod || "TUNAI").toUpperCase();
        const isCash = rawUpper === "CASH" || rawUpper === "TUNAI";
        const isZeroFee = isCash || rawUpper === 'QRIS_STATIC' || rawUpper === 'CARD' || rawUpper === 'EDC' || rawUpper === 'TRANSFER' || rawUpper === 'BANK_TRANSFER';
        const gTotal = parseFloat(t.grandTotal || "0");
        const fee = (t as any).gatewayFee != null 
          ? parseFloat((t as any).gatewayFee) 
          : ((t as any).platformFee ? parseFloat((t as any).platformFee) : (isZeroFee ? 0 : Math.round(gTotal * 0.007)));
        const netSettled = (t as any).netAmount != null 
          ? parseFloat((t as any).netAmount) 
          : Math.max(0, gTotal - fee);

        return {
          "No. Order": t.orderNumber || t.id.slice(0, 8),
          Waktu: t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : "-",
          Kanal: t.source || "POS",
          Tipe: t.orderType || "DINE_IN",
          Pelanggan: t.customerName || "-",
          Metode: formatPaymentMethodLabel(t.paymentMethod),
          "Subtotal (Gross)": parseFloat(t.totalAmount || "0"),
          Diskon: parseFloat(t.discount || "0"),
          "Pajak PB1": parseFloat(t.tax || "0"),
          "Total Tagihan (Grand Total)": gTotal,
          "MDR Gateway Fee (0.7%)": fee,
          "Penerimaan Bersih (Net Settle)": netSettled,
          Status: t.status,
        };
      });
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
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Analisis Penjualan & Rekonsiliasi Finansial</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode</div>
          <div className="text-sm font-semibold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Laporan Penjualan (Sales)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Alur akuntansi terpadu: Pendapatan Bruto &rarr; Penjualan Kotor &rarr; Penjualan Bersih &rarr; Laba Kotor Outlet.
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

      {/* 4 Connected Waterfall Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Pendapatan Bruto (Total Tagihan Kasir) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  1. Pendapatan Bruto
                </span>
                <div className="h-6 w-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Receipt className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold text-slate-900">
                  Rp {kpis.totalCollected.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  Total seluruh tagihan struk kasir & online
                </div>
              </div>
            </div>

            {/* Deduction Tag towards Step 2 */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span className="text-rose-600">-</span> Titipan PB1 (Pajak):
              </span>
              <span className="font-semibold text-rose-600">
                {kpis.totalTax > 0 ? `-Rp ${kpis.totalTax.toLocaleString("id-ID")}` : "Rp 0"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Penjualan Kotor (Gross Sales Menu) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  2. Penjualan Kotor (Gross)
                </span>
                <div className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                  kpis.grossSalesGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  {kpis.grossSalesGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpis.grossSalesGrowth >= 0 ? `+${kpis.grossSalesGrowth.toFixed(1)}%` : `${kpis.grossSalesGrowth.toFixed(1)}%`}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold text-slate-900">
                  Rp {kpis.grossSales.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  Bandingkan Rp {kpis.prevGrossSales.toLocaleString("id-ID")} (periode lalu)
                </div>
              </div>
            </div>

            {/* Deduction Tag towards Step 3 */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span className="text-rose-600">-</span> Diskon & MDR (0.7%):
              </span>
              <span className="font-semibold text-rose-600">
                {kpis.totalDeductions > 0 ? `-Rp ${kpis.totalDeductions.toLocaleString("id-ID")}` : "Rp 0"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Penjualan Bersih (Net Sales) — Hero Highlight Card */}
        <Card className="border-2 border-[#0e59f9]/25 shadow-sm rounded-2xl bg-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0e59f9]" />
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0e59f9] uppercase tracking-wider">
                  3. Penjualan Bersih (Net)
                </span>
                <div className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                  kpis.netSalesGrowth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}>
                  {kpis.netSalesGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpis.netSalesGrowth >= 0 ? `+${kpis.netSalesGrowth.toFixed(1)}%` : `${kpis.netSalesGrowth.toFixed(1)}%`}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold text-slate-900">
                  Rp {kpis.netSales.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  Saldo riil masuk ke kasir & mutasi bank
                </div>
              </div>
            </div>

            {/* Deduction Tag towards Step 4 */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span className="text-amber-700">-</span> HPP Resep (COGS):
              </span>
              <span className="font-semibold text-amber-800">
                -Rp {kpis.totalHpp.toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Laba Kotor (Gross Profit) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  4. Laba Kotor (Profit)
                </span>
                <div className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#0e59f9]">
                  Margin {kpis.grossProfitMargin.toFixed(1)}%
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold text-slate-900">
                  Rp {kpis.grossProfit.toLocaleString("id-ID")}
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  Keuntungan murni setelah modal bahan resep
                </div>
              </div>
            </div>

            {/* Operational volume foot indicator */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Volume & AOV:</span>
              <span className="font-semibold text-slate-800">
                {kpis.totalOrders} Order &bull; Rp {Math.round(kpis.aov).toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified 3-Column Financial Reconciliation & Inspection Panel */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#0e59f9] flex items-center justify-center shrink-0">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Rekonsiliasi Lengkap Penjualan, Biaya & Laba Kotor
              </h3>
              <p className="text-xs text-slate-500">
                Rincian kalkulasi dari seluruh uang yang ditagihkan kasir hingga laba kotor operasional outlet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200 bg-slate-50">
              {reportPeriod.formattedStart} - {reportPeriod.formattedEnd}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-1">
          {/* Kolom 1: Rekapitulasi Tagihan & Pajak */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                1. Tagihan Kasir & Pajak
              </span>
              <Receipt className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pendapatan Bruto (Struk)</span>
                <span className="font-semibold text-slate-900">Rp {kpis.totalCollected.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Pajak Restoran (PB1 11%)</span>
                <span className="font-semibold">{kpis.totalTax > 0 ? `-Rp ${kpis.totalTax.toLocaleString("id-ID")}` : "Rp 0"}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Biaya Servis (Service Charge)</span>
                <span className="font-semibold text-slate-700">Rp {kpis.totalService.toLocaleString("id-ID")}</span>
              </div>
              <div className="pt-2.5 border-t border-slate-200/80 flex justify-between font-semibold text-slate-900">
                <span>= Penjualan Kotor (Gross)</span>
                <span className="text-[#0e59f9]">Rp {kpis.grossSales.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Potongan Penjualan & MDR Gateway */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                2. Potongan & Gateway
              </span>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Kotor (Gross)</span>
                <span className="font-semibold text-slate-900">Rp {kpis.grossSales.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Diskon & Promo Toko</span>
                <span className="font-semibold">{kpis.totalDiscount > 0 ? `-Rp ${kpis.totalDiscount.toLocaleString("id-ID")}` : "Rp 0"}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>MDR QRIS DOKU (0.7%)</span>
                <span className="font-semibold">{kpis.totalGatewayFee > 0 ? `-Rp ${kpis.totalGatewayFee.toLocaleString("id-ID")}` : "Rp 0"}</span>
              </div>
              <div className="pt-2.5 border-t border-slate-200/80 flex justify-between font-semibold text-slate-900">
                <span>= Penjualan Bersih (Net)</span>
                <span className="text-emerald-700">Rp {kpis.netSales.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Kolom 3: HPP Resep & Laba Kotor */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                3. Modal Resep & Profit
              </span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Bersih (Net Sales)</span>
                <span className="font-semibold text-slate-900">Rp {kpis.netSales.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Beban HPP (COGS Resep)</span>
                <span className="font-semibold">-Rp {kpis.totalHpp.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Margin Keuntungan Kotor</span>
                <span className="font-semibold text-slate-800">{kpis.grossProfitMargin.toFixed(1)}%</span>
              </div>
              <div className="pt-2.5 border-t border-slate-200/80 flex justify-between font-semibold text-slate-900">
                <span>= Laba Kotor (Gross Profit)</span>
                <span className="text-[#0e59f9]">Rp {kpis.grossProfit.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Novel Bar Chart with Rounded Square Blocks */}
      <RoundedBlockBarChart
        data={chartData}
        title="Revenue Analytics — Performa Penjualan Harian (Net Sales)"
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
                Distribusi penerimaan berdasarkan tender pembayaran yang digunakan pelanggan
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {paymentMethods.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi pembayaran pada periode ini.
              </div>
            ) : (
              paymentMethods.map((pm) => {
                const isCash = pm.method.toUpperCase().includes("CASH") || pm.method.toUpperCase().includes("TUNAI");
                const fee = isCash ? 0 : Math.round(pm.total * 0.007);
                const net = Math.max(0, pm.total - fee);

                return (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        {pm.method} ({pm.count} transaksi)
                        {!isCash && (
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                            MDR 0.7%
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">
                          Rp {pm.total.toLocaleString("id-ID")}{" "}
                          <span className="text-slate-400 font-normal">({pm.percentage.toFixed(1)}%)</span>
                        </span>
                        {!isCash && fee > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            Net Cair: Rp {net.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0e59f9] rounded-full transition-all duration-500"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
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
              POS Kasir vs Self QR Meja
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {channels.map((ch) => {
              const pct = kpis.totalCollected > 0 ? (ch.total / kpis.totalCollected) * 100 : 0;
              return (
                <div key={ch.channel} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">{ch.channel}</span>
                    <span className="text-xs font-semibold text-slate-900">
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
                <th className="py-3 px-4 text-right">Subtotal (Gross)</th>
                <th className="py-3 px-4 text-right">Diskon</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-right">MDR Gateway</th>
                <th className="py-3 px-4 text-right">Penerimaan Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
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

                  const rawUpper = (trx.paymentMethod || "TUNAI").toUpperCase();
                  const isCash = rawUpper === "CASH" || rawUpper === "TUNAI";
                  const isZeroFee = isCash || rawUpper === 'QRIS_STATIC' || rawUpper === 'CARD' || rawUpper === 'EDC' || rawUpper === 'TRANSFER' || rawUpper === 'BANK_TRANSFER';
                  const grandTotalVal = parseFloat(trx.grandTotal || "0");
                  const feeVal = (trx as any).gatewayFee != null 
                    ? parseFloat((trx as any).gatewayFee) 
                    : ((trx as any).platformFee ? parseFloat((trx as any).platformFee) : (isZeroFee ? 0 : Math.round(grandTotalVal * 0.007)));
                  const netVal = (trx as any).netAmount != null 
                    ? parseFloat((trx as any).netAmount) 
                    : Math.max(0, grandTotalVal - feeVal);

                  return (
                    <tr
                      key={trx.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isCanceled && "opacity-50 line-through bg-slate-50/40"
                      )}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {formatPaymentMethodLabel(trx.paymentMethod)}
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
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        Rp {grandTotalVal.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-sans">
                        {feeVal > 0 ? `-Rp ${feeVal.toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        Rp {netVal.toLocaleString("id-ID")}
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

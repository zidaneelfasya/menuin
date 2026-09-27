"use client";

import * as React from "react";
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Receipt, 
  AlertCircle,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { ReportFilterBar } from "./report-filter-bar";
import { 
  getFinanceReport, 
  createExpenseAction, 
  deleteExpenseAction, 
  ReportPeriod 
} from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type FinanceReportData = NonNullable<Awaited<ReturnType<typeof getFinanceReport>>["data"]>;

interface FinanceReportClientProps {
  initialData: FinanceReportData;
  outletKey: string;
}

const EXPENSE_CATEGORIES = [
  { id: "BAHAN_BAKU", label: "Bahan Baku & Dapur" },
  { id: "PACKAGING", label: "Kemasan & Plastik" },
  { id: "OPERASIONAL", label: "Listrik, Air & Gas" },
  { id: "GAJI", label: "Upah & Gaji Karyawan" },
  { id: "PEMELIHARAAN", label: "Pemeliharaan & Alat" },
  { id: "MARKETING", label: "Promosi & Iklan" },
  { id: "LAINNYA", label: "Biaya Lain-lain" },
];

export function FinanceReportClient({ initialData, outletKey }: FinanceReportClientProps) {
  const [data, setData] = React.useState<FinanceReportData>(initialData);
  const [period, setPeriod] = React.useState<ReportPeriod>("this_month");
  const [isLoading, setIsLoading] = React.useState(false);

  // Expense modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [category, setCategory] = React.useState("BAHAN_BAKU");
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("TUNAI");
  const [description, setDescription] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10));

  const loadData = async (newPeriod: ReportPeriod, customStart?: string, customEnd?: string) => {
    setIsLoading(true);
    try {
      const res = await getFinanceReport(outletKey, {
        period: newPeriod,
        startDate: customStart,
        endDate: customEnd,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || "Gagal memuat laporan keuangan");
      }
    } catch (err) {
      toast.error("Terjadi kendala saat memperbarui laporan keuangan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: ReportPeriod, customStart?: string, customEnd?: string) => {
    setPeriod(newPeriod);
    loadData(newPeriod, customStart, customEnd);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Masukkan nominal biaya yang valid.");
      return;
    }
    if (!description.trim()) {
      toast.error("Deskripsi pengeluaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createExpenseAction({
        outletKey,
        category,
        amount: numAmount,
        paymentMethod,
        description,
        date: expenseDate,
      });

      if (res.success) {
        toast.success("Pengeluaran berhasil dicatat.");
        setIsModalOpen(false);
        setAmount("");
        setDescription("");
        loadData(period);
      } else {
        toast.error(res.error || "Gagal menyimpan pengeluaran.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat menyimpan pengeluaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) return;
    try {
      const res = await deleteExpenseAction(id, outletKey);
      if (res.success) {
        toast.success("Pengeluaran berhasil dihapus.");
        loadData(period);
      } else {
        toast.error(res.error || "Gagal menghapus pengeluaran.");
      }
    } catch (err) {
      toast.error("Gagal menghapus.");
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Total Kas Masuk (Cash In)", Nilai: data.cashFlow.totalCashIn },
        { Indikator: "Kas Penjualan Tunai", Nilai: data.cashFlow.cashSalesTotal },
        { Indikator: "Total Kas Keluar (Cash Out)", Nilai: data.cashFlow.totalCashOut },
        { Indikator: "Biaya Kas Tunai", Nilai: data.cashFlow.cashExpenses },
        { Indikator: "Arus Kas Bersih (Net Cash Flow)", Nilai: data.cashFlow.netCashFlow },
        { Indikator: "Penjualan Bersih (Net Sales)", Nilai: data.profitability.netSales },
        { Indikator: "Estimasi HPP Modal Produk Terjual", Nilai: data.profitability.totalHpp },
        { Indikator: "Estimasi Laba Kotor (Gross Profit)", Nilai: data.profitability.estimatedGrossProfit },
        { Indikator: "Margin Keuntungan (%)", Nilai: data.profitability.profitMargin.toFixed(1) + "%" },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Arus Kas");

      // Expenses
      const expenseRows = data.expenses.map((exp) => ({
        Tanggal: new Date(exp.date).toLocaleDateString("id-ID"),
        Kategori: exp.category,
        Deskripsi: exp.description,
        "Metode Pembayaran": exp.paymentMethod,
        "Nominal (Rp)": parseFloat(exp.amount),
      }));
      const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
      XLSX.utils.book_append_sheet(workbook, expenseSheet, "Daftar Pengeluaran");

      // Shift Reconciliations
      const shiftRows = data.shifts.map((s) => ({
        "Shift ID": s.id.slice(0, 8),
        Status: s.status,
        Mulai: new Date(s.startTime).toLocaleString("id-ID"),
        Selesai: s.endTime ? new Date(s.endTime).toLocaleString("id-ID") : "-",
        "Modal Awal": parseFloat(s.startingCash || "0"),
        "Uang Aktual Kasir": parseFloat(s.actualCash || "0"),
        "Uang Sistem Diharapkan": parseFloat(s.expectedCash || "0"),
        Selisih: parseFloat(s.cashDifference || "0"),
      }));
      const shiftSheet = XLSX.utils.json_to_sheet(shiftRows);
      XLSX.utils.book_append_sheet(workbook, shiftSheet, "Rekonsiliasi Shift");

      const fileName = `Laporan_Keuangan_ArusKas_${data.tenant.name.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel keuangan berhasil diunduh.");
    } catch (e) {
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { cashFlow, profitability, expenses, expenseCategoryBreakdown, shifts, period: reportPeriod, tenant } = data;

  return (
    <div className="space-y-6 print:p-0">
      {/* Printable Header */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Arus Kas, Biaya Operasional & Rekonsiliasi Shift</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode</div>
          <div className="text-sm font-bold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* Screen Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Keuangan & Arus Kas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring kas masuk & keluar, pencatatan biaya operasional, dan rekonsiliasi shift laci kasir.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0e59f9] hover:bg-[#0c4cd4] text-white shadow-sm gap-2 h-10 px-4 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Biaya Operasional</span>
        </Button>
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

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash In */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kas Masuk (Cash In)
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">
                Rp {cashFlow.totalCashIn.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Kasir Tunai: Rp {cashFlow.cashSalesTotal.toLocaleString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cash Out */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kas Keluar (Cash Out)
              </span>
              <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-rose-600">
                Rp {cashFlow.totalCashOut.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Biaya Tunai: Rp {cashFlow.cashExpenses.toLocaleString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Arus Kas Bersih (Net Flow)
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#0e59f9] flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={cn("text-2xl font-bold", cashFlow.netCashFlow >= 0 ? "text-slate-900" : "text-rose-600")}>
                Rp {cashFlow.netCashFlow.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Non-Tunai: Rp {cashFlow.nonCashSalesTotal.toLocaleString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Gross Profit */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estimasi Laba Kotor
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[#0e59f9]">
                Rp {profitability.estimatedGrossProfit.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">
                Margin: {profitability.profitMargin.toFixed(1)}% &bull; HPP: Rp {profitability.totalHpp.toLocaleString("id-ID")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transparent Profitability Disclaimer Box */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <AlertCircle className="h-4 w-4 text-[#0e59f9] flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Ketentuan Estimasi Laba Kotor (Theoretical Gross Profit):</strong>{" "}
          {profitability.disclaimer} Untuk pencatatan depresiasi aset, hutang, dan laporan laba rugi akuntansi komprehensif, gunakan fitur Export Excel ke software akuntansi (Mekari Jurnal / Accurate).
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#0e59f9]" />
              Catatan Pengeluaran Operasional ({expenses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pengeluaran kas kecil dan biaya outlet selama periode laporan
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Biaya: <strong className="text-slate-900">Rp {profitability.totalExpenses.toLocaleString("id-ID")}</strong>
          </div>
        </div>

        {/* Expense Category Breakdown Pills */}
        {expenseCategoryBreakdown.length > 0 && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-2">
            {expenseCategoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2 shadow-2xs"
              >
                <span className="font-medium text-slate-700">{cat.category}:</span>
                <span className="font-bold text-slate-900">Rp {cat.amount.toLocaleString("id-ID")}</span>
                <span className="text-[10px] text-slate-400">({cat.percentage.toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Deskripsi Pengeluaran</th>
                <th className="py-3 px-4">Sumber Bayar</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center print:hidden w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada catatan pengeluaran operasional pada periode ini. Klik tombol "+ Catat Biaya Operasional" di atas.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#0e59f9] font-semibold border border-blue-100">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 font-mono">
                      Rp {parseFloat(exp.amount).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Shift Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0e59f9]" />
              Rekonsiliasi Shift & Uang Laci Kasir (Cash Drawer Reconciliation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit perbandingan antara uang sistem dan uang fisik aktual saat kasir tutup shift
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Shift ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waktu Buka / Tutup</th>
                <th className="py-3 px-4 text-right">Modal Awal</th>
                <th className="py-3 px-4 text-right">Diharapkan (Sistem)</th>
                <th className="py-3 px-4 text-right">Aktual Laci</th>
                <th className="py-3 px-4 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat shift kasir.
                  </td>
                </tr>
              ) : (
                shifts.map((s) => {
                  const diff = parseFloat(s.cashDifference || "0");
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {s.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            s.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {s.status === "ACTIVE" ? "AKTIF" : "SELESAI"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div>Mulai: {new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                        {s.endTime && (
                          <div className="text-slate-400">
                            Tutup: {new Date(s.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        Rp {parseFloat(s.startingCash || "0").toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        Rp {parseFloat(s.expectedCash || "0").toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {s.actualCash ? `Rp ${parseFloat(s.actualCash).toLocaleString("id-ID")}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {s.status === "ACTIVE" ? (
                          <span className="text-slate-400 font-normal">Shift berjalan</span>
                        ) : diff === 0 ? (
                          <span className="text-emerald-600">Pas (Rp 0)</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-700">+Rp {diff.toLocaleString("id-ID")}</span>
                        ) : (
                          <span className="text-rose-600">-Rp {Math.abs(diff).toLocaleString("id-ID")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Catat Pengeluaran Baru */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Catat Pengeluaran Biaya Outlet
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pengeluaran tunai akan otomatis tercatat ke laci kasir jika shift sedang aktif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Kategori Biaya</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e59f9]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Nominal (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={1}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Sumber Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                {["TUNAI", "BANK_TRANSFER", "EWALLET"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "py-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer",
                      paymentMethod === method
                        ? "bg-[#0e59f9] text-white border-[#0e59f9]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {method === "TUNAI" ? "Kasir Tunai" : method === "BANK_TRANSFER" ? "Transfer Bank" : "E-Wallet"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Deskripsi / Keperluan</Label>
              <Input
                placeholder="Contoh: Belanja es batu & kantong kresek"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Tanggal Pengeluaran</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 text-xs bg-[#0e59f9] hover:bg-[#0c4cd4] text-white cursor-pointer"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

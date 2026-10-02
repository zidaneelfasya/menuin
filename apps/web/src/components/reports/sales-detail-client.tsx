"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Search,
  FileSpreadsheet,
  Printer,
  Calendar as CalendarIcon,
  CreditCard,
  Store,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Receipt,
  Download,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSalesReport } from "@/lib/actions/reports";
import { toast } from "sonner";
import { formatPaymentMethodLabel } from "@/lib/utils/format";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type SalesReportData = NonNullable<Awaited<ReturnType<typeof getSalesReport>>["data"]>;

interface SalesDetailClientProps {
  initialData: SalesReportData;
  outletKey: string;
}

function formatRupiah(num: number): string {
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

export function SalesDetailClient({ initialData, outletKey }: SalesDetailClientProps) {
  const [data, setData] = React.useState<SalesReportData>(initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("ALL");
  const [methodFilter, setMethodFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedTrx, setSelectedTrx] = React.useState<any | null>(null);
  const itemsPerPage = 20;

  const { tenant, period, kpis, recentTransactions } = data;

  // Filtered transactions list
  const filteredTransactions = React.useMemo(() => {
    let list = recentTransactions || [];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((t) => {
        const orderNo = (t.orderNumber || "").toLowerCase();
        const id = (t.id || "").toLowerCase();
        const cust = (t.customerName || "").toLowerCase();
        const table = (t.tableNumber || "").toLowerCase();
        return orderNo.includes(q) || id.includes(q) || cust.includes(q) || table.includes(q);
      });
    }

    // Channel filter
    if (channelFilter !== "ALL") {
      list = list.filter((t) => {
        if (channelFilter === "POS") return t.source === "POS";
        if (channelFilter === "QR") return t.source === "QR" || t.source === "STOREFRONT" || t.source === "WEB_ORDER";
        return true;
      });
    }

    // Payment method filter
    if (methodFilter !== "ALL") {
      list = list.filter((t) => {
        const m = (t.paymentMethod || "").toUpperCase();
        if (methodFilter === "CASH") return m.includes("CASH") || m.includes("TUNAI");
        if (methodFilter === "QRIS") return m.includes("QRIS");
        if (methodFilter === "CARD") return m.includes("CARD") || m.includes("EDC") || m.includes("DEBIT");
        if (methodFilter === "ONLINE") return m.includes("ONLINE") || m.includes("MIDTRANS") || m.includes("DOKU");
        return true;
      });
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter((t) => {
        const isCanceled = t.status === "CANCELLED" || t.status === "CANCELED" || t.paymentStatus === "CANCELED" || t.paymentStatus === "REFUNDED";
        if (statusFilter === "SUCCESS") return !isCanceled;
        if (statusFilter === "CANCELED") return isCanceled;
        return true;
      });
    }

    return list;
  }, [recentTransactions, searchTerm, channelFilter, methodFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Aggregate stats of currently filtered transactions
  const filteredSummary = React.useMemo(() => {
    let gross = 0;
    let disc = 0;
    let fee = 0;
    let net = 0;
    let count = 0;

    filteredTransactions.forEach((t) => {
      const isCanceled = t.status === "CANCELLED" || t.status === "CANCELED" || t.paymentStatus === "CANCELED" || t.paymentStatus === "REFUNDED";
      if (!isCanceled) {
        const g = parseFloat(t.totalAmount || "0") || 0;
        const d = parseFloat(t.discount || "0") || 0;
        const f = parseFloat(t.gatewayFee || "0") || 0;
        gross += g;
        disc += d;
        fee += f;
        net += Math.max(0, g - d - f);
        count += 1;
      }
    });

    const aov = count > 0 ? net / count : 0;
    return { gross, disc, fee, net, count, aov };
  }, [filteredTransactions]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportRows = filteredTransactions.map((t, idx) => {
        const isCanceled = t.status === "CANCELLED" || t.status === "CANCELED" || t.paymentStatus === "CANCELED" || t.paymentStatus === "REFUNDED";
        const g = parseFloat(t.totalAmount || "0") || 0;
        const d = parseFloat(t.discount || "0") || 0;
        const f = parseFloat(t.gatewayFee || "0") || 0;
        const n = Math.max(0, g - d - f);

        return {
          No: idx + 1,
          "No. Transaksi": t.orderNumber || t.id.slice(0, 8),
          "Tanggal & Waktu": t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : "-",
          "Tipe Pesanan": t.orderType === "TAKEAWAY" ? "Bawa Pulang" : "Makan di Tempat",
          Kanal: t.source === "QR" ? "Self QR Meja" : "Kasir POS",
          "Meja / Pelanggan": t.tableNumber ? `Meja ${t.tableNumber}` : t.customerName || "-",
          "Metode Bayar": formatPaymentMethodLabel(t.paymentMethod),
          "Penjualan Kotor (Rp)": g,
          "Diskon (Rp)": d,
          "Fee Gateway (Rp)": f,
          "Net Sales (Rp)": n,
          Status: isCanceled ? "Dibatalkan" : "Selesai",
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rincian Penjualan");
      XLSX.writeFile(wb, `Laporan-Detail-Penjualan-${tenant.name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Rincian transaksi penjualan berhasil diekspor.");
    } catch (e: any) {
      toast.error("Gagal mengekspor data: " + (e?.message || ""));
    }
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* ==================================================== */}
      {/* 1. BREADCRUMB & PAGE HEADER */}
      {/* ==================================================== */}
      <div className="space-y-2 print:hidden">
        <Link
          href={`/outlet/${outletKey}/reports/sales`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0e59f9] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Laporan Penjualan</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-1">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
              Laporan Rinci • {period.formattedStart} - {period.formattedEnd}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-0.5">
              Rincian Penjualan (Sales Detail)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar transaksi rinci, rincian kotor, diskon promosi, potongan gateway, dan omzet bersih
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 px-3 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Ekspor Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 px-3 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Cetak
            </Button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. SUMMARY KPI STRIP */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Penjualan Kotor */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Penjualan Kotor
          </div>
          <div className="text-lg sm:text-xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {formatRupiah(filteredSummary.gross)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sebelum diskon & MDR
          </div>
        </Card>

        {/* Metric 2: Total Diskon & Fee */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Potongan & Biaya
          </div>
          <div className="text-lg sm:text-xl font-semibold text-rose-600 mt-1.5 tracking-tight">
            -{formatRupiah(filteredSummary.disc + filteredSummary.fee)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Diskon: {formatRupiah(filteredSummary.disc)} • Fee: {formatRupiah(filteredSummary.fee)}
          </div>
        </Card>

        {/* Metric 3: Penjualan Bersih */}
        <Card className="border border-[#0e59f9]/20 shadow-sm rounded-2xl bg-blue-50/20 p-4">
          <div className="text-[11px] font-semibold text-[#0e59f9] uppercase tracking-wider">
            Net Sales
          </div>
          <div className="text-lg sm:text-xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {formatRupiah(filteredSummary.net)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Total penerimaan kas & bank
          </div>
        </Card>

        {/* Metric 4: Total Transaksi & AOV */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Volume & AOV
          </div>
          <div className="text-lg sm:text-xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {filteredSummary.count} <span className="text-xs font-normal text-slate-400">Order</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Rata-rata: {formatRupiah(filteredSummary.aov)}
          </div>
        </Card>
      </div>

      {/* ==================================================== */}
      {/* 3. FILTER BAR (SEARCH, CHANNEL, METHOD, STATUS) */}
      {/* ==================================================== */}
      <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white p-3.5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari no. transaksi, meja, pelanggan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl border-[#EAEFF8] focus-visible:ring-[#0e59f9]"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kanal */}
            <Select
              value={channelFilter}
              onValueChange={(val) => {
                setChannelFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl border-[#EAEFF8] min-w-[130px]">
                <SelectValue placeholder="Semua Kanal" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#EAEFF8]">
                <SelectItem value="ALL">Semua Kanal</SelectItem>
                <SelectItem value="POS">Kasir POS</SelectItem>
                <SelectItem value="QR">Self QR Meja</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Metode Bayar */}
            <Select
              value={methodFilter}
              onValueChange={(val) => {
                setMethodFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl border-[#EAEFF8] min-w-[140px]">
                <SelectValue placeholder="Metode Bayar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#EAEFF8]">
                <SelectItem value="ALL">Semua Metode</SelectItem>
                <SelectItem value="CASH">Tunai (Cash)</SelectItem>
                <SelectItem value="QRIS">QRIS</SelectItem>
                <SelectItem value="CARD">Kartu EDC / Debit</SelectItem>
                <SelectItem value="ONLINE">Online Gateway</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl border-[#EAEFF8] min-w-[130px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#EAEFF8]">
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="SUCCESS">Selesai / Lunas</SelectItem>
                <SelectItem value="CANCELED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ==================================================== */}
      {/* 4. TRANSACTION DATA TABLE */}
      {/* ==================================================== */}
      <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white overflow-hidden">
        <Table className="w-full text-left text-xs">
          <TableHeader>
            <TableRow className="border-none bg-transparent hover:bg-transparent">
              <TableHead className="py-3 px-4">Waktu</TableHead>
              <TableHead className="py-3 px-4">No. Transaksi</TableHead>
              <TableHead className="py-3 px-4">Tipe & Meja</TableHead>
              <TableHead className="py-3 px-4">Kanal</TableHead>
              <TableHead className="py-3 px-4">Metode Bayar</TableHead>
              <TableHead className="py-3 px-4 text-right">Kotor</TableHead>
              <TableHead className="py-3 px-4 text-right">Diskon & Fee</TableHead>
              <TableHead className="py-3 px-4 text-right">Bersih</TableHead>
              <TableHead className="py-3 px-4 text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#EAEFF8]">
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-slate-400">
                  Tidak ada transaksi penjualan yang sesuai dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((t) => {
                const isCanceled = t.status === "CANCELLED" || t.status === "CANCELED" || t.paymentStatus === "CANCELED" || t.paymentStatus === "REFUNDED";
                const gross = parseFloat(t.totalAmount || "0") || 0;
                const disc = parseFloat(t.discount || "0") || 0;
                const fee = parseFloat(t.gatewayFee || "0") || 0;
                const net = Math.max(0, gross - disc - fee);
                const isQR = t.source === "QR" || t.source === "STOREFRONT" || t.source === "WEB_ORDER";

                return (
                  <TableRow
                    key={t.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors group"
                  >
                      {/* Waktu */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {t.createdAt ? (
                          <>
                            <div className="font-medium text-slate-800">
                              {new Date(t.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(t.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* No. Transaksi */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {t.orderNumber || `#${t.id.slice(0, 8)}`}
                        </span>
                      </TableCell>

                      {/* Tipe & Meja */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {t.orderType === "TAKEAWAY" ? "Bawa Pulang" : "Makan di Tempat"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.tableNumber ? `Meja ${t.tableNumber}` : t.customerName ? t.customerName : "Tanpa Meja"}
                        </div>
                      </TableCell>

                      {/* Kanal */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            isQR
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}
                        >
                          {isQR ? <Smartphone className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {isQR ? "Self QR" : "Kasir POS"}
                        </span>
                      </TableCell>

                      {/* Metode Bayar */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {formatPaymentMethodLabel(t.paymentMethod)}
                        </span>
                      </TableCell>

                      {/* Kotor */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-right text-slate-600">
                        {formatRupiah(gross)}
                      </TableCell>

                      {/* Diskon & Fee */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-right text-slate-500">
                        {disc + fee > 0 ? (
                          <span className="text-rose-600 font-medium">
                            -{formatRupiah(disc + fee)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rp 0</span>
                        )}
                      </TableCell>

                      {/* Bersih */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-right font-semibold text-slate-900">
                        {formatRupiah(net)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            isCanceled
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          )}
                        >
                          {isCanceled ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Dibatalkan
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai
                            </>
                          )}
                        </span>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="py-3 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTrx(t)}
                          className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-[#0e59f9] hover:bg-blue-50/60 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Rincian
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-t border-[#EAEFF8] bg-slate-50/40">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{paginatedTransactions.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> transaksi
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Sebelumnya
            </Button>
            <div className="text-xs font-medium text-slate-600 px-2">
              Halaman {currentPage} dari {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ==================================================== */}
      {/* 5. TRANSACTION DETAIL MODAL */}
      {/* ==================================================== */}
      <Dialog open={!!selectedTrx} onOpenChange={(open) => !open && setSelectedTrx(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#EAEFF8] p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Detail Transaksi</span>
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                {selectedTrx?.orderNumber || `#${selectedTrx?.id?.slice(0, 8)}`}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Informasi lengkap rincian pesanan dan status pembayaran
            </DialogDescription>
          </DialogHeader>

          {selectedTrx && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal & Waktu</span>
                  <span className="font-medium text-slate-800">
                    {selectedTrx.createdAt ? new Date(selectedTrx.createdAt).toLocaleString("id-ID") : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Layanan</span>
                  <span className="font-medium text-slate-800">
                    {selectedTrx.orderType === "TAKEAWAY" ? "Bawa Pulang (Takeaway)" : "Makan di Tempat (Dine In)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kanal Penjualan</span>
                  <span className="font-medium text-slate-800">
                    {selectedTrx.source === "QR" ? "Self-Order QR Meja" : "Kasir POS"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Meja / Pelanggan</span>
                  <span className="font-medium text-slate-800">
                    {selectedTrx.tableNumber ? `Meja ${selectedTrx.tableNumber}` : selectedTrx.customerName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Pembayaran</span>
                  <span className="font-medium text-slate-800">
                    {formatPaymentMethodLabel(selectedTrx.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pembayaran</span>
                  <span className="font-medium text-slate-800">
                    {selectedTrx.paymentStatus || "PAID"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Penjualan Kotor (Subtotal)</span>
                  <span>{formatRupiah(parseFloat(selectedTrx.totalAmount || "0"))}</span>
                </div>
                {parseFloat(selectedTrx.discount || "0") > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Potongan Diskon</span>
                    <span>-{formatRupiah(parseFloat(selectedTrx.discount || "0"))}</span>
                  </div>
                )}
                {parseFloat(selectedTrx.gatewayFee || "0") > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Biaya Gateway (MDR)</span>
                    <span>-{formatRupiah(parseFloat(selectedTrx.gatewayFee || "0"))}</span>
                  </div>
                )}
                {parseFloat(selectedTrx.tax || "0") > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Pajak (PB1)</span>
                    <span>+{formatRupiah(parseFloat(selectedTrx.tax || "0"))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Net Sales</span>
                  <span className="text-[#0e59f9]">
                    {formatRupiah(
                      Math.max(
                        0,
                        parseFloat(selectedTrx.totalAmount || "0") -
                          parseFloat(selectedTrx.discount || "0") -
                          parseFloat(selectedTrx.gatewayFee || "0")
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs rounded-xl border-[#EAEFF8]"
                  onClick={() => setSelectedTrx(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

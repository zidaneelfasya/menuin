"use client";

import * as React from "react";
import { format, formatDistanceStrict } from "date-fns";
import { id } from "date-fns/locale";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AppTable, type AppTableColumn } from "@/components/ui/app-table";
import {
  formatCurrency,
  formatNumber,
  parseCurrencyInput,
  formatPaymentMethodLabel,
  formatOrderTypeLabel,
} from "@/lib/utils/format";
import { startShift, endShift, addCashMovement } from "@/lib/actions/shifts";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Clock,
  ShoppingCart,
  Calendar,
  Receipt,
  Check,
  AlertTriangle,
  Calculator,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  X,
  Coins,
  Banknote,
  Plus,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { exportShiftHistoryToExcel } from "../utils/shift-excel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ShiftDetailModal } from "./shift-detail-modal";

const QUICK_DENOMINATIONS = [0, 50000, 100000, 200000, 300000, 500000, 1000000];

const CASH_IN_PRESETS = [
  "Tambah Uang Kembalian",
  "Suntik Modal Kas Laci",
  "Pengembalian Kasbon",
  "Koreksi Selisih Kas",
];

const CASH_OUT_PRESETS = [
  "Beli Es Batu / Galon",
  "Beli Gas LPG",
  "Belanja Bahan Darurat",
  "Kasbon Karyawan",
  "Setoran Tunai ke Owner",
  "Biaya Kebersihan & Sampah",
];

const BILL_VALUES = [
  { label: "Rp 100.000", value: 100000 },
  { label: "Rp 50.000", value: 50000 },
  { label: "Rp 20.000", value: 20000 },
  { label: "Rp 10.000", value: 10000 },
  { label: "Rp 5.000", value: 5000 },
  { label: "Rp 2.000", value: 2000 },
  { label: "Rp 1.000", value: 1000 },
];

export function ShiftDashboard({
  activeShift,
  shiftHistory = [],
  userRole = "CASHIER",
  outletKey = "",
}: {
  activeShift: any;
  shiftHistory: any[];
  userRole?: string;
  outletKey?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "active";

  // Modal for past shift history
  const [modalShiftId, setModalShiftId] = React.useState<string | null>(null);
  const [navigatingShiftId, setNavigatingShiftId] = React.useState<string | null>(null);

  // In-page actions for today's active shift: 'NONE' | 'END_SHIFT'
  const [activePanel, setActivePanel] = React.useState<"NONE" | "END_SHIFT">("NONE");

  // Cash movement modal dialog
  const [isMovementModalOpen, setIsMovementModalOpen] = React.useState(false);

  // Form inputs state
  const [rawAmount, setRawAmount] = React.useState("");
  const [descInput, setDescInput] = React.useState("");
  const [movementType, setMovementType] = React.useState<"IN" | "OUT">("IN");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Denomination calculator mode state
  const [useCalculator, setUseCalculator] = React.useState(false);
  const [billCounts, setBillCounts] = React.useState<{ [key: number]: number }>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });
  const [coinAmount, setCoinAmount] = React.useState("");

  // Calculate total from denomination calculator
  const calculatorTotal = React.useMemo(() => {
    let sum = 0;
    Object.entries(billCounts).forEach(([val, count]) => {
      sum += Number(val) * (Number(count) || 0);
    });
    sum += parseCurrencyInput(coinAmount);
    return sum;
  }, [billCounts, coinAmount]);

  // Sync calculator total to rawAmount when calculator is active
  React.useEffect(() => {
    if (useCalculator) {
      setRawAmount(calculatorTotal.toString());
    }
  }, [calculatorTotal, useCalculator]);

  const resetCalculator = () => {
    setBillCounts({
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
      1000: 0,
    });
    setCoinAmount("");
  };

  const formattedDisplayAmount = React.useMemo(() => {
    if (!rawAmount) return "";
    const num = parseCurrencyInput(rawAmount);
    return num ? formatNumber(num) : "";
  }, [rawAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawAmount(val);
  };

  const setAmountValue = (num: number) => {
    setRawAmount(num === 0 ? "0" : num.toString());
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseCurrencyInput(rawAmount);

    const res = await startShift(amount);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Shift kasir berhasil dibuka");
      setRawAmount("");
      resetCalculator();
      router.refresh();
    } else {
      toast.error(res.error || "Gagal membuka shift");
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift?.id) return;
    setIsSubmitting(true);
    const actualCash = parseCurrencyInput(rawAmount);

    const res = await endShift(activeShift.id, actualCash);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Shift kasir berhasil ditutup");
      setActivePanel("NONE");
      setRawAmount("");
      router.refresh();
    } else {
      toast.error(res.error || "Gagal menutup shift");
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift?.id) {
      toast.error("Tidak ada shift aktif yang berjalan");
      return;
    }
    const amount = parseCurrencyInput(rawAmount);
    if (amount <= 0) {
      toast.error("Nominal uang harus lebih dari 0");
      return;
    }
    if (!descInput.trim()) {
      toast.error("Harap isi keterangan keperluan");
      return;
    }

    setIsSubmitting(true);
    const res = await addCashMovement(activeShift.id, movementType, amount, descInput.trim());
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Kas ${movementType === "IN" ? "masuk" : "keluar"} berhasil dicatat`);
      setRawAmount("");
      setDescInput("");
      setIsMovementModalOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Gagal mencatat pergerakan kas");
    }
  };

  // Column definitions for AppTable
  const historyColumns = React.useMemo<AppTableColumn<any>[]>(() => [
    {
      key: "cashier",
      header: "Kasir & Tanggal",
      render: (shift) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {shift.cashierName || "Kasir"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {format(new Date(shift.startTime), "dd MMMM yyyy", { locale: id })}
          </div>
        </div>
      ),
    },
    {
      key: "time",
      header: "Waktu & Durasi",
      render: (shift) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200">
            {format(new Date(shift.startTime), "HH:mm")} - {shift.endTime ? format(new Date(shift.endTime), "HH:mm") : "Selesai"}
          </div>
          <div className="text-[11px] text-slate-400">
            {shift.endTime ? formatDistanceStrict(new Date(shift.startTime), new Date(shift.endTime), { locale: id }) : "-"}
          </div>
        </div>
      ),
    },
    {
      key: "totalSales",
      header: "Total Omzet",
      render: (shift) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white font-financial tabular-nums">
            {formatCurrency(Number(shift.totalSales) || 0)}
          </div>
          <div className="text-[11px] text-slate-400 font-financial tabular-nums">
            {shift.totalTransactions || 0} transaksi
          </div>
        </div>
      ),
    },
    {
      key: "difference",
      header: "Selisih Kas",
      render: (shift) => {
        const diff = Number(shift.cashDifference || 0);
        if (diff === 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none font-financial tabular-nums">
              Pas
            </span>
          );
        }
        if (diff < 0) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-none font-financial tabular-nums">
              Kurang {formatCurrency(Math.abs(diff))}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-none font-financial tabular-nums">
            Lebih {formatCurrency(diff)}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Aksi",
      align: "right",
      render: (shift) => {
        const isNavigating = navigatingShiftId === shift.id;
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled={isNavigating}
            className="h-7 px-2.5 text-xs font-semibold rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (outletKey) {
                setNavigatingShiftId(shift.id);
                router.push(`/outlet/${outletKey}/shifts/${shift.id}`);
              } else {
                setModalShiftId(shift.id);
              }
            }}
          >
            {isNavigating ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Memuat...</span>
              </span>
            ) : (
              'Detail'
            )}
          </Button>
        );
      },
    },
  ], [outletKey, router, navigatingShiftId]);

  const transactionColumns = React.useMemo<AppTableColumn<any>[]>(() => [
    {
      key: "time",
      header: "Waktu",
      render: (tx) => (
        <span className="text-slate-500 font-financial tabular-nums">
          {format(new Date(tx.createdAt), "HH:mm")}
        </span>
      ),
    },
    {
      key: "orderNumber",
      header: "No. Order",
      render: (tx) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
          {tx.orderNumber || "#-"}
        </span>
      ),
    },
    {
      key: "orderType",
      header: "Tipe Pesanan",
      render: (tx) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none">
          {formatOrderTypeLabel(tx.orderType)}
        </span>
      ),
    },
    {
      key: "tableNumber",
      header: "Meja",
      render: (tx) => (
        <span className="text-slate-600 dark:text-slate-300">
          {tx.tableNumber ? `Meja ${tx.tableNumber}` : "-"}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Metode Bayar",
      render: (tx) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none">
          {formatPaymentMethodLabel(tx.paymentMethod)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total Belanja",
      align: "right",
      render: (tx) => (
        <span className="font-financial font-semibold text-slate-900 dark:text-white tabular-nums">
          {formatCurrency(Number(tx.grandTotal || tx.totalAmount || 0))}
        </span>
      ),
    },
  ], []);

  const movementColumns = React.useMemo<AppTableColumn<any>[]>(() => [
    {
      key: "time",
      header: "Waktu",
      render: (m) => (
        <span className="text-slate-500 font-financial tabular-nums">
          {format(new Date(m.createdAt), "HH:mm")}
        </span>
      ),
    },
    {
      key: "type",
      header: "Jenis",
      render: (m) =>
        m.type === "IN" ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none">
            Kas Masuk
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-none">
            Kas Keluar
          </span>
        ),
    },
    {
      key: "description",
      header: "Keterangan / Keperluan",
      render: (m) => (
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {m.description}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      align: "right",
      render: (m) => (
        <span
          className={cn(
            "font-financial font-semibold tabular-nums",
            m.type === "IN" ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {m.type === "IN" ? "+" : "-"}{formatCurrency(Number(m.amount))}
        </span>
      ),
    },
  ], []);

  const activityColumns = React.useMemo<AppTableColumn<any>[]>(() => [
    {
      key: "time",
      header: "Waktu",
      render: (act) => (
        <span className="text-slate-500 font-financial tabular-nums">
          {format(act.time, "HH:mm")}
        </span>
      ),
    },
    {
      key: "title",
      header: "Aktivitas",
      render: (act) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            {act.title}
          </div>
          {act.details && (
            <div className="text-[11px] text-slate-400 mt-0.5">
              {act.details}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "Metode",
      render: (act) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none">
          {act.paymentMethod}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      align: "right",
      render: (act) => (
        <span
          className={cn(
            "font-financial font-semibold tabular-nums",
            act.type === "CASH_IN"
              ? "text-emerald-600"
              : act.type === "CASH_OUT"
              ? "text-rose-600"
              : "text-slate-900 dark:text-white"
          )}
        >
          {act.type === "CASH_OUT" ? "-" : "+"}{formatCurrency(act.amount)}
        </span>
      ),
    },
  ], []);

  const shiftDuration = React.useMemo(() => {
    if (!activeShift?.startTime) return "";
    try {
      return formatDistanceStrict(new Date(activeShift.startTime), new Date(), {
        locale: id,
        addSuffix: false,
      });
    } catch {
      return "";
    }
  }, [activeShift?.startTime]);

  // Combined timeline of movements and transactions for today (only computed when active tab is selected)
  const timelineActivities = React.useMemo(() => {
    if (activeTab !== "active") return [];
    const list: any[] = [];

    if (activeShift?.cashMovements) {
      activeShift.cashMovements.forEach((m: any) => {
        list.push({
          id: m.id,
          type: m.type === "IN" ? "CASH_IN" : "CASH_OUT",
          title: m.type === "IN" ? "Kas Masuk" : "Kas Keluar",
          details: m.description,
          paymentMethod: "Kas Laci",
          amount: Number(m.amount),
          time: new Date(m.createdAt),
          badgeColor: m.type === "IN" ? "border-l-blue-500" : "border-l-rose-500",
        });
      });
    }

    if (activeShift?.transactions) {
      activeShift.transactions.forEach((t: any) => {
        list.push({
          id: t.id,
          type: "SALE",
          title: `Pesanan ${t.orderNumber || "#-"}`,
          details: t.tableNumber ? `${formatOrderTypeLabel(t.orderType)} (Meja ${t.tableNumber})` : formatOrderTypeLabel(t.orderType),
          paymentMethod: formatPaymentMethodLabel(t.paymentMethod),
          amount: Number(t.grandTotal || t.totalAmount || 0),
          time: new Date(t.createdAt),
          badgeColor: "border-l-emerald-500",
        });
      });
    }

    return list.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [activeShift, activeTab]);

  // Generate 7-day calendar strip (only when schedule tab is active)
  const daysOfWeek = React.useMemo(() => {
    if (activeTab !== "schedule") return [];
    const days = [];
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      const dayNames = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];
      days.push({
        name: dayNames[d.getDay()],
        date: d.getDate(),
        isToday,
        fullDate: d,
      });
    }
    return days;
  }, [activeTab]);

  const totalSalesAmount = activeShift?.metrics?.totalSales || 0;
  const totalCashSales = activeShift?.metrics?.totalCashSales || 0;
  const totalNonCashSales = totalSalesAmount - totalCashSales;
  const totalCashIn = activeShift?.cashMovements?.filter((m: any) => m.type === "IN").reduce((acc: number, m: any) => acc + Number(m.amount), 0) || 0;
  const totalCashOut = activeShift?.cashMovements?.filter((m: any) => m.type === "OUT").reduce((acc: number, m: any) => acc + Number(m.amount), 0) || 0;
  const totalCompletedTx = activeShift?.metrics?.totalCompletedTransactions || activeShift?.transactions?.length || 0;
  const currentCashInDrawer = activeShift?.metrics?.expectedCash || activeShift?.startingCash || 0;

  return (
    <div className="w-full space-y-6">
      {/* ========================================================================= */}
      {/* TAB 1: SHIFT AKTIF (SESI BERJALAN) */}
      {/* ========================================================================= */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeShift ? (
            <div className="space-y-6">
              {/* Header Status & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#0e59f9] text-white flex items-center justify-center font-semibold shadow-xs shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                      Sesi Shift Aktif
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                      <span>Kasir: <strong className="text-slate-900 dark:text-slate-100 font-semibold">{activeShift.cashierName || "Kasir"}</strong></span>
                      <span>•</span>
                      <span>Mulai {format(new Date(activeShift.startTime), "HH:mm")}</span>
                      {shiftDuration && (
                        <>
                          <span>•</span>
                          <span>Berjalan {shiftDuration}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {outletKey && (
                    <Link href={`/outlet/${outletKey}/pos`}>
                      <Button className="rounded-xl bg-[#0e59f9] hover:bg-[#0c4cd4] text-white text-xs font-semibold h-10 px-4 gap-2 shadow-xs cursor-pointer">
                        <ShoppingCart className="w-4 h-4" />
                        Buka POS
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant={activePanel === "END_SHIFT" ? "default" : "outline"}
                    onClick={() => {
                      resetCalculator();
                      setRawAmount(activeShift?.metrics?.expectedCash?.toString() || "");
                      setActivePanel(activePanel === "END_SHIFT" ? "NONE" : "END_SHIFT");
                    }}
                    className={cn(
                      "rounded-xl text-xs font-semibold h-10 px-4 gap-2 transition-all cursor-pointer",
                      activePanel === "END_SHIFT"
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "border-[#EAEFF8] bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    Tutup Shift
                  </Button>
                </div>
              </div>

              {/* 4 Top KPI Cards - Neutral Gray Cards with Blue Icons (No Uppercase) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Modal Awal Kasir */}
                <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[170px]">
                  <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <Banknote className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] font-normal text-slate-400">Modal Laci</span>
                    </div>
                    <div className="mt-6">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Modal Awal Kas
                      </span>
                      <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap mt-1 font-financial tabular-nums">
                        {formatCurrency(Number(activeShift.startingCash || 0))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block mt-1">Uang kembalian awal di laci</span>
                    </div>
                  </CardContent>
                </Card>

                {/* KPI 2: Total Penjualan & Breakdown */}
                <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[170px]">
                  <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] font-normal text-slate-400 font-financial tabular-nums">
                        {totalCompletedTx} Transaksi
                      </span>
                    </div>
                    <div className="mt-6">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Total Penjualan
                      </span>
                      <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap mt-1 font-financial tabular-nums">
                        {formatCurrency(totalSalesAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal mt-1 flex items-center justify-between font-financial tabular-nums">
                        <span>Tunai: {formatCurrency(totalCashSales)}</span>
                        <span>Non-Tunai: {formatCurrency(totalNonCashSales)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* KPI 3: Pergerakan Kas */}
                <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[170px]">
                  <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <ArrowLeftRight className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] font-normal text-slate-400 font-financial tabular-nums">
                        {activeShift.cashMovements?.length || 0} Mutasi
                      </span>
                    </div>
                    <div className="mt-6">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Pergerakan Kas
                      </span>
                      <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap mt-1 font-financial tabular-nums flex items-center gap-1.5">
                        <span className="text-emerald-600">+{formatCurrency(totalCashIn)}</span>
                        <span className="text-slate-300 font-normal text-sm">/</span>
                        <span className="text-rose-600">-{formatCurrency(totalCashOut)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block mt-1">
                        Kas masuk & keluar darurat
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* KPI 4: Estimasi Kas di Laci - Neutral Gray/White Card with Blue Icon */}
                <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[170px]">
                  <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <Coins className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] font-normal text-slate-400">Wajib di Laci</span>
                    </div>
                    <div className="mt-6">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Estimasi Kas di Laci
                      </span>
                      <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap mt-1 font-financial tabular-nums">
                        {formatCurrency(currentCashInDrawer)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block mt-1">
                        Total fisik wajib ada di kasir
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tutup Shift Form Panel */}
              {activePanel === "END_SHIFT" && (
                <div className="bg-white rounded-2xl border border-rose-200 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                    <div className="flex items-center gap-2 text-rose-600">
                      <LogOut className="w-5 h-5" />
                      <h3 className="font-semibold text-sm">Rekonsiliasi Kas & Konfirmasi Tutup Shift</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-rose-50" onClick={() => setActivePanel("NONE")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleEndShift} className="space-y-4 max-w-xl">
                    <div className="p-3 bg-slate-50 rounded-xl border border-[#EAEFF8] text-xs flex justify-between items-center font-financial tabular-nums">
                      <span className="text-slate-500 font-sans">Ekspektasi Kas Laci Sistem:</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {formatCurrency(currentCashInDrawer)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="actualCash" className="text-xs font-semibold">Uang Fisik Aktual di Laci Kasir (Rp)</Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs">Rp</span>
                        <Input
                          id="actualCash"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formattedDisplayAmount}
                          onChange={handleAmountChange}
                          autoFocus
                          required
                          className="pl-10 font-financial text-base font-semibold h-10 bg-white tabular-nums border-[#EAEFF8] rounded-xl"
                        />
                      </div>
                    </div>

                    {rawAmount && (
                      (() => {
                        const actual = parseCurrencyInput(rawAmount);
                        const diff = actual - currentCashInDrawer;

                        if (diff === 0) {
                          return (
                            <div className="text-xs p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-700 flex items-center justify-between font-financial tabular-nums">
                              <span className="flex items-center gap-1.5 font-semibold font-sans">
                                <Check className="w-4 h-4 text-emerald-600" /> Kas Sesuai (Pas)
                              </span>
                              <span className="font-semibold">Rp 0</span>
                            </div>
                          );
                        }
                        if (diff < 0) {
                          return (
                            <div className="text-xs p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-700 flex items-center justify-between font-financial tabular-nums">
                              <span className="flex items-center gap-1.5 font-semibold font-sans">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Kas Kurang (Minus)
                              </span>
                              <span className="font-semibold">-{formatCurrency(Math.abs(diff))}</span>
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs p-3 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 flex items-center justify-between font-financial tabular-nums">
                            <span className="flex items-center gap-1.5 font-semibold font-sans">
                              <Check className="w-4 h-4 text-blue-600" /> Kas Lebih (Plus)
                            </span>
                            <span className="font-semibold">+{formatCurrency(diff)}</span>
                          </div>
                        );
                      })()
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="submit" variant="destructive" disabled={isSubmitting} className="font-semibold h-9 text-xs px-4 rounded-xl cursor-pointer bg-rose-600 hover:bg-rose-700">
                        {isSubmitting ? "Menutup Shift..." : "Konfirmasi & Tutup Shift"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-9 text-xs px-4 rounded-xl border-[#EAEFF8] cursor-pointer" onClick={() => setActivePanel("NONE")}>
                        Batal
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabel Aktivitas Terkini Shift Ini */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                      Aktivitas Terkini Shift Ini
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Transaksi kasir dan mutasi arus kas yang baru saja berlangsung
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRawAmount("");
                        setDescInput("");
                        setMovementType("IN");
                        setIsMovementModalOpen(true);
                      }}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold h-9 px-3 gap-1.5 cursor-pointer hover:bg-slate-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Catat Kas Laci
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.replace(`/outlet/${outletKey}/shifts?tab=transactions`, { scroll: false })}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold h-9 px-3 cursor-pointer hover:bg-slate-50"
                    >
                      Semua Transaksi
                    </Button>
                  </div>
                </div>

                <AppTable
                  columns={activityColumns}
                  data={timelineActivities}
                  keyExtractor={(act) => act.id}
                  pageSize={5}
                  emptyTitle="Belum ada aktivitas"
                  emptyDescription="Belum ada aktivitas kas atau transaksi pada sesi shift ini."
                />
              </div>
            </div>
          ) : (
            /* Form Buka Shift jika belum ada shift aktif */
            <div className="bg-white rounded-2xl border border-[#EAEFF8] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAEFF8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center font-semibold">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                      Buka Shift Kasir Baru
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Masukkan modal awal kas (uang kembalian) di laci untuk memulai transaksi.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 rounded-xl border-[#EAEFF8] cursor-pointer"
                  onClick={() => setUseCalculator(!useCalculator)}
                >
                  <Calculator className="w-4 h-4" />
                  {useCalculator ? "Mode Input Cepat" : "Hitung Pecahan Lembaran"}
                </Button>
              </div>

              <form onSubmit={handleStartShift} className="space-y-5 max-w-xl">
                {!useCalculator ? (
                  <div className="space-y-3">
                    <Label htmlFor="startingCash" className="text-xs font-semibold">
                      Modal Awal Kasir (Rp)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground text-sm">
                        Rp
                      </span>
                      <Input
                        id="startingCash"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formattedDisplayAmount}
                        onChange={handleAmountChange}
                        autoFocus
                        className="pl-11 font-financial text-lg font-semibold h-11 bg-background tabular-nums rounded-xl"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_DENOMINATIONS.map((num) => (
                        <button
                          key={num}
                          type="button"
                          className="text-[11px] px-3 py-1 rounded-lg border bg-muted/50 hover:bg-muted font-financial font-medium transition-colors tabular-nums cursor-pointer"
                          onClick={() => setAmountValue(num)}
                        >
                          {num === 0 ? "Rp 0 (Tanpa Modal)" : formatCurrency(num)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-muted/30 rounded-2xl border space-y-3 font-financial tabular-nums">
                    <div className="space-y-2.5">
                      {BILL_VALUES.map((bill) => (
                        <div key={bill.value} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground w-24">
                            {bill.label}
                          </span>
                          <span className="text-muted-foreground font-sans">×</span>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="0"
                              value={billCounts[bill.value] || ""}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setBillCounts(prev => ({ ...prev, [bill.value]: val }));
                              }}
                              className="w-20 h-8 text-xs text-center font-semibold bg-background rounded-lg"
                            />
                            <span className="text-[11px] text-muted-foreground font-sans">lbr</span>
                          </div>
                          <span className="font-semibold w-24 text-right">
                            {formatCurrency((billCounts[bill.value] || 0) * bill.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs font-semibold">
                      <span className="font-sans">Total Modal Kas:</span>
                      <span className="text-blue-600 dark:text-blue-400 text-lg">
                        {formatCurrency(calculatorTotal)}
                      </span>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="h-11 px-6 font-semibold shadow-xs bg-[#0e59f9] hover:bg-[#0c4cd4] text-white rounded-xl cursor-pointer">
                  {isSubmitting ? "Membuka Shift..." : "Konfirmasi & Buka Shift"}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ARUS KAS LACI (IN / OUT) */}
      {/* ========================================================================= */}
      {activeTab === "movements" && (
        <div className="space-y-6">
          {/* Header & Quick Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Arus Kas Laci
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Catatan mutasi kas masuk (in) dan kas keluar (out) darurat pada sesi shift aktif
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Quick Balance Indicators - Borderless */}
              <div className="flex items-center gap-2 text-xs font-financial tabular-nums">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border-none flex items-center gap-1 font-semibold">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  +{formatCurrency(totalCashIn)}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border-none flex items-center gap-1 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  -{formatCurrency(totalCashOut)}
                </span>
              </div>

              <Button
                onClick={() => {
                  setRawAmount("");
                  setDescInput("");
                  setMovementType("IN");
                  setIsMovementModalOpen(true);
                }}
                disabled={!activeShift}
                className="rounded-xl bg-[#0e59f9] hover:bg-[#0c4cd4] text-white text-xs font-semibold h-10 px-4 gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Catat Kas Laci
              </Button>
            </div>
          </div>

          {/* Tabel Log Mutasi Kas */}
          <AppTable
            columns={movementColumns}
            data={activeShift?.cashMovements || []}
            keyExtractor={(item) => item.id}
            searchKey="description"
            searchPlaceholder="Cari mutasi kas..."
            emptyTitle="Belum ada mutasi kas"
            emptyDescription="Belum ada catatan pergerakan kas masuk atau keluar pada shift ini."
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSAKSI SHIFT BERJALAN */}
      {/* ========================================================================= */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Transaksi Shift Aktif
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Daftar seluruh pesanan yang berhasil diproses pada sesi shift ini
              </p>
            </div>
          </div>

          <AppTable
            columns={transactionColumns}
            data={activeShift?.transactions || []}
            keyExtractor={(item) => item.id}
            searchKey="orderNumber"
            searchPlaceholder="Cari nomor pesanan..."
            emptyTitle="Belum ada transaksi"
            emptyDescription="Belum ada transaksi yang diproses pada sesi shift ini."
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RIWAYAT & REKAP SHIFT (AUDIT) */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Riwayat Shift
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Arsip rekapitulasi sesi kasir dan rekonsiliasi kas
              </p>
            </div>

            {shiftHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportShiftHistoryToExcel(shiftHistory, outletKey)}
                className="rounded-xl border-[#EAEFF8] bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-2 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel</span>
              </Button>
            )}
          </div>

          <AppTable
            columns={historyColumns}
            data={shiftHistory}
            keyExtractor={(item) => item.id}
            searchKey={(item) => `${item.cashierName || ''} ${item.id || ''}`}
            searchPlaceholder="Cari kasir / ID shift..."
            onRowClick={(item) => {
              if (outletKey) {
                router.push(`/outlet/${outletKey}/shifts/${item.id}`);
              } else {
                setModalShiftId(item.id);
              }
            }}
            emptyTitle="Belum ada riwayat shift"
            emptyDescription="Tidak ada data riwayat shift yang sesuai dengan pencarian."
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: JADWAL & LOG AKTIVITAS */}
      {/* ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEFF8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#0e59f9]/10 text-[#0e59f9] flex items-center justify-center font-semibold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-slate-900 tracking-tight">
                  Jadwal & Log Kronologis Hari Ini
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {timelineActivities.length} aktivitas transaksi dan mutasi kas tercatat hari ini
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Weekday Strip with Blue Highlight for Today */}
          <div className="grid grid-cols-7 gap-2 py-2 text-center border-b border-[#EAEFF8] pb-4">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center py-2.5 rounded-xl transition-all ${
                  day.isToday
                    ? "bg-[#0e59f9] text-white font-semibold shadow-xs scale-105"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-[11px] font-medium">{day.name}</span>
                <span className="text-sm font-semibold mt-0.5">{day.date}</span>
              </div>
            ))}
          </div>

          {/* Timeline Activities List */}
          <div className="space-y-3 pt-1 max-h-96 overflow-y-auto pr-1">
            {timelineActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Belum ada aktivitas kas atau transaksi pada shift ini.
              </div>
            ) : (
              timelineActivities.map((act) => (
                <div
                  key={act.id}
                  className={`pl-3.5 py-2 border-l-2 ${act.badgeColor} flex items-center justify-between text-xs hover:bg-muted/30 rounded-r-xl transition-colors px-3`}
                >
                  <div>
                    <div className="font-semibold text-foreground leading-snug">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-financial tabular-nums">
                      {format(act.time, "HH:mm")} • {act.subtitle}
                    </div>
                  </div>

                  <div className="font-financial font-semibold text-foreground text-right shrink-0 tabular-nums">
                    {formatCurrency(act.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL CATAT ARUS KAS LACI (IN / OUT) */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-[#EAEFF8] bg-white shadow-lg">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Catat Kas Masuk / Keluar Laci
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Catat pengeluaran operasional darurat atau penambahan modal uang kembalian.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMovement} className="space-y-4 pt-2">
            {/* Toggle Type */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <Button
                type="button"
                variant={movementType === "IN" ? "default" : "ghost"}
                size="sm"
                className={movementType === "IN" ? "bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg shadow-xs" : "text-slate-600 text-xs rounded-lg hover:text-slate-900 font-medium"}
                onClick={() => setMovementType("IN")}
              >
                <ArrowDownLeft className="w-4 h-4 mr-1.5" />
                Kas Masuk (In)
              </Button>
              <Button
                type="button"
                variant={movementType === "OUT" ? "default" : "ghost"}
                size="sm"
                className={movementType === "OUT" ? "bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold rounded-lg shadow-xs" : "text-slate-600 text-xs rounded-lg hover:text-slate-900 font-medium"}
                onClick={() => setMovementType("OUT")}
              >
                <ArrowUpRight className="w-4 h-4 mr-1.5" />
                Kas Keluar (Out)
              </Button>
            </div>

            {/* Nominal Input */}
            <div className="space-y-1.5">
              <Label htmlFor="modalMovementAmount" className="text-xs font-semibold text-slate-700">Nominal Uang (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs">Rp</span>
                <Input
                  id="modalMovementAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formattedDisplayAmount}
                  onChange={handleAmountChange}
                  required
                  autoFocus
                  className="pl-9 font-financial text-sm font-semibold h-10 bg-white tabular-nums border-[#EAEFF8] rounded-xl"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <Label htmlFor="modalMovementDesc" className="text-xs font-semibold text-slate-700">Keterangan / Keperluan</Label>
              <Input
                id="modalMovementDesc"
                type="text"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                required
                placeholder={movementType === "IN" ? "Cth: Tambah uang kembalian" : "Cth: Beli gas LPG / es batu"}
                className="h-10 text-xs bg-white border-[#EAEFF8] rounded-xl"
              />
            </div>

            {/* Quick presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Pilihan Cepat Keterangan:</span>
              <div className="flex flex-wrap gap-1.5">
                {(movementType === "IN" ? CASH_IN_PRESETS : CASH_OUT_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-[#EAEFF8] bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
                    onClick={() => setDescInput(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 text-xs px-4 rounded-xl border-[#EAEFF8] cursor-pointer"
                onClick={() => setIsMovementModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "h-10 text-xs px-5 font-semibold text-white rounded-xl shadow-xs cursor-pointer",
                  movementType === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Mutasi Kas"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DETAIL AUDIT UNTUK RIWAYAT KEMARIN & SEBELUMNYA */}
      {modalShiftId && (
        <ShiftDetailModal shiftId={modalShiftId} onClose={() => setModalShiftId(null)} />
      )}
    </div>
  );
}

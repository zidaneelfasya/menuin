"use client";

import * as React from "react";
import { format, formatDistanceStrict } from "date-fns";
import { id } from "date-fns/locale";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, parseCurrencyInput } from "@/lib/utils/format";
import { startShift, endShift, addCashMovement } from "@/lib/actions/shifts";
import { toast } from "sonner";
import Link from "next/link";
import {
  IconClock,
  IconUser,
  IconHistory,
  IconShoppingCart,
  IconCreditCard,
  IconPlus,
  IconCalendar,
  IconReceipt,
  IconSearch,
  IconCheck,
  IconAlertTriangle,
  IconCalculator,
  IconPrinter,
  IconArrowsExchange,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconLogout,
  IconX,
  IconCoin,
  IconCash,
  IconFileText
} from "@tabler/icons-react";
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

  // In-page actions for today's active shift: 'NONE' | 'END_SHIFT'
  const [activePanel, setActivePanel] = React.useState<"NONE" | "END_SHIFT">("NONE");

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

  // Search & Filter state
  const [historySearch, setHistorySearch] = React.useState("");

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
      router.refresh();
    } else {
      toast.error(res.error || "Gagal mencatat pergerakan kas");
    }
  };

  const filteredHistory = React.useMemo(() => {
    if (!historySearch.trim()) return shiftHistory;
    const q = historySearch.toLowerCase();
    return shiftHistory.filter(
      (s: any) =>
        (s.cashierName && s.cashierName.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q))
    );
  }, [shiftHistory, historySearch]);

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

  // Combined timeline of movements and transactions for today
  const timelineActivities = React.useMemo(() => {
    const list: any[] = [];

    if (activeShift?.cashMovements) {
      activeShift.cashMovements.forEach((m: any) => {
        list.push({
          id: m.id,
          type: m.type === "IN" ? "CASH_IN" : "CASH_OUT",
          title: m.type === "IN" ? "Kas Masuk" : "Kas Keluar",
          subtitle: m.description,
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
          subtitle: `${t.paymentMethod || "CASH"} • ${t.tableNumber ? `Meja ${t.tableNumber}` : t.orderType || "Takeaway"}`,
          amount: Number(t.grandTotal || t.totalAmount || 0),
          time: new Date(t.createdAt),
          badgeColor: "border-l-emerald-500",
        });
      });
    }

    return list.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [activeShift]);

  // Generate 7-day calendar strip
  const daysOfWeek = React.useMemo(() => {
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
  }, []);

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
            <div className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header Status & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <IconClock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Sesi Shift Sedang Berjalan
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kasir: <strong className="text-foreground">{activeShift.cashierName || "Kasir"}</strong> • Dimulai pukul {format(new Date(activeShift.startTime), "HH:mm")} ({shiftDuration || "Berjalan"})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {outletKey && (
                    <Link href={`/outlet/${outletKey}/pos`}>
                      <Button variant="outline" className="rounded-xl border-border/80 text-xs font-semibold h-9 gap-1.5 shadow-2xs">
                        <IconShoppingCart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Buka POS
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant={activePanel === "END_SHIFT" ? "default" : "destructive"}
                    onClick={() => {
                      resetCalculator();
                      setRawAmount(activeShift?.metrics?.expectedCash?.toString() || "");
                      setActivePanel(activePanel === "END_SHIFT" ? "NONE" : "END_SHIFT");
                    }}
                    className="rounded-xl text-xs font-semibold h-9 gap-1.5 shadow-xs"
                  >
                    <IconLogout className="w-3.5 h-3.5" />
                    Tutup Shift & Rekonsiliasi
                  </Button>
                </div>
              </div>

              {/* 4 Financial Breakdown Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Modal Awal */}
                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium block">Modal Awal Kasir</span>
                  <div className="text-lg font-bold font-financial tabular-nums text-foreground">
                    {formatCurrency(Number(activeShift.startingCash || 0))}
                  </div>
                  <span className="text-[11px] text-muted-foreground block">Uang kembalian awal laci</span>
                </div>

                {/* 2. Total Penjualan & Breakdown */}
                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium block">Total Penjualan (Omzet)</span>
                  <div className="text-lg font-bold font-financial tabular-nums text-foreground">
                    {formatCurrency(totalSalesAmount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between font-financial tabular-nums">
                    <span>Tunai: {formatCurrency(totalCashSales)}</span>
                    <span>Non-Tunai: {formatCurrency(totalNonCashSales)}</span>
                  </div>
                </div>

                {/* 3. Pergerakan Kas */}
                <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium block">Pergerakan Kas Laci</span>
                  <div className="text-lg font-bold font-financial tabular-nums text-foreground flex items-center gap-1.5">
                    <span className="text-emerald-600">+{formatCurrency(totalCashIn)}</span>
                    <span className="text-muted-foreground text-xs font-normal">/</span>
                    <span className="text-rose-600">-{formatCurrency(totalCashOut)}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    {activeShift.cashMovements?.length || 0} mutasi dicatat
                  </span>
                </div>

                {/* 4. Estimasi Kas Laci Saat Ini */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-1">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold block">Estimasi Kas di Laci</span>
                  <div className="text-lg font-bold font-financial tabular-nums text-blue-600 dark:text-blue-400">
                    {formatCurrency(currentCashInDrawer)}
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Modal + Tunai + Kas Masuk - Keluar
                  </span>
                </div>
              </div>

              {/* Tutup Shift Form Panel */}
              {activePanel === "END_SHIFT" && (
                <div className="bg-muted/20 rounded-2xl border border-destructive/40 p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2 text-destructive">
                      <IconLogout className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Rekonsiliasi Kas & Konfirmasi Tutup Shift</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full" onClick={() => setActivePanel("NONE")}>
                      <IconX className="w-4 h-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleEndShift} className="space-y-4 max-w-xl">
                    <div className="p-3 bg-card rounded-xl border text-xs flex justify-between items-center font-financial tabular-nums">
                      <span className="text-muted-foreground font-sans">Ekspektasi Kas Laci Sistem:</span>
                      <span className="font-bold text-foreground text-sm">
                        {formatCurrency(currentCashInDrawer)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="actualCash" className="text-xs font-semibold">Uang Fisik Aktual di Laci Kasir (Rp)</Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs">Rp</span>
                        <Input
                          id="actualCash"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formattedDisplayAmount}
                          onChange={handleAmountChange}
                          autoFocus
                          required
                          className="pl-10 font-financial text-base font-bold h-10 bg-background tabular-nums"
                        />
                      </div>
                    </div>

                    {rawAmount && (
                      (() => {
                        const actual = parseCurrencyInput(rawAmount);
                        const diff = actual - currentCashInDrawer;

                        if (diff === 0) {
                          return (
                            <div className="text-xs p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-financial tabular-nums">
                              <span className="flex items-center gap-1.5 font-semibold font-sans">
                                <IconCheck className="w-4 h-4 text-emerald-600" /> Kas Sesuai (Pas)
                              </span>
                              <span className="font-bold">Rp 0</span>
                            </div>
                          );
                        }
                        if (diff < 0) {
                          return (
                            <div className="text-xs p-3 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between font-financial tabular-nums">
                              <span className="flex items-center gap-1.5 font-semibold font-sans">
                                <IconAlertTriangle className="w-4 h-4 text-rose-600" /> Kas Kurang (Minus)
                              </span>
                              <span className="font-bold">-{formatCurrency(Math.abs(diff))}</span>
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs p-3 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-between font-financial tabular-nums">
                            <span className="flex items-center gap-1.5 font-semibold font-sans">
                              <IconCheck className="w-4 h-4 text-blue-600" /> Kas Lebih (Plus)
                            </span>
                            <span className="font-bold">+{formatCurrency(diff)}</span>
                          </div>
                        );
                      })()
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="submit" variant="destructive" disabled={isSubmitting} className="font-semibold h-9 text-xs px-4">
                        {isSubmitting ? "Menutup Shift..." : "Konfirmasi & Tutup Shift"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-9 text-xs px-4" onClick={() => setActivePanel("NONE")}>
                        Batal
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Form Buka Shift jika belum ada shift aktif */
            <div className="bg-card rounded-2xl border border-border/70 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <IconCash className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                      Buka Shift Kasir Baru
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Masukkan modal awal kas (uang kembalian) di laci untuk memulai transaksi.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 rounded-xl"
                  onClick={() => setUseCalculator(!useCalculator)}
                >
                  <IconCalculator className="w-4 h-4" />
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
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
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
                        className="pl-11 font-financial text-lg font-bold h-11 bg-background tabular-nums rounded-xl"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_DENOMINATIONS.map((num) => (
                        <button
                          key={num}
                          type="button"
                          className="text-[11px] px-3 py-1 rounded-lg border bg-muted/50 hover:bg-muted font-financial font-medium transition-colors tabular-nums"
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
                              className="w-20 h-8 text-xs text-center font-bold bg-background rounded-lg"
                            />
                            <span className="text-[11px] text-muted-foreground font-sans">lbr</span>
                          </div>
                          <span className="font-semibold w-24 text-right">
                            {formatCurrency((billCounts[bill.value] || 0) * bill.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs font-bold">
                      <span className="font-sans">Total Modal Kas:</span>
                      <span className="text-blue-600 dark:text-blue-400 text-lg">
                        {formatCurrency(calculatorTotal)}
                      </span>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="h-11 px-6 font-semibold shadow-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
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
          {/* Form Input Kas Masuk / Keluar */}
          <div className="bg-card rounded-2xl border border-border/70 p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-border/60">
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Catat Kas Masuk / Kas Keluar Laci
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Catat pengeluaran operasional darurat (beli es, gas, dll) atau penambahan modal uang kembalian.
              </p>
            </div>

            <form onSubmit={handleMovement} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
                <Button
                  type="button"
                  variant={movementType === "IN" ? "default" : "ghost"}
                  size="sm"
                  className={movementType === "IN" ? "bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg" : "text-xs rounded-lg"}
                  onClick={() => setMovementType("IN")}
                >
                  <IconArrowDownLeft className="w-4 h-4 mr-1.5" />
                  Kas Masuk (In)
                </Button>
                <Button
                  type="button"
                  variant={movementType === "OUT" ? "default" : "ghost"}
                  size="sm"
                  className={movementType === "OUT" ? "bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold rounded-lg" : "text-xs rounded-lg"}
                  onClick={() => setMovementType("OUT")}
                >
                  <IconArrowUpRight className="w-4 h-4 mr-1.5" />
                  Kas Keluar (Out)
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="movementAmount" className="text-xs font-semibold">Nominal Uang (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs">Rp</span>
                    <Input
                      id="movementAmount"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formattedDisplayAmount}
                      onChange={handleAmountChange}
                      required
                      className="pl-9 font-financial text-sm font-bold h-9 bg-background tabular-nums rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="movementDesc" className="text-xs font-semibold">Keterangan / Keperluan</Label>
                  <Input
                    id="movementDesc"
                    type="text"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    required
                    placeholder={movementType === "IN" ? "Cth: Tambah uang kembalian" : "Cth: Beli gas LPG / es batu"}
                    className="h-9 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">Pilihan Cepat Keterangan:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(movementType === "IN" ? CASH_IN_PRESETS : CASH_OUT_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="text-[11px] px-2.5 py-1 rounded-lg border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
                      onClick={() => setDescInput(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className={movementType === "IN" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs px-4 rounded-xl" : "bg-rose-600 hover:bg-rose-700 text-white font-semibold h-9 text-xs px-4 rounded-xl"}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pergerakan Kas"}
              </Button>
            </form>
          </div>

          {/* Tabel Log Mutasi Kas */}
          <div className="bg-card rounded-2xl border border-border/70 overflow-hidden shadow-xs">
            <div className="p-4 md:px-6 border-b border-border/60">
              <h3 className="font-bold text-sm text-foreground">Log Mutasi Kas Laci Shift Ini</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="text-xs border-border/60">
                    <TableHead className="w-[100px]">Waktu</TableHead>
                    <TableHead className="w-[140px]">Jenis</TableHead>
                    <TableHead>Keterangan / Keperluan</TableHead>
                    <TableHead className="text-right w-[150px]">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!activeShift?.cashMovements || activeShift.cashMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada catatan pergerakan kas masuk atau keluar pada shift ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeShift.cashMovements.map((m: any) => (
                      <TableRow key={m.id} className="text-xs hover:bg-muted/30 transition-colors border-border/60">
                        <TableCell className="text-muted-foreground font-financial tabular-nums">
                          {format(new Date(m.createdAt), "HH:mm")}
                        </TableCell>
                        <TableCell>
                          {m.type === "IN" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
                              <IconArrowDownLeft className="w-3.5 h-3.5" /> Kas Masuk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50">
                              <IconArrowUpRight className="w-3.5 h-3.5" /> Kas Keluar
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {m.description}
                        </TableCell>
                        <TableCell className={`text-right font-financial font-bold tabular-nums ${m.type === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                          {m.type === "IN" ? "+" : "-"}{formatCurrency(Number(m.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSAKSI SHIFT BERJALAN */}
      {/* ========================================================================= */}
      {activeTab === "transactions" && (
        <div className="bg-card rounded-2xl border border-border/70 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 md:px-6 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm md:text-base text-foreground">
                Transaksi Pada Shift Aktif ({activeShift?.transactions?.length || 0})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daftar seluruh pesanan yang berhasil diproses pada sesi shift ini.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="text-xs border-border/60">
                  <TableHead className="w-[140px]">No. Order</TableHead>
                  <TableHead className="w-[100px]">Waktu</TableHead>
                  <TableHead className="w-[160px]">Tipe & Meja</TableHead>
                  <TableHead className="w-[130px]">Pembayaran</TableHead>
                  <TableHead className="text-right w-[150px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!activeShift?.transactions || activeShift.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                      Belum ada transaksi pada shift ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeShift.transactions.map((tx: any) => (
                    <TableRow key={tx.id} className="text-xs hover:bg-muted/30 transition-colors border-border/60">
                      <TableCell className="font-mono font-semibold text-foreground">
                        {tx.orderNumber || "#-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-financial tabular-nums">
                        {format(new Date(tx.createdAt), "HH:mm")}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {tx.tableNumber ? `Meja ${tx.tableNumber}` : tx.orderType || "Takeaway"}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50">
                          {tx.paymentMethod || "CASH"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-financial font-bold text-foreground tabular-nums">
                        {formatCurrency(Number(tx.grandTotal || tx.totalAmount || 0))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RIWAYAT & REKAP SHIFT (AUDIT) */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
          {/* Table Card Header */}
          <div className="p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
            <div>
              <h2 className="font-bold text-sm md:text-base text-foreground tracking-tight">
                Riwayat & Arsip Shift Kasir
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit riwayat penutupan shift, rekonsiliasi kas, dan rekap omzet harian.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <IconSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kasir / ID shift..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background rounded-lg"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="text-xs text-muted-foreground border-border/60">
                  <TableHead className="w-[260px]">Kasir & Tanggal</TableHead>
                  <TableHead className="w-[180px]">Waktu & Durasi</TableHead>
                  <TableHead className="w-[160px]">Total Omzet</TableHead>
                  <TableHead className="w-[160px]">Selisih Kas</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[90px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      Belum ada riwayat shift kemarin atau sebelumnya.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((shift) => {
                    const diff = Number(shift.cashDifference || 0);

                    return (
                      <TableRow
                        key={shift.id}
                        className="text-xs hover:bg-muted/40 transition-colors border-border/60 cursor-pointer"
                        onClick={() => setModalShiftId(shift.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted text-foreground/80 font-bold flex items-center justify-center text-xs shrink-0 border border-border/60">
                              {shift.cashierName ? shift.cashierName.charAt(0).toUpperCase() : "K"}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {shift.cashierName || "Kasir"}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {format(new Date(shift.startTime), "dd MMMM yyyy", { locale: id })}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-foreground">
                            {format(new Date(shift.startTime), "HH:mm")} - {shift.endTime ? format(new Date(shift.endTime), "HH:mm") : "Selesai"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {shift.endTime ? formatDistanceStrict(new Date(shift.startTime), new Date(shift.endTime), { locale: id }) : "-"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-foreground font-financial tabular-nums">
                            {formatCurrency(Number(shift.totalSales) || 0)}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-financial tabular-nums">
                            {shift.totalTransactions || 0} transaksi
                          </div>
                        </TableCell>

                        <TableCell>
                          {diff === 0 ? (
                            <span className="font-financial tabular-nums text-emerald-600 font-semibold">Pas (Rp 0)</span>
                          ) : diff < 0 ? (
                            <span className="font-financial tabular-nums text-rose-600 font-semibold">Kurang {formatCurrency(Math.abs(diff))}</span>
                          ) : (
                            <span className="font-financial tabular-nums text-blue-600 font-semibold">Lebih {formatCurrency(diff)}</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
                            Completed
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalShiftId(shift.id);
                            }}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: JADWAL & LOG AKTIVITAS */}
      {/* ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="bg-card rounded-2xl border border-border/70 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <IconCalendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  Jadwal & Log Kronologis Hari Ini
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timelineActivities.length} aktivitas transaksi dan mutasi kas tercatat hari ini
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Weekday Strip with Blue Highlight for Today */}
          <div className="grid grid-cols-7 gap-2 py-2 text-center border-b border-border/40 pb-4">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center py-2.5 rounded-xl transition-all ${
                  day.isToday
                    ? "bg-blue-600 text-white font-bold shadow-xs scale-105"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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

                  <div className="font-financial font-bold text-foreground text-right shrink-0 tabular-nums">
                    {formatCurrency(act.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL DETAIL AUDIT UNTUK RIWAYAT KEMARIN & SEBELUMNYA */}
      {modalShiftId && (
        <ShiftDetailModal shiftId={modalShiftId} onClose={() => setModalShiftId(null)} />
      )}
    </div>
  );
}

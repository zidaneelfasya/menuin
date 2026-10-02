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
  Landmark,
  CheckCircle2,
  Calendar as CalendarIcon,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import { format, subMonths, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  getFinanceReport,
  createExpenseAction,
  createCashInAction,
  deleteExpenseAction,
  ReportPeriod,
} from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { formatPaymentMethodLabel } from "@/lib/utils/format";

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

// ==========================================
// NUMBER & CURRENCY FORMATTERS (NO DECIMALS)
// ==========================================

function formatRupiah(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

function formatNumber(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  return Math.round(num).toLocaleString("id-ID");
}

function formatCompactRupiah(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  if (!num || num === 0) return "0";
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    const m = num / 1_000_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(".", ",")}M`;
  }
  if (abs >= 1_000_000) {
    const jt = num / 1_000_000;
    return `${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace(".", ",")}jt`;
  }
  if (abs >= 1_000) {
    const rb = num / 1_000;
    return `${rb % 1 === 0 ? rb.toFixed(0) : rb.toFixed(1).replace(".", ",")}rb`;
  }
  return Math.round(num).toString();
}

function formatCompactCurrency(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  if (!num || num === 0) return "0";
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    const m = num / 1_000_000_000;
    const str = m.toFixed(1).replace(".", ",");
    return `${str.endsWith(",0") ? str.slice(0, -2) : str} M`;
  }
  if (abs >= 1_000_000) {
    const jt = num / 1_000_000;
    const str = jt.toFixed(1).replace(".", ",");
    return `${str.endsWith(",0") ? str.slice(0, -2) : str} Jt`;
  }
  if (abs >= 1_000) {
    const rb = num / 1_000;
    const str = rb.toFixed(1).replace(".", ",");
    return `${str.endsWith(",0") ? str.slice(0, -2) : str} rb`;
  }
  return Math.round(num).toLocaleString("id-ID");
}

function formatKpiCurrency(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return `Rp ${formatCompactCurrency(num)}`;
  }
  return formatRupiah(num);
}

// ==========================================
// SVG VISUAL HELPERS (CATMULL-ROM SPLINE)
// ==========================================

function getCubicSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.x.toFixed(1) === p2.y.toFixed(1) ? p2.y.toFixed(1) : p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Dynamic Trendline Sparkline for Top KPI Cards (with IntersectionObserver)
 */
function MiniSparkline({
  percentage,
  isPositive,
  metricSeed = 1,
  color,
  data,
}: {
  percentage?: number;
  isPositive?: boolean;
  metricSeed?: number;
  color?: string;
  data?: number[];
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const [isAnimated, setIsAnimated] = React.useState(false);

  React.useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isInView) {
      setIsAnimated(false);
      return;
    }
    setIsAnimated(false);
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 40 + metricSeed * 25);
    return () => clearTimeout(timer);
  }, [isInView, percentage, data, metricSeed]);

  const width = 76;
  const height = 40;
  const padX = 2;
  const midY = height / 2;

  const gradId = React.useId().replace(/:/g, "_");
  const positive = isPositive !== undefined
    ? isPositive
    : (data && data.length >= 2)
      ? data[data.length - 1] >= data[0]
      : (percentage ?? 0) >= 0;
  const strokeColor = color || (positive ? "#10b981" : "#f43f5e");

  const { lineD, areaD, lastPoint } = React.useMemo(() => {
    const pts: { x: number; y: number }[] = [];

    // Prioritize REAL DATA when provided
    if (data && data.length >= 2) {
      const dataMin = Math.min(...data);
      const dataMax = Math.max(...data);
      const min = dataMin > 0 ? Math.max(0, dataMin * 0.7) : Math.min(0, dataMin);
      const max = Math.max(dataMax, min + 1);
      const range = max - min || 1;

      data.forEach((val, idx) => {
        const x = padX + (idx / (data.length - 1)) * (width - 2 * padX);
        const clampedVal = Math.max(min, Math.min(max, val));
        const y = height - 5 - ((clampedVal - min) / range) * (height - 10);
        pts.push({ x, y });
      });
    } else if (percentage !== undefined) {
      const numPoints = 24;
      const absP = Math.abs(percentage);
      const isUp = percentage >= 0;
      const ratio = Math.min(absP / 50, 1.0);
      const maxClimb = 30;
      const actualClimb = ratio * maxClimb;

      const yStart = isUp ? midY + actualClimb * 0.45 : midY - actualClimb * 0.45;
      const yEnd = isUp ? midY - actualClimb * 0.55 : midY + actualClimb * 0.55;
      const phase = (metricSeed * 0.43) % 1;

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const x = padX + t * (width - 2 * padX);
        const linearY = yStart + (yEnd - yStart) * t;

        const oct1 = Math.sin((t * 4.3 + phase * 2.1) * Math.PI * 2) * 2.0;
        const oct2 = Math.cos((t * 8.7 + phase * 4.3) * Math.PI * 2) * 1.2;
        const drift = Math.sin((t * 2.1 + phase) * Math.PI * 2) * 0.8;
        const wave = (oct1 + oct2 + drift) * Math.sin(t * Math.PI);

        const y = Math.max(2.0, Math.min(height - 2.5, linearY + wave));
        pts.push({ x, y });
      }
    }

    if (pts.length < 2) return { lineD: "", areaD: "", lastPoint: null };

    const splineD = getCubicSplinePath(pts);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const fillD = `${splineD} L ${last.x.toFixed(1)},${height} L ${first.x.toFixed(1)},${height} Z`;

    return { lineD: splineD, areaD: fillD, lastPoint: last };
  }, [percentage, data, metricSeed, width, height, midY, padX]);

  if (!lineD) return null;

  return (
    <svg ref={svgRef} width={width} height={height} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#${gradId})`}
        style={{
          opacity: isAnimated ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <path
        d={lineD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={isAnimated ? 0 : 100}
        style={{
          transition: "stroke-dashoffset 850ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={strokeColor}
          style={{
            opacity: isAnimated ? 1 : 0,
            transform: isAnimated ? "scale(1)" : "scale(0)",
            transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
            transition: "all 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms",
          }}
        />
      )}
    </svg>
  );
}

/**
 * Animated Horizontal Bar (with IntersectionObserver)
 */
function AnimatedHorizontalBar({
  widthPercent,
  colorClass = "bg-[#0e59f9]",
  trackClass = "bg-slate-100",
  heightClass = "h-2",
  delayMs = 0,
}: {
  widthPercent: number;
  colorClass?: string;
  trackClass?: string;
  heightClass?: string;
  delayMs?: number;
}) {
  const barRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const el = barRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={barRef} className={cn("w-full rounded-full overflow-hidden", trackClass, heightClass)}>
      <div
        className={cn("h-full rounded-full", colorClass)}
        style={{
          width: isInView ? `${Math.min(100, Math.max(0, widthPercent))}%` : "0%",
          transition: "width 800ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}

/**
 * Animated Segmented Comparative Bar (Dual-Split Proportion with IntersectionObserver)
 */
function AnimatedSegmentedBar({
  leftPercent,
  rightPercent,
  leftColorClass = "bg-amber-400",
  rightColorClass = "bg-[#0e59f9]",
  leftTitle,
  rightTitle,
  heightClass = "h-2.5",
}: {
  leftPercent: number;
  rightPercent: number;
  leftColorClass?: string;
  rightColorClass?: string;
  leftTitle?: string;
  rightTitle?: string;
  heightClass?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner", heightClass)}>
      <div
        title={leftTitle}
        className={cn("h-full", leftColorClass)}
        style={{
          width: isInView ? `${Math.max(0, Math.min(100, leftPercent))}%` : "0%",
          transition: "width 800ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <div
        title={rightTitle}
        className={cn("h-full", rightColorClass)}
        style={{
          width: isInView ? `${Math.max(0, Math.min(100, rightPercent))}%` : "0%",
          transition: "width 800ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
    </div>
  );
}

// ==========================================
// MAIN CLIENT COMPONENT
// ==========================================

export function FinanceReportClient({ initialData, outletKey }: FinanceReportClientProps) {
  const [data, setData] = React.useState<FinanceReportData>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  // Tab mode state: "harian" | "bulanan" | "tahunan"
  const [currentTab, setCurrentTab] = React.useState<"harian" | "bulanan" | "tahunan">("bulanan");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(undefined);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(undefined);

  const now = React.useMemo(() => new Date(), []);
  const todayDateStr = React.useMemo(() => format(now, "yyyy-MM-dd"), [now]);
  const [monthParam, setMonthParam] = React.useState<string>(format(now, "yyyy-MM"));
  const [yearParam, setYearParam] = React.useState<string>(String(now.getFullYear()));

  // Interactive hover states for Cash Flow Bar Chart
  const [chartHoveredIndex, setChartHoveredIndex] = React.useState<number | null>(null);

  // Hero chart viewport entrance observer
  const heroChartRef = React.useRef<HTMLDivElement>(null);
  const [isHeroInView, setIsHeroInView] = React.useState(false);
  const [isHeroAnimated, setIsHeroAnimated] = React.useState(false);

  // Balance privacy visibility (masking toggle)
  const [isBalanceHidden, setIsBalanceHidden] = React.useState(false);

  // Modal mode: INCOME vs EXPENSE
  const [modalMode, setModalMode] = React.useState<"INCOME" | "EXPENSE">("EXPENSE");

  // Expense modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [category, setCategory] = React.useState("BAHAN_BAKU");
  const [amount, setAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("TUNAI");
  const [description, setDescription] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    const el = heroChartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsHeroInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsHeroInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isHeroInView) {
      setIsHeroAnimated(false);
      return;
    }
    setIsHeroAnimated(false);
    const timer = setTimeout(() => {
      setIsHeroAnimated(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [isHeroInView, data.chartBuckets]);

  // Data loader
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
    } catch (err: any) {
      toast.error("Terjadi kendala saat memperbarui laporan keuangan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Month navigation options (last 12 months)
  const monthOptions = React.useMemo(() => {
    const list = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
      const d = subMonths(base, i);
      const val = format(d, "yyyy-MM");
      const label = format(d, "MMMM yyyy", { locale: localeId });
      list.push({ value: val, label });
    }
    return list;
  }, []);

  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  }, []);

  // Filter Bar Handlers
  const handleTabChange = (tab: string) => {
    const nextTab = tab as "harian" | "bulanan" | "tahunan";
    setCurrentTab(nextTab);

    if (nextTab === "harian") {
      if (customRange?.from) {
        loadData(
          "custom",
          format(customRange.from, "yyyy-MM-dd"),
          format(customRange.to || customRange.from, "yyyy-MM-dd")
        );
      } else {
        loadData("daily", todayDateStr, todayDateStr);
      }
    } else if (nextTab === "bulanan") {
      const [y, m] = monthParam.split("-").map(Number);
      const start = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
      const end = format(new Date(y, m, 0), "yyyy-MM-dd");
      loadData("monthly", start, end);
    } else if (nextTab === "tahunan") {
      loadData("yearly", `${yearParam}-01-01`, `${yearParam}-12-31`);
    }
  };

  const handleApplyRange = () => {
    if (!tempRange?.from) return;
    setCustomRange(tempRange);
    setIsCalendarOpen(false);
    const startStr = format(tempRange.from, "yyyy-MM-dd");
    const endStr = format(tempRange.to || tempRange.from, "yyyy-MM-dd");
    loadData("custom", startStr, endStr);
  };

  const handleResetToToday = () => {
    setCustomRange(undefined);
    setTempRange(undefined);
    setIsCalendarOpen(false);
    loadData("daily", todayDateStr, todayDateStr);
  };

  const handleMonthSelect = (val: string) => {
    setMonthParam(val);
    const [y, m] = val.split("-").map(Number);
    const start = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
    const end = format(new Date(y, m, 0), "yyyy-MM-dd");
    loadData("monthly", start, end);
  };

  const handleMonthStep = (step: number) => {
    const [y, m] = monthParam.split("-").map(Number);
    const d = step > 0 ? addMonths(new Date(y, m - 1, 1), 1) : subMonths(new Date(y, m - 1, 1), 1);
    const newVal = format(d, "yyyy-MM");
    handleMonthSelect(newVal);
  };

  const handleYearSelect = (val: string) => {
    setYearParam(val);
    loadData("yearly", `${val}-01-01`, `${yearParam}-12-31`);
  };

  const handleYearStep = (step: number) => {
    const currentY = parseInt(yearParam, 10);
    const nextY = String(currentY + step);
    handleYearSelect(nextY);
  };

  const dateButtonLabel = React.useMemo(() => {
    if (!customRange?.from) return "Hari Ini";
    const fromStr = format(customRange.from, "d MMM", { locale: localeId });
    if (!customRange.to || format(customRange.from, "yyyy-MM-dd") === format(customRange.to, "yyyy-MM-dd")) {
      return fromStr;
    }
    const toStr = format(customRange.to, "d MMM yyyy", { locale: localeId });
    return `${fromStr} - ${toStr}`;
  }, [customRange]);

  const currentPeriodLabel = React.useMemo(() => {
    if (currentTab === "bulanan") {
      const [y, m] = monthParam.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      return format(d, "MMMM yyyy", { locale: localeId });
    }
    if (currentTab === "tahunan") {
      return `Tahun ${yearParam}`;
    }
    if (currentTab === "harian") {
      if (customRange?.from) {
        return dateButtonLabel;
      }
      return "Hari Ini";
    }
    return "Semua Waktu";
  }, [currentTab, monthParam, yearParam, customRange, dateButtonLabel]);

  const hasCustomDate = Boolean(customRange?.from);

  // Form Handlers (Income / Expense)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(`Masukkan nominal ${modalMode === "INCOME" ? "pemasukan" : "biaya"} yang valid.`);
      return;
    }
    if (!description.trim()) {
      toast.error(`Keterangan ${modalMode === "INCOME" ? "pemasukan" : "pengeluaran"} wajib diisi.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "INCOME") {
        const res = await createCashInAction({
          outletKey,
          amount: numAmount,
          description,
        });

        if (res.success) {
          toast.success("Pemasukan kas berhasil dicatat.");
          setIsModalOpen(false);
          setAmount("");
          setDescription("");
          handleTabChange(currentTab);
        } else {
          toast.error(res.error || "Gagal mencatat kas masuk.");
        }
      } else {
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
          handleTabChange(currentTab);
        } else {
          toast.error(res.error || "Gagal menyimpan pengeluaran.");
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat menyimpan transaksi.");
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
        handleTabChange(currentTab);
      } else {
        toast.error(res.error || "Gagal menghapus pengeluaran.");
      }
    } catch (err) {
      toast.error("Gagal menghapus.");
    }
  };

  // Export Excel Multi-sheet
  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Total Kas Masuk (Cash In)", Nilai: data.cashFlow.totalCashIn },
        { Indikator: "Penjualan Kasir Tunai (Fisik Laci)", Nilai: data.cashFlow.cashSalesTotal },
        { Indikator: "Penerimaan QRIS / Digital (Gross)", Nilai: (data.cashFlow as any).nonCashGrandTotal || data.cashFlow.nonCashSalesTotal },
        { Indikator: "Potongan MDR Payment Gateway (0.7%)", Nilai: (data.cashFlow as any).nonCashGatewayFee || (data.cashFlow as any).totalGatewayFee || 0 },
        { Indikator: "Pencairan Bersih Bank (Net Settled)", Nilai: data.cashFlow.nonCashSalesTotal },
        { Indikator: "Kas Masuk Manual Laci", Nilai: data.cashFlow.manualCashIn },
        { Indikator: "Total Kas Keluar (Cash Out)", Nilai: data.cashFlow.totalCashOut },
        { Indikator: "Biaya Kas Tunai", Nilai: data.cashFlow.cashExpenses },
        { Indikator: "Biaya Non-Tunai / Transfer Bank", Nilai: data.cashFlow.nonCashExpenses },
        { Indikator: "Pengambilan Kas Manual Laci", Nilai: data.cashFlow.manualCashOut },
        { Indikator: "Arus Kas Bersih (Net Cash Flow)", Nilai: data.cashFlow.netCashFlow },
        { Indikator: "Net Arus Kas Laci Kasir", Nilai: data.cashFlow.drawerNetFlow },
        { Indikator: "Net Saldo Bank & Digital", Nilai: data.cashFlow.digitalNetFlow },
        { Indikator: "Net Sales", Nilai: data.profitability.netSales },
        { Indikator: "Estimasi HPP Modal Produk Terjual", Nilai: data.profitability.totalHpp },
        { Indikator: "Estimasi Laba Kotor (Gross Profit)", Nilai: data.profitability.estimatedGrossProfit },
        { Indikator: "Margin Keuntungan (%)", Nilai: data.profitability.profitMargin.toFixed(1) + "%" },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Arus Kas");

      // Expenses Sheet
      const expenseRows = data.expenses.map((exp) => ({
        Tanggal: new Date(exp.date).toLocaleDateString("id-ID"),
        Kategori: exp.category,
        Deskripsi: exp.description,
        "Metode Pembayaran": exp.paymentMethod,
        "Nominal (Rp)": parseFloat(exp.amount),
      }));
      const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
      XLSX.utils.book_append_sheet(workbook, expenseSheet, "Daftar Pengeluaran");

      // Shift Reconciliations Sheet
      const shiftRows = data.shifts.map((s) => ({
        "Shift ID": s.id.slice(0, 8),
        Kasir: (s as any).cashierName || "Kasir",
        Status: s.status,
        Mulai: new Date(s.startTime).toLocaleString("id-ID"),
        Selesai: s.endTime ? new Date(s.endTime).toLocaleString("id-ID") : "-",
        "Modal Awal": parseFloat(s.startingCash || "0"),
        "Uang Aktual Kasir": s.actualCash ? parseFloat(s.actualCash) : "-",
        "Uang Sistem Diharapkan": parseFloat(s.expectedCash || "0"),
        Selisih: s.cashDifference ? parseFloat(s.cashDifference) : "-",
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

  const {
    cashFlow,
    profitability,
    expenses,
    expenseCategoryBreakdown,
    shifts,
    period: reportPeriod,
    tenant,
    chartBuckets = [],
    cashInTrend = [],
    cashOutTrend = [],
    netFlowTrend = [],
    grossProfitTrend = [],
  } = data;

  // Scaled calculations for Cash Flow Bar Chart
  const maxBucketValue = React.useMemo(() => {
    if (!chartBuckets || chartBuckets.length === 0) return 1000;
    const maxVal = Math.max(...chartBuckets.map((b) => Math.max(b.cashIn, b.cashOut)), 1000);
    return maxVal;
  }, [chartBuckets]);

  const chartYTicks = React.useMemo(() => {
    const step = maxBucketValue / 4;
    return [
      { val: maxBucketValue, label: formatCompactRupiah(maxBucketValue) },
      { val: step * 3, label: formatCompactRupiah(step * 3) },
      { val: step * 2, label: formatCompactRupiah(step * 2) },
      { val: step * 1, label: formatCompactRupiah(step * 1) },
      { val: 0, label: "0" },
    ];
  }, [maxBucketValue]);

  const activeHoverBucket = chartHoveredIndex !== null && chartBuckets ? chartBuckets[chartHoveredIndex] : null;

  // Dynamic bar width logic based on UI guidelines Section 6.3
  const barWidthStyle = React.useMemo(() => {
    const count = chartBuckets.length;
    if (count <= 3) return "w-14 sm:w-16";
    if (count <= 5) return "w-10 sm:w-12";
    if (count <= 8) return "w-7 sm:w-9";
    if (count <= 12) return "w-5 sm:w-6";
    if (count <= 16) return "w-4 sm:w-5";
    if (count <= 24) return "w-2.5 sm:w-3.5";
    if (count <= 31) return "w-1.5 sm:w-2.5";
    return "w-1 sm:w-1.5";
  }, [chartBuckets.length]);

  // Liquidity Proportions (Drawer vs Digital)
  const totalNetLiquidity = Math.max(
    1,
    Math.max(0, cashFlow.drawerNetFlow) + Math.max(0, cashFlow.digitalNetFlow)
  );
  const cashRatio = Math.round((Math.max(0, cashFlow.drawerNetFlow) / totalNetLiquidity) * 100);
  const digitalRatio = 100 - cashRatio;

  // Expense Channel Proportions (Drawer vs Bank)
  const cashExpensesTotal = cashFlow.cashExpenses + cashFlow.manualCashOut;
  const bankExpensesTotal = cashFlow.nonCashExpenses;
  const totalOutflowForRatio = Math.max(1, cashExpensesTotal + bankExpensesTotal);
  const cashOutflowPercent = Math.round((cashExpensesTotal / totalOutflowForRatio) * 100);
  const bankOutflowPercent = 100 - cashOutflowPercent;

  // Max expense category for horizontal bar scaling
  const maxExpenseCategory = React.useMemo(() => {
    if (!expenseCategoryBreakdown || expenseCategoryBreakdown.length === 0) return 1;
    return Math.max(...expenseCategoryBreakdown.map((c) => c.amount), 1);
  }, [expenseCategoryBreakdown]);

  return (
    <div className="space-y-6 print:p-0">
      {/* ==================================================== */}
      {/* 1. PRINT HEADER (VISIBLE ONLY ON PRINT) */}
      {/* ==================================================== */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Arus Kas, Biaya Operasional &amp; Rekonsiliasi Shift</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase text-slate-500">Periode</div>
          <div className="text-sm font-semibold text-slate-900">
            {reportPeriod.formattedStart} &mdash; {reportPeriod.formattedEnd}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. SCREEN EDITORIAL HEADER */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
            Analisis Keuangan &bull; {tenant.name}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-0.5">
            Keuangan &amp; Arus Kas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kas Masuk: <strong className="text-emerald-600 font-semibold">{formatRupiah(cashFlow.totalCashIn)}</strong> &bull;{" "}
            Kas Keluar: <strong className="text-rose-600 font-semibold">{formatRupiah(cashFlow.totalCashOut)}</strong> &bull;{" "}
            Arus Kas Bersih: <strong className={cn("font-semibold", cashFlow.netCashFlow >= 0 ? "text-[#0e59f9]" : "text-rose-600")}>{formatRupiah(cashFlow.netCashFlow)}</strong>
          </p>
        </div>

        {/* Action Group: Catat Biaya, Export Excel, Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#0e59f9] hover:bg-[#0c4cd4] text-white text-xs font-medium gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat Biaya Operasional</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 px-3 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Ekspor Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3 rounded-xl border-[#EAEFF8] text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Cetak
          </Button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. MODERN FILTER BAR (TABS + MODERN DATEPICKER POPOVER) */}
      {/* Identical standard to /reports, /reports/sales, /reports/operations */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-3 sm:p-3.5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
          {/* Left: Tabs + Contextual Modern Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pill Tabs for Mode */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
              <TabsList className="bg-slate-100 p-1 border border-slate-200/60 rounded-xl h-9">
                <TabsTrigger
                  value="harian"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-xs font-semibold px-3.5 rounded-lg transition-all h-7"
                >
                  Harian
                </TabsTrigger>
                <TabsTrigger
                  value="bulanan"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-xs font-semibold px-3.5 rounded-lg transition-all h-7"
                >
                  Bulanan
                </TabsTrigger>
                <TabsTrigger
                  value="tahunan"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-xs font-semibold px-3.5 rounded-lg transition-all h-7"
                >
                  Tahunan (Recap)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* HARIAN CONTROLS: Modern Date Range Popover */}
            {currentTab === "harian" && (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 text-xs font-medium gap-2 px-3 border-[#EAEFF8] text-slate-700 hover:bg-slate-50 transition-colors shadow-xs rounded-xl",
                      hasCustomDate && "border-blue-300 bg-blue-50/50 text-[#0e59f9] font-semibold"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{dateButtonLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-[#EAEFF8]" align="start">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-900">
                      Pilih Rentang Tanggal
                    </div>
                    {hasCustomDate && (
                      <button
                        type="button"
                        onClick={handleResetToToday}
                        className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors underline"
                      >
                        Reset ke Hari Ini
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    <Calendar
                      mode="range"
                      defaultMonth={tempRange?.from || customRange?.from || now}
                      selected={tempRange}
                      onSelect={setTempRange}
                      numberOfMonths={1}
                      locale={localeId}
                    />
                  </div>
                  <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                    <div className="text-[11px] text-slate-500">
                      {tempRange?.from ? (
                        <>
                          {format(tempRange.from, "d MMM", { locale: localeId })}
                          {tempRange.to ? ` - ${format(tempRange.to, "d MMM yyyy", { locale: localeId })}` : ""}
                        </>
                      ) : (
                        "Pilih rentang tanggal di kalender"
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCalendarOpen(false)}
                        className="h-8 text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyRange}
                        disabled={!tempRange?.from}
                        className="h-8 text-xs font-semibold bg-[#0e59f9] text-white hover:bg-blue-700 rounded-xl px-3"
                      >
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* BULANAN CONTROLS: Chevron Month Navigation + Modern Select */}
            {currentTab === "bulanan" && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-slate-600 border-[#EAEFF8] hover:bg-slate-50 rounded-xl"
                  onClick={() => handleMonthStep(-1)}
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Select value={monthParam} onValueChange={handleMonthSelect}>
                  <SelectTrigger className="h-9 w-[170px] text-xs font-medium border-[#EAEFF8] rounded-xl bg-white shadow-xs">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl border-[#EAEFF8]">
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-slate-600 border-[#EAEFF8] hover:bg-slate-50 rounded-xl"
                  onClick={() => handleMonthStep(1)}
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* TAHUNAN CONTROLS: Chevron Year Navigation + Modern Select */}
            {currentTab === "tahunan" && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-slate-600 border-[#EAEFF8] hover:bg-slate-50 rounded-xl"
                  onClick={() => handleYearStep(-1)}
                  title="Tahun Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Select value={yearParam} onValueChange={handleYearSelect}>
                  <SelectTrigger className="h-9 w-[120px] text-xs font-medium border-[#EAEFF8] rounded-xl bg-white shadow-xs">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent align="start" className="rounded-xl border-[#EAEFF8]">
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs cursor-pointer">
                        Tahun {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-slate-600 border-[#EAEFF8] hover:bg-slate-50 rounded-xl"
                  onClick={() => handleYearStep(1)}
                  title="Tahun Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Active Range Pill Display */}
            <span className="hidden lg:inline-flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              {reportPeriod.formattedStart} &mdash; {reportPeriod.formattedEnd}
            </span>
          </div>

          {/* Right: Refresh Button */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange(currentTab)}
              disabled={isLoading}
              className="h-9 px-3 rounded-xl border border-[#EAEFF8] text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5 text-slate-500", isLoading && "animate-spin")} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. ASYMMETRIC 3-CARD KPI ROW (NET FLOW, INFLOW, OUTFLOW) */}
      {/* 50% Hero Net Flow (Blue) + 25% Inflow + 25% Outflow */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Arus Kas Bersih (Net Flow) - Hero Blue Card (Takes 50% / Span 2) */}
        <div className="bg-[#0e59f9] text-white rounded-2xl p-5 sm:p-6 shadow-md shadow-blue-500/20 flex flex-col justify-between min-h-[220px] lg:col-span-2 relative overflow-hidden">
          {/* Top row: White box outline icon + Title on left, Synchronized Dropdown on right */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-[#0e59f9] fill-none" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-white/95 tracking-wide block">
                Arus Kas Bersih
              </span>
            </div>

            {/* Quick Synchronized Time Range Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-8 px-3 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                >
                  <span className="capitalize">{currentPeriodLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/80" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1.5 bg-white rounded-xl border border-[#EAEFF8] shadow-lg text-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Pilih Jangka Waktu
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const thisMonth = format(new Date(), "yyyy-MM");
                    handleMonthSelect(thisMonth);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left hover:bg-slate-50 transition-colors cursor-pointer",
                    currentTab === "bulanan" && monthParam === format(new Date(), "yyyy-MM") && "bg-blue-50/60 text-[#0e59f9] font-medium"
                  )}
                >
                  <span>Bulan Ini ({format(new Date(), "MMM yyyy", { locale: localeId })})</span>
                  {currentTab === "bulanan" && monthParam === format(new Date(), "yyyy-MM") && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
                    handleMonthSelect(lastMonth);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left hover:bg-slate-50 transition-colors cursor-pointer",
                    currentTab === "bulanan" && monthParam === format(subMonths(new Date(), 1), "yyyy-MM") && "bg-blue-50/60 text-[#0e59f9] font-medium"
                  )}
                >
                  <span>Bulan Lalu ({format(subMonths(new Date(), 1), "MMM yyyy", { locale: localeId })})</span>
                  {currentTab === "bulanan" && monthParam === format(subMonths(new Date(), 1), "yyyy-MM") && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleYearSelect(String(new Date().getFullYear()));
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left hover:bg-slate-50 transition-colors cursor-pointer",
                    currentTab === "tahunan" && yearParam === String(new Date().getFullYear()) && "bg-blue-50/60 text-[#0e59f9] font-medium"
                  )}
                >
                  <span>Tahun Ini ({new Date().getFullYear()})</span>
                  {currentTab === "tahunan" && yearParam === String(new Date().getFullYear()) && <Check className="w-3.5 h-3.5 text-[#0e59f9]" />}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                >
                  <span>Pilih Rentang Tanggal...</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Middle row: Big nominal with privacy toggle + surplus conclusion on left, Sparkline on right */}
          <div className="mt-6 mb-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="text-3xl sm:text-4xl font-semibold text-white tracking-tight whitespace-nowrap">
                  {isBalanceHidden ? "Rp ••••••••••" : formatKpiCurrency(cashFlow.netCashFlow)}
                </div>
                <button
                  type="button"
                  onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                  className="text-white/70 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
                  title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
                >
                  {isBalanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Percentage Badge & Conclusion Text */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border",
                    cashFlow.netCashFlow >= 0
                      ? "bg-emerald-400/25 text-emerald-200 border-emerald-400/30"
                      : "bg-rose-400/25 text-rose-200 border-rose-400/30"
                  )}
                >
                  {cashFlow.netCashFlow >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-rose-300 rotate-180" />
                  )}
                  <span>
                    {cashFlow.totalCashIn > 0
                      ? `${Math.abs(Math.round((cashFlow.netCashFlow / cashFlow.totalCashIn) * 100))}%`
                      : "0%"}
                  </span>
                </span>
                <span className="text-xs text-white/90 font-medium">
                  {cashFlow.netCashFlow >= 0 ? "Surplus kas operasional toko" : "Defisit kas operasional toko"}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 pb-0.5">
              <MiniSparkline
                data={netFlowTrend}
                metricSeed={3}
                color="#ffffff"
              />
            </div>
          </div>

          {/* Bottom row: Action Buttons (No divider lines, clean flat placement) */}
          <div className="mt-7 flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setModalMode("INCOME");
                setAmount("");
                setDescription("");
                setIsModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl bg-white text-[#0e59f9] hover:bg-white/95 font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode("EXPENSE");
                setAmount("");
                setDescription("");
                setIsModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs inline-flex items-center gap-1.5 border border-white/20 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* KPI 2: Total Kas Masuk (Inflow) - White Card (Span 1) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm hover:border-[#d7e2f5] transition-all flex flex-col justify-between min-h-[220px] lg:col-span-1">
          {/* Top row: Icon + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider block">
              Total Kas Masuk (Inflow)
            </span>
          </div>

          {/* Middle: Nominal */}
          <div className="mt-4 mb-4">
            <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
              {formatKpiCurrency(cashFlow.totalCashIn)}
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              Realisasi kas masuk operasional
            </div>
          </div>

          {/* Bottom: Dual Sub-Metrics Split (Tunai vs Digital) */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                Kasir Tunai
              </span>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                {formatCompactRupiah(cashFlow.cashSalesTotal)}
              </div>
            </div>
            <div className="min-w-0 pl-2 border-l border-slate-100">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                QRIS &amp; Bank
              </span>
              <div className="text-sm font-semibold text-[#0e59f9] mt-0.5 truncate">
                {formatCompactRupiah(cashFlow.nonCashSalesTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Kas Keluar (Outflow) - White Card (Span 1) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm hover:border-[#d7e2f5] transition-all flex flex-col justify-between min-h-[220px] lg:col-span-1">
          {/* Top row: Icon + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider block">
              Total Kas Keluar (Outflow)
            </span>
          </div>

          {/* Middle: Nominal */}
          <div className="mt-4 mb-4">
            <div className="text-xl sm:text-2xl font-semibold text-rose-600 tracking-tight whitespace-nowrap">
              {formatKpiCurrency(cashFlow.totalCashOut)}
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              Beban operasional &amp; kas kecil
            </div>
          </div>

          {/* Bottom: Segmented Proportional Bar & Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Laci {cashOutflowPercent}%</span>
              <span>Bank {bankOutflowPercent}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${cashOutflowPercent}%` }}
                className="bg-rose-500 h-full transition-all duration-700"
              />
              <div
                style={{ width: `${bankOutflowPercent}%` }}
                className="bg-slate-400 h-full transition-all duration-700"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block flex-shrink-0" />
                <span>Laci: {formatCompactRupiah(cashExpensesTotal)}</span>
              </span>
              <span className="flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block flex-shrink-0" />
                <span>Bank: {formatCompactRupiah(bankExpensesTotal)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. HERO CASH FLOW CAPSULE BAR CHART (FULL WIDTH - 12 COLS) */}
      {/* Cash In vs Cash Out with Dome Arch Rounded Capsule Bars */}
      {/* ==================================================== */}
      <div
        ref={heroChartRef}
        className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
      >
        <div>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Tren Arus Kas (Cash In vs Cash Out)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pergerakan arus kas masuk, pengeluaran operasional, dan surplus berkala
              </p>
            </div>

            {/* Dynamic Flat Typography Indicator (No badge pill) */}
            <div className="text-xs self-start sm:self-auto">
              {activeHoverBucket ? (
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="font-semibold text-slate-900">{activeHoverBucket.label}</span>
                  <span className="text-slate-400">:</span>
                  <span className="font-semibold text-[#0e59f9]">{formatRupiah(activeHoverBucket.cashIn)}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="font-semibold text-rose-600">{formatRupiah(activeHoverBucket.cashOut)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0e59f9]" />
                    <span>Kas Masuk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Kas Keluar</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Area: Y-Axis + Dual Capsule Bars */}
          <div className="pt-6 flex items-stretch h-52 sm:h-60">
            {/* Y-Axis Column */}
            <div className="w-11 sm:w-12 flex-shrink-0 flex flex-col justify-between items-end pr-2.5 pb-6 select-none text-[10px] font-sans font-medium text-slate-400">
              {chartYTicks.map((tick, idx) => (
                <span key={idx} className="leading-none">{tick.label}</span>
              ))}
            </div>

            {/* Graphic Plot Area */}
            <div className="flex-1 relative pb-6">
              <div className="relative w-full h-full">
                {/* Horizontal Baseline Dotted Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {chartYTicks.map((tick, idx) => (
                    <div key={idx} className="w-full flex items-center">
                      <div
                        className={cn(
                          "w-full",
                          idx === chartYTicks.length - 1
                            ? "border-b border-slate-200"
                            : "border-b border-dashed border-slate-100"
                        )}
                      />
                    </div>
                  ))}
                </div>

                {/* Floating Tooltip directly above hovered bar pair */}
                {activeHoverBucket && chartHoveredIndex !== null && (
                  <div
                    className="absolute z-30 pointer-events-none top-0 transform -translate-x-1/2 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-xl whitespace-nowrap border border-slate-700/60 transition-all duration-75"
                    style={{
                      left: `${Math.max(12, Math.min(88, ((chartHoveredIndex + 0.5) / Math.max(1, chartBuckets.length)) * 100))}%`,
                    }}
                  >
                    <div className="font-semibold text-white">
                      {activeHoverBucket.label}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0e59f9]" />
                        <span>Masuk: {formatRupiah(activeHoverBucket.cashIn)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Keluar: {formatRupiah(activeHoverBucket.cashOut)}</span>
                      </div>
                      <div className="pt-0.5 border-t border-slate-700/60 font-medium">
                        Net: <span className={activeHoverBucket.netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {formatRupiah(activeHoverBucket.netFlow)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bars Row */}
                <div className="relative w-full h-full flex items-end justify-between px-0.5 sm:px-1 z-10 gap-1 sm:gap-2">
                  {chartBuckets.map((bucket, idx) => {
                    const isHovered = chartHoveredIndex === idx;
                    const inPercent = Math.min(100, Math.max(0, (bucket.cashIn / maxBucketValue) * 100));
                    const outPercent = Math.min(100, Math.max(0, (bucket.cashOut / maxBucketValue) * 100));

                    return (
                      <div
                        key={bucket.key}
                        onMouseEnter={() => setChartHoveredIndex(idx)}
                        onMouseLeave={() => setChartHoveredIndex(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group relative"
                      >
                        {/* Hover Accent Dot */}
                        {isHovered && (
                          <div className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-[#0e59f9] shadow-xs animate-pulse" />
                        )}

                        {/* Dual Bars: Cash In & Cash Out */}
                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                          {/* Cash In Bar (Blue) */}
                          <div
                            className={cn(
                              "rounded-t-full rounded-b-none transition-all duration-300",
                              barWidthStyle,
                              isHovered
                                ? "bg-[#0e59f9] shadow-[0_4px_14px_rgba(14,89,249,0.38)]"
                                : "bg-[#D8E8FE] hover:bg-[#BFDBFE]"
                            )}
                            style={{
                              height: isHeroAnimated ? `${Math.max(4, inPercent)}%` : "0%",
                              transition: "height 750ms cubic-bezier(0.23, 1, 0.32, 1)",
                              transitionDelay: `${Math.min(idx * 20, 260)}ms`,
                            }}
                          />

                          {/* Cash Out Bar (Rose) */}
                          <div
                            className={cn(
                              "rounded-t-full rounded-b-none transition-all duration-300",
                              barWidthStyle,
                              isHovered
                                ? "bg-[#f43f5e] shadow-[0_4px_14px_rgba(244,63,94,0.38)]"
                                : "bg-[#FECDD3] hover:bg-[#FDA4AF]"
                            )}
                            style={{
                              height: isHeroAnimated ? `${Math.max(4, outPercent)}%` : "0%",
                              transition: "height 750ms cubic-bezier(0.23, 1, 0.32, 1)",
                              transitionDelay: `${Math.min(idx * 20 + 30, 290)}ms`,
                            }}
                          />
                        </div>

                        {/* X-Axis Date/Time Label */}
                        <span
                          className={cn(
                            "absolute -bottom-5 text-[10px] font-sans truncate select-none transition-colors",
                            isHovered
                              ? "text-[#0e59f9] font-semibold"
                              : "text-slate-400 font-normal"
                          )}
                        >
                          {bucket.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. DUAL SECTION: LIKUIDITAS KAS & KOMPOSISI BEBAN */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column (6 Cols): Distribusi Saldo Likuiditas (Buku Kas) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  Distribusi Likuiditas Kas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alokasi saldo riil laci kasir vs rekening digital
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-900">
                  {formatRupiah(cashFlow.netCashFlow)}
                </span>
                <span className="text-[11px] text-slate-400 block">saldo bersih</span>
              </div>
            </div>

            {/* Proportional Segmented Bar */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Alokasi Saldo Riil:</span>
                <span className="font-semibold text-slate-700">
                  Laci {cashRatio}% &bull; Digital {digitalRatio}%
                </span>
              </div>

              <AnimatedSegmentedBar
                leftPercent={cashRatio}
                rightPercent={digitalRatio}
                leftColorClass="bg-amber-400"
                rightColorClass="bg-[#0e59f9]"
                leftTitle={`Kas Laci: ${cashRatio}%`}
                rightTitle={`Rekening Digital: ${digitalRatio}%`}
                heightClass="h-2.5"
              />

              {/* 2 Detail Columns: Kas Laci vs Rekening Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Channel 1: Kas Fisik Laci */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Kas Fisik Laci Toko</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700">Laci</span>
                  </div>
                  <div className="text-base font-semibold text-slate-900 font-sans">
                    {formatRupiah(cashFlow.drawerNetFlow)}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Penjualan Tunai:</span>
                      <span className="font-medium text-emerald-600">+{formatCompactRupiah(cashFlow.cashSalesTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pengeluaran Laci:</span>
                      <span className="font-medium text-rose-600">-{formatCompactRupiah(cashFlow.cashExpenses + cashFlow.manualCashOut)}</span>
                    </div>
                  </div>
                </div>

                {/* Channel 2: Rekening Digital & Bank */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#0e59f9]" />
                      <span>Rekening Digital &amp; Bank</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#0e59f9]">QRIS &amp; Bank</span>
                  </div>
                  <div className="text-base font-semibold text-[#0e59f9] font-sans">
                    {formatRupiah(cashFlow.digitalNetFlow)}
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Pencairan Bersih:</span>
                      <span className="font-medium text-emerald-600">+{formatCompactRupiah(cashFlow.nonCashSalesTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Transfer:</span>
                      <span className="font-medium text-rose-600">-{formatCompactRupiah(cashFlow.nonCashExpenses)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kas Masuk: <strong className="font-medium text-emerald-600">{formatRupiah(cashFlow.totalCashIn)}</strong></span>
            <span>Kas Keluar: <strong className="font-medium text-rose-600">{formatRupiah(cashFlow.totalCashOut)}</strong></span>
          </div>
        </div>

        {/* Right Column (6 Cols): Komposisi Beban Operasional per Kategori */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  Komposisi Biaya Operasional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Porsi pengeluaran berdasarkan pos anggaran
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-900">
                  {formatRupiah(profitability.totalExpenses)}
                </span>
                <span className="text-[11px] text-slate-400 block">total biaya</span>
              </div>
            </div>

            {/* Categories List with AnimatedHorizontalBars */}
            <div className="pt-3 space-y-3">
              {expenseCategoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada catatan pengeluaran pada rentang waktu ini.
                </div>
              ) : (
                expenseCategoryBreakdown.map((item, idx) => {
                  const percentOfTop = Math.max(5, Math.round((item.amount / maxExpenseCategory) * 100));

                  return (
                    <div key={item.category} className="space-y-1 group">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">
                          {item.category}
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900 font-sans">
                            {formatRupiah(item.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({item.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <AnimatedHorizontalBar
                        widthPercent={percentOfTop}
                        colorClass="bg-[#0e59f9]"
                        trackClass="bg-slate-100"
                        heightClass="h-1.5"
                        delayMs={idx * 45}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Transparent Profitability Disclaimer Box */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-blue-900">
            <AlertCircle className="h-4 w-4 text-[#0e59f9] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Ketentuan Laba Kotor:</strong> Berdasarkan HPP modal resep yang terjual, belum mencakup biaya sewa tahunan &amp; penyusutan aset.
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. EXPENSES HISTORY TABLE (100% FONT-SANS) */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#0e59f9]" />
              Catatan Pengeluaran Operasional ({expenses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pengeluaran kas kecil toko dan biaya operasional selama periode laporan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Total Biaya: <strong className="text-slate-900 font-semibold">{formatRupiah(profitability.totalExpenses)}</strong>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer print:hidden font-medium rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Biaya</span>
            </Button>
          </div>
        </div>

        <Table className="w-full text-xs text-left">
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-transparent hover:bg-transparent">
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Tanggal</TableHead>
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Kategori</TableHead>
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Deskripsi Pengeluaran</TableHead>
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Sumber Bayar</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-500 font-medium">Nominal</TableHead>
              <TableHead className="py-3 px-4 text-center print:hidden w-16 text-slate-500 font-medium">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 font-sans">
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                  <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-60" />
                  Belum ada catatan pengeluaran operasional pada periode ini.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(exp.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#0e59f9] font-semibold border border-blue-100">
                      {exp.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-slate-900">
                    {exp.description}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-medium border",
                      exp.paymentMethod === "TUNAI" || exp.paymentMethod === "CASH"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                      {exp.paymentMethod === "TUNAI" || exp.paymentMethod === "CASH" ? "Kasir Tunai" : exp.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-semibold text-rose-600 font-sans">
                    {formatRupiah(exp.amount)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ==================================================== */}
      {/* 8. CASHIER SHIFT RECONCILIATION TABLE (100% FONT-SANS) */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0e59f9]" />
              Rekonsiliasi Shift &amp; Uang Laci Kasir (Cash Drawer Reconciliation)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit perbandingan antara uang sistem dan uang fisik aktual saat kasir tutup shift
            </p>
          </div>
        </div>

        <Table className="w-full text-xs text-left">
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-transparent hover:bg-transparent">
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Shift &amp; Kasir</TableHead>
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Status</TableHead>
              <TableHead className="py-3 px-4 text-slate-500 font-medium">Waktu Buka / Tutup</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-500 font-medium">Modal Awal</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-500 font-medium">Diharapkan (Sistem)</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-500 font-medium">Aktual Laci</TableHead>
              <TableHead className="py-3 px-4 text-right text-slate-500 font-medium">Selisih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 font-sans">
            {shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-60" />
                  Belum ada riwayat shift kasir pada periode ini.
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((s) => {
                const diff = parseFloat(s.cashDifference || "0");
                const cashier = (s as any).cashierName || "Kasir";
                return (
                  <TableRow key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-sans text-xs">
                        #{s.id.slice(0, 8)}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>{cashier}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                          s.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {s.status === "ACTIVE" ? "AKTIF" : "SELESAI"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>Mulai: {new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                      {s.endTime && (
                        <div className="text-slate-400">
                          Tutup: {new Date(s.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-sans">
                      {formatRupiah(s.startingCash)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-sans">
                      {formatRupiah(s.expectedCash)}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-sans font-semibold text-slate-900">
                      {s.actualCash ? formatRupiah(s.actualCash) : "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-sans font-semibold">
                      {s.status === "ACTIVE" ? (
                        <span className="text-slate-400 font-normal">Shift berjalan</span>
                      ) : diff === 0 ? (
                        <span className="text-emerald-600">Pas (Rp 0)</span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-700">+{formatRupiah(diff)}</span>
                      ) : (
                        <span className="text-rose-600">-{formatRupiah(Math.abs(diff))}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ==================================================== */}
      {/* 9. MODAL: CATAT TRANSAKSI KAS (PEMASUKAN / PENGELUARAN) */}
      {/* ==================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {modalMode === "INCOME" ? "Catat Pemasukan Kas Toko" : "Catat Pengeluaran Biaya Outlet"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {modalMode === "INCOME"
                ? "Pemasukan kas tunai akan otomatis dicatat ke shift kasir yang sedang aktif."
                : "Pengeluaran tunai akan otomatis tercatat ke laci kasir jika shift kasir sedang aktif."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {modalMode === "EXPENSE" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Kategori Biaya</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e59f9]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                {modalMode === "INCOME" ? "Nominal Pemasukan (Rp)" : "Nominal Pengeluaran (Rp)"}
              </Label>
              <Input
                type="number"
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={1}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {modalMode === "EXPENSE" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Sumber Pembayaran</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["TUNAI", "BANK_TRANSFER", "EWALLET"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                        paymentMethod === method
                          ? "bg-[#0e59f9] text-white border-[#0e59f9] shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {method === "TUNAI" ? "Kasir Tunai" : method === "BANK_TRANSFER" ? "Transfer Bank" : "E-Wallet"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                {modalMode === "INCOME" ? "Keterangan Pemasukan" : "Deskripsi / Keperluan"}
              </Label>
              <Input
                placeholder={
                  modalMode === "INCOME"
                    ? "Contoh: Tambahan modal kembalian / Uang kas masuk"
                    : "Contoh: Belanja es batu & kantong kresek"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {modalMode === "EXPENSE" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Tanggal Pengeluaran</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 text-xs font-medium cursor-pointer rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 text-xs font-semibold bg-[#0e59f9] hover:bg-[#0c4cd4] text-white cursor-pointer rounded-xl"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : modalMode === "INCOME"
                  ? "Simpan Pemasukan"
                  : "Simpan Pengeluaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

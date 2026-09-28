"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Store,
  Smartphone,
  UtensilsCrossed,
  Trophy,
  AlertTriangle,
  PieChart as PieChartIcon,
  Tag,
  CreditCard,
  Clock,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";
import { format, subMonths, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
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

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Dynamic Trendline Sparkline for Top KPI Cards
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
  const width = 76;
  const height = 40;
  const padX = 2;
  const midY = height / 2;

  const gradId = React.useId().replace(/:/g, "_");
  const positive = isPositive !== undefined ? isPositive : (percentage ?? 0) >= 0;
  const strokeColor = color || (positive ? "#10b981" : "#f43f5e");

  const { lineD, areaD, lastPoint } = React.useMemo(() => {
    const numPoints = 32;
    const pts: { x: number; y: number }[] = [];

    if (percentage !== undefined) {
      const absP = Math.abs(percentage);
      const isUp = percentage >= 0;

      const ratio = Math.min(absP / 50, 1.0);
      const maxClimb = 33;
      const actualClimb = ratio * maxClimb;

      const yStart = isUp ? midY + actualClimb * 0.47 : midY - actualClimb * 0.47;
      const yEnd = isUp ? midY - actualClimb * 0.53 : midY + actualClimb * 0.53;

      const phase = (metricSeed * 0.43) % 1;

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const x = padX + t * (width - 2 * padX);
        const linearY = yStart + (yEnd - yStart) * t;

        const oct1 = Math.sin((t * 4.3 + phase * 2.1) * Math.PI * 2) * 2.3;
        const oct2 = Math.cos((t * 8.7 + phase * 4.3) * Math.PI * 2) * 1.5;
        const oct3 = Math.sin((t * 13.1 + phase * 1.7) * Math.PI * 2) * 0.8;
        const drift = Math.sin((t * 2.1 + phase) * Math.PI * 2) * 0.9;
        const rawNoise = oct1 + oct2 + oct3 + drift;

        const windowFactor = Math.pow(Math.sin(t * Math.PI), 0.65);
        const wave = rawNoise * windowFactor;

        const y = Math.max(2.0, Math.min(height - 2.5, linearY + wave));
        pts.push({ x, y });
      }
    } else if (data && data.length >= 2) {
      const max = Math.max(...data, 1);
      const min = Math.min(...data, 0);
      const range = max - min || 1;

      data.forEach((val, idx) => {
        const x = padX + (idx / (data.length - 1)) * (width - 2 * padX);
        const y = height - 4 - ((val - min) / range) * (height - 8);
        pts.push({ x, y });
      });
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
    <svg width={width} height={height} className="overflow-visible flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

/**
 * Modern SVG Doughnut Chart for Payment Methods
 * Displays slices with smooth separation, center headline (% Cashless or Total Orders),
 * and interactive hover highlighting.
 */
// Curated all-blue shades for doughnut chart slices ("warna biru biru")
const BLUE_DOUGHNUT_SHADES = [
  "#0e59f9", // Menuin Royal Blue (Primary / QRIS)
  "#38bdf8", // Biru Muda / Sky Blue (Secondary / Tunai)
  "#083cb0", // Deep Navy Blue (Tertiary / Online Gateway)
  "#60a5fa", // Soft Medium Blue (Quaternary / Debit EDC)
  "#93c5fd", // Light Ice Blue
  "#1d4ed8", // Classic Blue
];

/**
 * Standardized color resolver for payment methods in doughnut chart and legends
 * Online Gateway is prioritised to receive Deep Navy Blue (#083cb0) before QRIS
 */
function getPaymentMethodColor(method: string, tenderType?: string, index: number = 0): string {
  const m = (method || "").toLowerCase();
  const t = (tenderType || "").toUpperCase();

  // 1. Online Gateway / Midtrans (Deep Navy Blue - prominent & distinct from direct QRIS)
  if (m.includes("gateway") || m.includes("online") || m.includes("midtrans") || t === "GATEWAY" || t === "MIDTRANS") {
    return "#083cb0";
  }
  // 2. Direct QRIS (Menuin Royal Blue)
  if (t === "QRIS" || m.includes("qris")) {
    return "#0e59f9";
  }
  // 3. Tunai / Cash (Sky Blue)
  if (t === "CASH" || m.includes("tunai") || m.includes("cash")) {
    return "#38bdf8";
  }
  // 4. Transfer Bank (Classic Deep Blue)
  if (t === "TRANSFER" || m.includes("transfer")) {
    return "#1d4ed8";
  }
  // 5. EDC / Card (Soft Medium Blue)
  if (t === "CARD" || m.includes("edc") || m.includes("debit") || m.includes("kartu")) {
    return "#60a5fa";
  }
  return BLUE_DOUGHNUT_SHADES[index % BLUE_DOUGHNUT_SHADES.length];
}

function PaymentDoughnutChart({
  methods,
  viewMode,
  totalCollected,
  totalOrders,
  cashlessRevenuePercent,
  cashlessOrdersPercent,
  cashlessRevenue,
  cashlessOrders,
}: {
  methods: Array<{
    method: string;
    tenderType: string;
    count: number;
    total: number;
    percentageRevenue?: number;
    percentageOrders?: number;
    percentage?: number;
  }>;
  viewMode: "revenue" | "orders";
  totalCollected: number;
  totalOrders: number;
  cashlessRevenuePercent: number;
  cashlessOrdersPercent: number;
  cashlessRevenue: number;
  cashlessOrders: number;
}) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const activeMethods = React.useMemo(() => {
    return methods.filter((m) => (viewMode === "revenue" ? m.total > 0 : m.count > 0));
  }, [methods, viewMode]);

  const totalValue = React.useMemo(() => {
    return viewMode === "revenue" ? totalCollected : totalOrders;
  }, [viewMode, totalCollected, totalOrders]);

  // Slender, elegant doughnut ring geometry matching Image 1:
  // Center (96, 96), Radius 72, StrokeWidth 14. Inner diameter = 130px for spacious center text.
  const radius = 72;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Crisp radial separator gap between slices (Image 1 style with butt stroke caps)
  const gap = activeMethods.length > 1 ? 4.5 : 0;
  // Minimum visible arc length so even tiny slices like Online Gateway (0.5%) are clearly visible ("atleast terlihat sekecil apapun")
  const minSliceLen = activeMethods.length > 1 ? 22 : 0;

  // Compute balanced slice lengths ensuring all active methods have a visible arc
  const sliceLengths = React.useMemo(() => {
    if (activeMethods.length === 0) return [];
    if (activeMethods.length === 1) return [circumference];

    const rawLengths = activeMethods.map((m) => {
      const rawVal = viewMode === "revenue" ? m.total : m.count;
      const pct = totalValue > 0 ? rawVal / totalValue : 0;
      return pct * circumference;
    });

    let neededBoost = 0;
    let largeTotal = 0;
    rawLengths.forEach((len) => {
      if (len > 0 && len < minSliceLen) {
        neededBoost += minSliceLen - len;
      } else if (len >= minSliceLen) {
        largeTotal += len;
      }
    });

    if (neededBoost === 0 || largeTotal === 0) return rawLengths;

    return rawLengths.map((len) => {
      if (len <= 0) return 0;
      if (len < minSliceLen) return minSliceLen;
      const ratio = len / largeTotal;
      return Math.max(minSliceLen, len - neededBoost * ratio);
    });
  }, [activeMethods, viewMode, totalValue, circumference, minSliceLen]);

  let currentOffset = 0;
  const slices = activeMethods.map((m, idx) => {
    const rawVal = viewMode === "revenue" ? m.total : m.count;
    const pct = totalValue > 0 ? (rawVal / totalValue) * 100 : 0;
    const sliceLen = sliceLengths[idx] ?? ((pct / 100) * circumference);
    const strokeLen = Math.max(0, sliceLen - gap);
    const strokeOffset = currentOffset + (gap > 0 ? gap / 2 : 0);
    currentOffset += sliceLen;

    const color = getPaymentMethodColor(m.method, m.tenderType, idx);

    return {
      ...m,
      pct,
      strokeLen,
      strokeOffset,
      color,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90 overflow-visible">
          {/* Subtle background track */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Dynamic Arc Slices with Image 1 style flat/butt separators */}
          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <circle
                key={slice.method}
                cx="96"
                cy="96"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={`${slice.strokeLen} ${circumference - slice.strokeLen}`}
                strokeDashoffset={-slice.strokeOffset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Metric Text - Faithful to Image 1 Layout & Bold Editorial Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {hoveredIndex !== null && slices[hoveredIndex] ? (
            <>
              <span className="text-xs font-medium text-slate-400 truncate max-w-[124px]">
                {slices[hoveredIndex].method}
              </span>
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-0.5 font-sans">
                {slices[hoveredIndex].pct.toFixed(1)}%
              </span>
              <span className="text-[11px] font-medium text-[#0e59f9] mt-0.5 truncate max-w-[124px]">
                {viewMode === "revenue"
                  ? formatCompactRupiah(slices[hoveredIndex].total)
                  : `${slices[hoveredIndex].count} Order`}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-400 tracking-tight">
                {viewMode === "revenue" ? "Non-Tunai (Digital)" : "Preferensi Digital"}
              </span>
              <span className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-0.5 font-sans">
                {viewMode === "revenue"
                  ? `${cashlessRevenuePercent.toFixed(1)}%`
                  : `${cashlessOrdersPercent.toFixed(1)}%`}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                {viewMode === "revenue"
                  ? `${formatCompactRupiah(cashlessRevenue)} omzet`
                  : `${cashlessOrders} order`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SalesReportClient({ initialData, outletKey }: SalesReportClientProps) {
  const [data, setData] = React.useState<SalesReportData>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  // Filter Tabs: "harian" | "bulanan" | "tahunan"
  const [currentTab, setCurrentTab] = React.useState<"harian" | "bulanan" | "tahunan">(() => {
    if (initialData.period.type === "daily" || initialData.period.type === "today") return "harian";
    if (initialData.period.type === "yearly" || initialData.period.type === "this_year") return "tahunan";
    return "bulanan";
  });

  // Date Range Popover States
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(undefined);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Month navigation: format "YYYY-MM"
  const now = React.useMemo(() => new Date(), []);
  const todayDateStr = React.useMemo(() => format(now, "yyyy-MM-dd"), [now]);
  const [monthParam, setMonthParam] = React.useState(() => format(now, "yyyy-MM"));

  // Year navigation: "YYYY"
  const [yearParam, setYearParam] = React.useState(() => String(now.getFullYear()));

  // Active chart metric ("sales" or "orders") - User chose Option A: Rounded Capsule Bar Chart
  const [chartMetric, setChartMetric] = React.useState<"sales" | "orders">("sales");
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState<number | null>(null);

  // Dual-perspective state switchers
  const [topMenuMetric, setTopMenuMetric] = React.useState<"revenue" | "qty">("revenue");
  const [evalMenuMetric, setEvalMenuMetric] = React.useState<"revenue" | "qty">("revenue");
  const [categoryMetric, setCategoryMetric] = React.useState<"revenue" | "qty">("revenue");
  const [paymentViewMode, setPaymentViewMode] = React.useState<"revenue" | "orders">("revenue");
  const [channelViewMode, setChannelViewMode] = React.useState<"revenue" | "orders">("revenue");
  const [daypartViewMode, setDaypartViewMode] = React.useState<"revenue" | "orders">("revenue");

  // Month select options (last 12 months)
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

  // Year select options
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const loadData = async (
    targetPeriod: ReportPeriod,
    optStart?: string,
    optEnd?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await getSalesReport(outletKey, {
        period: targetPeriod,
        startDate: optStart,
        endDate: optEnd,
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

  // Switch Tab Handler
  const handleTabChange = (newTab: string) => {
    const tab = newTab as "harian" | "bulanan" | "tahunan";
    setCurrentTab(tab);

    if (tab === "harian") {
      setCustomRange(undefined);
      loadData("daily", todayDateStr, todayDateStr);
    } else if (tab === "bulanan") {
      const [y, m] = monthParam.split("-").map(Number);
      const firstDay = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
      const lastDay = format(new Date(y, m, 0), "yyyy-MM-dd");
      loadData("monthly", firstDay, lastDay);
    } else if (tab === "tahunan") {
      const y = parseInt(yearParam, 10);
      loadData("yearly", `${y}-01-01`, `${y}-12-31`);
    }
  };

  // Month Navigation Handlers
  const handleMonthStep = (step: number) => {
    const [y, m] = monthParam.split("-").map(Number);
    const curDate = new Date(y, m - 1, 1);
    const targetDate = step > 0 ? addMonths(curDate, step) : subMonths(curDate, Math.abs(step));
    const nextMonthStr = format(targetDate, "yyyy-MM");
    setMonthParam(nextMonthStr);

    const firstDay = format(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1), "yyyy-MM-dd");
    const lastDay = format(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0), "yyyy-MM-dd");
    loadData("monthly", firstDay, lastDay);
  };

  const handleMonthSelect = (selectedMonth: string) => {
    setMonthParam(selectedMonth);
    const [y, m] = selectedMonth.split("-").map(Number);
    const firstDay = format(new Date(y, m - 1, 1), "yyyy-MM-dd");
    const lastDay = format(new Date(y, m, 0), "yyyy-MM-dd");
    loadData("monthly", firstDay, lastDay);
  };

  // Year Navigation Handlers
  const handleYearStep = (step: number) => {
    const curYear = parseInt(yearParam, 10);
    const nextYear = curYear + step;
    setYearParam(String(nextYear));
    loadData("yearly", `${nextYear}-01-01`, `${nextYear}-12-31`);
  };

  const handleYearSelect = (selectedYear: string) => {
    setYearParam(selectedYear);
    loadData("yearly", `${selectedYear}-01-01`, `${selectedYear}-12-31`);
  };

  // Range Popover Handlers (Harian)
  const handleApplyRange = () => {
    if (!tempRange?.from) return;
    const toDate = tempRange.to || tempRange.from;
    setCustomRange({ from: tempRange.from, to: toDate });
    setIsCalendarOpen(false);

    const fromStr = format(tempRange.from, "yyyy-MM-dd");
    const toStr = format(toDate, "yyyy-MM-dd");
    if (fromStr === toStr) {
      loadData("daily", fromStr, toStr);
    } else {
      loadData("custom", fromStr, toStr);
    }
  };

  const handleResetToToday = () => {
    setCustomRange(undefined);
    setTempRange(undefined);
    setIsCalendarOpen(false);
    loadData("daily", todayDateStr, todayDateStr);
  };

  const hasCustomDate = React.useMemo(() => {
    if (!customRange?.from || !customRange?.to) return false;
    const fromStr = format(customRange.from, "yyyy-MM-dd");
    const toStr = format(customRange.to, "yyyy-MM-dd");
    return !(fromStr === todayDateStr && toStr === todayDateStr);
  }, [customRange, todayDateStr]);

  const dateButtonLabel = React.useMemo(() => {
    if (!customRange?.from) return "Pilih Tanggal";
    const from = format(customRange.from, "d MMM yyyy", { locale: localeId });
    if (!customRange.to || format(customRange.from, "yyyy-MM-dd") === format(customRange.to, "yyyy-MM-dd")) {
      return from;
    }
    const to = format(customRange.to, "d MMM yyyy", { locale: localeId });
    return `${from} - ${to}`;
  }, [customRange]);

  // ==========================================
  // PROFESSIONAL MULTI-SHEET EXCEL EXPORT
  // ==========================================
  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Ringkasan Penjualan
      const summaryRows = [
        { Indikator: "Nama Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode Laporan", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Tanggal Diunduh", Nilai: new Date().toLocaleString("id-ID") },
        { Indikator: "", Nilai: "" },
        { Indikator: "Penjualan Bersih (Net Sales)", Nilai: Math.round(data.kpis.netSales) },
        { Indikator: "Pertumbuhan Penjualan (%)", Nilai: `${data.kpis.netSalesGrowth.toFixed(1)}%` },
        { Indikator: "Total Pesanan (Total Orders)", Nilai: data.kpis.totalOrders },
        { Indikator: "Rata-rata Order (AOV)", Nilai: Math.round(data.kpis.aov) },
        { Indikator: "Total Menu Terjual (Qty)", Nilai: data.kpis.totalItemsSold || 0 },
        { Indikator: "Penjualan Kotor (Gross Sales)", Nilai: Math.round(data.kpis.grossSales) },
        { Indikator: "Total Potongan (Diskon & MDR)", Nilai: Math.round(data.kpis.totalDeductions) },
        { Indikator: "Estimasi Laba Kotor (Gross Profit)", Nilai: Math.round(data.kpis.grossProfit) },
        { Indikator: "Gross Profit Margin (%)", Nilai: `${data.kpis.grossProfitMargin.toFixed(1)}%` },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 40 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Penjualan");

      // Sheet 2: Tren Penjualan Harian/Jam
      const trendRows = data.chartData.map((d) => ({
        "Waktu / Tanggal": d.date,
        Label: d.label,
        "Penjualan Bersih (Rp)": Math.round(d.netSales),
        "Penjualan Kotor (Rp)": Math.round(d.grossSales || d.netSales),
        "Diskon (Rp)": Math.round(d.discount || 0),
        "Total Pesanan": d.orders,
        "Rata-rata Keranjang (AOV)": d.orders > 0 ? Math.round(d.netSales / d.orders) : 0,
      }));
      const trendSheet = XLSX.utils.json_to_sheet(trendRows);
      trendSheet["!cols"] = [{ wch: 18 }, { wch: 15 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 15 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(workbook, trendSheet, "Tren Penjualan");

      // Sheet 3: Menu Terlaris & Kurang Laku
      const bestRows = (data.topProducts || []).map((p, idx) => ({
        Status: "Terlaris (Top Selling)",
        Peringkat: idx + 1,
        "Nama Menu": p.name,
        Kategori: p.categoryName,
        "Jumlah Terjual (Qty)": p.totalQty,
        "Harga Satuan (Rp)": Math.round(p.price),
        "Total Omzet (Rp)": Math.round(p.totalRevenue),
      }));
      const worstRows = (data.bottomProducts || []).map((p, idx) => ({
        Status: "Perlu Evaluasi (Kurang Laku)",
        Peringkat: idx + 1,
        "Nama Menu": p.name,
        Kategori: p.categoryName,
        "Jumlah Terjual (Qty)": p.totalQty,
        "Harga Satuan (Rp)": Math.round(p.price),
        "Total Omzet (Rp)": Math.round(p.totalRevenue),
      }));
      const productSheet = XLSX.utils.json_to_sheet([...bestRows, ...worstRows]);
      productSheet["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, productSheet, "Performa Menu");

      // Sheet 4: Kategori & Kanal
      const categoryRows = (data.topCategories || []).map((cat) => ({
        Kategori: cat.name,
        "Porsi Terjual (Qty)": cat.totalQty,
        "Total Omzet (Rp)": Math.round(cat.totalRevenue),
        "Kontribusi Omzet (%)": `${cat.percentage.toFixed(1)}%`,
      }));
      const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
      categorySheet["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(workbook, categorySheet, "Kategori Menu");

      const safePeriodLabel = data.period.formattedStart.replace(/[\/\s]/g, "-");
      const fileName = `Laporan_Penjualan_${data.tenant.name.replace(/\s+/g, "_")}_${safePeriodLabel}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel laporan penjualan berhasil diunduh.");
    } catch (e: any) {
      console.error("Export error:", e);
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    kpis,
    chartData,
    channelMetrics,
    topProducts,
    bottomProducts,
    topCategories,
    paymentMethods,
    paymentAnalytics,
    channels,
    orderTypes,
    dayparting,
    lossPrevention,
    period: reportPeriod,
    tenant,
  } = data;

  const sortedCategories = React.useMemo(() => {
    if (!topCategories) return [];
    return [...topCategories].sort((a, b) =>
      categoryMetric === "revenue"
        ? b.totalRevenue - a.totalRevenue
        : b.totalQty - a.totalQty
    );
  }, [topCategories, categoryMetric]);

  const sortedTopProducts = React.useMemo(() => {
    if (!topProducts) return [];
    return [...topProducts]
      .sort((a, b) =>
        topMenuMetric === "revenue"
          ? b.totalRevenue - a.totalRevenue || b.totalQty - a.totalQty
          : b.totalQty - a.totalQty || b.totalRevenue - a.totalRevenue
      )
      .slice(0, 5);
  }, [topProducts, topMenuMetric]);

  const sortedBottomProducts = React.useMemo(() => {
    if (!bottomProducts) return [];
    return [...bottomProducts]
      .sort((a, b) =>
        evalMenuMetric === "revenue"
          ? a.totalRevenue - b.totalRevenue || a.totalQty - b.totalQty
          : a.totalQty - b.totalQty || a.totalRevenue - b.totalRevenue
      )
      .slice(0, 5);
  }, [bottomProducts, evalMenuMetric]);

  // Total sales baseline for proportional bar calculation ("presentasi dari seluruh penjualan")
  const totalSalesRevenue = React.useMemo(() => {
    return kpis.grossSales > 0 ? kpis.grossSales : (kpis.netSales > 0 ? kpis.netSales : 1);
  }, [kpis.grossSales, kpis.netSales]);

  const totalSalesQty = React.useMemo(() => {
    return kpis.totalItemsSold > 0 ? kpis.totalItemsSold : 1;
  }, [kpis.totalItemsSold]);

  // Chart Computations: Max value for Y-Axis and Capsule Bars scaling (Option A: Rounded Capsule Bar Chart)
  const maxPointSales = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => (chartMetric === "sales" ? d.netSales : d.orders)), 0);
  }, [chartData, chartMetric]);

  const yTicks = React.useMemo(() => {
    const max = maxPointSales > 0 ? maxPointSales : (chartMetric === "sales" ? 1000000 : 10);
    const count = 5;
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const ratio = (count - 1 - i) / (count - 1);
      const val = max * ratio;
      ticks.push({
        ratio,
        val,
        label: chartMetric === "sales" ? formatCompactRupiah(val) : Math.round(val).toString(),
      });
    }
    return ticks;
  }, [maxPointSales, chartMetric]);

  const dynamicBarWidth = React.useMemo(() => {
    const n = chartData.length;
    if (n <= 7) return 32;
    if (n <= 12) return 24;
    if (n <= 16) return 18;
    if (n <= 24) return 13;
    if (n <= 31) return 10;
    return 7;
  }, [chartData.length]);

  const barData = React.useMemo(() => {
    const items = chartData;
    const n = items.length;
    if (n === 0) return [];
    const max = maxPointSales > 0 ? maxPointSales : 1;

    return items.map((item, idx) => {
      const val = chartMetric === "sales" ? Math.max(0, item.netSales) : Math.max(0, item.orders);
      const isZero = val <= 0;
      const heightPercent = isZero ? 3.5 : Math.max(6, Math.min(94, Math.round((val / max) * 94)));

      let dayLabel = item.label || "";
      if (item.date && item.date.includes("-") && n > 10) {
        const parts = item.date.split("-");
        if (parts.length === 3) {
          dayLabel = parseInt(parts[2], 10).toString();
        }
      }

      return {
        ...item,
        idx,
        val,
        isZero,
        heightPercent,
        dayLabel,
      };
    });
  }, [chartData, maxPointSales, chartMetric]);

  const activeHoverBar = hoveredPointIndex !== null && barData[hoveredPointIndex]
    ? barData[hoveredPointIndex]
    : null;

  // Formatted date string for editorial header
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).toUpperCase();

  // Top Menu Rank Color Theme Palette (Heatmap ramp: Dark Blue down to Gray - matching Ringkasan Eksekutif)
  const RANK_THEMES = [
    { bar: "bg-[#083cb0]", badge: "bg-[#083cb0] text-white" },       // Rank 1: Deep Navy Blue
    { bar: "bg-[#0e59f9]", badge: "bg-[#0e59f9] text-white" },       // Rank 2: Menuin Royal Blue
    { bar: "bg-[#3b82f6]", badge: "bg-blue-100 text-blue-800" },     // Rank 3: Medium Blue
    { bar: "bg-[#93c5fd]", badge: "bg-slate-100 text-slate-700" },   // Rank 4: Soft Sky Blue
    { bar: "bg-[#cbd5e1]", badge: "bg-slate-100 text-slate-500" },   // Rank 5: Subtle Gray
  ];

  // Evaluation Menu Rank Themes: blue ramp inverted so bottom-most item is the most blue ("paling bawah paling biru")
  const EVALUATION_BLUE_THEMES = [
    { bar: "bg-slate-200", badge: "bg-slate-100 text-slate-600 border-slate-200" },     // Rank 1: Subtle Gray / Soft
    { bar: "bg-[#93c5fd]", badge: "bg-blue-50 text-blue-700 border-blue-200" },         // Rank 2: Soft Sky Blue
    { bar: "bg-[#3b82f6]", badge: "bg-blue-100 text-[#0e59f9] border-blue-300" },       // Rank 3: Medium Blue
    { bar: "bg-[#0e59f9]", badge: "bg-[#0e59f9] text-white border-[#0e59f9]" },         // Rank 4: Menuin Royal Blue
    { bar: "bg-[#083cb0]", badge: "bg-[#083cb0] text-white border-[#083cb0]" },         // Rank 5 (paling bawah): Deep Navy Blue (Paling Biru!)
  ];

  // Color palette for Top Categories (Strictly curated monochromatic blue ramp matching Menu Terlaris)
  const categoryColors = [
    "#083cb0", // Rank 1: Deep Navy Blue
    "#0e59f9", // Rank 2: Menuin Royal Blue
    "#3b82f6", // Rank 3: Medium Blue
    "#60a5fa", // Rank 4: Soft Medium Blue
    "#93c5fd", // Rank 5: Light Sky Blue
    "#cbd5e1", // Rank 6: Subtle Slate
  ];

  return (
    <div className="space-y-6 print:p-0">
      {/* ==================================================== */}
      {/* 1. PRINTABLE HEADER */}
      {/* ==================================================== */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Penjualan (Sales Analytics) & Performa Bisnis</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase text-slate-500">Periode</div>
          <div className="text-sm font-semibold text-slate-900">{reportPeriod.formattedStart} - {reportPeriod.formattedEnd}</div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. EDITORIAL MINIMALIST HEADER & ACTIONS */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 print:hidden">
        <div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
            {todayFormatted}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-1">
            Laporan Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan performa penjualan produk, kategori, dan pesanan outlet Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              onClick={() => {
                if (currentTab === "harian") {
                  if (customRange?.from) {
                    loadData("custom", format(customRange.from, "yyyy-MM-dd"), format(customRange.to || customRange.from, "yyyy-MM-dd"));
                  } else {
                    loadData("daily", todayDateStr, todayDateStr);
                  }
                } else if (currentTab === "bulanan") {
                  const [y, m] = monthParam.split("-").map(Number);
                  loadData("monthly", format(new Date(y, m - 1, 1), "yyyy-MM-dd"), format(new Date(y, m, 0), "yyyy-MM-dd"));
                } else {
                  loadData("yearly", `${yearParam}-01-01`, `${yearParam}-12-31`);
                }
              }}
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
      {/* 4. 4 TOP KPI CARDS (CLEAN, MINIMALIST, HIGH DATA-INK) */}
      {/* Matching User References: Numbers, Badges, Sparkline & Footer Link */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Penjualan Bersih (Net Sales) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Penjualan Bersih
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  kpis.netSalesGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {kpis.netSalesGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{kpis.netSalesGrowth >= 0 ? `+${kpis.netSalesGrowth.toFixed(1)}%` : `${kpis.netSalesGrowth.toFixed(1)}%`}</span>
              </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {formatRupiah(kpis.netSales)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Total omzet bersih
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={kpis.netSalesGrowth}
                  isPositive={kpis.netSalesGrowth >= 0}
                  metricSeed={1}
                />
              </div>
            </div>
          </CardContent>

          {/* Garis pemisah di bagian bawah + Full Interactive Button */}
          <Link
            href={`/outlet/${outletKey}/reports/sales/detail`}
            className="group flex items-center justify-between px-5 py-2.5 border-t border-[#EAEFF8] bg-slate-50/50 hover:bg-blue-50/70 active:bg-blue-100/70 active:scale-[0.99] transition-all duration-150 cursor-pointer select-none"
          >
            <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
              Bandingkan periode lalu
            </span>
            <span className="text-[11px] text-slate-600 font-medium group-hover:text-[#0e59f9] inline-flex items-center gap-1 transition-colors">
              Lihat Rincian
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </Card>

        {/* KPI 2: Total Pesanan (Total Orders) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Pesanan
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  kpis.ordersGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {kpis.ordersGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{kpis.ordersGrowth >= 0 ? `+${Math.round(kpis.ordersGrowth)}%` : `${Math.round(kpis.ordersGrowth)}%`}</span>
              </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {formatNumber(kpis.totalOrders)} <span className="text-sm font-normal text-slate-400">Order</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Volume transaksi berhasil
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={kpis.ordersGrowth}
                  isPositive={kpis.ordersGrowth >= 0}
                  metricSeed={2}
                />
              </div>
            </div>
          </CardContent>

          {/* Garis pemisah di bagian bawah + Full Interactive Button */}
          <Link
            href={`/outlet/${outletKey}/reports/sales/detail`}
            className="group flex items-center justify-between px-5 py-2.5 border-t border-[#EAEFF8] bg-slate-50/50 hover:bg-blue-50/70 active:bg-blue-100/70 active:scale-[0.99] transition-all duration-150 cursor-pointer select-none"
          >
            <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
              Bandingkan periode lalu
            </span>
            <span className="text-[11px] text-slate-600 font-medium group-hover:text-[#0e59f9] inline-flex items-center gap-1 transition-colors">
              Lihat Rincian
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </Card>

        {/* KPI 3: Rata-rata Order (AOV) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Rata-rata Order (AOV)
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  kpis.aovGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {kpis.aovGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{kpis.aovGrowth >= 0 ? `+${kpis.aovGrowth.toFixed(1)}%` : `${kpis.aovGrowth.toFixed(1)}%`}</span>
              </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {formatRupiah(kpis.aov)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Belanja per keranjang
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={kpis.aovGrowth}
                  isPositive={kpis.aovGrowth >= 0}
                  metricSeed={3}
                />
              </div>
            </div>
          </CardContent>

          {/* Garis pemisah di bagian bawah + Full Interactive Button */}
          <Link
            href={`/outlet/${outletKey}/reports/sales/detail`}
            className="group flex items-center justify-between px-5 py-2.5 border-t border-[#EAEFF8] bg-slate-50/50 hover:bg-blue-50/70 active:bg-blue-100/70 active:scale-[0.99] transition-all duration-150 cursor-pointer select-none"
          >
            <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
              Bandingkan periode lalu
            </span>
            <span className="text-[11px] text-slate-600 font-medium group-hover:text-[#0e59f9] inline-flex items-center gap-1 transition-colors">
              Lihat Rincian
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </Card>

        {/* KPI 4: Total Menu Terjual (Total Items Sold) - User Selection: "total menu terjual saja" */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Menu Terjual
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  (kpis.itemsSoldGrowth || 0) >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {(kpis.itemsSoldGrowth || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{(kpis.itemsSoldGrowth || 0) >= 0 ? `+${Math.round(kpis.itemsSoldGrowth || 0)}%` : `${Math.round(kpis.itemsSoldGrowth || 0)}%`}</span>
              </div>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {formatNumber(kpis.totalItemsSold || 0)} <span className="text-sm font-normal text-slate-400">Porsi</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Total kuantitas produk keluar
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={kpis.itemsSoldGrowth || 0}
                  isPositive={(kpis.itemsSoldGrowth || 0) >= 0}
                  metricSeed={4}
                />
              </div>
            </div>
          </CardContent>

          {/* Garis pemisah di bagian bawah + Full Interactive Button */}
          <Link
            href={`/outlet/${outletKey}/reports/sales/detail`}
            className="group flex items-center justify-between px-5 py-2.5 border-t border-[#EAEFF8] bg-slate-50/50 hover:bg-blue-50/70 active:bg-blue-100/70 active:scale-[0.99] transition-all duration-150 cursor-pointer select-none"
          >
            <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
              Bandingkan periode lalu
            </span>
            <span className="text-[11px] text-slate-600 font-medium group-hover:text-[#0e59f9] inline-flex items-center gap-1 transition-colors">
              Lihat Rincian
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </Card>
      </div>

      {/* ==================================================== */}
      {/* 5. HERO ROW: REVENUE TREND CHART (8) & TOP CATEGORIES (4) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 Cols): Rounded Capsule Bar Chart (User confirmed Option A) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                  Tren Penjualan (Revenue Analytics)
                </div>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {chartMetric === "sales" ? formatRupiah(kpis.netSales) : `${formatNumber(kpis.totalOrders)} Order`}
                  </h3>
                  <span className="text-xs text-slate-400 font-normal">
                    {chartMetric === "sales" ? "Penjualan Bersih" : "Volume Pesanan"}
                  </span>
                </div>
              </div>

              {/* Metric Toggle Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMetric("sales")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                    chartMetric === "sales"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Omzet (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("orders")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                    chartMetric === "orders"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Pesanan
                </button>
              </div>
            </div>

            {/* Hover details badge */}
            <div className="h-6 mt-3 flex items-center justify-between text-xs">
              {activeHoverBar ? (
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold text-slate-900">{activeHoverBar.label}:</span>
                  <span className="font-semibold text-[#0e59f9]">
                    {chartMetric === "sales" ? formatRupiah(activeHoverBar.netSales) : `${activeHoverBar.orders} Order`}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    (Kotor: {formatRupiah(activeHoverBar.grossSales || activeHoverBar.netSales)} &bull; {activeHoverBar.orders} Order)
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-slate-300" />
                  Arahkan kursor pada batang untuk melihat rincian per tanggal / jam
                </div>
              )}

              <span className="text-[11px] font-medium text-slate-400">
                Puncak: {chartMetric === "sales" ? formatCompactRupiah(maxPointSales) : maxPointSales}
              </span>
            </div>

            {/* Rounded Capsule Bar Canvas */}
            <div className="relative mt-2 h-[220px] sm:h-[240px] w-full flex items-end">
              {/* Y-Axis Guidelines & Labels */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-0">
                {yTicks.map((tick, i) => (
                  <div key={i} className="w-full flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 tabular-nums font-mono w-10 text-left">
                      {tick.label}
                    </span>
                    <div className="flex-1 border-b border-dashed border-slate-100 ml-2" />
                  </div>
                ))}
              </div>

              {/* Capsule Bars Grid */}
              <div className="relative z-10 w-full h-full flex items-end justify-between pl-12 pr-2">
                {barData.map((bar) => {
                  const isHovered = hoveredPointIndex === bar.idx;
                  return (
                    <div
                      key={bar.idx}
                      className="relative h-full flex flex-col justify-end items-center group cursor-pointer"
                      style={{ flex: 1 }}
                      onMouseEnter={() => setHoveredPointIndex(bar.idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Active Accent Dot above bar */}
                      {isHovered && (
                        <div className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-[#0e59f9] animate-pulse" />
                      )}

                      {/* Capsule Bar */}
                      <div
                        className={cn(
                          "rounded-full transition-all duration-300 relative",
                          bar.isZero
                            ? "bg-slate-200/50"
                            : isHovered
                              ? "bg-[#0e59f9] shadow-[0_4px_14px_rgba(14,89,249,0.38)]"
                              : "bg-[#D8E8FE] hover:bg-[#BFDBFE]"
                        )}
                        style={{
                          height: `${bar.heightPercent}%`,
                          width: `${dynamicBarWidth}px`,
                          maxWidth: "85%",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Date/Hour Labels */}
            <div className="w-full flex justify-between pl-12 pr-2 pt-2 border-t border-slate-100 mt-1">
              {barData.map((bar) => {
                const isHovered = hoveredPointIndex === bar.idx;
                return (
                  <div
                    key={bar.idx}
                    className="text-center"
                    style={{ flex: 1 }}
                  >
                    <span
                      className={cn(
                        "text-[10px] block transition-colors truncate px-0.5",
                        isHovered
                          ? "text-[#0e59f9] font-semibold"
                          : "text-slate-400"
                      )}
                    >
                      {bar.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Kategori Terlaris (Category Sales Share) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">

                  Kategori Terlaris
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {categoryMetric === "revenue" ? "Porsi omzet per kategori menu" : "Porsi kuantitas produk keluar"}
                </p>
              </div>

              {/* Dual-Perspective Switcher for Categories */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setCategoryMetric("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    categoryMetric === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryMetric("qty")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    categoryMetric === "qty"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Porsi
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-3">
              {(!sortedCategories || sortedCategories.length === 0) ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada data kategori menu terjual.
                </div>
              ) : (
                sortedCategories.map((cat, idx) => {
                  const color = categoryColors[idx % categoryColors.length];
                  const percentage = categoryMetric === "revenue"
                    ? (cat.percentageRevenue ?? cat.percentage ?? 0)
                    : (cat.percentageQty ?? cat.percentage ?? 0);

                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate max-w-[140px]">{cat.name}</span>
                        </span>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">
                            {categoryMetric === "revenue"
                              ? formatRupiah(cat.totalRevenue)
                              : `${formatNumber(cat.totalQty)} porsi`}
                          </span>
                          <span className="text-slate-400 font-normal ml-1">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                        <span>
                          {categoryMetric === "revenue"
                            ? `${formatNumber(cat.totalQty)} porsi terjual`
                            : `Omzet: ${formatRupiah(cat.totalRevenue)}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total {topCategories?.length || 0} kategori aktif</span>
            <span className="text-[#0e59f9] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer">
              Analisis Kategori <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. PRODUCT INTELLIGENCE: DUA KARTU TERPISAH BERDAMPINGAN (USER CONFIRMED OPTION B) */}
      {/* Card 1: 🏆 Produk Terlaris (Top Selling) */}
      {/* Card 2: ⚠️ Produk Paling Tidak Laku (Worst Selling / Perlu Evaluasi) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: 🏆 Produk Terlaris (Top Selling) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Menu Terlaris
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {topMenuMetric === "revenue" ? "5 menu dengan kontribusi omzet tertinggi" : "5 menu dengan kuantitas porsi terbanyak"}
                </p>
              </div>

              {/* Dual-Perspective Switcher: Omzet vs Porsi */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setTopMenuMetric("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    topMenuMetric === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setTopMenuMetric("qty")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    topMenuMetric === "qty"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Porsi
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {(!sortedTopProducts || sortedTopProducts.length === 0) ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Belum ada menu terjual pada periode ini.
                </div>
              ) : (
                (() => {
                  const top1 = sortedTopProducts[0];
                  const top1Val = top1
                    ? (topMenuMetric === "revenue" ? top1.totalRevenue : top1.totalQty)
                    : 1;

                  return sortedTopProducts.map((p, idx) => {
                    const theme = RANK_THEMES[idx] || RANK_THEMES[RANK_THEMES.length - 1];
                    const pct = topMenuMetric === "revenue"
                      ? (totalSalesRevenue > 0 ? (p.totalRevenue / totalSalesRevenue) * 100 : 0)
                      : (totalSalesQty > 0 ? (p.totalQty / totalSalesQty) * 100 : 0);
                    const curVal = topMenuMetric === "revenue" ? p.totalRevenue : p.totalQty;
                    // Top 1 is 100% full, others follow proportionally relative to Top 1
                    const barWidth = top1Val > 0 ? Math.min(100, Math.max(curVal > 0 ? 4 : 0, Math.round((curVal / top1Val) * 100))) : 0;

                    return (
                      <div key={p.id} className="py-2.5 space-y-1.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={cn(
                                "w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 transition-colors",
                                theme.badge
                              )}
                            >
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{p.categoryName}</span>
                                <span>&bull;</span>
                                <span>{formatRupiah(p.price)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold text-slate-900">
                              {topMenuMetric === "revenue" ? formatRupiah(p.totalRevenue) : `${formatNumber(p.totalQty)} porsi`}
                              <span className="text-slate-400 font-normal ml-1">
                                ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {topMenuMetric === "revenue"
                                ? `${formatNumber(p.totalQty)} porsi terjual`
                                : `Omzet: ${formatRupiah(p.totalRevenue)}`}
                            </div>
                          </div>
                        </div>

                        {/* Rank Progress Bar: Top 1 is 100% full, others proportional to Top 1 */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", theme.bar)}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dihitung dari transaksi yang selesai</span>
            <span className="text-[#0e59f9] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer">
              Lihat Semua Menu <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: ⚠️ Produk Paling Tidak Laku (Worst Selling / Perlu Evaluasi) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Menu Perlu Evaluasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {evalMenuMetric === "revenue" ? "5 menu dengan penjualan terendah / belum terjual" : "5 menu dengan kuantitas porsi terendah"}
                </p>
              </div>

              {/* Dual-Perspective Switcher: Omzet vs Porsi */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEvalMenuMetric("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    evalMenuMetric === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setEvalMenuMetric("qty")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    evalMenuMetric === "qty"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Porsi
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {(!sortedBottomProducts || sortedBottomProducts.length === 0) ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Seluruh menu dalam katalog memiliki penjualan yang merata.
                </div>
              ) : (
                (() => {
                  const totalItems = sortedBottomProducts.length;
                  const maxBottomVal = Math.max(
                    ...sortedBottomProducts.map((p) => (evalMenuMetric === "revenue" ? p.totalRevenue : p.totalQty)),
                    1
                  );
                  return sortedBottomProducts.map((p, idx) => {
                    // Inverted blue ramp so bottom-most item is the deepest blue ("paling bawah paling biru")
                    const themeIdx = totalItems <= 1
                      ? EVALUATION_BLUE_THEMES.length - 1
                      : Math.round((idx / (totalItems - 1)) * (EVALUATION_BLUE_THEMES.length - 1));
                    const theme = EVALUATION_BLUE_THEMES[themeIdx];
                    const pct = evalMenuMetric === "revenue"
                      ? (totalSalesRevenue > 0 ? (p.totalRevenue / totalSalesRevenue) * 100 : 0)
                      : (totalSalesQty > 0 ? (p.totalQty / totalSalesQty) * 100 : 0);
                    const curVal = evalMenuMetric === "revenue" ? p.totalRevenue : p.totalQty;
                    // Proportional relative to max in bottom list so bars are clearly visible
                    const barWidth = curVal === 0
                      ? 0
                      : Math.min(100, Math.max(6, Math.round((curVal / maxBottomVal) * 100)));

                    return (
                      <div key={p.id} className="py-2.5 space-y-1.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn("w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 border", theme.badge)}>
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{p.categoryName}</span>
                                <span>&bull;</span>
                                <span>{formatRupiah(p.price)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-semibold text-slate-900">
                              {evalMenuMetric === "revenue"
                                ? (p.totalRevenue > 0 ? formatRupiah(p.totalRevenue) : "Rp 0")
                                : (p.totalQty === 0 ? "0 Porsi" : `${formatNumber(p.totalQty)} porsi`)}
                              <span className="text-slate-400 font-normal ml-1">
                                ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="mt-0.5">
                              {evalMenuMetric === "revenue" ? (
                                p.totalQty === 0 ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-[#0e59f9] border border-blue-200">
                                    0 Terjual
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {formatNumber(p.totalQty)} porsi terjual
                                  </span>
                                )
                              ) : (
                                p.totalRevenue === 0 ? (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-[#0e59f9] border border-blue-200">
                                    Rp 0 Omzet
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    Omzet: {formatRupiah(p.totalRevenue)}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Evaluation bar representing share of total sales using inverted blue themes */}
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              p.totalQty === 0 && p.totalRevenue === 0 ? "bg-slate-200" : theme.bar
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-400">Rekomendasi: Buat paket promo / evaluasi resep</span>
            <span className="text-[#0e59f9] font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer">
              Atur Menu <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. DISTRIBUSI TRANSAKSI, METODE PEMBAYARAN & KANAL */}
      {/* 3-Card Balanced Row (4 : 4 : 4 Grid Layout) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* Card 1: Metode Pembayaran (Doughnut Chart + Dual Perspective) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">

                  Metode Pembayaran
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {paymentViewMode === "revenue" ? "Porsi perputaran uang masuk" : "Preferensi metode bayar pelanggan"}
                </p>
              </div>

              {/* View Switcher: Omzet vs Transaksi */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setPaymentViewMode("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    paymentViewMode === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentViewMode("orders")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    paymentViewMode === "orders"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Transaksi
                </button>
              </div>
            </div>

            {/* Doughnut Chart Visualization */}
            <div className="py-2">
              <PaymentDoughnutChart
                methods={paymentMethods || []}
                viewMode={paymentViewMode}
                totalCollected={kpis.totalCollected || kpis.grossSales || 1}
                totalOrders={kpis.totalOrders || 1}
                cashlessRevenuePercent={paymentAnalytics?.cashlessRevenuePercent || 0}
                cashlessOrdersPercent={paymentAnalytics?.cashlessOrdersPercent || 0}
                cashlessRevenue={paymentAnalytics?.cashlessRevenue || 0}
                cashlessOrders={paymentAnalytics?.cashlessOrders || 0}
              />
            </div>

            {/* Payment Method Breakdown List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {(paymentMethods || []).slice(0, 4).map((pm, idx) => {
                const dotColor = getPaymentMethodColor(pm.method, pm.tenderType, idx);

                const pct = paymentViewMode === "revenue" ? (pm.percentageRevenue ?? pm.percentage ?? 0) : (pm.percentageOrders ?? 0);

                return (
                  <div key={pm.method} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/60 rounded-lg px-1.5 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="font-medium text-slate-700 truncate max-w-[130px]">{pm.method}</span>
                    </div>
                    <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-semibold text-slate-900">
                        {paymentViewMode === "revenue" ? formatRupiah(pm.total) : `${pm.count} order`}
                      </span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        ({pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer: Net Inflow & Gateway MDR */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Fee MDR: <strong className="font-medium text-rose-600">-{formatRupiah(paymentAnalytics?.totalGatewayFee || 0)}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              Net Inflow: {formatRupiah(paymentAnalytics?.netSettlement || kpis.netSales)}
            </span>
          </div>
        </div>

        {/* Card 2: Kanal & Perilaku Belanja (Dual Segmented Lines) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">

                  Jenis Pesanan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {channelViewMode === "revenue" ? "Perbandingan kontribusi omzet" : "Perbandingan frekuensi transaksi"}
                </p>
              </div>

              {/* View Switcher: Omzet vs Pesanan */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setChannelViewMode("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    channelViewMode === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setChannelViewMode("orders")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    channelViewMode === "orders"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Pesanan
                </button>
              </div>
            </div>

            {/* Section A: Kanal Pemesanan (Kasir POS vs Self-Order QR) - High Contrast Kuning & Biru */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Kasir POS ({channelViewMode === "revenue" ? `${(channelMetrics?.posRevenuePercent || 45).toFixed(1)}%` : `${(channelMetrics?.posOrdersPercent || 50).toFixed(1)}%`})
                </span>
                <span className="font-semibold text-[#0e59f9] flex items-center gap-1.5">
                  Self-Order QR ({channelViewMode === "revenue" ? `${(channelMetrics?.sfRevenuePercent || 55).toFixed(1)}%` : `${(channelMetrics?.sfOrdersPercent || 50).toFixed(1)}%`})
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0e59f9]" />
                </span>
              </div>

              {/* Two-Tone Proportional Segmented Bar (Kuning Amber vs Biru Menuin) */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{
                    width: `${channelViewMode === "revenue" ? (channelMetrics?.posRevenuePercent || 50) : (channelMetrics?.posOrdersPercent || 50)}%`,
                  }}
                  title="Kasir POS"
                />
                <div
                  className="h-full bg-[#0e59f9] transition-all duration-500"
                  style={{
                    width: `${channelViewMode === "revenue" ? (channelMetrics?.sfRevenuePercent || 50) : (channelMetrics?.sfOrdersPercent || 50)}%`,
                  }}
                  title="Self-Order QR Meja"
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                <span>{channelViewMode === "revenue" ? formatRupiah(channelMetrics?.posRevenue || 0) : `${channelMetrics?.posOrders || 0} order`}</span>
                <span>{channelViewMode === "revenue" ? formatRupiah(channelMetrics?.storefrontRevenue || 0) : `${channelMetrics?.storefrontOrders || 0} order`}</span>
              </div>
            </div>

            {/* Section B: Tipe Layanan (Bawa Pulang di Kiri - Kuning, Makan di Tempat di Kanan - Biru) */}
            <div className="pt-3 space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Bawa Pulang
                </span>
                <span className="font-semibold text-[#0e59f9] flex items-center gap-1.5">
                  Makan di Tempat
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0e59f9]" />
                </span>
              </div>

              {/* Proportional Segmented Bar: Bawa Pulang (Kuning Kiri) & Makan di Tempat (Biru Kanan) */}
              {(() => {
                const dineIn = (orderTypes || []).find((ot) => ot.type.toLowerCase().includes("tempat") || ot.type.toLowerCase().includes("dine")) || { count: 0, total: 0, percentageRevenue: 75, percentageOrders: 75 };
                const takeaway = (orderTypes || []).find((ot) => ot.type.toLowerCase().includes("pulang") || ot.type.toLowerCase().includes("take")) || { count: 0, total: 0, percentageRevenue: 25, percentageOrders: 25 };
                const dinePct = channelViewMode === "revenue" ? (dineIn.percentageRevenue ?? 75) : (dineIn.percentageOrders ?? 75);
                const takePct = channelViewMode === "revenue" ? (takeaway.percentageRevenue ?? 25) : (takeaway.percentageOrders ?? 25);

                // Ensure left-hand yellow indicator remains visible as a cap even if takeaway is 0%
                const minTakeDisplay = 6;
                const displayTake = takePct > 0 ? Math.max(takePct, minTakeDisplay) : minTakeDisplay;
                const displayDine = 100 - displayTake;

                return (
                  <>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${displayTake}%` }}
                        title={`Bawa Pulang: ${takePct.toFixed(1)}%`}
                      />
                      <div
                        className="h-full bg-[#0e59f9] transition-all duration-500"
                        style={{ width: `${displayDine}%` }}
                        title={`Makan di Tempat: ${dinePct.toFixed(1)}%`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                      <span>{channelViewMode === "revenue" ? formatRupiah(takeaway.total) : `${takeaway.count} order`} ({takePct.toFixed(1)}%)</span>
                      <span>{channelViewMode === "revenue" ? formatRupiah(dineIn.total) : `${dineIn.count} order`} ({dinePct.toFixed(1)}%)</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Section C: Dual-Stat Highlight Strips (Basket Dynamics) */}
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1">
                <div className="text-[10px] font-medium text-emerald-800 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  AOV Uplift Self-QR
                </div>
                <div className="text-sm font-semibold text-emerald-700">
                  {channelMetrics?.aovUpliftRate && channelMetrics.aovUpliftRate > 0
                    ? `+${channelMetrics.aovUpliftRate.toFixed(1)}%`
                    : "0%"}
                </div>
                <div className="text-[10px] text-slate-400">
                  Meja QR belanja lebih tinggi
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1">
                <div className="text-[10px] font-medium text-[#0e59f9] flex items-center gap-1">
                  
                  Porsi per Transaksi
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {channelMetrics?.basketSize || "0"} <span className="text-xs font-normal text-slate-500">Porsi/transaksi</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Rata-rata item per pesanan
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>AOV Kasir: {formatRupiah(channelMetrics?.posAov || 0)}</span>
            <span className="font-semibold text-[#0e59f9]">AOV QR: {formatRupiah(channelMetrics?.storefrontAov || 0)}</span>
          </div>
        </div>

        {/* Card 3: Sesi Waktu Penjualan (Dayparting Analysis) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">

                  Sesi Waktu Penjualan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {daypartViewMode === "revenue" ? "Pola omzet berdasarkan jam makan" : "Tingkat kesibukan pesanan outlet"}
                </p>
              </div>

              {/* View Switcher: Omzet vs Pesanan */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setDaypartViewMode("revenue")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    daypartViewMode === "revenue"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Omzet
                </button>
                <button
                  type="button"
                  onClick={() => setDaypartViewMode("orders")}
                  className={cn(
                    "text-[10px] font-medium px-2 py-1 rounded-md transition-all",
                    daypartViewMode === "orders"
                      ? "bg-white text-[#0e59f9] shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Pesanan
                </button>
              </div>
            </div>

            {/* Dayparting Session Progress Bars */}
            <div className="space-y-3 pt-2">
              {(dayparting || []).map((dp) => {
                const isPeak = daypartViewMode === "revenue" ? dp.isPeakRevenue : dp.isPeakOrders;
                const percentage = daypartViewMode === "revenue" ? dp.percentageRevenue : dp.percentageOrders;

                return (
                  <div key={dp.key} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-800 truncate max-w-[130px]">{dp.label}</span>
                        <span className="text-[10px] text-slate-400">({dp.timeRange})</span>

                      </div>
                      <div className="text-right flex items-center gap-1">
                        <span className={cn("font-semibold", isPeak ? "text-[#0e59f9]" : "text-slate-900")}>
                          {daypartViewMode === "revenue" ? formatRupiah(dp.revenue) : `${dp.orders} order`}
                        </span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isPeak ? "bg-[#0e59f9]" : "bg-[#93c5fd]"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>


    </div>
  );
}

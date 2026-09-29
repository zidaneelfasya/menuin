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
  RefreshCw
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
import { DateRange } from "react-day-picker";
import { format, subMonths, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getReportsOverview, ReportPeriod } from "@/lib/actions/reports";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type OverviewData = NonNullable<Awaited<ReturnType<typeof getReportsOverview>>["data"]>;

interface OverviewReportClientProps {
  initialData: OverviewData;
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

/**
 * Compact Indonesian Rupiah formatter for charts and badges (e.g. 120jt, 120rb, 1,5M)
 */
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

/**
 * Editorial compact currency formatter for hero metric (e.g. 140,3 Jt, 500,3 rb, 1,5 M)
 */
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

// ==========================================
// SVG VISUAL HELPERS (MINIMALIST & LIGHTWEIGHT)
// ==========================================

/**
 * Catmull-Rom to Cubic Bézier spline converter for silky-smooth organic curves (Image 2 style)
 */
function getCubicSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];

    // Catmull-Rom tangent tension (0.16 = smooth natural wave without overshooting)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Dynamic Trendline Sparkline for Top KPI Cards (Reference Image 2)
 * Renders an organic undulating spline curve ("kelok-kelok") where the endpoint and overall slope
 * strictly and authentically reflect the metric's percentage growth/margin, with soft gradient fill.
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
  // Shortened width for better balance next to the nominal numbers
  const width = 76;
  const height = 40;
  const padX = 2;
  const midY = height / 2;

  // Stable unique gradient ID
  const gradId = React.useId().replace(/:/g, "_");

  // Determine positive status
  const positive = isPositive !== undefined ? isPositive : (percentage ?? 0) >= 0;
  const strokeColor = color || (positive ? "#10b981" : "#f43f5e");

  const { lineD, areaD, lastPoint } = React.useMemo(() => {
    const numPoints = 32;
    const pts: { x: number; y: number }[] = [];

    if (percentage !== undefined) {
      const absP = Math.abs(percentage);
      const isUp = percentage >= 0;

      // Cap at 50%: If percentage >= 50% (or <= -50%), it reaches the maximum height/depth.
      // Any percentage exceeding 50% reaches the exact same peak height as 50%.
      const ratio = Math.min(absP / 50, 1.0);

      // Peak climb is calibrated so the top dot (yEnd) aligns directly flush with the top of the nominal text
      // At ratio = 1.0 (50%+): yEnd = 2.5px (aligned with the very top of nominal digits)
      const maxClimb = 33;
      const actualClimb = ratio * maxClimb;

      const yStart = isUp ? midY + actualClimb * 0.47 : midY - actualClimb * 0.47;
      const yEnd = isUp ? midY - actualClimb * 0.53 : midY + actualClimb * 0.53;

      const phase = (metricSeed * 0.43) % 1;

      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const x = padX + t * (width - 2 * padX);
        const linearY = yStart + (yEnd - yStart) * t;

        // Organic multi-harmonic financial fluctuations ("lebih acak dan seperti asli")
        // Uses asynchronous non-integer harmonics so the curve is completely irregular and natural
        const oct1 = Math.sin((t * 4.3 + phase * 2.1) * Math.PI * 2) * 2.3;
        const oct2 = Math.cos((t * 8.7 + phase * 4.3) * Math.PI * 2) * 1.5;
        const oct3 = Math.sin((t * 13.1 + phase * 1.7) * Math.PI * 2) * 0.8;
        const drift = Math.sin((t * 2.1 + phase) * Math.PI * 2) * 0.9;
        const rawNoise = oct1 + oct2 + oct3 + drift;

        // Window function ensures wave is strictly 0 at endpoints t=0 and t=1
        // while remaining full and lively across the entire span
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
      {/* Soft gradient area fill below curve */}
      <path d={areaD} fill={`url(#${gradId})`} />
      {/* Silky-smooth spline stroke line */}
      <path
        d={lineD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Terminal tip circle indicator exactly aligned with nominal top */}
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
 * Minimalist Speedometer Radial Arc Gauge (0 - 100%)
 */
function SpeedometerGauge({ percentage }: { percentage: number }) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const radius = 64;
  const strokeWidth = 9;
  const cx = 80;
  const cy = 76;
  const circumference = Math.PI * radius; // Half-circle arc
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let strokeColor = "#10b981"; // Emerald
  if (clamped < 35) strokeColor = "#f43f5e"; // Rose
  else if (clamped < 50) strokeColor = "#f59e0b"; // Amber

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="160" height="92" viewBox="0 0 160 92" className="overflow-visible">
        {/* Background Arc */}
        <path
          d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value Arc */}
        <path
          d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Centered Metric in Half-Circle */}
      <div className="absolute top-10 text-center">
        <div className="text-2xl font-semibold text-slate-900 tracking-tight font-mono">
          {clamped.toFixed(1)}%
        </div>
        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
          Laba Kotor
        </div>
      </div>
    </div>
  );
}

// Top Menu Rank Color Theme Palette (Heatmap ramp: Dark Blue down to Gray)
const RANK_THEMES = [
  { bar: "bg-[#083cb0]", badge: "bg-[#083cb0] text-white" },       // Rank 1: Deep Navy Blue
  { bar: "bg-[#0e59f9]", badge: "bg-[#0e59f9] text-white" },       // Rank 2: Menuin Royal Blue
  { bar: "bg-[#3b82f6]", badge: "bg-blue-100 text-blue-800" },     // Rank 3: Medium Blue
  { bar: "bg-[#93c5fd]", badge: "bg-slate-100 text-slate-700" },   // Rank 4: Soft Sky Blue
  { bar: "bg-[#cbd5e1]", badge: "bg-slate-100 text-slate-500" },   // Rank 5: Subtle Gray
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export function OverviewReportClient({ initialData, outletKey }: OverviewReportClientProps) {
  const [data, setData] = React.useState<OverviewData>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState<number | null>(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = React.useState<{
    dayName: string;
    hourLabel: string;
    orderCount: number;
    revenue: number;
  } | null>(null);

  // Filter State (Harian, Bulanan, Tahunan) matching Screenshot 3
  const [currentTab, setCurrentTab] = React.useState<"harian" | "bulanan" | "tahunan">("bulanan");
  const [monthParam, setMonthParam] = React.useState<string>(() => format(new Date(), "yyyy-MM"));
  const [yearParam, setYearParam] = React.useState<string>(() => String(new Date().getFullYear()));
  
  // Custom Date Range State inside Harian Popover
  const [customRange, setCustomRange] = React.useState<DateRange | undefined>(undefined);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  const hasCustomDate = React.useMemo(() => {
    if (!customRange?.from || !customRange?.to) return false;
    const fromStr = format(customRange.from, "yyyy-MM-dd");
    const toStr = format(customRange.to, "yyyy-MM-dd");
    return !(fromStr === todayDateStr && toStr === todayDateStr);
  }, [customRange, todayDateStr]);

  const loadData = async (
    targetPeriod: ReportPeriod,
    optStart?: string,
    optEnd?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await getReportsOverview(outletKey, {
        period: targetPeriod,
        startDate: optStart,
        endDate: optEnd,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || "Gagal memuat ringkasan laporan");
      }
    } catch (err: any) {
      toast.error("Terjadi kendala saat memperbarui ringkasan laporan.");
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

  const handleSelectToday = () => {
    setCustomRange(undefined);
    setIsCalendarOpen(false);
    loadData("daily", todayDateStr, todayDateStr);
  };

  const handleResetToToday = () => {
    setCustomRange(undefined);
    setIsCalendarOpen(false);
    loadData("daily", todayDateStr, todayDateStr);
  };

  // Generate Month Options for Select
  const monthOptions = React.useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const curDate = new Date();
    for (let i = 0; i < 18; i++) {
      const d = subMonths(curDate, i);
      list.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy", { locale: localeId }),
      });
    }
    return list;
  }, []);

  // Generate Year Options
  const yearOptions = React.useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear, curYear - 1, curYear - 2, curYear - 3].map(String);
  }, []);

  // Formatted Label for Daily Button
  const dateButtonLabel = React.useMemo(() => {
    if (customRange?.from) {
      const fromDate = customRange.from;
      const toDate = customRange.to || fromDate;
      const fromStr = format(fromDate, "yyyy-MM-dd");
      const toStr = format(toDate, "yyyy-MM-dd");

      if (fromStr === toStr) {
        if (fromStr === todayDateStr) {
          return "Hari Ini";
        }
        return format(fromDate, "d MMM yyyy", { locale: localeId });
      }
      return `${format(fromDate, "d MMM", { locale: localeId })} — ${format(toDate, "d MMM yyyy", { locale: localeId })}`;
    }
    return "Hari Ini";
  }, [customRange, todayDateStr]);

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Executive Summary Sheet
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Periode", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Penjualan Bersih (Net Sales)", Nilai: Math.round(data.heroKpis.netSales) },
        { Indikator: "Pertumbuhan Penjualan (%)", Nilai: data.heroKpis.netSalesGrowth.toFixed(1) + "%" },
        { Indikator: "Total Pesanan", Nilai: data.heroKpis.totalOrders },
        { Indikator: "Pertumbuhan Pesanan (%)", Nilai: data.heroKpis.ordersGrowth.toFixed(1) + "%" },
        { Indikator: "Rata-rata Order (AOV)", Nilai: Math.round(data.heroKpis.aov) },
        { Indikator: "Puncak Jam Ramai", Nilai: `${data.heroKpis.busiestHourLabel} (${data.heroKpis.busiestHourOrders} pesanan)` },
        { Indikator: "Hari Tersibuk", Nilai: `${data.heroKpis.busiestDayName} (${formatRupiah(data.heroKpis.busiestDayRevenue)})` },
        { Indikator: "Total Kas Masuk (Inflow)", Nilai: Math.round(data.financeSnapshot.totalCashIn) },
        { Indikator: "Total Kas Keluar (Outflow)", Nilai: Math.round(data.financeSnapshot.totalCashOut) },
        { Indikator: "Arus Kas Bersih (Net Flow)", Nilai: Math.round(data.heroKpis.netCashFlow) },
        { Indikator: "Estimasi Laba Kotor (Gross Profit)", Nilai: Math.round(data.heroKpis.grossProfit) },
        { Indikator: "Margin Keuntungan (%)", Nilai: data.heroKpis.profitMargin.toFixed(1) + "%" },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Eksekutif");

      // 2. Daily Sales Trend Sheet
      const dailyRows = data.salesSnapshot.miniChartData.map((d) => ({
        Waktu: d.date,
        Label: d.label,
        "Net Sales (Rp)": Math.round(d.netSales),
        "Total Pesanan": d.orders,
      }));
      const dailySheet = XLSX.utils.json_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Tren Penjualan");

      // 3. Top Products Sheet
      const productRows = data.operationsSnapshot.topProducts.map((p, i) => ({
        Peringkat: i + 1,
        "Nama Menu": p.name,
        Kategori: p.categoryName,
        "Jumlah Terjual (Qty)": p.totalQty,
        "Total Omset (Rp)": Math.round(p.totalRevenue),
      }));
      const productSheet = XLSX.utils.json_to_sheet(productRows);
      XLSX.utils.book_append_sheet(workbook, productSheet, "Menu Terlaris");

      // 4. Cash Flow Channels Sheet
      const channelRows = [
        { Saluran: "Kas Fisik Kasir (Laci)", Nilai: Math.round(data.financeSnapshot.drawerNetFlow), Keterangan: "Penjualan tunai - modal kasir & beban tunai" },
        { Saluran: "Rekening Bank & QRIS", Nilai: Math.round(data.financeSnapshot.digitalNetFlow), Keterangan: "Penerimaan non-tunai settlement otomatis" },
        { Saluran: "Estimasi HPP Modal Produk", Nilai: Math.round(data.financeSnapshot.totalHpp), Keterangan: "Total estimasi modal bahan baku resep" },
      ];
      const channelSheet = XLSX.utils.json_to_sheet(channelRows);
      XLSX.utils.book_append_sheet(workbook, channelSheet, "Distribusi Kas & Saluran");

      const fileName = `Laporan_Ringkasan_Eksekutif_${data.tenant.name.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel ringkasan eksekutif berhasil diunduh.");
    } catch (e: any) {
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { heroKpis, salesSnapshot, operationsSnapshot, financeSnapshot, period: reportPeriod, tenant } = data;

  // Chart computations
  // Peak Net Sales point for Y-Axis and Bar Height scaling
  const maxPointSales = React.useMemo(() => {
    if (!salesSnapshot.miniChartData || salesSnapshot.miniChartData.length === 0) return 0;
    return Math.max(...salesSnapshot.miniChartData.map((d) => d.netSales), 0);
  }, [salesSnapshot.miniChartData]);

  // 5 Y-Axis Grid baselines & compact labels (e.g. 7,8jt, 5,9jt, 3,9jt, 2,0jt, 0)
  const yTicks = React.useMemo(() => {
    const max = maxPointSales > 0 ? maxPointSales : 1000000;
    const count = 5;
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const ratio = (count - 1 - i) / (count - 1); // 1.0, 0.75, 0.5, 0.25, 0
      const val = max * ratio;
      ticks.push({
        ratio,
        val,
        label: formatCompactRupiah(val),
      });
    }
    return ticks;
  }, [maxPointSales]);

  // Dynamic bar width calculation based on data point density
  const dynamicBarWidth = React.useMemo(() => {
    const n = salesSnapshot.miniChartData.length;
    if (n <= 7) return 32;   // 7 days
    if (n <= 12) return 24;  // 12 months (matches the reference image!)
    if (n <= 16) return 18;  // ~2 weeks
    if (n <= 24) return 13;  // 24 hours
    if (n <= 31) return 10;  // 30-31 days
    return 7;
  }, [salesSnapshot.miniChartData.length]);

  // Rounded Capsule Bars data
  const barData = React.useMemo(() => {
    const items = salesSnapshot.miniChartData;
    const n = items.length;
    if (n === 0) return [];
    const max = maxPointSales > 0 ? maxPointSales : 1;

    return items.map((item, idx) => {
      const val = Math.max(0, item.netSales);
      const isZero = val <= 0;
      // Scale height up to 92% of plotting height
      const heightPercent = isZero ? 3.5 : Math.max(6, Math.min(94, Math.round((val / max) * 94)));

      let dayLabel = item.label || "";
      if (item.date && item.date.includes("-")) {
        const parts = item.date.split("-");
        if (parts.length === 3 && n > 10) {
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
  }, [salesSnapshot.miniChartData, maxPointSales]);

  // Active hover bar in rounded bar chart
  const activeHoverBar = hoveredPointIndex !== null && barData[hoveredPointIndex]
    ? barData[hoveredPointIndex]
    : null;

  // Dual Ratio Bar computation (Cash vs Bank/QRIS)
  const safeCashFlowIn = Math.max(financeSnapshot.cashSalesTotal + financeSnapshot.nonCashSalesTotal, 1);
  const cashRatio = Math.round((financeSnapshot.cashSalesTotal / safeCashFlowIn) * 100);
  const digitalRatio = 100 - cashRatio;

  // Heatmap Shading
  const heatmapGrid = operationsSnapshot.heatmapGrid || [];
  let maxHeatmapOrders = 1;
  heatmapGrid.forEach((row) => {
    row.hours.forEach((cell) => {
      if (cell.orderCount > maxHeatmapOrders) maxHeatmapOrders = cell.orderCount;
    });
  });

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-[#F4F7FC]/80 text-transparent border border-slate-100/60";
    const ratio = count / maxHeatmapOrders;
    if (ratio <= 0.15) return "bg-blue-100/90 text-blue-900 border border-blue-200/50";
    if (ratio <= 0.35) return "bg-blue-300 text-blue-950 font-medium border border-blue-400/40";
    if (ratio <= 0.6) return "bg-blue-500 text-white font-medium border border-blue-600/40";
    if (ratio <= 0.85) return "bg-[#0e59f9] text-white font-semibold";
    return "bg-[#083cb0] text-white font-semibold";
  };

  // Sparkline data for Top 4 KPI Cards
  const chartPointsData = React.useMemo(() => {
    return salesSnapshot.miniChartData.map((d) => d.netSales);
  }, [salesSnapshot.miniChartData]);

  const chartOrdersData = React.useMemo(() => {
    return salesSnapshot.miniChartData.map((d) => d.orders);
  }, [salesSnapshot.miniChartData]);

  // Cash flow surplus/deficit percentage for KPI 3 sparkline
  const cashFlowPercentage = React.useMemo(() => {
    const totalIn = financeSnapshot.totalCashIn || 0;
    const netFlow = heroKpis.netCashFlow || 0;
    if (totalIn > 0) {
      return (netFlow / totalIn) * 100;
    }
    return netFlow >= 0 ? 100 : -100;
  }, [heroKpis.netCashFlow, financeSnapshot.totalCashIn]);

  // Top products max qty and total qty for progress bar relative scaling
  const maxProductQty = Math.max(...operationsSnapshot.topProducts.map((p) => p.totalQty), 1);
  const totalProductQty = operationsSnapshot.topProducts.reduce((sum, p) => sum + p.totalQty, 0);

  // Formatted date string for editorial header
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).toUpperCase();

  return (
    <div className="space-y-6 print:p-0">
      {/* ==================================================== */}
      {/* 1. PRINTABLE HEADER */}
      {/* ==================================================== */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Ringkasan Eksekutif &bull; Laporan Penjualan, Operasional, dan Keuangan</p>
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
            Ringkasan Eksekutif
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {heroKpis.totalOrders} total transaksi &bull; Pertumbuhan omzet {heroKpis.netSalesGrowth >= 0 ? `+${heroKpis.netSalesGrowth.toFixed(1)}%` : `${heroKpis.netSalesGrowth.toFixed(1)}%`}
            {financeSnapshot.activeShift && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Shift aktif: {financeSnapshot.activeShift.cashierName}
              </span>
            )}
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
      {/* Exactly matching Screenshot 3 reference styling */}
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
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="p-2">
                    <Calendar
                      mode="range"
                      defaultMonth={tempRange?.from || customRange?.from || new Date()}
                      selected={tempRange}
                      onSelect={setTempRange}
                      numberOfMonths={1}
                      locale={localeId}
                    />
                  </div>

                  <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 rounded-lg"
                      onClick={handleSelectToday}
                    >
                      Hari Ini
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium px-2.5 border-slate-200 rounded-lg"
                        onClick={() => setIsCalendarOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-xs font-semibold px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs"
                        onClick={handleApplyRange}
                        disabled={!tempRange?.from}
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
                      <SelectItem key={y} value={y} className="text-xs cursor-pointer">
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
      {/* 4. 4 TOP KPI CARDS (NET SALES, GROSS PROFIT, NET CASH FLOW, TOTAL ORDERS) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Penjualan Bersih (Net Sales) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[148px]">
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Penjualan Bersih
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  heroKpis.netSalesGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {heroKpis.netSalesGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{heroKpis.netSalesGrowth >= 0 ? `+${heroKpis.netSalesGrowth.toFixed(1)}%` : `${heroKpis.netSalesGrowth.toFixed(1)}%`}</span>
              </div>
            </div>

            {/* Bottom row: Aligned Number (Left) & Sparkline (Right) */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight whitespace-nowrap">
                  {formatRupiah(heroKpis.netSales)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Kotor: {formatRupiah(salesSnapshot.grossSales)}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={heroKpis.netSalesGrowth}
                  isPositive={heroKpis.netSalesGrowth >= 0}
                  metricSeed={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Laba Kotor (Gross Profit) - Subjudul: COGS */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[148px]">
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Laba Kotor
              </span>
              <div
                className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {heroKpis.profitMargin.toFixed(1)}% Margin
              </div>
            </div>

            {/* Bottom row: Aligned Number (Left) & Sparkline (Right) */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight whitespace-nowrap">
                  {formatRupiah(heroKpis.grossProfit)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  COGS: {formatRupiah(financeSnapshot.totalHpp)}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={heroKpis.profitMargin}
                  isPositive={heroKpis.grossProfit >= 0}
                  metricSeed={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Arus Kas Bersih (Net Flow) - Subjudul: Expenses */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[148px]">
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Arus Kas Bersih
              </span>
              <div
                className={cn(
                  "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                  heroKpis.netCashFlow >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {heroKpis.netCashFlow >= 0 ? "Surplus" : "Defisit"}
              </div>
            </div>

            {/* Bottom row: Aligned Number (Left) & Sparkline (Right) */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cn("text-xl sm:text-2xl font-medium tracking-tight whitespace-nowrap", heroKpis.netCashFlow >= 0 ? "text-slate-900" : "text-rose-600")}>
                  {formatRupiah(heroKpis.netCashFlow)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  Expenses: {formatRupiah(financeSnapshot.totalCashOut)}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={cashFlowPercentage}
                  isPositive={heroKpis.netCashFlow >= 0}
                  metricSeed={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Total Pesanan (Orders) - Subjudul: AOV */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between">
          <CardContent className="p-5 flex flex-col justify-between h-full min-h-[148px]">
            {/* Top row: Label & Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Pesanan
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                  heroKpis.ordersGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                )}
              >
                {heroKpis.ordersGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{heroKpis.ordersGrowth >= 0 ? `+${Math.round(heroKpis.ordersGrowth)}%` : `${Math.round(heroKpis.ordersGrowth)}%`}</span>
              </div>
            </div>

            {/* Bottom row: Aligned Number (Left) & Sparkline (Right) */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight whitespace-nowrap">
                  {formatNumber(heroKpis.totalOrders)} <span className="text-sm font-normal text-slate-400">Order</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 whitespace-nowrap truncate">
                  AOV: {formatRupiah(heroKpis.aov)}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <MiniSparkline
                  percentage={heroKpis.ordersGrowth}
                  isPositive={heroKpis.ordersGrowth >= 0}
                  metricSeed={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================== */}
      {/* 5. HERO ROW: SALES CHART (LEFT 8) & TOP MENU (RIGHT 4) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO SALES SPLINE AREA CHART (8 COLS - IMAGE 2 REFERENCE LAYOUT) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            {/* Top Bar Header with Title & Legend */}
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <div className="text-lg font-semibold text-black uppercase tracking-wider">
                  Ringkasan Penjualan
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Realisasi performa omset penjualan bersih outlet
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Puncak: </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {formatRupiah(maxPointSales)}
                  </span>
                </div>
              </div>
            </div>

            {/* Split Body: Left Stats (Image 2 style) & Right Graph */}
            <div className="pt-4 flex flex-col md:flex-row gap-6 items-stretch">
              
              {/* Left Stats Column: Net Sales Big Number + Growth Badge + 3 Metric Rows */}
              <div className="w-full md:w-56 lg:w-60 flex-shrink-0 flex flex-col justify-between py-1  pb-4 md:pb-0 md:pr-4">
                <div>
                  <div className="text-sm font-sans font-medium text-slate-400">
                    Penjualan Bersih
                  </div>
                  <div 
                    className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-1 whitespace-nowrap cursor-default"
                    title={formatRupiah(heroKpis.netSales)}
                  >
                    Rp {formatCompactCurrency(heroKpis.netSales)}
                  </div>
                  <div className="mt-2.5">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ",
                        heroKpis.netSalesGrowth >= 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-700 border border-rose-200/60"
                      )}
                    >
                      {heroKpis.netSalesGrowth >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>
                        {heroKpis.netSalesGrowth >= 0
                          ? `+${heroKpis.netSalesGrowth.toFixed(1)}%`
                          : `${heroKpis.netSalesGrowth.toFixed(1)}%`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">vs lalu</span>
                    </div>
                  </div>
                </div>

                {/* 5 Metric Rows: Net Sales, Laba, Margin, AOV, Top Transaksi */}
                <div className="mt-5 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Net Sales</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(heroKpis.netSales)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Laba Kotor</span>
                    <span className="font-semibold text-emerald-700">
                      {formatRupiah(heroKpis.grossProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Margin</span>
                    <span className="font-semibold text-slate-900">
                      {heroKpis.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">AOV (Rata-rata)</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(heroKpis.aov)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Top Transaksi</span>
                    <span className="font-semibold text-[#0e59f9]">
                      {formatRupiah(heroKpis.highestTransaction || 0)}
                    </span>
                  </div>
                </div>
              </div>              {/* Right Graph Canvas Area - Dynamic Rounded Capsule Bar Chart */}
              <div className="flex-1 min-w-0 relative flex flex-col justify-between">
                {salesSnapshot.miniChartData.length === 0 ? (
                  <div className="h-56 sm:h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    Belum ada data penjualan pada rentang tanggal ini.
                  </div>
                ) : (
                  <div className="relative pt-8 pb-1">
                    {/* Floating Tooltip Overlay directly above hovered bar */}
                    {activeHoverBar && (
                      <div 
                        className="absolute z-30 pointer-events-none top-0 transform -translate-x-1/2 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-xl whitespace-nowrap border border-slate-700/60 transition-all duration-75"
                        style={{ 
                          left: `${Math.max(12, Math.min(88, ((activeHoverBar.idx + 0.5) / barData.length) * 100))}%` 
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span className="w-2 h-2 rounded-full bg-[#0e59f9]" />
                          <span>{formatRupiah(activeHoverBar.netSales)}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">
                          {activeHoverBar.label || activeHoverBar.date} &bull; {activeHoverBar.orders} order
                        </div>
                      </div>
                    )}

                    {/* Chart Plot Frame: Y-Axis + Graph Plot */}
                    <div className="flex items-stretch h-48 sm:h-56">
                      {/* Y-Axis Labels Column */}
                      <div className="w-11 sm:w-12 flex-shrink-0 flex flex-col justify-between items-end pr-2.5 pb-6 select-none text-[10px] font-medium text-slate-400">
                        {yTicks.map((tick, idx) => (
                          <span key={idx} className="leading-none">{tick.label}</span>
                        ))}
                      </div>

                      {/* Graph Area: Horizontal Gridlines + Interactive Bars */}
                      <div className="flex-1 relative pb-6">
                        <div className="relative w-full h-full">
                          {/* 5 Horizontal Gridlines */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {yTicks.map((tick, idx) => (
                              <div key={idx} className="w-full flex items-center">
                                <div
                                  className={cn(
                                    "w-full",
                                    idx === yTicks.length - 1
                                      ? "border-b border-slate-200"
                                      : "border-b border-dashed border-slate-100"
                                  )}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Interactive Capsule Bars Row */}
                          <div className="relative w-full h-full flex items-end justify-between px-1 z-10">
                            {barData.map((bar, idx) => {
                              const isHovered = hoveredPointIndex === idx;
                              const isNonZero = bar.val > 0;
                              const n = barData.length;
                              const dayNum = parseInt(bar.dayLabel, 10);
                              const showDateTick = n <= 14 
                                || idx === 0 
                                || idx === n - 1 
                                || (!isNaN(dayNum) && dayNum % 5 === 0)
                                || isHovered;

                              return (
                                <div
                                  key={bar.date || idx}
                                  className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                                  onMouseEnter={() => setHoveredPointIndex(idx)}
                                  onMouseLeave={() => setHoveredPointIndex(null)}
                                >
                                  {/* Pill Capsule Bar */}
                                  <div
                                    style={{
                                      height: `${bar.heightPercent}%`,
                                      width: `${dynamicBarWidth}px`,
                                      maxWidth: '85%'
                                    }}
                                    className={cn(
                                      "rounded-full transition-all duration-200 relative",
                                      isHovered
                                        ? "bg-[#0e59f9] shadow-[0_4px_14px_rgba(14,89,249,0.38)]"
                                        : isNonZero
                                          ? "bg-[#D8E8FE] group-hover:bg-[#BFDBFE]"
                                          : "bg-slate-200/50"
                                    )}
                                  >
                                    {/* Hover Accent Dot precisely above active bar */}
                                    {isHovered && isNonZero && (
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0e59f9] pointer-events-none transition-transform animate-in fade-in zoom-in duration-150" />
                                    )}
                                  </div>

                                  {/* Date tick label under each bar */}
                                  <div className="absolute -bottom-6 w-full flex justify-center text-center">
                                    {showDateTick && (
                                      <span
                                        className={cn(
                                          "text-[10px] select-none transition-colors duration-150 leading-none whitespace-nowrap",
                                          isHovered
                                            ? "text-[#0e59f9] font-semibold"
                                            : "text-slate-400 font-normal"
                                        )}
                                      >
                                        {bar.dayLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Axis Status Info Row */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 pl-11 sm:pl-12">
                      <span>{salesSnapshot.miniChartData[0]?.label || salesSnapshot.miniChartData[0]?.date}</span>
                      <span className="text-slate-300">
                        {salesSnapshot.miniChartData.length} Titik &bull; {reportPeriod.granularity === "hourly" ? "Jam" : reportPeriod.granularity === "monthly" ? "Bulan" : "Hari"}
                      </span>
                      <span>{salesSnapshot.miniChartData[salesSnapshot.miniChartData.length - 1]?.label || salesSnapshot.miniChartData[salesSnapshot.miniChartData.length - 1]?.date}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Channel Pills (Under Hero Chart) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Channels */}
              {salesSnapshot.channels.map((ch) => (
                <div key={ch.channel} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900 truncate">{ch.channel}</span>
                    <span className="font-semibold text-slate-900">{ch.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-900 mt-1">
                    {formatRupiah(ch.total)}
                  </div>
                  <div className="text-[10px] text-slate-400">{ch.count} transaksi</div>
                </div>
              ))}

              {/* Dominant Payment Method */}
              {salesSnapshot.topPaymentMethods.length > 0 && (
                <div className="p-2.5 rounded-xl border border-[#0e59f9] bg-[#0e59f9] shadow-sm shadow-blue-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white truncate">Metode Pembayaran</span>
                    <span className="font-semibold text-white uppercase tracking-wider">
                      {salesSnapshot.topPaymentMethods[0].method}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-white mt-1">
                    {formatRupiah(salesSnapshot.topPaymentMethods[0].total)}
                  </div>
                  <div className="text-[10px] text-blue-100">
                    {salesSnapshot.topPaymentMethods[0].percentage.toFixed(0)}% dari total masuk
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP MENU TERLARIS (4 COLS - HEATMAP GRADIENT RAMP: DARK BLUE TO GRAY) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Menu Terlaris
                </div>
                <div className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">
                  {formatNumber(totalProductQty)}{" "}
                  <span className="text-xs font-normal text-slate-400">item terjual</span>
                </div>
              </div>
              <Link
                href={`/outlet/${outletKey}/reports/operations`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0e59f9] hover:text-[#0c4cd4] transition-colors"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Ranked Products List with Heatmap Gradient Ramp */}
            <div className="pt-3 space-y-3.5">
              {operationsSnapshot.topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada data menu terjual pada rentang tanggal ini.
                </div>
              ) : (
                operationsSnapshot.topProducts.slice(0, 5).map((item, idx) => {
                  const percentOfTop = Math.max(8, Math.round((item.totalQty / maxProductQty) * 100));
                  const theme = RANK_THEMES[idx] || RANK_THEMES[RANK_THEMES.length - 1];

                  return (
                    <div key={item.id || item.name} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 transition-colors",
                              theme.badge
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-900 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="font-semibold text-slate-900 font-sans text-[11px]">
                            {formatRupiah(item.totalRevenue)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({item.totalQty})
                          </span>
                        </div>
                      </div>

                      {/* Heatmap-Style Progress Bar Ramp */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            theme.bar
                          )}
                          style={{ width: `${percentOfTop}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Metrics Strip: AOV & Top Transaksi (Fills empty space) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl border border-slate-100 bg-[#F9FBFF]">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                  Rata-Rata Order (AOV)
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 font-sans tracking-tight mt-0.5">
                  {formatRupiah(heroKpis.aov)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Per tiket transaksi
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-100/70 bg-blue-50/30">
                <div className="text-[10px] font-medium text-[#0e59f9] uppercase tracking-wider truncate">
                  Top Transaksi
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#0e59f9] font-sans tracking-tight mt-0.5">
                  {formatRupiah(heroKpis.highestTransaction || 0)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Pesanan nominal tertinggi
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Hari tersibuk: <strong className="font-medium text-slate-700">{operationsSnapshot.busiestDay.dayName}</strong></span>
            <span>Jam tersibuk: <strong className="font-medium text-slate-700">{operationsSnapshot.busiestHour.label}</strong></span>
          </div>
        </div>

      </div>

      {/* ==================================================== */}
      {/* 6. PEAK HOURS HEATMAP (FULL WIDTH - 12 COLS) */}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pola Jam & Hari Ramai
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight mt-0.5">
              Peak Hours Heatmap (24 Jam &times; 7 Hari)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jam tersibuk: {heroKpis.busiestDayName} pukul {heroKpis.busiestHourLabel} ({heroKpis.busiestHourOrders} pesanan)
            </p>
          </div>

          {/* Hover detail preview if any cell active */}
          {hoveredHeatmapCell ? (
            <div className="text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 text-blue-900">
              <span className="font-semibold">{hoveredHeatmapCell.dayName} {hoveredHeatmapCell.hourLabel}</span>:{" "}
              <span>{hoveredHeatmapCell.orderCount} pesanan</span> ({formatRupiah(hoveredHeatmapCell.revenue)})
            </div>
          ) : (
            <div className="text-xs text-slate-400 hidden sm:block">
              Arahkan kursor pada kotak untuk melihat rincian jam
            </div>
          )}
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto pb-2 select-none scrollbar-thin scrollbar-thumb-slate-200">
          <div className="min-w-[800px]">
            {/* Hour Columns Headers (12 AM to 11 PM) */}
            <div className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 mb-1.5 items-center">
              <div className="text-[10px] font-medium text-slate-400 text-center">Hari</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const label = h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
                return (
                  <div
                    key={h}
                    className="text-[9px] font-mono text-slate-400 text-center truncate"
                    title={`${h}:00`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Rows (Mon to Sun) */}
            <div className="space-y-1">
              {heatmapGrid.map((row) => (
                <div
                  key={row.dayIndex}
                  className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 items-center"
                >
                  {/* Day Label */}
                  <div className="text-xs font-medium text-slate-700 px-1 truncate">
                    {row.dayLabel}
                  </div>

                  {/* 24 Cells */}
                  {row.hours.map((cell) => {
                    const isBusiest = cell.orderCount > 0 && cell.orderCount === operationsSnapshot.busiestHour.orderCount;
                    return (
                      <div
                        key={cell.hour}
                        onMouseEnter={() =>
                          setHoveredHeatmapCell({
                            dayName: row.dayFullName,
                            hourLabel: cell.hourLabel,
                            orderCount: cell.orderCount,
                            revenue: cell.revenue,
                          })
                        }
                        onMouseLeave={() => setHoveredHeatmapCell(null)}
                        className={cn(
                          "h-7 sm:h-8 rounded-[3px] flex items-center justify-center text-[10px] transition-all duration-150 cursor-pointer relative",
                          getCellColor(cell.orderCount),
                          isBusiest && "ring-2 ring-blue-400/80"
                        )}
                        title={`${row.dayFullName} ${cell.hourLabel}: ${cell.orderCount} pesanan`}
                      >
                        {cell.orderCount > 0 ? cell.orderCount : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-2 mt-3 text-[11px] text-slate-400">
              <span>Sepi</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-[2px] bg-[#F4F7FC] border border-slate-200" />
                <span className="w-3 h-3 rounded-[2px] bg-blue-100 border border-blue-200" />
                <span className="w-3 h-3 rounded-[2px] bg-blue-300" />
                <span className="w-3 h-3 rounded-[2px] bg-blue-500" />
                <span className="w-3 h-3 rounded-[2px] bg-[#0e59f9]" />
                <span className="w-3 h-3 rounded-[2px] bg-[#083cb0]" />
              </div>
              <span>Ramai</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. BOTTOM ROW: CASH LIQUIDITY (6) & PROFIT GAUGE (6) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: DUAL RATIO BAR (CASH LIQUIDITY) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Distribusi Likuiditas Kas
                </div>
                <div className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">
                  {formatRupiah(heroKpis.netCashFlow)}{" "}
                  <span className="text-xs font-normal text-slate-400">saldo bersih</span>
                </div>
              </div>
              <Link
                href={`/outlet/${outletKey}/reports/finance`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0e59f9] hover:text-[#0c4cd4] transition-colors"
              >
                <span>Buku Kas</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Dual Ratio Bar */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Alokasi Saldo Riil:</span>
                <span className="font-medium text-slate-700">Laci {cashRatio}% &bull; Digital {digitalRatio}%</span>
              </div>

              {/* Horizontal Comparative Bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${cashRatio}%` }}
                  title={`Kas Laci: ${cashRatio}%`}
                />
                <div
                  className="h-full bg-[#0e59f9] transition-all duration-500"
                  style={{ width: `${digitalRatio}%` }}
                  title={`Rekening Digital: ${digitalRatio}%`}
                />
              </div>

              {/* 2 Columns: Laci vs Bank */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Kas Fisik Laci Toko</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 font-mono">
                    {formatRupiah(financeSnapshot.drawerNetFlow)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Penjualan tunai - modal &amp; biaya
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#0e59f9]" />
                    <span>QRIS Dinamis</span>
                  </div>
                  <div className="text-sm font-semibold text-[#0e59f9] font-mono">
                    {formatRupiah(financeSnapshot.digitalNetFlow)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Settlement digital non-tunai
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kas Masuk: <strong className="font-medium text-emerald-600">{formatRupiah(financeSnapshot.totalCashIn)}</strong></span>
            <span>Kas Keluar: <strong className="font-medium text-rose-600">{formatRupiah(financeSnapshot.totalCashOut)}</strong></span>
          </div>
        </div>

        {/* CARD 2: SPEEDOMETER ARC GAUGE (PROFIT MARGIN) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Efisiensi Margin Laba
                </div>
                <div className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">
                  {formatRupiah(heroKpis.grossProfit)}{" "}
                  <span className="text-xs font-normal text-slate-400">laba kotor</span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    heroKpis.profitMargin >= 50
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : heroKpis.profitMargin >= 30
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {heroKpis.profitMargin >= 50 ? "Margin Sehat" : heroKpis.profitMargin >= 30 ? "Margin Cukup" : "Perlu Evaluasi"}
                </span>
              </div>
            </div>

            {/* Speedometer Radial Arc Visualization */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <SpeedometerGauge percentage={heroKpis.profitMargin} />

              {/* Profitability Details */}
              <div className="w-full grid grid-cols-2 gap-3 pt-3">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                  <div className="text-[10px] text-slate-400">Estimasi Laba Kotor</div>
                  <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">
                    {formatRupiah(heroKpis.grossProfit)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                  <div className="text-[10px] text-slate-400">Modal HPP Bahan Resep</div>
                  <div className="text-xs font-semibold text-slate-600 font-mono mt-0.5">
                    {formatRupiah(financeSnapshot.totalHpp)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target Sehat: &gt; 50%</span>
            <span>Shift: {financeSnapshot.activeShift ? financeSnapshot.activeShift.cashierName : 'Tidak ada shift aktif'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

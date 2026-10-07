"use client";

import * as React from "react";
import {
  Clock,
  CalendarDays,
  Store,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Activity,
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
import { getOperationsReport, ReportPeriod } from "@/lib/actions/reports";
import { PeakHoursHeatmap } from "./peak-hours-heatmap";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type OperationsReportData = NonNullable<Awaited<ReturnType<typeof getOperationsReport>>["data"]>;

interface OperationsReportClientProps {
  initialData: OperationsReportData;
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

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
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

export function OperationsReportClient({ initialData, outletKey }: OperationsReportClientProps) {
  const [data, setData] = React.useState<OperationsReportData>(initialData);
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

  // Interactive hover states
  const [hourlyHoveredIndex, setHourlyHoveredIndex] = React.useState<number | null>(null);
  const [dayHoveredIndex, setDayHoveredIndex] = React.useState<number | null>(null);

  // Chart entrance observers
  const hourlyChartRef = React.useRef<HTMLDivElement>(null);
  const [isHourlyInView, setIsHourlyInView] = React.useState(false);
  const [isHourlyAnimated, setIsHourlyAnimated] = React.useState(false);

  const dayChartRef = React.useRef<HTMLDivElement>(null);
  const [isDayInView, setIsDayInView] = React.useState(false);
  const [isDayAnimated, setIsDayAnimated] = React.useState(false);

  React.useEffect(() => {
    const el = hourlyChartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsHourlyInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsHourlyInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isHourlyInView) {
      setIsHourlyAnimated(false);
      return;
    }
    setIsHourlyAnimated(false);
    const timer = setTimeout(() => {
      setIsHourlyAnimated(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [isHourlyInView, data.hourlyDistribution]);

  React.useEffect(() => {
    const el = dayChartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsDayInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsDayInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isDayInView) {
      setIsDayAnimated(false);
      return;
    }
    setIsDayAnimated(false);
    const timer = setTimeout(() => {
      setIsDayAnimated(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [isDayInView, data.dayDistribution]);

  // Data loader
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
    loadData("yearly", `${val}-01-01`, `${val}-12-31`);
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

  const hasCustomDate = Boolean(customRange?.from);

  // Export Excel Multi-sheet
  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Ringkasan Indikator
      const summaryRows = [
        { Indikator: "Outlet", Nilai: data.tenant.name },
        { Indikator: "Rentang Waktu", Nilai: `${data.period.formattedStart} - ${data.period.formattedEnd}` },
        { Indikator: "Total Pesanan", Nilai: data.summary?.totalOrders || 0 },
        { Indikator: "Total Omset (Rp)", Nilai: data.summary?.totalRevenue || 0 },
        { Indikator: "Jam Tersibuk", Nilai: `${data.peakKpis.busiestHour.label} (${data.peakKpis.busiestHour.orderCount} pesanan)` },
        { Indikator: "Jam Tersepi", Nilai: `${data.peakKpis.slowestHour.label} (${data.peakKpis.slowestHour.orderCount} pesanan)` },
        { Indikator: "Hari Tersibuk", Nilai: `${data.peakKpis.busiestDay.dayName} (Rp ${data.peakKpis.busiestDay.revenue.toLocaleString("id-ID")})` },
        { Indikator: "Hari Tersepi", Nilai: `${data.peakKpis.slowestDay.dayName} (Rp ${data.peakKpis.slowestDay.revenue.toLocaleString("id-ID")})` },
        { Indikator: "Rata-Rata Order/Jam", Nilai: (data.summary?.avgHourlyOrders || 0).toFixed(1) },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan Operasional");

      // Sheet 2: Distribusi 24 Jam
      const hourlyRows = data.hourlyDistribution.map((h) => ({
        Jam: h.label,
        "Jumlah Pesanan": h.orderCount,
        "Omset (Rp)": h.revenue,
      }));
      const hourlySheet = XLSX.utils.json_to_sheet(hourlyRows);
      XLSX.utils.book_append_sheet(workbook, hourlySheet, "Pesanan per Jam");

      // Sheet 3: Distribusi 7 Hari
      const dayRows = data.dayDistribution.map((d) => ({
        Hari: d.dayFullName,
        "Jumlah Pesanan": d.orderCount,
        "Omset (Rp)": d.revenue,
      }));
      const daySheet = XLSX.utils.json_to_sheet(dayRows);
      XLSX.utils.book_append_sheet(workbook, daySheet, "Omset per Hari");

      const fileName = `Laporan_Operasional_${data.tenant.name.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("File Excel operasional berhasil diunduh.");
    } catch (e) {
      toast.error("Gagal mengekspor file Excel.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    heatmapGrid,
    peakKpis,
    hourlyDistribution,
    dayDistribution,
    period: reportPeriod,
    tenant,
    summary,
  } = data;

  // Real trend arrays for sparklines
  const hourlyOrdersTrend = React.useMemo(() => hourlyDistribution.map((h) => h.orderCount), [hourlyDistribution]);
  const dayRevenueTrend = React.useMemo(() => dayDistribution.map((d) => d.revenue), [dayDistribution]);
  const dayOrdersTrend = React.useMemo(() => dayDistribution.map((d) => d.orderCount), [dayDistribution]);

  // Scaled calculations for Hourly Capsule Bars
  const maxHourlyOrders = React.useMemo(() => Math.max(...hourlyDistribution.map((h) => h.orderCount), 1), [hourlyDistribution]);
  const hourlyYTicks = React.useMemo(() => {
    const step = maxHourlyOrders / 4;
    return [
      { val: maxHourlyOrders, label: formatNumber(maxHourlyOrders) },
      { val: Math.round(step * 3), label: formatNumber(Math.round(step * 3)) },
      { val: Math.round(step * 2), label: formatNumber(Math.round(step * 2)) },
      { val: Math.round(step * 1), label: formatNumber(Math.round(step * 1)) },
      { val: 0, label: "0" },
    ];
  }, [maxHourlyOrders]);

  // Scaled calculations for Day Capsule Bars
  const maxDayRevenue = React.useMemo(() => Math.max(...dayDistribution.map((d) => d.revenue), 1000), [dayDistribution]);
  const dayYTicks = React.useMemo(() => {
    const step = maxDayRevenue / 4;
    return [
      { val: maxDayRevenue, label: formatCompactRupiah(maxDayRevenue) },
      { val: step * 3, label: formatCompactRupiah(step * 3) },
      { val: step * 2, label: formatCompactRupiah(step * 2) },
      { val: step * 1, label: formatCompactRupiah(step * 1) },
      { val: 0, label: "0" },
    ];
  }, [maxDayRevenue]);

  const activeHoverHour = hourlyHoveredIndex !== null ? hourlyDistribution[hourlyHoveredIndex] : null;
  const activeHoverDay = dayHoveredIndex !== null ? dayDistribution[dayHoveredIndex] : null;

  return (
    <div className="space-y-6 print:p-0">
      {/* ==================================================== */}
      {/* 1. PRINT HEADER (VISIBLE ONLY ON PRINT) */}
      {/* ==================================================== */}
      <div className="hidden print:flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-slate-900">{tenant.name}</h1>
          <p className="text-xs text-slate-600">Laporan Analisis Operasional, Heatmap Peak Hours &amp; Menu</p>
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
            Analisis Operasional &bull; {tenant.name}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-0.5">
            Operasional &amp; Peak Hours
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {formatNumber(summary?.totalOrders || 0)} transaksi 
           
          </p>
        </div>

        {/* Action Buttons: Export & Print */}
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
      {/* Identical standard to /reports and /reports/sales */}
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
                    loadData(
                      "custom",
                      format(customRange.from, "yyyy-MM-dd"),
                      format(customRange.to || customRange.from, "yyyy-MM-dd")
                    );
                  } else {
                    loadData("daily", todayDateStr, todayDateStr);
                  }
                } else if (currentTab === "bulanan") {
                  const [y, m] = monthParam.split("-").map(Number);
                  loadData(
                    "monthly",
                    format(new Date(y, m - 1, 1), "yyyy-MM-dd"),
                    format(new Date(y, m, 0), "yyyy-MM-dd")
                  );
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
      {/* 4. 4 TOP KPI CARDS (HIGH DATA-INK, SPARKLINE & BADGES) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Jam Tersibuk (Peak Hour) - Hero Blue Card */}
        <Card className="border border-[#0e59f9] shadow-md shadow-blue-500/20 rounded-2xl bg-[#0e59f9] text-white hover:shadow-blue-500/30 transition-all flex flex-col justify-between overflow-hidden min-h-[190px]">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
            {/* Top row: Title on left, Icon on right */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider block pt-0.5">
                Jam Tersibuk (Peak)
              </span>
              <div className="w-10 h-10 rounded-full bg-white text-[#0e59f9] flex items-center justify-center shadow-xs flex-shrink-0">
                <Clock className="w-5 h-5 text-[#0e59f9]" />
              </div>
            </div>

            {/* Bottom row: Value & subtext on left, Sparkline on right */}
            <div className="mt-8 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-white tracking-tight whitespace-nowrap">
                  {peakKpis.busiestHour.label}
                </div>
                <div className="text-[11px] text-white/80 mt-1 truncate">
                  {peakKpis.busiestHour.orderCount} order &bull; {formatRupiah(peakKpis.busiestHour.revenue)}
                </div>
              </div>
              <div className="flex-shrink-0 pb-0.5">
                <MiniSparkline
                  data={hourlyOrdersTrend}
                  metricSeed={1}
                  color="#ffffff"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Hari Tersibuk (Busiest Day) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[190px]">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
            {/* Top row: Title on left, Icon on right */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block pt-0.5">
                Hari Tersibuk
              </span>
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Bottom row: Value & subtext on left, Sparkline on right */}
            <div className="mt-8 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {peakKpis.busiestDay.dayName}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {peakKpis.busiestDay.orderCount} order &bull; {formatKpiCurrency(peakKpis.busiestDay.revenue)}
                </div>
              </div>
              <div className="flex-shrink-0 pb-0.5">
                <MiniSparkline
                  data={dayRevenueTrend}
                  percentage={peakKpis.busiestDay.growth}
                  isPositive={(peakKpis.busiestDay.growth || 0) >= 0}
                  metricSeed={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Rata-Rata Order / Jam (Hourly Velocity) */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[190px]">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
            {/* Top row: Title on left, Icon on right */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block pt-0.5">
                Rata-Rata Order / Jam
              </span>
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Bottom row: Value & subtext on left, Sparkline on right */}
            <div className="mt-8 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {(summary?.avgHourlyOrders || 0).toFixed(1)}{" "}
                  <span className="text-sm font-normal text-slate-400">Order/Jam</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  Kecepatan rata-rata 24 jam operasional
                </div>
              </div>
              <div className="flex-shrink-0 pb-0.5">
                <MiniSparkline
                  data={hourlyOrdersTrend}
                  percentage={summary?.avgHourlyOrdersGrowth}
                  isPositive={(summary?.avgHourlyOrdersGrowth || 0) >= 0}
                  metricSeed={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Total Volume Transaksi */}
        <Card className="border border-[#EAEFF8] shadow-sm rounded-2xl bg-white hover:border-[#d7e2f5] transition-all flex flex-col justify-between overflow-hidden min-h-[190px]">
          <CardContent className="p-5 sm:p-6 flex flex-col justify-between flex-1 h-full">
            {/* Top row: Title on left, Icon on right */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block pt-0.5">
                Total Volume Pesanan
              </span>
              <div className="w-10 h-10 rounded-full bg-[#0e59f9] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Bottom row: Value & subtext on left, Sparkline on right */}
            <div className="mt-8 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                  {formatNumber(summary?.totalOrders || 0)}{" "}
                  <span className="text-sm font-normal text-slate-400">Order</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  Omset: {formatKpiCurrency(summary?.totalRevenue || 0)}
                </div>
              </div>
              <div className="flex-shrink-0 pb-0.5">
                <MiniSparkline
                  data={dayOrdersTrend}
                  percentage={summary?.totalOrdersGrowth}
                  isPositive={(summary?.totalOrdersGrowth || 0) >= 0}
                  metricSeed={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================== */}
      {/* 5. MAIN ORDERS HEATMAP WEEKLY (FULL WIDTH - 12 COLS) */}
      {/* 100% font-sans, viewport-triggered, refined blue scale */}
      {/* ==================================================== */}
      <PeakHoursHeatmap
        grid={heatmapGrid}
        busiestHourLabel={peakKpis.busiestHour.label}
        busiestHourOrders={peakKpis.busiestHour.orderCount}
        busiestHourRevenue={peakKpis.busiestHour.revenue}
        busiestDayName={peakKpis.busiestDay.dayName}
      />

      {/* ==================================================== */}
      {/* 6. CHARTS ROW: DISTRIBUSI 24 JAM & OMSET PER HARI (SEJAJAR) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 Cols): Distribusi Pesanan 24 Jam (Rounded Capsule Bar Chart) */}
        <div
          ref={hourlyChartRef}
          className="lg:col-span-7 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  
                  Distribusi Pesanan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi Pesanan Dalam 
                </p>
              </div>

              {/* Active Hour preview badge */}
              {activeHoverHour ? (
                <div className="text-xs  rounded-xl px-3 py-1 font-sans self-start sm:self-auto">
                  <span className="font-semibold text-slate-900">{activeHoverHour.label}</span>:{" "}
                  <strong className="text-slate-900 font-semibold">{activeHoverHour.orderCount} pesanan</strong> ({formatRupiah(activeHoverHour.revenue)})
                </div>
              ) : (
                <div className="text-xs text-slate-400 hidden sm:block">
                  Arahkan kursor pada batang untuk melihat rincian jam
                </div>
              )}
            </div>

            {/* Split Content: Left Summary Pill & Right Capsule Bars */}
            <div className="pt-4 flex flex-col md:flex-row gap-5 items-stretch">
              {/* Left Stat Column */}
              <div className="w-full md:w-44 lg:w-48 flex-shrink-0 flex flex-col justify-between py-1 pb-3 md:pb-0 md:pr-4">
                <div>
                  <div className="text-xs font-sans font-medium text-slate-400">
                    Puncak Tertinggi
                  </div>
                  <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-1 whitespace-nowrap">
                    {peakKpis.busiestHour.orderCount}{" "}
                    <span className="text-sm font-normal text-slate-400">Pesanan</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-salte-900  rounded-xl py-1 inline-block">
                    Pukul {peakKpis.busiestHour.label}
                  </div>
                </div>

                <div className="mt-4 pt-3 space-y-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Jam Tersepi</span>
                    <span className="font-semibold text-slate-700">{peakKpis.slowestHour.label}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Pesanan Tersepi</span>
                    <span className="font-semibold text-slate-700">{peakKpis.slowestHour.orderCount} Order</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rata-Rata/Jam</span>
                    <span className="font-semibold text-slate-700">{(summary?.avgHourlyOrders || 0).toFixed(1)} Order</span>
                  </div>
                </div>
              </div>

              {/* Right Graph Canvas Area: 24 Capsule Bars */}
              <div className="flex-1 min-w-0 relative flex flex-col justify-between pt-1">
                {/* Floating Tooltip */}
                {activeHoverHour && (
                  <div
                    className="absolute z-30 pointer-events-none top-0 transform -translate-x-1/2 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-xl whitespace-nowrap border border-slate-700/60 transition-all duration-75"
                    style={{
                      left: `${Math.max(10, Math.min(90, ((activeHoverHour.hour + 0.5) / 24) * 100))}%`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <span className="w-2 h-2 rounded-full bg-[#0e59f9]" />
                      <span>{activeHoverHour.orderCount} Pesanan</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      Pukul {activeHoverHour.label} &bull; {formatRupiah(activeHoverHour.revenue)}
                    </div>
                  </div>
                )}

                {/* Graph Frame: Y-Axis + 24 Bars */}
                <div className="flex items-stretch h-44 sm:h-48">
                  {/* Y-Axis Column */}
                  <div className="w-9 sm:w-10 flex-shrink-0 flex flex-col justify-between items-end pr-2 pb-6 select-none text-[10px] font-sans font-medium text-slate-400">
                    {hourlyYTicks.map((tick, idx) => (
                      <span key={idx} className="leading-none">{tick.label}</span>
                    ))}
                  </div>

                  {/* Graph Canvas */}
                  <div className="flex-1 relative pb-6">
                    <div className="relative w-full h-full">
                      {/* Dotted Gridlines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {hourlyYTicks.map((tick, idx) => (
                          <div key={idx} className="w-full flex items-center">
                            <div
                              className={cn(
                                "w-full",
                                idx === hourlyYTicks.length - 1
                                  ? "border-b border-slate-200"
                                  : "border-b border-dashed border-slate-100"
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      {/* 24 Interactive Capsule Bars */}
                      <div className="relative w-full h-full flex items-end justify-between px-0.5 sm:px-1 z-10 gap-0.5 sm:gap-1">
                        {hourlyDistribution.map((h, idx) => {
                          const isHovered = hourlyHoveredIndex === idx;
                          const isPeak = h.orderCount === peakKpis.busiestHour.orderCount && h.orderCount > 0;
                          const heightRatio = maxHourlyOrders > 0 ? (h.orderCount / maxHourlyOrders) * 100 : 0;
                          const barHeight = isHourlyAnimated ? (h.orderCount > 0 ? Math.max(6, heightRatio) : 3) : 0;

                          return (
                            <div
                              key={h.hour}
                              className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                              onMouseEnter={() => setHourlyHoveredIndex(idx)}
                              onMouseLeave={() => setHourlyHoveredIndex(null)}
                            >
                              {/* Hover Accent Dot */}
                              {isHovered && (
                                <div className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-[#0e59f9] shadow-xs animate-pulse" />
                              )}

                              {/* Capsule Bar with Dome Arch Top */}
                              <div
                                style={{
                                  height: `${barHeight}%`,
                                  width: "100%",
                                  maxWidth: "16px",
                                  transition: isHourlyAnimated
                                    ? `height 750ms cubic-bezier(0.23, 1, 0.32, 1) ${Math.min(idx * 20, 260)}ms, background-color 200ms ease, box-shadow 200ms ease`
                                    : "none",
                                }}
                                className={cn(
                                  "rounded-t-full rounded-b-none relative",
                                  isHovered
                                    ? "bg-[#0e59f9] shadow-[0_4px_14px_rgba(14,89,249,0.38)]"
                                    : isPeak
                                      ? "bg-[#0e59f9]/90 shadow-xs"
                                      : h.orderCount > 0
                                        ? "bg-[#D8E8FE] group-hover:bg-[#BFDBFE]"
                                        : "bg-slate-200/50"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* X-Axis Hour Labels Row (Strictly font-sans) */}
                <div className="flex pl-9 sm:pl-10 pr-0.5 sm:pr-1 pt-1 select-none">
                  {hourlyDistribution.map((h, idx) => {
                    const isLabelHour = h.hour % 3 === 0;
                    const isHovered = hourlyHoveredIndex === idx;
                    const labelText = h.hour === 0
                      ? "12AM"
                      : h.hour < 12
                        ? `${h.hour}AM`
                        : h.hour === 12
                          ? "12PM"
                          : `${h.hour - 12}PM`;

                    return (
                      <div key={h.hour} className="flex-1 text-center">
                        {isLabelHour || isHovered ? (
                          <span
                            className={cn(
                              "text-[9px] font-sans block truncate transition-colors",
                              isHovered ? "text-[#0e59f9] font-semibold" : "text-slate-400"
                            )}
                          >
                            {labelText}
                          </span>
                        ) : (
                          <span className="text-[9px] block h-3 opacity-0">&nbsp;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pagi (06:00 - 11:00)</span>
            <span>Siang (11:00 - 15:00)</span>
            <span>Sore (15:00 - 18:00)</span>
            <span>Malam (18:00 - 23:00)</span>
          </div>
        </div>

        {/* Right Column (5 Cols): Omset per Hari (Senin — Minggu) */}
        <div
          ref={dayChartRef}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  
                  Omset per Hari
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbandingan perolehan omset harian
                </p>
              </div>

              <div className="text-xs">
                <span className="font-semibold text-slate-900">
                  {activeHoverDay ? activeHoverDay.dayFullName : peakKpis.busiestDay.dayName}
                </span>
                <span className="text-slate-400 mx-1">:</span>
                <span
                  className={cn(
                    "font-semibold",
                    activeHoverDay ? "text-[#0e59f9]" : "text-slate-700"
                  )}
                >
                  {formatRupiah(activeHoverDay ? activeHoverDay.revenue : peakKpis.busiestDay.revenue)}
                </span>
              </div>
            </div>

            {/* Capsule Bars for 7 Days */}
            <div className="pt-5 flex items-stretch h-48 sm:h-52">
              {/* Y-Axis */}
              <div className="w-10 sm:w-12 flex-shrink-0 flex flex-col justify-between items-end pr-2 pb-6 select-none text-[10px] font-sans font-medium text-slate-400">
                {dayYTicks.map((tick, idx) => (
                  <span key={idx} className="leading-none">{tick.label}</span>
                ))}
              </div>

              {/* Bars Canvas */}
              <div className="flex-1 relative pb-6">
                <div className="relative w-full h-full">
                  {/* Gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {dayYTicks.map((tick, idx) => (
                      <div key={idx} className="w-full flex items-center">
                        <div
                          className={cn(
                            "w-full",
                            idx === dayYTicks.length - 1
                              ? "border-b border-slate-200"
                              : "border-b border-dashed border-slate-100"
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 7 Bars */}
                  <div className="relative w-full h-full flex items-end justify-between px-2 z-10 gap-2 sm:gap-3">
                    {dayDistribution.map((d, idx) => {
                      const isHovered = dayHoveredIndex === idx;
                      const isBusiest = d.dayIndex === peakKpis.busiestDay.dayIndex && d.revenue > 0;
                      const heightRatio = maxDayRevenue > 0 ? (d.revenue / maxDayRevenue) * 100 : 0;
                      const barHeight = isDayAnimated ? (d.revenue > 0 ? Math.max(8, heightRatio) : 4) : 0;

                      return (
                        <div
                          key={d.dayIndex}
                          className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                          onMouseEnter={() => setDayHoveredIndex(idx)}
                          onMouseLeave={() => setDayHoveredIndex(null)}
                        >
                          {/* Accent dot on hover */}
                          {isHovered && (
                            <div className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-[#0e59f9] shadow-xs animate-pulse" />
                          )}

                          {/* Capsule Bar with Dome Arch Top */}
                          <div
                            style={{
                              height: `${barHeight}%`,
                              width: "100%",
                              maxWidth: "36px",
                              transition: isDayAnimated
                                ? `height 750ms cubic-bezier(0.23, 1, 0.32, 1) ${idx * 40}ms, background-color 200ms ease, box-shadow 200ms ease`
                                : "none",
                            }}
                            className={cn(
                              "rounded-t-full rounded-b-none relative",
                              isHovered
                                ? "bg-[#0e59f9] shadow-[0_4px_14px_rgba(14,89,249,0.38)]"
                                : isBusiest
                                  ? "bg-[#0e59f9] shadow-xs"
                                  : d.revenue > 0
                                    ? "bg-[#D8E8FE] group-hover:bg-[#BFDBFE]"
                                    : "bg-slate-200/50"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Day Labels Row */}
            <div className="flex pl-10 sm:pl-12 pr-2 select-none">
              {dayDistribution.map((d, idx) => {
                const isHovered = dayHoveredIndex === idx;
                const isBusiest = d.dayIndex === peakKpis.busiestDay.dayIndex;
                return (
                  <div key={d.dayIndex} className="flex-1 text-center">
                    <span
                      className={cn(
                        "text-[11px] font-sans block truncate transition-colors",
                        isHovered
                          ? "text-[#0e59f9] font-semibold"
                          : isBusiest
                            ? "text-slate-900 font-semibold"
                            : "text-slate-500 font-medium"
                      )}
                    >
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hari tersibuk: <strong className="text-slate-900 font-semibold">{peakKpis.busiestDay.dayName}</strong></span>
            <span>Total Mingguan: <strong className="text-slate-900 font-semibold">{formatKpiCurrency(summary?.totalRevenue || 0)}</strong></span>
          </div>
        </div>
x``      </div>
    </div>
  );
}

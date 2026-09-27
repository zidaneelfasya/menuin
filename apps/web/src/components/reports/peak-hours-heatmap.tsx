"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Moon, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Info,
  CalendarDays,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HeatmapHourCell = {
  hour: number;
  hourLabel: string;
  orderCount: number;
  revenue: number;
};

export type HeatmapDayRow = {
  dayIndex: number;
  dayLabel: string;
  dayFullName: string;
  hours: HeatmapHourCell[];
};

export type PeakKpiData = {
  busiestHour: { hour: number; label: string; orderCount: number; revenue: number };
  slowestHour: { hour: number; label: string; orderCount: number; revenue: number };
  busiestDay: { dayIndex: number; dayName: string; orderCount: number; revenue: number };
  slowestDay: { dayIndex: number; dayName: string; orderCount: number; revenue: number };
};

interface PeakHoursHeatmapProps {
  grid: HeatmapDayRow[];
  peakKpis: PeakKpiData;
  hourlyDistribution: { hour: number; label: string; orderCount: number; revenue: number }[];
  dayDistribution: { dayIndex: number; dayLabel: string; dayFullName: string; orderCount: number; revenue: number }[];
}

export function PeakHoursHeatmap({
  grid,
  peakKpis,
  hourlyDistribution,
  dayDistribution,
}: PeakHoursHeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{
    dayName: string;
    hourLabel: string;
    orderCount: number;
    revenue: number;
  } | null>(null);

  // Find max orders in a single cell for shading normalization
  let maxCellOrders = 1;
  grid.forEach((row) => {
    row.hours.forEach((cell) => {
      if (cell.orderCount > maxCellOrders) maxCellOrders = cell.orderCount;
    });
  });

  // Calculate max for sub-charts
  const maxHourlyOrders = Math.max(...hourlyDistribution.map((h) => h.orderCount), 1);
  const maxDayRevenue = Math.max(...dayDistribution.map((d) => d.revenue), 1000);

  // Heatmap cell color generator based on Reference 1 blue tones
  const getCellColor = (count: number) => {
    if (count === 0) return "bg-[#F4F7FC]/80 text-transparent border border-slate-100/60";
    const ratio = count / maxCellOrders;
    if (ratio <= 0.15) return "bg-blue-100/90 text-blue-900 border border-blue-200/50";
    if (ratio <= 0.35) return "bg-blue-300 text-blue-950 font-medium border border-blue-400/40";
    if (ratio <= 0.6) return "bg-blue-500 text-white font-medium border border-blue-600/40";
    if (ratio <= 0.85) return "bg-[#0e59f9] text-white font-semibold shadow-xs";
    return "bg-[#083cb0] text-white font-semibold shadow-sm";
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards (Directly matching Reference 1 header cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busiest Hour */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#0e59f9]" />
              Jam Tersibuk (Busiest Hour)
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-[#0e59f9]">
              {peakKpis.busiestHour.label}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {peakKpis.busiestHour.orderCount} total pesanan &bull; Rp {peakKpis.busiestHour.revenue.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Slowest Hour */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-slate-400" />
              Jam Tersepi (Slowest Hour)
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-700">
              {peakKpis.slowestHour.label}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {peakKpis.slowestHour.orderCount} total pesanan
            </div>
          </div>
        </div>

        {/* Busiest Day */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-emerald-600" />
              Hari Tersibuk (Busiest Day)
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-emerald-600">
              {peakKpis.busiestDay.dayName}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Rp {peakKpis.busiestDay.revenue.toLocaleString("id-ID")} &bull; {peakKpis.busiestDay.orderCount} order
            </div>
          </div>
        </div>

        {/* Slowest Day */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              Hari Tersepi (Slowest Day)
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-rose-600">
              {peakKpis.slowestDay.dayName}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Rp {peakKpis.slowestDay.revenue.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>

      {/* Main Heatmap Section: Orders Heatmap — Day of Week × Hour */}
      <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0e59f9]" />
              Orders Heatmap Weekly
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifikasi jam dan hari dengan densitas pesanan tertinggi untuk penataan jadwal tim kasir & dapur
            </p>
          </div>

          {/* Hover detail preview if any cell active */}
          {hoveredCell && (
            <div className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 text-blue-900">
              {hoveredCell.dayName} {hoveredCell.hourLabel}:{" "}
              <strong>{hoveredCell.orderCount} pesanan</strong> (Rp {hoveredCell.revenue.toLocaleString("id-ID")})
            </div>
          )}
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto pb-2 select-none scrollbar-thin scrollbar-thumb-slate-200">
          <div className="min-w-[840px]">
            {/* Hour Columns Headers (12 AM to 11 PM) */}
            <div className="grid grid-cols-[64px_repeat(24,1fr)] gap-1 mb-1.5 items-center">
              <div className="text-[11px] font-semibold text-slate-400 text-center">Hari</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
                return (
                  <div
                    key={h}
                    className="text-[9px] sm:text-[10px] font-mono text-slate-500 text-center truncate"
                    title={`${h}:00 (${label})`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Rows (Mon to Sun) */}
            <div className="space-y-1">
              {grid.map((row) => (
                <div
                  key={row.dayIndex}
                  className="grid grid-cols-[64px_repeat(24,1fr)] gap-1 items-center"
                >
                  {/* Day Label (Sen, Sel, Rab, Kam, Jum, Sab, Min) */}
                  <div className="text-xs font-semibold text-slate-700 px-1 truncate">
                    {row.dayLabel}
                  </div>

                  {/* 24 Cells */}
                  {row.hours.map((cell) => {
                    const isBusiest = cell.orderCount > 0 && cell.orderCount === peakKpis.busiestHour.orderCount;
                    return (
                      <div
                        key={cell.hour}
                        onMouseEnter={() =>
                          setHoveredCell({
                            dayName: row.dayFullName,
                            hourLabel: cell.hourLabel,
                            orderCount: cell.orderCount,
                            revenue: cell.revenue,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className={cn(
                          "h-8 sm:h-9 rounded-[3px] sm:rounded-[3.5px] flex items-center justify-center text-[10px] transition-all duration-150 cursor-pointer relative",
                          getCellColor(cell.orderCount),
                          isBusiest && "ring-2 ring-blue-400/80"
                        )}
                        title={`${row.dayFullName} jam ${cell.hourLabel}: ${cell.orderCount} pesanan, Rp ${cell.revenue.toLocaleString("id-ID")}`}
                      >
                        {cell.orderCount > 0 ? cell.orderCount : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend (Reference 1 style) */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-500">
              <span>Sedikit</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-[2px] bg-[#F4F7FC] border border-slate-200/80" />
                <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-100 border border-blue-200" />
                <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-300" />
                <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-500" />
                <span className="w-3.5 h-3.5 rounded-[2px] bg-[#0e59f9]" />
                <span className="w-3.5 h-3.5 rounded-[2px] bg-[#083cb0]" />
              </div>
              <span>Ramai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Charts (Matching Reference 1 Bottom Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Sub-Chart: Rata-rata Pesanan per Jam (Avg Orders per Hour) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0e59f9]" />
              Distribusi Pesanan per Jam (Orders per Hour)
            </h4>
            <span className="text-xs text-slate-500">24 Jam</span>
          </div>

          <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 border-b border-dashed border-slate-200">
            {hourlyDistribution.map((item) => {
              const heightRatio = maxHourlyOrders > 0 ? (item.orderCount / maxHourlyOrders) * 100 : 0;
              const isPeak = item.orderCount === peakKpis.busiestHour.orderCount && item.orderCount > 0;

              return (
                <div
                  key={item.hour}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${item.label}: ${item.orderCount} pesanan (Rp ${item.revenue.toLocaleString("id-ID")})`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-300 min-h-[2px]",
                      isPeak
                        ? "bg-[#0e59f9] shadow-sm"
                        : "bg-blue-300/80 group-hover:bg-[#0e59f9]/80"
                    )}
                    style={{ height: `${Math.max(4, heightRatio)}%` }}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                    {item.hour % 3 === 0 ? (item.hour === 0 ? "12a" : item.hour < 12 ? `${item.hour}a` : item.hour === 12 ? "12p" : `${item.hour - 12}p`) : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 pt-1">
            <span>Pagi (06:00 - 11:00)</span>
            <span>Siang (11:00 - 15:00)</span>
            <span>Malam (18:00 - 22:00)</span>
          </div>
        </div>

        {/* Right Sub-Chart: Pendapatan per Hari dalam Seminggu (Revenue by Day of Week) */}
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#0e59f9]" />
              Omset per Hari dalam Seminggu (Revenue by Day)
            </h4>
            <span className="text-xs text-slate-500">Senin - Minggu</span>
          </div>

          <div className="h-44 flex items-end gap-3 sm:gap-4 pt-4 pb-2 border-b border-dashed border-slate-200">
            {dayDistribution.map((item) => {
              const heightRatio = maxDayRevenue > 0 ? (item.revenue / maxDayRevenue) * 100 : 0;
              const isBusiest = item.dayIndex === peakKpis.busiestDay.dayIndex && item.revenue > 0;

              return (
                <div
                  key={item.dayIndex}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${item.dayFullName}: Rp ${item.revenue.toLocaleString("id-ID")} (${item.orderCount} order)`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300 min-h-[4px]",
                      isBusiest
                        ? "bg-[#0e59f9] shadow-sm"
                        : "bg-blue-400/80 group-hover:bg-[#0e59f9]/80"
                    )}
                    style={{ height: `${Math.max(6, heightRatio)}%` }}
                  />
                  <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate">
                    {item.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
            <span>Hari tersibuk: <strong className="text-emerald-600 font-semibold">{peakKpis.busiestDay.dayName}</strong></span>
            <span>Total Omset Mingguan: <strong>Rp {dayDistribution.reduce((acc, d) => acc + d.revenue, 0).toLocaleString("id-ID")}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

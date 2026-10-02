"use client";

import * as React from "react";
import { Clock } from "lucide-react";
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

export interface PeakHoursHeatmapProps {
  grid: HeatmapDayRow[];
  busiestHourLabel?: string;
  busiestHourOrders?: number;
  busiestHourRevenue?: number;
  busiestDayName?: string;
}

function formatRupiah(val: number | string | undefined | null): string {
  const num = typeof val === "number" ? val : parseFloat(val || "0") || 0;
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
}

export function PeakHoursHeatmap({
  grid,
  busiestHourLabel = "-",
  busiestHourOrders = 0,
  busiestHourRevenue = 0,
  busiestDayName = "-",
}: PeakHoursHeatmapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const [hoveredCell, setHoveredCell] = React.useState<{
    dayName: string;
    hourLabel: string;
    orderCount: number;
    revenue: number;
  } | null>(null);

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
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Find max orders in a single cell for shading normalization
  let maxCellOrders = 1;
  grid.forEach((row) => {
    row.hours.forEach((cell) => {
      if (cell.orderCount > maxCellOrders) maxCellOrders = cell.orderCount;
    });
  });

  // Heatmap cell color generator based on Menuin blue gradient palette
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
    <div
      ref={containerRef}
      className={cn(
        "bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-4 transition-opacity duration-700",
        isInView ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Top Header of Heatmap Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Pola Jam &amp; Hari Ramai
          </div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            
            Peak Hours Heatmap
          </h3>
         
        </div>

        {/* Hover detail preview if any cell active */}
        {hoveredCell ? (
          <div className="text-xs  rounded-xl px-3 py-1.5 text-slate-900 shadow-xs">
            <span className="font-semibold text-slate-900">{hoveredCell.dayName} {hoveredCell.hourLabel}</span>:{" "}
            <span className="font-semibold text-slate-900">{hoveredCell.orderCount} pesanan</span> ({formatRupiah(hoveredCell.revenue)})
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
          {/* Hour Columns Headers (12 AM to 11 PM) - Strictly font-sans per Rule 6.7 */}
          <div className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 mb-1.5 items-center">
            <div className="text-[10px] font-semibold text-slate-400 text-center">Hari</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const label = h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
              return (
                <div
                  key={h}
                  className="text-[9px] font-sans text-slate-400 text-center truncate"
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
                className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 items-center"
              >
                {/* Day Label (Sen, Sel, Rab, Kam, Jum, Sab, Min) */}
                <div className="text-xs font-semibold text-slate-700 px-1 truncate">
                  {row.dayLabel}
                </div>

                {/* 24 Cells */}
                {row.hours.map((cell) => {
                  const isBusiest = cell.orderCount > 0 && cell.orderCount === busiestHourOrders;
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
                        "h-7 sm:h-8 rounded-[3px] flex items-center justify-center text-[10px] font-sans transition-all duration-150 cursor-pointer relative",
                        getCellColor(cell.orderCount),
                        isBusiest && "ring-2 ring-blue-400/80 shadow-xs"
                      )}
                      title={`${row.dayFullName} jam ${cell.hourLabel}: ${cell.orderCount} pesanan, ${formatRupiah(cell.revenue)}`}
                    >
                      {cell.orderCount > 0 ? cell.orderCount : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-400">
            <span>Sepi</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#F4F7FC] border border-slate-200" title="0 Pesanan" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-100 border border-blue-200" title="Rendah" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-300" title="Sedang" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-blue-500" title="Tinggi" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#0e59f9]" title="Sangat Ramai" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#083cb0]" title="Puncak Tertinggi" />
            </div>
            <span>Puncak Ramai</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoundedBlockPoint = {
  date: string;
  label: string;
  netSales: number;
  orders: number;
  projected?: number;
};

interface RoundedBlockBarChartProps {
  data: RoundedBlockPoint[];
  title?: string;
  currencyPrefix?: string;
  onExport?: () => void;
}

export function RoundedBlockBarChart({
  data,
  title = "Analitik Penjualan (Revenue Analytics)",
  currencyPrefix = "Rp",
  onExport,
}: RoundedBlockBarChartProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<"sales" | "orders">("sales");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Maximum block count per column
  const MAX_BLOCKS = 10;
  // Exact stack height for columns to accommodate larger square blocks
  const STACK_HEIGHT = 290;
  // Ample headroom so hover popovers are never clipped by the scroll container or elements above
  const HEADROOM = 130;

  // Helper to extract clean day number without month text for X-axis (e.g. "1 Sep" -> "1")
  const getDayNumber = (p: RoundedBlockPoint, fallbackIdx: number) => {
    // 1. Prefer extracting day number directly from localized label (e.g. "1 Sep" -> "1")
    const match = p.label?.match(/^\d+/);
    if (match) return match[0];
    // 2. Fallback to parsing date string
    if (p.date) {
      const parts = p.date.split("-");
      if (parts.length >= 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) return parsed.toString();
      }
    }
    return (fallbackIdx + 1).toString();
  };

  // Find max value across data
  const values = data.map((d) => (selectedMetric === "sales" ? d.netSales : d.orders));
  const maxVal = Math.max(...values, selectedMetric === "sales" ? 100000 : 10);
  const projectedVal = data.length > 0 ? (data[0].projected || maxVal * 0.75) : maxVal * 0.75;

  // Y-axis tick intervals (4 levels)
  const yTicks = [
    { percent: 1, val: maxVal },
    { percent: 0.66, val: Math.round(maxVal * 0.66) },
    { percent: 0.33, val: Math.round(maxVal * 0.33) },
    { percent: 0, val: 0 },
  ];

  const formatYVal = (num: number) => {
    if (selectedMetric === "orders") return `${num}`;
    if (num >= 1000000) return `${currencyPrefix} ${(num / 1000000).toFixed(1)}jt`;
    if (num >= 1000) return `${currencyPrefix} ${(num / 1000).toFixed(0)}rb`;
    return `${currencyPrefix} ${num}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAEFF8] p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#0e59f9]" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribusi performa omset harian divisualisasikan dengan blok bertingkat interaktif
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Selector Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            <button
              type="button"
              onClick={() => setSelectedMetric("sales")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all",
                selectedMetric === "sales"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Penjualan (Rp)
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric("orders")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all",
                selectedMetric === "orders"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Pesanan (Qty)
            </button>
          </div>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title="Export Data"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stacked Block Chart Canvas */}
      <div className="relative select-none pt-2">
        {/* Subtle Horizontal Grid lines & Left Y-Axis precisely aligned with STACK_HEIGHT */}
        <div
          className="absolute inset-x-0 flex flex-col justify-between pointer-events-none z-0"
          style={{ top: `${HEADROOM}px`, height: `${STACK_HEIGHT}px` }}
        >
          {yTicks.map((tick, i) => (
            <div key={i} className="flex items-center w-full border-b border-dashed border-slate-100">
              <span className="text-[10px] font-mono text-slate-400 w-16 sm:w-20 pr-3 text-right flex-shrink-0">
                {formatYVal(tick.val)}
              </span>
              <div className="flex-1" />
            </div>
          ))}
        </div>

        {/* Projected / Target line across the chart */}
        {selectedMetric === "sales" && maxVal > 0 && (
          <div
            className="absolute right-0 border-t-2 border-dashed border-indigo-300 pointer-events-none z-10 transition-all duration-300"
            style={{
              left: "5.5rem",
              top: `${HEADROOM + (1 - (projectedVal / maxVal)) * STACK_HEIGHT}px`,
            }}
          >
            <span className="absolute -top-3.5 right-0 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.2 rounded shadow-xs">
              Target Harian {formatYVal(projectedVal)}
            </span>
          </div>
        )}

        {/* Scrollable Columns Container with GENEROUS HEADROOM so tooltips are never cut off */}
        <div 
          className="relative z-20 pl-16 sm:pl-20 pr-4 sm:pr-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200"
          style={{ paddingTop: `${HEADROOM}px` }}
        >
          {/* Stacked Columns Container - tight gap so left and right boxes are close to each other */}
          <div 
            className="flex items-end justify-center gap-1 sm:gap-1.5 min-w-full"
            style={{ height: `${STACK_HEIGHT}px` }}
          >
            {data.map((point, index) => {
              const val = selectedMetric === "sales" ? point.netSales : point.orders;
              const ratio = maxVal > 0 ? Math.min(1, Math.max(0, val / maxVal)) : 0;
              // Active block count (from 1 to MAX_BLOCKS)
              const blockCount = val > 0 ? Math.max(1, Math.round(ratio * MAX_BLOCKS)) : 0;
              const isHovered = hoveredIndex === index;
              const dayNumber = getDayNumber(point, index);

              // Smart adaptive edge detection so edge tooltips never clip outside chart bounds
              const isLeftEdge = data.length <= 6 ? index < Math.ceil(data.length / 2) : index <= 2;
              const isRightEdge = data.length <= 6 ? index >= Math.ceil(data.length / 2) : index >= data.length - 4;

              return (
                <div
                  key={point.date}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 min-w-[22px] max-w-[32px] sm:max-w-[36px] flex flex-col items-center group cursor-pointer relative h-full justify-end"
                >
                  {/* Floating Popover Tooltip with intelligent horizontal docking & zero vertical clipping */}
                  <AnimatePresence>
                    {isHovered && (
                      <div
                        className={cn(
                          "absolute bottom-[calc(100%+8px)] z-50 pointer-events-none",
                          isLeftEdge 
                            ? "left-0" 
                            : isRightEdge 
                              ? "right-0" 
                              : "left-1/2"
                        )}
                        style={{
                          transform: !isLeftEdge && !isRightEdge ? "translateX(-50%)" : undefined,
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className="bg-white text-slate-800 rounded-xl p-3 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap min-w-[155px] border border-slate-200/90 relative"
                        >
                          <div className="text-[11px] font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5 flex items-center justify-between gap-4">
                            <span className="font-semibold text-slate-900">{point.label || `Tanggal ${dayNumber}`}</span>
                            <span className="text-[9px] font-medium text-slate-400">Detail Harian</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-medium">Net Sales:</span>
                              <span className="font-semibold text-[#0e59f9]">
                                Rp {point.netSales.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-500 font-medium">Pesanan:</span>
                              <span className="font-semibold text-slate-800">
                                {point.orders} Order
                              </span>
                            </div>
                            {point.projected ? (
                              <div className="flex justify-between items-center gap-3 text-[10px] text-slate-500 border-t border-slate-100 pt-1 mt-1">
                                <span className="text-slate-400">Target:</span>
                                <span className="font-medium text-slate-600">Rp {point.projected.toLocaleString("id-ID")}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Pointer Arrow pointing directly at the active column */}
                          <div 
                            className={cn(
                              "absolute -bottom-1 w-2.5 h-2.5 bg-white border-r border-b border-slate-200/90",
                              isLeftEdge 
                                ? "left-3.5 sm:left-4" 
                                : isRightEdge 
                                  ? "right-3.5 sm:right-4" 
                                  : "left-1/2"
                            )}
                            style={{
                              transform: !isLeftEdge && !isRightEdge ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
                            }}
                          />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Vertical Stack of LARGER Square Blocks (Kotak Persegi) in Menuin Blue Palette */}
                  <div className="w-full flex flex-col-reverse items-center gap-[3px] py-1">
                    {/* Render blocks up to MAX_BLOCKS with authentic 1:1 aspect-square ratio and enlarged size */}
                    {Array.from({ length: MAX_BLOCKS }).map((_, blockIdx) => {
                      const isFilled = blockIdx < blockCount;

                      let blockStyle = "bg-transparent";
                      if (isFilled) {
                        if (isHovered) {
                          // Highlighted active column: solid vibrant Menuin Blue
                          blockStyle = "bg-[#0e59f9] shadow-sm";
                        } else {
                          // Unselected idle columns: soft Menuin Ice Blue that blends with the brand
                          blockStyle = "bg-[#0e59f9]/20 group-hover:bg-[#0e59f9]/35 border border-[#0e59f9]/15";
                        }
                      } else if (val === 0 && blockIdx === 0) {
                        // Inactive baseline block
                        blockStyle = "bg-slate-200/60";
                      }

                      return (
                        <div
                          key={blockIdx}
                          className={cn(
                            "w-full max-w-[30px] sm:max-w-[34px] aspect-square rounded-[4px] sm:rounded-[6px] transition-colors duration-150",
                            blockStyle
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Date label at bottom without month initial */}
                  <div className="mt-2 text-center w-full flex justify-center">
                    <span
                      className={cn(
                        "text-[10px] sm:text-[11px] font-medium transition-all w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full",
                        isHovered
                          ? "bg-[#0e59f9] text-white font-semibold shadow-xs"
                          : "text-slate-500 group-hover:text-slate-900"
                      )}
                    >
                      {dayNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

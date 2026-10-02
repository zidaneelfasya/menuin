"use client";

import * as React from "react";
import { Calendar, RefreshCw, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportPeriod } from "@/lib/actions/reports";
import { cn } from "@/lib/utils";

interface ReportFilterBarProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod, customStart?: string, customEnd?: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  formattedRange?: string;
}

export function ReportFilterBar({
  period,
  onPeriodChange,
  isLoading = false,
  onRefresh,
  onExportExcel,
  onPrint,
  formattedRange,
}: ReportFilterBarProps) {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [showCustomForm, setShowCustomForm] = React.useState(period === "custom");

  const filterTabs: { id: ReportPeriod; label: string }[] = [
    { id: "today", label: "Hari Ini" },
    { id: "7days", label: "7 Hari" },
    { id: "this_month", label: "Bulan Ini" },
    { id: "last_month", label: "Bulan Lalu" },
    { id: "3months", label: "3 Bulan" },
    { id: "6months", label: "6 Bulan" },
    { id: "custom", label: "Kustom" },
  ];

  const handleTabClick = (tabId: ReportPeriod) => {
    if (tabId === "custom") {
      setShowCustomForm(true);
    } else {
      setShowCustomForm(false);
      onPeriodChange(tabId);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    onPeriodChange("custom", startDate, endDate);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAEFF8] p-4 shadow-sm space-y-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
          {filterTabs.map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-[#0e59f9] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {formattedRange && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formattedRange}</span>
            </div>
          )}

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 border-slate-200 shadow-2xs gap-1.5 text-slate-700"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              <span>Segarkan</span>
            </Button>
          )}

          {onExportExcel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="h-9 border-slate-200 shadow-2xs gap-1.5 text-slate-700 hover:text-[#0e59f9]"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
          )}

          {onPrint && (
            <Button
              type="button"
              size="sm"
              onClick={onPrint}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* Custom Date Form (if custom selected) */}
      {showCustomForm && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Dari:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs w-36 bg-slate-50"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sampai:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs w-36 bg-slate-50"
              required
            />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs bg-[#0e59f9] text-white">
            Terapkan
          </Button>
        </form>
      )}
    </div>
  );
}

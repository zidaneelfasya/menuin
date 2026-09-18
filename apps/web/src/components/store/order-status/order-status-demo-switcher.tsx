"use client";

import React, { useState } from "react";
import { OrderStatusType } from "./order-status-visual";
import { ORDER_STATUS_CONFIGS } from "./order-status-card";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface OrderStatusDemoSwitcherProps {
  currentStatus: OrderStatusType;
  onSelectStatus: (status: OrderStatusType) => void;
}

export function OrderStatusDemoSwitcher({
  currentStatus,
  onSelectStatus,
}: OrderStatusDemoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses: OrderStatusType[] = [
    "AWAITING_PAYMENT",
    "CONFIRMED",
    "PROCESSING",
    "READY",
    "COMPLETED",
    "PAYMENT_FAILED",
    "CANCELLED",
    "REJECTED",
  ];

  return (
    <div className="w-full bg-blue-50/70 border border-blue-100 rounded-2xl p-3 sm:p-4 text-left transition-all">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-900">Interactive Status Preview</p>
            <p className="text-[11px] text-blue-600/80">
              Uji & coba seluruh 8 animasi status di sini
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-blue-600 hover:text-blue-800 p-1 rounded-md"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {statuses.map((st) => {
            const cfg = ORDER_STATUS_CONFIGS[st];
            const isActive = currentStatus === st;

            return (
              <button
                key={st}
                type="button"
                onClick={() => onSelectStatus(st)}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left flex flex-col justify-center border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200/80 hover:bg-blue-100/50 hover:border-blue-200"
                }`}
              >
                <span className="truncate">{cfg.title}</span>
                <span
                  className={`text-[9px] truncate ${
                    isActive ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {st}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

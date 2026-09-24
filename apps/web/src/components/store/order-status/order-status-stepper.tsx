"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface OrderStatusStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  isCompleted?: boolean;
  isFailed?: boolean;
  statusType?: string;
  primaryColor?: string;
  className?: string;
}

const STEPS = [
  { id: 1, label: "Menunggu" },
  { id: 2, label: "Diterima" },
  { id: 3, label: "Disiapkan" },
  { id: 4, label: "Siap" },
  { id: 5, label: "Selesai" },
];

export function OrderStatusStepper({
  currentStep,
  isCompleted = false,
  isFailed = false,
  statusType,
  primaryColor,
  className = "",
}: OrderStatusStepperProps) {
  const shouldReduceMotion = useReducedMotion();
  const isCancelledOrRejected = isFailed || statusType === "CANCELLED" || statusType === "REJECTED";

  // Target progress percentage: Stops EXACTLY in the middle (center) of the current step
  // Step 1 center: 10%, Step 2 center: 30%, Step 3 center: 50%, Step 4 center: 70%, Step 5 center: 90% (or 100% when completed)
  const targetProgress = isCancelledOrRejected
    ? 0
    : isCompleted
    ? 100
    : Math.min(100, Math.max(0, ((currentStep - 0.5) / STEPS.length) * 100));

  // Dynamic CSS variable style if primaryColor is provided directly as a prop
  const dynamicThemeStyle = primaryColor
    ? ({ "--outlet-primary": primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={dynamicThemeStyle}
      className={`w-full max-w-sm sm:max-w-md mx-auto select-none ${className}`}
      role="region"
      aria-label="Progres Status Pesanan"
    >
      {/* 1. TOP ROW: 5 Numbered Circle Nodes & Labels (Exact 20% column width for perfect vertical alignment) */}
      <div className="grid grid-cols-5 text-center" role="list">
        {STEPS.map((step) => {
          const isPast = !isCancelledOrRejected && (isCompleted || step.id < currentStep);
          const isCurrent = !isCancelledOrRejected && !isCompleted && step.id === currentStep;
          const isActive = isPast || isCurrent;

          const statusText = isPast
            ? "Selesai"
            : isCurrent
            ? "Sedang Berjalan"
            : "Menunggu";

          return (
            <div
              key={step.id}
              className="flex flex-col items-center min-w-0"
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Tahap ${step.id}: ${step.label} (${statusText})`}
            >
              {/* Circle Node with Step Number (Simple, flat, no outer rings/halos) */}
              <div className="relative flex items-center justify-center">
                {isActive ? (
                  <div
                    className="w-6 h-6 sm:w-6 sm:h-6 rounded-full text-white text-xs sm:text-[13px] font-medium flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--outlet-primary, #0E59F9)",
                    }}
                  >
                    {step.id}
                  </div>
                ) : (
                  <div
                    className={`w-6 h-6 sm:w-6 sm:h-6 rounded-full text-xs sm:text-[13px] font-normal flex items-center justify-center bg-white transition-all ${
                      isCancelledOrRejected
                        ? "border border-gray-200 text-gray-300"
                        : "border border-slate-300 text-slate-500"
                    }`}
                    style={
                      !isCancelledOrRejected
                        ? {
                            borderColor:
                              "color-mix(in srgb, var(--outlet-primary, #0E59F9) 28%, #cbd5e1)",
                            color:
                              "color-mix(in srgb, var(--outlet-primary, #0E59F9) 65%, #64748b)",
                          }
                        : undefined
                    }
                  >
                    {step.id}
                  </div>
                )}
              </div>

              {/* Step Label (Strict font-semibold ceiling per ui-guidelines) */}
              <span
                className={`mt-2 text-[10.5px] sm:text-xs tracking-tight transition-colors line-clamp-1 w-full text-center ${
                  isCancelledOrRejected
                    ? "text-gray-300 font-normal"
                    : isActive
                    ? "font-semibold"
                    : "text-gray-400 font-normal"
                }`}
                style={
                  !isCancelledOrRejected && isActive
                    ? { color: "var(--outlet-primary, #0E59F9)" }
                    : undefined
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. BOTTOM ROW: Simple, Clean Single-Color Progress Bar */}
      <div className="mt-3.5 sm:mt-4">
        <div
          className="relative w-full h-1.5 sm:h-2 rounded-full overflow-hidden"
          style={{
            backgroundColor: "color-mix(in srgb, var(--outlet-primary, #0E59F9) 14%, #f1f5f9)",
          }}
          role="progressbar"
          aria-valuenow={targetProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Animated Solid Progress Bar: Flows smoothly from left 0% to the exact center of current step on initial load */}
          <motion.div
            key={`progress-stream-${currentStep}-${statusType}`}
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              backgroundColor: "var(--outlet-primary, #0E59F9)",
            }}
            initial={shouldReduceMotion ? { width: `${targetProgress}%` } : { width: "0%" }}
            animate={{ width: `${targetProgress}%` }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.85,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>
      </div>
    </div>
  );
}

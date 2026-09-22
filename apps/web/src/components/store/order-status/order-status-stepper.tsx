"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

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
  // If cancelled or rejected, all steps are grayed out inactive dots
  const isCancelledOrRejected = isFailed || statusType === "CANCELLED" || statusType === "REJECTED";

  // Dynamic CSS variable style if primaryColor is provided directly as a prop
  const dynamicThemeStyle = primaryColor
    ? ({ "--outlet-primary": primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={dynamicThemeStyle}
      className={`w-full max-w-sm mx-auto px-1 select-none ${className}`}
      role="list"
      aria-label="Progres Status Pesanan"
    >
      <div className="relative flex items-center justify-between">
        {/* Step Nodes & Connecting Lines */}
        {STEPS.map((step, idx) => {
          const isPast = !isCancelledOrRejected && (isCompleted || step.id < currentStep);
          const isCurrent = !isCancelledOrRejected && !isCompleted && step.id === currentStep;
          const isFuture = isCancelledOrRejected || (!isCompleted && step.id > currentStep);

          const statusText = isPast
            ? "Selesai"
            : isCurrent
            ? "Sedang Berjalan"
            : "Menunggu";

          return (
            <React.Fragment key={step.id}>
              {/* Connecting Line between steps */}
              {idx > 0 && (
                <div
                  className="flex-1 h-0.5 mx-0.5 sm:mx-1.5 bg-gray-200 relative overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: "var(--outlet-primary, #2563eb)",
                      originX: 0,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: !isCancelledOrRejected && (isCompleted || currentStep > idx) ? 1 : 0,
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}

              {/* Step Node */}
              <div
                className="flex flex-col items-center relative z-10"
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Tahap ${step.id}: ${step.label} (${statusText})`}
              >
                {/* Visual Circle Node */}
                {isPast ? (
                  <motion.div
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: "var(--outlet-primary, #2563eb)" }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </motion.div>
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.85 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="w-5 h-5 rounded-full text-white font-bold text-[11px] flex items-center justify-center relative z-10"
                      style={{
                        backgroundColor: "var(--outlet-primary, #2563eb)",
                        boxShadow: "0 0 0 4px color-mix(in srgb, var(--outlet-primary, #2563eb) 18%, transparent)",
                      }}
                    >
                      {step.id}
                    </motion.div>
                  </div>
                ) : (
                  <div
                    className="w-2.5 h-2.5 my-1.25 rounded-full bg-gray-300 transition-colors"
                    aria-hidden="true"
                  />
                )}

                {/* Step Label */}
                <span
                  className={`mt-1.5 sm:mt-2 text-[9.5px] sm:text-[11px] tracking-tight transition-colors whitespace-nowrap text-center ${
                    isCancelledOrRejected
                      ? "text-gray-400 font-normal"
                      : isCurrent || isPast
                      ? "font-bold"
                      : "text-gray-400 font-normal"
                  }`}
                  style={
                    !isCancelledOrRejected && (isCurrent || isPast)
                      ? { color: "var(--outlet-primary, #2563eb)" }
                      : undefined
                  }
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

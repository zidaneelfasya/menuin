"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { OrderStatusRive } from "./order-status-rive";
import {
  MenungguPembayaranVector,
  PesananDiterimaVector,
  ProcessingVector,
  ReadyVector,
  SelesaiVector,
} from "./order-status-vectors";

export type OrderStatusType =
  | "AWAITING_PAYMENT"
  | "WAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "REJECTED";

export const RIVE_STATUS_SOURCES: Partial<Record<OrderStatusType, string>> = {
  AWAITING_PAYMENT: "/animation/status-animation/menunggu_konfirmasi.riv",
  WAITING_PAYMENT: "/animation/status-animation/menunggu_konfirmasi.riv",
  CONFIRMED: "/animation/status-animation/new.riv",
  PROCESSING: "/animation/status-animation/processing.riv",
  READY: "/animation/status-animation/ready.riv",
  COMPLETED: "/animation/status-animation/selesai.riv",
};

interface OrderStatusVisualProps {
  status: OrderStatusType;
  orderNumber?: string;
  primaryColor?: string;
  className?: string;
}

export function OrderStatusVisual({
  status,
  primaryColor,
  className = "",
}: OrderStatusVisualProps) {
  // Normalize WAITING_PAYMENT to AWAITING_PAYMENT for internal matching
  const normalizedStatus: "AWAITING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "READY" | "COMPLETED" | "PAYMENT_FAILED" | "CANCELLED" | "REJECTED" =
    status === "WAITING_PAYMENT" ? "AWAITING_PAYMENT" : status;

  // Track previous status to orchestrate state-to-state continuity
  const prevStatusRef = useRef<string>(normalizedStatus);
  useEffect(() => {
    prevStatusRef.current = normalizedStatus;
  }, [normalizedStatus]);

  // Is this one of the 5 progressive vector states?
  const isVectorStatus = [
    "AWAITING_PAYMENT",
    "CONFIRMED",
    "PROCESSING",
    "READY",
    "COMPLETED",
  ].includes(normalizedStatus);

  // Map state to corresponding soft pastel blob variant (for exception states)
  const blobVariant = getBlobVariant(normalizedStatus);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none isolate flex items-center justify-center ${className}`}
    >
      {/* Dynamic Minimalist Stage Blob family (4-8% subtle theme opacity) */}
      {isVectorStatus && <StageBlob status={normalizedStatus} primaryColor={primaryColor} />}

      {/* Background blob only for exception states */}
      {!isVectorStatus && <BackgroundBlob variant={blobVariant} />}

      {/* Main Visual Stage */}
      <AnimatePresence mode="wait">
        {normalizedStatus === "AWAITING_PAYMENT" && (
          <motion.div
            key="vector-awaiting-payment"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6"
          >
            <MenungguPembayaranVector primaryColor={primaryColor} className="max-w-[180px] max-h-[145px] sm:max-w-[210px] sm:max-h-[165px]" />
          </motion.div>
        )}

        {normalizedStatus === "CONFIRMED" && (
          <motion.div
            key="vector-confirmed"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6"
          >
            <PesananDiterimaVector primaryColor={primaryColor} className="max-w-[170px] max-h-[145px] sm:max-w-[200px] sm:max-h-[165px]" />
          </motion.div>
        )}

        {normalizedStatus === "PROCESSING" && (
          <motion.div
            key="vector-processing"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6"
          >
            <ProcessingVector primaryColor={primaryColor} className="max-w-[185px] max-h-[170px] sm:max-w-[215px] sm:max-h-[195px]" />
          </motion.div>
        )}

        {normalizedStatus === "READY" && (
          <motion.div
            key="vector-ready"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6"
          >
            <ReadyVector primaryColor={primaryColor} className="max-w-[175px] max-h-[170px] sm:max-w-[205px] sm:max-h-[195px]" />
          </motion.div>
        )}

        {normalizedStatus === "COMPLETED" && (
          <motion.div
            key="vector-completed"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full h-full flex items-center justify-center p-4 sm:p-6"
          >
            <SelesaiVector primaryColor={primaryColor} className="max-w-[175px] max-h-[150px] sm:max-w-[205px] sm:max-h-[175px]" />
          </motion.div>
        )}

        {normalizedStatus === "PAYMENT_FAILED" && (
          <motion.div
            key="payment-failed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <PaymentFailedVisual />
          </motion.div>
        )}

        {normalizedStatus === "CANCELLED" && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <CancelledVisual />
          </motion.div>
        )}

        {normalizedStatus === "REJECTED" && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <RejectedVisual />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
/**
 * StageBlob:
 * "Keluarga blob" organik minimalis sebagai stage di belakang ilustrasi status pesanan.
 * - Formula: Simple + Organic + Subtle + Asymmetric
 * - 5–7 anchor points dengan kurva Bezier halus, tanpa sudut tajam
 * - Opacity 6.5% (dalam rentang 4–8% rekomendasi) mengikuti tema storefront
 * - Silhouette & rotasi disesuaikan dengan karakter tiap status pesanan
 */
function StageBlob({
  status,
  primaryColor,
  className = "",
}: {
  status: OrderStatusType;
  primaryColor?: string;
  className?: string;
}) {
  const accent = primaryColor || "var(--catalog-primary, var(--outlet-primary, #0E59F9))";

  switch (status) {
    case "AWAITING_PAYMENT":
    case "WAITING_PAYMENT":
      // Menunggu Konfirmasi: Lebih kompak, sedikit condong natural (-3deg)
      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`} aria-hidden="true">
          <div className="w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] flex items-center justify-center -rotate-3 transition-transform duration-500">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M105 32 C135 32, 155 40, 160 62 C168 88, 172 110, 162 130 C150 152, 130 162, 108 162 C78 162, 42 154, 38 132 C34 105, 32 78, 48 55 C62 38, 80 32, 105 32 Z"
                fill={accent}
                fillOpacity={0.065}
              />
            </svg>
          </div>
        </div>
      );

    case "CONFIRMED":
      // Pesanan Diterima: Rounded & proporsional membingkai papan nota (+1deg)
      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`} aria-hidden="true">
          <div className="w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] flex items-center justify-center rotate-1 transition-transform duration-500">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M96 28 C126 28, 148 35, 156 56 C166 80, 172 105, 165 132 C158 155, 142 168, 112 168 C80 168, 48 160, 42 136 C36 108, 38 72, 54 50 C68 32, 80 28, 96 28 Z"
                fill={accent}
                fillOpacity={0.065}
              />
            </svg>
          </div>
        </div>
      );

    case "PROCESSING":
      // Sedang Disiapkan: Lebih dinamis, melebar diagonal mengikuti kemiringan wajan & api (+6deg)
      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`} aria-hidden="true">
          <div className="w-[245px] h-[245px] sm:w-[275px] sm:h-[275px] flex items-center justify-center rotate-6 transition-transform duration-500">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M130 22 C155 22, 172 38, 178 62 C186 92, 188 120, 172 145 C156 168, 132 178, 102 176 C72 174, 32 162, 28 128 C24 94, 36 60, 62 40 C84 24, 110 22, 130 22 Z"
                fill={accent}
                fillOpacity={0.065}
              />
            </svg>
          </div>
        </div>
      );

    case "READY":
      // Pesanan Sudah Siap: Lebih lebar horizontal membingkai tudung saji & piring (-5deg)
      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`} aria-hidden="true">
          <div className="w-[255px] h-[220px] sm:w-[285px] sm:h-[245px] flex items-center justify-center -rotate-5 transition-transform duration-500">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M92 26 C124 26, 155 35, 168 58 C182 82, 192 112, 182 136 C172 158, 142 168, 105 168 C68 168, 22 156, 18 128 C14 96, 26 56, 52 38 C68 28, 80 26, 92 26 Z"
                fill={accent}
                fillOpacity={0.065}
              />
            </svg>
          </div>
        </div>
      );

    case "COMPLETED":
      // Pesanan Selesai: Rounded organik + 1 aksen blob kecil di samping (dual blob 6.5% + 4%)
      return (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 ${className}`} aria-hidden="true">
          <div className="w-[235px] h-[235px] sm:w-[265px] sm:h-[265px] relative flex items-center justify-center rotate-2 transition-transform duration-500">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Blob Utama (6.5%) */}
              <path
                d="M102 24 C132 24, 162 36, 168 62 C176 92, 172 124, 156 148 C140 170, 112 175, 86 172 C56 168, 26 150, 24 118 C22 84, 38 48, 65 32 C80 24, 92 24, 102 24 Z"
                fill={accent}
                fillOpacity={0.065}
              />
              {/* Aksen Blob Kecil di samping kanan bawah (4%) */}
              <circle
                cx="178"
                cy="148"
                r="12"
                fill={accent}
                fillOpacity={0.04}
              />
            </svg>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function getBlobVariant(status: string): "blue" | "cyan" | "mint" | "rose" | "amber" | "slate" {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "WAITING_PAYMENT":
    case "CONFIRMED":
      return "blue";
    case "PROCESSING":
      return "cyan";
    case "READY":
    case "COMPLETED":
      return "mint";
    case "PAYMENT_FAILED":
      return "rose";
    case "CANCELLED":
      return "amber";
    case "REJECTED":
      return "slate";
    default:
      return "blue";
  }
}

/* ==========================================================================
   LAYER 1: SOFT PASTEL BACKGROUND BLOB (Bounded and Proportionate)
   ========================================================================== */
function BackgroundBlob({
  variant = "blue",
  className = "",
}: {
  variant?: "blue" | "cyan" | "mint" | "rose" | "amber" | "slate";
  className?: string;
}) {
  const palettes = {
    blue: {
      fill: "#E0F2FE", // Soft sky blue
      stroke: "#BAE6FD",
      opacity: 0.1,
    },
    cyan: {
      fill: "#E0F7FA", // Soft cyan
      stroke: "#B2EBF2",
      opacity: 0.1,
    },
    mint: {
      fill: "#DCFCE7", // Soft mint
      stroke: "#BBF7D0",
      opacity: 0.1,
    },
    rose: {
      fill: "#FFE4E6", // Soft rose/coral
      stroke: "#FECDD3",
      opacity: 0.1,
    },
    amber: {
      fill: "#FFEDD5", // Soft peach/amber
      stroke: "#FED7AA",
      opacity: 0.1,
    },
    slate: {
      fill: "#F1F5F9", // Soft slate/cool-gray
      stroke: "#CBD5E1",
      opacity: 0.1,
    },
  };

  const p = palettes[variant] || palettes.blue;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 ${className}`}
    >
      <svg
        viewBox="0 0 240 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[180px] h-[140px] sm:w-[210px] sm:h-[160px] max-w-full drop-shadow-2xs transition-all duration-400 ease-out"
        style={{ opacity: p.opacity }}
      >
        <path
          d="M 58 152
             C 28 152 14 134 14 110
             C 14 88 28 72 46 66
             C 42 46 58 24 86 20
             C 110 14 136 22 150 34
             C 168 18 196 18 216 36
             C 236 54 240 82 228 106
             C 238 122 232 142 216 150
             C 200 158 178 156 162 152
             C 136 158 94 158 58 152 Z"
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ==========================================================================
   LAYER 2: GROUND CONTACT SHADOW
   ========================================================================== */
function ContactShadow({
  width = "w-28 sm:w-32",
  color = "bg-black/[0.08]",
  className = "",
}: {
  width?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute bottom-2 sm:bottom-2.5 h-2.5 sm:h-3 ${width} ${color} rounded-[100%] blur-[5px] pointer-events-none z-5 transition-all duration-300 ${className}`}
    />
  );
}

/* ==========================================================================
   SVG VECTOR DRAWING HELPERS
   ========================================================================== */
function DrawnCheckmark({
  size = 20,
  color = "#FFFFFF",
  strokeWidth = 3.2,
  delay = 0.25,
  className = "",
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="M 5 12.5 L 9.5 17 L 19 7"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.1, delay },
        }}
      />
    </svg>
  );
}

function DrawnX({
  size = 18,
  color = "#FFFFFF",
  strokeWidth = 3,
  delay = 0.2,
  className = "",
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="M 6.5 6.5 L 17.5 17.5"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.2, delay, ease: "easeOut" },
          opacity: { duration: 0.05, delay },
        }}
      />
      <motion.path
        d="M 17.5 6.5 L 6.5 17.5"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.2, delay: delay + 0.08, ease: "easeOut" },
          opacity: { duration: 0.05, delay: delay + 0.08 },
        }}
      />
    </svg>
  );
}

function CancellationLine({ delay = 0.25 }: { delay?: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      viewBox="0 0 144 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M 22 26 L 122 150"
        stroke="#F97316"
        strokeWidth="3.2"
        strokeLinecap="round"
        initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 0.85 : 0 }}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={{
          pathLength: { duration: 0.38, delay, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.1, delay },
        }}
      />
    </svg>
  );
}

/* ==========================================================================
   1. WAITING_PAYMENT (Menunggu Pembayaran)
   - Notebook #A024 compact, tilted ~2.5deg, constrained inside container
   - Clock icon near bottom-right, visually connected
   - Page shadow & subtle blue accent behind notebook
   - No clouds, no random decorations
   ========================================================================== */
function AwaitingPaymentVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Subtle soft blue aura behind notebook */}
      <div className="absolute w-36 h-36 rounded-full bg-blue-100/50 blur-xl pointer-events-none z-0" />

      {/* Layer 2: Ground Contact Shadow */}
      <ContactShadow width="w-28 sm:w-32" color="bg-blue-950/[0.08]" />

      {/* Small Blue Accent Behind the Notebook */}
      <motion.div
        className="absolute top-2.5 right-[26%] sm:right-[27%] pointer-events-none z-5"
        initial={{ opacity: 0, x: -3 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.28, ease: "easeOut" }}
      >
        <div className="w-2 h-4.5 bg-blue-500 rounded-full rotate-[30deg] shadow-2xs" />
      </motion.div>

      {/* Layer 3: Main Notebook Asset (Max 82% constraint, tilted ~2.5deg) */}
      <motion.div
        className="relative z-10 w-32 h-40 sm:w-36 sm:h-44 flex items-center justify-center"
        initial={{
          y: shouldReduceMotion ? 0 : 10,
          rotate: shouldReduceMotion ? -2.5 : -4,
          opacity: 0,
        }}
        animate={{ y: 0, rotate: -2.5, opacity: 1 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="/img/asset-status-pesanan/note.png"
          alt="Nota Pesanan"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
          draggable={false}
        />

        {/* Clock Icon: Visually connected at bottom-right of notebook */}
        <motion.div
          className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center"
          initial={{
            scale: shouldReduceMotion ? 1 : 0.8,
            opacity: 0,
            rotate: shouldReduceMotion ? 0 : -8,
          }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.26,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <img
            src="/img/asset-status-pesanan/time-icon.png"
            alt="Jam Menunggu"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md relative z-10"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   2. CONFIRMED (Pesanan Dikonfirmasi)
   - Order card with subtle shadow and clear green confirmation mark
   - Small blue confirmation accent
   ========================================================================== */
function ConfirmedVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow */}
      <ContactShadow width="w-28 sm:w-32" color="bg-slate-900/[0.08]" />

      {/* Small Blue Confirmation Accent Lines */}
      <motion.div
        className="absolute top-3 right-[25%] pointer-events-none z-5 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
      >
        <motion.div
          className="w-1.5 h-4 bg-blue-500 rounded-full rotate-[32deg] shadow-2xs"
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.38 }}
        />
        <motion.div
          className="w-1.5 h-3 bg-blue-500 rounded-full rotate-[32deg] -translate-y-0.5 shadow-2xs"
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.44 }}
        />
      </motion.div>

      {/* Layer 3: Main Grounded Card */}
      <motion.div
        className="relative z-10 w-32 h-40 sm:w-36 sm:h-44 flex items-center justify-center"
        initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="/img/asset-status-pesanan/note.png"
          alt="Nota Dikonfirmasi"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
          draggable={false}
        />

        {/* Clear Green Confirmation Mark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none z-20"
          initial={{ scale: shouldReduceMotion ? 1 : 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.28, ease: "easeOut" }}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-md flex items-center justify-center border border-emerald-300/40">
            <DrawnCheckmark size={20} color="#FFFFFF" strokeWidth={3.2} delay={0.32} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   3. PROCESSING (Sedang Disiapkan)
   - Cooking pan hero with subtle contact shadow
   - Chef hat positioned neatly above pan
   - Three soft organic steam elements
   ========================================================================== */
function ProcessingVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow below pan */}
      <ContactShadow width="w-38 sm:w-42" color="bg-slate-950/[0.1]" className="translate-y-1" />

      {/* Chef Hat: Positioned above pan with calm slow floating loop */}
      <motion.div
        className="absolute z-20 top-1 right-[25%] sm:right-[26%] pointer-events-none"
        initial={{ opacity: 0, y: 5 }}
        animate={{
          opacity: 1,
          y: shouldReduceMotion ? 0 : [0, -3, 0],
          rotate: shouldReduceMotion ? 0 : [0, 1.2, 0],
        }}
        transition={{
          opacity: { duration: 0.28, delay: 0.15 },
          y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.25 },
          rotate: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.25 },
        }}
      >
        <img
          src="/img/asset-status-pesanan/topi-koki-kecil.png"
          alt="Topi Koki"
          className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md"
          draggable={false}
        />
      </motion.div>

      {/* Steam Layer 1: Left soft curve rise */}
      <div className="absolute z-20 top-6 left-[34%] pointer-events-none">
        <motion.img
          src="/img/asset-status-pesanan/smoke-icon.png"
          alt="Uap Masakan 1"
          className="w-4 h-6 sm:w-4.5 sm:h-6.5 object-contain"
          initial={{ opacity: 0 }}
          animate={{
            x: shouldReduceMotion ? 0 : [0, 2, -2],
            y: shouldReduceMotion ? 0 : [0, -8, -18],
            opacity: shouldReduceMotion ? 0.6 : [0, 0.75, 0],
          }}
          transition={{
            duration: 2.8,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeOut",
            delay: 0.1,
          }}
          draggable={false}
        />
      </div>

      {/* Steam Layer 2: Center-Right gentle curve rise */}
      <div className="absolute z-20 top-7 left-[42%] pointer-events-none">
        <motion.img
          src="/img/asset-status-pesanan/smoke-icon.png"
          alt="Uap Masakan 2"
          className="w-3.5 h-5.5 sm:w-4 sm:h-6 object-contain -scale-x-100"
          initial={{ opacity: 0 }}
          animate={{
            x: shouldReduceMotion ? 0 : [0, -2, 2],
            y: shouldReduceMotion ? 0 : [0, -10, -20],
            opacity: shouldReduceMotion ? 0.6 : [0, 0.7, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeOut",
            delay: 0.8,
          }}
          draggable={false}
        />
      </div>

      {/* Steam Layer 3: Soft Center Puff rise */}
      <div className="absolute z-20 top-6 left-[38%] pointer-events-none">
        <motion.img
          src="/img/asset-status-pesanan/smoke-icon.png"
          alt="Uap Masakan 3"
          className="w-3.5 h-5 object-contain"
          initial={{ opacity: 0 }}
          animate={{
            x: shouldReduceMotion ? 0 : [0, 1.5, 0],
            y: shouldReduceMotion ? 0 : [0, -6, -14],
            opacity: shouldReduceMotion ? 0.5 : [0, 0.55, 0],
          }}
          transition={{
            duration: 2.6,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeOut",
            delay: 1.6,
          }}
          draggable={false}
        />
      </div>

      {/* Layer 3: Cooking Pan Hero Asset */}
      <motion.div
        className="relative z-10 w-44 h-28 sm:w-48 sm:h-32 flex items-center justify-center"
        initial={{ y: shouldReduceMotion ? 0 : 10, opacity: 0 }}
        animate={{
          y: shouldReduceMotion ? 0 : [0, -2, 0],
          opacity: 1,
        }}
        transition={{
          opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <img
          src="/img/asset-status-pesanan/wajan.png"
          alt="Wajan Memasak"
          className="max-w-[85%] max-h-[85%] w-auto h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
          draggable={false}
        />
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   4 & 5. TAKEAWAY BAG VISUAL (READY & COMPLETED)
   - Takeaway bag cleanly bounded
   - For COMPLETED: bag offset slightly right, checkmark placed at front-left
     WITHOUT overlapping the centered MENUIN logo, subtle green ground shadow
   - For READY: READY badge on upper-right, small green accents
   ========================================================================== */
function TakeawayBagVisual({ isCompleted }: { isCompleted: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow (Subtle green shadow for COMPLETED) */}
      <ContactShadow
        width="w-30 sm:w-34"
        color={isCompleted ? "bg-emerald-950/[0.1]" : "bg-stone-900/[0.08]"}
        className={isCompleted ? "translate-x-1.5" : ""}
      />

      {/* Green Accent Lines for READY */}
      {!isCompleted && (
        <>
          <motion.div
            className="absolute left-[20%] top-[42%] pointer-events-none z-20 flex flex-col gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, delay: 0.3 }}
          >
            <div className="w-3.5 h-1.5 bg-emerald-500 rounded-full rotate-[22deg] origin-right shadow-2xs" />
            <div className="w-4 h-1.5 bg-emerald-500 rounded-full rotate-[-6deg] origin-right shadow-2xs" />
          </motion.div>

          <motion.div
            className="absolute right-[20%] top-[42%] pointer-events-none z-20 flex flex-col gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, delay: 0.34 }}
          >
            <div className="w-3.5 h-1.5 bg-emerald-500 rounded-full rotate-[-22deg] origin-left shadow-2xs" />
            <div className="w-4 h-1.5 bg-emerald-500 rounded-full rotate-[6deg] origin-left shadow-2xs" />
          </motion.div>
        </>
      )}

      {/* Exactly Two Small Celebration Accents for COMPLETED */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Accent 1: Upper left */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-emerald-400/90 shadow-2xs"
            initial={{ x: 0, y: 0, scale: 0.5 }}
            animate={{ x: -48, y: -26, scale: 1 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          />
          {/* Accent 2: Upper right */}
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full bg-amber-400/90 shadow-2xs"
            initial={{ x: 0, y: 0, scale: 0.5 }}
            animate={{ x: 44, y: -24, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </motion.div>
      )}

      {/* Layer 3: Takeaway Bag (Offset slightly to right on COMPLETED) */}
      <motion.div
        className={`relative z-10 w-34 h-38 sm:w-38 sm:h-42 flex items-center justify-center ${
          isCompleted ? "translate-x-1.5 sm:translate-x-2" : ""
        }`}
        initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
        animate={{
          y: isCompleted ? (shouldReduceMotion ? 0 : [0, -2.5, 0]) : 0,
          opacity: 1,
        }}
        transition={{
          y: isCompleted
            ? { duration: 0.35, ease: "easeInOut" }
            : { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.3 },
        }}
      >
        <img
          src="/img/asset-status-pesanan/paperbag-menuin.png"
          alt="Pesanan Siap Diambil"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
          draggable={false}
        />

        {/* READY State: READY badge on upper-right area of the bag */}
        {!isCompleted && (
          <motion.div
            key="ready-badge"
            className="absolute top-1 -right-1 bg-emerald-500 text-white font-extrabold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-lg shadow-md border border-emerald-300/40 flex items-center gap-1 overflow-hidden z-20"
            initial={{ y: shouldReduceMotion ? 0 : -5, scale: shouldReduceMotion ? 1 : 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.26, delay: 0.22, ease: "easeOut" }}
          >
            <DrawnCheckmark size={12} color="#FFFFFF" strokeWidth={2.8} delay={0.3} />
            <span className="tracking-wider">READY</span>
          </motion.div>
        )}

        {/* 
          COMPLETED State: 
          Green checkmark placed at front-left of the bag
          NEVER covering the centered MENUIN logo!
        */}
        {isCompleted && (
          <motion.div
            key="completed-badge"
            className="absolute -left-2 bottom-1 sm:-left-2.5 sm:bottom-1.5 pointer-events-none z-20 flex items-center justify-center"
            initial={{ scale: shouldReduceMotion ? 1 : 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative flex items-center justify-center">
              {/* 300ms subtle green glow flash on entry */}
              <motion.span
                className="absolute w-12 h-12 rounded-full bg-emerald-400"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 0.45, 0], scale: [0.9, 1.25, 1.1] }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-lg flex items-center justify-center border-2 border-white/80 relative z-10">
                <DrawnCheckmark size={20} color="#FFFFFF" strokeWidth={3.2} delay={0.1} />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   6. PAYMENT_FAILED (Pembayaran Gagal)
   - Red note with contact shadow
   - Red failure circle with Drawn X
   - Exclamation mark badge at bottom-right
   ========================================================================== */
function PaymentFailedVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow */}
      <ContactShadow width="w-28 sm:w-32" color="bg-rose-950/[0.08]" />

      {/* Layer 3: Grounded Red Note Asset */}
      <motion.div
        className="relative z-10 w-32 h-40 sm:w-36 sm:h-44 flex items-center justify-center"
        initial={{ y: shouldReduceMotion ? 0 : 8, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          x: shouldReduceMotion ? 0 : [0, -2.5, 2.5, -1, 0],
        }}
        transition={{
          y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.3 },
          x: { duration: 0.3, delay: 0.24, ease: "easeInOut" },
        }}
      >
        <img
          src="/img/asset-status-pesanan/note-x.png"
          alt="Pembayaran Gagal"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
          draggable={false}
        />

        {/* Failure X Drawn on Red Circle */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none z-20"
          initial={{ scale: shouldReduceMotion ? 1 : 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.28, ease: "easeOut" }}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 shadow-md flex items-center justify-center border border-rose-300/50">
            <DrawnX size={18} color="#FFFFFF" strokeWidth={3} delay={0.32} />
          </div>
        </motion.div>

        {/* Small Exclamation Mark Badge beside the card */}
        <motion.div
          className="absolute -bottom-1 -right-1 z-25 pointer-events-none"
          initial={{ scale: shouldReduceMotion ? 1 : 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.26, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src="/img/asset-status-pesanan/alert-icon.png"
            alt="Gagal"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   7. CANCELLED (Pesanan Dibatalkan)
   - Orange note with contact shadow
   - Moves down 5px, opacity 90%
   - Orange circular X and diagonal cancellation stroke
   ========================================================================== */
function CancelledVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow */}
      <ContactShadow width="w-28 sm:w-32" color="bg-amber-950/[0.08]" className="translate-y-1" />

      {/* Layer 3: Grounded Orange Note Asset */}
      <motion.div
        className="relative z-10 w-32 h-40 sm:w-36 sm:h-44 flex items-center justify-center"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: shouldReduceMotion ? 0 : 5, opacity: 0.9 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <img
          src="/img/asset-status-pesanan/note-x orange.png"
          alt="Pesanan Dibatalkan"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
          draggable={false}
        />

        {/* Drawn Cancellation Diagonal Stroke across card */}
        <CancellationLine delay={0.32} />

        {/* Orange Circular X Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none z-25"
          initial={{ scale: shouldReduceMotion ? 1 : 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, delay: 0.24, ease: "easeOut" }}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 shadow-md flex items-center justify-center border border-amber-200/50">
            <DrawnX size={18} color="#FFFFFF" strokeWidth={3} delay={0.28} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ==========================================================================
   8. REJECTED (Pesanan Ditolak Outlet)
   - Real 3D Chef hat (/img/asset-status-pesanan/topi-koki.png)
   - Contact shadow underneath
   - Blue circular X icon at bottom-right corner
   - Subtle scale dip (100% -> 97% -> 100%), one small blue accent line
   ========================================================================== */
function RejectedVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Layer 2: Ground Contact Shadow underneath chef hat */}
      <ContactShadow width="w-26 sm:w-30" color="bg-slate-900/[0.08]" className="translate-y-1" />

      {/* Single Small Blue Accent Line */}
      <motion.div
        className="absolute bottom-4 right-[25%] pointer-events-none z-25"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, delay: 0.38 }}
      >
        <div className="w-1.5 h-3.5 bg-blue-500 rounded-full rotate-[32deg] shadow-2xs" />
      </motion.div>

      {/* Layer 3: Main Grounded 3D Chef Hat Asset */}
      <motion.div
        className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center"
        initial={{ y: shouldReduceMotion ? 0 : -6, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: shouldReduceMotion ? 1 : [1, 0.97, 1],
        }}
        transition={{
          y: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.3 },
          scale: { duration: 0.3, delay: 0.3, ease: "easeInOut" },
        }}
      >
        <img
          src="/img/asset-status-pesanan/topi-koki.png"
          alt="Topi Koki Ditolak"
          className="max-w-[82%] max-h-[82%] w-auto h-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
          draggable={false}
        />

        {/* Blue Circular X Badge (At bottom-right corner with Drawn X) */}
        <motion.div
          className="absolute -bottom-1 -right-1 z-20 pointer-events-none"
          initial={{ scale: shouldReduceMotion ? 1 : 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.24, delay: 0.22, ease: "easeOut" }}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 shadow-md flex items-center justify-center border border-blue-300/50">
            <DrawnX size={16} color="#FFFFFF" strokeWidth={3} delay={0.26} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

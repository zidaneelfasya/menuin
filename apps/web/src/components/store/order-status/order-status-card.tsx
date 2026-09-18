"use client";

import React from "react";
import { OrderStatusVisual, type OrderStatusType } from "./order-status-visual";
import { OrderStatusStepper } from "./order-status-stepper";
import { motion } from "framer-motion";

export type { OrderStatusType };

export interface OrderStatusConfig {
  badge: string;
  badgeStyle: string;
  title: string;
  description: string;
  step: 1 | 2 | 3 | 4 | 5;
  isCompleted?: boolean;
  isFailed?: boolean;
}

const BASE_ORDER_STATUS_CONFIGS: Record<string, OrderStatusConfig> = {
  AWAITING_PAYMENT: {
    badge: "Menunggu Konfirmasi",
    badgeStyle: "bg-blue-50/90 text-blue-600 border-blue-100",
    title: "Menunggu Konfirmasi",
    description: "Pesanan kamu sedang menunggu konfirmasi lakukan pembayaran di kasir jika belum melakukan pembayaran.",
    step: 1,
  },
  WAITING_PAYMENT: {
    badge: "Menunggu Konfirmasi",
    badgeStyle: "bg-blue-50/90 text-blue-600 border-blue-100",
    title: "Menunggu Konfirmasi",
    description: "Pesanan kamu sedang menunggu konfirmasi atau penyelesaian pembayaran.",
    step: 1,
  },
  CONFIRMED: {
    badge: "Pesanan Diterima",
    badgeStyle: "bg-blue-50/90 text-blue-600 border-blue-100",
    title: "Pesanan Diterima",
    description: "Pesanan baru telah diterima oleh outlet dan segera disiapkan.",
    step: 2,
  },
  PROCESSING: {
    badge: "Sedang Disiapkan",
    badgeStyle: "bg-amber-50/90 text-amber-600 border-amber-100",
    title: "Sedang Disiapkan",
    description: "Pesanan kamu sedang dibuat oleh tim outlet.",
    step: 3,
  },
  READY: {
    badge: "Pesanan Sudah Siap",
    badgeStyle: "bg-emerald-50/90 text-emerald-600 border-emerald-100",
    title: "Pesanan Sudah Siap",
    description: "Pesanan kamu sudah selesai dibuat dan siap diambil di outlet.",
    step: 4,
  },
  COMPLETED: {
    badge: "Pesanan Selesai",
    badgeStyle: "bg-emerald-50/90 text-emerald-600 border-emerald-100",
    title: "Pesanan Sudah Selesai",
    description: "Terima kasih sudah memesan melalui MENUIN.",
    step: 5,
    isCompleted: true,
  },
  PAYMENT_FAILED: {
    badge: "Pembayaran Gagal",
    badgeStyle: "bg-rose-50/90 text-rose-600 border-rose-100",
    title: "Pembayaran Gagal",
    description: "Pembayaran kamu belum berhasil. Silakan coba lagi atau pilih metode pembayaran lain.",
    step: 1,
  },
  CANCELLED: {
    badge: "Pesanan Dibatalkan",
    badgeStyle: "bg-amber-50/90 text-amber-600 border-amber-100",
    title: "Pesanan Dibatalkan",
    description: "Pesanan kamu telah dibatalkan. Jika ada pertanyaan, silakan hubungi outlet.",
    step: 1,
    isFailed: true,
  },
  REJECTED: {
    badge: "Pesanan Ditolak Outlet",
    badgeStyle: "bg-slate-100 text-slate-600 border-slate-200",
    title: "Pesanan Ditolak Outlet",
    description: "Outlet tidak dapat menerima pesanan kamu. Silakan coba lagi atau hubungi outlet.",
    step: 1,
    isFailed: true,
  },
};

export const ORDER_STATUS_CONFIGS = BASE_ORDER_STATUS_CONFIGS as Record<OrderStatusType, OrderStatusConfig>;

export function resolveOrderStatus(order: {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}): OrderStatusType {
  const status = (order?.status || "").toUpperCase();
  const paymentStatus = (order?.paymentStatus || "").toUpperCase();

  if (paymentStatus === "FAILED" || paymentStatus === "DENIED" || paymentStatus === "EXPIRED") {
    return "PAYMENT_FAILED";
  }

  if (status === "CANCELLED" || status === "CANCELED") {
    return "CANCELLED";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  if (status === "COMPLETED") {
    return "COMPLETED";
  }

  if (status === "READY") {
    return "READY";
  }

  if (status === "PROCESSING") {
    return "PROCESSING";
  }

  // Step 2: Diterima untuk pesanan baru
  if (status === "CONFIRMED" || status === "NEW") {
    return "CONFIRMED";
  }

  // Step 1: Waiting untuk menunggu konfirmasi atau pembayaran
  if (status === "PENDING" || paymentStatus === "PENDING") {
    return "AWAITING_PAYMENT";
  }

  return "AWAITING_PAYMENT";
}

export interface OrderStatusCardProps {
  status: OrderStatusType;
  orderNumber: string;
  primaryColor?: string;
  className?: string;
}

export function OrderStatusCard({
  status,
  orderNumber,
  primaryColor,
  className = "",
}: OrderStatusCardProps) {
  const config = ORDER_STATUS_CONFIGS[status] || ORDER_STATUS_CONFIGS.AWAITING_PAYMENT;

  const dynamicThemeStyle = primaryColor
    ? ({ "--outlet-primary": primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <div
      style={dynamicThemeStyle}
      className={`bg-white rounded-3xl shadow-xs border border-gray-150/80 flex flex-col relative overflow-hidden transition-all ${className}`}
    >
      {/* 1. Full-bleed 1:1 animation area closing/covering the entire width of the card */}
      <div className="w-full aspect-square relative overflow-hidden bg-gray-50/60">
        {/* 1:1 Rive animation stretching full width of the card */}
        <div className="absolute inset-0 w-full h-full">
          <OrderStatusVisual status={status} orderNumber={orderNumber} className="w-full h-full" />
        </div>
      </div>

      {/* 2. Content below the full-width animation */}
      <div className="w-full p-5 sm:p-6 flex flex-col items-center text-center">
        {/* Status title & description */}
        <motion.div
          key={`text-${status}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm mx-auto mb-5 px-1 text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug">
            {config.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-normal leading-relaxed mt-1.5 min-h-[36px] flex items-center justify-center">
            {config.description}
          </p>
        </motion.div>

        {/* 3. Progress tracker at the bottom with subtle divider */}
        <div className="w-full pt-5 border-t border-gray-100">
          <OrderStatusStepper
            currentStep={config.step}
            isCompleted={config.isCompleted}
            isFailed={config.isFailed}
            statusType={status}
            primaryColor={primaryColor}
          />
        </div>
      </div>
    </div>
  );
}

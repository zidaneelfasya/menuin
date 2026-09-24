"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OrderStatusCard, type OrderStatusType } from "@/components/store/order-status/order-status-card";
import { OrderStatusRive } from "@/components/store/order-status/order-status-rive";
import { OrderStatusDemoSwitcher } from "@/components/store/order-status/order-status-demo-switcher";
import { OrderIllustrationDisclaimer } from "@/components/store/order-status/order-illustration-disclaimer";
import { 
  Smartphone, 
  LayoutGrid, 
  Sparkles, 
  FileCode2, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  ShoppingBag,
  ArrowRight,
  Info,
  Palette
} from "lucide-react";

interface AnimationMeta {
  status: OrderStatusType;
  label: string;
  sublabel: string;
  filename: string;
  filesize: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const RIVE_ANIMATIONS: AnimationMeta[] = [
  {
    status: "AWAITING_PAYMENT",
    label: "Waiting",
    sublabel: "Menunggu Konfirmasi (Visual Jam)",
    filename: "menunggu_konfirmasi.riv",
    filesize: "1.50 MB",
    accent: "#2563eb",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
  },
  {
    status: "CONFIRMED",
    label: "Diterima",
    sublabel: "Pesanan Baru / Diterima (Visual Nota)",
    filename: "new.riv",
    filesize: "1.50 MB",
    accent: "#2563eb",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
  },
  {
    status: "PROCESSING",
    label: "Disiapkan",
    sublabel: "Sedang Dimasak / Processing (Visual Dapur)",
    filename: "processing.riv",
    filesize: "1.70 MB",
    accent: "#f59e0b",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
  },
  {
    status: "READY",
    label: "Siap",
    sublabel: "Pesanan Sudah Siap (Visual Hidangan)",
    filename: "ready.riv",
    filesize: "1.64 MB",
    accent: "#059669",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
  },
  {
    status: "COMPLETED",
    label: "Selesai",
    sublabel: "Pesanan Sudah Selesai (Visual Serah Terima)",
    filename: "selesai.riv",
    filesize: "1.61 MB",
    accent: "#059669",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
  },
];

const BRAND_THEMES = [
  { name: "Biru Outlet", color: "#0E59F9" },
  { name: "Hijau Toko", color: "#16A34A" },
  { name: "Merah Resto", color: "#DC2626" },
  { name: "Amber Kafe", color: "#D97706" },
  { name: "Ungu Brand", color: "#7C3AED" },
];

export default function StatusDemoPage() {
  const [activeTab, setActiveTab] = useState<"simulator" | "gallery">("simulator");
  const [currentStatus, setCurrentStatus] = useState<OrderStatusType>("PROCESSING");
  const [orderNumber, setOrderNumber] = useState("#A-0824");
  const [themeColor, setThemeColor] = useState("#0E59F9");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-gray-900">Demo Visual Status Pesanan</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Vektor 2D Dinamis
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Preview interaktif status storefront Menuin dengan warna aksen dinamis mengikuti tema tenant
              </p>
            </div>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "simulator"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulasi Mobile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "gallery"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Galeri 5 Animasi</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-blue-950">Semua animasi dirender langsung dengan Rive Runtime</p>
              <p className="text-xs text-blue-700">
                Ukuran rasio dijaga presisi 1:1 (square container) dengan Fit.Contain agar simetris di semua resolusi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-200">
            <span>5 File Rive Aktif</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
        </div>

        {activeTab === "simulator" ? (
          /* =========================================================================
             VIEW 1: STOREFRONT MOBILE SIMULATOR
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controls Side Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">Pilih Status Pesanan</h2>
                    <p className="text-xs text-gray-500">Uji perubahan status secara real-time</p>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                    Live
                  </span>
                </div>

                {/* Status Selection Buttons */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status Rive (.riv)
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {RIVE_ANIMATIONS.map((anim) => {
                      const isActive = currentStatus === anim.status;
                      return (
                        <button
                          key={anim.status}
                          type="button"
                          onClick={() => setCurrentStatus(anim.status)}
                          className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm">{anim.label}</span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                                  isActive
                                    ? "bg-blue-700 text-blue-100"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                Rive 1:1
                              </span>
                            </div>
                            <p
                              className={`text-[11px] ${
                                isActive ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {anim.filename} &bull; {anim.filesize}
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 transition-transform ${
                              isActive ? "translate-x-0.5 text-white" : "text-gray-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fallback Error States */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status Gagal / Batal (Fallback SVG)
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["PAYMENT_FAILED", "CANCELLED", "REJECTED"] as OrderStatusType[]).map(
                      (st) => {
                        const isActive = currentStatus === st;
                        const labelMap: Record<string, string> = {
                          PAYMENT_FAILED: "Gagal Bayar",
                          CANCELLED: "Dibatalkan",
                          REJECTED: "Ditolak",
                        };
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setCurrentStatus(st)}
                            className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                              isActive
                                ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {labelMap[st]}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Outlet Brand Color Theme Picker */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Warna Brand Outlet
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {themeColor}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BRAND_THEMES.map((theme) => {
                      const isSelected = themeColor === theme.color;
                      return (
                        <button
                          key={theme.color}
                          type="button"
                          onClick={() => setThemeColor(theme.color)}
                          className={`h-8 rounded-lg flex items-center justify-center transition-all border ${
                            isSelected
                              ? "ring-2 ring-offset-2 ring-gray-900 shadow-xs scale-105"
                              : "hover:scale-102 opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: theme.color, borderColor: "rgba(0,0,0,0.1)" }}
                          title={theme.name}
                          aria-label={theme.name}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order Number Simulator Input */}
                <div className="pt-2 border-t border-gray-100">
                  <label htmlFor="order-no" className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Nomor Pesanan Simulasi
                  </label>
                  <input
                    id="order-no"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm font-bold tracking-wider rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono"
                  />
                </div>
              </div>

              {/* Technical Spec Box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs text-xs space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-blue-600" />
                  Spesifikasi Implementasi Rive
                </h3>
                <div className="space-y-1.5 text-gray-600">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Package Runtime:</span>
                    <span className="font-mono font-bold text-gray-900">@rive-app/react-canvas</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Aspect Ratio:</span>
                    <span className="font-mono font-bold text-emerald-600">1:1 (Square, Full-bleed)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Theme Variable:</span>
                    <span className="font-mono font-bold text-blue-600">--outlet-primary</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Folder Path:</span>
                    <span className="font-mono text-gray-700">public/animation/status-animation/</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Storefront Mobile Mockup Frame */}
            <div className="lg:col-span-7 flex justify-center">
              <div
                style={{ "--outlet-primary": themeColor } as React.CSSProperties}
                className="w-full max-w-md bg-white rounded-3xl sm:rounded-[36px] border-4 sm:border-8 border-gray-900 shadow-2xl overflow-hidden"
              >
                {/* Mobile Speaker & Camera Notch */}
                <div className="bg-gray-900 py-2.5 px-6 flex items-center justify-center">
                  <div className="w-16 h-4 bg-gray-800 rounded-full"></div>
                </div>

                {/* Mobile Header Bar */}
                <div className="bg-white px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">MENUIN Storefront</span>
                  <span className="text-[11px] font-mono text-gray-400">9:41 AM</span>
                </div>

                {/* Mobile Viewport Body */}
                <div className="p-4 bg-white space-y-4">
                  {/* 1. Order Type Pill */}
                  <div className="px-3 py-2 rounded-xl border border-pink-200/60 bg-pink-50/30 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Order Type</span>
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                      <span>Dine-In (Meja 04)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                    </span>
                  </div>

                  {/* 2. Date & Order Number */}
                  <div className="flex items-start justify-between text-xs px-0.5">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-0.5">Date</span>
                      <span className="font-semibold text-gray-800 text-xs">24 Sep 2026, 09:41</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block mb-0.5">Order Number</span>
                      <span className="font-mono font-semibold text-xs text-gray-900">{orderNumber}</span>
                    </div>
                  </div>

                  {/* 3. Center Stage: Large Status Pesanan SVG */}
                  <div className="pt-2 pb-1 flex flex-col items-center select-none text-center">
                    <OrderStatusCard
                      status={currentStatus}
                      orderNumber={orderNumber}
                      primaryColor={themeColor}
                      variant="unboxed"
                    />

                    {/* Subtle Live Kitchen Connection Pill */}
                    {currentStatus !== "COMPLETED" &&
                      currentStatus !== "CANCELLED" &&
                      currentStatus !== "REJECTED" && (
                        <div className="flex justify-center pt-2">
                          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-gray-600 bg-gray-50/90 px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-2xs select-none">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Terhubung langsung dengan dapur (live)</span>
                          </div>
                        </div>
                      )}

                    {/* Notice Box */}
                    {currentStatus === "AWAITING_PAYMENT" && (
                      <div className="mt-4 w-full bg-amber-50/90 border border-amber-200/90 text-amber-900 p-3 rounded-xl text-xs flex items-start gap-2 text-left leading-relaxed">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          Silakan menuju kasir untuk melakukan pembayaran sebesar <strong className="font-semibold text-gray-900">Rp 48.000</strong>.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-150 my-2" />

                  {/* 4. Ordered Items */}
                  <div className="space-y-2.5 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Ordered Items
                      </h3>
                      <span className="text-[11px] text-gray-400">2 item</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-900 shrink-0">1x</span>
                          <div>
                            <span className="font-semibold text-gray-900 block">Butter Croissant</span>
                            <span className="text-[11px] text-gray-500">Extra Butter (+Rp 3.000)</span>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">Rp 28.000</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-900 shrink-0">1x</span>
                          <div>
                            <span className="font-semibold text-gray-900 block">Iced Caffe Latte</span>
                            <span className="text-[11px] text-gray-500">Less Sugar (50%)</span>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">Rp 20.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-150 my-2" />

                  {/* 5. Subtotal Breakdown */}
                  <div className="space-y-1.5 text-xs text-left">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal (2 menu)</span>
                      <span className="font-semibold text-gray-800">Rp 48.000</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Pajak Resto (PB1)</span>
                      <span className="font-semibold text-gray-800">Rp 0</span>
                    </div>
                    <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-baseline font-semibold text-sm text-gray-900">
                      <span>Total Tagihan</span>
                      <span className="text-base font-semibold" style={{ color: themeColor }}>
                        Rp 48.000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Home Bar */}
                <div className="bg-gray-50 pb-3 pt-1 flex justify-center">
                  <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW 2: GALLERY SIDE-BY-SIDE OF ALL 5 RIVE ANIMATIONS
             ========================================================================= */
          <div className="space-y-6">
            <div className="text-left">
              <h2 className="text-xl font-black text-gray-900">Semua Animasi Status (Rasio 1:1)</h2>
              <p className="text-xs text-gray-500 mt-1">
                Kelima animasi Rive beroperasi secara mandiri dengan kanvas rasio 1:1 presisi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {RIVE_ANIMATIONS.map((anim) => (
                <div
                  key={anim.status}
                  className="bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col items-center text-center overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Full-width 1:1 Rive Canvas Container */}
                  <div className="w-full aspect-square relative overflow-hidden bg-gray-50 flex items-center justify-center">
                    {/* Floating badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-md bg-white/90 ${anim.badgeBg} ${anim.badgeText} ${anim.badgeBorder}`}
                      >
                        {anim.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-gray-700 font-semibold border border-gray-200/80 shadow-2xs">
                        1:1 Ratio
                      </span>
                    </div>

                    <OrderStatusRive
                      key={anim.filename}
                      src={`/animation/status-animation/${anim.filename}`}
                      stateMachine="State Machine 1"
                      ariaLabel={anim.label}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Animation Metadata */}
                  <div className="w-full p-4 border-t border-gray-100 text-left space-y-1 bg-white">
                    <p className="text-xs font-bold text-gray-900">{anim.sublabel}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>{anim.filename}</span>
                      <span>{anim.filesize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

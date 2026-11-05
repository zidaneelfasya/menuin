"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Token definitions for light & dark themes with Menuin Brand Blue accent (#0e59f9)
export const CSS_VARS = cn(
  "[--m-paper:#ffffff] [--m-panel:#f4f4f4] [--m-card:#ffffff] [--m-chip:#ebebeb] [--m-chip-hover:#e2e2e2]",
  "[--m-ink:#171717] [--m-muted:#646464] [--m-accent:#0e59f9] [--m-glow:#ebf3ff]",
  "[--m-line:rgba(0,0,0,0.08)] [--m-line-strong:rgba(0,0,0,0.16)]",
  "[--m-win:#ffffff] [--m-win-side:#fafafa] [--m-win-line:rgba(0,0,0,0.08)]",
  "dark:[--m-paper:#0a0a0a] dark:[--m-panel:#171717] dark:[--m-card:#232323] dark:[--m-chip:#262626] dark:[--m-chip-hover:#303030]",
  "dark:[--m-ink:#ededed] dark:[--m-muted:#a1a1a1] dark:[--m-accent:#3b82f6] dark:[--m-glow:#172554]",
  "dark:[--m-line:rgba(255,255,255,0.08)] dark:[--m-line-strong:rgba(255,255,255,0.16)]",
  "dark:[--m-win:#161616] dark:[--m-win-side:#111111] dark:[--m-win-line:rgba(255,255,255,0.08)]"
);

// Standard quintic ease curve
const EASE_QUINT = [0.23, 1, 0.32, 1] as const;
// Custom laptop hinge spring bezier curve
const EASE_HINGE = [0.901, 0.016, 0, 1.032] as const;

const TYPO = {
  h2: "font-medium text-[2.125rem] leading-[1.1] tracking-[-0.035em] text-balance text-[var(--m-ink)] sm:text-5xl",
  lede: "max-w-[52ch] text-base text-pretty text-[var(--m-muted)] sm:text-[0.9375rem] sm:leading-6",
};

interface HeaderProps {
  id?: string;
  title: string;
  lede?: string;
  className?: string;
}

function SectionHeader({ id, title, lede, className }: HeaderProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-2xl flex-col items-center gap-4 text-center",
        className
      )}
    >
      <h2 id={id} className={TYPO.h2}>
        {title}
      </h2>
      {lede ? <p className={TYPO.lede}>{lede}</p> : null}
    </div>
  );
}

// Screen content unblur variant
const screenUnblurVariants = {
  closed: { opacity: 0, filter: "blur(8px)" },
  open: { opacity: 1, filter: "blur(0px)" },
};

function ScreenUnblur({
  children,
  delay = 0,
  instant = false,
}: {
  children: React.ReactNode;
  delay?: number;
  instant?: boolean;
}) {
  return (
    <motion.div
      variants={screenUnblurVariants}
      transition={
        instant ? { duration: 0 } : { duration: 0.35, ease: "easeOut", delay }
      }
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

// Waveform bar heights for live sync indicator
const WAVEFORM_HEIGHTS = [4, 8, 5, 10, 7, 12, 6, 9, 4, 7, 11, 5];

// ============================================================================
// 1. LAPTOP SCREEN & MOCKUP (DASHBOARD OUTLET • KOPI JOTOS)
// ============================================================================
function LaptopScreen({ instant = false }: { instant?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-900">
      {/* Top macOS browser/window bar */}
      <div className="flex h-5 shrink-0 items-center justify-between border-b border-black/10 bg-white/95 px-2.5 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/95">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#ff5f57]" />
          <span className="size-1.5 rounded-full bg-[#febc2e]" />
          <span className="size-1.5 rounded-full bg-[#28c840]" />
          <span className="ml-1.5 text-[7px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
            Dashboard Outlet • KOPI JOTOS
          </span>
        </div>
        <div className="flex items-center gap-1 text-[6.5px] font-medium text-neutral-500">
          <span className="size-1 rounded-full bg-[#10b981]" />
          <span>Live 17:41 WIB</span>
        </div>
      </div>

      {/* Actual Menuin Dashboard View */}
      <div className="relative flex-1 overflow-hidden bg-slate-50 dark:bg-neutral-950">
        <img
          src="/landing/features/dashboard.png"
          alt="Dashboard Outlet Menuin"
          className="h-full w-full object-cover object-top select-none pointer-events-none"
        />

        {/* Ambient Bottom Gradient to seamlessly host the floating sync pill */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Floating Real-Time Outlet Telemetry Pill */}
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-neutral-950/90 px-2.5 py-1 text-[7.5px] font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_20px_-6px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <motion.span
            className="size-1.5 rounded-full bg-[#10b981]"
            animate={instant ? undefined : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-semibold text-white">Live Sync</span>
          <span className="text-white/40">•</span>
          <span className="flex h-2.5 items-center gap-px">
            {WAVEFORM_HEIGHTS.map((height, idx) => (
              <span
                key={idx}
                className="w-px rounded-full bg-emerald-400"
                style={{ height: Math.max(3, height * 0.7) }}
              />
            ))}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-white/90">Rp 24,8 Jt</span>
        </div>
      </div>
    </div>
  );
}

function LaptopMockup({ instant = false }: { instant?: boolean }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 w-[316px]"
      style={{
        transform: "translate(-50%, -50%)",
        perspective: "1200px",
      }}
    >
      {/* 3D Hinge Lid */}
      <motion.div
        style={{ transformOrigin: "bottom" }}
        variants={{
          closed: { rotateX: -70 },
          open: { rotateX: 0 },
        }}
        transition={
          instant ? { duration: 0 } : { duration: 1, ease: EASE_HINGE }
        }
        className="mx-auto h-[188px] w-[90%] rounded-t-xl bg-neutral-100 p-1.5 shadow-sm ring-1 shadow-black/10 ring-black/10 dark:bg-neutral-800 dark:shadow-white/5 dark:ring-white/10"
      >
        <div className="relative h-full w-full overflow-hidden rounded-t-lg rounded-b-sm bg-white dark:bg-neutral-900">
          <ScreenUnblur delay={0.55} instant={instant}>
            <LaptopScreen instant={instant} />
          </ScreenUnblur>
        </div>
      </motion.div>

      {/* Keyboard Base Chassis */}
      <div className="relative h-4 w-full rounded-t-md rounded-b-3xl bg-gradient-to-b from-neutral-100 to-neutral-300 shadow-[0px_1px_0px_0px_rgba(229,229,229,1)_inset] dark:from-neutral-700 dark:to-neutral-900 dark:shadow-[0px_1px_0px_0px_rgba(82,82,82,1)_inset]">
        <div className="absolute inset-x-0 top-0 mx-auto h-2 w-14 rounded-b-sm bg-neutral-400 shadow-[0px_-1px_0px_0px_rgba(212,212,212,1)_inset] dark:bg-neutral-600 dark:shadow-[0px_-1px_0px_0px_rgba(115,115,115,1)_inset]" />
      </div>
    </div>
  );
}

// ============================================================================
// 2. PHONE SCREEN & MOCKUP (STOREFRONT STATUS PESANAN • SEDANG DISIAPKAN)
// ============================================================================
const BUTTON_STYLE =
  "bg-neutral-300 shadow-[0px_0px_1px_0px_rgba(163,163,163,1)] dark:bg-neutral-600 dark:shadow-[0px_0px_1px_0px_rgba(115,115,115,1)]";

function PhoneScreen({ instant = false }: { instant?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-neutral-900">
      {/* Storefront Order Status Screenshot */}
      <img
        src="/landing/features/storefront-status.jpg"
        alt="Status Pesanan Storefront Menuin"
        className="h-full w-full object-cover object-top select-none pointer-events-none"
      />

      {/* Dynamic Island Overlay at top */}
      <div className="absolute top-2 left-1/2 z-20 flex h-[18px] w-[74px] -translate-x-1/2 items-center justify-between rounded-full bg-black px-2 text-[7px] font-medium text-white shadow-xs">
        <motion.span
          className="size-1.5 rounded-full bg-[#10b981]"
          animate={instant ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <span>17:46</span>
      </div>
    </div>
  );
}

function PhoneMockup({ instant = false }: { instant?: boolean }) {
  return (
    <motion.div
      variants={{
        closed: { x: "-50%", y: 36 },
        open: { x: "-50%", y: 0 },
      }}
      transition={
        instant ? { duration: 0 } : { duration: 0.9, ease: EASE_QUINT }
      }
      className="absolute top-10 left-1/2 w-[210px]"
    >
      {/* Side volume buttons */}
      <div className="absolute top-24 -left-[3px] flex flex-col gap-3">
        <div className={cn("h-5 w-[3px] rounded-l-sm", BUTTON_STYLE)} />
        <div className={cn("h-9 w-[3px] rounded-l-sm", BUTTON_STYLE)} />
        <div className={cn("h-9 w-[3px] rounded-l-sm", BUTTON_STYLE)} />
      </div>

      {/* Side power button */}
      <div className="absolute top-32 -right-[3px]">
        <div className={cn("h-14 w-[3px] rounded-r-sm", BUTTON_STYLE)} />
      </div>

      {/* Phone chassis */}
      <div className="rounded-[2.5rem] bg-neutral-100 p-1.5 shadow-sm ring-1 shadow-black/10 ring-black/10 dark:bg-neutral-800 dark:shadow-white/5 dark:ring-white/10">
        <div className="relative h-[430px] w-full overflow-hidden rounded-[2.125rem] bg-white dark:bg-neutral-900">
          <ScreenUnblur delay={0.35} instant={instant}>
            <PhoneScreen instant={instant} />
          </ScreenUnblur>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// 3. TABLET SCREEN & MOCKUP (KITCHEN DISPLAY SYSTEM • SEMUA PESANAN)
// ============================================================================
function TabletScreen({ instant = false }: { instant?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 dark:bg-neutral-950">
      {/* Actual KDS POS Order Status View anchored fully to the left */}
      <img
        src="/landing/features/orders-kds.png"
        alt="KDS Manajemen Pesanan Menuin"
        className="h-full w-full object-cover select-none pointer-events-none"
        style={{ objectPosition: "left top" }}
      />

      {/* Standout Spring Popover Card: New Incoming Order Alert (#010) */}
      <motion.div
        variants={{
          closed: { opacity: 0, y: 8, scale: 0.96 },
          open: { opacity: 1, y: 0, scale: 1 },
        }}
        transition={
          instant
            ? { duration: 0 }
            : { type: "spring", duration: 0.5, bounce: 0.2, delay: 0.75 }
        }
        className="absolute top-[88px] left-[52px] z-20 w-[240px] rounded-xl bg-white/95 p-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_12px_28px_-10px_rgba(0,0,0,0.25)] backdrop-blur-md dark:bg-neutral-900/95 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#0e59f9]/10 text-[10px] font-bold text-[#0e59f9]">
            #010
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[8.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                Pesanan Baru Masuk
              </p>
              <span className="text-[7.5px] text-neutral-500">21.35 WIB</span>
            </div>
            <p className="truncate text-[8px] text-neutral-500 dark:text-neutral-400">
              Meja 012 · Taro Latte (3x)
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-1.5 dark:border-neutral-800">
          <span className="text-[8.5px] font-bold text-neutral-900 dark:text-neutral-100">
            Rp 84.000
          </span>
          <div className="flex items-center gap-1 rounded-md bg-[#0e59f9] px-2.5 py-1 text-[8px] font-semibold text-white shadow-xs">
            <span>Mulai Siapkan</span>
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
              <path
                d="M4.5 2.5l3.5 3.5-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TabletMockup({ instant = false }: { instant?: boolean }) {
  return (
    <motion.div
      variants={{
        closed: { x: 36 },
        open: { x: 0 },
      }}
      transition={
        instant ? { duration: 0 } : { duration: 0.9, ease: EASE_QUINT }
      }
      className="absolute top-12 left-8 w-[440px]"
    >
      {/* Side buttons */}
      <div className="absolute top-12 -left-[3px] flex flex-col gap-2.5">
        <div className={cn("h-8 w-[3px] rounded-l-sm", BUTTON_STYLE)} />
        <div className={cn("h-8 w-[3px] rounded-l-sm", BUTTON_STYLE)} />
      </div>

      {/* Top power button */}
      <div className="absolute -top-[3px] left-14">
        <div className={cn("h-[3px] w-10 rounded-t-sm", BUTTON_STYLE)} />
      </div>

      {/* Tablet chassis */}
      <div className="rounded-[1.75rem] bg-neutral-100 p-2 shadow-sm ring-1 shadow-black/10 ring-black/10 dark:bg-neutral-800 dark:shadow-white/5 dark:ring-white/10">
        <div className="relative h-[320px] w-full overflow-hidden rounded-[1.25rem] bg-white dark:bg-neutral-900">
          <ScreenUnblur delay={0.35} instant={instant}>
            <TabletScreen instant={instant} />
          </ScreenUnblur>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// 4. MAIN FEATURE GRID COMPONENT
// ============================================================================
const FEATURES = [
  {
    device: "mac" as const,
    title: "Dashboard & Analitik di Laptop",
    description:
      "Pantau omzet real-time, laba kotor, arus kas, dan menu terlaris outlet Anda dalam satu kendali terpusat.",
    alt: "Laptop menampilkan dashboard outlet Kopi Jotos dengan grafik penjualan dan metrik omzet.",
  },
  {
    device: "phone" as const,
    title: "Status Pesanan di Smartphone",
    description:
      "Pelanggan memantau pesanan secara langsung dari ponsel mulai dari diterima, disiapkan, hingga siap saji.",
    alt: "Smartphone menampilkan halaman status pesanan pelanggan dengan tahap Sedang Disiapkan.",
  },
  {
    device: "tablet" as const,
    title: "Kitchen Display System di Tablet",
    description:
      "Kelola antrean tiket pesanan masuk, alur dapur, dan status meja secara terorganisir dengan satu sentuhan.",
    alt: "Tablet menampilkan sistem manajemen pesanan KDS dengan kolom kanban pesanan.",
  },
];

function CardIllustration({
  device,
  instant,
}: {
  device: "mac" | "phone" | "tablet";
  instant: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      initial="closed"
      whileInView="open"
      viewport={{ amount: 0.15 }}
      className="relative h-60 sm:h-72 lg:h-[19.5rem] overflow-hidden rounded-[1.75rem] bg-[var(--m-panel)]"
    >
      {device === "mac" ? <LaptopMockup instant={instant} /> : null}
      {device === "phone" ? <PhoneMockup instant={instant} /> : null}
      {device === "tablet" ? <TabletMockup instant={instant} /> : null}
    </motion.div>
  );
}

export function FeatureGridHeader({ className }: { className?: string }) {
  return (
    <SectionHeader
      id="devices-heading"
      title="Works wherever you are."
      lede="One account across every screen you own. Pick up exactly where you left off."
      className={cn("max-w-3xl", className)}
    />
  );
}

export function FeatureGridCards({ instant = false }: { instant?: boolean }) {
  const isReduced = !!useReducedMotion();
  const shouldBeInstant = instant || isReduced;

  return (
    <ul className="mx-auto grid max-w-[1200px] w-full gap-5 md:grid-cols-3 md:gap-4 lg:gap-6 list-none p-0 m-0">
      {FEATURES.map((item) => (
        <li key={item.device} className="flex flex-col min-w-0">
          <figure className="m-0">
            <CardIllustration device={item.device} instant={shouldBeInstant} />
            <figcaption className="sr-only">{item.alt}</figcaption>
          </figure>
          <div className="mt-3.5 flex flex-col items-center gap-1 text-center">
            <h3 className="text-[0.9375rem] font-medium text-[var(--m-ink)]">
              {item.title}
            </h3>
            <p className="max-w-[34ch] text-xs sm:text-sm leading-[1.4] text-pretty text-[var(--m-muted)]">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FeatureGridMinimal() {
  const isReduced = !!useReducedMotion();

  return (
    <section
      aria-labelledby="devices-heading"
      className={cn(
        CSS_VARS,
        "w-full bg-[var(--m-paper)] px-4 py-20 sm:px-6 sm:py-28"
      )}
    >
      <FeatureGridHeader />
      <div className="mt-12 sm:mt-16">
        <FeatureGridCards instant={isReduced} />
      </div>
    </section>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Matrix4, Quaternion } from "three";
import { cardSide, exitRotation, sideRotation, type CardSide } from "./feature-card-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Monitor,
  MonitorSmartphone,
  Package,
  QrCode,
  TicketPercent,
  Wallet,
} from "lucide-react";

export interface SystemFeature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  headline: string;
  ctaText: string;
  ctaHref: string;
  items: Array<{
    title: string;
    description: string;
  }>;
}

export const MENUIN_FEATURES: SystemFeature[] = [
  {
    id: "qr-order",
    label: "QR Self-Order",
    icon: QrCode,
    headline: "Tamu pesan dan bayar dari meja tanpa antre di kasir",
    ctaText: "Lihat cara kerja QR meja",
    ctaHref: "/fitur#self-order",
    items: [
      {
        title: "Scan & Pesan Instan (Zero App Installation)",
        description:
          "Tamu cukup memindai stiker QR di meja menggunakan kamera ponsel. Katalog menu langsung terbuka di browser tanpa perlu unduh aplikasi atau registrasi yang merepotkan.",
      },
      {
        title: "Kustomisasi Modifier & Bayar Langsung QRIS",
        description:
          "Tamu bebas memilih level gula, es, opsi susu, topping, serta catatan khusus koki. Pembayaran QRIS dinamis langsung terverifikasi seketika dan pesanan terkirim ke dapur tanpa memanggil pelayan.",
      },
    ],
  },
  {
    id: "pos",
    label: "Kasir POS",
    icon: Monitor,
    headline: "Transaksi secepat kilat dengan jumlah klik minimal (<150ms)",
    ctaText: "Lihat modul kasir POS",
    ctaHref: "/fitur#pos",
    items: [
      {
        title: "Alur Kasir Cepat & Multi-Tender",
        description:
          "Layar kasir yang intuitif untuk pesanan walk-in maupun takeaway. Menerima pembayaran tunai dengan kalkulator kembalian otomatis, kartu EDC, QRIS, hingga pesanan platform ojol (GrabFood/GoFood).",
      },
      {
        title: "Struk Universal & Proteksi Idempotensi",
        description:
          "Pencetakan struk instan ke printer Bluetooth maupun kabel LAN (58mm/80mm). Sistem dilindungi kunci idempotensi sehingga transaksi tidak pernah terduplikasi meski jaringan melambat.",
      },
    ],
  },
  {
    id: "multi-device",
    label: "Multi-Device",
    icon: MonitorSmartphone,
    headline: "Bisa diakses di mana pun, di perangkat apa pun yang Anda miliki",
    ctaText: "Lihat fleksibilitas perangkat",
    ctaHref: "/fitur#device",
    items: [
      {
        title: "Gunakan Perangkat Apa Saja (Bebas Hardware Khusus)",
        description:
          "Tidak perlu membeli mesin kasir atau tablet khusus yang mahal. Buka Menuin langsung dari smartphone Android, iPhone, iPad, tablet, hingga laptop yang sudah Anda miliki.",
      },
      {
        title: "Akses Cloud Real-Time Kapan Saja & di Mana Saja",
        description:
          "Kelola operasional dan pantau transaksi dari rumah, kantor, atau saat perjalanan. Seluruh data tersinkronisasi instan antar-perangkat tanpa perlu instalasi server fisik.",
      },
    ],
  },
  {
    id: "shift",
    label: "Shift & Kas",
    icon: Wallet,
    headline: "Cegah kebocoran kas laci dengan metode hitung fisik yang ketat",
    ctaText: "Lihat sistem audit kas shift",
    ctaHref: "/fitur#shift",
    items: [
      {
        title: "Modal Awal & Pencatatan Kas Keluar (Petty Cash)",
        description:
          "Kasir wajib menginput modal kembalian awal saat buka laci. Setiap pengeluaran darurat operasional (beli es batu, bayar kurir) tercatat rapi dengan alasan dan nominal yang transparan.",
      },
      {
        title: "Metode Hitung Buta (Blind Cash Count)",
        description:
          "Saat tutup shift, kasir menghitung fisik uang tanpa melihat target angka sistem. Selisih kas langsung terdeteksi seketika: Pas (Rp 0), Surplus, atau Defisit.",
      },
    ],
  },
  {
    id: "stock",
    label: "Stok & HPP",
    icon: Package,
    headline: "Ketahui modal riil setiap porsi dan kontrol bahan baku secara akurat",
    ctaText: "Lihat kontrol stok & HPP",
    ctaHref: "/fitur#stok",
    items: [
      {
        title: "Pengurangan Stok Otomatis Berbasis Resep",
        description:
          "Setiap menu terjual otomatis memotong gramatur stok bahan baku di gudang. Notifikasi stok menipis (low-stock alert) mencegah restoran kehabisan bahan di tengah jam sibuk.",
      },
      {
        title: "Kalkulasi HPP & Margin Laba Kotor",
        description:
          "Hitung harga pokok penjualan (HPP/COGS) nyata per hidangan. Ketahui menu paling menguntungkan (Star items) dan menu yang membebani modal bahan baku (Dogs).",
      },
    ],
  },
  {
    id: "reports",
    label: "Laporan & Pajak",
    icon: BarChart3,
    headline: "Pemisahan tegas omzet bersih, arus kas riil, dan titipan pajak PB1",
    ctaText: "Lihat analitik & laporan",
    ctaHref: "/fitur#laporan",
    items: [
      {
        title: "Isolasi Utang Pajak Restoran (PB1 / PBJT 10%)",
        description:
          "Pajak 10% dikelompokkan secara terpisah sebagai titipan kas daerah, bukan pendapatan resto. Pemilik terhindar dari kaget bayar pajak dan krisis arus kas di akhir bulan.",
      },
      {
        title: "Arus Kas Riil & Ekspor 1-Klik",
        description:
          "Pantau uang tunai yang sudah di tangan versus saldo settlement QRIS gateway. Ekspor laporan harian dan bulanan ke format Excel (XLSX) atau PDF siap audit.",
      },
    ],
  },
  {
    id: "promotions",
    label: "Diskon & Promo",
    icon: TicketPercent,
    headline: "Tingkatkan penjualan dengan diskon otomatis tanpa hitung manual",
    ctaText: "Lihat pengaturan promo",
    ctaHref: "/fitur#promo",
    items: [
      {
        title: "Voucher Persentase & Potongan Nominal",
        description:
          "Buat kode promo fleksibel dengan batasan minimal belanja, batas maksimal potongan harga, dan kuota pemakaian untuk menjaga margin keuntungan restoran.",
      },
      {
        title: "Jadwal Happy Hour & Multi-Kanal",
        description:
          "Jadwalkan promo otomatis pada jam sepi pengunjung (misal 14.00–16.00). Promo otomatis teraplikasi serentak di kasir POS dan menu pemesanan QR pelanggan.",
      },
    ],
  },
  {
    id: "multi-outlet",
    label: "Multi-Outlet",
    icon: Building2,
    headline: "Ekspansi cabang baru dan kelola seluruh outlet dalam satu akun pusat",
    ctaText: "Lihat fitur multi-outlet & tim",
    ctaHref: "/fitur#multi-outlet",
    items: [
      {
        title: "Dasbor Pusat Multi-Cabang (HQ Dashboard)",
        description:
          "Buka cabang baru tanpa setup rumit. Pantau ringkasan omzet, laba kotor, dan operasional seluruh cabang, serta berpindah antar-outlet dalam 1 klik.",
      },
      {
        title: "Hak Akses Berbasis Peran (RBAC)",
        description:
          "Pemisahan wewenang ketat: Owner memiliki akses finansial penuh, Manajer mengelola shift dan menu, sedangkan Kasir hanya mengakses layar transaksi tanpa melihat profit toko.",
      },
    ],
  },
];

function FeatureCard({ feature, isActive, onSelect, reducedMotion }: {
  feature: SystemFeature;
  isActive: boolean;
  onSelect: () => void;
  reducedMotion: boolean | null;
}) {
  const { icon: Icon } = feature;
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const orientation = useRef(new Quaternion());
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const [backAxis, setBackAxis] = useState<"x" | "y">("y");

  useEffect(() => () => animation.current?.stop(), []);

  useEffect(() => {
    if (!reducedMotion) return;
    animation.current?.stop();
    orientation.current.identity();
    if (surfaceRef.current) surfaceRef.current.style.transform = "";
  }, [reducedMotion]);

  function turn(side: CardSide, entering: boolean) {
    animation.current?.stop();
    const start = orientation.current.clone();
    if (entering) setBackAxis(side === "left" || side === "right" ? "y" : "x");
    const target = sideRotation(side);

    animation.current = animate(0, 1, {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (progress) => {
        orientation.current = entering
          ? start.clone().slerp(target, progress)
          : exitRotation(start, side, progress);
        if (surfaceRef.current) {
          const matrix = new Matrix4().makeRotationFromQuaternion(orientation.current);
          surfaceRef.current.style.transform = `matrix3d(${matrix.elements.join(",")})`;
        }
      },
    });
  }

  function handlePointer(event: React.PointerEvent<HTMLButtonElement>, entering: boolean) {
    if (reducedMotion || event.pointerType === "touch" || !window.matchMedia("(hover: hover)").matches) return;
    turn(cardSide(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY), entering);
  }

  const faceClass = "absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-2.5 text-center sm:p-3";
  const faceContent = (blue: boolean) => (
    <>
      <span className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full ${blue ? "bg-white text-[#0e59f9]" : "bg-[#0e59f9] text-white motion-reduce:group-hover:bg-white motion-reduce:group-hover:text-[#0e59f9]"}`}>
        <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.75} />
      </span>
      <span className={`mt-2.5 sm:mt-3 text-[12px] sm:text-[13px] leading-tight tracking-tight px-1 ${blue ? "font-semibold text-white" : "font-medium text-zinc-900 motion-reduce:group-hover:text-white"}`}>
        {feature.label}
      </span>
    </>
  );

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${feature.id}`}
      aria-label={feature.label}
      aria-selected={isActive}
      aria-controls="feature-panel"
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      onPointerEnter={(event) => handlePointer(event, true)}
      onPointerLeave={(event) => handlePointer(event, false)}
      className="group relative aspect-square cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#0e59f9] focus-visible:ring-offset-2"
      style={{ perspective: "800px" }}
    >
      <span ref={surfaceRef} aria-hidden="true" className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <span className={`${faceClass} ${isActive ? "bg-[#0e59f9]" : "bg-white border border-zinc-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] motion-reduce:group-hover:border-transparent motion-reduce:group-hover:bg-[#0e59f9]"}`} style={{ backfaceVisibility: "hidden" }}>{faceContent(isActive)}</span>
        <span className={`${faceClass} bg-[#0e59f9]`} style={{ backfaceVisibility: "hidden", transform: backAxis === "y" ? "rotateY(180deg)" : "rotateX(180deg)" }}>{faceContent(true)}</span>
      </span>
    </button>
  );
}

export function FeatureTeaserHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto max-w-6xl text-center ${className}`}>
      <h2
        id="features-heading"
        className="font-serif text-[clamp(1.85rem,3.5vw,3.35rem)] font-normal leading-[1.14] tracking-[-0.03em] text-zinc-900"
      >
        <span className="block sm:whitespace-nowrap">
          Built to <span className="italic font-normal">power</span> the teams
        </span>
        <span className="block sm:whitespace-nowrap">
          behind great hospitality
        </span>
      </h2>
      
    </div>
  );
}

export function FeatureTeaserBody() {
  const [activeTab, setActiveTab] = useState<string>("qr-order");
  const prefersReducedMotion = useReducedMotion();

  const activeFeature =
    MENUIN_FEATURES.find((f) => f.id === activeTab) ?? MENUIN_FEATURES[0];

  return (
    <>
      {/* TAB SELECTOR BAR */}
      <div
        role="tablist"
        aria-label="Fitur unggulan Menuin POS"
        onKeyDown={(event) => {
          const index = MENUIN_FEATURES.findIndex((feature) => feature.id === activeTab);
          let next = index;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % MENUIN_FEATURES.length;
          else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + MENUIN_FEATURES.length) % MENUIN_FEATURES.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = MENUIN_FEATURES.length - 1;
          else return;
          event.preventDefault();
          setActiveTab(MENUIN_FEATURES[next].id);
          event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}
        className="mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 lg:gap-3.5"
      >
        {MENUIN_FEATURES.map((feature) => {
          const isActive = feature.id === activeTab;

          return (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isActive={isActive}
              onSelect={() => setActiveTab(feature.id)}
              reducedMotion={prefersReducedMotion}
            />
          );
        })}
      </div>

      {/* DIVIDER LINE */}
      <div className="my-6 sm:my-3 h-px w-full" />

      {/* TWO-COLUMN DETAIL CONTENT */}
      <div
        role="tabpanel"
        id="feature-panel"
        aria-labelledby={`tab-${activeFeature.id}`}
        className="min-h-[190px]"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10"
          >
            {/* LEFT COLUMN: Feature headline and temporary image */}
            <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-4">
              <h3 className="text-xl sm:text-[24px] md:text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-zinc-950 text-balance">
                {activeFeature.headline}
              </h3>

              <div className="relative mt-4 aspect-[2/1] w-full overflow-hidden rounded-2xl bg-[#0e59f9] lg:flex-1">
                <Image
                  src="/uploads/logos/menuin-bg-biru.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 440px, (min-width: 640px) 640px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: 2 Stacked Feature Items */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
              {activeFeature.items.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <h4 className="text-base sm:text-[16px] font-semibold tracking-tight text-zinc-950">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm sm:text-[14.5px] leading-relaxed text-zinc-600">
                    {item.description}
                  </p>
                </div>
              ))}
              <Link
                href={activeFeature.ctaHref}
                className="inline-flex self-start items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 text-xs sm:text-sm font-medium text-zinc-800 shadow-2xs hover:bg-zinc-50 hover:border-zinc-400 transition-colors group lg:mt-auto"
              >
                <span>Lihat fitur</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

export default function FeatureTeaser() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative w-full bg-white px-4 py-20 sm:px-6 sm:py-28 md:py-32"
    >
      <div className="mx-auto max-w-[1200px]">
        <FeatureTeaserHeader />
        <FeatureTeaserBody />
      </div>
    </section>
  );
}

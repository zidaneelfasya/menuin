/**
 * KATALOG DATA HARGA & PAKET LANGGANAN MENUIN.
 *
 * Tier: Basic (Rp 49.900), Pro (Rp 99.900), Promax (Rp 149.900), Custom (Hubungi kami).
 * Sumber tunggal untuk kartu harga landing dan tabel komparasi di /harga.
 */

export type FeatureItem = {
  text: string;
  isNew?: boolean;
  badge?: string;
  isInherited?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  /** Harga per bulan per outlet dalam rupiah; null = harga lewat diskusi. */
  monthlyPrice: number | null;
  /** Harga normal per bulan yang ditampilkan dicoret. */
  originalMonthlyPrice?: number;
  cta: { label: string; href: string };
  highlight?: boolean;
  highlightBadge?: string;
  includedLabel: string;
  features: FeatureItem[];
  bullets: string[];
  /** Bullet yang ditebalkan sebagai fitur unggulan paket. */
  featured?: string[];
};

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Kasir digital praktis untuk toko & outlet yang baru mulai.",
    monthlyPrice: 49900,
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=basic" },
    includedLabel: "PAKET BASIC MENCAKUP:",
    features: [
      { text: "Kasir POS penjualan kilat & cetak struk" },
      { text: "Printer Bluetooth thermal & LAN" },
      { text: "Kelola daftar menu dan kategori produk" },
      { text: "Pengelolaan stok sederhana & notifikasi minimum" },
      { text: "1 perangkat kasir aktif" },
      { text: "Laporan rangkuman penjualan harian" },
      { text: "Bantuan teknis lewat WhatsApp" },
    ],
    bullets: [
      "Kasir POS penjualan kilat & cetak struk",
      "Printer Bluetooth thermal & LAN",
      "Kelola daftar menu dan kategori produk",
      "Pengelolaan stok sederhana & notifikasi minimum",
      "1 perangkat kasir aktif",
      "Laporan rangkuman penjualan harian",
      "Bantuan teknis lewat WhatsApp",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Kasir cerdas bertenaga AI untuk toko kue, sembako & outlet ramai.",
    monthlyPrice: 99900,
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=pro" },
    includedLabel: "PAKET PRO MENCAKUP:",
    features: [
      { text: "Semua fitur kasir & stok di paket Basic", isInherited: true },
      { text: "Dukungan printer Bluetooth & LAN", isInherited: true },
      { text: "Scan AI Product (kamera kenali produk tanpa barcode)", isNew: true },
      { text: "Opsi modifier lengkap: varian rasa, topping & catatan", isNew: true },
      { text: "Shift kasir & deteksi otomatis selisih kas laci", isNew: true },
      { text: "Pengaturan diskon persentase & kupon kode promo", isNew: true },
      { text: "Tambah hingga 3 perangkat kasir aktif", isNew: true },
      { text: "Laporan performa penjualan per menu & jam ramai", isNew: true },
      { text: "Akses staf kasir terpisah dengan PIN keamanan", isNew: true },
    ],
    bullets: [
      "Semua fitur kasir & stok di paket Basic",
      "Dukungan printer Bluetooth & LAN",
      "Scan AI Product (kamera kenali produk tanpa barcode)",
      "Opsi modifier lengkap: varian rasa, topping & catatan",
      "Shift kasir & deteksi otomatis selisih kas laci",
      "Pengaturan diskon persentase & kupon kode promo",
      "Tambah hingga 3 perangkat kasir aktif",
      "Laporan performa penjualan per menu & jam ramai",
      "Akses staf kasir terpisah dengan PIN keamanan",
    ],
    featured: [
      "Scan AI Product (kamera kenali produk tanpa barcode)",
      "Opsi modifier lengkap: varian rasa, topping & catatan",
      "Shift kasir & deteksi otomatis selisih kas laci",
    ],
  },
  {
    id: "promax",
    name: "Promax",
    tagline: "Solusi terpadu restoran & retail: pesan mandiri meja hingga alur dapur.",
    monthlyPrice: 149900,
    cta: { label: "Mulai uji coba ", href: "/auth/signup?plan=promax" },
    includedLabel: "PAKET PROMAX MENCAKUP:",
    features: [
      { text: "Semua fitur kasir, stok & laporan di paket Pro", isInherited: true },
      { text: "Termasuk Scan AI Product & modifier lengkap", isInherited: true },
      { text: "Shift kasir & rekap selisih uang laci otomatis", isInherited: true },
      { text: "Self-Order: QR pesan mandiri langsung dari meja", isNew: true },
      { text: "Bayar digital langsung di meja (QRIS & E-Wallet DOKU)", isNew: true },
      { text: "Papan Pesanan Masuk (Kitchen Display System / KDS)", isNew: true },
      { text: "Tahapan status pesanan live dengan notifikasi lonceng", isNew: true },
      { text: "Checklist item menu dapur sinkron antar koki & kasir", isNew: true },
      { text: "Layar live tracking status pesanan di HP pelanggan", isNew: true },
      { text: "Laporan keuangan mendalam & kalkulasi HPP otomatis", isNew: true },
      { text: "Ekspor seluruh laporan pembukuan ke PDF & Excel", isNew: true },
      { text: "Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)", isNew: true },
      { text: "Perangkat kasir & dapur tanpa batas (Unlimited)", isNew: true },
    ],
    bullets: [
      "Semua fitur kasir, stok & laporan di paket Pro",
      "Termasuk Scan AI Product & modifier lengkap",
      "Shift kasir & rekap selisih uang laci otomatis",
      "Self-Order: QR pesan mandiri langsung dari meja",
      "Bayar digital langsung di meja (QRIS & E-Wallet DOKU)",
      "Papan Pesanan Masuk (Kitchen Display System / KDS)",
      "Tahapan status pesanan live dengan notifikasi lonceng",
      "Checklist item menu dapur sinkron antar koki & kasir",
      "Layar live tracking status pesanan di HP pelanggan",
      "Laporan keuangan mendalam & kalkulasi HPP otomatis",
      "Ekspor seluruh laporan pembukuan ke PDF & Excel",
      "Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)",
      "Perangkat kasir & dapur tanpa batas (Unlimited)",
    ],
    featured: [
      "Self-Order: QR pesan mandiri langsung dari meja",
      "Bayar digital langsung di meja (QRIS & E-Wallet DOKU)",
      "Papan Pesanan Masuk (Kitchen Display System / KDS)",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Untuk jaringan franchise, multi-outlet dan kebutuhan khusus.",
    monthlyPrice: null,
    cta: { label: "Diskusikan kebutuhan", href: "/kontak" },
    includedLabel: "PAKET CUSTOM MENCAKUP:",
    features: [
      { text: "Semua fitur di paket Promax", isInherited: true },
      { text: "Outlet & cabang tanpa batas", isNew: true },
      { text: "Integrasi API & sistem eksternal", isNew: true },
      { text: "Onboarding & migrasi data menu khusus", isNew: true },
      { text: "Dukungan teknis prioritas 24/7", isNew: true },
      { text: "Pendamping akun khusus (Dedicated Manager)", isNew: true },
    ],
    bullets: [
      "Semua di paket Promax",
      "Outlet & cabang tanpa batas",
      "Integrasi API & sistem eksternal",
      "Onboarding & migrasi data menu",
      "Dukungan prioritas",
      "Pendamping akun khusus",
    ],
  },
];

export type BillingCycle = "monthly" | "quarterly" | "annual";

/** Data harga kuartalan (3 bulan) dengan diskon psikologis ~10-11%. */
export const QUARTERLY_PRICES: Record<string, { price: number; original: number }> = {
  basic: { price: 134900, original: 149700 }, // setara Rp 44.966/bln, hemat Rp 14.800 (10%)
  pro: { price: 269900, original: 299700 }, // setara Rp 89.966/bln, hemat Rp 29.800 (10%)
  promax: { price: 399900, original: 449700 }, // setara Rp 133.300/bln, hemat Rp 49.800 (~11%)
};

/** Langganan tahunan: bayar sekian bulan, dapat 12 bulan (hemat 2 bulan). */
export const ANNUAL_PAID_MONTHS = 10;
export const ANNUAL_FREE_MONTHS = 12 - ANNUAL_PAID_MONTHS;

export const formatRupiah = (value: number) => `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** Harga yang ditampilkan di kartu untuk siklus tagihan tertentu beserta persen hematnya. */
export function planPrice(plan: Plan, cycle: BillingCycle): {
  price: string;
  original?: string;
  period?: string;
  savingsPercent?: string;
} {
  if (plan.monthlyPrice === null) {
    return { price: "Hubungi kami", original: undefined, period: undefined, savingsPercent: undefined };
  }
  if (cycle === "monthly") {
    return {
      price: formatRupiah(plan.monthlyPrice),
      original: undefined,
      period: "/bulan per outlet",
      savingsPercent: undefined,
    };
  }
  if (cycle === "quarterly") {
    const q = QUARTERLY_PRICES[plan.id];
    const normalPrice = plan.monthlyPrice * 3;
    const finalPrice = q ? q.price : normalPrice;
    const pct = Math.round(((normalPrice - finalPrice) / normalPrice) * 100);
    return {
      price: formatRupiah(finalPrice),
      original: formatRupiah(normalPrice),
      period: "/3 bulan per outlet",
      savingsPercent: pct > 0 ? `Hemat ${pct}%` : undefined,
    };
  }
  // Tahunan: bayar 10 bulan, harga asli adalah 12 bulan harga 1 bulan
  const normalYearPrice = plan.monthlyPrice * 12;
  const finalYearPrice = plan.monthlyPrice * ANNUAL_PAID_MONTHS;
  const pct = Math.round(((normalYearPrice - finalYearPrice) / normalYearPrice) * 100);
  return {
    price: formatRupiah(finalYearPrice),
    original: formatRupiah(normalYearPrice),
    period: "/tahun per outlet",
    savingsPercent: `Hemat ${pct}%`,
  };
}

/** true = termasuk, false = tidak, string = keterangan khusus. */
export type Cell = boolean | string;

export type FeatureGroup = {
  group: string;
  rows: { label: string; hint?: string; values: [Cell, Cell, Cell, Cell] }[];
};

// Urutan kolom tabel komparasi: Basic, Pro, Promax, Custom.
export const comparison: FeatureGroup[] = [
  {
    group: "Kasir & Transaksi",
    rows: [
      { label: "Kasir POS kilat & cetak struk", values: [true, true, true, true] },
      { label: "Printer Bluetooth & LAN", values: [true, true, true, true] },
      { label: "Scan AI Product", hint: "Kamera pintar kenali produk tanpa barcode", values: [false, true, true, true] },
      { label: "Opsi modifier lengkap", hint: "Varian rasa, topping, dan catatan", values: [false, true, true, true] },
      { label: "Perangkat kasir aktif", values: ["1", "Hingga 3", "Tanpa batas", "Tanpa batas"] },
      { label: "Shift kasir & selisih uang laci", hint: "Modal awal, kas keluar, rekap selisih", values: [false, true, true, true] },
      { label: "Diskon & kode promo", values: [false, true, true, true] },
    ],
  },
  {
    group: "Pesan Mandiri & Dapur",
    rows: [
      { label: "QR pesan mandiri dari meja", hint: "Katalog online langsung di browser tanpa unduh aplikasi", values: [false, false, true, true] },
      { label: "Bayar digital dari meja", hint: "QRIS, e-wallet, virtual account langsung terverifikasi", values: [false, false, true, true] },
      { label: "Papan pesanan dapur (KDS)", hint: "Kanban board realtime dengan audio lonceng", values: [false, false, true, true] },
      { label: "Tahapan status pesanan live", hint: "Baru ➔ Dimasak ➔ Siap Saji ➔ Selesai", values: [false, false, true, true] },
      { label: "Checklist menu untuk staf dapur", values: [false, false, true, true] },
      { label: "Tracking pesanan live di HP pelanggan", values: [false, false, true, true] },
    ],
  },
  {
    group: "Stok & Inventori",
    rows: [
      { label: "Pengelolaan stok sederhana", hint: "Lacak stok & alert batas minimum", values: [true, true, true, true] },
      { label: "Riwayat kartu stok (Stock Movement)", values: [false, true, true, true] },
      { label: "Stok & HPP otomatis", hint: "Perhitungan laba kotor & margin otomatis", values: [false, false, true, true] },
      { label: "Impor & ekspor menu via Excel", values: [false, true, true, true] },
    ],
  },
  {
    group: "Laporan & Keuangan",
    rows: [
      { label: "Laporan penjualan harian", hint: "Omzet harian, ringkasan transaksi", values: [true, true, true, true] },
      { label: "Laporan penjualan per menu & jam", hint: "Analisis menu terlaris & jam sibuk", values: [false, true, true, true] },
      { label: "Laporan operasional shift", values: [false, true, true, true] },
      { label: "Laporan keuangan komprehensif", hint: "Laba kotor, HPP, pengeluaran & pajak", values: [false, false, true, true] },
      { label: "Ekspor laporan ke PDF & Excel", values: [false, false, true, true] },
    ],
  },
  {
    group: "Tim & Hak Akses",
    rows: [
      { label: "Jumlah outlet", values: ["1", "1", "1 per langganan", "Tanpa batas"] },
      { label: "Akses cepat PIN staf kasir", values: [false, true, true, true] },
      { label: "Multi-peran (Owner, Manajer, Kasir, Dapur)", values: [false, false, true, true] },
    ],
  },
  {
    group: "Dukungan & Layanan",
    rows: [
      { label: "Bantuan lewat WhatsApp", values: [true, true, true, true] },
      { label: "Onboarding & migrasi data menu", values: [false, false, false, true] },
      { label: "Integrasi API khusus", values: [false, false, false, true] },
      { label: "Dukungan prioritas 24/7", values: [false, false, false, true] },
    ],
  },
];

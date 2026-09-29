/**
 * DATA HARGA SEMENTARA.
 *
 * Paket, harga, dan benefit belum final: modul Report & Analytics sedang
 * dirombak menjadi tiga jenis laporan (penjualan, operasional, keuangan).
 * Ganti isi file ini saja; kartu di landing dan tabel di /harga membaca
 * dari sini.
 */

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
  bullets: string[];
  /** Bullet yang ditebalkan sebagai fitur unggulan paket. */
  featured?: string[];
};

export const plans: Plan[] = [
  {
    id: "kasir",
    name: "Kasir",
    tagline: "Kasir digital untuk outlet yang baru mulai.",
    monthlyPrice: 50000,
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=kasir" },
    bullets: [
      "Kasir POS dan cetak struk",
      "Printer Bluetooth & LAN",
      "Kelola menu dan kategori",
      "Laporan penjualan harian",
      "1 perangkat kasir",
      "Bantuan lewat WhatsApp",
    ],
  },
  {
    id: "kasir-plus",
    name: "Kasir Plus",
    tagline: "Untuk menu dengan banyak pilihan dan kasir lebih dari satu.",
    monthlyPrice: 75000,
    originalMonthlyPrice: 150000,
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=kasir-plus" },
    bullets: [
      "Semua di paket Kasir",
      "Opsi modifier: varian, topping, catatan",
      "Tambah perangkat kasir",
      "Shift & kas dengan rekap selisih",
      "Diskon & promo",
      "Laporan penjualan per menu",
    ],
    featured: ["Opsi modifier: varian, topping, catatan", "Tambah perangkat kasir"],
  },
  {
    id: "lengkap",
    name: "Lengkap",
    tagline: "Semua fitur Menuin, termasuk pesan mandiri dari meja.",
    monthlyPrice: 150000,
    originalMonthlyPrice: 300000,
    cta: { label: "Mulai uji coba 14 hari", href: "/auth/signup?plan=lengkap" },
    highlight: true,
    bullets: [
      "Semua di paket Kasir Plus",
      "Self order: QR pesan dari meja",
      "Bayar QRIS & e-wallet langsung dari meja",
      "Papan pesanan & tiket dapur",
      "Stok & HPP",
      "Laporan penjualan, operasional, keuangan",
      "Ekspor laporan ke PDF",
      "Peran Owner, Manajer, dan Kasir",
    ],
    featured: [
      "Self order: QR pesan dari meja",
      "Bayar QRIS & e-wallet langsung dari meja",
      "Papan pesanan & tiket dapur",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Untuk jaringan outlet dan kebutuhan khusus.",
    monthlyPrice: null,
    cta: { label: "Diskusikan kebutuhan", href: "/kontak" },
    bullets: [
      "Semua di paket Lengkap",
      "Outlet & cabang tanpa batas",
      "Integrasi API & sistem eksternal",
      "Onboarding & migrasi data menu",
      "Dukungan prioritas",
      "Pendamping akun khusus",
    ],
  },
];

export type BillingCycle = "monthly" | "annual";

/** Langganan tahunan: bayar sekian bulan, dapat 12 bulan. */
export const ANNUAL_PAID_MONTHS = 10;
export const ANNUAL_FREE_MONTHS = 12 - ANNUAL_PAID_MONTHS;

export const formatRupiah = (value: number) => `Rp ${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** Harga yang ditampilkan di kartu untuk siklus tagihan tertentu. */
export function planPrice(plan: Plan, cycle: BillingCycle) {
  if (plan.monthlyPrice === null) return { price: "Hubungi kami", original: undefined, period: undefined };
  if (cycle === "monthly") {
    return {
      price: formatRupiah(plan.monthlyPrice),
      original: plan.originalMonthlyPrice ? formatRupiah(plan.originalMonthlyPrice) : undefined,
      period: "/bulan per outlet",
    };
  }
  // Tahunan: harga coret = 12 bulan harga normal bulanan.
  return {
    price: formatRupiah(plan.monthlyPrice * ANNUAL_PAID_MONTHS),
    original: formatRupiah(plan.monthlyPrice * 12),
    period: "/tahun per outlet",
  };
}

/** true = termasuk, false = tidak, string = keterangan khusus. */
export type Cell = boolean | string;

export type FeatureGroup = {
  group: string;
  rows: { label: string; hint?: string; values: [Cell, Cell, Cell, Cell] }[];
};

// Urutan kolom: Kasir, Kasir Plus, Lengkap, Custom.
export const comparison: FeatureGroup[] = [
  {
    group: "Kasir",
    rows: [
      { label: "Kasir POS & cetak struk", values: [true, true, true, true] },
      { label: "Printer Bluetooth & LAN", values: [true, true, true, true] },
      { label: "Opsi modifier", hint: "Varian, topping, dan catatan", values: [false, true, true, true] },
      { label: "Perangkat kasir", values: ["1", "Bisa ditambah", "Bisa ditambah", "Tanpa batas"] },
      { label: "Shift & kas", hint: "Modal awal, kas keluar, selisih", values: [false, true, true, true] },
      { label: "Diskon & promo", values: [false, true, true, true] },
    ],
  },
  {
    group: "Self order",
    rows: [
      { label: "QR pesan dari meja", hint: "Katalog online tanpa unduh aplikasi", values: [false, false, true, true] },
      { label: "Bayar online dari meja", hint: "QRIS, e-wallet, virtual account, kartu", values: [false, false, true, true] },
      { label: "Papan pesanan & tiket dapur", values: [false, false, true, true] },
    ],
  },
  {
    group: "Stok & laporan",
    rows: [
      { label: "Laporan penjualan", hint: "Omzet, menu terlaris, metode bayar", values: [true, true, true, true] },
      { label: "Stok & HPP", values: [false, false, true, true] },
      { label: "Laporan operasional", hint: "Shift, pesanan, performa outlet", values: [false, false, true, true] },
      { label: "Laporan keuangan", hint: "Laba kotor, HPP, pajak", values: [false, false, true, true] },
      { label: "Ekspor PDF", values: [false, false, true, true] },
    ],
  },
  {
    group: "Tim & outlet",
    rows: [
      { label: "Jumlah outlet", values: ["1", "1", "1 per langganan", "Tanpa batas"] },
      { label: "Peran Owner, Manajer, Kasir", values: [false, false, true, true] },
    ],
  },
  {
    group: "Dukungan",
    rows: [
      { label: "Bantuan lewat WhatsApp", values: [true, true, true, true] },
      { label: "Onboarding & migrasi data", values: [false, false, false, true] },
      { label: "Integrasi API", values: [false, false, false, true] },
      { label: "Dukungan prioritas", values: [false, false, false, true] },
    ],
  },
];

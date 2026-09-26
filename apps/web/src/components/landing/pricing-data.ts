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
  price: string;
  period?: string;
  cta: { label: string; href: string };
  highlight?: boolean;
  bullets: string[];
};

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Untuk outlet yang baru mulai go-digital.",
    price: "Rp 99.000",
    period: "/bulan per outlet",
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=basic" },
    bullets: [
      "Kasir POS dan cetak struk",
      "QR pesan dari meja",
      "Laporan penjualan",
      "1 kasir aktif",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Untuk outlet yang ramai setiap hari.",
    price: "Rp 199.000",
    period: "/bulan per outlet",
    cta: { label: "Mulai uji coba", href: "/auth/signup?plan=pro" },
    highlight: true,
    bullets: [
      "Semua di paket Basic",
      "Pembayaran QRIS & e-wallet dari meja",
      "Shift & kas, stok, diskon & promo",
      "Laporan penjualan, operasional, keuangan",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Untuk jaringan outlet dan kebutuhan khusus.",
    price: "Hubungi kami",
    cta: { label: "Diskusikan kebutuhan", href: "/kontak" },
    bullets: [
      "Semua di paket Pro",
      "Outlet tanpa batas",
      "Integrasi API & onboarding",
      "Dukungan prioritas",
    ],
  },
];

/** true = termasuk, false = tidak, string = keterangan khusus. */
export type Cell = boolean | string;

export type FeatureGroup = {
  group: string;
  rows: { label: string; hint?: string; values: [Cell, Cell, Cell] }[];
};

// Urutan kolom: Basic, Pro, Enterprise.
export const comparison: FeatureGroup[] = [
  {
    group: "Pemesanan",
    rows: [
      { label: "QR pesan dari meja", hint: "Katalog online tanpa unduh aplikasi", values: [true, true, true] },
      { label: "Varian, topping, dan catatan", values: [true, true, true] },
      { label: "Bayar online dari meja", hint: "QRIS, e-wallet, virtual account, kartu", values: [false, true, true] },
      { label: "Papan pesanan & tiket dapur", values: [true, true, true] },
    ],
  },
  {
    group: "Kasir & operasional",
    rows: [
      { label: "Kasir POS", values: [true, true, true] },
      { label: "Printer Bluetooth & LAN", values: [true, true, true] },
      { label: "Shift & kas", hint: "Modal awal, kas keluar, selisih", values: [false, true, true] },
      { label: "Stok & HPP", values: [false, true, true] },
      { label: "Diskon & promo", values: [false, true, true] },
    ],
  },
  {
    group: "Report & Analytics",
    rows: [
      { label: "Laporan penjualan", hint: "Omzet, menu terlaris, metode bayar", values: [true, true, true] },
      { label: "Laporan operasional", hint: "Shift, pesanan, performa outlet", values: [false, true, true] },
      { label: "Laporan keuangan", hint: "Laba kotor, HPP, pajak", values: [false, true, true] },
      { label: "Ekspor PDF", values: [false, true, true] },
    ],
  },
  {
    group: "Tim & outlet",
    rows: [
      { label: "Jumlah outlet", values: ["1", "1 per langganan", "Tanpa batas"] },
      { label: "Kasir aktif", values: ["1", "Tanpa batas", "Tanpa batas"] },
      { label: "Peran Owner, Manajer, Kasir", values: [false, true, true] },
    ],
  },
  {
    group: "Dukungan",
    rows: [
      { label: "Bantuan lewat WhatsApp", values: [true, true, true] },
      { label: "Onboarding & migrasi data", values: [false, false, true] },
      { label: "Integrasi API", values: [false, false, true] },
      { label: "Dukungan prioritas", values: [false, false, true] },
    ],
  },
];

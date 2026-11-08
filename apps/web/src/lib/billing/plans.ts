/**
 * Katalog paket langganan Menuin — SATU-SATUNYA sumber harga untuk penagihan.
 * Client hanya mengirim `planCode`; harga, paket entitlement, dan durasi selalu
 * diambil dari sini di server.
 */

export type BillingPlanCode =
  | 'basic_monthly'
  | 'basic_quarterly'
  | 'basic_annual'
  | 'pro_monthly'
  | 'pro_quarterly'
  | 'pro_annual'
  | 'promax_monthly'
  | 'promax_quarterly'
  | 'promax_annual'
  | 'kasir_monthly'
  | 'kasir_annual'
  | 'kasir_plus_monthly'
  | 'kasir_plus_annual'
  | 'lengkap_monthly'
  | 'lengkap_annual'
  | 'starter'
  | 'business';

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  cycle: BillingCycle;
  /** Tier entitlement di tabel subscriptions (lihat getEntitlements). */
  plan: 'BASIC' | 'PRO';
  /** Harga per periode dalam rupiah (bilangan bulat). */
  amount: number;
  originalAmount?: number;
  periodDays: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const BILLING_PLANS: Record<BillingPlanCode, BillingPlan> = {
  basic_monthly: {
    code: 'basic_monthly',
    name: 'Basic',
    cycle: 'monthly',
    plan: 'BASIC',
    amount: 49_900,
    periodDays: 30,
    description: 'Kasir digital praktis untuk toko & outlet yang baru mulai.',
    features: [
      'Kasir POS penjualan kilat & cetak struk',
      'Printer Bluetooth thermal & LAN',
      'Kelola daftar menu dan kategori produk',
      'Pengelolaan stok sederhana & notifikasi minimum',
      '1 perangkat kasir aktif',
      'Laporan rangkuman penjualan harian',
      'Bantuan teknis lewat WhatsApp',
    ],
  },
  basic_quarterly: {
    code: 'basic_quarterly',
    name: 'Basic',
    cycle: 'quarterly',
    plan: 'BASIC',
    amount: 134_900,
    originalAmount: 149_700,
    periodDays: 90,
    description: 'Kasir digital praktis untuk toko & outlet yang baru mulai (Hemat 10%).',
    features: [
      'Kasir POS penjualan kilat & cetak struk',
      'Printer Bluetooth thermal & LAN',
      'Kelola daftar menu dan kategori produk',
      'Pengelolaan stok sederhana & notifikasi minimum',
      '1 perangkat kasir aktif',
      'Laporan rangkuman penjualan harian',
      'Bantuan teknis lewat WhatsApp',
    ],
  },
  basic_annual: {
    code: 'basic_annual',
    name: 'Basic',
    cycle: 'annual',
    plan: 'BASIC',
    amount: 499_000,
    originalAmount: 598_800,
    periodDays: 365,
    description: 'Kasir digital praktis untuk toko & outlet yang baru mulai (Hemat 2 bulan).',
    features: [
      'Kasir POS penjualan kilat & cetak struk',
      'Printer Bluetooth thermal & LAN',
      'Kelola daftar menu dan kategori produk',
      'Pengelolaan stok sederhana & notifikasi minimum',
      '1 perangkat kasir aktif',
      'Laporan rangkuman penjualan harian',
      'Bantuan teknis lewat WhatsApp',
    ],
  },
  pro_monthly: {
    code: 'pro_monthly',
    name: 'Pro',
    cycle: 'monthly',
    plan: 'PRO',
    amount: 99_900,
    originalAmount: 150_000,
    periodDays: 30,
    description: 'Kasir cerdas bertenaga AI untuk toko kue, sembako & outlet ramai.',
    features: [
      'Semua fitur kasir & stok di paket Basic',
      'Dukungan printer Bluetooth & LAN',
      'Scan AI Product (kamera kenali produk tanpa barcode)',
      'Opsi modifier lengkap: varian rasa, topping & catatan',
      'Shift kasir & deteksi otomatis selisih kas laci',
      'Pengaturan diskon persentase & kupon kode promo',
      'Tambah hingga 3 perangkat kasir aktif',
      'Laporan performa penjualan per menu & jam ramai',
      'Akses staf kasir terpisah dengan PIN keamanan',
    ],
  },
  pro_quarterly: {
    code: 'pro_quarterly',
    name: 'Pro',
    cycle: 'quarterly',
    plan: 'PRO',
    amount: 269_900,
    originalAmount: 299_700,
    periodDays: 90,
    description: 'Kasir cerdas bertenaga AI untuk toko kue, sembako & outlet ramai (Hemat 10%).',
    features: [
      'Semua fitur kasir & stok di paket Basic',
      'Dukungan printer Bluetooth & LAN',
      'Scan AI Product (kamera kenali produk tanpa barcode)',
      'Opsi modifier lengkap: varian rasa, topping & catatan',
      'Shift kasir & deteksi otomatis selisih kas laci',
      'Pengaturan diskon persentase & kupon kode promo',
      'Tambah hingga 3 perangkat kasir aktif',
      'Laporan performa penjualan per menu & jam ramai',
      'Akses staf kasir terpisah dengan PIN keamanan',
    ],
  },
  pro_annual: {
    code: 'pro_annual',
    name: 'Pro',
    cycle: 'annual',
    plan: 'PRO',
    amount: 999_000,
    originalAmount: 1_800_000,
    periodDays: 365,
    description: 'Kasir cerdas bertenaga AI untuk toko kue, sembako & outlet ramai (Hemat 2 bulan).',
    features: [
      'Semua fitur kasir & stok di paket Basic',
      'Dukungan printer Bluetooth & LAN',
      'Scan AI Product (kamera kenali produk tanpa barcode)',
      'Opsi modifier lengkap: varian rasa, topping & catatan',
      'Shift kasir & deteksi otomatis selisih kas laci',
      'Pengaturan diskon persentase & kupon kode promo',
      'Tambah hingga 3 perangkat kasir aktif',
      'Laporan performa penjualan per menu & jam ramai',
      'Akses staf kasir terpisah dengan PIN keamanan',
    ],
  },
  promax_monthly: {
    code: 'promax_monthly',
    name: 'Promax',
    cycle: 'monthly',
    plan: 'PRO',
    amount: 149_900,
    originalAmount: 300_000,
    periodDays: 30,
    description: 'Solusi terpadu restoran & retail: pesan mandiri meja hingga alur dapur.',
    features: [
      'Semua fitur kasir, stok & laporan di paket Pro',
      'Termasuk Scan AI Product & modifier lengkap',
      'Shift kasir & rekap selisih uang laci otomatis',
      'Self-Order: QR pesan mandiri langsung dari meja',
      'Bayar digital langsung di meja (QRIS & E-Wallet DOKU)',
      'Papan Pesanan Masuk (Kitchen Display System / KDS)',
      'Tahapan status pesanan live dengan notifikasi lonceng',
      'Checklist item menu dapur sinkron antar koki & kasir',
      'Layar live tracking status pesanan di HP pelanggan',
      'Laporan keuangan mendalam & kalkulasi HPP otomatis',
      'Ekspor seluruh laporan pembukuan ke PDF & Excel',
      'Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)',
      'Perangkat kasir & dapur tanpa batas (Unlimited)',
    ],
    highlighted: true,
  },
  promax_quarterly: {
    code: 'promax_quarterly',
    name: 'Promax',
    cycle: 'quarterly',
    plan: 'PRO',
    amount: 399_900,
    originalAmount: 449_700,
    periodDays: 90,
    description: 'Solusi terpadu restoran & retail: pesan mandiri meja hingga alur dapur (Hemat 11%).',
    features: [
      'Semua fitur kasir, stok & laporan di paket Pro',
      'Termasuk Scan AI Product & modifier lengkap',
      'Shift kasir & rekap selisih uang laci otomatis',
      'Self-Order: QR pesan mandiri langsung dari meja',
      'Bayar digital langsung di meja (QRIS & E-Wallet DOKU)',
      'Papan Pesanan Masuk (Kitchen Display System / KDS)',
      'Tahapan status pesanan live dengan notifikasi lonceng',
      'Checklist item menu dapur sinkron antar koki & kasir',
      'Layar live tracking status pesanan di HP pelanggan',
      'Laporan keuangan mendalam & kalkulasi HPP otomatis',
      'Ekspor seluruh laporan pembukuan ke PDF & Excel',
      'Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)',
      'Perangkat kasir & dapur tanpa batas (Unlimited)',
    ],
    highlighted: true,
  },
  promax_annual: {
    code: 'promax_annual',
    name: 'Promax',
    cycle: 'annual',
    plan: 'PRO',
    amount: 1_499_000,
    originalAmount: 3_600_000,
    periodDays: 365,
    description: 'Solusi terpadu restoran & retail: pesan mandiri meja hingga alur dapur (Hemat 2 bulan).',
    features: [
      'Semua fitur kasir, stok & laporan di paket Pro',
      'Termasuk Scan AI Product & modifier lengkap',
      'Shift kasir & rekap selisih uang laci otomatis',
      'Self-Order: QR pesan mandiri langsung dari meja',
      'Bayar digital langsung di meja (QRIS & E-Wallet DOKU)',
      'Papan Pesanan Masuk (Kitchen Display System / KDS)',
      'Tahapan status pesanan live dengan notifikasi lonceng',
      'Checklist item menu dapur sinkron antar koki & kasir',
      'Layar live tracking status pesanan di HP pelanggan',
      'Laporan keuangan mendalam & kalkulasi HPP otomatis',
      'Ekspor seluruh laporan pembukuan ke PDF & Excel',
      'Hak akses multi-peran lengkap (Owner, Manajer, Kasir, Dapur)',
      'Perangkat kasir & dapur tanpa batas (Unlimited)',
    ],
    highlighted: true,
  },

  // Backward compatibility: legacy keys
  kasir_monthly: {
    code: 'kasir_monthly',
    name: 'Kasir',
    cycle: 'monthly',
    plan: 'BASIC',
    amount: 49_900,
    periodDays: 30,
    description: 'Kasir digital untuk outlet yang baru mulai.',
    features: [
      'Kasir POS dan cetak struk',
      'Printer Bluetooth & LAN',
      'Kelola menu dan kategori',
      'Laporan penjualan harian',
      '1 perangkat kasir',
      'Bantuan lewat WhatsApp',
    ],
  },
  kasir_annual: {
    code: 'kasir_annual',
    name: 'Kasir',
    cycle: 'annual',
    plan: 'BASIC',
    amount: 499_000,
    originalAmount: 598_800,
    periodDays: 365,
    description: 'Kasir digital untuk outlet yang baru mulai (Hemat 2 bulan).',
    features: [
      'Kasir POS dan cetak struk',
      'Printer Bluetooth & LAN',
      'Kelola menu dan kategori',
      'Laporan penjualan harian',
      '1 perangkat kasir',
      'Bantuan lewat WhatsApp',
    ],
  },
  kasir_plus_monthly: {
    code: 'kasir_plus_monthly',
    name: 'Kasir Plus',
    cycle: 'monthly',
    plan: 'PRO',
    amount: 74_900,
    originalAmount: 150_000,
    periodDays: 30,
    description: 'Untuk menu dengan banyak pilihan dan kasir lebih dari satu.',
    features: [
      'Semua di paket Kasir',
      'Opsi modifier: varian, topping, catatan',
      'Tambah perangkat kasir',
      'Shift & kas dengan rekap selisih',
      'Diskon & promo',
      'Laporan penjualan per menu',
    ],
  },
  kasir_plus_annual: {
    code: 'kasir_plus_annual',
    name: 'Kasir Plus',
    cycle: 'annual',
    plan: 'PRO',
    amount: 749_000,
    originalAmount: 1_800_000,
    periodDays: 365,
    description: 'Untuk menu dengan banyak pilihan dan kasir lebih dari satu (Hemat 2 bulan).',
    features: [
      'Semua di paket Kasir',
      'Opsi modifier: varian, topping, catatan',
      'Tambah perangkat kasir',
      'Shift & kas dengan rekap selisih',
      'Diskon & promo',
      'Laporan penjualan per menu',
    ],
  },
  lengkap_monthly: {
    code: 'lengkap_monthly',
    name: 'Lengkap',
    cycle: 'monthly',
    plan: 'PRO',
    amount: 149_000,
    originalAmount: 300_000,
    periodDays: 30,
    description: 'Semua fitur Menuin, termasuk pesan mandiri dari meja.',
    features: [
      'Semua di paket Kasir Plus',
      'Self order: QR pesan dari meja',
      'Bayar QRIS & e-wallet langsung dari meja',
      'Papan pesanan & tiket dapur',
      'Stok & HPP',
      'Laporan penjualan, operasional, keuangan',
      'Ekspor laporan ke PDF',
      'Peran Owner, Manajer, dan Kasir',
    ],
    highlighted: true,
  },
  lengkap_annual: {
    code: 'lengkap_annual',
    name: 'Lengkap',
    cycle: 'annual',
    plan: 'PRO',
    amount: 1_490_000,
    originalAmount: 3_600_000,
    periodDays: 365,
    description: 'Semua fitur Menuin, termasuk pesan mandiri dari meja (Hemat 2 bulan).',
    features: [
      'Semua di paket Kasir Plus',
      'Self order: QR pesan dari meja',
      'Bayar QRIS & e-wallet langsung dari meja',
      'Papan pesanan & tiket dapur',
      'Stok & HPP',
      'Laporan penjualan, operasional, keuangan',
      'Ekspor laporan ke PDF',
      'Peran Owner, Manajer, dan Kasir',
    ],
    highlighted: true,
  },
  starter: {
    code: 'starter',
    name: 'Starter (Legacy)',
    cycle: 'monthly',
    plan: 'BASIC',
    amount: 99_000,
    periodDays: 30,
    description: 'Untuk bisnis kecil yang baru mulai digital.',
    features: [
      'Digital Menu & QR Code',
      'Custom Catalog Link',
      'Online Ordering',
      'Basic Analytics Dashboard',
      '1 User Kasir',
    ],
  },
  business: {
    code: 'business',
    name: 'Business (Legacy)',
    cycle: 'monthly',
    plan: 'PRO',
    amount: 199_000,
    periodDays: 30,
    description: 'Untuk operasional F&B yang lebih lengkap.',
    features: [
      'Semua fitur Starter',
      'Sistem Kasir / POS Utama',
      'Payment Gateway Integration',
      'Real-time Order Management',
      'Advanced Analytics & Charts',
      'Multi-User Staf',
    ],
    highlighted: true,
  },
};

/** Daftar grup kartu untuk tampilan pricing */
export const DISPLAY_PLAN_GROUPS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Kasir digital praktis untuk toko & outlet yang baru mulai.',
    monthly: BILLING_PLANS.basic_monthly,
    quarterly: BILLING_PLANS.basic_quarterly,
    annual: BILLING_PLANS.basic_annual,
    features: BILLING_PLANS.basic_monthly.features,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Kasir cerdas bertenaga AI untuk toko kue, sembako & outlet ramai.',
    monthly: BILLING_PLANS.pro_monthly,
    quarterly: BILLING_PLANS.pro_quarterly,
    annual: BILLING_PLANS.pro_annual,
    features: BILLING_PLANS.pro_monthly.features,
    highlighted: false,
  },
  {
    id: 'promax',
    name: 'Promax',
    tagline: 'Solusi terpadu restoran & retail: pesan mandiri meja hingga alur dapur.',
    monthly: BILLING_PLANS.promax_monthly,
    quarterly: BILLING_PLANS.promax_quarterly,
    annual: BILLING_PLANS.promax_annual,
    features: BILLING_PLANS.promax_monthly.features,
    highlighted: true,
  },
];

export function getBillingPlan(code: string | null | undefined): BillingPlan | null {
  if (!code || typeof code !== 'string') return null;

  // Direct matches (safe from prototype pollution)
  if (Object.prototype.hasOwnProperty.call(BILLING_PLANS, code)) {
    return BILLING_PLANS[code as BillingPlanCode];
  }

  // Aliases from URLs / landing page
  switch (code) {
    case 'basic':
      return BILLING_PLANS.basic_monthly;
    case 'pro':
      return BILLING_PLANS.pro_monthly;
    case 'promax':
      return BILLING_PLANS.promax_monthly;
    case 'kasir':
      return BILLING_PLANS.basic_monthly;
    case 'kasir-plus':
    case 'kasir_plus':
      return BILLING_PLANS.pro_monthly;
    case 'lengkap':
      return BILLING_PLANS.promax_monthly;
    default:
      return null;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Periode langganan baru setelah pembayaran. Paket baru berlaku sekarang, dan
 * sisa waktu langganan aktif sebelumnya (jika ada) ditambahkan agar pelanggan
 * yang memperpanjang lebih awal tidak kehilangan hari.
 */
export function computeSubscriptionPeriod(params: {
  now: Date;
  periodDays: number;
  currentPeriodEnd: Date | null | undefined;
}): { start: Date; end: Date } {
  const { now, periodDays, currentPeriodEnd } = params;
  const carryOverMs = currentPeriodEnd ? Math.max(0, currentPeriodEnd.getTime() - now.getTime()) : 0;
  return { start: now, end: new Date(now.getTime() + periodDays * DAY_MS + carryOverMs) };
}

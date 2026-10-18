/**
 * Katalog paket langganan Menuin — SATU-SATUNYA sumber harga untuk penagihan.
 * Client hanya mengirim `planCode`; harga, paket entitlement, dan durasi selalu
 * diambil dari sini di server.
 */

export type BillingPlanCode =
  | 'kasir_monthly'
  | 'kasir_annual'
  | 'kasir_plus_monthly'
  | 'kasir_plus_annual'
  | 'lengkap_monthly'
  | 'lengkap_annual'
  | 'starter'
  | 'business';

export type BillingCycle = 'monthly' | 'annual';

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
  // Fallbacks for legacy plans
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

/** Daftar grup kartu untuk tampilan pricing (PaymentGate & Pricing Cards) */
export const DISPLAY_PLAN_GROUPS = [
  {
    id: 'kasir',
    name: 'Kasir',
    tagline: 'Kasir digital untuk outlet yang baru mulai.',
    monthly: BILLING_PLANS.kasir_monthly,
    annual: BILLING_PLANS.kasir_annual,
    features: BILLING_PLANS.kasir_monthly.features,
    highlighted: false,
  },
  {
    id: 'kasir_plus',
    name: 'Kasir Plus',
    tagline: 'Untuk menu dengan banyak pilihan dan kasir lebih dari satu.',
    monthly: BILLING_PLANS.kasir_plus_monthly,
    annual: BILLING_PLANS.kasir_plus_annual,
    features: BILLING_PLANS.kasir_plus_monthly.features,
    highlighted: false,
  },
  {
    id: 'lengkap',
    name: 'Lengkap',
    tagline: 'Semua fitur Menuin, termasuk pesan mandiri dari meja.',
    monthly: BILLING_PLANS.lengkap_monthly,
    annual: BILLING_PLANS.lengkap_annual,
    features: BILLING_PLANS.lengkap_monthly.features,
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
    case 'kasir':
      return BILLING_PLANS.kasir_monthly;
    case 'kasir-plus':
    case 'kasir_plus':
      return BILLING_PLANS.kasir_plus_monthly;
    case 'lengkap':
      return BILLING_PLANS.lengkap_monthly;
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

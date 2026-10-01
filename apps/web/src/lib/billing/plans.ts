/**
 * Katalog paket langganan Menuin — SATU-SATUNYA sumber harga untuk penagihan.
 * Client hanya mengirim `planCode`; harga, paket entitlement, dan durasi selalu
 * diambil dari sini di server.
 */

export type BillingPlanCode = 'starter' | 'business';

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  /** Tier entitlement di tabel subscriptions (lihat getEntitlements). */
  plan: 'BASIC' | 'PRO';
  /** Harga per periode dalam rupiah (bilangan bulat). */
  amount: number;
  periodDays: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const BILLING_PLANS: Record<BillingPlanCode, BillingPlan> = {
  starter: {
    code: 'starter',
    name: 'Starter',
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
    name: 'Business',
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

export function getBillingPlan(code: string | null | undefined): BillingPlan | null {
  if (code === 'starter' || code === 'business') return BILLING_PLANS[code];
  return null;
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

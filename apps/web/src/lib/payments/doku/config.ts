import { z } from 'zod';

/**
 * Konfigurasi DOKU level platform (Model A: Menuin sebagai Platform + Sub Account).
 * Kredensial hanya dibaca dari env server, tidak pernah dari DB/tenant/input user.
 */

const DOKU_BASE_URLS = {
  sandbox: 'https://api-sandbox.doku.com',
  production: 'https://api.doku.com',
} as const;

export type DokuEnvironment = keyof typeof DOKU_BASE_URLS;

const envSchema = z.object({
  DOKU_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  DOKU_CLIENT_ID: z.string().trim().min(1, 'DOKU_CLIENT_ID wajib diisi'),
  DOKU_SECRET_KEY: z.string().trim().min(1, 'DOKU_SECRET_KEY wajib diisi'),
  // Path notification URL yang didaftarkan di dashboard DOKU. Dipakai sebagai
  // Request-Target saat memverifikasi signature webhook.
  DOKU_NOTIFICATION_PATH: z.string().trim().startsWith('/').default('/api/webhook/doku'),
  // Wajibkan setiap tenant punya Sub Account sebelum bisa menerima pembayaran.
  // Default: wajib di production, opsional di sandbox (dana masuk ke akun platform).
  DOKU_REQUIRE_SUB_ACCOUNT: z.enum(['true', 'false']).optional(),
  // Batas waktu pembayaran Checkout (menit).
  DOKU_PAYMENT_DUE_MINUTES: z.coerce.number().int().min(5).max(1440).default(15),
  // Estimasi MDR (%) sampai data settlement asli tersedia.
  DOKU_ESTIMATED_MDR_PERCENT: z.coerce.number().min(0).max(10).default(0.7),
});

export type DokuConfig = {
  environment: DokuEnvironment;
  baseUrl: string;
  clientId: string;
  secretKey: string;
  notificationPath: string;
  requireSubAccount: boolean;
  paymentDueMinutes: number;
  estimatedMdrPercent: number;
};

export class DokuConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DokuConfigError';
  }
}

let cached: DokuConfig | null = null;

/** Membaca & memvalidasi konfigurasi. Melempar DokuConfigError jika tidak lengkap. */
export function getDokuConfig(): DokuConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new DokuConfigError(`Konfigurasi DOKU tidak valid: ${issues}`);
  }

  const env = parsed.data;
  cached = {
    environment: env.DOKU_ENV,
    baseUrl: DOKU_BASE_URLS[env.DOKU_ENV],
    clientId: env.DOKU_CLIENT_ID,
    secretKey: env.DOKU_SECRET_KEY,
    notificationPath: env.DOKU_NOTIFICATION_PATH,
    requireSubAccount:
      env.DOKU_REQUIRE_SUB_ACCOUNT !== undefined
        ? env.DOKU_REQUIRE_SUB_ACCOUNT === 'true'
        : env.DOKU_ENV === 'production',
    paymentDueMinutes: env.DOKU_PAYMENT_DUE_MINUTES,
    estimatedMdrPercent: env.DOKU_ESTIMATED_MDR_PERCENT,
  };
  return cached;
}

/** True jika kredensial DOKU platform sudah dikonfigurasi (tanpa melempar). */
export function isDokuConfigured(): boolean {
  try {
    getDokuConfig();
    return true;
  } catch {
    return false;
  }
}

import crypto from 'crypto';
import { z } from 'zod';
import { getDokuConfig, type DokuConfig } from '../config';

/**
 * Konfigurasi DOKU SNAP (dipakai untuk QRIS dinamis di POS). Opsional: tanpa
 * konfigurasi ini, opsi "QRIS Dinamis" di POS dinonaktifkan.
 *
 * - DOKU_PRIVATE_KEY : private key RSA milik Menuin (PEM). Public key-nya diunggah ke dashboard DOKU.
 * - DOKU_PUBLIC_KEY  : public key milik DOKU (PEM), dari dashboard DOKU. BUKAN public key Menuin.
 */

const envSchema = z.object({
  DOKU_PRIVATE_KEY: z.string().trim().min(1, 'DOKU_PRIVATE_KEY wajib diisi'),
  DOKU_PUBLIC_KEY: z.string().trim().min(1, 'DOKU_PUBLIC_KEY wajib diisi'),
  // CHANNEL-ID SNAP. Di Postman collection resmi DOKU nilainya kode seperti "H2H" (Direct API)
  // atau "VA008"; konfirmasikan nilai untuk QRIS ke DOKU bila berbeda.
  DOKU_SNAP_CHANNEL_ID: z.string().trim().regex(/^[A-Za-z0-9_-]{1,20}$/).default('H2H'),
  // Default merchant/terminal QRIS (sandbox). Di production tiap outlet memakai miliknya sendiri.
  DOKU_QRIS_MERCHANT_ID: z.string().trim().optional(),
  DOKU_QRIS_TERMINAL_ID: z.string().trim().optional(),
  DOKU_QRIS_POSTAL_CODE: z.string().trim().regex(/^\d{5}$/).optional(),
  DOKU_QRIS_VALIDITY_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
});

export type SnapConfig = DokuConfig & {
  privateKey: crypto.KeyObject;
  /** Public key Menuin (diturunkan dari private key) — untuk memverifikasi token inbound yang kita terbitkan. */
  merchantPublicKey: crypto.KeyObject;
  dokuPublicKey: crypto.KeyObject;
  channelId: string;
  defaultQrisMerchantId: string | null;
  defaultQrisTerminalId: string | null;
  qrisPostalCode: string | null;
  qrisValidityMinutes: number;
};

export class SnapConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapConfigError';
  }
}

/** PEM di env sering tersimpan dengan "\n" literal; normalisasi ke baris baru asli. */
export function normalizePem(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}

function publicKeyFingerprint(key: crypto.KeyObject): string {
  return crypto.createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex');
}

let cached: SnapConfig | null = null;

export function getSnapConfig(): SnapConfig {
  if (cached) return cached;
  const base = getDokuConfig();

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new SnapConfigError(`Konfigurasi DOKU SNAP tidak valid: ${issues}`);
  }
  const env = parsed.data;

  let privateKey: crypto.KeyObject;
  let dokuPublicKey: crypto.KeyObject;
  try {
    privateKey = crypto.createPrivateKey(normalizePem(env.DOKU_PRIVATE_KEY));
  } catch {
    throw new SnapConfigError('DOKU_PRIVATE_KEY bukan private key PEM yang valid');
  }
  try {
    dokuPublicKey = crypto.createPublicKey(normalizePem(env.DOKU_PUBLIC_KEY));
  } catch {
    throw new SnapConfigError('DOKU_PUBLIC_KEY bukan public key PEM yang valid');
  }

  const merchantPublicKey = crypto.createPublicKey(privateKey);
  if (publicKeyFingerprint(merchantPublicKey) === publicKeyFingerprint(dokuPublicKey)) {
    // Kesalahan umum: mengisi DOKU_PUBLIC_KEY dengan public key milik sendiri.
    throw new SnapConfigError(
      'DOKU_PUBLIC_KEY sama dengan public key Menuin. Isi dengan public key MILIK DOKU dari dashboard DOKU.'
    );
  }

  cached = {
    ...base,
    privateKey,
    merchantPublicKey,
    dokuPublicKey,
    channelId: env.DOKU_SNAP_CHANNEL_ID,
    defaultQrisMerchantId: env.DOKU_QRIS_MERCHANT_ID || null,
    defaultQrisTerminalId: env.DOKU_QRIS_TERMINAL_ID || null,
    qrisPostalCode: env.DOKU_QRIS_POSTAL_CODE || null,
    qrisValidityMinutes: env.DOKU_QRIS_VALIDITY_MINUTES,
  };
  return cached;
}

export function getSnapConfigOrNull(): SnapConfig | null {
  try {
    return getSnapConfig();
  } catch {
    return null;
  }
}

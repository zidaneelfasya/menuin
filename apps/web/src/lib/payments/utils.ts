import crypto from 'crypto';

/**
 * Invoice number unik per attempt (bukan per order), agar pembayaran ulang
 * setelah expired tidak bentrok dengan invoice lama di DOKU. Maks 64 karakter.
 * Contoh: MNU-MG7Q2K1A-9F3C2B1D
 */
export function generateInvoiceNumber(prefix = 'MNU', now: number = Date.now()): string {
  const time = now.toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${time}-${rand}`;
}

/** Nominal ke gateway selalu bilangan bulat rupiah. */
export function toRupiahInteger(value: string | number | null | undefined): number {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) throw new Error(`Nominal tidak valid: ${value}`);
  return Math.round(num);
}

/** Estimasi MDR sampai angka riil dari settlement report tersedia. */
export function estimateGatewayFee(amount: number, mdrPercent: number): { fee: number; net: number } {
  const fee = Math.round((amount * mdrPercent) / 100);
  return { fee, net: Math.max(0, amount - fee) };
}

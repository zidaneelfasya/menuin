import { z } from 'zod';
import type { ProviderOutcome } from '../../state-machine';
import { snapPost } from './client';

/**
 * DOKU SNAP QRIS MPM (Merchant Presented Mode) — QR dinamis dengan nominal terkunci.
 *   POST /snap-adapter/b2b/v1.0/qr/qr-mpm-generate
 *   POST /snap-adapter/b2b/v1.0/qr/qr-mpm-query
 */
export const QRIS_GENERATE_PATH = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';
export const QRIS_QUERY_PATH = '/snap-adapter/b2b/v1.0/qr/qr-mpm-query';

/** Nominal SNAP: string dengan 2 desimal, mis. "55500.00". */
export function formatSnapAmount(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error(`Nominal QRIS tidak valid: ${amount}`);
  return `${amount}.00`;
}

export function parseSnapAmount(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

const generateResponseSchema = z.object({
  qrContent: z.string().min(10),
  referenceNo: z.string().optional(),
  partnerReferenceNo: z.string().optional(),
}).passthrough();

export type GenerateQrisInput = {
  partnerReferenceNo: string;
  amount: number;
  merchantId: string;
  terminalId: string;
  validityPeriod: string;
  postalCode?: string | null;
};

export async function generateQris(input: GenerateQrisInput) {
  const additionalInfo: Record<string, string> = {};
  if (input.postalCode) additionalInfo.postalCode = input.postalCode;

  const data = await snapPost(QRIS_GENERATE_PATH, {
    partnerReferenceNo: input.partnerReferenceNo,
    amount: { value: formatSnapAmount(input.amount), currency: 'IDR' },
    merchantId: input.merchantId,
    terminalId: input.terminalId,
    validityPeriod: input.validityPeriod,
    ...(Object.keys(additionalInfo).length ? { additionalInfo } : {}),
  });

  const parsed = generateResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error('Respons QRIS generate DOKU tidak memuat qrContent');
  return {
    qrContent: parsed.data.qrContent,
    referenceNo: parsed.data.referenceNo ?? null,
    raw: data,
  };
}

const queryResponseSchema = z.object({
  latestTransactionStatus: z.string(),
  transactionStatusDesc: z.string().optional(),
  amount: z.object({ value: z.union([z.string(), z.number()]) }).passthrough().optional(),
}).passthrough();

/**
 * latestTransactionStatus SNAP: 00 sukses, 01 initiated, 02 paying, 03 pending,
 * 04 refunded, 05 canceled, 06 failed, 07 not found.
 */
export function mapQrisStatus(code: string | null | undefined): ProviderOutcome | null {
  switch (code) {
    case '00':
      return 'PAID';
    case '01':
    case '02':
    case '03':
      return 'PENDING';
    case '05':
    case '06':
      return 'FAILED';
    default:
      return null;
  }
}

export async function queryQris(input: { referenceNo: string | null; partnerReferenceNo: string; merchantId: string }) {
  const data = await snapPost(QRIS_QUERY_PATH, {
    ...(input.referenceNo ? { originalReferenceNo: input.referenceNo } : {}),
    originalPartnerReferenceNo: input.partnerReferenceNo,
    serviceCode: '47',
    merchantId: input.merchantId,
  });
  const parsed = queryResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error('Format respons QRIS query DOKU tidak dikenali');
  return {
    statusCode: parsed.data.latestTransactionStatus,
    statusDesc: parsed.data.transactionStatusDesc ?? null,
    amount: parseSnapAmount(parsed.data.amount?.value),
    raw: data,
  };
}

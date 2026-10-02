'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  applySettlementRows,
  countPaymentsNeedingReview,
  listOnlinePayments,
  recordRefund,
  resolveReviewWithoutRefund,
  type OnlinePaymentFilter,
} from '@/lib/payments/payment-ops.service';
import { parseSettlementCsv } from '@/lib/payments/settlement';
import { getCurrentUser } from './auth';

const MAX_SETTLEMENT_FILE_BYTES = 2 * 1024 * 1024;

async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) return null;
  if (!roles.includes(user.role as string) && (user.role as string) !== 'SYSTEM_ADMIN') return null;
  return { id: user.id, tenantId: user.tenantId, outletKey: user.outletKey };
}

function revalidate(outletKey: string | undefined | null) {
  if (!outletKey) return;
  revalidatePath(`/outlet/${outletKey}/settings/online-payments`, 'page');
  revalidatePath(`/outlet/${outletKey}`, 'layout');
}

export async function getOnlinePayments(filter: OnlinePaymentFilter) {
  try {
    const user = await requireRole(['OWNER', 'MANAGER']);
    if (!user) return { error: 'Hanya OWNER atau MANAGER yang dapat melihat pembayaran online.' };
    const [rows, reviewCount] = await Promise.all([
      listOnlinePayments({ tenantId: user.tenantId, filter: filter === 'ALL' ? 'ALL' : 'REVIEW' }),
      countPaymentsNeedingReview(user.tenantId),
    ]);
    return { success: true, rows, reviewCount };
  } catch (error) {
    console.error('Failed to list online payments:', error);
    return { error: 'Gagal memuat pembayaran online.' };
  }
}

const refundSchema = z.object({
  attemptId: z.string().uuid(),
  amount: z.number().int().positive(),
  reference: z.string().trim().min(1).max(100),
  note: z.string().trim().max(500).optional(),
});

export async function recordOnlinePaymentRefund(input: z.infer<typeof refundSchema>) {
  try {
    const user = await requireRole(['OWNER', 'MANAGER']);
    if (!user) return { error: 'Hanya OWNER atau MANAGER yang dapat mencatat refund.' };
    const parsed = refundSchema.safeParse(input);
    if (!parsed.success) return { error: 'Data refund tidak valid.' };

    const result = await recordRefund({ tenantId: user.tenantId, membershipId: user.id, ...parsed.data });
    if (!result.ok) return { error: result.error };
    revalidate(user.outletKey);
    return { success: true };
  } catch (error) {
    console.error('Failed to record refund:', error);
    return { error: 'Gagal mencatat refund.' };
  }
}

const resolveSchema = z.object({ attemptId: z.string().uuid(), note: z.string().trim().min(3).max(500) });

export async function resolveOnlinePaymentReview(input: z.infer<typeof resolveSchema>) {
  try {
    const user = await requireRole(['OWNER', 'MANAGER']);
    if (!user) return { error: 'Hanya OWNER atau MANAGER yang dapat menyelesaikan review.' };
    const parsed = resolveSchema.safeParse(input);
    if (!parsed.success) return { error: 'Catatan wajib diisi (3–500 karakter).' };

    const result = await resolveReviewWithoutRefund({ tenantId: user.tenantId, membershipId: user.id, ...parsed.data });
    if (!result.ok) return { error: result.error };
    revalidate(user.outletKey);
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve review:', error);
    return { error: 'Gagal menyelesaikan review.' };
  }
}

/** Import laporan settlement DOKU (CSV) untuk mengganti fee estimasi dengan fee riil. */
export async function importSettlementCsv(formData: FormData) {
  try {
    const user = await requireRole(['OWNER']);
    if (!user) return { error: 'Hanya OWNER yang dapat mengimpor laporan settlement.' };

    const file = formData.get('file');
    if (!(file instanceof File)) return { error: 'File tidak ditemukan.' };
    if (file.size === 0) return { error: 'File kosong.' };
    if (file.size > MAX_SETTLEMENT_FILE_BYTES) return { error: 'Ukuran file maksimal 2 MB.' };
    if (!/\.(csv|txt)$/i.test(file.name)) return { error: 'Gunakan file CSV (ekspor dari dashboard DOKU).' };

    const parsed = parseSettlementCsv(await file.text());
    if (parsed.rows.length === 0) {
      return { error: parsed.errors[0]?.reason ?? 'Tidak ada baris yang bisa diproses.', parseErrors: parsed.errors.slice(0, 50) };
    }

    const summary = await applySettlementRows(user.tenantId, parsed.rows);
    revalidate(user.outletKey);
    return { success: true, summary, parseErrors: parsed.errors.slice(0, 50), totalParseErrors: parsed.errors.length };
  } catch (error) {
    console.error('Failed to import settlement:', error);
    return { error: 'Gagal mengimpor laporan settlement.' };
  }
}

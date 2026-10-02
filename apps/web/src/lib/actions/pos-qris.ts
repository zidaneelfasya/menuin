'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { paymentAttempts, tenants, transactions } from '@/lib/db/schema';
import { insertPosTransaction, restockTransactionItems, type PosCheckoutPayload } from '@/lib/pos/create-pos-transaction';
import { isPosQrisAvailable, startPosQrisPayment, syncOrderPayment } from '@/lib/payments/payment.service';
import { getCurrentUser } from './auth';

/** Kasir menunggu di layar QR: cek ke DOKU paling cepat tiap 3 detik per transaksi. */
const POS_POLL_MIN_INTERVAL_MS = 3_000;

export type PosQrisSession = {
  transactionId: string;
  orderNumber: string | null;
  qrContent: string;
  amount: number;
  expiresAt: string | null;
};

async function requirePosUser(): Promise<{ id: string; tenantId: string; outletKey: string | null } | null> {
  const user = await getCurrentUser();
  if (!user || !user.tenantId) return null;
  return { id: user.id, tenantId: user.tenantId, outletKey: user.outletKey ?? null };
}

function revalidateOutlet(outletKey: string | null) {
  if (outletKey) revalidatePath(`/outlet/${outletKey}`, 'layout');
}

async function cancelPendingQrisTransaction(tenantId: string, transactionId: string, reason: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId)))
      .limit(1)
      .for('update');

    // Hanya transaksi POS QRIS yang masih menunggu pembayaran yang boleh dibatalkan di sini.
    if (!order || order.source !== 'POS' || order.paymentMethod !== 'QRIS_DYNAMIC' || order.paymentStatus !== 'PENDING') {
      return order?.paymentStatus === 'PAID' ? 'PAID' : 'NOT_CANCELLABLE';
    }

    await tx
      .update(paymentAttempts)
      .set({ status: 'CANCELED', updatedAt: new Date() })
      .where(and(eq(paymentAttempts.transactionId, order.id), inArray(paymentAttempts.status, ['CREATED', 'PENDING'])));

    await tx
      .update(transactions)
      .set({ status: 'CANCELLED', paymentStatus: 'CANCELED', voidReason: reason, voidedAt: new Date() })
      .where(eq(transactions.id, order.id));

    await restockTransactionItems(tx, tenantId, order.id);
    return 'CANCELLED';
  });
}

/**
 * Kasir memilih "QRIS Dinamis": simpan transaksi sebagai PENDING lalu buat QR DOKU.
 * Jika QR gagal dibuat, transaksi dibatalkan lagi (stok dikembalikan) agar kasir
 * bisa memilih metode lain tanpa meninggalkan transaksi menggantung.
 */
export async function startPosQrisCheckout(payload: PosCheckoutPayload) {
  try {
    const user = await requirePosUser();
    if (!user) return { error: 'Sesi kasir tidak ditemukan.' };

    const created = await insertPosTransaction({
      tenantId: user.tenantId,
      cashierMembershipId: user.id,
      payload: { ...payload, paymentMethod: 'QRIS_DYNAMIC' },
      mode: 'AWAITING_GATEWAY',
    });

    const result = await startPosQrisPayment({ tenantId: user.tenantId, transactionId: created.id });
    if (!result.ok || !result.qrContent) {
      await cancelPendingQrisTransaction(user.tenantId, created.id, 'QRIS gagal dibuat');
      return { error: result.ok ? 'QRIS tidak tersedia.' : result.message };
    }

    revalidateOutlet(user.outletKey);
    const session: PosQrisSession = {
      transactionId: created.id,
      orderNumber: created.orderNumber,
      qrContent: result.qrContent,
      amount: result.amount,
      expiresAt: result.expiresAt?.toISOString() ?? null,
    };
    return { success: true, session };
  } catch (error) {
    console.error('Failed to start POS QRIS checkout:', error);
    return { error: 'Gagal membuat QRIS. Gunakan metode pembayaran lain.' };
  }
}

/** Status pembayaran QRIS yang sedang ditampilkan di layar kasir. */
export async function getPosQrisStatus(transactionId: string) {
  try {
    const user = await requirePosUser();
    if (!user) return { error: 'Sesi kasir tidak ditemukan.' };

    const synced = await syncOrderPayment({
      tenantId: user.tenantId,
      transactionId,
      minIntervalMs: POS_POLL_MIN_INTERVAL_MS,
    });
    if (!synced) return { error: 'Transaksi tidak ditemukan.' };
    if (synced.paymentStatus === 'PAID') revalidateOutlet(user.outletKey);
    return { success: true, paymentStatus: synced.paymentStatus, status: synced.status };
  } catch (error) {
    console.error('Failed to get POS QRIS status:', error);
    return { error: 'Gagal memeriksa status pembayaran.' };
  }
}

/** QR kedaluwarsa: cek dulu apakah sudah terbayar, baru buat QR baru untuk transaksi yang sama. */
export async function regeneratePosQris(transactionId: string) {
  try {
    const user = await requirePosUser();
    if (!user) return { error: 'Sesi kasir tidak ditemukan.' };

    const synced = await syncOrderPayment({ tenantId: user.tenantId, transactionId, minIntervalMs: 0 });
    if (!synced) return { error: 'Transaksi tidak ditemukan.' };
    if (synced.paymentStatus === 'PAID') return { success: true, paid: true as const };

    const result = await startPosQrisPayment({ tenantId: user.tenantId, transactionId });
    if (!result.ok || !result.qrContent) return { error: result.ok ? 'QRIS tidak tersedia.' : result.message };

    return {
      success: true,
      paid: false as const,
      qrContent: result.qrContent,
      amount: result.amount,
      expiresAt: result.expiresAt?.toISOString() ?? null,
    };
  } catch (error) {
    console.error('Failed to regenerate POS QRIS:', error);
    return { error: 'Gagal membuat QR baru.' };
  }
}

/**
 * Kasir membatalkan QRIS. Status dicek ke DOKU dulu: jika ternyata sudah dibayar,
 * pembatalan ditolak dan transaksi diperlakukan lunas. Pembayaran yang masuk
 * SETELAH dibatalkan tetap tercatat dan ditandai untuk direview (refund).
 */
export async function cancelPosQris(transactionId: string) {
  try {
    const user = await requirePosUser();
    if (!user) return { error: 'Sesi kasir tidak ditemukan.' };

    const synced = await syncOrderPayment({ tenantId: user.tenantId, transactionId, minIntervalMs: 0 });
    if (synced?.paymentStatus === 'PAID') return { success: true, paid: true as const };

    const result = await cancelPendingQrisTransaction(user.tenantId, transactionId, 'QRIS dibatalkan kasir');
    if (result === 'PAID') return { success: true, paid: true as const };
    if (result !== 'CANCELLED') return { error: 'Transaksi ini tidak bisa dibatalkan.' };

    revalidateOutlet(user.outletKey);
    return { success: true, paid: false as const };
  } catch (error) {
    console.error('Failed to cancel POS QRIS:', error);
    return { error: 'Gagal membatalkan QRIS.' };
  }
}

/** Apakah opsi "QRIS Dinamis" boleh ditampilkan di POS outlet ini. */
export async function getPosQrisAvailability(): Promise<boolean> {
  try {
    const user = await requirePosUser();
    if (!user) return false;
    const [tenant] = await db
      .select({ dokuQrisMerchantId: tenants.dokuQrisMerchantId, dokuQrisTerminalId: tenants.dokuQrisTerminalId })
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);
    return tenant ? isPosQrisAvailable(tenant) : false;
  } catch {
    return false;
  }
}

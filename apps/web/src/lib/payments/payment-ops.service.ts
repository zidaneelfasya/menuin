import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentAttempts, payments, transactions } from '@/lib/db/schema';
import type { SettlementRow } from './settlement';

/**
 * Operasional pembayaran online per outlet: antrean review, pencatatan refund,
 * dan import settlement. Refund dieksekusi di dashboard DOKU, lalu dicatat di sini.
 * Hanya pembayaran pesanan (purpose ORDER); langganan dikelola tim Menuin.
 */

export type OnlinePaymentFilter = 'REVIEW' | 'ALL';

export async function listOnlinePayments(params: { tenantId: string; filter: OnlinePaymentFilter; limit?: number }) {
  const conditions = [eq(paymentAttempts.tenantId, params.tenantId), eq(paymentAttempts.purpose, 'ORDER')];
  if (params.filter === 'REVIEW') {
    conditions.push(eq(paymentAttempts.requiresReview, true), isNull(paymentAttempts.reviewedAt));
  } else {
    conditions.push(inArray(paymentAttempts.status, ['PAID', 'PENDING']));
  }

  return db
    .select({
      id: paymentAttempts.id,
      invoiceNumber: paymentAttempts.invoiceNumber,
      product: paymentAttempts.product,
      status: paymentAttempts.status,
      amount: paymentAttempts.amount,
      paymentChannel: paymentAttempts.paymentChannel,
      paidAt: paymentAttempts.paidAt,
      createdAt: paymentAttempts.createdAt,
      feeAmount: paymentAttempts.feeAmount,
      netAmount: paymentAttempts.netAmount,
      feeSource: paymentAttempts.feeSource,
      settledAt: paymentAttempts.settledAt,
      requiresReview: paymentAttempts.requiresReview,
      reviewReason: paymentAttempts.reviewReason,
      reviewResolution: paymentAttempts.reviewResolution,
      reviewedAt: paymentAttempts.reviewedAt,
      refundedAmount: paymentAttempts.refundedAmount,
      refundReference: paymentAttempts.refundReference,
      orderId: transactions.id,
      orderNumber: transactions.orderNumber,
      orderStatus: transactions.status,
      orderPaymentStatus: transactions.paymentStatus,
      orderPaymentMethod: transactions.paymentMethod,
      customerName: transactions.customerName,
    })
    .from(paymentAttempts)
    .innerJoin(
      transactions,
      and(eq(transactions.id, paymentAttempts.transactionId), eq(transactions.tenantId, paymentAttempts.tenantId))
    )
    .where(and(...conditions))
    .orderBy(desc(paymentAttempts.createdAt))
    .limit(Math.min(params.limit ?? 100, 500));
}

export async function countPaymentsNeedingReview(tenantId: string): Promise<number> {
  const rows = await db
    .select({ id: paymentAttempts.id })
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.tenantId, tenantId),
        eq(paymentAttempts.purpose, 'ORDER'),
        eq(paymentAttempts.requiresReview, true),
        isNull(paymentAttempts.reviewedAt)
      )
    );
  return rows.length;
}

const GATEWAY_METHODS = ['ONLINE', 'QRIS_DYNAMIC'];

/** Apakah attempt ini yang melunasi order (bukan pembayaran ganda di atas pembayaran lain). */
function attemptSettlesOrder(attempt: typeof paymentAttempts.$inferSelect, order: typeof transactions.$inferSelect) {
  return attempt.reviewReason !== 'ALREADY_PAID_OTHER_METHOD' && GATEWAY_METHODS.includes(order.paymentMethod);
}

export type OpsResult = { ok: true } | { ok: false; error: string };

async function lockAttemptWithOrder(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  attemptId: string
) {
  // Urutan lock sama dengan payment service: transactions → payment_attempts.
  const [peek] = await tx
    .select({ transactionId: paymentAttempts.transactionId, purpose: paymentAttempts.purpose })
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.id, attemptId), eq(paymentAttempts.tenantId, tenantId)))
    .limit(1);
  if (!peek || peek.purpose !== 'ORDER' || !peek.transactionId) return null;

  const [order] = await tx
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, peek.transactionId), eq(transactions.tenantId, tenantId)))
    .limit(1)
    .for('update');
  const [attempt] = await tx
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.id, attemptId))
    .limit(1)
    .for('update');
  if (!order || !attempt) return null;
  return { order, attempt };
}

/** Catat refund yang sudah dilakukan di dashboard DOKU. Satu refund per pembayaran. */
export async function recordRefund(params: {
  tenantId: string;
  attemptId: string;
  amount: number;
  reference: string;
  note?: string;
  membershipId: string | null;
}): Promise<OpsResult> {
  const reference = params.reference.trim();
  if (!reference || reference.length > 100) return { ok: false, error: 'Nomor referensi refund wajib diisi (maks. 100 karakter).' };
  if (!Number.isSafeInteger(params.amount) || params.amount <= 0) return { ok: false, error: 'Nominal refund tidak valid.' };

  return db.transaction(async (tx) => {
    const locked = await lockAttemptWithOrder(tx, params.tenantId, params.attemptId);
    if (!locked) return { ok: false as const, error: 'Pembayaran tidak ditemukan.' };
    const { order, attempt } = locked;

    if (attempt.status !== 'PAID') return { ok: false as const, error: 'Hanya pembayaran yang sudah lunas yang bisa direfund.' };
    if (attempt.refundedAmount) return { ok: false as const, error: 'Refund untuk pembayaran ini sudah pernah dicatat.' };
    if (params.amount > attempt.amount) return { ok: false as const, error: 'Nominal refund melebihi nominal pembayaran.' };

    const now = new Date();
    await tx
      .update(paymentAttempts)
      .set({
        refundedAmount: params.amount,
        refundReference: reference,
        refundedAt: now,
        reviewNote: params.note?.trim() || attempt.reviewNote,
        ...(attempt.requiresReview && !attempt.reviewedAt
          ? { reviewResolution: 'REFUNDED', reviewedAt: now, reviewedByMembershipId: params.membershipId }
          : {}),
        updatedAt: now,
      })
      .where(eq(paymentAttempts.id, attempt.id));

    // Refund penuh atas pembayaran yang melunasi order → order berstatus REFUNDED.
    // Refund pembayaran ganda tidak mengubah order (order tetap lunas lewat metode lain).
    const fullRefund = params.amount === attempt.amount;
    if (fullRefund && attemptSettlesOrder(attempt, order) && order.paymentStatus === 'PAID') {
      await tx.update(transactions).set({ paymentStatus: 'REFUNDED' }).where(eq(transactions.id, order.id));
    }

    await tx.insert(payments).values({
      tenantId: params.tenantId,
      transactionId: order.id,
      providerTransactionId: `${attempt.invoiceNumber}:REFUND`,
      provider: attempt.provider,
      amount: params.amount.toString(),
      status: 'REFUNDED',
    });

    return { ok: true as const };
  });
}

/** Tandai item review selesai tanpa refund (mis. pembayaran telat tapi pesanan tetap dilayani). */
export async function resolveReviewWithoutRefund(params: {
  tenantId: string;
  attemptId: string;
  note: string;
  membershipId: string | null;
}): Promise<OpsResult> {
  const note = params.note.trim();
  if (note.length < 3 || note.length > 500) return { ok: false, error: 'Catatan wajib diisi (3–500 karakter).' };

  const updated = await db
    .update(paymentAttempts)
    .set({
      reviewResolution: 'NO_ACTION',
      reviewNote: note,
      reviewedAt: new Date(),
      reviewedByMembershipId: params.membershipId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paymentAttempts.id, params.attemptId),
        eq(paymentAttempts.tenantId, params.tenantId),
        eq(paymentAttempts.purpose, 'ORDER'),
        eq(paymentAttempts.requiresReview, true),
        isNull(paymentAttempts.reviewedAt)
      )
    )
    .returning({ id: paymentAttempts.id });

  return updated.length ? { ok: true } : { ok: false, error: 'Item review tidak ditemukan atau sudah diselesaikan.' };
}

export type SettlementImportSummary = {
  updated: number;
  unchanged: number;
  notFound: string[];
  notPaid: string[];
  mismatched: { invoiceNumber: string; reason: string }[];
};

/**
 * Terapkan baris settlement ke pembayaran outlet ini: fee estimasi diganti fee riil
 * (fee_source = SETTLEMENT) dan biaya gateway di transaksi ikut diperbarui.
 * Idempoten: import file yang sama dua kali tidak mengubah apa pun.
 */
export async function applySettlementRows(tenantId: string, rows: SettlementRow[]): Promise<SettlementImportSummary> {
  const summary: SettlementImportSummary = { updated: 0, unchanged: 0, notFound: [], notPaid: [], mismatched: [] };
  if (rows.length === 0) return summary;

  const byInvoice = new Map<string, typeof paymentAttempts.$inferSelect>();
  const invoices = rows.map((r) => r.invoiceNumber);
  for (let i = 0; i < invoices.length; i += 500) {
    const chunk = invoices.slice(i, i + 500);
    const found = await db
      .select()
      .from(paymentAttempts)
      .where(
        and(
          eq(paymentAttempts.tenantId, tenantId),
          eq(paymentAttempts.purpose, 'ORDER'),
          inArray(paymentAttempts.invoiceNumber, chunk)
        )
      );
    for (const a of found) byInvoice.set(a.invoiceNumber, a);
  }

  for (const row of rows) {
    const attempt = byInvoice.get(row.invoiceNumber);
    if (!attempt) {
      summary.notFound.push(row.invoiceNumber);
      continue;
    }
    if (attempt.status !== 'PAID') {
      summary.notPaid.push(row.invoiceNumber);
      continue;
    }
    if (row.amount !== null && row.amount !== attempt.amount) {
      summary.mismatched.push({ invoiceNumber: row.invoiceNumber, reason: `Amount laporan ${row.amount} ≠ pembayaran ${attempt.amount}` });
      continue;
    }
    if (row.fee + row.net !== attempt.amount) {
      summary.mismatched.push({ invoiceNumber: row.invoiceNumber, reason: `Fee + net ≠ pembayaran ${attempt.amount}` });
      continue;
    }
    if (attempt.feeSource === 'SETTLEMENT' && attempt.feeAmount === row.fee && attempt.netAmount === row.net) {
      summary.unchanged += 1;
      continue;
    }

    await db.transaction(async (tx) => {
      const locked = await lockAttemptWithOrder(tx, tenantId, attempt.id);
      if (!locked) return;
      const now = new Date();
      await tx
        .update(paymentAttempts)
        .set({ feeAmount: row.fee, netAmount: row.net, feeSource: 'SETTLEMENT', settledAt: row.settledAt ?? now, updatedAt: now })
        .where(eq(paymentAttempts.id, attempt.id));

      if (attemptSettlesOrder(locked.attempt, locked.order) && ['PAID', 'REFUNDED'].includes(locked.order.paymentStatus)) {
        await tx
          .update(transactions)
          .set({ gatewayFee: row.fee.toString(), netAmount: row.net.toString() })
          .where(eq(transactions.id, locked.order.id));
      }
    });
    summary.updated += 1;
  }

  return summary;
}

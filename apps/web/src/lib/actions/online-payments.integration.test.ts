/**
 * Integration test operasional pembayaran (review, refund, settlement) — DB sungguhan.
 * Hanya jalan jika TEST_DATABASE_URL diset ke database UJI.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;
Object.assign(process.env, { DOKU_ENV: 'sandbox', DOKU_CLIENT_ID: 'BRN-TEST-1', DOKU_SECRET_KEY: 'SK-integration' });

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
let currentUser: unknown = null;
vi.mock('./auth', () => ({ getCurrentUser: async () => currentUser }));

describe.skipIf(!TEST_DB)('online payment operations (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const actions = await import('./online-payments');

  const tenantIds: string[] = [];
  let seq = 0;

  async function login(role = 'OWNER') {
    const key = `it-ops-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [tenant] = await db.insert(schema.tenants).values({ name: 'IT Ops', outletKey: key, slug: key }).returning();
    tenantIds.push(tenant.id);
    currentUser = { id: null, tenantId: tenant.id, outletKey: tenant.outletKey, role };
    return tenant.id;
  }

  /** Order + attempt yang sudah lunas (bentuk data seperti hasil payment service). */
  async function paidOrder(
    tenantId: string,
    opts: { amount?: number; paymentMethod?: string; orderStatus?: string; paymentStatus?: string; reviewReason?: string | null } = {}
  ) {
    const amount = opts.amount ?? 55500;
    const [order] = await db
      .insert(schema.transactions)
      .values({
        tenantId,
        totalAmount: String(amount),
        grandTotal: String(amount),
        gatewayFee: '389',
        netAmount: String(amount - 389),
        paymentMethod: opts.paymentMethod ?? 'ONLINE',
        paymentStatus: opts.paymentStatus ?? 'PAID',
        status: opts.orderStatus ?? 'NEW',
        source: 'ONLINE',
        orderNumber: `OPS-${++seq}`,
      })
      .returning();
    const [attempt] = await db
      .insert(schema.paymentAttempts)
      .values({
        tenantId,
        purpose: 'ORDER',
        transactionId: order.id,
        provider: 'DOKU',
        product: 'CHECKOUT',
        environment: 'sandbox',
        invoiceNumber: `MNU-OPS-${seq}-${Math.random().toString(36).slice(2, 8)}`,
        amount,
        status: 'PAID',
        paidAt: new Date(),
        feeAmount: Math.round(amount * 0.007),
        netAmount: amount - Math.round(amount * 0.007),
        feeSource: 'ESTIMATED',
        requiresReview: Boolean(opts.reviewReason),
        reviewReason: opts.reviewReason ?? null,
      })
      .returning();
    return { order, attempt };
  }

  const orderOf = async (id: string) => (await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)))[0];
  const attemptOf = async (id: string) => (await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.id, id)))[0];

  function csvFile(content: string, name = 'settlement.csv') {
    const fd = new FormData();
    fd.append('file', new File([content], name, { type: 'text/csv' }));
    return fd;
  }

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await db.delete(schema.payments).where(eq(schema.payments.tenantId, tenantId));
      await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));
      await db.delete(schema.transactions).where(eq(schema.transactions.tenantId, tenantId));
      await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    }
  });

  beforeEach(() => {
    currentUser = null;
  });

  describe('access control', () => {
    it('cashiers cannot see, refund, resolve or import', async () => {
      const tenantId = await login('CASHIER');
      const { attempt } = await paidOrder(tenantId, { reviewReason: 'LATE_PAYMENT' });
      expect(await actions.getOnlinePayments('REVIEW')).toHaveProperty('error');
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1, reference: 'R' })).toHaveProperty('error');
      expect(await actions.resolveOnlinePaymentReview({ attemptId: attempt.id, note: 'ok ok' })).toHaveProperty('error');
      expect(await actions.importSettlementCsv(csvFile('Invoice Number,Fee\nX,1'))).toHaveProperty('error');
      expect((await attemptOf(attempt.id)).refundedAmount).toBeNull();
    });

    it('managers can refund but cannot import settlement', async () => {
      const tenantId = await login('MANAGER');
      const { attempt } = await paidOrder(tenantId);
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: 'RF-1' })).toEqual({ success: true });
      expect(await actions.importSettlementCsv(csvFile('Invoice Number,Fee\nX,1'))).toMatchObject({ error: expect.stringContaining('OWNER') });
    });

    it("cannot touch another tenant's payment", async () => {
      const otherTenant = await login();
      const { attempt } = await paidOrder(otherTenant, { reviewReason: 'LATE_PAYMENT' });
      await login(); // tenant lain
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: 'RF' })).toMatchObject({ error: 'Pembayaran tidak ditemukan.' });
      expect(await actions.resolveOnlinePaymentReview({ attemptId: attempt.id, note: 'bukan punyaku' })).toHaveProperty('error');
      expect((await attemptOf(attempt.id)).reviewedAt).toBeNull();
    });
  });

  describe('review queue & refunds', () => {
    it('lists only unresolved review items in the REVIEW view', async () => {
      const tenantId = await login();
      await paidOrder(tenantId);
      const { attempt: flagged } = await paidOrder(tenantId, { reviewReason: 'ALREADY_PAID_OTHER_METHOD', paymentMethod: 'CASH' });
      const res = await actions.getOnlinePayments('REVIEW');
      expect(res).toMatchObject({ success: true, reviewCount: 1 });
      expect(res.success && res.rows.map((r) => r.id)).toEqual([flagged.id]);
      const all = await actions.getOnlinePayments('ALL');
      expect(all.success && all.rows).toHaveLength(2);
    });

    it('refunding a double payment resolves the review but keeps the order paid', async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId, { reviewReason: 'ALREADY_PAID_OTHER_METHOD', paymentMethod: 'CASH' });

      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 55500, reference: 'DOKU-RF-1' })).toEqual({ success: true });

      expect(await attemptOf(attempt.id)).toMatchObject({
        refundedAmount: 55500, refundReference: 'DOKU-RF-1', reviewResolution: 'REFUNDED', reviewedAt: expect.any(Date),
      });
      expect((await orderOf(order.id)).paymentStatus).toBe('PAID');
      expect(await actions.getOnlinePayments('REVIEW')).toMatchObject({ reviewCount: 0 });
    });

    it('full refund of the payment that settled a cancelled order marks the order REFUNDED', async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId, { reviewReason: 'ORDER_CLOSED_BEFORE_PAYMENT', orderStatus: 'CANCELLED' });
      await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 55500, reference: 'RF-2' });
      expect((await orderOf(order.id)).paymentStatus).toBe('REFUNDED');
      const refundRecords = await db.select().from(schema.payments).where(eq(schema.payments.transactionId, order.id));
      expect(refundRecords).toEqual([expect.objectContaining({ status: 'REFUNDED', amount: '55500.00' })]);
    });

    it('partial refund keeps the order PAID', async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId);
      await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 10000, reference: 'RF-3' });
      expect((await orderOf(order.id)).paymentStatus).toBe('PAID');
      expect((await attemptOf(attempt.id)).refundedAmount).toBe(10000);
    });

    it('rejects double refunds, over-refunds and refunds of unpaid attempts', async () => {
      const tenantId = await login();
      const { attempt } = await paidOrder(tenantId);
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 99999, reference: 'X' })).toHaveProperty('error');
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: '' })).toHaveProperty('error');
      await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: 'RF-4' });
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: 'RF-5' }))
        .toMatchObject({ error: expect.stringContaining('sudah pernah') });

      await db.update(schema.paymentAttempts).set({ status: 'PENDING', refundedAmount: null }).where(eq(schema.paymentAttempts.id, attempt.id));
      expect(await actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 1000, reference: 'RF-6' })).toHaveProperty('error');
    });

    it('parallel refund submissions record exactly one refund', async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId);
      const results = await Promise.all(
        [1, 2, 3].map((i) => actions.recordOnlinePaymentRefund({ attemptId: attempt.id, amount: 55500, reference: `RF-P${i}` }))
      );
      expect(results.filter((r) => 'success' in r && r.success)).toHaveLength(1);
      expect(await db.select().from(schema.payments).where(eq(schema.payments.transactionId, order.id))).toHaveLength(1);
    });

    it('resolve without refund requires a note and only works once', async () => {
      const tenantId = await login();
      const { attempt } = await paidOrder(tenantId, { reviewReason: 'LATE_PAYMENT' });
      expect(await actions.resolveOnlinePaymentReview({ attemptId: attempt.id, note: 'x' })).toHaveProperty('error');
      expect(await actions.resolveOnlinePaymentReview({ attemptId: attempt.id, note: 'Pesanan tetap dilayani' })).toEqual({ success: true });
      expect(await attemptOf(attempt.id)).toMatchObject({ reviewResolution: 'NO_ACTION', reviewNote: 'Pesanan tetap dilayani' });
      expect(await actions.resolveOnlinePaymentReview({ attemptId: attempt.id, note: 'lagi' })).toHaveProperty('error');
    });
  });

  describe('settlement import', () => {
    it('replaces estimated fees with real ones on the attempt and the order, idempotently', async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId);
      const csv = `Invoice Number,Amount,Fee Amount,Net Amount,Settlement Date\n${attempt.invoiceNumber},"55.500",400,"55.100",03/10/2026\n`;

      const first = await actions.importSettlementCsv(csvFile(csv));
      expect(first).toMatchObject({ success: true, summary: { updated: 1, unchanged: 0 } });
      expect(await attemptOf(attempt.id)).toMatchObject({ feeAmount: 400, netAmount: 55100, feeSource: 'SETTLEMENT', settledAt: expect.any(Date) });
      expect(await orderOf(order.id)).toMatchObject({ gatewayFee: '400.00', netAmount: '55100.00' });

      const again = await actions.importSettlementCsv(csvFile(csv));
      expect(again).toMatchObject({ success: true, summary: { updated: 0, unchanged: 1 } });
    });

    it("does not overwrite the order's fee for a double payment, only the attempt", async () => {
      const tenantId = await login();
      const { order, attempt } = await paidOrder(tenantId, { reviewReason: 'ALREADY_PAID_OTHER_METHOD', paymentMethod: 'CASH' });
      await actions.importSettlementCsv(csvFile(`invoice_number,amount,fee\n${attempt.invoiceNumber},55500,400\n`));
      expect((await attemptOf(attempt.id)).feeAmount).toBe(400);
      expect((await orderOf(order.id)).gatewayFee).toBe('389.00');
    });

    it('reports unknown, unpaid, mismatched and other-tenant invoices without applying them', async () => {
      const otherTenant = await login();
      const { attempt: foreign } = await paidOrder(otherTenant);
      const tenantId = await login();
      const { attempt: ok } = await paidOrder(tenantId);
      const { attempt: pending } = await paidOrder(tenantId);
      await db.update(schema.paymentAttempts).set({ status: 'PENDING' }).where(eq(schema.paymentAttempts.id, pending.id));
      const { attempt: wrongAmount } = await paidOrder(tenantId);

      const csv = [
        'Invoice Number,Amount,Fee Amount,Net Amount',
        `${ok.invoiceNumber},55500,400,55100`,
        `${pending.invoiceNumber},55500,400,55100`,
        `${wrongAmount.invoiceNumber},60000,400,59600`,
        `${foreign.invoiceNumber},55500,400,55100`,
        'MNU-NOT-EXIST,55500,400,55100',
        'MNU-BAD,55500,400,1',
      ].join('\n');
      const res = await actions.importSettlementCsv(csvFile(csv));

      expect(res).toMatchObject({
        success: true,
        summary: {
          updated: 1,
          notFound: [foreign.invoiceNumber, 'MNU-NOT-EXIST'],
          notPaid: [pending.invoiceNumber],
          mismatched: [expect.objectContaining({ invoiceNumber: wrongAmount.invoiceNumber })],
        },
        totalParseErrors: 1,
      });
      expect((await attemptOf(foreign.id)).feeSource).toBe('ESTIMATED');
      expect((await attemptOf(wrongAmount.id)).feeSource).toBe('ESTIMATED');
    });

    it('rejects non-CSV, oversized and empty uploads', async () => {
      await login();
      expect(await actions.importSettlementCsv(csvFile('x', 'report.xlsx'))).toMatchObject({ error: expect.stringContaining('CSV') });
      expect(await actions.importSettlementCsv(csvFile(''))).toHaveProperty('error');
      expect(await actions.importSettlementCsv(csvFile('a'.repeat(2 * 1024 * 1024 + 1)))).toMatchObject({ error: expect.stringContaining('2 MB') });
      expect(await actions.importSettlementCsv(new FormData())).toHaveProperty('error');
    });
  });
});

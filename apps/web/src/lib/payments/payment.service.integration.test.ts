/**
 * Integration test payment service terhadap Postgres sungguhan (API DOKU di-mock).
 * Dijalankan hanya jika TEST_DATABASE_URL diset ke database uji yang sudah
 * berisi skema Menuin + migrasi drizzle/doku_payments.sql. JANGAN arahkan ke DB produksi.
 *
 *   TEST_DATABASE_URL=postgres://... npm test
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;
Object.assign(process.env, {
  DOKU_ENV: 'sandbox',
  DOKU_CLIENT_ID: 'BRN-TEST-1',
  DOKU_SECRET_KEY: 'SK-integration',
  DOKU_NOTIFICATION_PATH: '/api/webhook/doku',
  DOKU_REQUIRE_SUB_ACCOUNT: 'false',
});

const createCheckoutPayment = vi.fn();
const getCheckoutStatus = vi.fn();
vi.mock('./doku/checkout', () => ({
  createCheckoutPayment: (...a: unknown[]) => createCheckoutPayment(...a),
  getCheckoutStatus: (...a: unknown[]) => getCheckoutStatus(...a),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe.skipIf(!TEST_DB)('payment.service (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const service = await import('./payment.service');
  const { createSignature } = await import('./doku/signature');
  const { DokuApiError } = await import('./doku/client');

  let tenantId: string;
  let seq = 0;

  async function newOrder(overrides: Partial<typeof schema.transactions.$inferInsert> = {}) {
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        tenantId,
        totalAmount: '55500',
        grandTotal: '55500',
        paymentMethod: 'ONLINE',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        source: 'ONLINE',
        orderNumber: `IT-${++seq}`,
        ...overrides,
      })
      .returning();
    return tx;
  }

  const getOrder = async (id: string) =>
    (await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)))[0];
  const getAttempts = async (transactionId: string) =>
    db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.transactionId, transactionId));
  const getPayments = async (transactionId: string) =>
    db.select().from(schema.payments).where(eq(schema.payments.transactionId, transactionId));

  function notify(invoice: string, amount: number, status: string, requestId = crypto.randomUUID()) {
    const body = JSON.stringify({
      order: { invoice_number: invoice, amount },
      transaction: { status, date: '2026-09-30T08:00:00Z' },
      service: { id: 'QRIS' },
      channel: { id: 'QRIS' },
    });
    const h = { clientId: 'BRN-TEST-1', requestId, requestTimestamp: '2026-09-30T08:00:00Z' };
    const headers = new Headers({
      'Client-Id': h.clientId,
      'Request-Id': h.requestId,
      'Request-Timestamp': h.requestTimestamp,
      Signature: createSignature({ ...h, requestTarget: '/api/webhook/doku', body }, 'SK-integration'),
    });
    return service.handleDokuNotification(body, headers);
  }

  beforeAll(async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: 'IT Outlet', outletKey: `it-${Date.now()}`, slug: `it-${Date.now()}`, onlinePaymentEnabled: true })
      .returning();
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await db.delete(schema.payments).where(eq(schema.payments.tenantId, tenantId));
    await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));
    await db.delete(schema.transactions).where(eq(schema.transactions.tenantId, tenantId));
    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
  });

  beforeEach(() => {
    createCheckoutPayment.mockReset();
    getCheckoutStatus.mockReset();
    createCheckoutPayment.mockImplementation(async (input: { invoiceNumber: string }) => ({
      paymentUrl: `https://sandbox.doku.com/checkout-link-v2/${input.invoiceNumber}`,
      tokenId: 'tok',
      raw: {},
      requestId: 'r',
    }));
  });

  it('creates one attempt and reuses it on repeated clicks', async () => {
    const order = await newOrder();
    const first = await service.startOrderPayment({ tenantId, transactionId: order.id });
    const second = await service.startOrderPayment({ tenantId, transactionId: order.id });

    expect(first).toMatchObject({ ok: true, reused: false });
    expect(second).toMatchObject({ ok: true, reused: true });
    expect(first.ok && second.ok && first.paymentUrl === second.paymentUrl).toBe(true);
    expect(createCheckoutPayment).toHaveBeenCalledTimes(1);
    expect(createCheckoutPayment.mock.calls[0][0]).toMatchObject({ amount: 55500 });
    expect(await getAttempts(order.id)).toHaveLength(1);
  });

  it('parallel clicks never create more than one invoice', async () => {
    const order = await newOrder();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => service.startOrderPayment({ tenantId, transactionId: order.id }))
    );
    expect(createCheckoutPayment).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.ok || r.code === 'IN_PROGRESS')).toBe(true);
    expect(await getAttempts(order.id)).toHaveLength(1);
  });

  it('webhook SUCCESS marks the order paid exactly once, even when duplicated', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);

    const requestId = crypto.randomUUID();
    expect((await notify(attempt.invoiceNumber, 55500, 'SUCCESS', requestId)).status).toBe(200);
    expect((await notify(attempt.invoiceNumber, 55500, 'SUCCESS', requestId)).body).toMatchObject({ duplicate: true });
    expect((await notify(attempt.invoiceNumber, 55500, 'SUCCESS')).status).toBe(200); // retry dengan Request-Id baru

    const paid = await getOrder(order.id);
    expect(paid).toMatchObject({ paymentStatus: 'PAID', status: 'NEW', paymentMethod: 'ONLINE', gatewayFee: '389.00', netAmount: '55111.00' });
    expect(await getPayments(order.id)).toHaveLength(1);
    const [after] = await getAttempts(order.id);
    expect(after).toMatchObject({ status: 'PAID', feeAmount: 389, netAmount: 55111, feeSource: 'ESTIMATED', requiresReview: false });

    // Order yang sudah lunas tidak bisa dibuatkan invoice baru.
    expect(await service.startOrderPayment({ tenantId, transactionId: order.id })).toMatchObject({ ok: false, code: 'ALREADY_PAID' });
  });

  it('webhook and status check racing on the same success record one payment', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);
    getCheckoutStatus.mockResolvedValue({ invoiceNumber: attempt.invoiceNumber, amount: 55500, status: 'SUCCESS', serviceId: 'QRIS', channelId: 'QRIS', raw: {} });

    await Promise.all([
      notify(attempt.invoiceNumber, 55500, 'SUCCESS'),
      service.syncAttemptWithGateway(attempt, 'STATUS_CHECK'),
      notify(attempt.invoiceNumber, 55500, 'SUCCESS'),
    ]);

    expect(await getPayments(order.id)).toHaveLength(1);
    expect((await getOrder(order.id)).paymentStatus).toBe('PAID');
  });

  it('amount mismatch never marks the order paid', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);

    await notify(attempt.invoiceNumber, 1000, 'SUCCESS');

    expect((await getOrder(order.id)).paymentStatus).toBe('PENDING');
    const [after] = await getAttempts(order.id);
    expect(after).toMatchObject({ status: 'PENDING', requiresReview: true, reviewReason: 'AMOUNT_MISMATCH' });
  });

  it('payment after the customer switched to cash is recorded and flagged', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);
    await service.cancelActivePayments({ tenantId, transactionId: order.id });
    await db.update(schema.transactions).set({ paymentMethod: 'CASH' }).where(eq(schema.transactions.id, order.id));

    await notify(attempt.invoiceNumber, 55500, 'SUCCESS');

    expect(await getOrder(order.id)).toMatchObject({ paymentStatus: 'PAID', paymentMethod: 'ONLINE' });
    const [after] = await getAttempts(order.id);
    expect(after).toMatchObject({ status: 'PAID', requiresReview: true, reviewReason: 'LATE_PAYMENT' });
  });

  it('paying an order already paid at the cashier is flagged as double payment', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);
    await db.update(schema.transactions).set({ paymentStatus: 'PAID', paymentMethod: 'CASH', status: 'NEW' }).where(eq(schema.transactions.id, order.id));

    await notify(attempt.invoiceNumber, 55500, 'SUCCESS');

    expect(await getOrder(order.id)).toMatchObject({ paymentMethod: 'CASH', paymentStatus: 'PAID' });
    const [after] = await getAttempts(order.id);
    expect(after).toMatchObject({ status: 'PAID', requiresReview: true, reviewReason: 'ALREADY_PAID_OTHER_METHOD' });
  });

  it('FAILED/EXPIRED close the attempt without touching the order, and a new attempt can start', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);

    await notify(attempt.invoiceNumber, 55500, 'EXPIRED');
    expect((await getAttempts(order.id))[0].status).toBe('EXPIRED');
    expect(await getOrder(order.id)).toMatchObject({ paymentStatus: 'PENDING', status: 'PENDING' });

    const retry = await service.startOrderPayment({ tenantId, transactionId: order.id });
    expect(retry).toMatchObject({ ok: true, reused: false });
    expect(await getAttempts(order.id)).toHaveLength(2);
  });

  it('gateway error marks the attempt FAILED and allows retry', async () => {
    const order = await newOrder();
    createCheckoutPayment.mockRejectedValueOnce(new DokuApiError('boom', 400, { error: 'x' }, 'r'));
    expect(await service.startOrderPayment({ tenantId, transactionId: order.id })).toMatchObject({ ok: false, code: 'GATEWAY_ERROR' });
    expect((await getAttempts(order.id))[0]).toMatchObject({ status: 'FAILED' });

    expect(await service.startOrderPayment({ tenantId, transactionId: order.id })).toMatchObject({ ok: true });
  });

  it('refuses cancelled orders and unknown invoices are acknowledged', async () => {
    const order = await newOrder({ status: 'CANCELLED' });
    expect(await service.startOrderPayment({ tenantId, transactionId: order.id })).toMatchObject({ ok: false, code: 'ORDER_CLOSED' });
    expect((await notify('MNU-DOES-NOT-EXIST', 1000, 'SUCCESS')).status).toBe(200);
  });

  it('reconcile expires stale pending attempts that DOKU no longer knows', async () => {
    const order = await newOrder();
    await service.startOrderPayment({ tenantId, transactionId: order.id });
    const [attempt] = await getAttempts(order.id);
    await db
      .update(schema.paymentAttempts)
      .set({ createdAt: new Date(Date.now() - 3 * 3600_000), expiresAt: new Date(Date.now() - 2 * 3600_000) })
      .where(eq(schema.paymentAttempts.id, attempt.id));
    getCheckoutStatus.mockRejectedValue(new DokuApiError('not found', 404, {}, 'r'));

    await service.reconcilePendingPayments();

    expect((await getAttempts(order.id))[0].status).toBe('EXPIRED');
    expect((await getOrder(order.id)).paymentStatus).toBe('PENDING');
  });
});

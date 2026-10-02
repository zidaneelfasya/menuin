/**
 * Integration test pembayaran langganan terhadap Postgres sungguhan (API DOKU di-mock).
 * Hanya jalan jika TEST_DATABASE_URL diset ke database UJI berisi skema Menuin
 * + migrasi drizzle/doku_payments.sql & doku_subscriptions.sql.
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

const DAY = 24 * 60 * 60 * 1000;

describe.skipIf(!TEST_DB)('subscription payments (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');
  const service = await import('./payment.service');
  const { createSignature } = await import('./doku/signature');

  const tenantIds: string[] = [];

  async function newTenant(subscriptionTier: 'FREE' | 'BASIC' | 'PRO' = 'FREE') {
    const key = `it-sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [tenant] = await db
      .insert(schema.tenants)
      .values({ name: 'IT Sub Outlet', outletKey: key, slug: key, subscriptionTier })
      .returning();
    tenantIds.push(tenant.id);
    return tenant.id;
  }

  async function newInvoice(tenantId: string, overrides: Partial<typeof schema.subscriptionInvoices.$inferInsert> = {}) {
    const [invoice] = await db
      .insert(schema.subscriptionInvoices)
      .values({ tenantId, planCode: 'business', plan: 'PRO', amount: 199000, periodDays: 30, status: 'PENDING', ...overrides })
      .returning();
    return invoice;
  }

  async function pay(tenantId: string, invoiceId: string) {
    const res = await service.startSubscriptionPayment({
      tenantId,
      subscriptionInvoiceId: invoiceId,
      customer: { name: 'IT', email: 'owner@example.com' },
    });
    const [attempt] = await db
      .select()
      .from(schema.paymentAttempts)
      .where(eq(schema.paymentAttempts.subscriptionInvoiceId, invoiceId))
      .orderBy(schema.paymentAttempts.createdAt);
    return { res, attempt };
  }

  function notify(invoiceNumber: string, amount: number, status: string, requestId = crypto.randomUUID()) {
    const body = JSON.stringify({
      order: { invoice_number: invoiceNumber, amount },
      transaction: { status, date: '2026-10-02T08:00:00Z' },
      service: { id: 'VIRTUAL_ACCOUNT' },
      channel: { id: 'VIRTUAL_ACCOUNT_BCA' },
    });
    const h = { clientId: 'BRN-TEST-1', requestId, requestTimestamp: '2026-10-02T08:00:00Z' };
    return service.handleDokuNotification(
      body,
      new Headers({
        'Client-Id': h.clientId,
        'Request-Id': h.requestId,
        'Request-Timestamp': h.requestTimestamp,
        Signature: createSignature({ ...h, requestTarget: '/api/webhook/doku', body }, 'SK-integration'),
      })
    );
  }

  const subsOf = (tenantId: string) =>
    db.select().from(schema.subscriptions).where(eq(schema.subscriptions.tenantId, tenantId));
  const activeSubsOf = (tenantId: string) =>
    db
      .select()
      .from(schema.subscriptions)
      .where(and(eq(schema.subscriptions.tenantId, tenantId), eq(schema.subscriptions.status, 'ACTIVE')));
  const invoiceById = async (id: string) =>
    (await db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.id, id)))[0];
  const tenantById = async (id: string) =>
    (await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)))[0];
  const attemptById = async (id: string) =>
    (await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.id, id)))[0];

  beforeAll(() => {
    expect(TEST_DB).toBeTruthy();
  });

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));
      await db.update(schema.subscriptionInvoices).set({ subscriptionId: null }).where(eq(schema.subscriptionInvoices.tenantId, tenantId));
      await db.delete(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.tenantId, tenantId));
      await db.delete(schema.subscriptions).where(eq(schema.subscriptions.tenantId, tenantId));
      await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    }
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

  it('creates a platform-account checkout (no sub account) with SUB- invoice and server amount', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { res, attempt } = await pay(tenantId, invoice.id);

    expect(res).toMatchObject({ ok: true, reused: false });
    expect(attempt).toMatchObject({ purpose: 'SUBSCRIPTION', transactionId: null, subAccountId: null, amount: 199000, status: 'PENDING' });
    expect(attempt.invoiceNumber).toMatch(/^SUB-/);
    expect(createCheckoutPayment.mock.calls[0][0]).toMatchObject({ amount: 199000, subAccountId: null, dueMinutes: 60 });

    // Klik ulang memakai sesi yang sama.
    expect((await pay(tenantId, invoice.id)).res).toMatchObject({ ok: true, reused: true });
    expect(createCheckoutPayment).toHaveBeenCalledTimes(1);
  });

  it('webhook SUCCESS activates the subscription, marks the invoice paid and updates the tier', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);
    const before = Date.now();

    expect((await notify(attempt.invoiceNumber, 199000, 'SUCCESS')).status).toBe(200);

    const [active] = await activeSubsOf(tenantId);
    expect(active).toMatchObject({ plan: 'PRO', status: 'ACTIVE' });
    const length = active.currentPeriodEnd!.getTime() - active.currentPeriodStart!.getTime();
    expect(length).toBe(30 * DAY);
    expect(active.currentPeriodStart!.getTime()).toBeGreaterThanOrEqual(before - 1000);

    expect(await invoiceById(invoice.id)).toMatchObject({ status: 'PAID', subscriptionId: active.id });
    expect((await tenantById(tenantId)).subscriptionTier).toBe('PRO');
    expect(await attemptById(attempt.id)).toMatchObject({ status: 'PAID', requiresReview: false });
  });

  it('renewal while active carries over remaining days and keeps exactly one ACTIVE row', async () => {
    const tenantId = await newTenant('BASIC');
    const now = Date.now();
    const [old] = await db
      .insert(schema.subscriptions)
      .values({ tenantId, plan: 'BASIC', status: 'ACTIVE', currentPeriodStart: new Date(now - 20 * DAY), currentPeriodEnd: new Date(now + 10 * DAY) })
      .returning();

    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);
    await notify(attempt.invoiceNumber, 199000, 'SUCCESS');

    const active = await activeSubsOf(tenantId);
    expect(active).toHaveLength(1);
    expect(active[0].plan).toBe('PRO');
    const remainingDays = (active[0].currentPeriodEnd!.getTime() - Date.now()) / DAY;
    expect(remainingDays).toBeGreaterThan(39.9);
    expect(remainingDays).toBeLessThanOrEqual(40);
    expect((await subsOf(tenantId)).find((s) => s.id === old.id)?.status).toBe('EXPIRED');
  });

  it('duplicate notifications and a racing status check activate only once', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);
    getCheckoutStatus.mockResolvedValue({
      invoiceNumber: attempt.invoiceNumber, amount: 199000, status: 'SUCCESS', serviceId: 'QRIS', channelId: 'QRIS', raw: {},
    });

    const requestId = crypto.randomUUID();
    await Promise.all([
      notify(attempt.invoiceNumber, 199000, 'SUCCESS', requestId),
      notify(attempt.invoiceNumber, 199000, 'SUCCESS', requestId),
      notify(attempt.invoiceNumber, 199000, 'SUCCESS'),
      service.syncAttemptWithGateway(attempt, 'STATUS_CHECK'),
    ]);

    expect(await subsOf(tenantId)).toHaveLength(1);
    expect(await activeSubsOf(tenantId)).toHaveLength(1);
  });

  it('amount mismatch never activates', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);

    await notify(attempt.invoiceNumber, 1000, 'SUCCESS');

    expect(await subsOf(tenantId)).toHaveLength(0);
    expect((await invoiceById(invoice.id)).status).toBe('PENDING');
    expect(await attemptById(attempt.id)).toMatchObject({ requiresReview: true, reviewReason: 'AMOUNT_MISMATCH' });
  });

  it('a cancelled invoice that still gets paid activates and is flagged LATE_PAYMENT', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);
    // Simulasi ganti paket: tagihan & sesi lama dibatalkan.
    await db.update(schema.subscriptionInvoices).set({ status: 'CANCELED' }).where(eq(schema.subscriptionInvoices.id, invoice.id));
    await db.update(schema.paymentAttempts).set({ status: 'CANCELED' }).where(eq(schema.paymentAttempts.id, attempt.id));

    await notify(attempt.invoiceNumber, 199000, 'SUCCESS');

    expect(await activeSubsOf(tenantId)).toHaveLength(1);
    expect((await invoiceById(invoice.id)).status).toBe('PAID');
    expect(await attemptById(attempt.id)).toMatchObject({ status: 'PAID', requiresReview: true, reviewReason: 'LATE_PAYMENT' });
  });

  it('paying the same invoice through two attempts activates once and flags the second', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const first = await pay(tenantId, invoice.id);
    // Attempt pertama expired, pelanggan membuat sesi baru, lalu ternyata keduanya dibayar.
    await db.update(schema.paymentAttempts).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.paymentAttempts.id, first.attempt.id));
    await pay(tenantId, invoice.id);
    const attempts = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.subscriptionInvoiceId, invoice.id));
    expect(attempts).toHaveLength(2);
    const second = attempts.find((a) => a.id !== first.attempt.id)!;

    await notify(second.invoiceNumber, 199000, 'SUCCESS');
    await notify(first.attempt.invoiceNumber, 199000, 'SUCCESS');

    expect(await subsOf(tenantId)).toHaveLength(1);
    expect(await attemptById(first.attempt.id)).toMatchObject({ status: 'PAID', requiresReview: true, reviewReason: 'ALREADY_PAID_OTHER_METHOD' });
  });

  it('refuses to start payment for a paid or cancelled invoice, or another tenant', async () => {
    const tenantId = await newTenant();
    const otherTenantId = await newTenant();
    const paid = await newInvoice(tenantId, { status: 'PAID' });
    expect((await pay(tenantId, paid.id)).res).toMatchObject({ ok: false, code: 'ALREADY_PAID' });

    const cancelled = await newInvoice(tenantId, { status: 'CANCELED' });
    expect((await pay(tenantId, cancelled.id)).res).toMatchObject({ ok: false, code: 'ORDER_CLOSED' });

    const pending = await newInvoice(tenantId);
    expect((await pay(otherTenantId, pending.id)).res).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(createCheckoutPayment).not.toHaveBeenCalled();
  });

  it('allows only one PENDING invoice per tenant (DB constraint)', async () => {
    const tenantId = await newTenant();
    await newInvoice(tenantId);
    await expect(newInvoice(tenantId)).rejects.toThrow();
  });

  it('syncSubscriptionInvoicePayment picks up a success when the webhook never arrived', async () => {
    const tenantId = await newTenant();
    const invoice = await newInvoice(tenantId);
    const { attempt } = await pay(tenantId, invoice.id);
    getCheckoutStatus.mockResolvedValue({
      invoiceNumber: attempt.invoiceNumber, amount: 199000, status: 'SUCCESS', serviceId: 'QRIS', channelId: 'QRIS', raw: {},
    });

    const synced = await service.syncSubscriptionInvoicePayment({ tenantId, subscriptionInvoiceId: invoice.id, minIntervalMs: 0 });

    expect(synced?.status).toBe('PAID');
    expect(await activeSubsOf(tenantId)).toHaveLength(1);
  });
});

/**
 * Integration test server action billing (auth context & API DOKU di-mock, DB sungguhan).
 * Hanya jalan jika TEST_DATABASE_URL diset ke database UJI.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;
Object.assign(process.env, {
  DOKU_ENV: 'sandbox',
  DOKU_CLIENT_ID: 'BRN-TEST-1',
  DOKU_SECRET_KEY: 'SK-integration',
  DOKU_REQUIRE_SUB_ACCOUNT: 'false',
  APP_BASE_URL: 'https://app.menuin.test',
});

const createCheckoutPayment = vi.fn();
vi.mock('@/lib/payments/doku/checkout', () => ({
  createCheckoutPayment: (...a: unknown[]) => createCheckoutPayment(...a),
  getCheckoutStatus: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));

let currentContext: unknown = null;
vi.mock('./auth-context', () => ({ getCurrentContext: async () => currentContext }));

describe.skipIf(!TEST_DB)('billing actions (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const { startSubscriptionCheckout, getSubscriptionCheckoutStatus } = await import('./billing');
  const { handleDokuNotification } = await import('@/lib/payments/payment.service');
  const { createSignature } = await import('@/lib/payments/doku/signature');

  function notifySuccess(invoiceNumber: string, amount: number) {
    const body = JSON.stringify({ order: { invoice_number: invoiceNumber, amount }, transaction: { status: 'SUCCESS' } });
    const h = { clientId: 'BRN-TEST-1', requestId: crypto.randomUUID(), requestTimestamp: '2026-10-02T08:00:00Z' };
    return handleDokuNotification(
      body,
      new Headers({
        'Client-Id': h.clientId,
        'Request-Id': h.requestId,
        'Request-Timestamp': h.requestTimestamp,
        Signature: createSignature({ ...h, requestTarget: '/api/webhook/doku', body }, 'SK-integration'),
      })
    );
  }

  const tenantIds: string[] = [];

  async function loginAs(role: string) {
    const key = `it-bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [tenant] = await db.insert(schema.tenants).values({ name: 'IT Billing', outletKey: key, slug: key }).returning();
    tenantIds.push(tenant.id);
    currentContext = {
      account: { id: 'acc', authUserId: 'auth', email: 'owner@example.com', name: 'Owner' },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, outletKey: tenant.outletKey },
      membership: { id: crypto.randomUUID(), role, status: 'ACTIVE' },
      subscription: null,
      entitlements: { features: [], isLocked: true },
    };
    return tenant.id;
  }

  const invoicesOf = (tenantId: string) =>
    db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.tenantId, tenantId));

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
    currentContext = null;
    createCheckoutPayment.mockReset();
    createCheckoutPayment.mockImplementation(async (input: { invoiceNumber: string }) => ({
      paymentUrl: `https://sandbox.doku.com/checkout-link-v2/${input.invoiceNumber}`,
      tokenId: 'tok',
      raw: {},
      requestId: 'r',
    }));
  });

  it('requires login and OWNER role', async () => {
    expect(await startSubscriptionCheckout('starter')).toMatchObject({ error: expect.stringContaining('masuk') });
    await loginAs('MANAGER');
    expect(await startSubscriptionCheckout('starter')).toMatchObject({ error: expect.stringContaining('OWNER') });
    expect(createCheckoutPayment).not.toHaveBeenCalled();
  });

  it('rejects unknown plan codes before touching anything', async () => {
    const tenantId = await loginAs('OWNER');
    expect(await startSubscriptionCheckout('enterprise')).toMatchObject({ error: 'Paket tidak dikenal.' });
    expect(await invoicesOf(tenantId)).toHaveLength(0);
  });

  it('creates an invoice priced by the server with a safe callback URL', async () => {
    const tenantId = await loginAs('OWNER');
    const res = await startSubscriptionCheckout('business');

    expect(res).toMatchObject({ success: true, paymentUrl: expect.stringContaining('sandbox.doku.com') });
    const [invoice] = await invoicesOf(tenantId);
    expect(invoice).toMatchObject({ planCode: 'business', plan: 'PRO', amount: 199000, periodDays: 30, status: 'PENDING' });
    expect(createCheckoutPayment.mock.calls[0][0]).toMatchObject({
      amount: 199000,
      callbackUrl: `https://app.menuin.test/checkout/status?invoice=${invoice.id}`,
      customer: { email: 'owner@example.com' },
    });
  });

  it('reuses the open invoice for the same plan, and replaces it when the plan changes', async () => {
    const tenantId = await loginAs('OWNER');
    await startSubscriptionCheckout('starter');
    await startSubscriptionCheckout('starter');
    expect(await invoicesOf(tenantId)).toHaveLength(1);
    expect(createCheckoutPayment).toHaveBeenCalledTimes(1);

    await startSubscriptionCheckout('business');
    const invoices = await invoicesOf(tenantId);
    expect(invoices.map((i) => [i.planCode, i.status]).sort()).toEqual([
      ['business', 'PENDING'],
      ['starter', 'CANCELED'],
    ]);
    const attempts = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));
    const oldInvoice = invoices.find((i) => i.planCode === 'starter')!;
    expect(attempts.filter((a) => a.subscriptionInvoiceId === oldInvoice.id).every((a) => a.status === 'CANCELED')).toBe(true);
  });

  it('parallel clicks create a single invoice', async () => {
    const tenantId = await loginAs('OWNER');
    const results = await Promise.all(Array.from({ length: 5 }, () => startSubscriptionCheckout('starter')));
    // Setiap klik harus berhasil, atau diminta menunggu karena sesi sedang dibuat — tidak boleh error lain.
    for (const r of results) {
      if (!r.success) expect(r).toMatchObject({ code: 'IN_PROGRESS' });
    }
    expect(results.some((r) => r.success)).toBe(true);
    expect(await invoicesOf(tenantId)).toHaveLength(1);
    expect(createCheckoutPayment).toHaveBeenCalledTimes(1);
  });

  it('status lookup is scoped to the logged-in tenant', async () => {
    const ownerTenant = await loginAs('OWNER');
    await startSubscriptionCheckout('starter');
    const [invoice] = await invoicesOf(ownerTenant);
    expect(await getSubscriptionCheckoutStatus(invoice.id)).toMatchObject({ success: true, status: 'PENDING', planCode: 'starter' });

    await loginAs('OWNER'); // tenant lain
    expect(await getSubscriptionCheckoutStatus(invoice.id)).toMatchObject({ error: 'Tagihan tidak ditemukan.' });
    expect(await getSubscriptionCheckoutStatus('not-a-uuid')).toMatchObject({ error: 'Tagihan tidak ditemukan.' });
  });

  it('webhook success racing with a plan change never deadlocks and activates exactly once', async () => {
    for (let round = 0; round < 5; round++) {
      const tenantId = await loginAs('OWNER');
      await startSubscriptionCheckout('starter');
      const [attempt] = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));

      const [webhook, change] = await Promise.all([
        notifySuccess(attempt.invoiceNumber, 99000),
        startSubscriptionCheckout('business'),
      ]);

      expect(webhook.status).toBe(200);
      expect(change.success || change.code === 'IN_PROGRESS').toBe(true);
      const active = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.tenantId, tenantId));
      expect(active.filter((sub) => sub.status === 'ACTIVE')).toHaveLength(1);
      expect(active[0].plan).toBe('BASIC');
    }
  });
});

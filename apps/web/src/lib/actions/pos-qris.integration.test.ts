/**
 * Integration test QRIS dinamis POS: DB sungguhan, API DOKU SNAP di-mock.
 * Hanya jalan jika TEST_DATABASE_URL diset ke database UJI.
 */
import crypto from 'crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

const merchant = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const doku = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
Object.assign(process.env, {
  DOKU_ENV: 'sandbox',
  DOKU_CLIENT_ID: 'BRN-TEST-1',
  DOKU_SECRET_KEY: 'SK-integration',
  DOKU_REQUIRE_SUB_ACCOUNT: 'false',
  DOKU_PRIVATE_KEY: merchant.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  DOKU_PUBLIC_KEY: doku.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  DOKU_QRIS_MERCHANT_ID: 'M-SANDBOX',
  DOKU_QRIS_TERMINAL_ID: 'T-SANDBOX',
});

const generateQris = vi.fn();
const queryQris = vi.fn();
vi.mock('@/lib/payments/doku/snap/qris', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/payments/doku/snap/qris')>();
  return {
    ...actual,
    generateQris: (...a: unknown[]) => generateQris(...a),
    queryQris: (...a: unknown[]) => queryQris(...a),
  };
});
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));

let currentUser: unknown = null;
vi.mock('./auth', () => ({ getCurrentUser: async () => currentUser }));

describe.skipIf(!TEST_DB)('POS dynamic QRIS (integration)', async () => {
  const { db } = await import('@/lib/db');
  const schema = await import('@/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');
  const actions = await import('./pos-qris');
  const { createTransaction } = await import('./transactions');
  const { handleQrisNotification } = await import('@/lib/payments/payment.service');
  const { issueInboundToken } = await import('@/lib/payments/doku/snap/inbound');
  const { signAsymmetric } = await import('@/lib/payments/doku/snap/signature');

  const tenantIds: string[] = [];
  let productId: string;

  async function setup(stock = 10) {
    const key = `it-qris-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [tenant] = await db.insert(schema.tenants).values({ name: 'IT QRIS', outletKey: key, slug: key }).returning();
    tenantIds.push(tenant.id);
    const [product] = await db
      .insert(schema.products)
      .values({ tenantId: tenant.id, name: 'Kopi Susu', sku: `SKU-${key}`, price: '27750', costPrice: '10000', stock, trackStock: true })
      .returning();
    productId = product.id;
    currentUser = { id: null, tenantId: tenant.id, outletKey: tenant.outletKey, role: 'CASHIER' };
    return tenant.id;
  }

  const payload = () => ({
    totalAmount: 55500,
    discount: 0,
    tax: 0,
    grandTotal: 55500,
    paymentMethod: 'qris_dynamic',
    orderType: 'DINE_IN',
    items: [{ productId, quantity: 2, price: 27750, subtotal: 55500 }],
  });

  const orderOf = async (id: string) => (await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)))[0];
  const attemptsOf = (id: string) => db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.transactionId, id));
  const stockOf = async () => (await db.select().from(schema.products).where(eq(schema.products.id, productId)))[0].stock;

  function inboundToken() {
    const ts = '2026-10-02T15:04:05+07:00';
    const res = issueInboundToken(new Headers({
      'X-CLIENT-KEY': 'BRN-TEST-1',
      'X-TIMESTAMP': ts,
      'X-SIGNATURE': signAsymmetric(doku.privateKey, 'BRN-TEST-1', ts),
    }));
    if (!res.ok) throw new Error('token not issued');
    return res.accessToken;
  }

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await db.delete(schema.payments).where(eq(schema.payments.tenantId, tenantId));
      await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.tenantId, tenantId));
      await db.delete(schema.transactionItems).where(eq(schema.transactionItems.tenantId, tenantId));
      await db.delete(schema.transactions).where(eq(schema.transactions.tenantId, tenantId));
      await db.delete(schema.products).where(eq(schema.products.tenantId, tenantId));
      await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    }
  });

  beforeEach(() => {
    generateQris.mockReset();
    queryQris.mockReset();
    generateQris.mockImplementation(async (input: { partnerReferenceNo: string }) => ({
      qrContent: `00020101021226${input.partnerReferenceNo}6304ABCD`,
      referenceNo: `REF-${input.partnerReferenceNo}`,
      raw: {},
    }));
    queryQris.mockResolvedValue({ statusCode: '03', statusDesc: 'Pending', amount: 55500, raw: {} });
  });

  it('cashier cannot record QRIS_DYNAMIC as paid directly', async () => {
    await setup();
    expect(await createTransaction({ ...payload(), paymentMethod: 'qris_dynamic' })).toMatchObject({ success: false });
  });

  it('creates a PENDING transaction, deducts stock and returns a QR locked to the DB amount', async () => {
    await setup(10);
    const res = await actions.startPosQrisCheckout(payload());
    expect(res.success).toBe(true);
    const session = res.session!;

    expect(session).toMatchObject({ amount: 55500, qrContent: expect.stringMatching(/^0002/) });
    expect(await orderOf(session.transactionId)).toMatchObject({
      source: 'POS', paymentMethod: 'QRIS_DYNAMIC', paymentStatus: 'PENDING', status: 'PENDING', gatewayFee: '0.00',
    });
    expect(await stockOf()).toBe(8);
    expect(generateQris.mock.calls[0][0]).toMatchObject({ amount: 55500, merchantId: 'M-SANDBOX', terminalId: 'T-SANDBOX' });
    const [attempt] = await attemptsOf(session.transactionId);
    expect(attempt).toMatchObject({ product: 'SNAP_QRIS', status: 'PENDING', gatewayMerchantId: 'M-SANDBOX' });
    expect(attempt.invoiceNumber).toMatch(/^QRS-/);
  });

  it('polling picks up the payment: order PAID, PROCESSING, QRIS_DYNAMIC with fee', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    expect(await actions.getPosQrisStatus(session.transactionId)).toMatchObject({ paymentStatus: 'PENDING' });

    // Lewati batas interval polling agar cek berikutnya benar-benar ke DOKU.
    await db.update(schema.paymentAttempts).set({ lastCheckedAt: null }).where(eq(schema.paymentAttempts.transactionId, session.transactionId));
    queryQris.mockResolvedValue({ statusCode: '00', statusDesc: 'Success', amount: 55500, raw: {} });
    expect(await actions.getPosQrisStatus(session.transactionId)).toMatchObject({ paymentStatus: 'PAID' });

    expect(await orderOf(session.transactionId)).toMatchObject({
      paymentStatus: 'PAID', status: 'PROCESSING', paymentMethod: 'QRIS_DYNAMIC', gatewayFee: '389.00', netAmount: '55111.00',
    });
  });

  it('polling is rate limited per transaction', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    await Promise.all([1, 2, 3, 4].map(() => actions.getPosQrisStatus(session.transactionId)));
    await actions.getPosQrisStatus(session.transactionId);
    expect(queryQris.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('cancel releases stock and closes the transaction', async () => {
    await setup(10);
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    expect(await stockOf()).toBe(8);

    expect(await actions.cancelPosQris(session.transactionId)).toMatchObject({ success: true, paid: false });
    expect(await orderOf(session.transactionId)).toMatchObject({ status: 'CANCELLED', paymentStatus: 'CANCELED' });
    expect((await attemptsOf(session.transactionId))[0].status).toBe('CANCELED');
    expect(await stockOf()).toBe(10);
  });

  it('cancel is refused when DOKU says the customer already paid', async () => {
    await setup(10);
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    queryQris.mockResolvedValue({ statusCode: '00', statusDesc: 'Success', amount: 55500, raw: {} });

    expect(await actions.cancelPosQris(session.transactionId)).toMatchObject({ success: true, paid: true });
    expect(await orderOf(session.transactionId)).toMatchObject({ paymentStatus: 'PAID', status: 'PROCESSING' });
    expect(await stockOf()).toBe(8);
  });

  it('a payment arriving after cancel is recorded and flagged for refund review', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    await actions.cancelPosQris(session.transactionId);
    const [attempt] = await attemptsOf(session.transactionId);

    queryQris.mockResolvedValue({ statusCode: '00', statusDesc: 'Success', amount: 55500, raw: {} });
    const res = await handleQrisNotification(
      JSON.stringify({ originalPartnerReferenceNo: attempt.invoiceNumber, latestTransactionStatus: '00' }),
      new Headers({ Authorization: `Bearer ${inboundToken()}`, 'X-EXTERNAL-ID': '1' })
    );
    // Attempt sudah CANCELED (tidak aktif) → notifikasi diterima tapi tidak memicu query.
    expect(res.status).toBe(200);

    // Cron rekonsiliasi hanya memproses PENDING; uji jalur apply langsung lewat sync manual.
    const { syncAttemptWithGateway } = await import('@/lib/payments/payment.service');
    await syncAttemptWithGateway(attempt, 'RECONCILE');
    expect(await orderOf(session.transactionId)).toMatchObject({ status: 'CANCELLED', paymentStatus: 'PAID' });
    expect((await attemptsOf(session.transactionId))[0]).toMatchObject({
      status: 'PAID', requiresReview: true, reviewReason: 'ORDER_CLOSED_BEFORE_PAYMENT',
    });
  });

  it('QRIS notification with a valid token triggers an authoritative query; body status is not trusted', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    const [attempt] = await attemptsOf(session.transactionId);
    const body = JSON.stringify({ originalPartnerReferenceNo: attempt.invoiceNumber, latestTransactionStatus: '00' });

    // Notifikasi bilang "00" tapi DOKU (query) bilang masih pending → tidak lunas.
    queryQris.mockResolvedValue({ statusCode: '03', statusDesc: 'Pending', amount: 55500, raw: {} });
    expect((await handleQrisNotification(body, new Headers({ Authorization: `Bearer ${inboundToken()}` }))).status).toBe(200);
    expect((await orderOf(session.transactionId)).paymentStatus).toBe('PENDING');

    await db.update(schema.paymentAttempts).set({ lastCheckedAt: null }).where(eq(schema.paymentAttempts.id, attempt.id));
    queryQris.mockResolvedValue({ statusCode: '00', statusDesc: 'Success', amount: 55500, raw: {} });
    expect((await handleQrisNotification(body, new Headers({ Authorization: `Bearer ${inboundToken()}` }))).body)
      .toMatchObject({ responseCode: '2005200' });
    expect((await orderOf(session.transactionId)).paymentStatus).toBe('PAID');
  });

  it('QRIS notification without a valid token is rejected before touching the gateway', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    const [attempt] = await attemptsOf(session.transactionId);
    const body = JSON.stringify({ originalPartnerReferenceNo: attempt.invoiceNumber });
    const forged = (await import('jsonwebtoken')).default.sign({ clientId: 'BRN-TEST-1' }, doku.privateKey, { algorithm: 'RS256', issuer: 'menuin' });

    expect((await handleQrisNotification(body, new Headers())).status).toBe(401);
    expect((await handleQrisNotification(body, new Headers({ Authorization: `Bearer ${forged}` }))).status).toBe(401);
    expect(queryQris).not.toHaveBeenCalled();
  });

  it('amount mismatch reported by DOKU never marks the order paid', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    await db.update(schema.paymentAttempts).set({ lastCheckedAt: null }).where(eq(schema.paymentAttempts.transactionId, session.transactionId));
    queryQris.mockResolvedValue({ statusCode: '00', statusDesc: 'Success', amount: 1000, raw: {} });

    await actions.getPosQrisStatus(session.transactionId);
    expect((await orderOf(session.transactionId)).paymentStatus).toBe('PENDING');
    expect((await attemptsOf(session.transactionId))[0]).toMatchObject({ requiresReview: true, reviewReason: 'AMOUNT_MISMATCH' });
  });

  it('expired QR: regenerate checks payment first, then issues a new QR for the same transaction', async () => {
    await setup();
    const { session } = (await actions.startPosQrisCheckout(payload())) as { session: { transactionId: string } };
    await db
      .update(schema.paymentAttempts)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.paymentAttempts.transactionId, session.transactionId));

    const res = await actions.regeneratePosQris(session.transactionId);
    expect(res).toMatchObject({ success: true, paid: false, qrContent: expect.any(String) });
    const attempts = await attemptsOf(session.transactionId);
    expect(attempts).toHaveLength(2);
    expect(attempts.filter((a) => a.status === 'PENDING')).toHaveLength(1);
  });

  it('if QR generation fails, the pending transaction is cancelled and stock restored', async () => {
    await setup(10);
    const { DokuApiError } = await import('@/lib/payments/doku/client');
    generateQris.mockRejectedValueOnce(new DokuApiError('boom', 500, {}, 'r'));

    const res = await actions.startPosQrisCheckout(payload());
    expect(res).toMatchObject({ error: expect.stringContaining('QRIS') });
    expect(await stockOf()).toBe(10);
    const pending = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.tenantId, tenantIds[tenantIds.length - 1]), eq(schema.transactions.paymentStatus, 'PENDING')));
    expect(pending).toHaveLength(0);
  });

  it('availability requires SNAP config and a QRIS merchant', async () => {
    await setup();
    expect(await actions.getPosQrisAvailability()).toBe(true);
  });
});

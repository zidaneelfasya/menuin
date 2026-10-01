import { revalidatePath } from 'next/cache';
import { and, asc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  paymentAttempts,
  paymentWebhookEvents,
  payments,
  products,
  subscriptionInvoices,
  subscriptions,
  tenants,
  transactionItems,
  transactions,
} from '@/lib/db/schema';
import { computeSubscriptionPeriod } from '@/lib/billing/plans';
import { DokuConfigError, getDokuConfig, type DokuConfig } from './doku/config';
import { DokuApiError, DokuNetworkError } from './doku/client';
import { createCheckoutPayment, getCheckoutStatus, type CheckoutLineItem } from './doku/checkout';
import { dokuNotificationSchema, readNotificationHeaders } from './doku/notification';
import { verifySignature } from './doku/signature';
import {
  decideAttemptTransition,
  decideOrderUpdateOnPaid,
  decideSubscriptionOnPaid,
  isActiveAttempt,
  mapDokuStatus,
  type AttemptStatus,
  type ProviderOutcome,
  type ReviewReason,
} from './state-machine';
import { estimateGatewayFee, generateInvoiceNumber, toRupiahInteger } from './utils';

const PROVIDER = 'DOKU';
const ACTIVE = ['CREATED', 'PENDING'] as const;
/** URL pembayaran yang tersisa < ini dianggap terlalu mepet untuk dipakai ulang. */
const REUSE_MIN_REMAINING_MS = 2 * 60_000;
/** Attempt CREATED lebih muda dari ini = request lain sedang membuat invoice. */
const CREATE_IN_PROGRESS_MS = 30_000;
/** Attempt CREATED lebih tua dari ini = proses create macet, ditutup oleh cron. */
const CREATE_STUCK_MS = 5 * 60_000;
/** Toleransi setelah expires_at sebelum PENDING dianggap EXPIRED di sisi kita. */
const EXPIRY_GRACE_MS = 30 * 60_000;
/** Batas waktu bayar tagihan langganan (menit). */
const SUBSCRIPTION_DUE_MINUTES = 60;

const CLOSED_ORDER_STATUSES = ['CANCELLED', 'CANCELED', 'FAILED', 'REJECTED', 'VOID', 'VOIDED'];

type Attempt = typeof paymentAttempts.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PaymentPurpose = 'ORDER' | 'SUBSCRIPTION';

function log(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown>) {
  const line = JSON.stringify({ scope: 'payments', event, ...data });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

function errorMessage(error: unknown): string {
  if (error instanceof DokuApiError) return `${error.message}: ${JSON.stringify(error.responseBody).slice(0, 500)}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

function revalidateOutlet(outletKey: string | null | undefined) {
  if (!outletKey) return;
  try {
    revalidatePath(`/outlet/${outletKey}`, 'layout');
    revalidatePath(`/outlet/${outletKey}/orders`, 'page');
  } catch {
    // revalidatePath tidak tersedia di luar konteks request Next (mis. skrip) — aman diabaikan.
  }
}

function loadConfigOrNull(): DokuConfig | null {
  try {
    return getDokuConfig();
  } catch (error) {
    if (error instanceof DokuConfigError) {
      log('error', 'doku_not_configured', { message: error.message });
      return null;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Create payment (generik untuk ORDER dan SUBSCRIPTION)
// ---------------------------------------------------------------------------

export type StartPaymentErrorCode =
  | 'NOT_CONFIGURED'
  | 'DISABLED'
  | 'NO_SUB_ACCOUNT'
  | 'NOT_FOUND'
  | 'ALREADY_PAID'
  | 'ORDER_CLOSED'
  | 'INVALID_AMOUNT'
  | 'IN_PROGRESS'
  | 'GATEWAY_ERROR';

export type StartPaymentResult =
  | { ok: true; paymentUrl: string; expiresAt: Date | null; reused: boolean }
  | { ok: false; code: StartPaymentErrorCode; message: string };

const START_ERROR_MESSAGES: Record<PaymentPurpose, Record<StartPaymentErrorCode, string>> = {
  ORDER: {
    NOT_CONFIGURED: 'Pembayaran online belum tersedia. Silakan bayar di kasir.',
    DISABLED: 'Toko ini belum mengaktifkan pembayaran online.',
    NO_SUB_ACCOUNT: 'Akun pembayaran toko ini belum aktif. Silakan bayar di kasir.',
    NOT_FOUND: 'Pesanan tidak ditemukan.',
    ALREADY_PAID: 'Pesanan ini sudah lunas.',
    ORDER_CLOSED: 'Pesanan ini sudah dibatalkan.',
    INVALID_AMOUNT: 'Total pesanan tidak valid untuk pembayaran online.',
    IN_PROGRESS: 'Pembayaran sedang disiapkan, coba lagi dalam beberapa detik.',
    GATEWAY_ERROR: 'Gagal membuat pembayaran. Silakan coba lagi atau bayar di kasir.',
  },
  SUBSCRIPTION: {
    NOT_CONFIGURED: 'Pembayaran langganan belum tersedia. Hubungi tim Menuin.',
    DISABLED: 'Pembayaran langganan belum tersedia. Hubungi tim Menuin.',
    NO_SUB_ACCOUNT: 'Pembayaran langganan belum tersedia. Hubungi tim Menuin.',
    NOT_FOUND: 'Tagihan tidak ditemukan.',
    ALREADY_PAID: 'Tagihan ini sudah lunas.',
    ORDER_CLOSED: 'Tagihan ini sudah dibatalkan. Silakan pilih paket lagi.',
    INVALID_AMOUNT: 'Nominal tagihan tidak valid.',
    IN_PROGRESS: 'Pembayaran sedang disiapkan, coba lagi dalam beberapa detik.',
    GATEWAY_ERROR: 'Gagal membuat pembayaran. Silakan coba lagi.',
  },
};

function startError(purpose: PaymentPurpose, code: StartPaymentErrorCode): StartPaymentResult {
  return { ok: false, code, message: START_ERROR_MESSAGES[purpose][code] };
}

type PaymentTarget =
  | { purpose: 'ORDER'; tenantId: string; transactionId: string }
  | { purpose: 'SUBSCRIPTION'; tenantId: string; subscriptionInvoiceId: string };

type LockedTarget =
  | { error: StartPaymentErrorCode }
  | {
      amount: number;
      customer: { id?: string; name?: string; phone?: string; email?: string };
      lineItems: () => Promise<CheckoutLineItem[]>;
      /** Efek samping di dalam transaksi setelah attempt dibuat. */
      afterAttemptCreated?: (tx: Tx) => Promise<void>;
    };

function targetColumn(target: PaymentTarget) {
  return target.purpose === 'ORDER'
    ? eq(paymentAttempts.transactionId, target.transactionId)
    : eq(paymentAttempts.subscriptionInvoiceId, target.subscriptionInvoiceId);
}

async function lockOrderTarget(tx: Tx, target: Extract<PaymentTarget, { purpose: 'ORDER' }>): Promise<LockedTarget> {
  const [order] = await tx
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, target.transactionId), eq(transactions.tenantId, target.tenantId)))
    .limit(1)
    .for('update');

  if (!order) return { error: 'NOT_FOUND' };
  if (order.paymentStatus === 'PAID') return { error: 'ALREADY_PAID' };
  if (CLOSED_ORDER_STATUSES.includes((order.status || '').toUpperCase())) return { error: 'ORDER_CLOSED' };

  return {
    amount: toRupiahInteger(order.grandTotal),
    customer: { id: order.id, name: order.customerName || undefined, phone: order.customerPhone || undefined },
    lineItems: () => buildOrderLineItems(order),
    afterAttemptCreated: async (inner) => {
      if (order.paymentMethod !== 'ONLINE') {
        await inner.update(transactions).set({ paymentMethod: 'ONLINE' }).where(eq(transactions.id, order.id));
      }
    },
  };
}

async function lockSubscriptionTarget(
  tx: Tx,
  target: Extract<PaymentTarget, { purpose: 'SUBSCRIPTION' }>,
  customer: { name?: string; email?: string }
): Promise<LockedTarget> {
  const [invoice] = await tx
    .select()
    .from(subscriptionInvoices)
    .where(and(eq(subscriptionInvoices.id, target.subscriptionInvoiceId), eq(subscriptionInvoices.tenantId, target.tenantId)))
    .limit(1)
    .for('update');

  if (!invoice) return { error: 'NOT_FOUND' };
  if (invoice.status === 'PAID') return { error: 'ALREADY_PAID' };
  if (invoice.status !== 'PENDING') return { error: 'ORDER_CLOSED' };

  return {
    amount: invoice.amount,
    customer: { id: invoice.tenantId, ...customer },
    lineItems: async () => [
      { id: invoice.planCode, name: `Langganan Menuin ${invoice.plan} (${invoice.periodDays} hari)`, price: invoice.amount, quantity: 1 },
    ],
  };
}

async function buildOrderLineItems(order: typeof transactions.$inferSelect): Promise<CheckoutLineItem[]> {
  const items = await db
    .select({
      productId: transactionItems.productId,
      name: products.name,
      price: transactionItems.price,
      quantity: transactionItems.quantity,
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, order.id));

  const lines: CheckoutLineItem[] = items.map((it) => ({
    id: it.productId,
    name: it.name,
    price: toRupiahInteger(it.price),
    quantity: it.quantity,
  }));
  const tax = toRupiahInteger(order.tax);
  const service = toRupiahInteger(order.serviceCharge);
  if (service > 0) lines.push({ id: 'service-charge', name: 'Biaya Layanan', price: service, quantity: 1 });
  if (tax > 0) lines.push({ id: 'tax', name: 'Pajak', price: tax, quantity: 1 });
  // Diskon tidak bisa dikirim sebagai harga negatif; bila ada diskon/pembulatan,
  // total tidak akan cocok dan createCheckoutPayment otomatis tidak mengirim line_items.
  return lines;
}

async function startPayment(
  config: DokuConfig,
  target: PaymentTarget,
  options: {
    lock: (tx: Tx) => Promise<LockedTarget>;
    subAccountId: string | null;
    dueMinutes: number;
    callbackUrl?: string;
    invoicePrefix: string;
  }
): Promise<StartPaymentResult> {
  const now = new Date();

  type Prepared =
    | { kind: 'error'; code: StartPaymentErrorCode }
    | { kind: 'reuse'; paymentUrl: string; expiresAt: Date | null }
    | { kind: 'create'; attempt: Attempt; locked: Exclude<LockedTarget, { error: StartPaymentErrorCode }> };

  const prepared: Prepared = await db.transaction(async (tx) => {
    const locked = await options.lock(tx);
    if ('error' in locked) return { kind: 'error', code: locked.error };
    if (!Number.isSafeInteger(locked.amount) || locked.amount <= 0) return { kind: 'error', code: 'INVALID_AMOUNT' };

    const [active] = await tx
      .select()
      .from(paymentAttempts)
      .where(and(targetColumn(target), inArray(paymentAttempts.status, [...ACTIVE])))
      .limit(1)
      .for('update');

    if (active) {
      const stillValid =
        active.status === 'PENDING' &&
        active.paymentUrl &&
        active.amount === locked.amount &&
        (!active.expiresAt || active.expiresAt.getTime() - now.getTime() > REUSE_MIN_REMAINING_MS);

      if (stillValid) {
        return { kind: 'reuse', paymentUrl: active.paymentUrl!, expiresAt: active.expiresAt };
      }
      if (active.status === 'CREATED' && now.getTime() - active.createdAt.getTime() < CREATE_IN_PROGRESS_MS) {
        return { kind: 'error', code: 'IN_PROGRESS' };
      }

      // Tutup attempt lama. Jika ternyata tetap dibayar, notifikasinya tetap
      // diterima dan ditandai LATE_PAYMENT untuk direview.
      const expired = active.expiresAt && active.expiresAt.getTime() <= now.getTime();
      await tx
        .update(paymentAttempts)
        .set({ status: expired ? 'EXPIRED' : 'CANCELED', updatedAt: now })
        .where(eq(paymentAttempts.id, active.id));
    }

    const [attempt] = await tx
      .insert(paymentAttempts)
      .values({
        tenantId: target.tenantId,
        purpose: target.purpose,
        transactionId: target.purpose === 'ORDER' ? target.transactionId : null,
        subscriptionInvoiceId: target.purpose === 'SUBSCRIPTION' ? target.subscriptionInvoiceId : null,
        provider: PROVIDER,
        product: 'CHECKOUT',
        environment: config.environment,
        invoiceNumber: generateInvoiceNumber(options.invoicePrefix),
        amount: locked.amount,
        status: 'CREATED',
        subAccountId: options.subAccountId,
        expiresAt: new Date(now.getTime() + options.dueMinutes * 60_000),
      })
      .returning();

    await locked.afterAttemptCreated?.(tx);
    return { kind: 'create', attempt, locked };
  });

  if (prepared.kind === 'error') return startError(target.purpose, prepared.code);
  if (prepared.kind === 'reuse') {
    return { ok: true, paymentUrl: prepared.paymentUrl, expiresAt: prepared.expiresAt, reused: true };
  }

  const { attempt, locked } = prepared;
  let lineItems: CheckoutLineItem[] = [];
  try {
    lineItems = await locked.lineItems();
  } catch (error) {
    log('warn', 'line_items_failed', { invoice: attempt.invoiceNumber, error: errorMessage(error) });
  }

  try {
    const result = await createCheckoutPayment({
      invoiceNumber: attempt.invoiceNumber,
      amount: attempt.amount,
      dueMinutes: options.dueMinutes,
      callbackUrl: options.callbackUrl,
      callbackUrlCancel: options.callbackUrl,
      lineItems,
      customer: locked.customer,
      subAccountId: options.subAccountId,
    });

    await db
      .update(paymentAttempts)
      .set({
        status: 'PENDING',
        paymentUrl: result.paymentUrl,
        providerReference: result.tokenId,
        rawCreateResponse: result.raw as object,
        updatedAt: new Date(),
      })
      .where(and(eq(paymentAttempts.id, attempt.id), eq(paymentAttempts.status, 'CREATED')));

    log('info', 'payment_created', {
      invoice: attempt.invoiceNumber,
      purpose: target.purpose,
      tenantId: attempt.tenantId,
      amount: attempt.amount,
    });
    return { ok: true, paymentUrl: result.paymentUrl, expiresAt: attempt.expiresAt, reused: false };
  } catch (error) {
    const outcomeUnknown = error instanceof DokuNetworkError;
    await db
      .update(paymentAttempts)
      .set({
        status: 'FAILED',
        lastError: `${outcomeUnknown ? '[outcome unknown] ' : ''}${errorMessage(error)}`.slice(0, 2000),
        updatedAt: new Date(),
      })
      .where(and(eq(paymentAttempts.id, attempt.id), eq(paymentAttempts.status, 'CREATED')));

    log('error', 'payment_create_failed', {
      invoice: attempt.invoiceNumber,
      purpose: target.purpose,
      tenantId: attempt.tenantId,
      outcomeUnknown,
      error: errorMessage(error),
    });
    return startError(target.purpose, 'GATEWAY_ERROR');
  }
}

/**
 * Membuat (atau memakai ulang) sesi pembayaran DOKU Checkout untuk pesanan
 * storefront. Dana diarahkan ke Sub Account outlet. Amount SELALU dari DB.
 */
export async function startOrderPayment(params: {
  tenantId: string;
  transactionId: string;
  callbackUrl?: string;
}): Promise<StartPaymentResult> {
  const config = loadConfigOrNull();
  if (!config) return startError('ORDER', 'NOT_CONFIGURED');

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, params.tenantId)).limit(1);
  if (!tenant) return startError('ORDER', 'NOT_FOUND');
  if (!tenant.onlinePaymentEnabled) return startError('ORDER', 'DISABLED');
  const subAccountId = tenant.dokuSubAccountId || null;
  if (config.requireSubAccount && !subAccountId) return startError('ORDER', 'NO_SUB_ACCOUNT');

  const target = { purpose: 'ORDER' as const, tenantId: params.tenantId, transactionId: params.transactionId };
  return startPayment(config, target, {
    lock: (tx) => lockOrderTarget(tx, target),
    subAccountId,
    dueMinutes: config.paymentDueMinutes,
    callbackUrl: params.callbackUrl,
    invoicePrefix: 'MNU',
  });
}

/**
 * Membuat (atau memakai ulang) sesi pembayaran untuk tagihan langganan Menuin.
 * Dana masuk ke akun platform Menuin (tanpa Sub Account).
 */
export async function startSubscriptionPayment(params: {
  tenantId: string;
  subscriptionInvoiceId: string;
  callbackUrl?: string;
  customer: { name?: string; email?: string };
}): Promise<StartPaymentResult> {
  const config = loadConfigOrNull();
  if (!config) return startError('SUBSCRIPTION', 'NOT_CONFIGURED');

  const target = {
    purpose: 'SUBSCRIPTION' as const,
    tenantId: params.tenantId,
    subscriptionInvoiceId: params.subscriptionInvoiceId,
  };
  return startPayment(config, target, {
    lock: (tx) => lockSubscriptionTarget(tx, target, params.customer),
    subAccountId: null,
    dueMinutes: SUBSCRIPTION_DUE_MINUTES,
    callbackUrl: params.callbackUrl,
    invoicePrefix: 'SUB',
  });
}

// ---------------------------------------------------------------------------
// Apply result (dipakai webhook, check status, dan cron)
// ---------------------------------------------------------------------------

export type ApplyResult =
  | 'APPLIED'
  | 'NO_CHANGE'
  | 'AMOUNT_MISMATCH'
  | 'ATTEMPT_NOT_FOUND';

type ApplyInput = {
  attemptId: string;
  outcome: ProviderOutcome;
  providerStatus?: string | null;
  channel?: string | null;
  /** Amount yang dilaporkan gateway; wajib dicek sebelum menandai PAID. */
  reportedAmount?: number | null;
  source: 'WEBHOOK' | 'STATUS_CHECK' | 'RECONCILE';
};

type PaidEffect = { reviewReason: ReviewReason | null };

/** Efek PAID untuk pesanan storefront. Dipanggil di dalam transaksi, target sudah di-lock. */
async function applyOrderPaid(
  tx: Tx,
  order: typeof transactions.$inferSelect,
  attempt: Attempt,
  latePayment: boolean,
  fee: { fee: number; net: number }
): Promise<PaidEffect> {
  const [tenant] = await tx
    .select({ orderProcessType: tenants.orderProcessType })
    .from(tenants)
    .where(eq(tenants.id, attempt.tenantId))
    .limit(1);

  const decision = decideOrderUpdateOnPaid(
    { status: order.status, paymentStatus: order.paymentStatus, orderProcessType: tenant?.orderProcessType ?? 'MANUAL' },
    latePayment
  );

  if (decision.update) {
    await tx
      .update(transactions)
      .set({ ...decision.update, gatewayFee: fee.fee.toString(), netAmount: fee.net.toString() })
      .where(eq(transactions.id, order.id));
  }

  await tx.insert(payments).values({
    tenantId: attempt.tenantId,
    transactionId: order.id,
    providerTransactionId: attempt.invoiceNumber,
    provider: PROVIDER,
    amount: attempt.amount.toString(),
    status: 'PAID',
  });

  return { reviewReason: decision.reviewReason };
}

/** Efek PAID untuk tagihan langganan: aktifkan/perpanjang langganan tenant. */
async function applySubscriptionPaid(
  tx: Tx,
  invoice: typeof subscriptionInvoices.$inferSelect,
  latePayment: boolean,
  now: Date
): Promise<PaidEffect> {
  const decision = decideSubscriptionOnPaid(invoice.status, latePayment);
  if (!decision.activate) return { reviewReason: decision.reviewReason };

  // Hanya boleh ada satu langganan ACTIVE per tenant (unique index), jadi lock dulu.
  const [current] = await tx
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.tenantId, invoice.tenantId), eq(subscriptions.status, 'ACTIVE')))
    .limit(1)
    .for('update');

  const period = computeSubscriptionPeriod({
    now,
    periodDays: invoice.periodDays,
    currentPeriodEnd: current?.currentPeriodEnd ?? null,
  });

  if (current) {
    await tx
      .update(subscriptions)
      .set({ status: 'EXPIRED', updatedAt: now })
      .where(eq(subscriptions.id, current.id));
  }

  const [created] = await tx
    .insert(subscriptions)
    .values({
      tenantId: invoice.tenantId,
      plan: invoice.plan,
      status: 'ACTIVE',
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    })
    .returning({ id: subscriptions.id });

  await tx
    .update(subscriptionInvoices)
    .set({
      status: 'PAID',
      paidAt: now,
      subscriptionId: created.id,
      periodStart: period.start,
      periodEnd: period.end,
      updatedAt: now,
    })
    .where(eq(subscriptionInvoices.id, invoice.id));

  await tx
    .update(tenants)
    .set({ subscriptionTier: invoice.plan as 'BASIC' | 'PRO', updatedAt: now })
    .where(eq(tenants.id, invoice.tenantId));

  return { reviewReason: decision.reviewReason };
}

export async function applyProviderOutcome(input: ApplyInput): Promise<ApplyResult> {
  const config = getDokuConfig();

  // Baca tanpa lock untuk tahu targetnya, lalu lock dengan urutan yang sama seperti
  // startPayment (target → payment_attempts) agar tidak deadlock.
  const [peek] = await db
    .select({
      purpose: paymentAttempts.purpose,
      transactionId: paymentAttempts.transactionId,
      subscriptionInvoiceId: paymentAttempts.subscriptionInvoiceId,
      tenantId: paymentAttempts.tenantId,
    })
    .from(paymentAttempts)
    .where(eq(paymentAttempts.id, input.attemptId))
    .limit(1);
  if (!peek) return 'ATTEMPT_NOT_FOUND';

  const outcome = await db.transaction(async (tx) => {
    let order: typeof transactions.$inferSelect | undefined;
    let invoice: typeof subscriptionInvoices.$inferSelect | undefined;

    if (peek.purpose === 'SUBSCRIPTION' && peek.subscriptionInvoiceId) {
      [invoice] = await tx
        .select()
        .from(subscriptionInvoices)
        .where(and(eq(subscriptionInvoices.id, peek.subscriptionInvoiceId), eq(subscriptionInvoices.tenantId, peek.tenantId)))
        .limit(1)
        .for('update');
    } else if (peek.transactionId) {
      [order] = await tx
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, peek.transactionId), eq(transactions.tenantId, peek.tenantId)))
        .limit(1)
        .for('update');
    }

    const [attempt] = await tx
      .select()
      .from(paymentAttempts)
      .where(eq(paymentAttempts.id, input.attemptId))
      .limit(1)
      .for('update');

    if (!attempt || (!order && !invoice)) return { result: 'ATTEMPT_NOT_FOUND' as const, tenantId: null };

    const now = new Date();
    const common = {
      providerStatus: input.providerStatus ?? attempt.providerStatus,
      paymentChannel: input.channel ?? attempt.paymentChannel,
      lastCheckedAt: now,
      updatedAt: now,
    };

    if (
      input.outcome === 'PAID' &&
      input.reportedAmount !== undefined &&
      input.reportedAmount !== null &&
      toRupiahInteger(input.reportedAmount) !== attempt.amount
    ) {
      await tx
        .update(paymentAttempts)
        .set({
          ...common,
          requiresReview: true,
          reviewReason: 'AMOUNT_MISMATCH',
          lastError: `Amount gateway ${input.reportedAmount} != attempt ${attempt.amount}`,
        })
        .where(eq(paymentAttempts.id, attempt.id));
      return { result: 'AMOUNT_MISMATCH' as const, tenantId: null };
    }

    const transition = decideAttemptTransition(attempt.status as AttemptStatus, input.outcome);
    if (!transition.changed) {
      await tx.update(paymentAttempts).set(common).where(eq(paymentAttempts.id, attempt.id));
      return { result: 'NO_CHANGE' as const, tenantId: null };
    }

    if (transition.next !== 'PAID') {
      await tx
        .update(paymentAttempts)
        .set({ ...common, status: transition.next })
        .where(eq(paymentAttempts.id, attempt.id));
      return { result: 'APPLIED' as const, tenantId: null };
    }

    // ---- PAID ----
    const fee = estimateGatewayFee(attempt.amount, config.estimatedMdrPercent);
    const effect = invoice
      ? await applySubscriptionPaid(tx, invoice, transition.latePayment, now)
      : await applyOrderPaid(tx, order!, attempt, transition.latePayment, fee);

    await tx
      .update(paymentAttempts)
      .set({
        ...common,
        status: 'PAID',
        paidAt: now,
        feeAmount: fee.fee,
        netAmount: fee.net,
        feeSource: 'ESTIMATED',
        requiresReview: effect.reviewReason !== null || attempt.requiresReview,
        reviewReason: effect.reviewReason ?? attempt.reviewReason,
      })
      .where(eq(paymentAttempts.id, attempt.id));

    log(effect.reviewReason ? 'warn' : 'info', 'payment_paid', {
      invoice: attempt.invoiceNumber,
      purpose: attempt.purpose,
      tenantId: attempt.tenantId,
      source: input.source,
      reviewReason: effect.reviewReason,
    });

    return { result: 'APPLIED' as const, tenantId: attempt.tenantId };
  });

  if (outcome.result === 'APPLIED' && outcome.tenantId) {
    const [t] = await db
      .select({ outletKey: tenants.outletKey })
      .from(tenants)
      .where(eq(tenants.id, outcome.tenantId))
      .limit(1);
    revalidateOutlet(t?.outletKey);
  }

  return outcome.result;
}

// ---------------------------------------------------------------------------
// Check status ke DOKU
// ---------------------------------------------------------------------------

/** Menanyakan status attempt ke DOKU lalu menerapkannya. Tidak melempar error. */
export async function syncAttemptWithGateway(attempt: Attempt, source: ApplyInput['source']): Promise<ApplyResult | 'SKIPPED'> {
  const now = Date.now();
  const pastGrace = attempt.expiresAt ? now > attempt.expiresAt.getTime() + EXPIRY_GRACE_MS : false;

  try {
    const status = await getCheckoutStatus(attempt.invoiceNumber);
    let outcome = mapDokuStatus(status.status);
    if ((outcome === null || outcome === 'PENDING') && pastGrace) outcome = 'EXPIRED';
    if (!outcome) {
      await db.update(paymentAttempts)
        .set({ providerStatus: status.status, lastCheckedAt: new Date() })
        .where(eq(paymentAttempts.id, attempt.id));
      return 'NO_CHANGE';
    }
    return await applyProviderOutcome({
      attemptId: attempt.id,
      outcome,
      providerStatus: status.status,
      channel: status.channelId ?? status.serviceId,
      reportedAmount: status.amount,
      source,
    });
  } catch (error) {
    // 404 = pelanggan belum memilih metode bayar / transaksi belum tercatat.
    if (error instanceof DokuApiError && error.status === 404) {
      if (pastGrace) {
        return applyProviderOutcome({ attemptId: attempt.id, outcome: 'EXPIRED', providerStatus: 'NOT_FOUND', source });
      }
      await db.update(paymentAttempts).set({ lastCheckedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
      return 'NO_CHANGE';
    }
    log('warn', 'status_check_failed', { invoice: attempt.invoiceNumber, error: errorMessage(error) });
    await db
      .update(paymentAttempts)
      .set({ lastCheckedAt: new Date(), lastError: errorMessage(error).slice(0, 2000) })
      .where(eq(paymentAttempts.id, attempt.id));
    return 'SKIPPED';
  }
}

async function syncPendingAttempt(where: ReturnType<typeof and>, minIntervalMs: number) {
  const [active] = await db
    .select()
    .from(paymentAttempts)
    .where(and(where, eq(paymentAttempts.status, 'PENDING')))
    .limit(1);
  if (!active) return;

  const lastChecked = active.lastCheckedAt?.getTime() ?? 0;
  if (Date.now() - lastChecked < minIntervalMs) return;
  if (!loadConfigOrNull()) return;
  await syncAttemptWithGateway(active, 'STATUS_CHECK');
}

/**
 * Sinkronisasi status pembayaran sebuah order (halaman status pelanggan, tombol
 * "Cek Status" kasir/mobile). Dibatasi agar polling tidak membanjiri API DOKU.
 */
export async function syncOrderPayment(params: {
  tenantId: string;
  transactionId: string;
  minIntervalMs?: number;
}): Promise<{ paymentStatus: string; status: string } | null> {
  await syncPendingAttempt(
    and(eq(paymentAttempts.tenantId, params.tenantId), eq(paymentAttempts.transactionId, params.transactionId)),
    params.minIntervalMs ?? 15_000
  );

  const [order] = await db
    .select({ paymentStatus: transactions.paymentStatus, status: transactions.status })
    .from(transactions)
    .where(and(eq(transactions.id, params.transactionId), eq(transactions.tenantId, params.tenantId)))
    .limit(1);
  return order ?? null;
}

/** Sinkronisasi status pembayaran tagihan langganan (halaman status checkout). */
export async function syncSubscriptionInvoicePayment(params: {
  tenantId: string;
  subscriptionInvoiceId: string;
  minIntervalMs?: number;
}) {
  await syncPendingAttempt(
    and(
      eq(paymentAttempts.tenantId, params.tenantId),
      eq(paymentAttempts.subscriptionInvoiceId, params.subscriptionInvoiceId)
    ),
    params.minIntervalMs ?? 15_000
  );

  const [invoice] = await db
    .select()
    .from(subscriptionInvoices)
    .where(and(eq(subscriptionInvoices.id, params.subscriptionInvoiceId), eq(subscriptionInvoices.tenantId, params.tenantId)))
    .limit(1);
  return invoice ?? null;
}

/** Menutup attempt aktif (mis. pelanggan beralih ke bayar di kasir). */
export async function cancelActivePayments(params: { tenantId: string; transactionId: string }): Promise<void> {
  await db
    .update(paymentAttempts)
    .set({ status: 'CANCELED', updatedAt: new Date() })
    .where(
      and(
        eq(paymentAttempts.tenantId, params.tenantId),
        eq(paymentAttempts.transactionId, params.transactionId),
        inArray(paymentAttempts.status, [...ACTIVE])
      )
    );
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export type WebhookResponse = { status: number; body: Record<string, unknown> };

const SAFE_HEADER_NAMES = ['client-id', 'request-id', 'request-timestamp', 'user-agent', 'content-type', 'x-forwarded-for'];

export async function handleDokuNotification(rawBody: string, headers: Headers): Promise<WebhookResponse> {
  let config;
  try {
    config = getDokuConfig();
  } catch (error) {
    log('error', 'webhook_not_configured', { error: errorMessage(error) });
    // 5xx agar DOKU mengirim ulang setelah konfigurasi diperbaiki.
    return { status: 503, body: { error: 'Not configured' } };
  }

  const h = readNotificationHeaders(headers);
  if (!h) return { status: 400, body: { error: 'Missing signature headers' } };

  const signatureValid =
    h.clientId === config.clientId &&
    verifySignature(
      {
        clientId: h.clientId,
        requestId: h.requestId,
        requestTimestamp: h.requestTimestamp,
        requestTarget: config.notificationPath,
        body: rawBody,
      },
      h.signature,
      config.secretKey
    );

  const safeHeaders = Object.fromEntries(
    SAFE_HEADER_NAMES.map((name) => [name, headers.get(name)]).filter(([, v]) => v !== null)
  );

  if (!signatureValid) {
    // Tidak disimpan ke DB agar endpoint tidak bisa dipakai untuk membanjiri tabel.
    log('warn', 'webhook_invalid_signature', { requestId: h.requestId, clientIdMatches: h.clientId === config.clientId });
    return { status: 401, body: { error: 'Invalid signature' } };
  }

  // Dedupe berdasarkan Request-Id. Event yang sudah selesai diproses → langsung 200.
  const [inserted] = await db
    .insert(paymentWebhookEvents)
    .values({ provider: PROVIDER, requestId: h.requestId, signatureValid: true, headers: safeHeaders, rawBody })
    .onConflictDoNothing()
    .returning({ id: paymentWebhookEvents.id });

  let eventId = inserted?.id;
  if (!eventId) {
    const [existing] = await db
      .select({ id: paymentWebhookEvents.id, processedAt: paymentWebhookEvents.processedAt })
      .from(paymentWebhookEvents)
      .where(and(eq(paymentWebhookEvents.provider, PROVIDER), eq(paymentWebhookEvents.requestId, h.requestId)))
      .limit(1);
    if (existing?.processedAt) return { status: 200, body: { success: true, duplicate: true } };
    eventId = existing?.id;
  }

  const finish = async (result: string, error?: string) => {
    if (!eventId) return;
    await db
      .update(paymentWebhookEvents)
      .set({ processedAt: new Date(), result, error: error ?? null })
      .where(eq(paymentWebhookEvents.id, eventId));
  };

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    await finish('INVALID_JSON');
    return { status: 400, body: { error: 'Invalid JSON' } };
  }

  const parsed = dokuNotificationSchema.safeParse(json);
  if (!parsed.success) {
    await finish('INVALID_PAYLOAD', parsed.error.message.slice(0, 1000));
    return { status: 400, body: { error: 'Invalid payload' } };
  }

  const n = parsed.data;
  const invoiceNumber = n.order.invoice_number;
  if (eventId) {
    await db.update(paymentWebhookEvents).set({ invoiceNumber }).where(eq(paymentWebhookEvents.id, eventId));
  }

  const [attempt] = await db
    .select()
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.provider, PROVIDER), eq(paymentAttempts.invoiceNumber, invoiceNumber)))
    .limit(1);

  if (!attempt) {
    // Bukan invoice kita (atau dari environment lain). 200 agar DOKU tidak retry terus.
    log('warn', 'webhook_unknown_invoice', { invoice: invoiceNumber });
    await finish('UNKNOWN_INVOICE');
    return { status: 200, body: { success: true } };
  }

  const reportedSubAccount = n.additional_info?.account?.id;
  if (attempt.subAccountId && reportedSubAccount && reportedSubAccount !== attempt.subAccountId) {
    log('error', 'webhook_sub_account_mismatch', { invoice: invoiceNumber });
    await db
      .update(paymentAttempts)
      .set({ requiresReview: true, reviewReason: 'SUB_ACCOUNT_MISMATCH', updatedAt: new Date() })
      .where(eq(paymentAttempts.id, attempt.id));
    await finish('SUB_ACCOUNT_MISMATCH');
    return { status: 200, body: { success: true } };
  }

  const outcome = mapDokuStatus(n.transaction.status);
  if (!outcome) {
    await finish(`IGNORED_STATUS:${n.transaction.status}`);
    return { status: 200, body: { success: true } };
  }

  try {
    const result = await applyProviderOutcome({
      attemptId: attempt.id,
      outcome,
      providerStatus: n.transaction.status,
      channel: n.channel?.id ?? n.service?.id ?? null,
      reportedAmount: n.order.amount,
      source: 'WEBHOOK',
    });
    await finish(result);
    return { status: 200, body: { success: true } };
  } catch (error) {
    // Error tak terduga (mis. DB down): jangan tandai processed, balas 5xx agar DOKU retry.
    log('error', 'webhook_processing_failed', { invoice: invoiceNumber, error: errorMessage(error) });
    if (eventId) {
      await db
        .update(paymentWebhookEvents)
        .set({ error: errorMessage(error).slice(0, 2000) })
        .where(eq(paymentWebhookEvents.id, eventId))
        .catch(() => undefined);
    }
    return { status: 500, body: { error: 'Processing failed' } };
  }
}

// ---------------------------------------------------------------------------
// Rekonsiliasi (cron)
// ---------------------------------------------------------------------------

export async function reconcilePendingPayments(options: { limit?: number } = {}) {
  getDokuConfig();
  const limit = options.limit ?? 50;
  const now = Date.now();

  // 1. Attempt CREATED yang macet (proses create terputus sebelum dapat URL).
  const stuck = await db
    .update(paymentAttempts)
    .set({ status: 'FAILED', lastError: 'Create timed out (stuck in CREATED)', updatedAt: new Date() })
    .where(and(eq(paymentAttempts.status, 'CREATED'), lt(paymentAttempts.createdAt, new Date(now - CREATE_STUCK_MS))))
    .returning({ id: paymentAttempts.id });

  // 2. Attempt PENDING: tanya status ke DOKU, yang paling lama belum dicek duluan.
  const pending = await db
    .select()
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.status, 'PENDING'),
        lt(paymentAttempts.createdAt, new Date(now - 60_000)),
        or(isNull(paymentAttempts.lastCheckedAt), lt(paymentAttempts.lastCheckedAt, new Date(now - 2 * 60_000)))
      )
    )
    .orderBy(sql`${paymentAttempts.lastCheckedAt} asc nulls first`, asc(paymentAttempts.createdAt))
    .limit(limit);

  const summary: Record<string, number> = { stuckClosed: stuck.length, checked: 0 };
  for (const attempt of pending) {
    if (!isActiveAttempt(attempt.status)) continue;
    const result = await syncAttemptWithGateway(attempt, 'RECONCILE');
    summary.checked += 1;
    summary[result] = (summary[result] ?? 0) + 1;
  }

  log('info', 'reconcile_done', summary);
  return summary;
}

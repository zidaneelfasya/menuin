import { z } from 'zod';
import { dokuRequest } from './client';

/**
 * DOKU Checkout (hosted payment page, Non-SNAP).
 *   POST /checkout/v1/payment               → buat sesi pembayaran, dapat payment.url
 *   GET  /orders/v1/status/{invoice_number} → cek status transaksi
 */

export const CHECKOUT_PATH = '/checkout/v1/payment';

export type CheckoutLineItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
};

export type CreateCheckoutInput = {
  invoiceNumber: string;
  amount: number;
  dueMinutes: number;
  callbackUrl?: string;
  callbackUrlCancel?: string;
  lineItems?: CheckoutLineItem[];
  customer?: { id?: string; name?: string; phone?: string; email?: string };
  subAccountId?: string | null;
};

const createCheckoutResponseSchema = z.object({
  response: z.object({
    payment: z.object({
      url: z.string().url(),
      token_id: z.string().optional(),
      expired_date: z.string().optional(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export type CreateCheckoutResult = {
  paymentUrl: string;
  tokenId: string | null;
  raw: unknown;
  requestId: string;
};

function assertIntegerRupiah(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} harus bilangan bulat rupiah >= 0 (diterima: ${value})`);
  }
}

/** Nama item dibatasi & dibersihkan agar tidak ditolak validasi DOKU. */
function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N} .,'&()\-/+]/gu, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || 'Item').slice(0, 255);
}

export async function createCheckoutPayment(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  assertIntegerRupiah(input.amount, 'amount');
  if (input.amount <= 0) throw new Error('amount harus lebih dari 0');

  const order: Record<string, unknown> = {
    amount: input.amount,
    invoice_number: input.invoiceNumber,
    currency: 'IDR',
    language: 'ID',
    auto_redirect: true,
  };
  if (input.callbackUrl) order.callback_url = input.callbackUrl;
  if (input.callbackUrlCancel) order.callback_url_cancel = input.callbackUrlCancel;

  // DOKU menolak request jika total line_items != amount, jadi line_items hanya
  // dikirim bila jumlahnya persis sama.
  if (input.lineItems?.length) {
    input.lineItems.forEach((li) => assertIntegerRupiah(li.price, 'line_items.price'));
    const sum = input.lineItems.reduce((acc, li) => acc + li.price * li.quantity, 0);
    if (sum === input.amount) {
      order.line_items = input.lineItems.map((li) => ({
        ...(li.id ? { id: li.id.slice(0, 64) } : {}),
        name: sanitizeName(li.name),
        price: li.price,
        quantity: li.quantity,
      }));
    }
  }

  const body: Record<string, unknown> = {
    order,
    payment: { payment_due_date: input.dueMinutes },
  };

  if (input.customer) {
    const customer: Record<string, string> = {};
    if (input.customer.id) customer.id = input.customer.id.slice(0, 50);
    if (input.customer.name) customer.name = sanitizeName(input.customer.name).slice(0, 255);
    if (input.customer.email) customer.email = input.customer.email.slice(0, 128);
    const phone = input.customer.phone?.replace(/[^\d]/g, '');
    if (phone && phone.length >= 8 && phone.length <= 16) customer.phone = phone;
    if (Object.keys(customer).length) body.customer = customer;
  }

  if (input.subAccountId) {
    body.additional_info = { account: { id: input.subAccountId } };
  }

  const res = await dokuRequest<unknown>({ method: 'POST', path: CHECKOUT_PATH, body });
  const parsed = createCheckoutResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error('Respons DOKU Checkout tidak memuat payment.url');
  }

  return {
    paymentUrl: parsed.data.response.payment.url,
    tokenId: parsed.data.response.payment.token_id ?? null,
    raw: res.data,
    requestId: res.requestId,
  };
}

const statusResponseSchema = z.object({
  order: z.object({
    invoice_number: z.string(),
    amount: z.coerce.number(),
  }).passthrough(),
  transaction: z.object({
    status: z.string(),
    date: z.string().optional(),
  }).passthrough(),
  service: z.object({ id: z.string() }).passthrough().optional(),
  channel: z.object({ id: z.string() }).passthrough().optional(),
}).passthrough();

export type DokuOrderStatus = {
  invoiceNumber: string;
  amount: number;
  status: string;
  serviceId: string | null;
  channelId: string | null;
  raw: unknown;
};

export async function getCheckoutStatus(invoiceNumber: string): Promise<DokuOrderStatus> {
  const res = await dokuRequest<unknown>({
    method: 'GET',
    path: `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`,
  });
  const parsed = statusResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error('Format respons Check Status DOKU tidak dikenali');
  }
  return {
    invoiceNumber: parsed.data.order.invoice_number,
    amount: parsed.data.order.amount,
    status: parsed.data.transaction.status,
    serviceId: parsed.data.service?.id ?? null,
    channelId: parsed.data.channel?.id ?? null,
    raw: res.data,
  };
}

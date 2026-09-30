import { beforeEach, describe, expect, it, vi } from 'vitest';

const dokuRequest = vi.fn();
vi.mock('./client', () => ({ dokuRequest: (...args: unknown[]) => dokuRequest(...args) }));

import { createCheckoutPayment, getCheckoutStatus } from './checkout';

const okResponse = {
  status: 200,
  requestId: 'req-1',
  data: { message: ['SUCCESS'], response: { payment: { url: 'https://sandbox.doku.com/checkout-link-v2/abc', token_id: 'tok' } } },
};

describe('createCheckoutPayment', () => {
  beforeEach(() => {
    dokuRequest.mockReset();
    dokuRequest.mockResolvedValue(okResponse);
  });

  it('sends integer amount, invoice, due date and sub account', async () => {
    const res = await createCheckoutPayment({
      invoiceNumber: 'MNU-1',
      amount: 55500,
      dueMinutes: 15,
      callbackUrl: 'https://app.menuin.id/store/kopi/status?order=A1',
      subAccountId: 'SAC-1234',
    });

    expect(res).toMatchObject({ paymentUrl: okResponse.data.response.payment.url, tokenId: 'tok' });
    const call = dokuRequest.mock.calls[0][0];
    expect(call).toMatchObject({ method: 'POST', path: '/checkout/v1/payment' });
    expect(call.body.order).toMatchObject({ amount: 55500, invoice_number: 'MNU-1', currency: 'IDR' });
    expect(call.body.payment).toEqual({ payment_due_date: 15 });
    expect(call.body.additional_info).toEqual({ account: { id: 'SAC-1234' } });
  });

  it('includes line items only when they sum exactly to the amount', async () => {
    await createCheckoutPayment({
      invoiceNumber: 'MNU-2',
      amount: 30000,
      dueMinutes: 15,
      lineItems: [
        { name: 'Kopi Susu', price: 10000, quantity: 2 },
        { name: 'Pajak', price: 10000, quantity: 1 },
      ],
    });
    expect(dokuRequest.mock.calls[0][0].body.order.line_items).toHaveLength(2);

    await createCheckoutPayment({
      invoiceNumber: 'MNU-3',
      amount: 25000, // ada diskon → total item tidak cocok
      dueMinutes: 15,
      lineItems: [{ name: 'Kopi Susu', price: 10000, quantity: 3 }],
    });
    expect(dokuRequest.mock.calls[1][0].body.order.line_items).toBeUndefined();
  });

  it('omits additional_info when there is no sub account', async () => {
    await createCheckoutPayment({ invoiceNumber: 'MNU-4', amount: 1000, dueMinutes: 15 });
    expect(dokuRequest.mock.calls[0][0].body.additional_info).toBeUndefined();
  });

  it.each([0, -100, 100.5])('rejects invalid amount %s before calling DOKU', async (amount) => {
    await expect(createCheckoutPayment({ invoiceNumber: 'X', amount, dueMinutes: 15 })).rejects.toThrow();
    expect(dokuRequest).not.toHaveBeenCalled();
  });

  it('fails loudly when DOKU does not return a payment url', async () => {
    dokuRequest.mockResolvedValue({ status: 200, requestId: 'r', data: { response: { payment: {} } } });
    await expect(createCheckoutPayment({ invoiceNumber: 'X', amount: 1000, dueMinutes: 15 })).rejects.toThrow(/payment\.url/);
  });

  it('only sends a plausible phone number', async () => {
    await createCheckoutPayment({ invoiceNumber: 'X', amount: 1000, dueMinutes: 15, customer: { name: 'Budi', phone: '0812-3456-7890' } });
    expect(dokuRequest.mock.calls[0][0].body.customer).toEqual({ name: 'Budi', phone: '081234567890' });

    await createCheckoutPayment({ invoiceNumber: 'Y', amount: 1000, dueMinutes: 15, customer: { phone: '123' } });
    expect(dokuRequest.mock.calls[1][0].body.customer).toBeUndefined();
  });
});

describe('getCheckoutStatus', () => {
  it('parses the status response and url-encodes the invoice', async () => {
    dokuRequest.mockReset();
    dokuRequest.mockResolvedValue({
      status: 200,
      requestId: 'r',
      data: {
        order: { invoice_number: 'MNU-1', amount: '55500' },
        transaction: { status: 'SUCCESS' },
        service: { id: 'QRIS' },
        channel: { id: 'QRIS' },
      },
    });
    const res = await getCheckoutStatus('MNU-1');
    expect(dokuRequest.mock.calls[0][0]).toEqual({ method: 'GET', path: '/orders/v1/status/MNU-1' });
    expect(res).toMatchObject({ invoiceNumber: 'MNU-1', amount: 55500, status: 'SUCCESS', channelId: 'QRIS' });
  });
});

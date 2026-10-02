import { describe, expect, it } from 'vitest';
import {
  decideAttemptTransition,
  decideOrderUpdateOnPaid,
  decideSubscriptionOnPaid,
  isActiveAttempt,
  mapDokuStatus,
  type AttemptStatus,
} from './state-machine';

describe('mapDokuStatus', () => {
  it.each([
    ['SUCCESS', 'PAID'],
    ['success', 'PAID'],
    ['PENDING', 'PENDING'],
    ['FAILED', 'FAILED'],
    ['EXPIRED', 'EXPIRED'],
    ['TIMEOUT', null],
    ['REDIRECT', null],
    ['', null],
    [undefined, null],
  ])('%s → %s', (input, expected) => {
    expect(mapDokuStatus(input as string | undefined)).toBe(expected);
  });
});

describe('decideAttemptTransition', () => {
  it('PAID is final whatever arrives later', () => {
    for (const outcome of ['PAID', 'PENDING', 'FAILED', 'EXPIRED'] as const) {
      expect(decideAttemptTransition('PAID', outcome)).toEqual({ next: 'PAID', changed: false, latePayment: false });
    }
  });

  it('active attempts move to PAID without a late flag', () => {
    expect(decideAttemptTransition('PENDING', 'PAID')).toEqual({ next: 'PAID', changed: true, latePayment: false });
    expect(decideAttemptTransition('CREATED', 'PAID')).toEqual({ next: 'PAID', changed: true, latePayment: false });
  });

  it.each(['FAILED', 'EXPIRED', 'CANCELED'] as AttemptStatus[])(
    'money received after %s is still recorded, flagged as late',
    (current) => {
      expect(decideAttemptTransition(current, 'PAID')).toEqual({ next: 'PAID', changed: true, latePayment: true });
    }
  );

  it('failure/expiry only closes active attempts', () => {
    expect(decideAttemptTransition('PENDING', 'EXPIRED').next).toBe('EXPIRED');
    expect(decideAttemptTransition('PENDING', 'FAILED').next).toBe('FAILED');
    expect(decideAttemptTransition('CANCELED', 'EXPIRED').changed).toBe(false);
    expect(decideAttemptTransition('EXPIRED', 'FAILED').changed).toBe(false);
  });

  it('PENDING never moves a closed attempt backwards', () => {
    expect(decideAttemptTransition('CREATED', 'PENDING')).toEqual({ next: 'PENDING', changed: true, latePayment: false });
    expect(decideAttemptTransition('PENDING', 'PENDING').changed).toBe(false);
    expect(decideAttemptTransition('EXPIRED', 'PENDING').changed).toBe(false);
  });

  it('isActiveAttempt', () => {
    expect(isActiveAttempt('CREATED')).toBe(true);
    expect(isActiveAttempt('PENDING')).toBe(true);
    expect(isActiveAttempt('PAID')).toBe(false);
    expect(isActiveAttempt('CANCELED')).toBe(false);
  });
});

describe('decideOrderUpdateOnPaid', () => {
  const pending = { status: 'PENDING', paymentStatus: 'PENDING', orderProcessType: 'MANUAL' };

  it('sends a pending order to the kitchen queue (MANUAL)', () => {
    expect(decideOrderUpdateOnPaid(pending, false)).toEqual({
      update: { paymentStatus: 'PAID', status: 'NEW', paymentMethod: 'ONLINE' },
      reviewReason: null,
    });
  });

  it('completes the order directly for AUTO process type', () => {
    expect(decideOrderUpdateOnPaid({ ...pending, orderProcessType: 'AUTO' }, false).update?.status).toBe('COMPLETED');
  });

  it('does not override a status the staff already advanced', () => {
    expect(decideOrderUpdateOnPaid({ ...pending, status: 'PROCESSING' }, false).update?.status).toBe('PROCESSING');
  });

  it('flags double payment when the order was already paid another way', () => {
    expect(decideOrderUpdateOnPaid({ ...pending, paymentStatus: 'PAID' }, false)).toEqual({
      update: null,
      reviewReason: 'ALREADY_PAID_OTHER_METHOD',
    });
  });

  it('records payment on a cancelled order but keeps it cancelled and flags it', () => {
    expect(decideOrderUpdateOnPaid({ ...pending, status: 'CANCELLED' }, false)).toEqual({
      update: { paymentStatus: 'PAID', status: 'CANCELLED', paymentMethod: 'ONLINE' },
      reviewReason: 'ORDER_CLOSED_BEFORE_PAYMENT',
    });
  });

  it('sends a POS QRIS order straight to the kitchen and keeps the QRIS method', () => {
    expect(decideOrderUpdateOnPaid({ ...pending, source: 'POS' }, false, 'QRIS_DYNAMIC')).toEqual({
      update: { paymentStatus: 'PAID', status: 'PROCESSING', paymentMethod: 'QRIS_DYNAMIC' },
      reviewReason: null,
    });
  });

  it('switches a customer who chose cash back to ONLINE and flags a late payment', () => {
    const result = decideOrderUpdateOnPaid(pending, true);
    expect(result.update?.paymentMethod).toBe('ONLINE');
    expect(result.reviewReason).toBe('LATE_PAYMENT');
  });
});

describe('decideSubscriptionOnPaid', () => {
  it('activates a pending invoice', () => {
    expect(decideSubscriptionOnPaid('PENDING', false)).toEqual({ activate: true, reviewReason: null });
  });

  it('activates but flags a payment that arrived after the attempt closed', () => {
    expect(decideSubscriptionOnPaid('PENDING', true)).toEqual({ activate: true, reviewReason: 'LATE_PAYMENT' });
  });

  it('still activates a cancelled invoice that was paid anyway, flagged for review', () => {
    expect(decideSubscriptionOnPaid('CANCELED', false)).toEqual({ activate: true, reviewReason: 'LATE_PAYMENT' });
  });

  it('never activates twice for an invoice that is already paid', () => {
    expect(decideSubscriptionOnPaid('PAID', false)).toEqual({ activate: false, reviewReason: 'ALREADY_PAID_OTHER_METHOD' });
  });
});

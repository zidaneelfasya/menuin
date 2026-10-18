import { describe, expect, it } from 'vitest';
import { BILLING_PLANS, computeSubscriptionPeriod, getBillingPlan } from './plans';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-02T08:00:00Z');

describe('getBillingPlan', () => {
  it('returns server-side plans by code', () => {
    expect(getBillingPlan('starter')).toBe(BILLING_PLANS.starter);
    expect(getBillingPlan('business')?.plan).toBe('PRO');
    expect(getBillingPlan('kasir_monthly')?.amount).toBe(49_900);
    expect(getBillingPlan('kasir_annual')?.amount).toBe(499_000);
    expect(getBillingPlan('kasir_annual')?.periodDays).toBe(365);
    expect(getBillingPlan('kasir_plus_monthly')?.amount).toBe(74_900);
    expect(getBillingPlan('lengkap_monthly')?.amount).toBe(149_000);
    expect(getBillingPlan('lengkap_annual')?.amount).toBe(1_490_000);
  });

  it('resolves aliases from landing page', () => {
    expect(getBillingPlan('kasir')).toBe(BILLING_PLANS.kasir_monthly);
    expect(getBillingPlan('kasir-plus')).toBe(BILLING_PLANS.kasir_plus_monthly);
    expect(getBillingPlan('lengkap')).toBe(BILLING_PLANS.lengkap_monthly);
  });

  it.each([null, undefined, '', 'enterprise', 'STARTER', '__proto__'])('rejects unknown code %s', (code) => {
    expect(getBillingPlan(code as string)).toBeNull();
  });

  it('every plan has an integer positive price and duration', () => {
    for (const plan of Object.values(BILLING_PLANS)) {
      expect(Number.isSafeInteger(plan.amount) && plan.amount > 0).toBe(true);
      expect(Number.isSafeInteger(plan.periodDays) && plan.periodDays > 0).toBe(true);
    }
  });
});

describe('computeSubscriptionPeriod', () => {
  it('starts now for a first subscription', () => {
    expect(computeSubscriptionPeriod({ now, periodDays: 30, currentPeriodEnd: null })).toEqual({
      start: now,
      end: new Date(now.getTime() + 30 * DAY),
    });
  });

  it('carries over remaining days of an active subscription', () => {
    const currentPeriodEnd = new Date(now.getTime() + 10 * DAY);
    expect(computeSubscriptionPeriod({ now, periodDays: 30, currentPeriodEnd }).end).toEqual(
      new Date(now.getTime() + 40 * DAY)
    );
  });

  it('does not subtract days when the previous period already ended', () => {
    const currentPeriodEnd = new Date(now.getTime() - 5 * DAY);
    expect(computeSubscriptionPeriod({ now, periodDays: 30, currentPeriodEnd }).end).toEqual(
      new Date(now.getTime() + 30 * DAY)
    );
  });
});

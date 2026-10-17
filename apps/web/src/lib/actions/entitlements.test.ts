import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {} }));

import { getEntitlements } from './auth-context';

const now = new Date('2026-10-02T08:00:00Z');
const day = 24 * 60 * 60 * 1000;

describe('getEntitlements', () => {
  it('locks when there is no subscription', () => {
    expect(getEntitlements(null, now)).toEqual({ features: [], isLocked: true });
  });

  it('unlocks an active subscription within its period', () => {
    const sub = { status: 'ACTIVE', plan: 'PRO', currentPeriodEnd: new Date(now.getTime() + day) };
    expect(getEntitlements(sub, now)).toMatchObject({ isLocked: false });
    expect(getEntitlements(sub, now).features).toContain('REPORTS');
  });

  it('locks an ACTIVE subscription whose period has ended', () => {
    const sub = { status: 'ACTIVE', plan: 'PRO', currentPeriodEnd: new Date(now.getTime() - 1000) };
    expect(getEntitlements(sub, now)).toEqual({ features: [], isLocked: true });
  });

  it('treats a missing period end as no expiry (admin grant)', () => {
    expect(getEntitlements({ status: 'ACTIVE', plan: 'BASIC', currentPeriodEnd: null }, now)).toMatchObject({
      isLocked: false,
      features: ['POS', 'CATALOG', 'INVENTORY'],
    });
  });

  it('accepts ISO strings for the period end', () => {
    const sub = { status: 'ACTIVE', plan: 'BASIC', currentPeriodEnd: new Date(now.getTime() - day).toISOString() };
    expect(getEntitlements(sub, now).isLocked).toBe(true);
  });
});

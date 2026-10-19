import { afterEach, describe, expect, it, vi } from 'vitest';

const KEYS = ['DOKU_ENV', 'DOKU_CLIENT_ID', 'DOKU_SECRET_KEY', 'DOKU_REQUIRE_SUB_ACCOUNT'];

async function load(env: Record<string, string>) {
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, env);
  vi.resetModules();
  return import('./availability');
}

const tenant = (dokuSubAccountId: string | null, dokuSubAccountStatus: string | null) => ({
  onlinePaymentEnabled: true,
  dokuSubAccountId,
  dokuSubAccountStatus,
});

describe('isOnlinePaymentAvailable', () => {
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it('requires an ACTIVE Sub Account when sub accounts are mandatory', async () => {
    const { isOnlinePaymentAvailable } = await load({
      DOKU_CLIENT_ID: 'BRN-1',
      DOKU_SECRET_KEY: 'SK-1',
      DOKU_REQUIRE_SUB_ACCOUNT: 'true',
    });
    expect(isOnlinePaymentAvailable(tenant('SAC-1', 'ACTIVE'))).toBe(true);
    expect(isOnlinePaymentAvailable(tenant('SAC-1', 'PENDING_REVIEW'))).toBe(false);
    expect(isOnlinePaymentAvailable(tenant('SAC-1', 'SUSPENDED'))).toBe(false);
    expect(isOnlinePaymentAvailable(tenant(null, null))).toBe(false);
  });

  it('does not need a Sub Account when it is optional (sandbox default)', async () => {
    const { isOnlinePaymentAvailable } = await load({ DOKU_CLIENT_ID: 'BRN-1', DOKU_SECRET_KEY: 'SK-1' });
    expect(isOnlinePaymentAvailable(tenant(null, null))).toBe(true);
    expect(isOnlinePaymentAvailable({ ...tenant(null, null), onlinePaymentEnabled: false })).toBe(false);
  });
});

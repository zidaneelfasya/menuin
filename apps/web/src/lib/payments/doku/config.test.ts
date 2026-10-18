import { afterEach, describe, expect, it, vi } from 'vitest';

const KEYS = ['DOKU_ENV', 'DOKU_CLIENT_ID', 'DOKU_SECRET_KEY', 'DOKU_REQUIRE_SUB_ACCOUNT'];

async function load(env: Record<string, string>) {
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, env);
  vi.resetModules();
  return import('./config');
}

describe('getDokuConfig', () => {
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it('defaults to sandbox and does not require sub accounts there', async () => {
    const { getDokuConfig } = await load({ DOKU_CLIENT_ID: 'BRN-1', DOKU_SECRET_KEY: 'SK-1' });
    expect(getDokuConfig()).toMatchObject({
      environment: 'sandbox',
      baseUrl: 'https://api-sandbox.doku.com',
      requireSubAccount: false,
      notificationPath: '/api/webhook/doku',
      paymentDueMinutes: 15,
    });
  });

  it('requires sub accounts in production by default', async () => {
    const { getDokuConfig } = await load({ DOKU_ENV: 'production', DOKU_CLIENT_ID: 'BRN-1', DOKU_SECRET_KEY: 'SK-1' });
    expect(getDokuConfig()).toMatchObject({ baseUrl: 'https://api.doku.com', requireSubAccount: true });
  });

  it('throws without credentials instead of silently falling back', async () => {
    const { getDokuConfig, isDokuConfigured, DokuConfigError } = await load({ DOKU_ENV: 'production' });
    expect(() => getDokuConfig()).toThrow(DokuConfigError);
    expect(isDokuConfigured()).toBe(false);
  });

  it('rejects unknown environments', async () => {
    const { getDokuConfig } = await load({ DOKU_ENV: 'live', DOKU_CLIENT_ID: 'BRN-1', DOKU_SECRET_KEY: 'SK-1' });
    expect(() => getDokuConfig()).toThrow();
  });
});

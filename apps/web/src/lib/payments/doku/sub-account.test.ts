import crypto from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const merchant = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const doku = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const ENV = {
  DOKU_ENV: 'sandbox',
  DOKU_CLIENT_ID: 'BRN-TEST-1',
  DOKU_SECRET_KEY: 'SK-snap',
  DOKU_PRIVATE_KEY: merchant.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  DOKU_PUBLIC_KEY: doku.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
};

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
let registerResponse: { status: number; body: unknown };

beforeAll(() => {
  Object.assign(process.env, ENV);
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = url.endsWith('/authorization/v1/access-token/b2b')
      ? { status: 200, body: { responseCode: '2007300', accessToken: 'tok-1', expiresIn: 900 } }
      : registerResponse;
    return new Response(JSON.stringify(body), { status });
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  for (const k of Object.keys(ENV)) delete process.env[k];
});

async function load() {
  vi.resetModules();
  return import('./sub-account');
}

describe('createSubAccount (V2)', () => {
  beforeEach(() => {
    calls.length = 0;
    registerResponse = { status: 200, body: { responseCode: '2000000', responseMessage: 'Successful', profileId: 'SAC-1234-1' } };
  });

  it('registers under the platform profile and returns the profileId', async () => {
    const { createSubAccount } = await load();
    const res = await createSubAccount({ name: '  Kopi Jotos ', email: 'Owner@Example.com' });
    expect(res).toMatchObject({ accountId: 'SAC-1234-1', status: null });

    const registerCall = calls[1];
    expect(registerCall.url).toBe('https://api-sandbox.doku.com/sub-account/v2.0/register');
    expect(JSON.parse(registerCall.init.body as string)).toEqual({
      partnerReferenceNo: expect.stringMatching(/^\d+$/),
      type: 'DEFAULT',
      email: 'owner@example.com',
      name: 'Kopi Jotos',
      parentProfileId: 'BRN-TEST-1',
    });
  });

  it('throws DokuApiError with the DOKU body when registration is rejected', async () => {
    registerResponse = { status: 409, body: { responseCode: '4090000', responseMessage: 'Email already registered' } };
    const { createSubAccount } = await load();
    await expect(createSubAccount({ name: 'X', email: 'a@b.c' })).rejects.toMatchObject({
      name: 'DokuApiError',
      status: 409,
      responseBody: { responseMessage: 'Email already registered' },
    });
  });

  it('rejects a success response without profileId', async () => {
    registerResponse = { status: 200, body: { responseCode: '2000000' } };
    const { createSubAccount } = await load();
    await expect(createSubAccount({ name: 'X', email: 'a@b.c' })).rejects.toThrow(/profileId/);
  });
});

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
let responder: (call: Call) => { status: number; body: unknown };

beforeAll(() => {
  Object.assign(process.env, ENV);
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const call = { url, init };
    calls.push(call);
    const { status, body } = responder(call);
    return new Response(JSON.stringify(body), { status });
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  for (const k of Object.keys(ENV)) delete process.env[k];
});

async function load() {
  vi.resetModules();
  const client = await import('./client');
  const qris = await import('./qris');
  const sig = await import('./signature');
  return { ...client, ...qris, ...sig };
}

const header = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name];

describe('SNAP client', () => {
  beforeEach(() => {
    calls.length = 0;
    responder = ({ url }) =>
      url.endsWith('/authorization/v1/access-token/b2b')
        ? { status: 200, body: { responseCode: '2007300', accessToken: 'tok-1', expiresIn: 900 } }
        : { status: 200, body: { responseCode: '2004700', qrContent: '00020101021226...6304ABCD', referenceNo: 'REF-1' } };
  });

  it('requests a B2B token with a valid asymmetric signature, then signs the QRIS call symmetrically', async () => {
    const { generateQris, verifyAsymmetric, signSymmetric } = await load();
    const res = await generateQris({
      partnerReferenceNo: 'QRS-1',
      amount: 55500,
      merchantId: 'M-1',
      terminalId: 'T-1',
      validityPeriod: '2026-10-02T15:14:05+07:00',
    });
    expect(res).toMatchObject({ qrContent: expect.stringMatching(/^0002/), referenceNo: 'REF-1' });

    const [tokenCall, qrCall] = calls;
    expect(tokenCall.url).toBe('https://api-sandbox.doku.com/authorization/v1/access-token/b2b');
    expect(header(tokenCall, 'X-CLIENT-KEY')).toBe('BRN-TEST-1');
    expect(JSON.parse(tokenCall.init.body as string)).toEqual({ grantType: 'client_credentials' });
    expect(verifyAsymmetric(merchant.publicKey, 'BRN-TEST-1', header(tokenCall, 'X-TIMESTAMP'), header(tokenCall, 'X-SIGNATURE'))).toBe(true);

    expect(qrCall.url).toBe('https://api-sandbox.doku.com/snap-adapter/b2b/v1.0/qr/qr-mpm-generate');
    expect(header(qrCall, 'Authorization')).toBe('Bearer tok-1');
    expect(header(qrCall, 'X-PARTNER-ID')).toBe('BRN-TEST-1');
    expect(header(qrCall, 'CHANNEL-ID')).toBe('95221');
    expect(header(qrCall, 'X-EXTERNAL-ID')).toMatch(/^\d+$/);
    const expectedSig = signSymmetric('SK-snap', {
      method: 'POST',
      path: '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate',
      accessToken: 'tok-1',
      rawBody: qrCall.init.body as string,
      timestamp: header(qrCall, 'X-TIMESTAMP'),
    });
    expect(header(qrCall, 'X-SIGNATURE')).toBe(expectedSig);
    expect(JSON.parse(qrCall.init.body as string)).toEqual({
      partnerReferenceNo: 'QRS-1',
      amount: { value: '55500.00', currency: 'IDR' },
      merchantId: 'M-1',
      terminalId: 'T-1',
      validityPeriod: '2026-10-02T15:14:05+07:00',
    });
  });

  it('caches the token and shares one token request across parallel calls', async () => {
    const { generateQris } = await load();
    const input = { partnerReferenceNo: 'Q', amount: 1000, merchantId: 'M', terminalId: 'T', validityPeriod: 'v' };
    await Promise.all([generateQris(input), generateQris(input), generateQris(input)]);
    await generateQris(input);
    expect(calls.filter((c) => c.url.endsWith('/access-token/b2b'))).toHaveLength(1);
  });

  it('refreshes the token once on 401 and retries', async () => {
    const { generateQris } = await load();
    let qrAttempts = 0;
    let tokenNo = 0;
    responder = ({ url }) => {
      if (url.endsWith('/access-token/b2b')) return { status: 200, body: { accessToken: `tok-${++tokenNo}`, expiresIn: 900 } };
      qrAttempts += 1;
      return qrAttempts === 1
        ? { status: 401, body: { responseCode: '4014701', responseMessage: 'Invalid Token' } }
        : { status: 200, body: { responseCode: '2004700', qrContent: '00020101021226xxxx' } };
    };
    await generateQris({ partnerReferenceNo: 'Q', amount: 1000, merchantId: 'M', terminalId: 'T', validityPeriod: 'v' });
    expect(qrAttempts).toBe(2);
    expect(header(calls[calls.length - 1], 'Authorization')).toBe('Bearer tok-2');
  });

  it('throws DokuApiError on a non-success SNAP response code', async () => {
    const { generateQris } = await load();
    const { DokuApiError } = await import('../client');
    responder = ({ url }) =>
      url.endsWith('/access-token/b2b')
        ? { status: 200, body: { accessToken: 't', expiresIn: 900 } }
        : { status: 400, body: { responseCode: '4004701', responseMessage: 'Invalid Field Format' } };
    await expect(
      generateQris({ partnerReferenceNo: 'Q', amount: 1000, merchantId: 'M', terminalId: 'T', validityPeriod: 'v' })
    ).rejects.toBeInstanceOf(DokuApiError);
  });

  it('queries QRIS status with serviceCode 47 and parses the amount', async () => {
    const { queryQris } = await load();
    responder = ({ url }) =>
      url.endsWith('/access-token/b2b')
        ? { status: 200, body: { accessToken: 't', expiresIn: 900 } }
        : { status: 200, body: { responseCode: '2005100', latestTransactionStatus: '00', amount: { value: '55500.00', currency: 'IDR' } } };
    const res = await queryQris({ referenceNo: 'REF-1', partnerReferenceNo: 'QRS-1', merchantId: 'M-1' });
    expect(res).toMatchObject({ statusCode: '00', amount: 55500 });
    expect(JSON.parse(calls[calls.length - 1].init.body as string)).toEqual({
      originalReferenceNo: 'REF-1',
      originalPartnerReferenceNo: 'QRS-1',
      serviceCode: '47',
      merchantId: 'M-1',
    });
  });
});

describe('SNAP inbound token', () => {
  it('issues a token only for a request signed by DOKU, and verifies it', async () => {
    vi.resetModules();
    const { issueInboundToken, verifyInboundToken } = await import('./inbound');
    const { signAsymmetric } = await import('./signature');
    const ts = '2026-10-02T15:04:05+07:00';

    const ok = issueInboundToken(new Headers({
      'X-CLIENT-KEY': 'BRN-TEST-1',
      'X-TIMESTAMP': ts,
      'X-SIGNATURE': signAsymmetric(doku.privateKey, 'BRN-TEST-1', ts),
    }));
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(verifyInboundToken(`Bearer ${ok.accessToken}`)).toBe(true);

    // Ditandatangani key selain DOKU (mis. penyerang) → ditolak.
    expect(issueInboundToken(new Headers({
      'X-CLIENT-KEY': 'BRN-TEST-1',
      'X-TIMESTAMP': ts,
      'X-SIGNATURE': signAsymmetric(merchant.privateKey, 'BRN-TEST-1', ts),
    }))).toEqual({ ok: false, reason: 'INVALID_SIGNATURE' });
    expect(issueInboundToken(new Headers({ 'X-CLIENT-KEY': 'BRN-OTHER', 'X-TIMESTAMP': ts, 'X-SIGNATURE': 'x' })))
      .toEqual({ ok: false, reason: 'UNKNOWN_CLIENT' });

    expect(verifyInboundToken(null)).toBe(false);
    expect(verifyInboundToken('Bearer not-a-jwt')).toBe(false);
    const forged = (await import('jsonwebtoken')).default.sign({ clientId: 'BRN-TEST-1' }, doku.privateKey, { algorithm: 'RS256', issuer: 'menuin' });
    expect(verifyInboundToken(`Bearer ${forged}`)).toBe(false);
  });
});

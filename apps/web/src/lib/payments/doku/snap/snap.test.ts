import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bodyHash,
  generateExternalId,
  signAsymmetric,
  signSymmetric,
  snapTimestamp,
  symmetricStringToSign,
  verifyAsymmetric,
} from './signature';
import { formatSnapAmount, mapQrisStatus, parseSnapAmount } from './qris';

const merchant = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const doku = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = (k: crypto.KeyObject, type: 'pkcs8' | 'spki') => k.export({ type, format: 'pem' }).toString();

describe('SNAP signature', () => {
  it('formats timestamps in WIB (+07:00) without milliseconds', () => {
    expect(snapTimestamp(new Date('2026-10-02T08:04:05.678Z'))).toBe('2026-10-02T15:04:05+07:00');
    expect(snapTimestamp(new Date('2026-10-02T20:00:00Z'))).toBe('2026-10-03T03:00:00+07:00');
  });

  it('asymmetric signature is SHA256withRSA over "clientId|timestamp" and verifies with the public key', () => {
    const sig = signAsymmetric(merchant.privateKey, 'BRN-1', '2026-10-02T15:04:05+07:00');
    const expected = crypto.createSign('RSA-SHA256').update('BRN-1|2026-10-02T15:04:05+07:00').sign(merchant.privateKey, 'base64');
    expect(sig).toBe(expected);
    expect(verifyAsymmetric(merchant.publicKey, 'BRN-1', '2026-10-02T15:04:05+07:00', sig)).toBe(true);
  });

  it.each([
    ['other client', 'BRN-2', '2026-10-02T15:04:05+07:00'],
    ['other timestamp', 'BRN-1', '2026-10-02T15:04:06+07:00'],
  ])('asymmetric verification rejects %s', (_l, clientId, ts) => {
    const sig = signAsymmetric(merchant.privateKey, 'BRN-1', '2026-10-02T15:04:05+07:00');
    expect(verifyAsymmetric(merchant.publicKey, clientId, ts, sig)).toBe(false);
  });

  it('asymmetric verification rejects a signature from another key and garbage', () => {
    const sig = signAsymmetric(doku.privateKey, 'BRN-1', 'ts');
    expect(verifyAsymmetric(merchant.publicKey, 'BRN-1', 'ts', sig)).toBe(false);
    expect(verifyAsymmetric(merchant.publicKey, 'BRN-1', 'ts', 'not-base64!!')).toBe(false);
    expect(verifyAsymmetric(merchant.publicKey, 'BRN-1', 'ts', null)).toBe(false);
  });

  it('symmetric signature matches the official library formula (HMAC-SHA512, lowercase hex body hash)', () => {
    const rawBody = JSON.stringify({ partnerReferenceNo: 'QRS-1', amount: { value: '55500.00', currency: 'IDR' } });
    const params = { method: 'post', path: '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate', accessToken: 'tok', rawBody, timestamp: '2026-10-02T15:04:05+07:00' };
    const hash = crypto.createHash('sha256').update(rawBody).digest('hex').toLowerCase();
    expect(symmetricStringToSign(params)).toBe(`POST:${params.path}:tok:${hash}:${params.timestamp}`);
    expect(signSymmetric('SK-secret', params)).toBe(
      crypto.createHmac('sha512', 'SK-secret').update(`POST:${params.path}:tok:${hash}:${params.timestamp}`).digest('base64')
    );
    expect(bodyHash(rawBody)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('external ids are numeric, <= 36 chars and unique', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateExternalId()));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^\d{1,36}$/);
  });
});

describe('QRIS helpers', () => {
  it('formats SNAP amounts with two decimals and rejects invalid values', () => {
    expect(formatSnapAmount(55500)).toBe('55500.00');
    expect(() => formatSnapAmount(0)).toThrow();
    expect(() => formatSnapAmount(10.5)).toThrow();
    expect(parseSnapAmount('55500.00')).toBe(55500);
    expect(parseSnapAmount('abc')).toBeNull();
  });

  it.each([
    ['00', 'PAID'],
    ['01', 'PENDING'],
    ['02', 'PENDING'],
    ['03', 'PENDING'],
    ['04', null],
    ['05', 'FAILED'],
    ['06', 'FAILED'],
    ['07', null],
    [undefined, null],
  ])('maps latestTransactionStatus %s → %s', (code, outcome) => {
    expect(mapQrisStatus(code as string | undefined)).toBe(outcome);
  });
});

describe('SNAP config', () => {
  const KEYS = ['DOKU_ENV', 'DOKU_CLIENT_ID', 'DOKU_SECRET_KEY', 'DOKU_PRIVATE_KEY', 'DOKU_PUBLIC_KEY'];
  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
    Object.assign(process.env, { DOKU_CLIENT_ID: 'BRN-1', DOKU_SECRET_KEY: 'SK-1' });
  });
  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  async function load(env: Record<string, string>) {
    Object.assign(process.env, env);
    vi.resetModules();
    return import('./config');
  }

  it('accepts valid keys, including PEM stored with literal \\n', async () => {
    const { getSnapConfig } = await load({
      DOKU_PRIVATE_KEY: pem(merchant.privateKey, 'pkcs8').replace(/\n/g, '\\n'),
      DOKU_PUBLIC_KEY: pem(doku.publicKey, 'spki'),
    });
    const config = getSnapConfig();
    expect(config.channelId).toBe('H2H');
    expect(config.qrisValidityMinutes).toBe(10);
  });

  it('rejects DOKU_PUBLIC_KEY that is actually the merchant own public key', async () => {
    const { getSnapConfig, getSnapConfigOrNull } = await load({
      DOKU_PRIVATE_KEY: pem(merchant.privateKey, 'pkcs8'),
      DOKU_PUBLIC_KEY: pem(merchant.publicKey, 'spki'),
    });
    expect(() => getSnapConfig()).toThrow(/MILIK DOKU/);
    expect(getSnapConfigOrNull()).toBeNull();
  });

  it('rejects malformed keys and missing keys', async () => {
    const { getSnapConfig } = await load({ DOKU_PRIVATE_KEY: 'nope', DOKU_PUBLIC_KEY: pem(doku.publicKey, 'spki') });
    expect(() => getSnapConfig()).toThrow(/DOKU_PRIVATE_KEY/);
    const again = await load({ DOKU_PRIVATE_KEY: '' });
    expect(() => again.getSnapConfig()).toThrow();
  });
});

import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  buildDigest,
  buildSignatureComponent,
  createSignature,
  formatDokuTimestamp,
  safeEqual,
  verifySignature,
} from './signature';

const SECRET = 'SK-test-secret';
const base = {
  clientId: 'BRN-0001-1234567890',
  requestId: 'd9a3b1c2-0000-4000-8000-000000000001',
  requestTimestamp: '2026-09-30T08:00:00Z',
  requestTarget: '/api/webhook/doku',
};
const body = JSON.stringify({ order: { invoice_number: 'MNU-1', amount: 55500 }, transaction: { status: 'SUCCESS' } });

describe('DOKU Non-SNAP signature', () => {
  it('builds the component in the documented order with a Digest line for bodies', () => {
    expect(buildSignatureComponent({ ...base, body })).toBe(
      [
        `Client-Id:${base.clientId}`,
        `Request-Id:${base.requestId}`,
        `Request-Timestamp:${base.requestTimestamp}`,
        `Request-Target:${base.requestTarget}`,
        `Digest:${crypto.createHash('sha256').update(body).digest('base64')}`,
      ].join('\n')
    );
  });

  it('omits the Digest line for requests without a body (GET)', () => {
    expect(buildSignatureComponent(base)).not.toContain('Digest:');
    expect(buildSignatureComponent({ ...base, body: '' })).not.toContain('Digest:');
  });

  it('produces HMACSHA256=base64(hmac) matching an independent computation', () => {
    const component = buildSignatureComponent({ ...base, body });
    const expected = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET).update(component).digest('base64');
    expect(createSignature({ ...base, body }, SECRET)).toBe(expected);
  });

  it('verifies a valid signature', () => {
    const sig = createSignature({ ...base, body }, SECRET);
    expect(verifySignature({ ...base, body }, sig, SECRET)).toBe(true);
  });

  it.each([
    ['tampered amount', { body: body.replace('55500', '1') }],
    ['re-serialized body (whitespace)', { body: JSON.stringify(JSON.parse(body), null, 2) }],
    ['different request target', { requestTarget: '/api/webhook/other' }],
    ['different request id', { requestId: 'replayed-id' }],
    ['different timestamp', { requestTimestamp: '2026-09-30T08:00:01Z' }],
  ])('rejects %s', (_label, override) => {
    const sig = createSignature({ ...base, body }, SECRET);
    expect(verifySignature({ ...base, body, ...override }, sig, SECRET)).toBe(false);
  });

  it('rejects wrong secret, missing and malformed signatures', () => {
    const sig = createSignature({ ...base, body }, 'other-secret');
    expect(verifySignature({ ...base, body }, sig, SECRET)).toBe(false);
    expect(verifySignature({ ...base, body }, null, SECRET)).toBe(false);
    expect(verifySignature({ ...base, body }, '', SECRET)).toBe(false);
    expect(verifySignature({ ...base, body }, 'HMACSHA256=short', SECRET)).toBe(false);
  });

  it('digest is computed over raw UTF-8 bytes', () => {
    const unicode = JSON.stringify({ name: 'Kopi Susu Gula Aren ☕' });
    expect(buildDigest(unicode)).toBe(crypto.createHash('sha256').update(Buffer.from(unicode, 'utf8')).digest('base64'));
  });

  it('safeEqual handles different lengths without throwing', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('abc', 'abc')).toBe(true);
  });

  it('formats timestamps as UTC without milliseconds', () => {
    expect(formatDokuTimestamp(new Date('2026-09-30T08:00:00.123Z'))).toBe('2026-09-30T08:00:00Z');
  });
});

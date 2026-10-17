import crypto from 'crypto';

/**
 * Signature DOKU Non-SNAP (Checkout, Check Status, Sub Account, HTTP Notification).
 *
 *   Component = "Client-Id:{id}\nRequest-Id:{rid}\nRequest-Timestamp:{ts}\nRequest-Target:{path}"
 *               + ("\nDigest:{base64(sha256(body))}" jika ada body)
 *   Signature = "HMACSHA256=" + base64(hmacSha256(secretKey, Component))
 *
 * Digest WAJIB dihitung dari string body mentah persis seperti yang dikirim/diterima.
 */

export const SIGNATURE_PREFIX = 'HMACSHA256=';

export type SignatureInput = {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  /** Body mentah. Kosongkan/undefined untuk request tanpa body (mis. GET). */
  body?: string;
};

export function buildDigest(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf8').digest('base64');
}

export function buildSignatureComponent(input: SignatureInput): string {
  const lines = [
    `Client-Id:${input.clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.requestTimestamp}`,
    `Request-Target:${input.requestTarget}`,
  ];
  if (input.body !== undefined && input.body !== '') {
    lines.push(`Digest:${buildDigest(input.body)}`);
  }
  return lines.join('\n');
}

export function createSignature(input: SignatureInput, secretKey: string): string {
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(buildSignatureComponent(input), 'utf8')
    .digest('base64');
  return `${SIGNATURE_PREFIX}${hmac}`;
}

/** Perbandingan constant-time untuk mencegah timing attack. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifySignature(
  input: SignatureInput,
  receivedSignature: string | null | undefined,
  secretKey: string
): boolean {
  if (!receivedSignature) return false;
  return safeEqual(createSignature(input, secretKey), receivedSignature.trim());
}

/** Format timestamp yang diminta DOKU: ISO-8601 UTC tanpa milidetik, mis. 2026-09-30T08:00:00Z */
export function formatDokuTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

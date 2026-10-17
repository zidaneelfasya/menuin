import crypto from 'crypto';

/**
 * Signature DOKU SNAP (standar SNAP Bank Indonesia), mengikuti library resmi
 * doku-nodejs-library:
 *
 *  - Asymmetric (token B2B):  base64(SHA256withRSA(privateKey, `${clientId}|${timestamp}`))
 *  - Symmetric (transaksi):   base64(HMAC-SHA512(secretKey,
 *        `${METHOD}:${path}:${accessToken}:${lowercase(hex(sha256(body)))}:${timestamp}`))
 */

/** Timestamp SNAP: ISO-8601 dengan offset WIB, mis. 2026-10-02T15:04:05+07:00. */
export function snapTimestamp(date: Date = new Date()): string {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().replace(/\.\d{3}Z$/, '+07:00');
}

export function asymmetricStringToSign(clientId: string, timestamp: string): string {
  return `${clientId}|${timestamp}`;
}

export function signAsymmetric(privateKey: crypto.KeyObject | string, clientId: string, timestamp: string): string {
  return crypto.sign('RSA-SHA256', Buffer.from(asymmetricStringToSign(clientId, timestamp)), privateKey).toString('base64');
}

export function verifyAsymmetric(
  publicKey: crypto.KeyObject | string,
  clientId: string,
  timestamp: string,
  signature: string | null | undefined
): boolean {
  if (!signature) return false;
  try {
    return crypto.verify(
      'RSA-SHA256',
      Buffer.from(asymmetricStringToSign(clientId, timestamp)),
      publicKey,
      Buffer.from(signature, 'base64')
    );
  } catch {
    return false;
  }
}

export function bodyHash(rawBody: string): string {
  return crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex').toLowerCase();
}

export function symmetricStringToSign(params: {
  method: string;
  path: string;
  accessToken: string;
  rawBody: string;
  timestamp: string;
}): string {
  return `${params.method.toUpperCase()}:${params.path}:${params.accessToken}:${bodyHash(params.rawBody)}:${params.timestamp}`;
}

export function signSymmetric(secretKey: string, params: Parameters<typeof symmetricStringToSign>[0]): string {
  return crypto.createHmac('sha512', secretKey).update(symmetricStringToSign(params), 'utf8').digest('base64');
}

/** X-EXTERNAL-ID: numerik, unik per hari (maks 36 karakter). */
export function generateExternalId(now: number = Date.now()): string {
  const rand = crypto.randomInt(0, 1_000_000_000).toString().padStart(9, '0');
  return `${now}${rand}`;
}

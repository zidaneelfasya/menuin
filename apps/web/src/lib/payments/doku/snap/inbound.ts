import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getSnapConfig } from './config';
import { verifyAsymmetric } from './signature';

/**
 * Endpoint SNAP yang DIPANGGIL DOKU ke Menuin (notifikasi QRIS):
 *  1. DOKU meminta token: header X-CLIENT-KEY, X-TIMESTAMP, X-SIGNATURE
 *     (SHA256withRSA oleh private key DOKU) → diverifikasi dengan DOKU_PUBLIC_KEY.
 *  2. Menuin menerbitkan JWT RS256 (private key Menuin), berlaku 15 menit.
 *  3. Notifikasi membawa `Authorization: Bearer <jwt>` → diverifikasi dengan public key Menuin.
 */

const TOKEN_TTL_SECONDS = 900;
const ISSUER = 'menuin';

export function issueInboundToken(headers: Headers):
  | { ok: true; accessToken: string; expiresIn: number }
  | { ok: false; reason: string } {
  const config = getSnapConfig();
  const clientKey = headers.get('x-client-key');
  const timestamp = headers.get('x-timestamp');
  const signature = headers.get('x-signature');

  if (!clientKey || !timestamp || !signature) return { ok: false, reason: 'MISSING_HEADERS' };
  if (clientKey !== config.clientId) return { ok: false, reason: 'UNKNOWN_CLIENT' };
  if (!verifyAsymmetric(config.dokuPublicKey, clientKey, timestamp, signature)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  const accessToken = jwt.sign({ clientId: clientKey, jti: crypto.randomUUID() }, config.privateKey, {
    algorithm: 'RS256',
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: ISSUER,
  });
  return { ok: true, accessToken, expiresIn: TOKEN_TTL_SECONDS };
}

export function verifyInboundToken(authorization: string | null): boolean {
  if (!authorization?.startsWith('Bearer ')) return false;
  const config = getSnapConfig();
  try {
    const claims = jwt.verify(authorization.slice('Bearer '.length).trim(), config.merchantPublicKey, {
      algorithms: ['RS256'],
      issuer: ISSUER,
    }) as { clientId?: string };
    return claims.clientId === config.clientId;
  } catch {
    return false;
  }
}

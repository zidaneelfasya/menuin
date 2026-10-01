import { headers } from 'next/headers';

/**
 * Origin publik aplikasi untuk callback URL payment gateway. Diambil dari
 * APP_BASE_URL (disarankan di production), fallback ke header request.
 * Tidak pernah memakai URL kiriman client (anti open-redirect).
 */
export async function getAppOrigin(): Promise<string | null> {
  const fromEnv = process.env.APP_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  if (!host) return null;
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

import { z } from 'zod';
import { DokuApiError, DokuNetworkError } from '../client';
import { getSnapConfig } from './config';
import { generateExternalId, signAsymmetric, signSymmetric, snapTimestamp } from './signature';

const TOKEN_PATH = '/authorization/v1/access-token/b2b';
const DEFAULT_TIMEOUT_MS = 15_000;
/** Token diperbarui sebelum benar-benar kedaluwarsa. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

const tokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.coerce.number().positive().optional(),
}).passthrough();

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;
let inflight: Promise<string> | null = null;

async function fetchJson(url: string, init: RequestInit, requestId: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    throw new DokuNetworkError(`Gagal menghubungi DOKU SNAP (${init.method} ${new URL(url).pathname})`, requestId, { cause: error });
  }
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 2000) };
    }
  }
  return { response, data };
}

async function requestNewToken(): Promise<string> {
  const config = getSnapConfig();
  const timestamp = snapTimestamp();
  const requestId = generateExternalId();
  const { response, data } = await fetchJson(
    `${config.baseUrl}${TOKEN_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CLIENT-KEY': config.clientId,
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signAsymmetric(config.privateKey, config.clientId, timestamp),
      },
      body: JSON.stringify({ grantType: 'client_credentials' }),
    },
    requestId
  );

  const parsed = tokenResponseSchema.safeParse(data);
  if (!response.ok || !parsed.success) {
    throw new DokuApiError(`Gagal mendapatkan token B2B DOKU (${response.status})`, response.status, data, requestId);
  }
  const ttlMs = (parsed.data.expiresIn ?? 900) * 1000;
  cachedToken = { value: parsed.data.accessToken, expiresAt: Date.now() + ttlMs };
  return cachedToken.value;
}

/** Token B2B di-cache di memori; request paralel berbagi satu permintaan token (single-flight). */
export async function getB2BAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) return cachedToken.value;
  if (!inflight) {
    inflight = requestNewToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function invalidateB2BAccessToken() {
  cachedToken = null;
}

export type SnapResponse = { responseCode?: string; responseMessage?: string; [key: string]: unknown };

/** Kode respons SNAP: 3 digit HTTP + 2 digit service code + 2 digit case. Sukses = diawali "2". */
export function isSnapSuccess(data: SnapResponse | null): boolean {
  return typeof data?.responseCode === 'string' && data.responseCode.startsWith('2');
}

/** POST transaksional SNAP dengan signature simetris. Token kedaluwarsa (401) dicoba ulang sekali. */
export async function snapPost<T extends SnapResponse>(path: string, body: unknown, retried = false): Promise<T> {
  const config = getSnapConfig();
  const accessToken = await getB2BAccessToken();
  const timestamp = snapTimestamp();
  const externalId = generateExternalId();
  const rawBody = JSON.stringify(body);

  const { response, data } = await fetchJson(
    `${config.baseUrl}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signSymmetric(config.secretKey, { method: 'POST', path, accessToken, rawBody, timestamp }),
        'X-PARTNER-ID': config.clientId,
        'X-EXTERNAL-ID': externalId,
        'CHANNEL-ID': config.channelId,
      },
      body: rawBody,
    },
    externalId
  );

  if (response.status === 401 && !retried) {
    invalidateB2BAccessToken();
    return snapPost<T>(path, body, true);
  }
  if (!response.ok || !isSnapSuccess(data as SnapResponse)) {
    throw new DokuApiError(`DOKU SNAP merespons ${response.status} (POST ${path})`, response.status, data, externalId);
  }
  return data as T;
}

/** Hanya untuk test. */
export function __resetSnapTokenCache() {
  cachedToken = null;
  inflight = null;
}

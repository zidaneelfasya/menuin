import crypto from 'crypto';
import { getDokuConfig } from './config';
import { createSignature, formatDokuTimestamp } from './signature';

const DEFAULT_TIMEOUT_MS = 15_000;

/** DOKU membalas dengan status HTTP non-2xx (request pasti ditolak / tidak diproses). */
export class DokuApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
    public readonly requestId: string
  ) {
    super(message);
    this.name = 'DokuApiError';
  }
}

/**
 * Timeout / koneksi putus. Hasil di sisi DOKU TIDAK DIKETAHUI (bisa saja sudah diproses),
 * jadi pemanggil harus memverifikasi via Check Status sebelum mengulang.
 */
export class DokuNetworkError extends Error {
  constructor(message: string, public readonly requestId: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DokuNetworkError';
  }
}

export type DokuResponse<T> = {
  status: number;
  data: T;
  requestId: string;
};

type RequestOptions = {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  timeoutMs?: number;
};

export async function dokuRequest<T>({ method, path, body, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions): Promise<DokuResponse<T>> {
  const config = getDokuConfig();
  const requestId = crypto.randomUUID();
  const requestTimestamp = formatDokuTimestamp();
  // Body di-serialize SEKALI dan string yang sama dipakai untuk Digest dan payload.
  const rawBody = body === undefined ? undefined : JSON.stringify(body);

  const signature = createSignature(
    { clientId: config.clientId, requestId, requestTimestamp, requestTarget: path, body: rawBody },
    config.secretKey
  );

  const headers: Record<string, string> = {
    'Client-Id': config.clientId,
    'Request-Id': requestId,
    'Request-Timestamp': requestTimestamp,
    Signature: signature,
    Accept: 'application/json',
  };
  if (rawBody !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers,
      body: rawBody,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new DokuNetworkError(`Gagal menghubungi DOKU (${method} ${path})`, requestId, { cause: error });
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

  if (!response.ok) {
    throw new DokuApiError(`DOKU merespons ${response.status} (${method} ${path})`, response.status, data, requestId);
  }

  return { status: response.status, data: data as T, requestId };
}

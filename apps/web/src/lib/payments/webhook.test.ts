import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Jalur penolakan webhook harus terjadi SEBELUM menyentuh DB.
const dbTouched = vi.fn();
vi.mock('@/lib/db', () => ({
  db: new Proxy({}, { get: () => { dbTouched(); throw new Error('DB must not be used'); } }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const ENV = {
  DOKU_ENV: 'sandbox',
  DOKU_CLIENT_ID: 'BRN-TEST-1',
  DOKU_SECRET_KEY: 'SK-test',
  DOKU_NOTIFICATION_PATH: '/api/webhook/doku',
};

async function load() {
  vi.resetModules();
  const service = await import('./payment.service');
  const sig = await import('./doku/signature');
  return { ...service, ...sig };
}

function headersFor(sign: (i: { clientId: string; requestId: string; requestTimestamp: string; requestTarget: string; body: string }) => string, body: string, over: Record<string, string> = {}) {
  const base = { clientId: ENV.DOKU_CLIENT_ID, requestId: 'req-1', requestTimestamp: '2026-09-30T08:00:00Z', requestTarget: ENV.DOKU_NOTIFICATION_PATH, body };
  return new Headers({
    'Client-Id': base.clientId,
    'Request-Id': base.requestId,
    'Request-Timestamp': base.requestTimestamp,
    Signature: sign(base),
    ...over,
  });
}

const body = JSON.stringify({ order: { invoice_number: 'MNU-1', amount: 1000 }, transaction: { status: 'SUCCESS' } });

describe('handleDokuNotification rejection paths', () => {
  beforeEach(() => {
    Object.assign(process.env, ENV);
    dbTouched.mockReset();
  });
  afterEach(() => {
    for (const k of Object.keys(ENV)) delete process.env[k];
  });

  it('returns 503 when DOKU is not configured (so DOKU retries later)', async () => {
    delete process.env.DOKU_SECRET_KEY;
    const { handleDokuNotification } = await load();
    const res = await handleDokuNotification(body, new Headers());
    expect(res.status).toBe(503);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('returns 400 when signature headers are missing', async () => {
    const { handleDokuNotification } = await load();
    const res = await handleDokuNotification(body, new Headers({ 'Client-Id': ENV.DOKU_CLIENT_ID }));
    expect(res.status).toBe(400);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('returns 401 for a forged signature', async () => {
    const { handleDokuNotification } = await load();
    const res = await handleDokuNotification(body, headersFor(() => 'HMACSHA256=forged', body));
    expect(res.status).toBe(401);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('returns 401 when the body was tampered after signing', async () => {
    const { handleDokuNotification, createSignature } = await load();
    const headers = headersFor((i) => createSignature(i, ENV.DOKU_SECRET_KEY), body);
    const res = await handleDokuNotification(body.replace('1000', '1'), headers);
    expect(res.status).toBe(401);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('returns 401 when signed for another client id', async () => {
    const { handleDokuNotification, createSignature } = await load();
    const headers = headersFor(
      (i) => createSignature({ ...i, clientId: 'BRN-OTHER' }, ENV.DOKU_SECRET_KEY),
      body,
      { 'Client-Id': 'BRN-OTHER' }
    );
    const res = await handleDokuNotification(body, headers);
    expect(res.status).toBe(401);
    expect(dbTouched).not.toHaveBeenCalled();
  });

  it('accepts a valid signature and proceeds to the DB', async () => {
    const { handleDokuNotification, createSignature } = await load();
    const headers = headersFor((i) => createSignature(i, ENV.DOKU_SECRET_KEY), body);
    await expect(handleDokuNotification(body, headers)).rejects.toThrow('DB must not be used');
    expect(dbTouched).toHaveBeenCalled();
  });
});

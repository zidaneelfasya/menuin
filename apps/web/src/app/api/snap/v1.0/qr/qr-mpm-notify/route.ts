import { NextResponse } from 'next/server';
import { handleQrisNotification } from '@/lib/payments/payment.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;

/** Notifikasi pembayaran QRIS dari DOKU (SNAP). */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ responseCode: '4135200', responseMessage: 'Payload Too Large' }, { status: 413 });
  }
  try {
    const result = await handleQrisNotification(rawBody, req.headers);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'payments', event: 'qris_notify_unhandled', error: String(error) }));
    return NextResponse.json({ responseCode: '5005200', responseMessage: 'General Error' }, { status: 500 });
  }
}

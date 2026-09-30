import { NextResponse } from 'next/server';
import { handleDokuNotification } from '@/lib/payments/payment.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: Request) {
  // Body dibaca MENTAH: Digest signature dihitung dari byte asli, jadi jangan
  // di-parse lalu di-stringify ulang sebelum diverifikasi.
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    const result = await handleDokuNotification(rawBody, req.headers);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'payments', event: 'webhook_unhandled', error: String(error) }));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

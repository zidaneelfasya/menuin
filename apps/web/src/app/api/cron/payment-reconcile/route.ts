import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/payments/doku/signature';
import { reconcilePendingPayments } from '@/lib/payments/payment.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Jaring pengaman jika webhook DOKU tidak sampai: cek status attempt yang masih
 * PENDING dan tutup attempt yang macet. Dipanggil scheduler (mis. Vercel Cron)
 * dengan header `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  const auth = req.headers.get('authorization') || '';
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await reconcilePendingPayments();
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'payments', event: 'reconcile_failed', error: String(error) }));
    return NextResponse.json({ error: 'Reconcile failed' }, { status: 500 });
  }
}

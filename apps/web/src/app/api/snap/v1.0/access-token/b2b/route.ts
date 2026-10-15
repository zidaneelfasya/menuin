import { NextResponse } from 'next/server';
import { getSnapConfigOrNull } from '@/lib/payments/doku/snap/config';
import { issueInboundToken } from '@/lib/payments/doku/snap/inbound';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * SNAP "Get Token B2B" yang dipanggil DOKU sebelum mengirim notifikasi QRIS.
 * Daftarkan base URL `https://<domain>/api/snap` di dashboard DOKU.
 */
export async function POST(req: Request) {
  const timestamp = req.headers.get('x-timestamp');
  if (!getSnapConfigOrNull()) {
    return NextResponse.json({ responseCode: '5037300', responseMessage: 'Service Unavailable' }, { status: 503 });
  }

  const result = issueInboundToken(req.headers);
  if (!result.ok) {
    console.warn(JSON.stringify({ scope: 'payments', event: 'snap_token_rejected', reason: result.reason }));
    return NextResponse.json(
      { responseCode: '4017300', responseMessage: 'Unauthorized. Invalid Signature' },
      { status: 401, headers: timestamp ? { 'X-TIMESTAMP': timestamp } : undefined }
    );
  }

  return NextResponse.json(
    {
      responseCode: '2007300',
      responseMessage: 'Successful',
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: String(result.expiresIn),
    },
    { headers: timestamp ? { 'X-TIMESTAMP': timestamp } : undefined }
  );
}

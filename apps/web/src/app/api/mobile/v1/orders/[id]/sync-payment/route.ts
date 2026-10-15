import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { syncOrderPayment } from '@/lib/payments/payment.service';
import { eq, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.sub, 
      username: decoded.username,
      tenantId: decoded.tenantId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const [order] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, orderId), eq(transactions.tenantId, tenantId)))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        paymentStatus: 'PAID',
        status: order.status,
        isPaid: true,
        message: 'Pesanan sudah berstatus lunas.',
      });
    }

    const synced = await syncOrderPayment({ tenantId, transactionId: order.id, minIntervalMs: 5_000 });
    const paymentStatus = synced?.paymentStatus ?? order.paymentStatus;

    return NextResponse.json({
      success: true,
      paymentStatus,
      status: synced?.status ?? order.status,
      isPaid: paymentStatus === 'PAID',
    });
  } catch (error: any) {
    console.error('Mobile Orders API Sync Payment Error:', error);
    return NextResponse.json(
      { error: 'Gagal sinkronisasi status pembayaran.' },
      { status: 500 }
    );
  }
}

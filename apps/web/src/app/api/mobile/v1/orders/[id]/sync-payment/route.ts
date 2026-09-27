import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, tenants } from '@/lib/db/schema';
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

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant || !tenant.midtransServerKey) {
      return NextResponse.json(
        { error: 'Midtrans Server Key belum dikonfigurasi pada Pengaturan Toko.' },
        { status: 400 }
      );
    }

    const authString = Buffer.from(`${tenant.midtransServerKey}:`).toString('base64');
    const apiUrl =
      tenant.midtransEnvironment === 'production'
        ? `https://api.midtrans.com/v2/${order.id}/status`
        : `https://api.sandbox.midtrans.com/v2/${order.id}/status`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Pembayaran belum tercatat di Midtrans / belum dibayar oleh pelanggan.' },
        { status: 400 }
      );
    }

    const midtransData = await response.json();
    const transactionStatus = midtransData.transaction_status;
    const fraudStatus = midtransData.fraud_status;

    let newStatus = order.status;
    let newPaymentStatus = order.paymentStatus || 'PENDING';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        newPaymentStatus = 'PAID';
        if (order.status === 'PENDING') newStatus = 'NEW';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'PAID';
      if (order.status === 'PENDING') newStatus = 'NEW';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      newPaymentStatus = 'CANCELED';
      newStatus = 'FAILED';
    }

    if (newStatus !== order.status || newPaymentStatus !== order.paymentStatus) {
      await db
        .update(transactions)
        .set({ status: newStatus, paymentStatus: newPaymentStatus })
        .where(eq(transactions.id, order.id));
    }

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
      status: newStatus,
      isPaid: newPaymentStatus === 'PAID',
    });
  } catch (error: any) {
    console.error('Mobile Orders API Sync Payment Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal sinkronisasi status pembayaran Midtrans.' },
      { status: 500 }
    );
  }
}

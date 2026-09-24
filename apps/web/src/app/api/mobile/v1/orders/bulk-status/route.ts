import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, transactionItems } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
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

export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds, status } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return NextResponse.json({ error: 'orderIds (array) and status are required' }, { status: 400 });
    }

    const tenantId = user.tenantId;

    // If advancing from PENDING to NEW, also mark paymentStatus as PAID
    if (status === 'NEW') {
      await db.update(transactions)
        .set({ status, paymentStatus: 'PAID' })
        .where(
          and(
            inArray(transactions.id, orderIds),
            eq(transactions.tenantId, tenantId),
            eq(transactions.status, 'PENDING')
          )
        );
    }

    // Update all matching transactions
    await db.update(transactions)
      .set({ status })
      .where(
        and(
          inArray(transactions.id, orderIds),
          eq(transactions.tenantId, tenantId)
        )
      );

    // Auto-complete items if order moves to READY or COMPLETED
    if (status === 'READY' || status === 'COMPLETED') {
      await db.update(transactionItems)
        .set({ isCompleted: true })
        .where(inArray(transactionItems.transactionId, orderIds));
    }

    return NextResponse.json({
      success: true,
      count: orderIds.length,
      message: `${orderIds.length} pesanan berhasil diperbarui`
    });
  } catch (error) {
    console.error('Mobile Orders API Bulk Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

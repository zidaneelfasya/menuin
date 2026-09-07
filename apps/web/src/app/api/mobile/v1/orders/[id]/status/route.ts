import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, transactionItems } from '@/lib/db/schema';
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: transactionId } = await params;
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const tenantId = user.tenantId;

    const [tx] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId)));

    if (!tx) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    const updates: any = { status };
    
    if (tx.status === 'PENDING' && status === 'NEW') {
      updates.paymentStatus = 'PAID';
    }

    await db.update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId)));
    
    if (status === 'READY' || status === 'COMPLETED') {
      await db.update(transactionItems)
        .set({ isCompleted: true })
        .where(eq(transactionItems.transactionId, transactionId));
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated'
    });
  } catch (error) {
    console.error('Mobile Orders API PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

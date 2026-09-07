import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, transactionItems, products } from '@/lib/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
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

export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const activeTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          inArray(transactions.status, ['PENDING', 'NEW', 'PROCESSING', 'READY'])
        )
      )
      .orderBy(desc(transactions.createdAt));

    if (activeTransactions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const txIds = activeTransactions.map(t => t.id);

    const items = await db
      .select({
        id: transactionItems.id,
        transactionId: transactionItems.transactionId,
        quantity: transactionItems.quantity,
        productName: products.name,
        subtotal: transactionItems.subtotal,
        isCompleted: transactionItems.isCompleted
      })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .where(inArray(transactionItems.transactionId, txIds));

    const itemsByTx = items.reduce((acc, item) => {
      if (!acc[item.transactionId]) acc[item.transactionId] = [];
      acc[item.transactionId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    const data = activeTransactions.map(tx => ({
      ...tx,
      items: itemsByTx[tx.id] || []
    }));

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Mobile Orders API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

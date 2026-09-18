import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactionItems } from '@/lib/db/schema';
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const user = await verifyMobileAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { isCompleted } = body;

    if (isCompleted === undefined) {
      return NextResponse.json({ error: 'isCompleted is required' }, { status: 400 });
    }

    const tenantId = user.tenantId;

    const [item] = await db
      .select()
      .from(transactionItems)
      .where(and(eq(transactionItems.id, itemId), eq(transactionItems.tenantId, tenantId)));

    if (!item) {
      return NextResponse.json({ error: 'Item pesanan tidak ditemukan.' }, { status: 404 });
    }

    await db.update(transactionItems)
      .set({ isCompleted })
      .where(and(eq(transactionItems.id, itemId), eq(transactionItems.tenantId, tenantId)));

    return NextResponse.json({
      success: true,
      message: 'Item status updated'
    });
  } catch (error) {
    console.error('Mobile Orders Item API PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

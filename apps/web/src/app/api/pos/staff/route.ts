import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memberships, accounts, posDevices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type !== 'pos_device') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
    }

    // Verify device is still ACTIVE
    const [device] = await db.select().from(posDevices).where(
      and(eq(posDevices.id, decoded.deviceId), eq(posDevices.status, 'ACTIVE'))
    ).limit(1);

    if (!device) {
      return NextResponse.json({ error: 'Perangkat sudah dicabut aksesnya' }, { status: 403 });
    }

    // Get staff members for this tenant
    const staff = await db.select({
      id: memberships.id,
      role: memberships.role,
      name: accounts.fullName,
    })
    .from(memberships)
    .innerJoin(accounts, eq(memberships.accountId, accounts.id))
    .where(
      and(
        eq(memberships.tenantId, decoded.tenantId),
        eq(memberships.status, 'ACTIVE')
      )
    );

    return NextResponse.json({ success: true, staff });

  } catch (error: any) {
    console.error('POS Staff API Error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

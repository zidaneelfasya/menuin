import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';
import { getDashboardDataForTenant } from '@/lib/actions/dashboard';

const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.sub,
      username: decoded.username,
      tenantId: decoded.tenantId,
      role: decoded.role,
      deviceId: decoded.deviceId || null,
    };
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve tenant from database
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Outlet tidak ditemukan' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'harian';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const month = searchParams.get('month') || undefined;
    const year = searchParams.get('year') || undefined;
    const preset = searchParams.get('preset') || undefined;

    const data = await getDashboardDataForTenant(
      tenant,
      user.username || user.role || 'Kasir',
      { tab, from, to, month, year, preset }
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Mobile dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

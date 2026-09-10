import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, subscriptions, memberships, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

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
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch tenant details
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId));
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Fetch user details
    const [membership] = await db
      .select({
        id: memberships.id,
        role: memberships.role,
        displayName: memberships.displayName,
        accountName: accounts.name,
      })
      .from(memberships)
      .innerJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(eq(memberships.id, user.id));

    // Fetch subscription details
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, user.tenantId),
          eq(subscriptions.status, 'ACTIVE')
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: membership.id,
          name: membership.displayName || membership.accountName,
          role: membership.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          subscriptionTier: tenant.subscriptionTier,
        },
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        } : null
      }
    });
  } catch (error) {
    console.error('Mobile API GET Auth Me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, subscriptions, memberships, accounts, posDevices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'menuin-pos-secret-key-change-in-prod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Device Status if x-device-id is present OR token has deviceId
    const headerDeviceId = req.headers.get('x-device-id');
    const deviceId = (headerDeviceId || user.deviceId)?.trim();

    if (deviceId) {
      const isDeviceUuid = UUID_REGEX.test(deviceId);
      const deviceCondition = isDeviceUuid
        ? eq(posDevices.id, deviceId)
        : eq(posDevices.deviceIdentifier, deviceId);

      const [device] = await db
        .select()
        .from(posDevices)
        .where(
          and(
            deviceCondition,
            eq(posDevices.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!device || device.status !== 'ACTIVE') {
        return NextResponse.json({
          success: false,
          error: 'DEVICE_REVOKED',
          message: 'Perangkat ini telah dihapus atau dicabut dari outlet oleh Owner di website MENUIN.'
        }, { status: 403 });
      }

      // Update last seen
      await db.update(posDevices).set({ lastSeenAt: new Date() }).where(eq(posDevices.id, device.id));
    }

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

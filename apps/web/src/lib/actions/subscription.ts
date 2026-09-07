'use server';

import { db } from '@/lib/db';
import { subscriptions, tenants } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireTenantAccess } from './auth-context';

export async function getSubscriptionHistory(tenantId: string) {
  // Ensure the user has access to this tenant before revealing subscriptions
  const context = await requireTenantAccess();
  if (context.tenant.id !== tenantId) {
    throw new Error('Unauthorized access to tenant subscriptions');
  }

  const history = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .orderBy(desc(subscriptions.createdAt));

  return history;
}

export async function createOrUpdateSubscription(tenantId: string, plan: string, durationDays: number = 30) {
  const context = await requireTenantAccess();
  // Only owners or managers can manage subscriptions
  if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
    throw new Error('Only OWNER or MANAGER can modify subscriptions');
  }

  const now = new Date();
  const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // We run this inside a transaction to safely mark old active as expired
  return await db.transaction(async (tx) => {
    // 1. Mark existing ACTIVE subscriptions as EXPIRED/CANCELED
    await tx.update(subscriptions)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(subscriptions.tenantId, tenantId),
          eq(subscriptions.status, 'ACTIVE')
        )
      );

    // 2. Insert new ACTIVE subscription
    const newSubId = uuidv4();
    await tx.insert(subscriptions).values({
      id: newSubId,
      tenantId,
      plan,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd,
    });

    return newSubId;
  });
}

'use server';

import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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

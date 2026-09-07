'use server';

import { requireTenantAccess } from './auth-context';
import { UserService } from '@/lib/services/user.service';
import { db } from '@/lib/db';
import { memberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function setMembershipPinAction(targetMembershipId: string, newPin: string) {
  const context = await requireTenantAccess();

  // Validate PIN format (exactly 6 digits)
  if (!/^\d{6}$/.test(newPin)) {
    throw new Error('PIN must be exactly 6 digits.');
  }

  // Ensure the caller is either updating their own PIN, or is an OWNER/MANAGER updating someone else's PIN
  if (context.membership.id !== targetMembershipId) {
    if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
      throw new Error('Forbidden: You do not have permission to change this PIN.');
    }

    // Verify the target membership belongs to the same tenant
    const [targetMembership] = await db.select().from(memberships).where(
      and(
        eq(memberships.id, targetMembershipId),
        eq(memberships.tenantId, context.tenant.id)
      )
    );

    if (!targetMembership) {
      throw new Error('Target membership not found in this workspace.');
    }
  }

  // Update the PIN
  await UserService.updatePin(targetMembershipId, newPin);

  return { success: true };
}

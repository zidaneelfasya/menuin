'use server';

import { db } from '@/lib/db';
import { devicePairingCodes, posDevices, posSessions } from '@/lib/db/schema';
import { requireTenantAccess } from '@/lib/actions/auth-context';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function generatePairingCodeAction() {
  const context = await requireTenantAccess();
  if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
    return { error: 'Unauthorized. Only OWNER or MANAGER can generate pairing codes.' };
  }

  try {
    // Generate a random 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Clean up old pending codes for this tenant (optional)
    await db.delete(devicePairingCodes)
      .where(and(
        eq(devicePairingCodes.tenantId, context.tenant.id),
        eq(devicePairingCodes.status, 'PENDING')
      ));

    await db.insert(devicePairingCodes).values({
      tenantId: context.tenant.id,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return { success: true, code };
  } catch (error: any) {
    return { error: error.message || 'Failed to generate pairing code' };
  }
}

export async function getDevicesAction() {
  const context = await requireTenantAccess();
  
  try {
    const devices = await db
      .select()
      .from(posDevices)
      .where(eq(posDevices.tenantId, context.tenant.id));

    return { success: true, devices };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch devices' };
  }
}

export async function revokeDeviceAction(deviceId: string) {
  const context = await requireTenantAccess();
  if (context.membership.role !== 'OWNER' && context.membership.role !== 'MANAGER') {
    return { error: 'Unauthorized' };
  }

  try {
    await db.delete(posDevices).where(and(eq(posDevices.id, deviceId), eq(posDevices.tenantId, context.tenant.id)));
    // Also delete any active sessions
    await db.delete(posSessions).where(eq(posSessions.deviceId, deviceId));

    if (context?.tenant?.outletKey) { revalidatePath(`/outlet/${context.tenant.outletKey}`, "layout"); }
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to revoke device' };
  }
}

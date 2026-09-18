'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAvailableTenants } from './auth';

export async function setTenantContextAction(outletKey: string) {
  // Ensure the user actually has access to this tenant
  const tenants = await getAvailableTenants();
  const hasAccess = tenants.some(t => t.outletKey === outletKey);

  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this tenant.');
  }

  const cookieStore = await cookies();
  cookieStore.set('menuin_last_outlet', outletKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  redirect(`/outlet/${outletKey}/dashboard`);
}

export async function createTenantAction(formData: FormData) {
  const restaurantName = formData.get('restaurantName') as string;
  if (!restaurantName) {
    return { error: 'Restaurant name is required' };
  }

  try {
    const { getAuthenticatedAccount } = await import('./auth-context');
    const { db } = await import('@/lib/db');
    const { tenants, memberships } = await import('@/lib/db/schema');
    
    const account = await getAuthenticatedAccount();
    
    const crypto = await import('crypto');
    const outletKey = crypto.randomBytes(10).toString('hex').toUpperCase();
    const baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = baseSlug ? `${baseSlug}-${randomSuffix}` : `outlet-${randomSuffix}`;

    // Create new tenant
    const [newTenant] = await db.insert(tenants).values({
      name: restaurantName,
      outletKey,
      slug,
    }).returning();

    // Generate a random 6 digit PIN
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Create Owner membership linked to the tenant
    await db.insert(memberships).values({
      tenantId: newTenant.id,
      accountId: account.id,
      displayName: account.name,
      pinHash: randomPin,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create tenant:', error);
    return { error: error.message || 'Failed to create workspace' };
  }
}

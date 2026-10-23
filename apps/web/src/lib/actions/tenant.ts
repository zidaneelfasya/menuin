'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAvailableTenants } from './auth';

export async function selectTenantAction(outletKey: string) {
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

  return { success: true };
}

export async function setTenantContextAction(outletKey: string) {
  await selectTenantAction(outletKey);
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

    const rawPrefix = formData.get('orderPrefix') as string | null;
    const { resolveOrderPrefix, sanitizeOrderPrefix } = await import('@/lib/utils/order-number');
    const orderPrefix = rawPrefix && rawPrefix.trim()
      ? sanitizeOrderPrefix(rawPrefix)
      : resolveOrderPrefix({ name: restaurantName });

    const rawPhoto = formData.get('storefrontPhotoUrl') as string | null;
    const storefrontPhotoUrl = rawPhoto && rawPhoto.trim() ? rawPhoto.trim() : null;

    // Parse business categories
    const rawCategories = formData.get('businessCategories') as string | null;
    let selectedCategoryIds: string[] = [];
    if (rawCategories) {
      try {
        const parsed = JSON.parse(rawCategories);
        if (Array.isArray(parsed)) selectedCategoryIds = parsed;
      } catch {
        selectedCategoryIds = rawCategories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const { BUSINESS_CATEGORIES, getModifierTemplatesForCategories } = await import('@/lib/constants/business-categories');
    const matchedCategoryBadges = BUSINESS_CATEGORIES
      .filter(c => selectedCategoryIds.includes(c.id))
      .map(c => c.badge);
    const cuisineType = matchedCategoryBadges.length > 0 ? matchedCategoryBadges.join(' • ') : null;

    // Create new tenant
    const [newTenant] = await db.insert(tenants).values({
      name: restaurantName,
      outletKey,
      slug,
      orderPrefix,
      cuisineType,
      storefrontPhotoUrl,
      storeLogoUrl: storefrontPhotoUrl,
    }).returning();

    // Auto-seed standard modifier groups & modifiers based on selected business categories
    if (selectedCategoryIds.length > 0) {
      const templates = getModifierTemplatesForCategories(selectedCategoryIds);
      if (templates.length > 0) {
        const { modifierGroups, modifiers } = await import('@/lib/db/schema');
        for (const tpl of templates) {
          const groupId = crypto.randomUUID();
          await db.insert(modifierGroups).values({
            id: groupId,
            tenantId: newTenant.id,
            name: tpl.name,
            isRequired: tpl.isRequired,
            minSelections: tpl.minSelections,
            maxSelections: tpl.maxSelections,
          });

          if (tpl.modifiers.length > 0) {
            await db.insert(modifiers).values(
              tpl.modifiers.map(m => ({
                id: crypto.randomUUID(),
                tenantId: newTenant.id,
                groupId,
                name: m.name,
                price: m.price,
                isAvailable: true,
              }))
            );
          }
        }
      }
    }

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

    return { success: true, tenantSlug: slug };
  } catch (error: any) {
    console.error('Failed to create tenant:', error);
    return { error: error.message || 'Failed to create workspace' };
  }
}


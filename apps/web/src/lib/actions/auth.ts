'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { memberships, tenants, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentContext } from './auth-context';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';

export type MembershipProfile = {
  id: string; // Membership ID
  tenantId: string;
  authUserId: string | null;
  username: string;
  displayName: string;
  email: string | null;
  role: UserRole;
  status: string;
  restaurantName: string;
  subscriptionTier: string;
};

// Backward compatibility for existing actions
export type UserProfile = {
  id: string; // Membership ID
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  outletKey: string | null;
  restaurantName: string | null;
  isPaid: boolean;
};

export async function getCurrentMembership(): Promise<MembershipProfile | null> {
  const context = await getCurrentContext();
  if (!context) return null;

  return {
    id: context.membership.id,
    tenantId: context.tenant.id,
    authUserId: context.account.authUserId,
    username: context.account.email.split('@')[0],
    displayName: context.account.name,
    email: context.account.email,
    role: context.membership.role,
    status: context.membership.status,
    restaurantName: context.tenant.name,
    subscriptionTier: context.subscription?.plan || 'FREE',
  };
}

export async function getAvailableTenants() {
  const { getAuthenticatedAccount } = await import('./auth-context');
  const account = await getAuthenticatedAccount(); // Throws AuthError if not logged in
  
  const results = await db
    .select({
      member: memberships,
      tenant: tenants,
    })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.accountId, account.id));

  return results.map(row => ({
    membershipId: row.member.id,
    role: row.member.role,
    tenantId: row.tenant.id,
    name: row.tenant.name,
    slug: row.tenant.slug,
    outletKey: row.tenant.outletKey,
  }));
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const context = await getCurrentContext();
  if (!context) return null;
  
  return {
    id: context.membership.id, // Using membership ID instead of global user ID
    email: context.account.email,
    name: context.account.name,
    role: context.membership.role,
    tenantId: context.tenant.id,
    outletKey: context.tenant.outletKey,
    restaurantName: context.tenant.name,
    isPaid: !context.entitlements.isLocked,
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const restaurantName = formData.get('restaurantName') as string;
  const name = formData.get('name') as string;

  if (!email || !password || !restaurantName || !name) {
    return { error: 'All fields are required' };
  }

  // Check if account already exists
  const existingAccount = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  if (existingAccount.length > 0) {
    return { error: 'Email already registered. Please log in.' };
  }

  const supabase = await createClient();

  // 1. Sign up the user in Supabase Auth (Global Identity)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Unknown error occurred during sign up' };
  }

  try {
    // 2. Create the Account
    const newAccountId = uuidv4();
    await db.insert(accounts).values({
      id: newAccountId,
      authUserId: authData.user.id,
      email,
      name,
    });

    // 3. Create the new tenant
    const outletKey = crypto.randomBytes(10).toString('hex'); // 20 characters
    const baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = baseSlug ? `${baseSlug}-${randomSuffix}` : `outlet-${randomSuffix}`;

    const [newTenant] = await db.insert(tenants).values({
      name: restaurantName,
      outletKey: outletKey,
      slug: slug,
      // subscriptionTier is deprecated, subscription will be handled separately
    }).returning();

    // 4. Create the Owner membership linked to the tenant
    const username = email.split('@')[0];
    await db.insert(memberships).values({
      tenantId: newTenant.id,
      accountId: newAccountId,
      displayName: name,
      role: 'OWNER',
      status: 'ACTIVE',
    });

    return { success: true };
  } catch (dbError: any) {
    console.error('Database error during sign up:', dbError);
    return { error: 'Failed to create membership and tenant' };
  }
}

export async function getTenantDetailsByEmail(email: string) {
  try {
    const result = await db
      .select({
        account: accounts,
        member: memberships,
        tenant: tenants,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .innerJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(eq(accounts.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      email: result[0].account.email,
      name: result[0].member.displayName,
      restaurantName: result[0].tenant.name,
      subscriptionTier: result[0].tenant.subscriptionTier,
      tenantId: result[0].tenant.id,
    };
  } catch (error) {
    console.error('Failed to get tenant details:', error);
    return null;
  }
}

export async function markTenantAsPaidAction(email: string) {
  try {
    const userProfile = await db
      .select({ member: memberships })
      .from(memberships)
      .innerJoin(accounts, eq(memberships.accountId, accounts.id))
      .where(eq(accounts.email, email))
      .limit(1);
      
    if (userProfile.length === 0) {
      return { error: 'Membership not found' };
    }
    const tenantId = userProfile[0].member.tenantId;

    const { subscriptions } = await import('@/lib/db/schema');
    const { and } = await import('drizzle-orm');
    const { v4: uuidv4 } = await import('uuid');

    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      // Mark existing ACTIVE subscriptions as EXPIRED
      await tx.update(subscriptions)
        .set({ status: 'EXPIRED' })
        .where(
          and(
            eq(subscriptions.tenantId, tenantId),
            eq(subscriptions.status, 'ACTIVE')
          )
        );

      // Insert new ACTIVE subscription
      const newSubId = uuidv4();
      await tx.insert(subscriptions).values({
        id: newSubId,
        tenantId,
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd,
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update subscription:', error);
    return { error: error.message || 'Database error' };
  }
}

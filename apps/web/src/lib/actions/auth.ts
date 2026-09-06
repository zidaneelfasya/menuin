'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { memberships, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  restaurantName: string | null;
  isPaid: boolean;
};

export async function getCurrentMembership(): Promise<MembershipProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || !user.id) return null;

  let result;
  try {
    // Cari membership berdasarkan Supabase Auth ID
    result = await db
      .select({
        member: memberships,
        tenant: tenants,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.authUserId, user.id))
      .limit(1);
  } catch (error) {
    console.error('Failed to query membership and tenant:', error);
    return null;
  }

  if (result.length === 0) {
    // It's possible the user signed up but hasn't completed setup, or was deleted
    console.error('Membership not found in database for auth user:', user.id);
    return null;
  }

  const data = result[0];

  return {
    id: data.member.id,
    tenantId: data.tenant.id,
    authUserId: data.member.authUserId,
    username: data.member.username,
    displayName: data.member.displayName,
    email: data.member.email,
    role: data.member.role as UserRole,
    status: data.member.status,
    restaurantName: data.tenant.name,
    subscriptionTier: data.tenant.subscriptionTier,
  };
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const membership = await getCurrentMembership();
  if (!membership) return null;
  
  return {
    id: membership.id, // Using membership ID instead of global user ID
    email: membership.email || '',
    name: membership.displayName,
    role: membership.role,
    tenantId: membership.tenantId,
    restaurantName: membership.restaurantName,
    isPaid: membership.subscriptionTier !== 'FREE',
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
    // 2. Create the new tenant
    const [newTenant] = await db.insert(tenants).values({
      name: restaurantName,
      subscriptionTier: 'FREE', // Default
    }).returning();

    // 3. Create the Owner membership linked to the tenant
    const username = email.split('@')[0];
    await db.insert(memberships).values({
      tenantId: newTenant.id,
      authUserId: authData.user.id,
      username, // Use email prefix as default username
      displayName: name,
      email,
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
        member: memberships,
        tenant: tenants,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      email: result[0].member.email,
      name: result[0].member.displayName,
      restaurantName: result[0].tenant.name,
      subscriptionTier: result[0].tenant.subscriptionTier,
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
      .where(eq(memberships.email, email))
      .limit(1);
      
    if (userProfile.length === 0) {
      return { error: 'Membership not found' };
    }
    const tenantId = userProfile[0].member.tenantId;

    await db.update(tenants).set({ subscriptionTier: 'PRO' }).where(eq(tenants.id, tenantId));
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update subscription:', error);
    return { error: error.message || 'Database error' };
  }
}

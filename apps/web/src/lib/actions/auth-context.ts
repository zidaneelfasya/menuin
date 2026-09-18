import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { accounts, memberships, tenants, subscriptions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { UserRole } from './auth';

export type FeatureKey = 'POS' | 'INVENTORY' | 'CATALOG' | 'REPORTS' | 'FINANCE' | 'TEAM';

// --- Custom Errors ---
export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError'; // 401
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError'; // 403
  }
}

export class FeatureLockedError extends Error {
  feature: string;
  constructor(feature: string) {
    super(`PaymentRequired: Access to feature '${feature}' requires an active subscription.`);
    this.name = 'FeatureLockedError'; // 402 / Business Logic
    this.feature = feature;
  }
}

// --- Modular Resolvers ---

export async function getAuthenticatedAccount() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || !user.id) throw new AuthError('No active session.');

  const [account] = await db.select()
    .from(accounts)
    .where(eq(accounts.authUserId, user.id))
    .limit(1);

  if (!account) throw new AuthError('Account not found.');
  return account;
}


export async function getActiveTenant() {
  const headersList = await headers();
  const routeOutletKey = headersList.get('x-menuin-outlet-key');

  if (routeOutletKey) {
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.outletKey, routeOutletKey))
      .limit(1);
    return tenant || null;
  }

  const cookieStore = await cookies();
  const lastOutletKey = cookieStore.get('menuin_last_outlet')?.value;

  if (!lastOutletKey) return null;

  const [tenant] = await db.select()
    .from(tenants)
    .where(eq(tenants.outletKey, lastOutletKey))
    .limit(1);
    
  return tenant || null;
}

export async function getMembership(accountId: string, tenantId: string) {
  const [membership] = await db.select()
    .from(memberships)
    .where(
      and(
        eq(memberships.accountId, accountId),
        eq(memberships.tenantId, tenantId)
      )
    )
    .limit(1);

  return membership || null;
}

export async function getSubscription(tenantId: string) {
  // We guarantee only 1 active subscription exists due to unique conditional index
  const [subscription] = await db.select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, 'ACTIVE')
      )
    )
    .limit(1);

  return subscription || null;
}

export function getEntitlements(subscription: any) {
  let features: FeatureKey[] = [];
  let isLocked = true;

  if (subscription && subscription.status === 'ACTIVE') {
    isLocked = false;
    if (subscription.plan === 'FREE' || subscription.plan === 'BASIC') {
      features = ['POS', 'CATALOG', 'INVENTORY'];
    } else if (subscription.plan === 'PRO') {
      features = ['POS', 'CATALOG', 'INVENTORY', 'REPORTS', 'FINANCE', 'TEAM'];
    }
  }

  return { features, isLocked };
}

// --- Unified Context ---

export type AuthContext = {
  account: {
    id: string;
    authUserId: string;
    email: string;
    name: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string | null;
    outletKey: string;
  };
  membership: {
    id: string;
    role: UserRole;
    status: string;
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
  } | null;
  entitlements: {
    features: FeatureKey[];
    isLocked: boolean;
  };
};

export async function getCurrentContext(): Promise<AuthContext | null> {
  try {
    const account = await getAuthenticatedAccount();
    const tenant = await getActiveTenant();
    
    if (!tenant) return null;
    
    const membership = await getMembership(account.id, tenant.id);
    if (!membership) return null;

    const subscription = await getSubscription(tenant.id);
    const entitlements = getEntitlements(subscription);

    return {
      account: {
        id: account.id,
        authUserId: account.authUserId,
        email: account.email,
        name: account.name,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        outletKey: tenant.outletKey,
      },
      membership: {
        id: membership.id,
        role: membership.role as UserRole,
        status: membership.status,
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
      entitlements
    };
  } catch (error) {
    if (error instanceof AuthError) return null;
    throw error; // Let other unexpected errors bubble up
  }
}

// --- Authorization Guards ---

export async function requireTenantAccess() {
  const context = await getCurrentContext();
  if (!context) {
    throw new ForbiddenError('Unauthorized: Tenant context not found or access denied.');
  }
  return context;
}

export async function requireFeature(feature: FeatureKey) {
  const context = await requireTenantAccess();
  if (context.entitlements.isLocked || !context.entitlements.features.includes(feature)) {
    throw new FeatureLockedError(feature);
  }
  return context;
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, dashboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  dashboardId: string | null;
  restaurantName: string | null;
  isPaid: boolean;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  let result;
  try {
    result = await db
      .select({
        user: users,
        dashboard: dashboards,
      })
      .from(users)
      .leftJoin(dashboards, eq(users.dashboardId, dashboards.id))
      .where(eq(users.email, user.email))
      .limit(1);
  } catch (error) {
    console.error('Failed to query user profile and dashboard, falling back to null:', error);
    return null;
  }

  if (result.length === 0) {
    console.error('User profile not found in database for:', user.email);
    return null;
  }

  const data = result[0];

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    role: data.user.role as UserRole,
    dashboardId: data.user.dashboardId,
    restaurantName: data.dashboard?.name || null,
    isPaid: data.dashboard?.isPaid || false,
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

  // 1. Sign up the user in Supabase Auth
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
    // 2. Create the new dashboard/tenant
    const [newDashboard] = await db.insert(dashboards).values({
      name: restaurantName,
    }).returning();

    // 3. Create the user profile linked to the dashboard
    await db.insert(users).values({
      email,
      name,
      role: 'SUPERADMIN',
      dashboardId: newDashboard.id,
    });

    return { success: true };
  } catch (dbError: any) {
    console.error('Database error during sign up:', dbError);
    return { error: 'Failed to create user profile and dashboard' };
  }
}

export async function getDashboardDetailsByEmail(email: string) {
  try {
    const result = await db
      .select({
        user: users,
        dashboard: dashboards,
      })
      .from(users)
      .innerJoin(dashboards, eq(users.dashboardId, dashboards.id))
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      email: result[0].user.email,
      name: result[0].user.name,
      restaurantName: result[0].dashboard.name,
      isPaid: result[0].dashboard.isPaid,
    };
  } catch (error) {
    console.error('Failed to get dashboard details:', error);
    return null;
  }
}

export async function markDashboardAsPaidAction(email: string) {
  try {
    const userProfile = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userProfile.length === 0) {
      return { error: 'User not found' };
    }
    const dashboardId = userProfile[0].dashboardId;
    if (!dashboardId) {
      return { error: 'User does not have a dashboard' };
    }

    await db.update(dashboards).set({ isPaid: true }).where(eq(dashboards.id, dashboardId));
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark dashboard as paid:', error);
    return { error: error.message || 'Database error' };
  }
}



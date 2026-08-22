'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, dashboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type UserRole = 'CASHIER' | 'ADMIN' | 'SUPERADMIN';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  dashboardId: string;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  let userProfile;
  try {
    userProfile = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
  } catch (error) {
    console.error('Failed to query user profile, falling back to null:', error);
    return null;
  }

  if (userProfile.length === 0) {
    // If user exists in auth but not in db, we have a problem in the multi-tenant architecture
    // because they don't have a dashboard. We should not auto-create without a dashboard.
    console.error('User profile not found in database for:', user.email);
    return null;
  }

  return {
    id: userProfile[0].id,
    email: userProfile[0].email,
    name: userProfile[0].name,
    role: userProfile[0].role as UserRole,
    dashboardId: userProfile[0].dashboardId,
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


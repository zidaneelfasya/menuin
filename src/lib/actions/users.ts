'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

// Create a Supabase client with the service role key for admin operations
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is missing');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getUsers() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'SUPERADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    return { success: true, data: allUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function createUser(data: { name: string; email: string; password?: string; role: string }) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'SUPERADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const adminAuthClient = getAdminClient();

    // Create user in Supabase Auth, bypass email confirmation
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: data.email,
      password: data.password || 'password123', // Provide a default password if not specified
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user in Auth' };
    }

    // Insert user into Drizzle DB (Profile)
    await db.insert(users).values({
      dashboardId: currentUser.dashboardId,
      name: data.name,
      email: data.email,
      role: data.role || 'CASHIER',
    });

    revalidatePath('/users');
    return { success: true, message: 'User created successfully' };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

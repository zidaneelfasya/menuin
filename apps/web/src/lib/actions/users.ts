'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { memberships } from '@/lib/db/schema';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

// Create a Supabase client with the service role key or anon key for user creation
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getTenantUsers() {
  return { success: true, data: [] };
}

export async function createTenantUser(data: any) {
  return { success: false, error: 'Legacy users action disabled' };
}

export async function updateTenantUser(id: string, data: any) {
  return { success: false, error: 'Legacy users action disabled' };
}

export async function toggleTenantUserStatus(id: string, isActive: boolean) {
  return { success: false, error: 'Legacy users action disabled' };
}

export async function deleteTenantUser(id: string) {
  return { success: false, error: 'Legacy users action disabled' };
}

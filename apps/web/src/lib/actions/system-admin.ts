'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { tenants, transactions, transactionItems, products, categories } from '@/lib/db/schema';
import { desc, count, eq, inArray, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';


function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// -------------------------------------------------------------
// STATS & OVERVIEW
// -------------------------------------------------------------
export async function getSystemAdminStats() {
  throw new Error('Legacy system admin action disabled');
}

// -------------------------------------------------------------
// TENANTS CRUD
// -------------------------------------------------------------
export async function getSystemTenants() {
  throw new Error('Legacy system admin action disabled');
}

export async function createSystemTenant(data: any) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

export async function updateSystemTenant(id: string, data: any) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

export async function toggleTenantStatus(id: string, isPaid: boolean) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

export async function deleteSystemTenant(id: string) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

// -------------------------------------------------------------
// USERS CRUD
// -------------------------------------------------------------
export async function getSystemUsers() {
  throw new Error('Legacy system admin action disabled');
}

export async function createSystemUser(data: any) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

export async function updateSystemUser(id: string, data: any) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

export async function deleteSystemUser(id: string) {
  return { success: false, error: 'Legacy system admin action disabled' };
}

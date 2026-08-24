'use server';

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
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

export async function getUsers() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'SUPERADMIN' || !currentUser.dashboardId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const tenantUsers = await db
      .select()
      .from(users)
      .where(eq(users.dashboardId, currentUser.dashboardId))
      .orderBy(users.createdAt);
    return { success: true, data: tenantUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Gagal memuat data kasir toko' };
  }
}

export async function createUser(data: { name: string; email: string; password?: string }) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'SUPERADMIN' || !currentUser.dashboardId) {
    return { success: false, error: 'Hanya Super Admin yang dapat menambahkan kasir.' };
  }

  if (!data.name?.trim() || !data.email?.trim()) {
    return { success: false, error: 'Nama dan email kasir wajib diisi.' };
  }

  const password = data.password && data.password.length >= 6 ? data.password : 'password123';

  try {
    const supabaseClient = getAdminClient();
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasServiceRole) {
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: data.email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: { name: data.name.trim() },
      });

      if (authError) {
        // If already registered in auth, we can still link/update profile in DB if not occupied by another store's superadmin
        if (!authError.message.toLowerCase().includes('already') && !authError.message.toLowerCase().includes('registered')) {
          console.error('Supabase Auth Error:', authError);
          return { success: false, error: `Autentikasi gagal: ${authError.message}` };
        }
      }
    } else {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: data.email.trim(),
        password: password,
        options: {
          data: { name: data.name.trim() },
        },
      });

      if (authError) {
        if (!authError.message.toLowerCase().includes('already') && !authError.message.toLowerCase().includes('registered')) {
          console.error('Supabase Auth SignUp Error:', authError);
          return { success: false, error: `Autentikasi gagal: ${authError.message}` };
        }
      }
    }

    // Upsert user into Drizzle DB (Profile) tied directly to this tenant's dashboardId and CASHIER role
    const existingUser = await db.select().from(users).where(eq(users.email, data.email.trim())).limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        dashboardId: currentUser.dashboardId,
        name: data.name.trim(),
        email: data.email.trim(),
        role: 'CASHIER',
      });
    } else {
      // Check if user is a Super Admin of another tenant
      if (existingUser[0].role === 'SUPERADMIN' && existingUser[0].dashboardId !== currentUser.dashboardId) {
        return { success: false, error: 'Email ini sudah terdaftar sebagai Super Admin toko lain.' };
      }

      await db.update(users).set({
        name: data.name.trim(),
        role: 'CASHIER',
        dashboardId: currentUser.dashboardId,
        updatedAt: new Date(),
      }).where(eq(users.email, data.email.trim()));
    }

    revalidatePath('/users');
    return { success: true, message: 'Akun kasir berhasil disimpan dan terhubung ke toko Anda' };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message || 'Gagal menambahkan kasir' };
  }
}

export async function deleteUser(id: string) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== 'SUPERADMIN' || !currentUser.dashboardId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const targetUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.dashboardId, currentUser.dashboardId)))
      .limit(1);

    if (targetUser.length === 0) {
      return { success: false, error: 'Kasir tidak ditemukan' };
    }

    if (targetUser[0].role === 'SUPERADMIN') {
      return { success: false, error: 'Tidak dapat menghapus akun Super Admin toko' };
    }

    await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.dashboardId, currentUser.dashboardId)));

    revalidatePath('/users');
    return { success: true, message: 'Kasir berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'Gagal menghapus kasir' };
  }
}

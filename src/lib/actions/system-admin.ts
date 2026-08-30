'use server';

import { getCurrentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { users, tenants, transactions, transactionItems, products, categories } from '@/lib/db/schema';
import { desc, count, eq, inArray, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

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
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const allUsers = await db.select().from(users);
    const allTenants = await db.select().from(tenants);
    const allTransactions = await db.select({
      id: transactions.id,
      grandTotal: transactions.grandTotal,
    }).from(transactions);

    const totalDashboards = allTenants.length;
    const paidDashboards = allTenants.filter(t => t.isPaid).length;
    const freeDashboards = allTenants.filter(t => !t.isPaid).length;

    const totalUsers = allUsers.length;
    const systemAdminCount = allUsers.filter(u => u.role === 'SYSTEM_ADMIN').length;
    const superAdminCount = allUsers.filter(u => u.role === 'SUPERADMIN').length;
    const cashierCount = allUsers.filter(u => u.role === 'CASHIER').length;

    const totalTransactions = allTransactions.length;
    const totalRevenue = allTransactions.reduce((acc, curr) => acc + (parseFloat(curr.grandTotal) || 0), 0);

    // Recent registrations
    const recentDashboards = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    const recentUsersRaw = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        dashboardId: users.tenantId,
        dashboardName: tenants.name,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(desc(users.createdAt))
      .limit(5);

    return {
      totalDashboards,
      paidDashboards,
      freeDashboards,
      totalUsers,
      systemAdminCount,
      superAdminCount,
      cashierCount,
      totalTransactions,
      totalRevenue,
      recentDashboards,
      recentUsers: recentUsersRaw,
    };
  } catch (error) {
    console.error('Failed to get system admin stats:', error);
    throw new Error('Gagal memuat statistik platform');
  }
}

// -------------------------------------------------------------
// TENANTS CRUD
// -------------------------------------------------------------
export async function getSystemTenants() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const [allTenants, allUsers, allProducts] = await Promise.all([
      db.select().from(tenants).orderBy(desc(tenants.createdAt)),
      db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
      }).from(users),
      db.select({
        id: products.id,
        tenantId: products.tenantId,
      }).from(products),
    ]);

    return allTenants.map((t) => {
      const tenantUsers = allUsers.filter((u) => u.tenantId === t.id);
      const owner = tenantUsers.find((u) => u.role === 'SUPERADMIN') || tenantUsers[0];
      const productCount = allProducts.filter((p) => p.tenantId === t.id).length;

      return {
        ...t,
        ownerName: owner?.name || null,
        ownerEmail: owner?.email || null,
        userCount: tenantUsers.length,
        productCount,
      };
    });
  } catch (error) {
    console.error('Failed to load tenants:', error);
    throw new Error('Gagal memuat daftar tenant');
  }
}

export async function createSystemTenant(data: { name: string; isPaid?: boolean }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, error: 'Nama tenant / toko wajib diisi.' };
  }

  try {
    const [newDashboard] = await db
      .insert(tenants)
      .values({
        name: data.name.trim(),
        isPaid: Boolean(data.isPaid),
      })
      .returning();

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    return { success: true, message: 'Tenant berhasil dibuat.', data: newDashboard };
  } catch (error: any) {
    console.error('Failed to create tenant:', error);
    return { success: false, error: error.message || 'Gagal membuat tenant.' };
  }
}

export async function updateSystemTenant(id: string, data: { name: string; isPaid: boolean }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, error: 'Nama tenant / toko wajib diisi.' };
  }

  try {
    await db
      .update(tenants)
      .set({
        name: data.name.trim(),
        isPaid: Boolean(data.isPaid),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    return { success: true, message: 'Data tenant berhasil diperbarui.' };
  } catch (error: any) {
    console.error('Failed to update tenant:', error);
    return { success: false, error: error.message || 'Gagal memperbarui tenant.' };
  }
}

export async function toggleTenantStatus(id: string, isPaid: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db
      .update(tenants)
      .set({
        isPaid,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    return { success: true, message: `Status tenant diubah menjadi ${isPaid ? 'Paid' : 'Free Trial'}.` };
  } catch (error: any) {
    console.error('Failed to toggle tenant status:', error);
    return { success: false, error: error.message || 'Gagal mengubah status tenant.' };
  }
}

export async function deleteSystemTenant(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 1. Find transactions to clean up transactionItems
    const tenantTransactions = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.tenantId, id));

    const trxIds = tenantTransactions.map(t => t.id);
    if (trxIds.length > 0) {
      await db.delete(transactionItems).where(inArray(transactionItems.transactionId, trxIds));
      await db.delete(transactions).where(eq(transactions.tenantId, id));
    }

    // 2. Delete products & categories
    await db.delete(products).where(eq(products.tenantId, id));
    await db.delete(categories).where(eq(categories.tenantId, id));

    // 3. Unlink users or delete CASHIER users
    await db.delete(users).where(sql`${users.tenantId} = ${id} AND ${users.role} = 'CASHIER'`);
    await db.update(users).set({ tenantId: null, updatedAt: new Date() }).where(eq(users.tenantId, id));

    // 4. Delete the tenant itself
    await db.delete(tenants).where(eq(tenants.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    revalidatePath('/system-admin/users');
    return { success: true, message: 'Tenant dan seluruh data terkait berhasil dihapus.' };
  } catch (error: any) {
    console.error('Failed to delete tenant:', error);
    return { success: false, error: error.message || 'Gagal menghapus tenant.' };
  }
}

// -------------------------------------------------------------
// USERS CRUD
// -------------------------------------------------------------
export async function getSystemUsers() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        dashboardId: users.tenantId,
        dashboardName: tenants.name,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .orderBy(desc(users.createdAt));

    return usersList;
  } catch (error) {
    console.error('Failed to load users:', error);
    throw new Error('Gagal memuat data pengguna');
  }
}

export async function createSystemUser(data: {
  name: string;
  email: string;
  password?: string;
  role: 'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN';
  dashboardId?: string | null;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name?.trim() || !data.email?.trim()) {
    return { success: false, error: 'Nama dan email wajib diisi.' };
  }

  const password = data.password && data.password.length >= 6 ? data.password : 'password123';
  const targetDashboardId = data.role === 'SYSTEM_ADMIN' ? null : (data.dashboardId || null);

  try {
    const supabaseClient = getAdminClient();
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (hasServiceRole) {
      const { error: authError } = await supabaseClient.auth.admin.createUser({
        email: data.email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: { name: data.name.trim() },
      });

      if (authError) {
        if (!authError.message.toLowerCase().includes('already') && !authError.message.toLowerCase().includes('registered')) {
          console.error('Supabase Auth Error:', authError);
          return { success: false, error: `Autentikasi gagal: ${authError.message}` };
        }
      }
    } else {
      const { error: authError } = await supabaseClient.auth.signUp({
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

    // Upsert into DB
    const existing = await db.select().from(users).where(eq(users.email, data.email.trim())).limit(1);

    if (existing.length === 0) {
      await db.insert(users).values({
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role,
        tenantId: targetDashboardId,
      });
    } else {
      await db
        .update(users)
        .set({
          name: data.name.trim(),
          role: data.role,
          tenantId: targetDashboardId,
          updatedAt: new Date(),
        })
        .where(eq(users.email, data.email.trim()));
    }

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/users');
    return { success: true, message: `Akun ${data.name} berhasil dibuat.` };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return { success: false, error: error.message || 'Gagal membuat pengguna.' };
  }
}

export async function updateSystemUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: 'CASHIER' | 'SUPERADMIN' | 'SYSTEM_ADMIN';
    dashboardId?: string | null;
    password?: string;
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name?.trim() || !data.email?.trim()) {
    return { success: false, error: 'Nama dan email wajib diisi.' };
  }

  const targetDashboardId = data.role === 'SYSTEM_ADMIN' ? null : (data.dashboardId || null);

  try {
    // If password provided and service role available, update auth password
    if (data.password && data.password.trim().length >= 6) {
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (hasServiceRole) {
        const supabaseClient = getAdminClient();
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const foundAuth = authUsers?.users?.find(u => u.email?.toLowerCase() === data.email.trim().toLowerCase());
        if (foundAuth) {
          await supabaseClient.auth.admin.updateUserById(foundAuth.id, {
            password: data.password.trim(),
            user_metadata: { name: data.name.trim() },
          });
        }
      }
    }

    await db
      .update(users)
      .set({
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role,
        tenantId: targetDashboardId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/users');
    return { success: true, message: 'Data pengguna berhasil diperbarui.' };
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return { success: false, error: error.message || 'Gagal memperbarui pengguna.' };
  }
}

export async function deleteSystemUser(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  if (currentUser.id === id) {
    return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' };
  }

  try {
    const targetUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (targetUser.length === 0) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    await db.delete(users).where(eq(users.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/users');
    return { success: true, message: 'Pengguna berhasil dihapus.' };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengguna.' };
  }
}

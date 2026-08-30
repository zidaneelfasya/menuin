'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { users, tenants, transactions, products, transactionItems, categories } from '@/lib/db/schema';
import { desc, count, eq, sum, sql, inArray } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
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

// -------------------------------------------------------------
// STATS & OVERVIEW
// -------------------------------------------------------------
export async function getSystemAdminStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const [
      totalUsersRes,
      totalDashboardsRes,
      paidDashboardsRes,
      freeDashboardsRes,
      systemAdminCountRes,
      superAdminCountRes,
      cashierCountRes,
      totalTransactionsRes,
      totalRevenueRes,
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(tenants),
      db.select({ value: count() }).from(tenants).where(eq(tenants.isPaid, true)),
      db.select({ value: count() }).from(tenants).where(eq(tenants.isPaid, false)),
      db.select({ value: count() }).from(users).where(eq(users.role, 'SYSTEM_ADMIN')),
      db.select({ value: count() }).from(users).where(eq(users.role, 'SUPERADMIN')),
      db.select({ value: count() }).from(users).where(eq(users.role, 'CASHIER')),
      db.select({ value: count() }).from(transactions),
      db.select({ value: sum(transactions.grandTotal) }).from(transactions),
    ]);
    
    // Recent registrations
    const recentDashboards = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    const recentUsers = await db
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
      totalDashboards: Number(totalDashboardsRes[0]?.value || 0),
      paidDashboards: Number(paidDashboardsRes[0]?.value || 0),
      freeDashboards: Number(freeDashboardsRes[0]?.value || 0),
      totalUsers: Number(totalUsersRes[0]?.value || 0),
      systemAdminCount: Number(systemAdminCountRes[0]?.value || 0),
      superAdminCount: Number(superAdminCountRes[0]?.value || 0),
      cashierCount: Number(cashierCountRes[0]?.value || 0),
      totalTransactions: Number(totalTransactionsRes[0]?.value || 0),
      totalRevenue: Number(totalRevenueRes[0]?.value || 0),
      recentDashboards,
      recentUsers,
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
    const tenantsList = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        storefrontEnabled: tenants.storefrontEnabled,
        storeDescription: tenants.storeDescription,
        storeLogoUrl: tenants.storeLogoUrl,
        storeBannerUrl: tenants.storeBannerUrl,
        primaryColor: tenants.primaryColor,
        dineInEnabled: tenants.dineInEnabled,
        takeAwayEnabled: tenants.takeAwayEnabled,
        deliveryEnabled: tenants.deliveryEnabled,
        customerNameRequired: tenants.customerNameRequired,
        customerPhoneRequired: tenants.customerPhoneRequired,
        tableNumberRequired: tenants.tableNumberRequired,
        orderProcessType: tenants.orderProcessType,
        posKitchenSync: tenants.posKitchenSync,
        posRequireCustomer: tenants.posRequireCustomer,
        posOrderTypeSelection: tenants.posOrderTypeSelection,
        posTaxRate: tenants.posTaxRate,
        midtransServerKey: tenants.midtransServerKey,
        midtransClientKey: tenants.midtransClientKey,
        midtransEnvironment: tenants.midtransEnvironment,
        isPaid: tenants.isPaid,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        userCount: count(users.id),
        productCount: sql<number>`(SELECT count(*) FROM ${products} WHERE ${products.tenantId} = ${tenants.id})`.mapWith(Number),
      })
      .from(tenants)
      .leftJoin(users, eq(users.tenantId, tenants.id))
      .groupBy(tenants.id)
      .orderBy(desc(tenants.createdAt));
      
    return tenantsList;
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

    // 4. Delete the dashboard itself
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

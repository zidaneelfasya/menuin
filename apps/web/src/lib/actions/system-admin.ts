'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { accounts, memberships, tenants, transactions, transactionItems, products, categories } from '@/lib/db/schema';
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

export async function getSystemAdminStats() {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    throw new Error('Unauthorized');
  }

  try {
    const allAccounts = await db.select().from(accounts);
    const allMemberships = await db.select().from(memberships);
    const allTenants = await db.select().from(tenants);
    const allTransactions = await db.select({
      id: transactions.id,
      grandTotal: transactions.grandTotal,
    }).from(transactions);

    const totalDashboards = allTenants.length;
    const paidDashboards = allTenants.filter(t => t.subscriptionTier !== 'FREE').length;
    const freeDashboards = allTenants.filter(t => t.subscriptionTier === 'FREE').length;

    const totalUsers = allAccounts.length;
    const ownerCount = allMemberships.filter(m => m.role === 'OWNER').length;
    const managerCount = allMemberships.filter(m => m.role === 'MANAGER').length;
    const cashierCount = allMemberships.filter(m => m.role === 'CASHIER').length;
    const staffCount = allMemberships.filter(m => m.role === 'STAFF').length;

    const totalTransactions = allTransactions.length;
    const totalRevenue = allTransactions.reduce((acc, curr) => acc + (parseFloat(curr.grandTotal || '0') || 0), 0);

    // Recent registrations
    const recentDashboards = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    const recentUsersRaw = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: memberships.role,
        createdAt: accounts.createdAt,
        dashboardId: memberships.tenantId,
        dashboardName: tenants.name,
      })
      .from(accounts)
      .leftJoin(memberships, eq(accounts.id, memberships.accountId))
      .leftJoin(tenants, eq(memberships.tenantId, tenants.id))
      .orderBy(desc(accounts.createdAt))
      .limit(5);

    return {
      totalDashboards,
      paidDashboards,
      freeDashboards,
      totalUsers,
      ownerCount,
      managerCount,
      cashierCount,
      staffCount,
      systemAdminCount: 0,
      superAdminCount: ownerCount,
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

export async function getSystemTenants() {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    throw new Error('Unauthorized');
  }

  try {
    const tenantsList = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        subscriptionTier: tenants.subscriptionTier,
        isPaid: sql<boolean>`${tenants.subscriptionTier} != 'FREE'`,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    return tenantsList;
  } catch (error) {
    console.error('Failed to load tenants:', error);
    throw new Error('Gagal memuat data tenant');
  }
}

export async function createSystemTenant(data: {
  name: string;
  slug: string;
  isPaid?: boolean;
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO';
}) {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name?.trim() || !data.slug?.trim()) {
    return { success: false, error: 'Nama dan Slug tenant wajib diisi.' };
  }

  try {
    const existing = await db.select().from(tenants).where(eq(tenants.slug, data.slug.trim())).limit(1);
    if (existing.length > 0) {
      return { success: false, error: 'Slug sudah digunakan oleh tenant lain.' };
    }

    const tier = data.subscriptionTier || (data.isPaid ? 'PRO' : 'FREE');
    const outletKey = `OUTLET-${data.slug.trim().toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: data.name.trim(),
        slug: data.slug.trim(),
        outletKey,
        subscriptionTier: tier,
      })
      .returning();

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    return { success: true, message: 'Tenant berhasil dibuat.', tenant: newTenant };
  } catch (error: any) {
    console.error('Failed to create tenant:', error);
    return { success: false, error: error.message || 'Gagal membuat tenant.' };
  }
}

export async function updateSystemTenant(
  id: string,
  data: {
    name?: string;
    slug?: string;
    isPaid?: boolean;
    subscriptionTier?: 'FREE' | 'BASIC' | 'PRO';
  }
) {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    if (data.slug) {
      const existing = await db.select().from(tenants).where(eq(tenants.slug, data.slug.trim())).limit(1);
      if (existing.length > 0 && existing[0].id !== id) {
        return { success: false, error: 'Slug sudah digunakan oleh tenant lain.' };
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim();
    if (data.subscriptionTier !== undefined) {
      updateData.subscriptionTier = data.subscriptionTier;
    } else if (data.isPaid !== undefined) {
      updateData.subscriptionTier = data.isPaid ? 'PRO' : 'FREE';
    }

    await db.update(tenants).set(updateData).where(eq(tenants.id, id));

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
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const subscriptionTier = isPaid ? 'PRO' : 'FREE';
    await db.update(tenants).set({ subscriptionTier, updatedAt: new Date() }).where(eq(tenants.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/tenants');
    return { success: true, message: `Status langganan tenant berhasil diubah menjadi ${isPaid ? 'PAID' : 'FREE'}.` };
  } catch (error: any) {
    console.error('Failed to toggle tenant status:', error);
    return { success: false, error: error.message || 'Gagal mengubah status tenant.' };
  }
}

export async function deleteSystemTenant(id: string) {
  const user = await getCurrentUser();
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
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

    // 3. Delete memberships
    await db.delete(memberships).where(eq(memberships.tenantId, id));

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
  if (!user || (user.role as string) !== 'SYSTEM_ADMIN' && (user.role as string) !== 'OWNER') {
    throw new Error('Unauthorized');
  }

  try {
    const usersList = await db
      .select({
        id: accounts.id,
        email: accounts.email,
        name: accounts.name,
        role: memberships.role,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        dashboardId: memberships.tenantId,
        dashboardName: tenants.name,
      })
      .from(accounts)
      .leftJoin(memberships, eq(accounts.id, memberships.accountId))
      .leftJoin(tenants, eq(memberships.tenantId, tenants.id))
      .orderBy(desc(accounts.createdAt));

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
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';
  dashboardId?: string | null;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role as string) !== 'SYSTEM_ADMIN' && (currentUser.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name?.trim() || !data.email?.trim()) {
    return { success: false, error: 'Nama dan email wajib diisi.' };
  }

  const password = data.password && data.password.length >= 6 ? data.password : 'password123';
  const targetDashboardId = data.dashboardId || null;

  try {
    const supabaseClient = getAdminClient();
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    let authUserId: string | null = null;

    if (hasServiceRole) {
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
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
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
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
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    }

    // Upsert into accounts
    let account = await db.query.accounts?.findFirst({
      where: eq(accounts.email, data.email.trim()),
    });

    if (!account) {
      const [newAccount] = await db.insert(accounts).values({
        authUserId: authUserId || crypto.randomUUID(),
        name: data.name.trim(),
        email: data.email.trim(),
      }).returning();
      account = newAccount;
    }

    // Upsert membership if targetDashboardId is provided
    if (account && targetDashboardId) {
      const existingMembership = await db.select().from(memberships)
        .where(eq(memberships.accountId, account.id))
        .limit(1);

      if (existingMembership.length === 0) {
        await db.insert(memberships).values({
          accountId: account.id,
          tenantId: targetDashboardId,
          role: data.role || 'STAFF',
          displayName: data.name.trim(),
        });
      } else {
        await db.update(memberships).set({
          tenantId: targetDashboardId,
          role: data.role || 'STAFF',
          displayName: data.name.trim(),
          updatedAt: new Date(),
        }).where(eq(memberships.id, existingMembership[0].id));
      }
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
    role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF';
    dashboardId?: string | null;
    password?: string;
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role as string) !== 'SYSTEM_ADMIN' && (currentUser.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  if (!data.name?.trim() || !data.email?.trim()) {
    return { success: false, error: 'Nama dan email wajib diisi.' };
  }

  try {
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
      .update(accounts)
      .set({
        name: data.name.trim(),
        email: data.email.trim(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, id));

    if (data.dashboardId) {
      await db
        .update(memberships)
        .set({
          tenantId: data.dashboardId,
          role: data.role,
          updatedAt: new Date(),
        })
        .where(eq(memberships.accountId, id));
    }

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
  if (!currentUser || (currentUser.role as string) !== 'SYSTEM_ADMIN' && (currentUser.role as string) !== 'OWNER') {
    return { success: false, error: 'Unauthorized' };
  }

  if (currentUser.id === id) {
    return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' };
  }

  try {
    const targetAccount = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    if (targetAccount.length === 0) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    await db.delete(memberships).where(eq(memberships.accountId, id));
    await db.delete(accounts).where(eq(accounts.id, id));

    revalidatePath('/system-admin');
    revalidatePath('/system-admin/users');
    return { success: true, message: 'Pengguna berhasil dihapus.' };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return { success: false, error: error.message || 'Gagal menghapus pengguna.' };
  }
}

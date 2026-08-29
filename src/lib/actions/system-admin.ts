'use server';

import { getCurrentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { users, tenants } from '@/lib/db/schema';
import { desc, count } from 'drizzle-orm';

export async function getSystemAdminStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const totalUsers = await db.select({ value: count() }).from(users);
    const totalDashboards = await db.select({ value: count() }).from(tenants);
    
    // Recent registrations
    const recentDashboards = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(5);

    return {
      totalUsers: totalUsers[0].value,
      totalDashboards: totalDashboards[0].value,
      recentDashboards,
    };
  } catch (error) {
    console.error('Failed to get system admin stats:', error);
    throw new Error('Failed to load stats');
  }
}

export async function getSystemTenants() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    const tenantsList = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));
      
    return tenantsList;
  } catch (error) {
    console.error('Failed to load tenants:', error);
    throw new Error('Failed to load tenants');
  }
}

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
        tenantId: users.tenantId,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
      
    return usersList;
  } catch (error) {
    console.error('Failed to load users:', error);
    throw new Error('Failed to load users');
  }
}

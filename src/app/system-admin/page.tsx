import { getSystemAdminStats, getSystemTenants } from '@/lib/actions/system-admin';
import { DashboardClient } from './dashboard-client';
import { connection } from 'next/server';

export default async function SystemAdminDashboard() {
  await connection();
  const [stats, tenants] = await Promise.all([
    getSystemAdminStats(),
    getSystemTenants(),
  ]);

  const tenantOptions = tenants.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <DashboardClient stats={stats} tenants={tenantOptions} />
  );
}

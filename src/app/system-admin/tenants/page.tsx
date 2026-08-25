import { getSystemTenants } from '@/lib/actions/system-admin';
import { TenantsClient } from './tenants-client';
import { connection } from 'next/server';

export default async function TenantsPage() {
  await connection();
  const tenants = await getSystemTenants();

  return <TenantsClient initialTenants={tenants} />;
}

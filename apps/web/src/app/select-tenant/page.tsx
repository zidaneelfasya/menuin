import { getAvailableTenants } from '@/lib/actions/auth';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';
import { SelectTenantClient } from './select-tenant-client';

export const metadata = {
  title: 'Pilih Outlet - MENUIN',
  description: 'Pilih restoran untuk masuk ke dashboard atau buat baru.',
};

export default async function SelectTenantPage() {
  const account = await getAuthenticatedAccount().catch(() => null);
  const tenants = await getAvailableTenants();

  return (
    <SelectTenantClient 
      account={account ? { id: account.id, email: account.email, name: account.name } : null}
      tenants={tenants}
    />
  );
}

import { Metadata } from 'next';
import { getAuthenticatedAccount } from '@/lib/actions/auth-context';
import { redirect } from 'next/navigation';
import { CreateTenantClient } from './create-tenant-client';

export const metadata: Metadata = {
  title: 'Daftarkan Cabang Baru - MENUIN',
  description: 'Daftarkan cabang atau restoran baru untuk masuk ke dashboard Menuin.',
};

export default async function CreateTenantPage() {
  const account = await getAuthenticatedAccount().catch(() => null);
  if (!account) redirect('/auth/login');

  const isAdmin = ['SYSTEM_ADMIN', 'SUPERADMIN', 'VERIFICATION_ADMIN'].includes(
    account.systemRole as string
  );

  return (
    <CreateTenantClient
      account={account ? { id: account.id, email: account.email, name: account.name } : null}
      isAdmin={isAdmin}
    />
  );
}

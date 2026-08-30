import { getSystemUsers, getSystemTenants } from '@/lib/actions/system-admin';
import { getCurrentUser } from '@/lib/actions/auth';
import { UsersClient } from './users-client';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  await connection();
  const [usersList, tenants, currentUser] = await Promise.all([
    getSystemUsers(),
    getSystemTenants(),
    getCurrentUser(),
  ]);

  if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') {
    redirect('/auth/login');
  }

  const tenantOptions = tenants.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <UsersClient 
      initialUsers={usersList} 
      tenants={tenantOptions} 
      currentUserId={currentUser.id} 
    />
  );
}

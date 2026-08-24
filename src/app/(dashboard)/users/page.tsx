import { Metadata } from 'next';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { getUsers } from '@/lib/actions/users';
import { UsersList } from './users-list';

export const metadata: Metadata = { title: 'Kasir Toko - POS' };

async function UsersDataWrapper() {
  const user = await getCurrentUser();
  if (user?.role !== 'SUPERADMIN') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-6 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground text-sm">Halaman ini khusus untuk Super Admin toko.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getUsers();
  const allUsers = result.success && result.data ? result.data : [];
  return <UsersList initialData={allUsers} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <UsersDataWrapper />
    </Suspense>
  );
}


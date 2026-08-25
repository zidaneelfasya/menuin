import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { AdminLayoutShell } from './admin-layout-shell';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { connection } from 'next/server';

async function SystemAdminWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();

  if (!user || user.role !== 'SYSTEM_ADMIN') {
    redirect('/auth/login');
  }

  return (
    <AdminLayoutShell user={user}>
      {children}
    </AdminLayoutShell>
  );
}

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Memuat portal System Admin...</p>
        </div>
      }
    >
      <SystemAdminWrapper>{children}</SystemAdminWrapper>
    </Suspense>
  );
}

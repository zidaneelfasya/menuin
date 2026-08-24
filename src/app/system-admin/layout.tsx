import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { Sidebar } from './sidebar';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

async function SystemAdminWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'SYSTEM_ADMIN') {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto md:ml-[260px]">
        {children}
      </main>
    </div>
  );
}

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Memuat sesi...</p>
      </div>
    }>
      <SystemAdminWrapper>{children}</SystemAdminWrapper>
    </Suspense>
  );
}

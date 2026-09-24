export const dynamic = 'force-dynamic';
import { MainLayout } from '@/components/layout/main-layout';
import { PaymentGate } from '@/components/payment-gate';
import { getCurrentUser, getAvailableTenants } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { connection } from 'next/server';

async function AuthWrapper({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    // Determine if they are globally logged in but missing a tenant context
    let account = null;
    try {
      const { getAuthenticatedAccount } = await import('@/lib/actions/auth-context');
      account = await getAuthenticatedAccount();
    } catch (e) {
      // AuthError will be thrown if not logged in at all
    }

    if (account) {
      redirect('/select-tenant');
    } else {
      redirect('/auth/login');
    }
  }

  if (user.role === 'STAFF') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold text-destructive">Akses Ditolak</h1>
          <p className="text-muted-foreground">Akun Staff tidak memiliki izin untuk mengakses Dashboard Web. Silakan gunakan Aplikasi POS untuk melakukan operasional.</p>
        </div>
      </div>
    );
  }

  const availableTenants = await getAvailableTenants();
  
  // The dashboard structure is accessible even without a subscription,
  // individual features will be locked via requireFeature() guards and error boundaries.
  return <MainLayout user={user} availableTenants={availableTenants}>{children}</MainLayout>;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Memuat sesi...</p>
      </div>
    }>
      <AuthWrapper>{children}</AuthWrapper>
    </Suspense>
  );
}

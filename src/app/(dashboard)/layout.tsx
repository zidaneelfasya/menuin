import { MainLayout } from '@/components/layout/main-layout';
import { PaymentGate } from '@/components/payment-gate';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { connection } from 'next/server';

async function AuthWrapper({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  if (user.role === 'SYSTEM_ADMIN') {
    redirect('/system-admin');
  }

  // Dashboard terkunci sampai pembayaran selesai
  if (!user.isPaid) {
    return <PaymentGate user={user} />;
  }

  return <MainLayout user={user}>{children}</MainLayout>;
}

export default function DashboardLayout({
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
      <AuthWrapper>{children}</AuthWrapper>
    </Suspense>
  );
}

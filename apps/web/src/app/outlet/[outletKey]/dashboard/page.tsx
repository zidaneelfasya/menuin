import { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { PaymentGate } from '@/components/payment-gate';
import { getReportsOverview } from '@/lib/actions/reports';
import { DashboardOverviewClient } from '@/features/dashboard/components/dashboard-overview-client';
import { DashboardSkeleton } from '@/features/dashboard/components/dashboard-skeleton';

type Props = {
  params: Promise<{ outletKey: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { outletKey } = await params;
  return {
    title: 'Dashboard Outlet - MENUIN',
    description: 'Pusat analytics, monitoring operasional, dan performa bisnis outlet cabang di MENUIN.',
  };
}

async function DashboardDataWrapper({ params }: Props) {
  await connection();
  const { outletKey } = await params;
  const user = await getCurrentUser();

  if (!user || !user.isPaid) {
    return <PaymentGate user={user!} />;
  }

  const res = await getReportsOverview(outletKey, { period: 'this_month' });

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-none shadow-sm-md">
        {res.error || 'Gagal memuat dashboard outlet.'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <DashboardOverviewClient initialData={res.data} outletKey={outletKey} />
    </div>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataWrapper params={params} />
    </Suspense>
  );
}

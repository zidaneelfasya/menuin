import { DashboardPage } from '@/features/dashboard/components/dashboard-page';
import { PaymentGate } from '@/components/payment-gate';
import { getCurrentUser } from '@/lib/actions/auth';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getOutletDashboardData } from '@/lib/actions/dashboard';
import { connection } from 'next/server';

type Props = {
  params: Promise<{ outletKey: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { outletKey } = await params;
  return {
    title: `Dashboard Outlet - MENUIN`,
    description: `Pusat analytics dan monitoring operasional outlet cabang di MENUIN.`,
  };
}

async function DashboardDataWrapper({ params, searchParams }: Props) {
  await connection();
  const { outletKey } = await params;
  const user = await getCurrentUser();

  if (!user || !user.isPaid) {
    return <PaymentGate user={user!} />;
  }

  const resolvedSearchParams = await searchParams;
  const tab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined;
  const preset = typeof resolvedSearchParams.preset === 'string' ? resolvedSearchParams.preset : undefined;
  const from = typeof resolvedSearchParams.from === 'string' ? resolvedSearchParams.from : undefined;
  const to = typeof resolvedSearchParams.to === 'string' ? resolvedSearchParams.to : undefined;
  const month = typeof resolvedSearchParams.month === 'string' ? resolvedSearchParams.month : undefined;
  const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined;

  const dashboardData = await getOutletDashboardData(outletKey, {
    tab,
    preset,
    from,
    to,
    month,
    year,
  });

  if (!dashboardData.success) {
    return (
      <div className="p-12 text-center space-y-3 bg-white border border-gray-200/80 rounded-xl shadow-sm my-8">
        <h2 className="text-xl font-bold text-gray-900">Gagal Memuat Dashboard Outlet</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {dashboardData.error || 'Outlet tidak ditemukan atau Anda tidak memiliki akses ke cabang ini.'}
        </p>
      </div>
    );
  }

  return (
    <DashboardPage 
      data={dashboardData}
      outletKey={outletKey}
    />
  );
}

export default function Page({ params, searchParams }: Props) {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-44 bg-gray-100 rounded-xl" />
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-gray-100 rounded-xl" />
          <div className="lg:col-span-1 h-72 bg-gray-100 rounded-xl" />
        </div>
      </div>
    }>
      <DashboardDataWrapper params={params} searchParams={searchParams} />
    </Suspense>
  );
}

import { Metadata } from 'next';
import { getSubAccountOverviewAction } from '@/lib/actions/admin-payments';
import { AdminSubAccountClient } from './admin-sub-account-client';

export const metadata: Metadata = {
  title: 'Akun Pembayaran Outlet - Menuin Admin',
};

type Props = {
  searchParams: Promise<{ status?: string; search?: string }>;
};

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await getSubAccountOverviewAction({ filter: params.status, search: params.search });

  if (!data.success) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center space-y-2">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Akses Ditolak</h2>
          <p className="text-xs text-neutral-500">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <AdminSubAccountClient
        rows={data.rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }))}
        counts={data.counts}
        initialStatus={params.status || 'ALL'}
      />
    </div>
  );
}

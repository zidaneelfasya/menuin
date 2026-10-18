import { Metadata } from 'next';
import { getVerificationQueue } from '@/lib/actions/admin-verification';
import { AdminVerificationQueueClient } from './admin-verification-queue-client';

export const metadata: Metadata = {
  title: 'Antrean Verifikasi Kepatuhan - Menuin Admin',
};

type Props = {
  searchParams: Promise<{
    status?: string;
    scope?: string;
    search?: string;
  }>;
};

export default async function AdminVerificationQueuePage({ searchParams }: Props) {
  const params = await searchParams;
  const initialData = await getVerificationQueue({
    status: params.status || 'ALL',
    scope: (params.scope as any) || 'ALL',
    search: params.search || '',
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <AdminVerificationQueueClient
        initialQueue={initialData.queue}
        initialCounts={initialData.counts}
        initialStatus={params.status || 'ALL'}
        initialScope={params.scope || 'ALL'}
        initialSearch={params.search || ''}
      />
    </div>
  );
}

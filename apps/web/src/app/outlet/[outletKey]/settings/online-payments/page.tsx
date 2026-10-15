import { Metadata } from 'next';
import { connection } from 'next/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { getOnlinePayments } from '@/lib/actions/online-payments';
import { OnlinePaymentsClient } from './online-payments-client';

export const metadata: Metadata = {
  title: 'Transaksi Online - Menuin',
};

type Props = { searchParams: Promise<{ view?: string }> };

export default async function OnlinePaymentsPage({ searchParams }: Props) {
  await connection();
  const { view } = await searchParams;
  const filter = view === 'all' ? 'ALL' : 'REVIEW';
  const [user, result] = await Promise.all([getCurrentUser(), getOnlinePayments(filter)]);

  if (!result.success) {
    return (
      <div className="bg-card border border-border/70 rounded-2xl p-6 text-sm text-muted-foreground">
        {result.error}
      </div>
    );
  }

  return (
    <OnlinePaymentsClient
      view={filter}
      rows={result.rows.map((r) => ({
        ...r,
        paidAt: r.paidAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        settledAt: r.settledAt?.toISOString() ?? null,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      }))}
      reviewCount={result.reviewCount}
      canImportSettlement={user?.role === 'OWNER' || (user?.role as string) === 'SYSTEM_ADMIN'}
    />
  );
}

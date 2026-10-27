import { TransactionHistory } from '@/features/transactions/components/transaction-history';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTransactions } from '@/lib/actions/transactions';
import TransactionsLoading from './loading';

export const metadata: Metadata = { title: 'Riwayat Transaksi - Menuin' };

async function TransactionDataWrapper() {
  const result = await getTransactions({ page: 1, limit: 25, timeRange: 'this_month' });
  const transactions = result.success && result.data ? (result.data as any) : [];
  return (
    <TransactionHistory 
      initialData={transactions} 
      initialSummary={result.success ? result.summary : undefined}
      initialStatusCounts={result.success ? result.statusCounts : undefined}
      initialPagination={result.success ? result.pagination : undefined}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TransactionsLoading />}>
      <TransactionDataWrapper />
    </Suspense>
  );
}

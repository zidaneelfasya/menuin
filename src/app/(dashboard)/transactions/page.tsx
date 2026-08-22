import { TransactionHistory } from '@/features/transactions/components/transaction-history';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getTransactions } from '@/lib/actions/transactions';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const metadata: Metadata = { title: 'Riwayat Transaksi - Bolu Anisa POS' };

async function TransactionDataWrapper() {
  const result = await getTransactions();
  const transactions = result.success && result.data ? result.data : [];
  return <TransactionHistory initialData={transactions} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <TransactionDataWrapper />
    </Suspense>
  );
}

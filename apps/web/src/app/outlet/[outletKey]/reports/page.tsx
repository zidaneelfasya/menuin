import { Metadata } from 'next';
import { requireFeature } from '@/lib/actions/auth-context';
import { getFinancialReportData } from '@/lib/actions/finance';
import { FinanceClient } from '../finance/finance-client';

export const metadata: Metadata = { 
  title: 'Laporan Penjualan & Keuangan - Menuin POS' 
};

export default async function Page() {
  await requireFeature('REPORTS');
  const res = await getFinancialReportData({ period: 'this_month' });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <FinanceClient initialData={res.data} />
    </div>
  );
}

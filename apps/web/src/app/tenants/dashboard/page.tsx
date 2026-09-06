import { DashboardPage } from '@/features/dashboard/components/dashboard-page';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { 
  getDashboardMetrics, 
  getSalesChartData, 
  getTopSellingProducts, 
  getLowStockProducts,
  getRecentTransactions
} from '@/lib/actions/dashboard';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Dashboard Eksekutif - Bolu Anisa POS',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function DashboardDataWrapper({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const tab = typeof params.tab === 'string' ? params.tab : 'harian';
  
  let startDate = new Date();
  let endDate = new Date();
  let groupBy: 'day' | 'month' | 'year' = 'day';

  if (tab === 'harian') {
    const fromStr = typeof params.from === 'string' ? params.from : undefined;
    const toStr = typeof params.to === 'string' ? params.to : undefined;

    if (fromStr) {
      startDate = new Date(fromStr);
    }
    startDate.setHours(0, 0, 0, 0);

    if (toStr) {
      endDate = new Date(toStr);
    }
    endDate.setHours(23, 59, 59, 999);
    groupBy = 'day';

  } else if (tab === 'bulanan') {
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    groupBy = 'day'; // Tampilkan data per hari selama sebulan itu
  } else if (tab === 'tahunan') {
    startDate = new Date(startDate.getFullYear(), 0, 1);
    endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    groupBy = 'month'; // Tampilkan data per bulan selama setahun
  }

  const [metricsRes, chartRes, topProductsRes, lowStockRes, recentTxRes] = await Promise.all([
    getDashboardMetrics(startDate, endDate),
    getSalesChartData(startDate, endDate, groupBy),
    getTopSellingProducts(startDate, endDate),
    getLowStockProducts(),
    getRecentTransactions(5)
  ]);

  const metrics = metricsRes.success && metricsRes.data ? metricsRes.data : {
    totalTransactions: 0, totalOmzet: 0, totalLaba: 0, totalProduk: 0
  };
  
  const chartData = chartRes.success && chartRes.data ? chartRes.data : [];
  const topProducts = topProductsRes.success && topProductsRes.data ? topProductsRes.data : [];
  const lowStockProducts = lowStockRes.success && lowStockRes.data ? lowStockRes.data : [];
  const recentTransactions = recentTxRes.success && recentTxRes.data ? recentTxRes.data : [];

  return (
    <DashboardPage 
      metrics={metrics}
      chartData={chartData}
      topProducts={topProducts}
      lowStockProducts={lowStockProducts}
      recentTransactions={recentTransactions}
      tab={tab}
    />
  );
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <DashboardDataWrapper searchParams={searchParams} />
    </Suspense>
  );
}

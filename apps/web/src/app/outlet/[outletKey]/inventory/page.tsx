import { InventoryList } from '@/features/inventory/components/inventory-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { getStockMovements, getStockDistributionSummary } from '@/lib/actions/inventory';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { requireFeature } from '@/lib/actions/auth-context';

export const metadata: Metadata = { title: 'Manajemen Stok & Distribusi - Menuin' };

async function InventoryDataWrapper() {
  await requireFeature('INVENTORY');
  const user = await getCurrentUser();
  if (user?.role === 'CASHIER') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-6 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground text-sm">
              Halaman ini tidak bisa dibuka oleh peran Anda. Silakan hubungi admin jika Anda membutuhkan akses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [productsResult, movementsResult, summaryResult] = await Promise.all([
    getProducts(),
    getStockMovements({ limit: 200 }),
    getStockDistributionSummary(),
  ]);

  const products = productsResult.success && productsResult.data ? productsResult.data : [];
  const movements = movementsResult.success && movementsResult.data ? movementsResult.data : [];
  const summary = summaryResult.success && summaryResult.data ? summaryResult.data : undefined;

  return (
    <div className="p-6">
      <InventoryList
        initialData={products}
        initialMovements={movements}
        summary={summary}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <InventoryDataWrapper />
    </Suspense>
  );
}

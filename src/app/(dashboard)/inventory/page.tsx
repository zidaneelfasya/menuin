import { InventoryList } from '@/features/inventory/components/inventory-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { getCurrentUser } from '@/lib/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = { title: 'Stok - Bolu Anisa POS' };

async function InventoryDataWrapper() {
  const user = await getCurrentUser();
  if (user?.role === 'CASHIER') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-6 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground text-sm">Halaman ini tidak bisa dibuka oleh peran Anda. Silakan hubungi admin jika Anda membutuhkan akses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getProducts();
  const products = result.success && result.data ? result.data : [];
  return <InventoryList initialData={products} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <InventoryDataWrapper />
    </Suspense>
  );
}

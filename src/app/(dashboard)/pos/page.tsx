import { POSPage } from '@/features/pos/components/pos-page';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { getCategories } from '@/lib/actions/categories';
import { POSSkeleton } from '@/features/pos/components/pos-skeleton';

export const metadata: Metadata = {
  title: 'Kasir - Bolu Anisa POS',
};

async function POSDataWrapper() {
  const [productsResult, categoriesResult] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const products = productsResult.success && productsResult.data ? productsResult.data : [];
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return <POSPage initialProducts={products} initialCategories={categories} />;
}

export default function Page() {
  return (
    <Suspense fallback={<POSSkeleton />}>
      <POSDataWrapper />
    </Suspense>
  );
}

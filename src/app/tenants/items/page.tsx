import { ProductList } from '@/features/products/components/product-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { getCategories } from '@/lib/actions/categories';
import { getModifierGroups } from '@/lib/actions/modifiers';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const metadata: Metadata = {
  title: 'Item - Bolu Anisa POS',
};

async function ProductsDataWrapper() {
  const [productsResult, categoriesResult, modifierGroupsResult] = await Promise.all([
    getProducts(),
    getCategories(),
    getModifierGroups(),
  ]);

  const products = productsResult.success && productsResult.data ? productsResult.data : [];
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const modifierGroups = modifierGroupsResult.success && modifierGroupsResult.data ? modifierGroupsResult.data : [];

  return <ProductList initialData={products} categories={categories} modifierGroups={modifierGroups} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <ProductsDataWrapper />
    </Suspense>
  );
}

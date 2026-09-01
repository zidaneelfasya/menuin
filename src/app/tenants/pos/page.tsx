import { POSPage } from '@/features/pos/components/pos-page';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { getCategories } from '@/lib/actions/categories';
import { getModifierGroups } from '@/lib/actions/modifiers';
import { POSSkeleton } from '@/features/pos/components/pos-skeleton';

export const metadata: Metadata = {
  title: 'Kasir - Bolu Anisa POS',
};

import { getTenantCatalogSettings } from '@/lib/actions/catalog';

async function POSDataWrapper() {
  const [productsResult, categoriesResult, tenantSettings, modifiersResult] = await Promise.all([
    getProducts(),
    getCategories(),
    getTenantCatalogSettings(),
    getModifierGroups(),
  ]);

  const products = productsResult.success && productsResult.data ? productsResult.data : [];
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const modifierGroups = modifiersResult.success && modifiersResult.data ? modifiersResult.data : [];

  return <POSPage initialProducts={products} initialCategories={categories} posSettings={tenantSettings} modifierGroups={modifierGroups} />;
}

export default function Page() {
  return (
    <Suspense fallback={<POSSkeleton />}>
      <POSDataWrapper />
    </Suspense>
  );
}

import { POSPage } from '@/features/pos/components/pos-page';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts } from '@/lib/actions/products';
import { getCategories } from '@/lib/actions/categories';
import { getModifierGroups } from '@/lib/actions/modifiers';
import { POSSkeleton } from '@/features/pos/components/pos-skeleton';

export const metadata: Metadata = {
  title: 'Kasir - Menuin',
};

import { getTenantCatalogSettings } from '@/lib/actions/catalog';
import { getActiveShift } from '@/lib/actions/shifts';
import { requireFeature } from '@/lib/actions/auth-context';
import { getPosQrisAvailability } from '@/lib/actions/pos-qris';

async function POSDataWrapper() {
  await requireFeature('POS');
  const [productsResult, categoriesResult, tenantSettings, modifiersResult, activeShiftResult, qrisDynamicEnabled] = await Promise.all([
    getProducts(),
    getCategories(),
    getTenantCatalogSettings(),
    getModifierGroups(),
    getActiveShift(),
    getPosQrisAvailability(),
  ]);

  const products = productsResult.success && productsResult.data ? productsResult.data : [];
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];
  const modifierGroups = modifiersResult.success && modifiersResult.data ? modifiersResult.data : [];
  const activeShift = activeShiftResult.success ? activeShiftResult.data : null;

  return <POSPage initialProducts={products} initialCategories={categories} posSettings={{ ...tenantSettings, qrisDynamicEnabled }} modifierGroups={modifierGroups} activeShift={activeShift} />;
}

export default function Page() {
  return (
    <Suspense fallback={<POSSkeleton />}>
      <POSDataWrapper />
    </Suspense>
  );
}

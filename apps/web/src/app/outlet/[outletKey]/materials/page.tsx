import { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { requireFeature } from '@/lib/actions/auth-context';
import { getRawMaterials, getRawMaterialCategories } from '@/lib/actions/materials';
import { MaterialList } from '@/features/materials/components/material-list';
import MaterialsLoading from './loading';

export const metadata: Metadata = {
  title: 'Stok Bahan - Menuin',
  description: 'Manajemen persediaan bahan baku, mutasi stok, dan audit log keluar-masuk',
};

async function MaterialsDataWrapper() {
  await connection();
  await requireFeature('INVENTORY');

  const [materialsResult, categoriesResult] = await Promise.all([
    getRawMaterials(),
    getRawMaterialCategories(),
  ]);

  const materials = materialsResult.success && materialsResult.data ? materialsResult.data : [];
  const counts = materialsResult.counts || { total: 0, safe: 0, lowStock: 0, outOfStock: 0 };
  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return (
    <MaterialList
      initialData={materials}
      initialCounts={counts}
      categories={categories}
    />
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<MaterialsLoading />}>
      <MaterialsDataWrapper />
    </Suspense>
  );
}

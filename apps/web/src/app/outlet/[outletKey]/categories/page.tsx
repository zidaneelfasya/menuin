import { CategoryList } from '@/features/categories/components/category-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories } from '@/lib/actions/categories';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const metadata: Metadata = { title: 'Kategori - Menuin' };

import { connection } from "next/server";
import { requireFeature } from '@/lib/actions/auth-context';

async function CategoryDataWrapper() {
  await connection();
  await requireFeature('CATALOG');
  const result = await getCategories();
  const categories = result.success && result.data ? result.data : [];
  return <CategoryList initialData={categories} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <CategoryDataWrapper />
    </Suspense>
  );
}

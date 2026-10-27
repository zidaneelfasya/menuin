import { CategoryList } from '@/features/categories/components/category-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories } from '@/lib/actions/categories';
import CategoriesLoading from './loading';
import { connection } from "next/server";
import { requireFeature } from '@/lib/actions/auth-context';

export const metadata: Metadata = { title: 'Kategori - Menuin' };

async function CategoryDataWrapper() {
  await connection();
  await requireFeature('CATALOG');
  const result = await getCategories();
  const categories = result.success && result.data ? result.data : [];
  return <CategoryList initialData={categories} />;
}

export default function Page() {
  return (
    <Suspense fallback={<CategoriesLoading />}>
      <CategoryDataWrapper />
    </Suspense>
  );
}

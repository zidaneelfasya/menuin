import { ModifierList } from '@/features/modifiers/components/modifier-list';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { getModifierGroups } from '@/lib/actions/modifiers';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { connection } from "next/server";

export const metadata: Metadata = { title: 'Modifiers - POS' };

async function ModifierDataWrapper() {
  await connection();
  const result = await getModifierGroups();
  const groups = result.success && result.data ? result.data : [];
  return <ModifierList initialData={groups} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <ModifierDataWrapper />
    </Suspense>
  );
}

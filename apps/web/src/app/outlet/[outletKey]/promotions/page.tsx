import { Metadata } from 'next';
import { Suspense } from 'react';
import { getPromotions } from '@/lib/actions/promotions';
import { PromotionsClient } from './promotions-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const metadata: Metadata = {
  title: 'Manajemen Promo & Diskon - Bolu Anisa POS',
};

async function PromotionsDataWrapper() {
  const result = await getPromotions();
  const promotions = result.success && result.data ? (result.data as any) : [];
  return <PromotionsClient initialPromotions={promotions} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><TableSkeleton /></div>}>
      <PromotionsDataWrapper />
    </Suspense>
  );
}

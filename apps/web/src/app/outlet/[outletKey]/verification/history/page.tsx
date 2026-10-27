import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { HistoryClient } from './history-client';

import { Suspense } from 'react';
import VerificationLoading from '../loading';

export const metadata: Metadata = {
  title: 'Riwayat Pengajuan - Verifikasi Bisnis - MENUIN',
  description: 'Jejak audit pengajuan verifikasi legalitas dan kepatuhan gerai fisik.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

async function HistoryContent({ outletKey }: { outletKey: string }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) notFound();

  return <HistoryClient outletKey={outletKey} data={data} />;
}

export default async function Page({ params }: Props) {
  const { outletKey } = await params;

  return (
    <Suspense fallback={<VerificationLoading />}>
      <HistoryContent outletKey={outletKey} />
    </Suspense>
  );
}

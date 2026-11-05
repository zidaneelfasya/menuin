import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { OutletClient } from './outlet-client';

import { Suspense } from 'react';
import VerificationLoading from '../loading';

export const metadata: Metadata = {
  title: 'Lokasi & Gerai Fisik - Verifikasi Bisnis - MENUIN',
  description: 'Verifikasi keberadaan fisik cabang outlet untuk kepatuhan regulasi penerbitan QRIS.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

async function OutletContent({ outletKey }: { outletKey: string }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) notFound();

  return <OutletClient outletKey={outletKey} data={data} />;
}

export default async function Page({ params }: Props) {
  const { outletKey } = await params;

  return (
    <Suspense fallback={<VerificationLoading />}>
      <OutletContent outletKey={outletKey} />
    </Suspense>
  );
}

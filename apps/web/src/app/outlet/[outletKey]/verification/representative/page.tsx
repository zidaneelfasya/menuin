import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { RepresentativeClient } from './representative-client';

import { Suspense } from 'react';
import VerificationLoading from '../loading';

export const metadata: Metadata = {
  title: 'Perwakilan Bisnis - Verifikasi Bisnis - MENUIN',
  description: 'Data identitas penanggung jawab akun dan pencairan dana usaha.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

async function RepresentativeContent({ outletKey }: { outletKey: string }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) notFound();

  return <RepresentativeClient outletKey={outletKey} data={data} />;
}

export default async function Page({ params }: Props) {
  const { outletKey } = await params;

  return (
    <Suspense fallback={<VerificationLoading />}>
      <RepresentativeContent outletKey={outletKey} />
    </Suspense>
  );
}

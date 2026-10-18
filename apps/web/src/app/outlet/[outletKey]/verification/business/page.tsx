import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { BusinessClient } from './business-client';

export const metadata: Metadata = {
  title: 'Profil Usaha - Verifikasi Bisnis - MENUIN',
  description: 'Legalitas badan usaha dan izin berusaha yang terdaftar di Menuin.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

export default async function Page({ params }: Props) {
  const { outletKey } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) notFound();

  return <BusinessClient outletKey={outletKey} data={data} />;
}

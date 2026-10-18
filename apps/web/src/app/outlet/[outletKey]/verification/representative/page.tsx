import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { RepresentativeClient } from './representative-client';

export const metadata: Metadata = {
  title: 'Perwakilan Bisnis - Verifikasi Bisnis - MENUIN',
  description: 'Data identitas penanggung jawab akun dan pencairan dana usaha.',
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

  return <RepresentativeClient outletKey={outletKey} data={data} />;
}

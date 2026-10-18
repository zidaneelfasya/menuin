import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { SettlementClient } from './settlement-client';

export const metadata: Metadata = {
  title: 'Rekening Settlement - Verifikasi Bisnis - MENUIN',
  description: 'Daftar rekening bank penampungan pencairan dana transaksi QRIS dinamis.',
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

  return <SettlementClient outletKey={outletKey} data={data} />;
}

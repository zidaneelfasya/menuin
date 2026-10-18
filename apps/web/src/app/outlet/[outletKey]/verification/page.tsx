import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { RingkasanClient } from './ringkasan-client';

export const metadata: Metadata = {
  title: 'Ringkasan Verifikasi Bisnis - MENUIN',
  description: 'Kelola status legalitas dan kepatuhan gerai untuk aktivasi pembayaran QRIS dinamis.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

export default async function Page({ params }: Props) {
  const { outletKey } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const isManagerOrOwner =
    user.role === 'OWNER' ||
    user.role === 'MANAGER' ||
    (user.role as string) === 'SYSTEM_ADMIN';

  if (!isManagerOrOwner) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Halaman Verifikasi Bisnis hanya dapat diakses oleh peran Pemilik (Owner) atau Manajer Outlet.
      </div>
    );
  }

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) {
    notFound();
  }

  return <RingkasanClient outletKey={outletKey} data={data} />;
}

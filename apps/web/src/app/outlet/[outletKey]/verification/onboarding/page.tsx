import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getOutletVerificationOverview } from '@/lib/actions/merchant-verification';
import { getCurrentUser } from '@/lib/actions/auth';
import { WizardShell } from '@/components/verification/wizard/wizard-shell';

import { Suspense } from 'react';
import VerificationLoading from '../loading';

export const metadata: Metadata = {
  title: 'Onboarding Verifikasi Bisnis - MENUIN',
  description: 'Alur pendaftaran verifikasi legalitas bisnis, rekening penampungan, dan kepatuhan gerai.',
};

type Props = {
  params: Promise<{ outletKey: string }>;
};

async function OnboardingContent({ outletKey }: { outletKey: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const isOwner =
    user.role === 'OWNER' ||
    (user.role as string) === 'SYSTEM_ADMIN';

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9FBFF]">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-md space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Akses Khusus Pemilik (Owner)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pendaftaran profil legal usaha dan rekening penampungan hanya dapat dilakukan oleh pemilik akun outlet. Peran Anda saat ini adalah {user.role}.
            </p>
          </div>
          <Link
            href={`/outlet/${outletKey}/verification`}
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-[#0e59f9] text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
          >
            Kembali ke Ringkasan Verifikasi
          </Link>
        </div>
      </div>
    );
  }

  const data = await getOutletVerificationOverview(outletKey);
  if (!data) {
    notFound();
  }

  return <WizardShell outletKey={outletKey} initialData={data} />;
}

export default async function OnboardingPage({ params }: Props) {
  const { outletKey } = await params;

  return (
    <Suspense fallback={<VerificationLoading />}>
      <OnboardingContent outletKey={outletKey} />
    </Suspense>
  );
}

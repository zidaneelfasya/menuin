import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVerificationSubmissionDetail } from '@/lib/actions/admin-verification';
import { AdminVerificationDetailClient } from './admin-verification-detail-client';

export const metadata: Metadata = {
  title: 'Pemeriksaan Verifikasi - Menuin Admin',
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminVerificationDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getVerificationSubmissionDetail(id).catch(() => null);

  if (!data) {
    notFound();
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <AdminVerificationDetailClient
        submissionId={id}
        initialData={data}
      />
    </div>
  );
}

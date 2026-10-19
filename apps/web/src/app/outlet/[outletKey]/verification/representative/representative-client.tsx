'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/verification/shared/page-header';
import { SectionCard } from '@/components/verification/shared/section-card';
import { ReadOnlyField } from '@/components/verification/shared/read-only-field';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { Edit3, ExternalLink, UserRound, Loader2 } from 'lucide-react';
import { getVerificationDocumentSignedUrlAction } from '@/lib/actions/verification-storage';
import { toast } from 'sonner';

interface RepresentativeClientProps {
  outletKey: string;
  data: any;
}

export function RepresentativeClient({ outletKey, data }: RepresentativeClientProps) {
  const { businessProfile, tenant, submissions, isOwner = true } = data;
  const [openingDocId, setOpeningDocId] = React.useState<string | null>(null);

  const handleOpenDoc = async (storageKey: string) => {
    setOpeningDocId(storageKey);
    try {
      const res = await getVerificationDocumentSignedUrlAction(storageKey);
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.error || 'Gagal membuka dokumen.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setOpeningDocId(null);
    }
  };

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
          title="Perwakilan Bisnis"
          description="Data identitas penanggung jawab akun dan pencairan dana."
        />
        <div className="bg-white rounded-2xl border border-[#EAEFF8] p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0e59f9] flex items-center justify-center mx-auto">
            <UserRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Data Perwakilan Belum Tersedia
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data perwakilan terhubung dengan profil usaha. Silakan lengkapi profil usaha terlebih dahulu.
            </p>
          </div>
          {isOwner ? (
            <Link
              href={`/outlet/${outletKey}/verification/onboarding?step=1`}
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-[#0e59f9] text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              Mulai Pengisian
            </Link>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              Pendaftaran hanya dapat dilakukan oleh Pemilik (Owner) outlet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mask NIK: e.g. 3510123456780001 -> 3510••••••••0001
  const rawNik = businessProfile.responsiblePersonNik || '';
  const maskedNik =
    rawNik.length === 16
      ? `${rawNik.slice(0, 4)}••••••••${rawNik.slice(-4)}`
      : rawNik || '-';

  // Find KTP document in latest submission
  const latestSub = data.latestSubmission || submissions?.[0];
  const allDocs: any[] = latestSub?.documents || latestSub?.submissionSnapshot?.documents || [];
  const ktpDoc = allDocs.find((d: any) => d.documentType === 'KTP');

  // Determine section review status
  const repSection = data.sectionReviewsMap?.['REPRESENTATIVE'];
  const sectionStatus: 'verified' | 'action_required' | 'under_review' | 'incomplete' = repSection
    ? repSection.status === 'APPROVED'
      ? 'verified'
      : repSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : businessProfile.verificationStatus === 'verified'
    ? 'verified'
    : businessProfile.verificationStatus === 'action_required'
    ? 'action_required'
    : 'under_review';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
        title="Perwakilan Bisnis"
        description="Identitas resmi penanggung jawab akun yang berwenang atas penerimaan dan pencairan dana transaksi."
        badge={<StatusPill status={sectionStatus} />}
      >
        {isOwner && (
          <Link
            href={`/outlet/${outletKey}/verification/onboarding?step=2`}
            className="h-9 px-3.5 rounded-xl bg-white border border-[#EAEFF8] text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Ubah Data</span>
          </Link>
        )}
      </PageHeader>

      <SectionCard
        eyebrow="Identitas Penanggung Jawab"
        title="Data Pribadi Perwakilan"
        description="Data identitas e-KTP dan kontak resmi penanggung jawab usaha."
        verificationStatus={sectionStatus}
        statusNote={repSection?.note}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField
            label="Nama Lengkap Penanggung Jawab"
            value={businessProfile.responsiblePersonName}
          />
          <ReadOnlyField
            label="Nomor Induk Kependudukan (NIK)"
            value={maskedNik}
            hint="NIK disamarkan demi keamanan data pribadi."
          />
          <ReadOnlyField
            label="Nomor Telepon / WhatsApp"
            value={businessProfile.responsiblePersonContact}
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Dokumen Identitas"
        title="Kartu Tanda Penduduk (e-KTP)"
        description="Foto fisik e-KTP asli yang telah diunggah untuk verifikasi identitas."
        verificationStatus={sectionStatus}
        statusNote={repSection?.note}
      >
        {ktpDoc ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {ktpDoc.fileName || 'Foto e-KTP Penanggung Jawab'}
                </p>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Dokumen identitas resmi terlampir
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDoc(ktpDoc.storageKey)}
              disabled={openingDocId === ktpDoc.storageKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0e59f9] cursor-pointer disabled:opacity-50 flex-shrink-0 transition-colors shadow-2xs"
            >
              {openingDocId === ktpDoc.storageKey ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Lihat Dokumen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            Belum ada berkas e-KTP yang diunggah.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

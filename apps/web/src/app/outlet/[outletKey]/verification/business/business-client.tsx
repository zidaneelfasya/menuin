'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/verification/shared/page-header';
import { SectionCard } from '@/components/verification/shared/section-card';
import { ReadOnlyField } from '@/components/verification/shared/read-only-field';
import { StatusPill } from '@/components/verification/shared/status-pill';
import { Edit3, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { getVerificationDocumentSignedUrlAction } from '@/lib/actions/verification-storage';
import { toast } from 'sonner';

interface BusinessClientProps {
  outletKey: string;
  data: any;
}

export function BusinessClient({ outletKey, data }: BusinessClientProps) {
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
          title="Profil Usaha"
          description="Legalitas badan usaha dan izin berusaha yang terdaftar di Menuin."
        />
        <div className="bg-white rounded-2xl border-none shadow-sm-md hover:shadow-md transition-all p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0e59f9] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Profil Usaha Belum Didaftarkan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan atau daftarkan profil badan usaha Anda untuk memulai verifikasi pembayaran.
            </p>
          </div>
          {isOwner ? (
            <Link
              href={`/outlet/${outletKey}/verification/onboarding?step=1`}
              className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-[#0e59f9] text-white text-xs font-semibold hover:bg-[#0b4de0] transition-colors shadow-md"
            >
              Lengkapi Profil Usaha
            </Link>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border-none shadow-xs text-xs text-slate-500">
              Pendaftaran hanya dapat dilakukan oleh Pemilik (Owner) outlet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Extract business profile documents from latest submission
  const latestSub = data.latestSubmission || submissions?.[0];
  const allDocs: any[] = latestSub?.documents || latestSub?.submissionSnapshot?.documents || [];
  const documents: any[] = allDocs.filter((d: any) => ['NIB', 'NPWP', 'AKTA'].includes(d.documentType));

  // Determine section review status
  const bpSection = data.sectionReviewsMap?.['BUSINESS_PROFILE'];
  const sectionStatus: 'verified' | 'action_required' | 'under_review' | 'incomplete' = bpSection
    ? bpSection.status === 'APPROVED'
      ? 'verified'
      : bpSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : businessProfile.verificationStatus === 'verified'
    ? 'verified'
    : businessProfile.verificationStatus === 'action_required'
    ? 'action_required'
    : 'under_review';

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow={`Verifikasi Bisnis \u2022 ${tenant.name}`}
        title="Profil Usaha"
        description="Legalitas badan usaha dan izin berusaha yang dapat digunakan bersama oleh seluruh cabang outlet Anda."
        badge={<StatusPill status={sectionStatus} />}
      >
        {isOwner && (
          <Link
            href={`/outlet/${outletKey}/verification/onboarding?step=1`}
            className="h-9 px-4 rounded-full bg-white border-none text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Ubah Data</span>
          </Link>
        )}
      </PageHeader>

      {/* Main Info Card */}
      <SectionCard
        eyebrow="Identitas Legal Badan Usaha"
        title="Data Perusahaan"
        description="Informasi resmi sesuai Nomor Induk Berusaha (NIB) dan NPWP usaha."
        verificationStatus={sectionStatus}
        statusNote={bpSection?.note}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField
            label="Nama Legal Badan Usaha"
            value={businessProfile.name}
          />
          <ReadOnlyField
            label="Bentuk Usaha / Entitas"
            value={businessProfile.entityType}
          />
          <ReadOnlyField
            label="Nomor Induk Berusaha (NIB)"
            value={businessProfile.businessLicenseNumber}
            placeholder="Belum terisi"
          />
          <ReadOnlyField
            label="Nomor Pokok Wajib Pajak (NPWP)"
            value={businessProfile.taxId}
            placeholder="Belum terisi"
          />
        </div>
      </SectionCard>

      {/* Attached Documents Card */}
      <SectionCard
        eyebrow="Berkas Legalitas"
        title="Dokumen Terlampir"
        description="Salinan berkas resmi yang telah diunggah untuk peninjauan kepatuhan."
        verificationStatus={sectionStatus}
        statusNote={bpSection?.note}
      >
        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Belum ada berkas dokumen yang terlampir pada pengajuan ini.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0e59f9] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {doc.fileName || doc.documentType}
                    </p>
                    <span className="text-[11px] text-slate-500 block">
                      Tipe Dokumen: {doc.documentType}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDoc(doc.storageKey)}
                  disabled={openingDocId === doc.storageKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0e59f9] cursor-pointer disabled:opacity-50 flex-shrink-0 transition-colors shadow-2xs"
                >
                  {openingDocId === doc.storageKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Lihat Dokumen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

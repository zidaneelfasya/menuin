import * as React from 'react';
import {
  Building2,
  UserRound,
  Landmark,
  Store,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillarCard } from './pillar-card';
import { normalizePillarStatus } from '@/lib/verification/ui-status';

interface ProgressCardProps {
  outletKey: string;
  businessProfile?: {
    name?: string | null;
    verificationStatus?: string | null;
  } | null;
  activeSettlementAccount?: {
    bankName?: string | null;
    bankAccountNumberMasked?: string | null;
    verificationStatus?: string | null;
  } | null;
  tenant: {
    name?: string | null;
    city?: string | null;
    outletComplianceStatus?: string | null;
    onlinePaymentEnabled?: boolean;
    dokuSubAccountStatus?: string | null;
    dokuSubAccountId?: string | null;
  };
  sectionReviewsMap?: Record<string, any>;
  className?: string;
}

export function ProgressCard({
  outletKey,
  businessProfile,
  activeSettlementAccount,
  tenant,
  sectionReviewsMap,
  className,
}: ProgressCardProps) {
  const defaultBpStatus = normalizePillarStatus(businessProfile?.verificationStatus);
  const bpSection = sectionReviewsMap?.['BUSINESS_PROFILE'];
  const repSection = sectionReviewsMap?.['REPRESENTATIVE'];
  const saSection = sectionReviewsMap?.['SETTLEMENT'];
  const ocSection = sectionReviewsMap?.['OUTLET'];

  const bpStatus = bpSection
    ? bpSection.status === 'APPROVED'
      ? 'verified'
      : bpSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : defaultBpStatus;

  const repStatus = repSection
    ? repSection.status === 'APPROVED'
      ? 'verified'
      : repSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : defaultBpStatus;

  const saStatus = saSection
    ? saSection.status === 'APPROVED'
      ? 'verified'
      : saSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : normalizePillarStatus(activeSettlementAccount?.verificationStatus);

  const ocStatus = ocSection
    ? ocSection.status === 'APPROVED'
      ? 'verified'
      : ocSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : normalizePillarStatus(tenant.outletComplianceStatus);

  const pillars = [bpStatus, repStatus, saStatus, ocStatus];
  const completedCount = pillars.filter((p) => p === 'verified').length;
  const isOnlineActive = Boolean(
    tenant.onlinePaymentEnabled &&
    tenant.dokuSubAccountId &&
    tenant.dokuSubAccountStatus === 'ACTIVE'
  );

  const isStage1Complete = pillars.every((p) => p !== 'incomplete');
  const isStage2Complete = completedCount === 4;
  const isStage3Complete = isOnlineActive;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-none p-5 sm:p-6 shadow-sm-md hover:shadow-md transition-all flex flex-col justify-between space-y-5',
        className
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-500 block">
            Tahapan Verifikasi
          </span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Progres Verifikasi Bisnis
          </h3>
        </div>
        <span className="inline-flex items-center text-xs font-semibold text-[#0e59f9] bg-blue-50 px-2.5 py-0.5 rounded-full">
          {completedCount} dari 4 data terverifikasi
        </span>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="space-y-4">
        {/* Milestone 1: Lengkapi Data */}
        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                isStage1Complete
                  ? 'bg-[#0e59f9] text-white border border-[#0e59f9]'
                  : 'border border-[#0e59f9] text-[#0e59f9] bg-white'
              )}
            >
              {isStage1Complete ? <Check className="w-3.5 h-3.5 stroke-[1.75]" /> : '1'}
            </div>
            <div
              className={cn(
                'w-0.5 h-10 my-1 transition-colors',
                isStage1Complete ? 'bg-[#0e59f9]' : 'bg-slate-200'
              )}
            />
          </div>
          <div className="pt-0.5">
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              Pengisian Data Bisnis & Gerai
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isStage1Complete
                ? 'Seluruh data awal telah terisi dan terkirim.'
                : 'Lengkapi 4 data utama untuk mengajukan verifikasi.'}
            </p>
          </div>
        </div>

        {/* Milestone 2: Peninjauan Kepatuhan (Contains 4 Pillar Cards) */}
        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                isStage2Complete
                  ? 'bg-[#0e59f9] text-white border border-[#0e59f9]'
                  : isStage1Complete
                  ? 'border border-[#0e59f9] text-[#0e59f9] bg-white'
                  : 'border border-slate-200 text-slate-400 bg-white'
              )}
            >
              {isStage2Complete ? <Check className="w-3.5 h-3.5 stroke-[1.75]" /> : '2'}
            </div>
            <div
              className={cn(
                'w-0.5 h-full min-h-[140px] my-1 transition-colors',
                isStage2Complete ? 'bg-[#0e59f9]' : 'bg-slate-200'
              )}
            />
          </div>

          <div className="flex-1 min-w-0 pt-0.5 space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                Verifikasi Dokumen & Kepatuhan
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pemeriksaan legalitas, rekening, dan kepatuhan gerai fisik oleh tim kepatuhan.
              </p>
            </div>

            {/* 4 Pillar Mini-Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Card 1: Profil Usaha */}
              <PillarCard
                eyebrow="Profil Usaha"
                title={businessProfile?.name || 'Belum Dihubungkan'}
                status={bpStatus}
                icon={Building2}
                href={`/outlet/${outletKey}/verification/business`}
                editHref={`/outlet/${outletKey}/verification/onboarding?step=1`}
              />

              {/* Card 2: Perwakilan Bisnis */}
              <PillarCard
                eyebrow="Perwakilan"
                title={businessProfile ? 'Data KTP & PIC' : 'Belum Ditentukan'}
                status={repStatus}
                icon={UserRound}
                href={`/outlet/${outletKey}/verification/representative`}
                editHref={`/outlet/${outletKey}/verification/onboarding?step=2`}
              />

              {/* Card 3: Rekening Settlement */}
              <PillarCard
                eyebrow="Rekening"
                title={
                  activeSettlementAccount
                    ? `${activeSettlementAccount.bankName} ${activeSettlementAccount.bankAccountNumberMasked}`
                    : 'Belum Ditentukan'
                }
                status={saStatus}
                icon={Landmark}
                href={`/outlet/${outletKey}/verification/settlement`}
                editHref={`/outlet/${outletKey}/verification/onboarding?step=3`}
              />

              {/* Card 4: Kepatuhan Lokasi Gerai */}
              <PillarCard
                eyebrow="Fisik Gerai"
                title={tenant.city ? `${tenant.name} (${tenant.city})` : tenant.name || 'Cabang Outlet'}
                status={ocStatus}
                icon={Store}
                href={`/outlet/${outletKey}/verification/outlet`}
                editHref={`/outlet/${outletKey}/verification/onboarding?step=4`}
              />
            </div>
          </div>
        </div>

        {/* Milestone 3: Bisnis Terverifikasi Penuh */}
        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                isStage3Complete
                  ? 'bg-emerald-500 text-white border border-emerald-500'
                  : 'border border-slate-200 text-slate-400 bg-white'
              )}
            >
              {isStage3Complete ? <Check className="w-3.5 h-3.5 stroke-[1.75]" /> : '3'}
            </div>
          </div>
          <div className="pt-0.5">
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              Bisnis Terverifikasi Penuh
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isStage3Complete
                ? 'Seluruh data legalitas dan kepatuhan telah disetujui. Gerai Anda siap menerima transaksi kasir.'
                : 'Penyelesaian verifikasi otomatis setelah seluruh 4 pilar data disetujui.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

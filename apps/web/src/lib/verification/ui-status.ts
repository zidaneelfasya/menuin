import type {
  BusinessProfileVerificationStatus,
  OutletComplianceStatus,
  PaymentReadinessEvaluation,
} from '@menuin/types';

export type VerificationItemStatus =
  | 'verified'
  | 'under_review'
  | 'action_required'
  | 'incomplete';

export type OverallHubStatus =
  | 'NOT_STARTED'
  | 'PARTIAL'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED_READY'
  | 'ACTIVE';

export interface StatusDescriptor {
  status: VerificationItemStatus;
  label: string;
  badgeClass: string;
  cardBgClass: string;
  cardBorderClass: string;
  indicatorColor: string;
}

export function normalizePillarStatus(
  rawStatus?: string | null
): VerificationItemStatus {
  if (!rawStatus) return 'incomplete';
  const s = rawStatus.toLowerCase();
  if (s === 'verified' || s === 'active' || s === 'accepted') {
    return 'verified';
  }
  if (
    s === 'under_review' ||
    s === 'ready_for_review' ||
    s === 'submitted' ||
    s === 'pending' ||
    s === 'pending_review' ||
    s === 'provisioning'
  ) {
    return 'under_review';
  }
  if (
    s === 'action_required' ||
    s === 'rejected' ||
    s === 'failed' ||
    s === 'suspended'
  ) {
    return 'action_required';
  }
  return 'incomplete';
}

export function getStatusDescriptor(rawStatus?: string | null): StatusDescriptor {
  const normalized = normalizePillarStatus(rawStatus);

  switch (normalized) {
    case 'verified':
      return {
        status: 'verified',
        label: 'Terverifikasi',
        badgeClass: 'bg-emerald-100/80 text-emerald-700',
        cardBgClass: 'bg-white',
        cardBorderClass: 'border-[#EAEFF8]',
        indicatorColor: 'text-emerald-500',
      };
    case 'under_review':
      return {
        status: 'under_review',
        label: 'Ditinjau',
        badgeClass: 'bg-blue-100/80 text-[#0e59f9]',
        cardBgClass: 'bg-slate-50/70',
        cardBorderClass: 'border-slate-100',
        indicatorColor: 'text-amber-500',
      };
    case 'action_required':
      return {
        status: 'action_required',
        label: 'Perlu Revisi',
        badgeClass: 'bg-rose-100/80 text-rose-700',
        cardBgClass: 'bg-rose-50/40',
        cardBorderClass: 'border-rose-200',
        indicatorColor: 'text-rose-500',
      };
    case 'incomplete':
    default:
      return {
        status: 'incomplete',
        label: 'Belum Diisi',
        badgeClass: 'bg-slate-100 text-slate-500',
        cardBgClass: 'bg-slate-50/70',
        cardBorderClass: 'border-dashed border-slate-200',
        indicatorColor: 'text-slate-300',
      };
  }
}

export interface HubOverallSummary {
  status: OverallHubStatus;
  eyebrow: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  pillLabel: string;
  pillClass: string;
  completedCount: number;
  totalPillars: number;
}

export function evaluateHubOverallStatus(data: {
  tenant: {
    onlinePaymentEnabled?: boolean;
    outletComplianceStatus?: OutletComplianceStatus;
    dokuSubAccountStatus?: string;
    dokuSubAccountId?: string | null;
  };
  businessProfile?: {
    verificationStatus?: BusinessProfileVerificationStatus;
  } | null;
  activeSettlementAccount?: {
    verificationStatus?: string;
  } | null;
  readiness?: PaymentReadinessEvaluation;
  sectionReviewsMap?: Record<string, any>;
  outletKey: string;
}): HubOverallSummary {
  const { tenant, businessProfile, activeSettlementAccount, readiness, sectionReviewsMap, outletKey } = data;

  const defaultBpStatus = normalizePillarStatus(businessProfile?.verificationStatus);
  const bpSection = sectionReviewsMap?.['BUSINESS_PROFILE'];
  const repSection = sectionReviewsMap?.['REPRESENTATIVE'];
  const saSection = sectionReviewsMap?.['SETTLEMENT'];
  const ocSection = sectionReviewsMap?.['OUTLET'];

  const bpStatus: VerificationItemStatus = bpSection
    ? bpSection.status === 'APPROVED'
      ? 'verified'
      : bpSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : defaultBpStatus;

  const repStatus: VerificationItemStatus = repSection
    ? repSection.status === 'APPROVED'
      ? 'verified'
      : repSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : defaultBpStatus;

  const saStatus: VerificationItemStatus = saSection
    ? saSection.status === 'APPROVED'
      ? 'verified'
      : saSection.status === 'CHANGES_REQUESTED'
      ? 'action_required'
      : 'under_review'
    : normalizePillarStatus(activeSettlementAccount?.verificationStatus);

  const ocStatus: VerificationItemStatus = ocSection
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

  if (pillars.some((p) => p === 'action_required')) {
    return {
      status: 'ACTION_REQUIRED',
      eyebrow: 'Status Verifikasi',
      title: 'Perlu Perbaikan Data',
      description:
        'Peninjau meminta perbaikan pada dokumen atau data verifikasi Anda. Silakan periksa catatan dan kirimkan revisi.',
      primaryActionLabel: 'Perbaiki Data',
      primaryActionHref: `/outlet/${outletKey}/verification/onboarding`,
      secondaryActionLabel: 'Lihat Catatan',
      secondaryActionHref: `/outlet/${outletKey}/verification/history`,
      pillLabel: 'Perlu Revisi',
      pillClass: 'bg-rose-500/30 text-rose-100',
      completedCount,
      totalPillars: 4,
    };
  }

  if (isOnlineActive) {
    return {
      status: 'ACTIVE',
      eyebrow: 'Status Verifikasi',
      title: 'Bisnis Terverifikasi',
      description:
        'Profil usaha, perwakilan bisnis, rekening, dan lokasi gerai Anda telah terverifikasi. Transaksi kasir dan pembayaran nontunai siap digunakan.',
      primaryActionLabel: 'Buka Kasir POS',
      primaryActionHref: `/outlet/${outletKey}/pos`,
      secondaryActionLabel: 'Lihat Detail',
      secondaryActionHref: `/outlet/${outletKey}/verification/outlet`,
      pillLabel: 'Terverifikasi',
      pillClass: 'bg-emerald-500/20 text-emerald-100',
      completedCount: 4,
      totalPillars: 4,
    };
  }

  if (completedCount === 4 && readiness?.isReady) {
    return {
      status: 'VERIFIED_READY',
      eyebrow: 'Status Verifikasi',
      title: 'Verifikasi Selesai',
      description:
        'Seluruh data verifikasi telah disetujui. Tekan tombol di bawah untuk menyelesaikan aktivasi layanan gerai Anda.',
      primaryActionLabel: 'Selesaikan Aktivasi',
      primaryActionHref: '#activate',
      secondaryActionLabel: 'Lihat Detail',
      secondaryActionHref: `/outlet/${outletKey}/verification/business`,
      pillLabel: 'Terverifikasi',
      pillClass: 'bg-emerald-500/20 text-emerald-100',
      completedCount: 4,
      totalPillars: 4,
    };
  }

  if (pillars.some((p) => p === 'under_review')) {
    return {
      status: 'UNDER_REVIEW',
      eyebrow: 'Status Verifikasi',
      title: 'Data Sedang Ditinjau',
      description:
        'Data verifikasi bisnis Anda sedang ditinjau oleh tim kepatuhan. Estimasi proses 1 hari kerja. Operasional kasir tetap berjalan normal.',
      primaryActionLabel: 'Lihat Detail Data',
      primaryActionHref: `/outlet/${outletKey}/verification/business`,
      secondaryActionLabel: 'Hubungi Bantuan',
      secondaryActionHref: 'https://wa.me/6281234567890',
      pillLabel: 'Ditinjau',
      pillClass: 'bg-white/20 text-white',
      completedCount,
      totalPillars: 4,
    };
  }

  if (completedCount > 0 || pillars.some((p) => p !== 'incomplete')) {
    return {
      status: 'PARTIAL',
      eyebrow: 'Status Verifikasi',
      title: 'Lengkapi Data Verifikasi',
      description: `Tersisa ${4 - completedCount} bagian data yang perlu Anda lengkapi sebelum pengajuan verifikasi dapat diproses.`,
      primaryActionLabel: 'Lanjutkan Pengisian',
      primaryActionHref: `/outlet/${outletKey}/verification/onboarding`,
      secondaryActionLabel: 'Lihat Syarat',
      secondaryActionHref: `/outlet/${outletKey}/verification/business`,
      pillLabel: `${completedCount} dari 4`,
      pillClass: 'bg-white/20 text-white',
      completedCount,
      totalPillars: 4,
    };
  }

  return {
    status: 'NOT_STARTED',
    eyebrow: 'STATUS VERIFIKASI',
    title: 'Mulai Verifikasi Bisnis',
    description:
      'Lengkapi 4 data utama: profil usaha, perwakilan bisnis, rekening penampungan, dan lokasi gerai untuk memverifikasi usaha Anda.',
    primaryActionLabel: 'Mulai Verifikasi',
    primaryActionHref: `/outlet/${outletKey}/verification/onboarding`,
    secondaryActionLabel: 'Pelajari Syarat',
    secondaryActionHref: `/outlet/${outletKey}/verification/business`,
    pillLabel: '0 dari 4',
    pillClass: 'bg-white/20 text-white',
    completedCount: 0,
    totalPillars: 4,
  };
}

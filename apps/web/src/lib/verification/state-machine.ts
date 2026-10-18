import type {
  BusinessProfileVerificationStatus,
  OutletComplianceStatus,
  PaymentReadinessEvaluation,
  ProviderOnboardingStatus,
} from '@menuin/types';

export type BusinessVerificationAction =
  | 'SAVE_DRAFT'
  | 'SUBMIT'
  | 'CLAIM_REVIEW'
  | 'REQUEST_CHANGES'
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'UNSUSPEND';

export type OutletComplianceAction =
  | 'SUBMIT_LOCATION'
  | 'APPROVE_LOCATION'
  | 'REQUEST_LOCATION_CHANGES';

export type ActorRole = 'MERCHANT' | 'ADMIN' | 'SYSTEM';

export type StateTransitionResult<T> =
  | { success: true; nextStatus: T; reason?: string }
  | { success: false; currentStatus: T; error: string };

/**
 * Pure state machine transition logic for Tier 1 Business Profile Verification.
 */
export function decideBusinessVerificationTransition(
  current: BusinessProfileVerificationStatus,
  action: BusinessVerificationAction,
  actor: ActorRole
): StateTransitionResult<BusinessProfileVerificationStatus> {
  // Merchant actions
  if (actor === 'MERCHANT') {
    switch (action) {
      case 'SAVE_DRAFT':
        if (current === 'not_started' || current === 'draft') {
          return { success: true, nextStatus: 'draft' };
        }
        return { success: false, currentStatus: current, error: 'Draf hanya dapat disimpan saat status belum diajukan.' };

      case 'SUBMIT':
        if (current === 'not_started' || current === 'draft' || current === 'action_required') {
          return { success: true, nextStatus: 'submitted' };
        }
        return {
          success: false,
          currentStatus: current,
          error: `Tidak dapat mengajukan verifikasi dari status ${current}.`,
        };

      default:
        return { success: false, currentStatus: current, error: 'Aksi ini memerlukan kewenangan admin kepatuhan.' };
    }
  }

  // Admin actions
  if (actor === 'ADMIN' || actor === 'SYSTEM') {
    switch (action) {
      case 'CLAIM_REVIEW':
        if (current === 'submitted' || current === 'under_review') {
          return { success: true, nextStatus: 'under_review' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Pemeriksaan hanya dapat dimulai dari status submitted.',
        };

      case 'REQUEST_CHANGES':
        if (current === 'under_review' || current === 'submitted') {
          return { success: true, nextStatus: 'action_required' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Permintaan perbaikan hanya dapat diberikan saat status sedang ditinjau.',
        };

      case 'APPROVE':
        if (current === 'under_review' || current === 'submitted') {
          return { success: true, nextStatus: 'verified' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Persetujuan hanya dapat diberikan saat status sedang ditinjau.',
        };

      case 'REJECT':
        if (current === 'under_review' || current === 'submitted') {
          return { success: true, nextStatus: 'rejected' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Penolakan hanya dapat dilakukan saat status sedang ditinjau.',
        };

      case 'SUSPEND':
        if (current === 'verified') {
          return { success: true, nextStatus: 'suspended' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Penangguhan hanya berlaku untuk profil bisnis yang sudah terverifikasi.',
        };

      case 'UNSUSPEND':
        if (current === 'suspended') {
          return { success: true, nextStatus: 'verified' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Pemulihan hanya berlaku untuk profil bisnis yang sedang ditangguhkan.',
        };

      default:
        return { success: false, currentStatus: current, error: 'Aksi admin tidak dikenali.' };
    }
  }

  return { success: false, currentStatus: current, error: 'Peran pengguna tidak valid.' };
}

/**
 * Pure state machine transition logic for Tier 2 Outlet Physical Compliance.
 */
export function decideOutletComplianceTransition(
  current: OutletComplianceStatus,
  action: OutletComplianceAction,
  actor: ActorRole
): StateTransitionResult<OutletComplianceStatus> {
  if (actor === 'MERCHANT') {
    if (action === 'SUBMIT_LOCATION') {
      if (current === 'incomplete' || current === 'ready_for_review' || current === 'action_required') {
        return { success: true, nextStatus: 'ready_for_review' };
      }
      return { success: false, currentStatus: current, error: 'Lokasi outlet sudah terverifikasi.' };
    }
    return { success: false, currentStatus: current, error: 'Aksi ini memerlukan kewenangan admin.' };
  }

  if (actor === 'ADMIN' || actor === 'SYSTEM') {
    switch (action) {
      case 'APPROVE_LOCATION':
        if (current === 'ready_for_review' || current === 'verified') {
          return { success: true, nextStatus: 'verified' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Persetujuan lokasi hanya dapat dilakukan jika data outlet siap ditinjau.',
        };

      case 'REQUEST_LOCATION_CHANGES':
        if (current === 'ready_for_review' || current === 'verified') {
          return { success: true, nextStatus: 'action_required' };
        }
        return {
          success: false,
          currentStatus: current,
          error: 'Permintaan perbaikan lokasi hanya berlaku saat data outlet sedang ditinjau.',
        };

      default:
        return { success: false, currentStatus: current, error: 'Aksi admin lokasi tidak dikenali.' };
    }
  }

  return { success: false, currentStatus: current, error: 'Peran pengguna tidak valid.' };
}

/**
 * Pure evaluation engine for Payment Readiness (Decoupled 4/5-state rule).
 */
export function evaluatePaymentReadiness(params: {
  businessProfileStatus: BusinessProfileVerificationStatus | null | undefined;
  settlementAccountStatus?: 'pending' | 'verified' | 'action_required' | 'rejected' | null | undefined;
  outletComplianceStatus: OutletComplianceStatus | null | undefined;
  dokuSubAccountId: string | null | undefined;
  dokuSubAccountStatus: ProviderOnboardingStatus | string | null | undefined;
  onlinePaymentEnabled: boolean;
  isPlatformConfigured: boolean;
}): PaymentReadinessEvaluation {
  const reasons: string[] = [];

  const businessVerified = params.businessProfileStatus === 'verified';
  if (!businessVerified) {
    if (!params.businessProfileStatus || params.businessProfileStatus === 'not_started') {
      reasons.push('Profil bisnis belum diverifikasi. Silakan lengkapi data legalitas usaha.');
    } else if (params.businessProfileStatus === 'submitted' || params.businessProfileStatus === 'under_review') {
      reasons.push('Profil bisnis sedang dalam proses peninjauan tim kepatuhan.');
    } else if (params.businessProfileStatus === 'action_required') {
      reasons.push('Terdapat dokumen profil bisnis yang memerlukan perbaikan dari pemilik.');
    } else if (params.businessProfileStatus === 'rejected') {
      reasons.push('Pengajuan verifikasi profil bisnis ditolak oleh tim kepatuhan.');
    } else if (params.businessProfileStatus === 'suspended') {
      reasons.push('Akses verifikasi profil bisnis ditangguhkan.');
    }
  }

  // Settlement Account verification check
  const settlementAccountVerified =
    params.settlementAccountStatus === undefined ? true : params.settlementAccountStatus === 'verified';
  if (!settlementAccountVerified) {
    if (!params.settlementAccountStatus || params.settlementAccountStatus === 'pending') {
      reasons.push('Rekening settlement penampungan dana sedang menunggu verifikasi.');
    } else if (params.settlementAccountStatus === 'action_required') {
      reasons.push('Data rekening settlement memerlukan perbaikan bukti kepemilikan.');
    } else if (params.settlementAccountStatus === 'rejected') {
      reasons.push('Rekening settlement ditolak oleh tim kepatuhan.');
    }
  }

  const outletVerified = params.outletComplianceStatus === 'verified';
  if (!outletVerified) {
    if (!params.outletComplianceStatus || params.outletComplianceStatus === 'incomplete') {
      reasons.push('Kelengkapan alamat dan foto fisik cabang outlet belum dilengkapi.');
    } else if (params.outletComplianceStatus === 'ready_for_review') {
      reasons.push('Data lokasi dan foto fisik outlet sedang menunggu verifikasi.');
    } else if (params.outletComplianceStatus === 'action_required') {
      reasons.push('Foto atau bukti alamat outlet memerlukan perbaikan.');
    }
  }

  const dokuActive =
    Boolean(params.dokuSubAccountId) &&
    (params.dokuSubAccountStatus === 'ACTIVE' || params.dokuSubAccountStatus === 'active');
  if (!dokuActive) {
    if (!params.dokuSubAccountId) {
      reasons.push('Akun pembayaran DOKU Sub-Account untuk outlet ini belum diaktifkan.');
    } else if (params.dokuSubAccountStatus === 'PROVISIONING') {
      reasons.push('Pendaftaran Sub-Account DOKU sedang diproses ke gateway.');
    } else if (params.dokuSubAccountStatus === 'FAILED') {
      reasons.push('Pendaftaran Sub-Account DOKU gagal. Silakan coba aktivasi ulang.');
    } else if (params.dokuSubAccountStatus === 'SUSPENDED') {
      reasons.push('Sub-Account DOKU outlet ini sedang dibekukan.');
    }
  }

  if (!params.onlinePaymentEnabled) {
    reasons.push('Fitur pembayaran non-tunai (online) belum diaktifkan oleh pengelola outlet.');
  }

  if (!params.isPlatformConfigured) {
    reasons.push('Kredensial gateway DOKU platform belum dikonfigurasi.');
  }

  const isReady =
    businessVerified &&
    settlementAccountVerified &&
    outletVerified &&
    dokuActive &&
    params.onlinePaymentEnabled &&
    params.isPlatformConfigured;

  return {
    status: isReady ? 'READY' : 'BLOCKED',
    isReady,
    businessVerified,
    settlementAccountVerified,
    outletVerified,
    dokuActive,
    onlinePaymentToggled: params.onlinePaymentEnabled,
    platformConfigured: params.isPlatformConfigured,
    reasons,
    blockingReasons: reasons,
  };
}

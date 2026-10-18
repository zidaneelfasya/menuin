export type BusinessProfileVerificationStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'action_required'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type SettlementAccountVerificationStatus =
  | 'pending'
  | 'verified'
  | 'action_required'
  | 'rejected';

export type OutletComplianceStatus =
  | 'incomplete'
  | 'ready_for_review'
  | 'verified'
  | 'action_required';

export type ProviderOnboardingStatus =
  | 'NOT_PROVISIONED'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'PENDING_REVIEW'
  | 'SUSPENDED'
  | 'FAILED';

export type PaymentReadinessStatus = 'READY' | 'BLOCKED';

export type EntityType = 'INDIVIDUAL' | 'PT' | 'CV' | 'YAYASAN' | 'KOPERASI';

export type DocumentType =
  // Tier 1: Legal Entity / Business Profile level
  | 'KTP'
  | 'NPWP'
  | 'NIB'
  | 'AKTA'
  // Tier 2: Settlement Account level
  | 'BUKU_TABUNGAN'
  // Tier 3: Outlet / Location level
  | 'FOTO_TAMPAK_DEPAN'
  | 'FOTO_KASIR'
  | 'IZIN_LOKASI';

export type DocumentScope = 'BUSINESS_PROFILE' | 'SETTLEMENT_ACCOUNT' | 'OUTLET';

export type DocumentReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type VerificationSubmissionScope = 'BUSINESS_PROFILE' | 'SETTLEMENT_ACCOUNT' | 'OUTLET';

export interface BusinessProfile {
  id: string;
  accountId: string;
  name: string;
  entityType: EntityType;
  taxId: string | null;
  businessLicenseNumber: string | null;
  responsiblePersonName: string;
  responsiblePersonNik: string;
  responsiblePersonContact: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  verificationStatus: BusinessProfileVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementAccount {
  id: string;
  businessProfileId: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountNumberMasked: string;
  bankAccountHolder: string;
  proofDocumentKey?: string | null;
  verificationMethod: 'API_INQUIRY' | 'MANUAL_REVIEW' | 'HYBRID';
  verificationStatus: SettlementAccountVerificationStatus;
  nameMatchScore?: number | null;
  verificationNotes?: string | null;
  isDefault: boolean;
  dokuBeneficiaryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SettlementAccountMasked = Omit<SettlementAccount, 'bankAccountNumber'>;

export interface OutletComplianceInfo {
  tenantId: string;
  businessProfileId: string | null;
  settlementAccountId?: string | null;
  outletName: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  storefrontPhotoUrl: string | null;
  indoorPhotoUrl?: string | null;
  mapsUrl?: string | null;
  outletComplianceStatus: OutletComplianceStatus;
  dokuSubAccountId: string | null;
  dokuSubAccountStatus: ProviderOnboardingStatus | null;
  onlinePaymentEnabled: boolean;
}

export interface VerificationDocument {
  id: string;
  submissionId: string;
  tenantId?: string | null;
  documentScope: DocumentScope;
  documentType: DocumentType;
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  reviewStatus: DocumentReviewStatus;
  reviewNote?: string | null;
  uploadedAt: Date;
  reviewedAt?: Date | null;
}

export interface VerificationSubmission {
  id: string;
  businessProfileId: string;
  tenantId?: string | null;
  submissionScope: VerificationSubmissionScope;
  attemptNumber: number;
  status: BusinessProfileVerificationStatus;
  submissionSnapshot: Record<string, unknown>;
  submittedAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  decisionReason?: string | null;
  internalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReadinessEvaluation {
  status: PaymentReadinessStatus;
  isReady: boolean;
  businessVerified: boolean;
  settlementAccountVerified: boolean;
  outletVerified: boolean;
  dokuActive: boolean;
  onlinePaymentToggled: boolean;
  platformConfigured: boolean;
  reasons: string[];
  blockingReasons: string[];
}

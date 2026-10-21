'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GuidelineProvider } from './guideline-context';
import { GuidelinePanel } from './guideline-panel';
import { WizardStepper, WIZARD_STEPS, type StepStatus } from './wizard-stepper';
import { Step1BusinessProfile } from './steps/step-1-business-profile';
import { Step2Representative } from './steps/step-2-representative';
import { Step3Settlement } from './steps/step-3-settlement';
import { Step4Outlet } from './steps/step-4-outlet';
import { Step5Review } from './steps/step-5-review';
import { X, ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  submitVerificationApplicationAction,
  saveVerificationDraftAction,
  type VerificationDocumentInput,
} from '@/lib/actions/merchant-verification';
import { uploadVerificationDocumentAction } from '@/lib/actions/verification-storage';
import type { EntityType } from '@menuin/types';

interface WizardShellProps {
  outletKey: string;
  initialData: any;
}

export function WizardShell({ outletKey, initialData }: WizardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    tenant,
    businessProfile,
    settlementAccounts = [],
    activeSettlementAccount,
    availableProfiles = [],
    draft,
    latestSubmission,
  } = initialData;

  const snapshot = latestSubmission?.submissionSnapshot || {};
  const draftPayload = draft?.payload || null;

  // Step State (1..5)
  const initialStepParam = parseInt(searchParams.get('step') || '', 10);
  const [currentStep, setCurrentStep] = React.useState<number>(() => {
    if (initialStepParam >= 1 && initialStepParam <= 5) return initialStepParam;
    if (draft?.currentStep && draft.currentStep >= 1 && draft.currentStep <= 5) return draft.currentStep;
    return 1;
  });

  // Profile Reusability State (Step 1)
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>(() => {
    return businessProfile?.id || availableProfiles?.[0]?.id || '';
  });

  const [isCreatingNewProfile, setIsCreatingNewProfile] = React.useState<boolean>(() => {
    if (draftPayload?.isCreatingNewProfile !== undefined) return draftPayload.isCreatingNewProfile;
    return !businessProfile && availableProfiles.length === 0;
  });

  const [isEditingSelectedProfile, setIsEditingSelectedProfile] = React.useState<boolean>(() => {
    // If the submission is in action_required or the section has changes requested, default to editable form
    const secReviews = latestSubmission?.sectionReviews || [];
    const bpSec = secReviews.find((s: any) => s.section === 'BUSINESS_PROFILE');
    return bpSec?.status === 'CHANGES_REQUESTED' || latestSubmission?.status === 'action_required';
  });

  const initialProfile = businessProfile || availableProfiles.find((p: any) => p.id === selectedProfileId) || null;

  // Profile Form Data
  const [profileFormData, setProfileFormData] = React.useState({
    name: draftPayload?.profile?.name || snapshot.profile?.name || initialProfile?.name || '',
    entityType: (draftPayload?.profile?.entityType || snapshot.profile?.entityType || initialProfile?.entityType || '') as EntityType,
    taxId: draftPayload?.profile?.taxId || snapshot.profile?.taxId || initialProfile?.taxId || '',
    businessLicenseNumber:
      draftPayload?.profile?.businessLicenseNumber ||
      snapshot.profile?.businessLicenseNumber ||
      initialProfile?.businessLicenseNumber ||
      '',
  });

  // Representative Form Data (Step 2)
  const [representativeFormData, setRepresentativeFormData] = React.useState({
    responsiblePersonName:
      draftPayload?.representative?.responsiblePersonName ||
      snapshot.representative?.responsiblePersonName ||
      initialProfile?.responsiblePersonName ||
      '',
    responsiblePersonPosition:
      draftPayload?.representative?.responsiblePersonPosition ||
      snapshot.representative?.responsiblePersonPosition ||
      (initialProfile as any)?.responsiblePersonPosition ||
      '',
    responsiblePersonPhone:
      draftPayload?.representative?.responsiblePersonPhone ||
      snapshot.representative?.responsiblePersonPhone ||
      initialProfile?.responsiblePersonContact ||
      '',
    responsiblePersonContact:
      draftPayload?.representative?.responsiblePersonContact ||
      snapshot.representative?.responsiblePersonContact ||
      initialProfile?.responsiblePersonContact ||
      '',
    responsiblePersonEmail:
      draftPayload?.representative?.responsiblePersonEmail ||
      snapshot.representative?.responsiblePersonEmail ||
      (initialProfile as any)?.responsiblePersonEmail ||
      '',
    responsiblePersonNationality:
      draftPayload?.representative?.responsiblePersonNationality ||
      snapshot.representative?.responsiblePersonNationality ||
      (initialProfile as any)?.responsiblePersonNationality ||
      '',
    responsiblePersonNik:
      draftPayload?.representative?.responsiblePersonNik ||
      snapshot.representative?.responsiblePersonNik ||
      initialProfile?.responsiblePersonNik ||
      '',
  });

  // Settlement Reusability State (Step 3)
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>(() => {
    if (draftPayload?.settlement?.selectedAccountId) return draftPayload.settlement.selectedAccountId;
    if (snapshot.settlement?.finalAccountId) return snapshot.settlement.finalAccountId;
    // Prefer non-rejected account
    const nonRejected = settlementAccounts.find((a: any) => a.verificationStatus !== 'rejected');
    if (nonRejected) return nonRejected.id;
    return activeSettlementAccount?.id || settlementAccounts?.[0]?.id || '';
  });

  const [isAddingNewAccount, setIsAddingNewAccount] = React.useState<boolean>(() => {
    if (draftPayload?.settlement?.isAddingNew !== undefined) return draftPayload.settlement.isAddingNew;
    return settlementAccounts.length === 0;
  });

  const [isEditingExistingAccount, setIsEditingExistingAccount] = React.useState<boolean>(() => {
    const selectedAccount = settlementAccounts.find(
      (a: any) =>
        a.id ===
        (draftPayload?.settlement?.selectedAccountId || activeSettlementAccount?.id || settlementAccounts?.[0]?.id)
    );
    return Boolean(
      !draftPayload?.settlement?.isAddingNew &&
        selectedAccount?.verificationStatus === 'rejected' &&
        (draftPayload?.settlement?.bankAccountNumber || draftPayload?.settlement?.isEditingExisting)
    );
  });

  // Settlement Form Data
  const [settlementFormData, setSettlementFormData] = React.useState({
    bankName: draftPayload?.settlement?.bankName || '',
    customBankName: draftPayload?.settlement?.customBankName || '',
    bankAccountNumber: draftPayload?.settlement?.bankAccountNumber || '',
    bankAccountHolder: draftPayload?.settlement?.bankAccountHolder || '',
    isDefault: draftPayload?.settlement?.isDefault || false,
  });

  // Outlet Compliance Form Data (Step 4)
  const [outletFormData, setOutletFormData] = React.useState({
    address: draftPayload?.outlet?.address || snapshot.outlet?.address || tenant.address || '',
    province: draftPayload?.outlet?.province || snapshot.outlet?.province || (tenant as any).province || '',
    city: draftPayload?.outlet?.city || snapshot.outlet?.city || tenant.city || '',
    district: draftPayload?.outlet?.district || snapshot.outlet?.district || (tenant as any).district || '',
    postalCode: draftPayload?.outlet?.postalCode || snapshot.outlet?.postalCode || tenant.postalCode || '',
    latitude:
      draftPayload?.outlet?.latitude ||
      snapshot.outlet?.latitude ||
      (tenant.latitude ? parseFloat(tenant.latitude) : undefined),
    longitude:
      draftPayload?.outlet?.longitude ||
      snapshot.outlet?.longitude ||
      (tenant.longitude ? parseFloat(tenant.longitude) : undefined),
    mapsUrl: draftPayload?.outlet?.mapsUrl || snapshot.outlet?.mapsUrl || tenant.mapsUrl || '',
    storefrontPhotoUrl: tenant.storefrontPhotoUrl || '',
    indoorPhotoUrl: tenant.indoorPhotoUrl || '',
  });

  // Hydrate Uploaded Documents State
  const [uploadedDocs, setUploadedDocs] = React.useState<Record<string, any>>(() => {
    // 1. From draft
    if (draftPayload?.documents && Array.isArray(draftPayload.documents)) {
      const map: Record<string, any> = {};
      for (const d of draftPayload.documents) {
        map[d.documentType] = d;
      }
      return map;
    }
    // 2. From latest submission
    if (latestSubmission?.documents && Array.isArray(latestSubmission.documents)) {
      const map: Record<string, any> = {};
      for (const d of latestSubmission.documents) {
        map[d.documentType] = {
          documentType: d.documentType,
          storageKey: d.storageKey,
          fileName: d.fileName,
          fileSizeBytes: d.fileSizeBytes,
          mimeType: d.mimeType,
          reviewStatus: d.reviewStatus,
          reviewNote: d.reviewNote,
        };
      }
      return map;
    }
    return {};
  });

  const [ktpPreview, setKtpPreview] = React.useState<string | null>(null);
  const [storefrontPreview, setStorefrontPreview] = React.useState<string | null>(null);
  const [indoorPreview, setIndoorPreview] = React.useState<string | null>(null);
  const [docPreviews, setDocPreviews] = React.useState<Record<string, string>>({});
  const [proofDoc, setProofDoc] = React.useState<any>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Step 5 agreement
  const [isAgreed, setIsAgreed] = React.useState(false);
  const [modifiedSections, setModifiedSections] = React.useState<Record<string, boolean>>({});

  // Resolve active profile for reusability
  const activeReusedProfile = React.useMemo(() => {
    if (isCreatingNewProfile) return null;
    if (businessProfile && businessProfile.id === selectedProfileId) return businessProfile;
    return availableProfiles.find((p: any) => p.id === selectedProfileId) || null;
  }, [isCreatingNewProfile, selectedProfileId, businessProfile, availableProfiles]);

  // Section reviews lookup
  const sectionReviewsMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    const list = latestSubmission?.sectionReviews || [];
    for (const r of list) {
      map[r.section] = r;
    }
    return map;
  }, [latestSubmission]);

  // Derive Stepper Statuses (Honest Status Evaluation)
  const stepStatuses = React.useMemo<Record<number, StepStatus>>(() => {
    const result: Record<number, StepStatus> = {
      1: 'incomplete',
      2: 'incomplete',
      3: 'incomplete',
      4: 'incomplete',
      5: 'incomplete',
    };

    const profileReview = sectionReviewsMap['BUSINESS_PROFILE'];
    const repReview = sectionReviewsMap['REPRESENTATIVE'];
    const settlementReview = sectionReviewsMap['SETTLEMENT'];
    const outletReview = sectionReviewsMap['OUTLET'];

    // Step 1: Profil Usaha
    const isNibRejected = uploadedDocs['NIB']?.reviewStatus === 'REJECTED' && !uploadedDocs['NIB']?.isNewlyUpdated;
    const isNpwpRejected = uploadedDocs['NPWP']?.reviewStatus === 'REJECTED' && !uploadedDocs['NPWP']?.isNewlyUpdated;
    const hasReplacedProfileDoc = Boolean(uploadedDocs['NIB']?.isNewlyUpdated || uploadedDocs['NPWP']?.isNewlyUpdated);
    const isProfileComplete = Boolean(profileFormData.name.trim() && profileFormData.entityType);

    if (isNibRejected || isNpwpRejected) {
      result[1] = 'changes_requested';
    } else if (profileReview?.status === 'CHANGES_REQUESTED') {
      if (isProfileComplete && (hasReplacedProfileDoc || modifiedSections.profile)) {
        result[1] = 'complete';
      } else {
        result[1] = 'changes_requested';
      }
    } else if (profileReview?.status === 'APPROVED' || businessProfile?.verificationStatus === 'verified') {
      result[1] = 'approved';
    } else if (isProfileComplete) {
      result[1] = 'complete';
    }

    // Step 2: Perwakilan Bisnis
    const isKtpRejected = uploadedDocs['KTP']?.reviewStatus === 'REJECTED' && !uploadedDocs['KTP']?.isNewlyUpdated;
    const isRepComplete = Boolean(
      representativeFormData.responsiblePersonName.trim() &&
      representativeFormData.responsiblePersonNik.length === 16 &&
      (representativeFormData.responsiblePersonPhone?.trim() || representativeFormData.responsiblePersonContact.trim()) &&
      (uploadedDocs['KTP'] || (!isCreatingNewProfile && Boolean(activeReusedProfile)))
    );

    if (isKtpRejected) {
      result[2] = 'changes_requested';
    } else if (repReview?.status === 'CHANGES_REQUESTED') {
      if (isRepComplete && (uploadedDocs['KTP']?.isNewlyUpdated || modifiedSections.representative)) {
        result[2] = 'complete';
      } else {
        result[2] = 'changes_requested';
      }
    } else if (
      repReview?.status === 'APPROVED' ||
      (businessProfile?.verificationStatus === 'verified' && !isCreatingNewProfile)
    ) {
      result[2] = 'approved';
    } else if (isRepComplete) {
      result[2] = 'complete';
    }

    // Step 3: Rekening Settlement
    const selectedAccount = settlementAccounts.find((a: any) => a.id === selectedAccountId);
    const isAccountRejected = selectedAccount?.verificationStatus === 'rejected';
    const isNewAccountFilled =
      isAddingNewAccount &&
      Boolean(
        settlementFormData.bankName.trim() &&
        settlementFormData.bankAccountNumber.trim() &&
        settlementFormData.bankAccountHolder.trim()
      );
    const isRepairedAccountFilled =
      Boolean(
        !isAddingNewAccount &&
        selectedAccountId &&
        isAccountRejected &&
        settlementFormData.bankName.trim() &&
        settlementFormData.bankAccountNumber.trim() &&
        settlementFormData.bankAccountHolder.trim()
      );

    if (isAccountRejected && !isAddingNewAccount && !isRepairedAccountFilled) {
      result[3] = 'changes_requested';
    } else if (settlementReview?.status === 'CHANGES_REQUESTED') {
      if (isNewAccountFilled || isRepairedAccountFilled || (!isAccountRejected && selectedAccountId && modifiedSections.settlement)) {
        result[3] = 'complete';
      } else {
        result[3] = 'changes_requested';
      }
    } else if (settlementReview?.status === 'APPROVED' || selectedAccount?.verificationStatus === 'verified') {
      result[3] = 'approved';
    } else if (!isAddingNewAccount && selectedAccountId && !isAccountRejected) {
      result[3] = 'complete';
    } else if (isNewAccountFilled || isRepairedAccountFilled) {
      result[3] = 'complete';
    }

    // Step 4: Lokasi Gerai
    const isStorefrontRejected =
      uploadedDocs['FOTO_TAMPAK_DEPAN']?.reviewStatus === 'REJECTED' &&
      !uploadedDocs['FOTO_TAMPAK_DEPAN']?.isNewlyUpdated;
    const isCashierRejected =
      uploadedDocs['FOTO_KASIR']?.reviewStatus === 'REJECTED' &&
      !uploadedDocs['FOTO_KASIR']?.isNewlyUpdated;
    const isOutletComplete = Boolean(
      outletFormData.address.trim() &&
      outletFormData.city.trim() &&
      outletFormData.postalCode.length === 5 &&
      (uploadedDocs['FOTO_TAMPAK_DEPAN'] || tenant.storefrontPhotoUrl) &&
      (uploadedDocs['FOTO_KASIR'] || tenant.indoorPhotoUrl)
    );

    if (isStorefrontRejected || isCashierRejected) {
      result[4] = 'changes_requested';
    } else if (outletReview?.status === 'CHANGES_REQUESTED') {
      if (
        isOutletComplete &&
        (uploadedDocs['FOTO_TAMPAK_DEPAN']?.isNewlyUpdated ||
          uploadedDocs['FOTO_KASIR']?.isNewlyUpdated ||
          modifiedSections.outlet)
      ) {
        result[4] = 'complete';
      } else {
        result[4] = 'changes_requested';
      }
    } else if (outletReview?.status === 'APPROVED' || tenant.outletComplianceStatus === 'verified') {
      result[4] = 'approved';
    } else if (isOutletComplete) {
      result[4] = 'complete';
    }

    // Step 5: Review
    if (
      result[1] !== 'incomplete' &&
      result[2] !== 'incomplete' &&
      result[3] !== 'incomplete' &&
      result[4] !== 'incomplete'
    ) {
      result[5] = isAgreed ? 'complete' : 'incomplete';
    }

    return result;
  }, [
    sectionReviewsMap,
    uploadedDocs,
    businessProfile,
    isCreatingNewProfile,
    activeReusedProfile,
    profileFormData,
    representativeFormData,
    settlementAccounts,
    selectedAccountId,
    isAddingNewAccount,
    settlementFormData,
    tenant,
    outletFormData,
    isAgreed,
    modifiedSections,
  ]);

  const completedSteps = React.useMemo(() => {
    return [1, 2, 3, 4, 5].filter((n) => stepStatuses[n] === 'complete' || stepStatuses[n] === 'approved');
  }, [stepStatuses]);

  const firstIncompleteStep = React.useMemo(() => {
    for (let i = 1; i <= 5; i++) {
      if (stepStatuses[i] === 'incomplete' || stepStatuses[i] === 'changes_requested') {
        return i;
      }
    }
    return 5;
  }, [stepStatuses]);

  const isCurrentStepPreview = currentStep > firstIncompleteStep && stepStatuses[firstIncompleteStep] === 'incomplete';

  const handlePreviewFieldClick = (e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-allow-preview-click="true"]') ||
        target.closest('#preview-file-modal-root')
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    }
    const incompleteStepItem = WIZARD_STEPS.find((s) => s.number === firstIncompleteStep);
    const stepName = incompleteStepItem
      ? `Langkah ${firstIncompleteStep} (${incompleteStepItem.title})`
      : `Langkah ${firstIncompleteStep}`;
    toast.warning(`Selesaikan pengisian dokumen ${stepName} terlebih dahulu.`);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setIsCreatingNewProfile(false);
    const profile =
      businessProfile && businessProfile.id === profileId
        ? businessProfile
        : availableProfiles.find((p: any) => p.id === profileId);
    if (profile) {
      setProfileFormData({
        name: profile.name || '',
        entityType: (profile.entityType || '') as EntityType,
        taxId: profile.taxId || '',
        businessLicenseNumber: profile.businessLicenseNumber || '',
      });
      setRepresentativeFormData({
        responsiblePersonName: profile.responsiblePersonName || '',
        responsiblePersonPosition: (profile as any)?.responsiblePersonPosition || '',
        responsiblePersonPhone: profile.responsiblePersonContact || '',
        responsiblePersonContact: profile.responsiblePersonContact || '',
        responsiblePersonEmail: (profile as any)?.responsiblePersonEmail || '',
        responsiblePersonNationality: (profile as any)?.responsiblePersonNationality || '',
        responsiblePersonNik: profile.responsiblePersonNik || '',
      });
    }
  };

  const handleToggleCreatingNew = (createNew: boolean) => {
    setIsCreatingNewProfile(createNew);
    if (createNew) {
      setProfileFormData({
        name: '',
        entityType: '' as any,
        taxId: '',
        businessLicenseNumber: '',
      });
      setRepresentativeFormData({
        responsiblePersonName: '',
        responsiblePersonPosition: '',
        responsiblePersonPhone: '',
        responsiblePersonContact: '',
        responsiblePersonEmail: '',
        responsiblePersonNationality: '',
        responsiblePersonNik: '',
      });
      setUploadedDocs((prev) => {
        const next = { ...prev };
        delete next['KTP'];
        delete next['NIB'];
        delete next['NPWP'];
        delete next['AKTA'];
        return next;
      });
      setKtpPreview(null);
    } else if (selectedProfileId) {
      handleSelectProfile(selectedProfileId);
    }
  };

  const handleDocumentUpload = async (
    docType: string,
    file: File,
    scope: 'BUSINESS_PROFILE' | 'OUTLET' | 'SETTLEMENT_ACCOUNT' = 'BUSINESS_PROFILE'
  ) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('documentScope', scope);
      if (tenant?.id) formData.append('tenantId', tenant.id);
      formData.append('outletKey', outletKey);

      const targetBpId = businessProfile?.id || selectedProfileId;
      if (targetBpId) formData.append('businessProfileId', targetBpId);

      const res = await uploadVerificationDocumentAction(formData);
      const storageKey = res.storageKey || res.document?.storageKey;

      if (!res.success || !storageKey) {
        toast.error(res.error || 'Gagal mengunggah dokumen.');
        return;
      }

      const docItem: VerificationDocumentInput = {
        documentType: docType as any,
        storageKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
      };

      setUploadedDocs((prev) => ({
        ...prev,
        [docType]: {
          ...docItem,
          reviewStatus: 'PENDING',
          reviewNote: null,
          isNewlyUpdated: true,
        },
      }));

      const previewUrl = URL.createObjectURL(file);
      setDocPreviews((prev) => ({ ...prev, [docType]: previewUrl }));

      if (docType === 'FOTO_TAMPAK_DEPAN') {
        setOutletFormData((prev) => ({ ...prev, storefrontPhotoUrl: storageKey }));
        setStorefrontPreview(previewUrl);
        setModifiedSections((prev) => ({ ...prev, outlet: true }));
      } else if (docType === 'FOTO_KASIR') {
        setOutletFormData((prev) => ({ ...prev, indoorPhotoUrl: storageKey }));
        setIndoorPreview(previewUrl);
        setModifiedSections((prev) => ({ ...prev, outlet: true }));
      } else if (docType === 'KTP') {
        setKtpPreview(previewUrl);
        setModifiedSections((prev) => ({ ...prev, representative: true }));
      } else if (scope === 'SETTLEMENT_ACCOUNT') {
        setProofDoc(docItem);
        setModifiedSections((prev) => ({ ...prev, settlement: true }));
      } else {
        setModifiedSections((prev) => ({ ...prev, profile: true }));
      }

      toast.success(`Dokumen ${docType} berhasil diperbarui.`);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan unggah.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentRemove = (docType: string) => {
    setUploadedDocs((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    setDocPreviews((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    if (docType === 'FOTO_TAMPAK_DEPAN') {
      setOutletFormData((prev) => ({ ...prev, storefrontPhotoUrl: '' }));
      setStorefrontPreview(null);
    } else if (docType === 'FOTO_KASIR') {
      setOutletFormData((prev) => ({ ...prev, indoorPhotoUrl: '' }));
      setIndoorPreview(null);
    } else if (docType === 'KTP') {
      setKtpPreview(null);
    } else if (docType === 'BUKU_TABUNGAN') {
      setProofDoc(null);
    }
  };

  // Autosave Draft
  const persistDraft = (stepToSave: number) => {
    saveVerificationDraftAction(outletKey, stepToSave, {
      profile: profileFormData,
      representative: representativeFormData,
      settlement: {
        selectedAccountId,
        isAddingNew: isAddingNewAccount,
        isEditingExisting: isEditingExistingAccount,
        ...settlementFormData,
      },
      outlet: outletFormData,
      documents: Object.values(uploadedDocs),
    }).catch(() => {});
  };

  // Step Validation & Progression
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (isCreatingNewProfile) {
        if (!profileFormData.name.trim()) {
          toast.error('Nama badan usaha wajib diisi.');
          return;
        }
        if (!profileFormData.entityType) {
          toast.error('Pilih bentuk entitas usaha terlebih dahulu.');
          return;
        }
      } else {
        if (!selectedProfileId) {
          toast.error('Pilih profil bisnis yang akan digunakan.');
          return;
        }
      }
      persistDraft(2);
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (isCreatingNewProfile || !activeReusedProfile) {
        if (!representativeFormData.responsiblePersonName.trim()) {
          toast.error('Nama penanggung jawab wajib diisi.');
          return;
        }
        if (!representativeFormData.responsiblePersonPosition) {
          toast.error('Pilih jabatan di perusahaan terlebih dahulu.');
          return;
        }
        if (representativeFormData.responsiblePersonNik.length !== 16) {
          toast.error('NIK harus 16 digit angka.');
          return;
        }
        const phoneVal =
          representativeFormData.responsiblePersonPhone?.trim() ||
          representativeFormData.responsiblePersonContact.trim();
        if (!phoneVal) {
          toast.error('Nomor telepon penanggung jawab wajib diisi.');
          return;
        }
        if (!representativeFormData.responsiblePersonNationality) {
          toast.error('Pilih kewarganegaraan terlebih dahulu.');
          return;
        }
        if (!uploadedDocs['KTP']) {
          toast.error('Harap unggah foto e-KTP penanggung jawab.');
          return;
        }
      }
      persistDraft(3);
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const selectedAccount = settlementAccounts.find((a: any) => a.id === selectedAccountId);
      const isAccountRejected = selectedAccount?.verificationStatus === 'rejected';

      if (isAddingNewAccount || isAccountRejected || isEditingExistingAccount) {
        const finalBank =
          settlementFormData.bankName === 'BANK LAINNYA'
            ? settlementFormData.customBankName.trim()
            : settlementFormData.bankName;
        if (!finalBank) {
          toast.error('Nama bank wajib diisi.');
          return;
        }
        if (!settlementFormData.bankAccountNumber.trim()) {
          toast.error('Nomor rekening bank wajib diisi.');
          return;
        }
        if (!settlementFormData.bankAccountHolder.trim()) {
          toast.error('Nama pemilik rekening wajib diisi.');
          return;
        }
      } else {
        if (!selectedAccountId) {
          toast.error('Pilih rekening penampungan yang akan digunakan.');
          return;
        }
      }
      persistDraft(4);
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!outletFormData.address.trim()) {
        toast.error('Alamat lengkap gerai wajib diisi.');
        return;
      }
      if (!outletFormData.province?.trim()) {
        toast.error('Provinsi gerai wajib dipilih.');
        return;
      }
      if (!outletFormData.city.trim()) {
        toast.error('Kota / Kabupaten gerai wajib dipilih.');
        return;
      }
      if (!outletFormData.district?.trim()) {
        toast.error('Kecamatan gerai wajib dipilih.');
        return;
      }
      if (outletFormData.postalCode.length !== 5) {
        toast.error('Kode pos harus 5 digit angka.');
        return;
      }
      if (!uploadedDocs['FOTO_TAMPAK_DEPAN'] && !tenant.storefrontPhotoUrl) {
        toast.error('Harap unggah foto tampak depan gerai.');
        return;
      }
      if (!uploadedDocs['FOTO_KASIR'] && !tenant.indoorPhotoUrl) {
        toast.error('Harap unggah foto area meja kasir gerai.');
        return;
      }
      persistDraft(5);
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      handleSubmitFinal();
    }
  };

  // Final Unified Submission on Step 5
  const handleSubmitFinal = async () => {
    if (!isAgreed) {
      toast.error('Harap centang pernyataan persetujuan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const documentsPayload = Object.values(uploadedDocs).map((d: any) => ({
        documentType: d.documentType,
        storageKey: d.storageKey,
        fileName: d.fileName,
        fileSizeBytes: d.fileSizeBytes,
        mimeType: d.mimeType,
      }));

      const res = await submitVerificationApplicationAction(outletKey, {
        profile: {
          id: isCreatingNewProfile ? undefined : selectedProfileId,
          isCreatingNew: isCreatingNewProfile,
          name: profileFormData.name,
          entityType: profileFormData.entityType,
          taxId: profileFormData.taxId || null,
          businessLicenseNumber: profileFormData.businessLicenseNumber || null,
        },
        representative: {
          responsiblePersonName: representativeFormData.responsiblePersonName,
          responsiblePersonPosition: representativeFormData.responsiblePersonPosition || 'Pemilik',
          responsiblePersonPhone:
            representativeFormData.responsiblePersonPhone || representativeFormData.responsiblePersonContact,
          responsiblePersonContact: representativeFormData.responsiblePersonContact || null,
          responsiblePersonEmail: representativeFormData.responsiblePersonEmail || null,
          responsiblePersonNationality: representativeFormData.responsiblePersonNationality || 'Indonesia',
          responsiblePersonNik: representativeFormData.responsiblePersonNik,
        },
        settlement: {
          selectedAccountId: isAddingNewAccount ? null : selectedAccountId,
          isAddingNew: isAddingNewAccount,
          bankName:
            settlementFormData.bankName === 'BANK LAINNYA'
              ? settlementFormData.customBankName.trim()
              : settlementFormData.bankName,
          customBankName: settlementFormData.customBankName || undefined,
          bankAccountNumber: settlementFormData.bankAccountNumber,
          bankAccountHolder: settlementFormData.bankAccountHolder,
          isDefault: isAddingNewAccount ? settlementFormData.isDefault : undefined,
          proofDocumentKey: proofDoc?.storageKey || null,
        },
        outlet: {
          address: outletFormData.address,
          province: outletFormData.province || null,
          city: outletFormData.city,
          district: outletFormData.district || null,
          postalCode: outletFormData.postalCode,
          latitude: outletFormData.latitude || null,
          longitude: outletFormData.longitude || null,
          mapsUrl: outletFormData.mapsUrl || null,
          storefrontPhotoUrl: outletFormData.storefrontPhotoUrl || null,
          indoorPhotoUrl: outletFormData.indoorPhotoUrl || null,
        },
        documents: documentsPayload,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal mengirimkan permohonan verifikasi.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Pengajuan verifikasi berhasil dikirimkan ke tim kepatuhan.');
      router.push(`/outlet/${outletKey}/verification`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat mengajukan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultStepKey = `step-${currentStep}-default`;

  return (
    <GuidelineProvider defaultStepKey={defaultStepKey}>
      <div className="fixed inset-0 z-[60] bg-[#F9FBFF] flex flex-col overflow-hidden text-slate-900">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 px-4 md:px-6 flex items-center justify-between select-none">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl font-bold tracking-tight text-[#0e59f9] font-sans">
              menuin.
            </span>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="min-w-0 hidden sm:block">
              <span className="text-xs font-semibold text-slate-900 truncate block">
                Verifikasi Bisnis &amp; Pembayaran
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                Outlet: {tenant.name}
              </span>
            </div>
          </div>

          {isUploading || isSubmitting ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border-none bg-slate-100 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
            >
              <span>Simpan &amp; Keluar</span>
              <X className="w-3.5 h-3.5 text-slate-300" />
            </button>
          ) : (
            <Link
              href={`/outlet/${outletKey}/verification`}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <span>Simpan &amp; Keluar</span>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          )}
        </header>

        {/* 3-Column Work Area */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Column 1: Stepper (Left) */}
          <WizardStepper
            currentStep={currentStep}
            onStepClick={(step) => {
              persistDraft(step);
              setCurrentStep(step);
            }}
            completedSteps={completedSteps}
            stepStatuses={stepStatuses}
            firstIncompleteStep={firstIncompleteStep}
            disabled={isUploading || isSubmitting}
          />

          {/* Column 2: Form Canvas (Center) */}
          <main className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
              <div className="w-full max-w-2xl mx-auto">
                {/* Active Step Content */}
                <div
                  className="relative pb-8"
                  onClickCapture={(e) => {
                    if (isUploading) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.info('Mohon tunggu, proses upload dokumen sedang berlangsung...');
                      return;
                    }
                    if (isCurrentStepPreview) {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('[data-allow-preview-click="true"]') ||
                        target.closest('#preview-file-modal-root')
                      ) {
                        return;
                      }
                      if (
                        target.tagName === 'INPUT' ||
                        target.tagName === 'SELECT' ||
                        target.tagName === 'BUTTON' ||
                        target.closest('input') ||
                        target.closest('select') ||
                        target.closest('button') ||
                        target.closest('[role="button"]')
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePreviewFieldClick(e);
                      }
                    }
                  }}
                >
                  {currentStep === 1 && (
                    <Step1BusinessProfile
                      availableProfiles={availableProfiles}
                      selectedProfileId={selectedProfileId}
                      onSelectProfileId={handleSelectProfile}
                      isCreatingNew={isCreatingNewProfile}
                      onToggleCreatingNew={handleToggleCreatingNew}
                      isEditingSelectedProfile={isEditingSelectedProfile}
                      onToggleEditingSelectedProfile={setIsEditingSelectedProfile}
                      isRepaired={
                        stepStatuses[1] === 'complete' &&
                        sectionReviewsMap['BUSINESS_PROFILE']?.status === 'CHANGES_REQUESTED'
                      }
                      sectionReviewNote={sectionReviewsMap['BUSINESS_PROFILE']?.note}
                      sectionReviewStatus={sectionReviewsMap['BUSINESS_PROFILE']?.status}
                      formData={profileFormData}
                      onFormChange={(field, val) => {
                        setProfileFormData((prev) => ({ ...prev, [field]: val }));
                        setModifiedSections((prev) => ({ ...prev, profile: true }));
                      }}
                      documents={uploadedDocs}
                      docPreviews={docPreviews}
                      onDocumentUpload={(docType, file) =>
                        handleDocumentUpload(docType, file, 'BUSINESS_PROFILE')
                      }
                      onDocumentRemove={handleDocumentRemove}
                      isUploading={isUploading}
                      isPreviewOnly={isCurrentStepPreview}
                    />
                  )}

                  {currentStep === 2 && (
                    <Step2Representative
                      isUsingExistingProfile={!isCreatingNewProfile && Boolean(activeReusedProfile)}
                      existingProfile={activeReusedProfile}
                      isRepaired={
                        stepStatuses[2] === 'complete' &&
                        sectionReviewsMap['REPRESENTATIVE']?.status === 'CHANGES_REQUESTED'
                      }
                      sectionReviewNote={sectionReviewsMap['REPRESENTATIVE']?.note}
                      sectionReviewStatus={sectionReviewsMap['REPRESENTATIVE']?.status}
                      formData={representativeFormData}
                      onFormChange={(field, val) => {
                        setRepresentativeFormData((prev) => ({ ...prev, [field]: val }));
                        setModifiedSections((prev) => ({ ...prev, representative: true }));
                      }}
                      documents={uploadedDocs}
                      ktpPreviewUrl={ktpPreview || docPreviews['KTP']}
                      onDocumentUpload={(docType, file) =>
                        handleDocumentUpload(docType, file, 'BUSINESS_PROFILE')
                      }
                      onDocumentRemove={handleDocumentRemove}
                      isUploading={isUploading}
                      isPreviewOnly={isCurrentStepPreview}
                    />
                  )}

                  {currentStep === 3 && (
                    <Step3Settlement
                      existingAccounts={settlementAccounts}
                      selectedAccountId={selectedAccountId}
                      onSelectAccountId={(id) => {
                        setSelectedAccountId(id);
                        setModifiedSections((prev) => ({ ...prev, settlement: true }));
                      }}
                      isAddingNew={isAddingNewAccount}
                      onToggleAddingNew={(val) => {
                        setIsAddingNewAccount(val);
                        setModifiedSections((prev) => ({ ...prev, settlement: true }));
                      }}
                      isEditingExisting={isEditingExistingAccount}
                      onToggleEditingExisting={(val) => {
                        setIsEditingExistingAccount(val);
                        setModifiedSections((prev) => ({ ...prev, settlement: true }));
                      }}
                      isRepaired={
                        stepStatuses[3] === 'complete' &&
                        sectionReviewsMap['SETTLEMENT']?.status === 'CHANGES_REQUESTED'
                      }
                      sectionReviewNote={sectionReviewsMap['SETTLEMENT']?.note}
                      sectionReviewStatus={sectionReviewsMap['SETTLEMENT']?.status}
                      formData={settlementFormData}
                      onFormChange={(field, val) => {
                        setSettlementFormData((prev) => ({ ...prev, [field]: val }));
                        setModifiedSections((prev) => ({ ...prev, settlement: true }));
                      }}
                      picName={
                        activeReusedProfile?.responsiblePersonName ||
                        representativeFormData.responsiblePersonName
                      }
                      businessName={
                        activeReusedProfile?.name || profileFormData.name
                      }
                      proofDocument={proofDoc || uploadedDocs['BUKU_TABUNGAN']}
                      proofPreviewUrl={docPreviews['BUKU_TABUNGAN'] || proofDoc?.previewUrl || uploadedDocs['BUKU_TABUNGAN']?.previewUrl}
                      onProofUpload={(file) =>
                        handleDocumentUpload('BUKU_TABUNGAN', file, 'SETTLEMENT_ACCOUNT')
                      }
                      onProofRemove={() => {
                        setProofDoc(null);
                        setDocPreviews((prev) => {
                          const copy = { ...prev };
                          delete copy['BUKU_TABUNGAN'];
                          return copy;
                        });
                      }}
                      isUploading={isUploading}
                      isPreviewOnly={isCurrentStepPreview}
                    />
                  )}

                  {currentStep === 4 && (
                    <Step4Outlet
                      formData={outletFormData}
                      onFormChange={(field, val) => {
                        setOutletFormData((prev) => ({ ...prev, [field]: val }));
                        setModifiedSections((prev) => ({ ...prev, outlet: true }));
                      }}
                      isRepaired={
                        stepStatuses[4] === 'complete' &&
                        sectionReviewsMap['OUTLET']?.status === 'CHANGES_REQUESTED'
                      }
                      sectionReviewNote={sectionReviewsMap['OUTLET']?.note}
                      sectionReviewStatus={sectionReviewsMap['OUTLET']?.status}
                      documents={uploadedDocs}
                      onPhotoUpload={(docType, file) =>
                        handleDocumentUpload(docType, file, 'OUTLET')
                      }
                      onPhotoRemove={handleDocumentRemove}
                      storefrontPreviewUrl={storefrontPreview || docPreviews['FOTO_TAMPAK_DEPAN']}
                      cashierPreviewUrl={indoorPreview || docPreviews['FOTO_KASIR']}
                      isUploading={isUploading}
                      isPreviewOnly={isCurrentStepPreview}
                    />
                  )}

                  {currentStep === 5 && (
                    <Step5Review
                      businessProfileData={{
                        name: activeReusedProfile?.name || profileFormData.name,
                        entityType: activeReusedProfile?.entityType || profileFormData.entityType,
                        businessLicenseNumber:
                          activeReusedProfile?.businessLicenseNumber ||
                          profileFormData.businessLicenseNumber,
                        taxId: activeReusedProfile?.taxId || profileFormData.taxId,
                      }}
                      representativeData={{
                        responsiblePersonName:
                          activeReusedProfile?.responsiblePersonName ||
                          representativeFormData.responsiblePersonName,
                        responsiblePersonNik:
                          activeReusedProfile?.responsiblePersonNik ||
                          representativeFormData.responsiblePersonNik,
                        responsiblePersonContact:
                          activeReusedProfile?.responsiblePersonContact ||
                          representativeFormData.responsiblePersonPhone ||
                          representativeFormData.responsiblePersonContact,
                        responsiblePersonPosition:
                          representativeFormData.responsiblePersonPosition || 'Pemilik',
                        responsiblePersonPhone:
                          representativeFormData.responsiblePersonPhone ||
                          representativeFormData.responsiblePersonContact,
                        responsiblePersonEmail:
                          representativeFormData.responsiblePersonEmail || '',
                        responsiblePersonNationality:
                          representativeFormData.responsiblePersonNationality || 'Indonesia',
                      }}
                      settlementData={{
                        bankName:
                          (isAddingNewAccount || isEditingExistingAccount) && settlementFormData.bankName
                            ? settlementFormData.bankName === 'BANK LAINNYA'
                              ? settlementFormData.customBankName
                              : settlementFormData.bankName
                            : settlementAccounts.find((a: any) => a.id === selectedAccountId)?.bankName ||
                              'Rekening Terpilih',
                        bankAccountNumber:
                          (isAddingNewAccount || isEditingExistingAccount) && settlementFormData.bankAccountNumber
                            ? settlementFormData.bankAccountNumber
                            : settlementAccounts.find((a: any) => a.id === selectedAccountId)
                                ?.bankAccountNumberMasked || '-',
                        bankAccountHolder:
                          (isAddingNewAccount || isEditingExistingAccount) && settlementFormData.bankAccountHolder
                            ? settlementFormData.bankAccountHolder
                            : settlementAccounts.find((a: any) => a.id === selectedAccountId)
                                ?.bankAccountHolder || '-',
                      }}
                      outletData={{
                        name: tenant.name,
                        address: outletFormData.address,
                        province: outletFormData.province,
                        city: outletFormData.city,
                        district: outletFormData.district,
                        postalCode: outletFormData.postalCode,
                        mapsUrl: outletFormData.mapsUrl,
                        latitude: outletFormData.latitude,
                        longitude: outletFormData.longitude,
                      }}
                      documents={uploadedDocs}
                      onJumpToStep={setCurrentStep}
                      isAgreed={isAgreed}
                      onToggleAgree={setIsAgreed}
                      isUploading={isUploading}
                      isPreviewOnly={isCurrentStepPreview}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Docked Action Footer Bar */}
            <footer className="h-16 flex-shrink-0 bg-white border-t border-slate-100 px-6 md:px-10 flex items-center justify-between select-none">
              <div className="w-full max-w-2xl mx-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentStep === 1 || isSubmitting || isUploading}
                  className="h-9 px-4 rounded-full border-none bg-white shadow-sm-md hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>

                {isCurrentStepPreview ? (
                  <button
                    type="button"
                    onClick={() => !isUploading && setCurrentStep(firstIncompleteStep)}
                    disabled={isUploading || isSubmitting}
                    className={cn(
                      'h-9 px-5 rounded-full text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-colors',
                      isUploading || isSubmitting
                        ? 'bg-[#0e59f9]/50 cursor-not-allowed'
                        : 'bg-[#0e59f9] hover:bg-[#0b4de0] cursor-pointer'
                    )}
                  >
                    <span>Lengkapi Langkah {firstIncompleteStep}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSubmitting || isUploading || (currentStep === 5 && !isAgreed)}
                    className="h-9 px-5 rounded-full bg-[#0e59f9] hover:bg-[#0b4de0] text-white text-xs font-semibold shadow-md inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Mengirimkan Pengajuan...</span>
                      </>
                    ) : isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Mengunggah Dokumen...</span>
                      </>
                    ) : currentStep === 5 ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Kirim Pengajuan Verifikasi</span>
                      </>
                    ) : (
                      <>
                        <span>Simpan &amp; Lanjutkan</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </footer>
          </main>

          {/* Column 3: Persistent Guidelines Panel (Right) */}
          <GuidelinePanel />
        </div>
      </div>
    </GuidelineProvider>
  );
}

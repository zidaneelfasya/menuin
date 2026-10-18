import { describe, it, expect } from 'vitest';
import {
  decideBusinessVerificationTransition,
  decideOutletComplianceTransition,
  evaluatePaymentReadiness,
} from './state-machine';
import type {
  BusinessProfileVerificationStatus,
  OutletComplianceStatus,
  ProviderOnboardingStatus,
} from '@menuin/types';

describe('BV-020: End-to-End Verification Flow Integration', () => {
  it('walks through the complete two-tier, 4-state verification lifecycle', () => {
    // Stage 1: Initial state
    let profileStatus: BusinessProfileVerificationStatus = 'not_started';
    let outletStatus: OutletComplianceStatus = 'incomplete';
    let dokuStatus: ProviderOnboardingStatus = 'NOT_PROVISIONED';
    let onlinePaymentEnabled = false;

    let readiness = evaluatePaymentReadiness({
      businessProfileStatus: profileStatus,
      outletComplianceStatus: outletStatus,
      dokuSubAccountId: null,
      dokuSubAccountStatus: dokuStatus,
      onlinePaymentEnabled,
      isPlatformConfigured: true,
    });
    expect(readiness.status).toBe('BLOCKED');

    // Stage 2: Merchant saves draft and submits Tier 1
    const draftRes = decideBusinessVerificationTransition(profileStatus, 'SAVE_DRAFT', 'MERCHANT');
    expect(draftRes.success).toBe(true);
    if (draftRes.success) profileStatus = draftRes.nextStatus;
    expect(profileStatus).toBe('draft');

    const submitRes = decideBusinessVerificationTransition(profileStatus, 'SUBMIT', 'MERCHANT');
    expect(submitRes.success).toBe(true);
    if (submitRes.success) profileStatus = submitRes.nextStatus;
    expect(profileStatus).toBe('submitted');

    // Stage 3: Admin claims review
    const claimRes = decideBusinessVerificationTransition(profileStatus, 'CLAIM_REVIEW', 'ADMIN');
    expect(claimRes.success).toBe(true);
    if (claimRes.success) profileStatus = claimRes.nextStatus;
    expect(profileStatus).toBe('under_review');

    // Stage 4: Admin requests changes (e.g. blurry KTP)
    const changeReqRes = decideBusinessVerificationTransition(profileStatus, 'REQUEST_CHANGES', 'ADMIN');
    expect(changeReqRes.success).toBe(true);
    if (changeReqRes.success) profileStatus = changeReqRes.nextStatus;
    expect(profileStatus).toBe('action_required');

    // Stage 5: Merchant resubmits
    const resubmitRes = decideBusinessVerificationTransition(profileStatus, 'SUBMIT', 'MERCHANT');
    expect(resubmitRes.success).toBe(true);
    if (resubmitRes.success) profileStatus = resubmitRes.nextStatus;
    expect(profileStatus).toBe('submitted');

    // Stage 6: Admin approves Tier 1 Legal Profile
    const approveProfileRes = decideBusinessVerificationTransition(profileStatus, 'APPROVE', 'ADMIN');
    expect(approveProfileRes.success).toBe(true);
    if (approveProfileRes.success) profileStatus = approveProfileRes.nextStatus;
    expect(profileStatus).toBe('verified');

    // Stage 7: Even with Tier 1 approved, payment MUST remain blocked because Tier 2 is incomplete
    readiness = evaluatePaymentReadiness({
      businessProfileStatus: profileStatus,
      outletComplianceStatus: outletStatus,
      dokuSubAccountId: null,
      dokuSubAccountStatus: dokuStatus,
      onlinePaymentEnabled,
      isPlatformConfigured: true,
    });
    expect(readiness.status).toBe('BLOCKED');
    expect(readiness.blockingReasons.some((r) => r.includes('outlet'))).toBe(true);

    // Stage 8: Merchant submits Tier 2 Outlet Physical Compliance
    const submitOutletRes = decideOutletComplianceTransition(outletStatus, 'SUBMIT_LOCATION', 'MERCHANT');
    expect(submitOutletRes.success).toBe(true);
    if (submitOutletRes.success) outletStatus = submitOutletRes.nextStatus;
    expect(outletStatus).toBe('ready_for_review');

    // Stage 9: Admin approves Tier 2 Outlet Compliance
    const approveOutletRes = decideOutletComplianceTransition(outletStatus, 'APPROVE_LOCATION', 'ADMIN');
    expect(approveOutletRes.success).toBe(true);
    if (approveOutletRes.success) outletStatus = approveOutletRes.nextStatus;
    expect(outletStatus).toBe('verified');

    // Stage 10: DOKU Sub Account provisioned & online payments enabled
    dokuStatus = 'ACTIVE';
    const subAccountId = 'SAC-MENUIN-001';
    onlinePaymentEnabled = true;

    // Stage 11: Final Payment Readiness Evaluated -> READY!
    readiness = evaluatePaymentReadiness({
      businessProfileStatus: profileStatus,
      outletComplianceStatus: outletStatus,
      dokuSubAccountId: subAccountId,
      dokuSubAccountStatus: dokuStatus,
      onlinePaymentEnabled,
      isPlatformConfigured: true,
    });
    expect(readiness.status).toBe('READY');
    expect(readiness.blockingReasons.length).toBe(0);
  });
});

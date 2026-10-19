import { describe, expect, it } from 'vitest';
import {
  decideBusinessVerificationTransition,
  decideOutletComplianceTransition,
  evaluatePaymentReadiness,
} from './state-machine';

describe('Verification State Machine (Tier 1: Business Profile)', () => {
  it('allows merchant to save draft from not_started and draft', () => {
    const res1 = decideBusinessVerificationTransition('not_started', 'SAVE_DRAFT', 'MERCHANT');
    expect(res1).toEqual({ success: true, nextStatus: 'draft' });

    const res2 = decideBusinessVerificationTransition('draft', 'SAVE_DRAFT', 'MERCHANT');
    expect(res2).toEqual({ success: true, nextStatus: 'draft' });
  });

  it('allows merchant to submit from draft or action_required', () => {
    const res1 = decideBusinessVerificationTransition('draft', 'SUBMIT', 'MERCHANT');
    expect(res1).toEqual({ success: true, nextStatus: 'submitted' });

    const res2 = decideBusinessVerificationTransition('action_required', 'SUBMIT', 'MERCHANT');
    expect(res2).toEqual({ success: true, nextStatus: 'submitted' });
  });

  it('prevents merchant from approving their own verification', () => {
    const res = decideBusinessVerificationTransition('under_review', 'APPROVE', 'MERCHANT');
    expect(res.success).toBe(false);
  });

  it('allows admin to claim review, approve, request changes, or reject', () => {
    const claim = decideBusinessVerificationTransition('submitted', 'CLAIM_REVIEW', 'ADMIN');
    expect(claim).toEqual({ success: true, nextStatus: 'under_review' });

    const reqChanges = decideBusinessVerificationTransition('under_review', 'REQUEST_CHANGES', 'ADMIN');
    expect(reqChanges).toEqual({ success: true, nextStatus: 'action_required' });

    const approve = decideBusinessVerificationTransition('under_review', 'APPROVE', 'ADMIN');
    expect(approve).toEqual({ success: true, nextStatus: 'verified' });

    const reject = decideBusinessVerificationTransition('under_review', 'REJECT', 'ADMIN');
    expect(reject).toEqual({ success: true, nextStatus: 'rejected' });
  });

  it('handles suspend and unsuspend lifecycle', () => {
    const suspend = decideBusinessVerificationTransition('verified', 'SUSPEND', 'ADMIN');
    expect(suspend).toEqual({ success: true, nextStatus: 'suspended' });

    const unsuspend = decideBusinessVerificationTransition('suspended', 'UNSUSPEND', 'ADMIN');
    expect(unsuspend).toEqual({ success: true, nextStatus: 'verified' });
  });
});

describe('Verification State Machine (Tier 2: Outlet Compliance)', () => {
  it('allows merchant to submit location details', () => {
    const res = decideOutletComplianceTransition('incomplete', 'SUBMIT_LOCATION', 'MERCHANT');
    expect(res).toEqual({ success: true, nextStatus: 'ready_for_review' });
  });

  it('allows admin to approve or request changes on outlet location', () => {
    const approve = decideOutletComplianceTransition('ready_for_review', 'APPROVE_LOCATION', 'ADMIN');
    expect(approve).toEqual({ success: true, nextStatus: 'verified' });

    const changes = decideOutletComplianceTransition('ready_for_review', 'REQUEST_LOCATION_CHANGES', 'ADMIN');
    expect(changes).toEqual({ success: true, nextStatus: 'action_required' });
  });
});

describe('evaluatePaymentReadiness (Decoupled 4-Status Engine)', () => {
  it('returns READY only when all 5 conditions are satisfied', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(true);
    expect(result.status).toBe('READY');
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks payment readiness if business profile is not verified even if outlet has subaccount', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'under_review',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.status).toBe('BLOCKED');
    expect(result.businessVerified).toBe(false);
    expect(result.reasons.some((r) => r.includes('Profil bisnis'))).toBe(true);
  });

  it('blocks payment readiness if outlet location is incomplete', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'incomplete',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.status).toBe('BLOCKED');
    expect(result.outletVerified).toBe(false);
    expect(result.reasons.some((r) => r.includes('outlet'))).toBe(true);
  });

  it('blocks payment readiness if DOKU sub-account is missing or not active', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: null,
      dokuSubAccountStatus: null,
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.dokuActive).toBe(false);
    expect(result.reasons.some((r) => r.includes('DOKU'))).toBe(true);
  });

  it('blocks payment readiness if merchant toggle is false', () => {
    const result = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-1234',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: false,
      isPlatformConfigured: true,
    });

    expect(result.isReady).toBe(false);
    expect(result.onlinePaymentToggled).toBe(false);
    expect(result.reasons.some((r) => r.includes('belum diaktifkan'))).toBe(true);
  });
});

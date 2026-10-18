import { describe, it, expect } from 'vitest';
import {
  Role,
  VerificationPermissions,
  hasPermission,
  assertPermission,
} from '@menuin/permissions';
import { evaluatePaymentReadiness } from './state-machine';

describe('BV-019: Security & Authorization Automated Suite', () => {
  it('strictly restricts review and decision mutation permissions to authorized admin roles', () => {
    const adminRoles = [Role.SYSTEM_ADMIN, Role.SUPERADMIN, Role.VERIFICATION_ADMIN];
    const nonAdminRoles = [Role.OWNER, Role.MANAGER, Role.CASHIER, Role.STAFF, Role.CARE_AGENT];

    for (const r of adminRoles) {
      expect(hasPermission(r, VerificationPermissions.REVIEW)).toBe(true);
      expect(hasPermission(r, VerificationPermissions.APPROVE)).toBe(true);
      expect(hasPermission(r, VerificationPermissions.REJECT)).toBe(true);
      expect(hasPermission(r, VerificationPermissions.REQUEST_CHANGES)).toBe(true);
    }

    for (const r of nonAdminRoles) {
      expect(hasPermission(r, VerificationPermissions.REVIEW)).toBe(false);
      expect(hasPermission(r, VerificationPermissions.APPROVE)).toBe(false);
      expect(hasPermission(r, VerificationPermissions.REJECT)).toBe(false);
      expect(hasPermission(r, VerificationPermissions.REQUEST_CHANGES)).toBe(false);
    }
  });

  it('allows CARE_AGENT to view summary but blocks raw unmasked PII and approval', () => {
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.CARE_VIEW_SUMMARY)).toBe(true);
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.VIEW_SENSITIVE_PII)).toBe(false);
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.APPROVE)).toBe(false);

    expect(() =>
      assertPermission(Role.CARE_AGENT, VerificationPermissions.APPROVE)
    ).toThrowError(/Akses ditolak/);
  });

  it('enforces that payment readiness is BLOCKED if any single criteria in the 4 decoupled states is missing', () => {
    // 1. Missing Tier 1 (Business Profile not verified)
    const blockedTier1 = evaluatePaymentReadiness({
      businessProfileStatus: 'under_review',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-123',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });
    expect(blockedTier1.status).toBe('BLOCKED');
    expect(blockedTier1.blockingReasons.some((r) => r.includes('Profil bisnis'))).toBe(true);

    // 2. Missing Tier 2 (Outlet not verified)
    const blockedTier2 = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'incomplete',
      dokuSubAccountId: 'SAC-123',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });
    expect(blockedTier2.status).toBe('BLOCKED');
    expect(blockedTier2.blockingReasons.some((r) => r.includes('outlet'))).toBe(true);

    // 3. Missing DOKU Sub Account
    const blockedDoku = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: null,
      dokuSubAccountStatus: 'NOT_PROVISIONED',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });
    expect(blockedDoku.status).toBe('BLOCKED');
    expect(blockedDoku.blockingReasons.some((r) => r.includes('DOKU'))).toBe(true);

    // 4. Missing Online Payment toggle
    const blockedToggle = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-123',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: false,
      isPlatformConfigured: true,
    });
    expect(blockedToggle.status).toBe('BLOCKED');
    expect(blockedToggle.blockingReasons.some((r) => r.includes('pembayaran non-tunai'))).toBe(true);

    // 5. All criteria satisfied -> READY
    const ready = evaluatePaymentReadiness({
      businessProfileStatus: 'verified',
      outletComplianceStatus: 'verified',
      dokuSubAccountId: 'SAC-123',
      dokuSubAccountStatus: 'ACTIVE',
      onlinePaymentEnabled: true,
      isPlatformConfigured: true,
    });
    expect(ready.status).toBe('READY');
    expect(ready.blockingReasons.length).toBe(0);
  });

  it('BV-028: strictly grants MANAGE_LEGAL, MANAGE_FINANCE, and SUBMIT_ONBOARDING to OWNER and denies MANAGER/CASHIER', () => {
    // OWNER should have full rights to onboard and manage legal/finance
    expect(hasPermission(Role.OWNER, VerificationPermissions.MANAGE_LEGAL)).toBe(true);
    expect(hasPermission(Role.OWNER, VerificationPermissions.MANAGE_FINANCE)).toBe(true);
    expect(hasPermission(Role.OWNER, VerificationPermissions.SUBMIT_ONBOARDING)).toBe(true);

    // Non-owners (MANAGER, CASHIER, STAFF) must be strictly blocked
    const restrictedRoles = [Role.MANAGER, Role.CASHIER, Role.STAFF];
    for (const r of restrictedRoles) {
      expect(hasPermission(r, VerificationPermissions.MANAGE_LEGAL)).toBe(false);
      expect(hasPermission(r, VerificationPermissions.MANAGE_FINANCE)).toBe(false);
      expect(hasPermission(r, VerificationPermissions.SUBMIT_ONBOARDING)).toBe(false);

      expect(() => assertPermission(r, VerificationPermissions.MANAGE_LEGAL)).toThrowError(
        /Akses ditolak/
      );
      expect(() => assertPermission(r, VerificationPermissions.SUBMIT_ONBOARDING)).toThrowError(
        /Akses ditolak/
      );
    }
  });
});

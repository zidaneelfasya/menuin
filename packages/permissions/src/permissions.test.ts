import { describe, expect, it } from 'vitest';
import {
  Role,
  VerificationPermissions,
  assertPermission,
  hasPermission,
  ForbiddenError,
} from './index';

describe('Permissions Model (BV-002)', () => {
  it('grants full review permissions to SYSTEM_ADMIN and VERIFICATION_ADMIN', () => {
    expect(hasPermission(Role.SYSTEM_ADMIN, VerificationPermissions.REVIEW)).toBe(true);
    expect(hasPermission(Role.SYSTEM_ADMIN, VerificationPermissions.APPROVE)).toBe(true);
    expect(hasPermission(Role.VERIFICATION_ADMIN, VerificationPermissions.REVIEW)).toBe(true);
    expect(hasPermission(Role.VERIFICATION_ADMIN, VerificationPermissions.REJECT)).toBe(true);
  });

  it('denies mutation permissions to CARE_AGENT', () => {
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.REVIEW)).toBe(false);
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.APPROVE)).toBe(false);
    expect(hasPermission(Role.CARE_AGENT, VerificationPermissions.CARE_VIEW_SUMMARY)).toBe(true);
  });

  it('denies review permissions to merchant roles', () => {
    expect(hasPermission(Role.OWNER, VerificationPermissions.REVIEW)).toBe(false);
    expect(hasPermission(Role.MANAGER, VerificationPermissions.REVIEW)).toBe(false);
    expect(hasPermission(Role.CASHIER, VerificationPermissions.REVIEW)).toBe(false);
  });

  it('grants legal and finance management permissions strictly to OWNER and ADMIN, not to MANAGER or CASHIER', () => {
    expect(hasPermission(Role.OWNER, VerificationPermissions.MANAGE_LEGAL)).toBe(true);
    expect(hasPermission(Role.OWNER, VerificationPermissions.MANAGE_FINANCE)).toBe(true);
    expect(hasPermission(Role.OWNER, VerificationPermissions.SUBMIT_ONBOARDING)).toBe(true);

    expect(hasPermission(Role.MANAGER, VerificationPermissions.MANAGE_LEGAL)).toBe(false);
    expect(hasPermission(Role.MANAGER, VerificationPermissions.MANAGE_FINANCE)).toBe(false);
    expect(hasPermission(Role.MANAGER, VerificationPermissions.SUBMIT_ONBOARDING)).toBe(false);

    expect(hasPermission(Role.CASHIER, VerificationPermissions.MANAGE_LEGAL)).toBe(false);
    expect(hasPermission(Role.STAFF, VerificationPermissions.MANAGE_LEGAL)).toBe(false);
  });

  it('assertPermission throws ForbiddenError on missing permission', () => {
    expect(() => assertPermission(Role.OWNER, VerificationPermissions.APPROVE)).toThrow(
      ForbiddenError
    );
    expect(() =>
      assertPermission(Role.SYSTEM_ADMIN, VerificationPermissions.APPROVE)
    ).not.toThrow();
    expect(() =>
      assertPermission(Role.MANAGER, VerificationPermissions.MANAGE_LEGAL)
    ).toThrow(ForbiddenError);
  });
});

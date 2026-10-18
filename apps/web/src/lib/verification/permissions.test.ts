import { describe, expect, it } from 'vitest';
import {
  Role,
  VerificationPermissions,
  assertPermission,
  hasPermission,
  ForbiddenError,
} from '@menuin/permissions';

describe('Permissions Model via @menuin/permissions (BV-002)', () => {
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

  it('assertPermission throws ForbiddenError on missing permission', () => {
    expect(() => assertPermission(Role.OWNER, VerificationPermissions.APPROVE)).toThrow(
      ForbiddenError
    );
    expect(() =>
      assertPermission(Role.SYSTEM_ADMIN, VerificationPermissions.APPROVE)
    ).not.toThrow();
  });
});

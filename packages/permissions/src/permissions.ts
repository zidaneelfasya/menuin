import { Role, type RoleType } from './role';

export const VerificationPermissions = {
  VIEW_QUEUE: 'verification:view_queue',
  VIEW_DETAIL: 'verification:view_detail',
  REVIEW: 'verification:review',
  APPROVE: 'verification:approve',
  REJECT: 'verification:reject',
  REQUEST_CHANGES: 'verification:request_changes',
  ESCALATE: 'verification:escalate',
  VIEW_SENSITIVE_PII: 'verification:view_sensitive_pii',
  CARE_VIEW_SUMMARY: 'care:view_summary',
  MANAGE_LEGAL: 'verification:manage_legal',
  MANAGE_FINANCE: 'verification:manage_finance',
  SUBMIT_ONBOARDING: 'verification:submit_onboarding',
} as const;

export type VerificationPermission =
  (typeof VerificationPermissions)[keyof typeof VerificationPermissions];

export const ROLE_PERMISSIONS: Record<string, ReadonlySet<VerificationPermission>> = {
  [Role.SYSTEM_ADMIN]: new Set([
    VerificationPermissions.VIEW_QUEUE,
    VerificationPermissions.VIEW_DETAIL,
    VerificationPermissions.REVIEW,
    VerificationPermissions.APPROVE,
    VerificationPermissions.REJECT,
    VerificationPermissions.REQUEST_CHANGES,
    VerificationPermissions.ESCALATE,
    VerificationPermissions.VIEW_SENSITIVE_PII,
    VerificationPermissions.CARE_VIEW_SUMMARY,
    VerificationPermissions.MANAGE_LEGAL,
    VerificationPermissions.MANAGE_FINANCE,
    VerificationPermissions.SUBMIT_ONBOARDING,
  ]),
  [Role.SUPERADMIN]: new Set([
    VerificationPermissions.VIEW_QUEUE,
    VerificationPermissions.VIEW_DETAIL,
    VerificationPermissions.REVIEW,
    VerificationPermissions.APPROVE,
    VerificationPermissions.REJECT,
    VerificationPermissions.REQUEST_CHANGES,
    VerificationPermissions.ESCALATE,
    VerificationPermissions.VIEW_SENSITIVE_PII,
    VerificationPermissions.CARE_VIEW_SUMMARY,
    VerificationPermissions.MANAGE_LEGAL,
    VerificationPermissions.MANAGE_FINANCE,
    VerificationPermissions.SUBMIT_ONBOARDING,
  ]),
  [Role.VERIFICATION_ADMIN]: new Set([
    VerificationPermissions.VIEW_QUEUE,
    VerificationPermissions.VIEW_DETAIL,
    VerificationPermissions.REVIEW,
    VerificationPermissions.APPROVE,
    VerificationPermissions.REJECT,
    VerificationPermissions.REQUEST_CHANGES,
    VerificationPermissions.ESCALATE,
    VerificationPermissions.VIEW_SENSITIVE_PII,
  ]),
  [Role.CARE_AGENT]: new Set([
    VerificationPermissions.CARE_VIEW_SUMMARY,
  ]),
  [Role.OWNER]: new Set([
    VerificationPermissions.MANAGE_LEGAL,
    VerificationPermissions.MANAGE_FINANCE,
    VerificationPermissions.SUBMIT_ONBOARDING,
  ]),
  [Role.MANAGER]: new Set([]),
  [Role.CASHIER]: new Set([]),
  [Role.STAFF]: new Set([]),
};

export function hasPermission(role: RoleType | undefined | null, permission: VerificationPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions?.has(permission));
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function assertPermission(role: RoleType | undefined | null, permission: VerificationPermission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Akses ditolak: izin '${permission}' diperlukan.`);
  }
}

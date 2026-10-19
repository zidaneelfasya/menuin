export enum TenantRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  STAFF = 'STAFF',
  SUPERVISOR = 'SUPERVISOR',
}

export enum PlatformRole {
  USER = 'USER',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  VERIFICATION_ADMIN = 'VERIFICATION_ADMIN',
  CARE_AGENT = 'CARE_AGENT',
  SUPERADMIN = 'SUPERADMIN',
}

export enum Role {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  STAFF = 'STAFF',
  SUPERVISOR = 'SUPERVISOR',
  SUPERADMIN = 'SUPERADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  VERIFICATION_ADMIN = 'VERIFICATION_ADMIN',
  CARE_AGENT = 'CARE_AGENT',
}

export type RoleType = keyof typeof Role | string;
export type PlatformRoleType = keyof typeof PlatformRole | string;
export type TenantRoleType = keyof typeof TenantRole | string;

export function isPlatformAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ['SYSTEM_ADMIN', 'SUPERADMIN', 'VERIFICATION_ADMIN'].includes(role);
}

export function isOutletRole(role?: string | null): boolean {
  if (!role) return false;
  return ['OWNER', 'MANAGER', 'CASHIER', 'STAFF', 'SUPERVISOR'].includes(role);
}

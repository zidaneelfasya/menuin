export enum Role {
  CASHIER = 'CASHIER',
  SUPERVISOR = 'SUPERVISOR', // Added standard role for manager
  SUPERADMIN = 'SUPERADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export type RoleType = keyof typeof Role;

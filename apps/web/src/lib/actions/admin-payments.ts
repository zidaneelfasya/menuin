'use server';

import { revalidatePath } from 'next/cache';
import { hasPermission, Role, VerificationPermissions, type RoleType } from '@menuin/permissions';
import { getAuthenticatedAccount } from './auth-context';
import { provisionDokuSubAccountForTenant } from '@/lib/payments/doku/doku-adapter';
import {
  LINKABLE_STATUSES,
  MANUAL_STATUSES,
  SUB_ACCOUNT_FILTERS,
  linkSubAccountManually,
  listSubAccountOverview,
  setSubAccountStatusManually,
  type LinkableStatus,
  type ManualStatus,
  type SubAccountFilter,
} from '@/lib/payments/doku/sub-account-admin';

const ADMIN_PAYMENTS_PATH = '/system-admin/payments';
const FORBIDDEN = 'Akses ditolak: hanya System Admin yang dapat mengelola akun pembayaran outlet.';

/** Hanya SYSTEM_ADMIN / SUPERADMIN: mengubah tujuan dana outlet adalah tindakan sensitif. */
async function getPaymentAdmin() {
  const account = await getAuthenticatedAccount().catch(() => null);
  if (!account) return null;
  const role: RoleType =
    account.systemRole === 'SUPERADMIN'
      ? Role.SUPERADMIN
      : account.systemRole === 'SYSTEM_ADMIN'
        ? Role.SYSTEM_ADMIN
        : Role.STAFF;
  if (!hasPermission(role, VerificationPermissions.MANAGE_PAYMENT_PROVIDER)) return null;
  return { accountId: account.id, role: String(role) };
}

export async function getSubAccountOverviewAction(params: { filter?: string; search?: string } = {}) {
  const actor = await getPaymentAdmin();
  if (!actor) return { success: false as const, error: FORBIDDEN };

  const filter = (SUB_ACCOUNT_FILTERS as readonly string[]).includes(params.filter ?? '')
    ? (params.filter as SubAccountFilter)
    : 'ALL';
  const data = await listSubAccountOverview({ filter, search: params.search?.slice(0, 100) });
  return { success: true as const, ...data };
}

export async function linkSubAccountAction(input: {
  tenantId: string;
  subAccountId: string;
  status: string;
  note: string;
  allowOverwrite?: boolean;
}) {
  const actor = await getPaymentAdmin();
  if (!actor) return { success: false as const, error: FORBIDDEN };
  if (!(LINKABLE_STATUSES as readonly string[]).includes(input.status)) {
    return { success: false as const, error: 'Status tautan harus ACTIVE atau PENDING_REVIEW.' };
  }

  const result = await linkSubAccountManually({
    tenantId: String(input.tenantId),
    subAccountId: String(input.subAccountId ?? ''),
    status: input.status as LinkableStatus,
    note: String(input.note ?? ''),
    allowOverwrite: Boolean(input.allowOverwrite),
    actor,
  });
  if (result.success) revalidatePath(ADMIN_PAYMENTS_PATH);
  return result;
}

export async function setSubAccountStatusAction(input: { tenantId: string; status: string; note: string }) {
  const actor = await getPaymentAdmin();
  if (!actor) return { success: false as const, error: FORBIDDEN };
  if (!(MANUAL_STATUSES as readonly string[]).includes(input.status)) {
    return { success: false as const, error: 'Status tidak valid.' };
  }

  const result = await setSubAccountStatusManually({
    tenantId: String(input.tenantId),
    status: input.status as ManualStatus,
    note: String(input.note ?? ''),
    actor,
  });
  if (result.success) revalidatePath(ADMIN_PAYMENTS_PATH);
  return result;
}

/** Menjalankan ulang registrasi Sub Account lewat API DOKU (untuk status FAILED / belum terdaftar). */
export async function retrySubAccountProvisioningAction(input: { tenantId: string }) {
  const actor = await getPaymentAdmin();
  if (!actor) return { success: false as const, error: FORBIDDEN };

  const result = await provisionDokuSubAccountForTenant(String(input.tenantId), actor.accountId);
  revalidatePath(ADMIN_PAYMENTS_PATH);
  return result.success
    ? { success: true as const, subAccountId: result.subAccountId!, status: result.status! }
    : { success: false as const, error: result.error || 'Gagal mendaftarkan Sub Account.' };
}

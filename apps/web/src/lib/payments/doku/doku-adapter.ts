import { db } from '@/lib/db';
import {
  tenants,
  businessProfiles,
  settlementAccounts,
  providerOnboardings,
  verificationAuditLogs,
} from '@/lib/db/schema';
import { eq, and, isNull, lt, ne, or } from 'drizzle-orm';
import { DokuApiError } from './client';
import { createSubAccount } from './sub-account';
import type { ProviderOnboardingStatus } from '@menuin/types';

export interface ProvisionDokuSubAccountResult {
  success: boolean;
  subAccountId?: string;
  status?: ProviderOnboardingStatus;
  error?: string;
}

const SUB_ACCOUNT_PROVISIONING = 'PROVISIONING';
const PROVISIONING_STALE_MS = 2 * 60_000;

function existingSubAccountError(status: string | null): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'Sub Account DOKU outlet ini sudah terdaftar dan sedang menunggu aktivasi dari DOKU.';
    case 'SUSPENDED':
      return 'Sub Account DOKU outlet ini sedang dibekukan. Hubungi tim Menuin.';
    default:
      return `Sub Account DOKU outlet ini sudah terdaftar (status: ${status ?? 'tidak diketahui'}). Hubungi tim Menuin.`;
  }
}

/**
 * Domain Adapter for DOKU Sub Account V2 Provisioning.
 * Strictly asserts that all 3 Verification Pillars are VERIFIED:
 * - Pilar 1: Business Profile (Legal entity)
 * - Pilar 2: Settlement Account (Bank account)
 * - Pilar 3: Outlet Compliance (Physical location & photos)
 * before provisioning the DOKU sub-account.
 */
export async function provisionDokuSubAccountForTenant(
  tenantId: string,
  callerAccountId?: string
): Promise<ProvisionDokuSubAccountResult> {
  // 1. Fetch Tenant details
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { success: false, error: 'Outlet tidak ditemukan.' };
  }

  // Already provisioned? Sub Account yang sudah punya ID tidak pernah didaftarkan
  // ulang, karena itu akan membuat akun ganda di DOKU.
  if (tenant.dokuSubAccountId) {
    if (tenant.dokuSubAccountStatus === 'ACTIVE') {
      return {
        success: true,
        subAccountId: tenant.dokuSubAccountId,
        status: 'ACTIVE',
      };
    }
    return {
      success: false,
      subAccountId: tenant.dokuSubAccountId,
      status: (tenant.dokuSubAccountStatus as ProviderOnboardingStatus | null) ?? undefined,
      error: existingSubAccountError(tenant.dokuSubAccountStatus),
    };
  }

  // 2. Assert Business Profile Linkage (1:N:M)
  if (!tenant.businessProfileId) {
    return {
      success: false,
      error: 'Outlet belum dihubungkan ke Profil Badan Usaha (Pilar 1).',
    };
  }

  const [businessProfile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, tenant.businessProfileId))
    .limit(1);

  if (!businessProfile) {
    return {
      success: false,
      error: 'Profil bisnis terhubung tidak ditemukan.',
    };
  }

  // 3. Strict 3-Pillar Verification Guards
  // Pilar 1: Legal Entity Profile
  if (businessProfile.verificationStatus !== 'verified') {
    return {
      success: false,
      error: `Profil badan usaha belum terverifikasi (status: ${businessProfile.verificationStatus}). Aktivasi DOKU memerlukan persetujuan Pilar 1 (Legalitas).`,
    };
  }

  // Pilar 2: Settlement Account
  let activeSettlementAccount = null;
  if (tenant.settlementAccountId) {
    const [acc] = await db
      .select()
      .from(settlementAccounts)
      .where(eq(settlementAccounts.id, tenant.settlementAccountId))
      .limit(1);
    activeSettlementAccount = acc;
  }
  if (!activeSettlementAccount) {
    const [acc] = await db
      .select()
      .from(settlementAccounts)
      .where(
        and(
          eq(settlementAccounts.businessProfileId, businessProfile.id),
          eq(settlementAccounts.isDefault, true)
        )
      )
      .limit(1);
    activeSettlementAccount = acc;
  }

  const hasLegacyBank = !!(businessProfile.bankName && businessProfile.bankAccountNumber);
  if (!activeSettlementAccount && !hasLegacyBank) {
    return {
      success: false,
      error: 'Rekening settlement belum didaftarkan untuk outlet ini (Pilar 2). Aktivasi DOKU memerlukan rekening settlement yang valid.',
    };
  }

  if (activeSettlementAccount && activeSettlementAccount.verificationStatus !== 'verified') {
    return {
      success: false,
      error: `Rekening settlement belum terverifikasi (status: ${activeSettlementAccount.verificationStatus}). Aktivasi DOKU memerlukan persetujuan Pilar 2 (Rekening Bank).`,
    };
  }

  // Pilar 3: Physical Location Compliance
  if (tenant.outletComplianceStatus !== 'verified') {
    return {
      success: false,
      error: `Kepatuhan lokasi outlet belum terverifikasi (status: ${tenant.outletComplianceStatus}). Aktivasi DOKU memerlukan persetujuan Pilar 3 (Fisik Gerai).`,
    };
  }

  // 4. Klaim "lock" di DB: hanya satu request yang boleh membuat Sub Account.
  const staleBefore = new Date(Date.now() - PROVISIONING_STALE_MS);
  const claimed = await db
    .update(tenants)
    .set({ dokuSubAccountStatus: SUB_ACCOUNT_PROVISIONING, updatedAt: new Date() })
    .where(
      and(
        eq(tenants.id, tenant.id),
        isNull(tenants.dokuSubAccountId),
        or(
          isNull(tenants.dokuSubAccountStatus),
          ne(tenants.dokuSubAccountStatus, SUB_ACCOUNT_PROVISIONING),
          lt(tenants.updatedAt, staleBefore)
        )
      )
    )
    .returning({ id: tenants.id });

  if (claimed.length === 0) {
    return { success: false, error: 'Aktivasi sedang diproses. Muat ulang halaman dalam beberapa saat.' };
  }

  // 5. Call DOKU Sub Account V2 API. Tidak ada fallback ID buatan: bila gagal,
  // status FAILED supaya kegagalan terlihat dan aktivasi bisa dicoba ulang.
  let subAccountId: string;
  let dokuStatus: ProviderOnboardingStatus;
  let providerStatus: string | null;
  try {
    const subAccountResult = await createSubAccount({
      name: tenant.name,
      email: businessProfile.responsiblePersonContact.includes('@')
        ? businessProfile.responsiblePersonContact
        : `merchant-${tenant.outletKey}@menuin.id`,
    });
    subAccountId = subAccountResult.accountId;
    dokuStatus = subAccountResult.status;
    providerStatus = subAccountResult.providerStatus;
  } catch (error) {
    await db
      .update(tenants)
      .set({ dokuSubAccountStatus: 'FAILED', updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    console.error(JSON.stringify({
      scope: 'payments',
      event: 'sub_account_create_failed',
      tenantId: tenant.id,
      status: error instanceof DokuApiError ? error.status : null,
      response: error instanceof DokuApiError ? error.responseBody : null,
      error: error instanceof Error ? error.message : String(error),
    }));
    return { success: false, status: 'FAILED', error: 'Gagal membuat akun pembayaran di DOKU. Silakan coba lagi.' };
  }

  try {
    // 6. Update DB atomically
    await db.transaction(async (tx) => {
      // Upsert provider_onboardings
      const [existingOnboarding] = await tx
        .select()
        .from(providerOnboardings)
        .where(
          and(
            eq(providerOnboardings.provider, 'DOKU'),
            eq(providerOnboardings.tenantId, tenant.id)
          )
        )
        .limit(1);

      if (existingOnboarding) {
        await tx
          .update(providerOnboardings)
          .set({
            providerReference: subAccountId,
            providerStatus: dokuStatus,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(providerOnboardings.id, existingOnboarding.id));
      } else {
        await tx.insert(providerOnboardings).values({
          businessProfileId: businessProfile.id,
          tenantId: tenant.id,
          provider: 'DOKU',
          providerReference: subAccountId,
          providerStatus: dokuStatus,
          lastSyncedAt: new Date(),
        });
      }

      // Update Tenant
      await tx
        .update(tenants)
        .set({
          dokuSubAccountId: subAccountId,
          dokuSubAccountStatus: dokuStatus,
          onlinePaymentEnabled: dokuStatus === 'ACTIVE' ? true : tenant.onlinePaymentEnabled,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      // Audit Log
      await tx.insert(verificationAuditLogs).values({
        businessProfileId: businessProfile.id,
        tenantId: tenant.id,
        actorId: callerAccountId || null,
        actorRole: 'SYSTEM',
        action: 'DOKU_SUB_ACCOUNT_PROVISIONED',
        previousStatus: tenant.dokuSubAccountStatus,
        newStatus: dokuStatus,
        metadata: {
          subAccountId: subAccountId,
          provider: 'DOKU',
          providerStatus,
          settlementAccountId: activeSettlementAccount?.id || null,
          bankName: activeSettlementAccount?.bankName || businessProfile.bankName,
          accountHolder: activeSettlementAccount?.bankAccountHolder || businessProfile.bankAccountHolder,
        },
      });
    });

    if (dokuStatus !== 'ACTIVE') {
      return {
        success: false,
        subAccountId,
        status: dokuStatus,
        error: existingSubAccountError(dokuStatus),
      };
    }
    return {
      success: true,
      subAccountId: subAccountId,
      status: dokuStatus,
    };
  } catch (error) {
    // Sub Account sudah terbit di DOKU tapi transaksi gagal: simpan minimal
    // ID-nya di tenant (best-effort) dan catat di log, supaya tidak didaftarkan
    // ulang saat lock PROVISIONING kedaluwarsa.
    await db
      .update(tenants)
      .set({ dokuSubAccountId: subAccountId, dokuSubAccountStatus: dokuStatus, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id))
      .catch(() => undefined);
    console.error(JSON.stringify({
      scope: 'payments',
      event: 'sub_account_persist_failed',
      tenantId: tenant.id,
      subAccountId,
      providerStatus,
      error: error instanceof Error ? error.message : String(error),
    }));
    return {
      success: false,
      error: 'Akun DOKU sudah dibuat tetapi gagal disimpan. Hubungi tim Menuin.',
    };
  }
}

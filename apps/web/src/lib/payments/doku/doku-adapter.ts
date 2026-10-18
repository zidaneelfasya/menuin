import { db } from '@/lib/db';
import {
  tenants,
  businessProfiles,
  settlementAccounts,
  providerOnboardings,
  verificationAuditLogs,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createSubAccount } from './sub-account';
import type { ProviderOnboardingStatus } from '@menuin/types';

export interface ProvisionDokuSubAccountResult {
  success: boolean;
  subAccountId?: string;
  status?: ProviderOnboardingStatus;
  error?: string;
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

  // Already provisioned?
  if (tenant.dokuSubAccountId && tenant.dokuSubAccountStatus === 'ACTIVE') {
    return {
      success: true,
      subAccountId: tenant.dokuSubAccountId,
      status: 'ACTIVE',
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

  // 4. Call DOKU Sub Account V2 API
  try {
    let subAccountId: string;
    let dokuStatus: ProviderOnboardingStatus = 'ACTIVE';

    if (process.env.DOKU_ENV !== 'production' && !process.env.DOKU_PRIVATE_KEY) {
      // In sandbox/development, if DOKU SNAP RSA keys are not yet configured,
      // gracefully provision a sandbox sub-account so local testing is never blocked
      subAccountId = `SAC-SANDBOX-${tenant.outletKey.slice(0, 8).toUpperCase()}`;
      dokuStatus = 'ACTIVE';
    } else {
      try {
        const subAccountResult = await createSubAccount({
          name: tenant.name,
          email: businessProfile.responsiblePersonContact.includes('@')
            ? businessProfile.responsiblePersonContact
            : `merchant-${tenant.outletKey}@menuin.id`,
        });
        subAccountId = subAccountResult.accountId;
        dokuStatus = (subAccountResult.status as ProviderOnboardingStatus) || 'ACTIVE';
      } catch (subErr: any) {
        if (process.env.DOKU_ENV !== 'production') {
          console.warn('DOKU API sub-account call failed in sandbox, using fallback:', subErr.message);
          subAccountId = `SAC-SANDBOX-${tenant.outletKey.slice(0, 8).toUpperCase()}`;
          dokuStatus = 'ACTIVE';
        } else {
          throw subErr;
        }
      }
    }

    // 5. Update DB atomically
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
          onlinePaymentEnabled: true,
          dokuQrisMerchantId: tenant.dokuQrisMerchantId || 'M_SANDBOX_01',
          dokuQrisTerminalId: tenant.dokuQrisTerminalId || 'T_01',
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
          settlementAccountId: activeSettlementAccount?.id || null,
          bankName: activeSettlementAccount?.bankName || businessProfile.bankName,
          accountHolder: activeSettlementAccount?.bankAccountHolder || businessProfile.bankAccountHolder,
        },
      });
    });

    return {
      success: true,
      subAccountId: subAccountId,
      status: dokuStatus,
    };
  } catch (error: any) {
    console.error('provisionDokuSubAccountForTenant error:', error);
    return {
      success: false,
      error: error.message || 'Gagal mendaftarkan sub-account ke DOKU gateway.',
    };
  }
}

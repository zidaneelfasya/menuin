'use server';

import { db } from '@/lib/db';
import {
  settlementAccounts,
  businessProfiles,
  tenants,
  memberships,
  verificationAuditLogs,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAccount } from './auth-context';
import { createSettlementAccountSchema } from '@menuin/validation';
import type { SettlementAccount, SettlementAccountMasked } from '@menuin/types';
import {
  maskBankAccountNumber,
  calculateNameMatchScore,
} from '@/lib/verification/settlement-utils';

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Creates a new settlement bank account under a Business Profile.
 */
export async function createSettlementAccountAction(rawInput: unknown) {
  try {
    const account = await getAuthenticatedAccount();
    const validated = createSettlementAccountSchema.parse(rawInput);

    // Verify ownership of the business profile
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(
        and(
          eq(businessProfiles.id, validated.businessProfileId),
          eq(businessProfiles.accountId, account.id)
        )
      )
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Profil bisnis tidak ditemukan atau bukan milik Anda.' };
    }

    // Check if this is the first account for the profile (auto make it default)
    const existingAccounts = await db
      .select({ id: settlementAccounts.id })
      .from(settlementAccounts)
      .where(eq(settlementAccounts.businessProfileId, profile.id));

    const isFirstAccount = existingAccounts.length === 0;
    const shouldBeDefault = isFirstAccount || validated.isDefault === true;

    // Calculate name matching score with responsible person or business entity name
    const scorePerson = calculateNameMatchScore(
      validated.bankAccountHolder,
      profile.responsiblePersonName
    );
    const scoreCompany = calculateNameMatchScore(validated.bankAccountHolder, profile.name);
    const bestScore = Math.max(scorePerson, scoreCompany);

    const cleanNumber = validated.bankAccountNumber.replace(/\s+/g, '');
    const maskedNumber = maskBankAccountNumber(cleanNumber);

    // If shouldBeDefault, reset existing default flags first
    if (shouldBeDefault && !isFirstAccount) {
      await db
        .update(settlementAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(settlementAccounts.businessProfileId, profile.id));
    }

    // Initial status:
    // All newly registered settlement accounts start as 'pending' (Ditinjau) until reviewed and approved by admin.
    // The name match score is recorded for admin review reference.
    const initialStatus = 'pending';

    const [created] = await db
      .insert(settlementAccounts)
      .values({
        businessProfileId: profile.id,
        bankName: validated.bankName.toUpperCase(),
        bankAccountNumber: cleanNumber,
        bankAccountNumberMasked: maskedNumber,
        bankAccountHolder: validated.bankAccountHolder,
        proofDocumentKey: validated.proofDocumentKey || null,
        verificationMethod: 'MANUAL_REVIEW',
        verificationStatus: initialStatus,
        nameMatchScore: bestScore,
        isDefault: shouldBeDefault,
      })
      .returning();

    // Audit log
    await db.insert(verificationAuditLogs).values({
      businessProfileId: profile.id,
      actorId: account.id,
      actorRole: 'OWNER',
      action: 'SETTLEMENT_ACCOUNT_CREATED',
      newStatus: initialStatus,
      metadata: {
        accountId: created.id,
        bankName: created.bankName,
        accountHolder: created.bankAccountHolder,
        nameMatchScore: bestScore,
        isDefault: shouldBeDefault,
      },
    });

    return {
      success: true,
      account: {
        id: created.id,
        businessProfileId: created.businessProfileId,
        bankName: created.bankName,
        bankAccountNumberMasked: created.bankAccountNumberMasked,
        bankAccountHolder: created.bankAccountHolder,
        verificationStatus: created.verificationStatus,
        nameMatchScore: created.nameMatchScore,
        isDefault: created.isDefault,
        createdAt: created.createdAt,
      },
    };
  } catch (err: any) {
    console.error('createSettlementAccountAction error:', err);
    return { success: false, error: err.message || 'Gagal menambahkan rekening settlement.' };
  }
}

/**
 * Retrieves all settlement accounts for a given business profile with masked account numbers for safe display.
 */
export async function getSettlementAccountsAction(businessProfileId: string) {
  try {
    const account = await getAuthenticatedAccount();

    // Verify ownership of business profile
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(
        and(
          eq(businessProfiles.id, businessProfileId),
          eq(businessProfiles.accountId, account.id)
        )
      )
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Profil bisnis tidak ditemukan.' };
    }

    const accountsList = await db
      .select({
        id: settlementAccounts.id,
        businessProfileId: settlementAccounts.businessProfileId,
        bankName: settlementAccounts.bankName,
        bankAccountNumberMasked: settlementAccounts.bankAccountNumberMasked,
        bankAccountHolder: settlementAccounts.bankAccountHolder,
        verificationStatus: settlementAccounts.verificationStatus,
        verificationNotes: settlementAccounts.verificationNotes,
        nameMatchScore: settlementAccounts.nameMatchScore,
        isDefault: settlementAccounts.isDefault,
        createdAt: settlementAccounts.createdAt,
      })
      .from(settlementAccounts)
      .where(eq(settlementAccounts.businessProfileId, businessProfileId))
      .orderBy(desc(settlementAccounts.isDefault), desc(settlementAccounts.createdAt));

    return { success: true, accounts: accountsList };
  } catch (err: any) {
    console.error('getSettlementAccountsAction error:', err);
    return { success: false, error: err.message || 'Gagal memuat rekening settlement.' };
  }
}

/**
 * Sets an account as the default settlement account for its business profile.
 */
export async function setDefaultSettlementAccountAction(settlementAccountId: string) {
  try {
    const account = await getAuthenticatedAccount();

    const [target] = await db
      .select()
      .from(settlementAccounts)
      .where(eq(settlementAccounts.id, settlementAccountId))
      .limit(1);

    if (!target) {
      return { success: false, error: 'Rekening settlement tidak ditemukan.' };
    }

    // Verify ownership
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(
        and(
          eq(businessProfiles.id, target.businessProfileId),
          eq(businessProfiles.accountId, account.id)
        )
      )
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Akses ditolak.' };
    }

    // Reset other defaults
    await db
      .update(settlementAccounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(settlementAccounts.businessProfileId, target.businessProfileId));

    // Set new default
    await db
      .update(settlementAccounts)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(settlementAccounts.id, target.id));

    await db.insert(verificationAuditLogs).values({
      businessProfileId: profile.id,
      actorId: account.id,
      actorRole: 'OWNER',
      action: 'SETTLEMENT_DEFAULT_CHANGED',
      metadata: {
        newDefaultAccountId: target.id,
        bankName: target.bankName,
        accountHolder: target.bankAccountHolder,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('setDefaultSettlementAccountAction error:', err);
    return { success: false, error: err.message || 'Gagal mengubah rekening utama.' };
  }
}

/**
 * Links a specific settlement account to a tenant (outlet), or sets it to null to inherit profile default.
 */
export async function linkOutletSettlementAccountAction(
  outletKey: string,
  settlementAccountId: string | null
) {
  try {
    const account = await getAuthenticatedAccount();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Outlet tidak ditemukan.' };
    }

    // Verify user role on this tenant
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.accountId, account.id),
          eq(memberships.tenantId, tenant.id)
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: 'Hanya Pemilik (Owner) yang berhak mengatur rekening outlet ini.' };
    }

    // If assigning an account, verify it belongs to the tenant's business profile AND caller owns the profile
    if (settlementAccountId) {
      const [targetAccount] = await db
        .select()
        .from(settlementAccounts)
        .where(eq(settlementAccounts.id, settlementAccountId))
        .limit(1);

      if (!targetAccount) {
        return { success: false, error: 'Rekening settlement yang dipilih tidak ditemukan.' };
      }

      if (!tenant.businessProfileId || targetAccount.businessProfileId !== tenant.businessProfileId) {
        return { success: false, error: 'Rekening ini bukan milik profil bisnis outlet ini.' };
      }

      // Verify the business profile belongs to this owner account
      const [bp] = await db
        .select({ id: businessProfiles.id })
        .from(businessProfiles)
        .where(
          and(
            eq(businessProfiles.id, tenant.businessProfileId),
            eq(businessProfiles.accountId, account.id)
          )
        )
        .limit(1);

      if (!bp) {
        return { success: false, error: 'Profil bisnis outlet ini bukan milik akun Anda.' };
      }
    }

    await db
      .update(tenants)
      .set({
        settlementAccountId: settlementAccountId || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));

    if (tenant.businessProfileId) {
      await db.insert(verificationAuditLogs).values({
        businessProfileId: tenant.businessProfileId,
        tenantId: tenant.id,
        actorId: account.id,
        actorRole: membership.role,
        action: 'OUTLET_SETTLEMENT_ACCOUNT_LINKED',
        metadata: {
          outletKey,
          outletName: tenant.name,
          settlementAccountId: settlementAccountId || 'DEFAULT_PROFILE_INHERITED',
        },
      });
    }

    revalidatePath(`/outlet/${outletKey}/verification`);
    return { success: true };
  } catch (err: any) {
    console.error('linkOutletSettlementAccountAction error:', err);
    return { success: false, error: err.message || 'Gagal menautkan rekening ke outlet.' };
  }
}

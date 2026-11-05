'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import {
  businessProfiles,
  settlementAccounts,
  tenants,
  memberships,
  verificationSubmissions,
  verificationDocuments,
  verificationAuditLogs,
  accounts,
  verificationDrafts,
  verificationSectionReviews,
  providerOnboardings,
} from '@/lib/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { getAuthenticatedAccount } from './auth-context';
import {
  createBusinessProfileSchema,
  updateOutletComplianceSchema,
} from '@menuin/validation';
import {
  decideBusinessVerificationTransition,
  decideOutletComplianceTransition,
  evaluatePaymentReadiness,
} from '@/lib/verification/state-machine';
import type {
  BusinessProfileVerificationStatus,
  DocumentType,
  EntityType,
  OutletComplianceStatus,
  ProviderOnboardingStatus,
} from '@menuin/types';
import { revalidatePath } from 'next/cache';
import { provisionDokuSubAccountForTenant } from '@/lib/payments/doku/doku-adapter';

/**
 * Returns all business profiles owned by the authenticated account,
 * along with their linked tenants count.
 */
export async function listAccountBusinessProfiles() {
  const account = await getAuthenticatedAccount();

  const profiles = await db
    .select({
      id: businessProfiles.id,
      name: businessProfiles.name,
      entityType: businessProfiles.entityType,
      taxId: businessProfiles.taxId,
      businessLicenseNumber: businessProfiles.businessLicenseNumber,
      responsiblePersonName: businessProfiles.responsiblePersonName,
      bankName: businessProfiles.bankName,
      bankAccountNumber: businessProfiles.bankAccountNumber,
      bankAccountHolder: businessProfiles.bankAccountHolder,
      verificationStatus: businessProfiles.verificationStatus,
      createdAt: businessProfiles.createdAt,
      updatedAt: businessProfiles.updatedAt,
      linkedOutletsCount: sql<number>`(
        SELECT count(*)::int FROM tenants WHERE tenants.business_profile_id = ${businessProfiles.id}
      )`,
    })
    .from(businessProfiles)
    .where(eq(businessProfiles.accountId, account.id))
    .orderBy(desc(businessProfiles.createdAt));

  return profiles;
}

/**
 * Get single business profile details if owned by current account.
 */
export async function getBusinessProfileDetails(id: string) {
  const account = await getAuthenticatedAccount();

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.id, id), eq(businessProfiles.accountId, account.id)))
    .limit(1);

  if (!profile) return null;

  const linkedTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      outletKey: tenants.outletKey,
      outletComplianceStatus: tenants.outletComplianceStatus,
      city: tenants.city,
      address: tenants.address,
    })
    .from(tenants)
    .where(eq(tenants.businessProfileId, profile.id));

  const submissions = await db
    .select()
    .from(verificationSubmissions)
    .where(eq(verificationSubmissions.businessProfileId, profile.id))
    .orderBy(desc(verificationSubmissions.attemptNumber));

  return {
    profile,
    linkedTenants,
    submissions,
  };
}

/**
 * Creates a new business profile under the current account.
 */
export async function createBusinessProfileAction(rawInput: unknown) {
  try {
    const account = await getAuthenticatedAccount();
    const validated = createBusinessProfileSchema.parse(rawInput);

    const [created] = await db
      .insert(businessProfiles)
      .values({
        accountId: account.id,
        name: validated.name,
        entityType: validated.entityType,
        taxId: validated.taxId || null,
        businessLicenseNumber: validated.businessLicenseNumber || null,
        responsiblePersonName: validated.responsiblePersonName,
        responsiblePersonNik: validated.responsiblePersonNik,
        responsiblePersonContact: validated.responsiblePersonContact,
        responsiblePersonPosition: validated.responsiblePersonPosition || null,
        responsiblePersonEmail: validated.responsiblePersonEmail || null,
        responsiblePersonNationality: validated.responsiblePersonNationality || null,
        bankName: validated.bankName || null,
        bankAccountNumber: validated.bankAccountNumber || null,
        bankAccountHolder: validated.bankAccountHolder || null,
        verificationStatus: 'draft',
      })
      .returning();

    // Auto-create initial default settlement account if bank details were supplied
    if (validated.bankName && validated.bankAccountNumber && validated.bankAccountHolder) {
      const cleanNum = validated.bankAccountNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4);
      const masked = cleanNum.length > 4 ? `•••••• ${last4}` : cleanNum;

      await db.insert(settlementAccounts).values({
        businessProfileId: created.id,
        bankName: validated.bankName.toUpperCase(),
        bankAccountNumber: cleanNum,
        bankAccountNumberMasked: masked,
        bankAccountHolder: validated.bankAccountHolder,
        verificationStatus: 'pending',
        isDefault: true,
      });
    }

    await db.insert(verificationAuditLogs).values({
      businessProfileId: created.id,
      actorId: account.id,
      actorRole: 'MERCHANT',
      action: 'BUSINESS_PROFILE_CREATED',
      newStatus: 'draft',
      metadata: { profileName: validated.name, entityType: validated.entityType },
    });

    return { success: true, profile: created };
  } catch (err: any) {
    console.error('createBusinessProfileAction error:', err);
    return { success: false, error: err.message || 'Gagal membuat profil bisnis' };
  }
}

/**
 * Updates an existing business profile owned by the account.
 */
export async function updateBusinessProfileAction(id: string, rawInput: unknown) {
  try {
    const account = await getAuthenticatedAccount();
    const validated = createBusinessProfileSchema.partial().parse(rawInput);

    const [existing] = await db
      .select()
      .from(businessProfiles)
      .where(and(eq(businessProfiles.id, id), eq(businessProfiles.accountId, account.id)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Profil bisnis tidak ditemukan atau bukan milik akun Anda.' };
    }

    const isVerified = existing.verificationStatus === 'verified';
    const newStatus = isVerified ? 'submitted' : existing.verificationStatus;

    const [updated] = await db
      .update(businessProfiles)
      .set({
        name: validated.name ?? existing.name,
        entityType: validated.entityType ?? existing.entityType,
        taxId: validated.taxId !== undefined ? validated.taxId : existing.taxId,
        businessLicenseNumber: validated.businessLicenseNumber !== undefined ? validated.businessLicenseNumber : existing.businessLicenseNumber,
        responsiblePersonName: validated.responsiblePersonName ?? existing.responsiblePersonName,
        responsiblePersonNik: validated.responsiblePersonNik ?? existing.responsiblePersonNik,
        responsiblePersonContact: validated.responsiblePersonContact ?? existing.responsiblePersonContact,
        responsiblePersonPosition: validated.responsiblePersonPosition !== undefined ? validated.responsiblePersonPosition : existing.responsiblePersonPosition,
        responsiblePersonEmail: validated.responsiblePersonEmail !== undefined ? validated.responsiblePersonEmail : existing.responsiblePersonEmail,
        responsiblePersonNationality: validated.responsiblePersonNationality !== undefined ? validated.responsiblePersonNationality : existing.responsiblePersonNationality,
        verificationStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(businessProfiles.id, id))
      .returning();

    await db.insert(verificationAuditLogs).values({
      businessProfileId: id,
      actorId: account.id,
      actorRole: 'MERCHANT',
      action: 'BUSINESS_PROFILE_UPDATED',
      previousStatus: existing.verificationStatus,
      newStatus,
      metadata: { changes: validated },
    });

    return { success: true, profile: updated };
  } catch (err: any) {
    console.error('updateBusinessProfileAction error:', err);
    return { success: false, error: err.message || 'Gagal memperbarui profil bisnis.' };
  }
}

/**
 * Links an outlet/tenant to a business profile owned by the account.
 */
export async function linkOutletToBusinessProfileAction(outletKey: string, businessProfileId: string) {
  try {
    const account = await getAuthenticatedAccount();

    // Verify tenant membership
    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) return { success: false, error: 'Outlet tidak ditemukan.' };

    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: 'Hanya Pemilik (Owner) yang berhak menghubungkan profil usaha ke outlet ini.' };
    }

    // Verify business profile ownership
    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(and(eq(businessProfiles.id, businessProfileId), eq(businessProfiles.accountId, account.id)))
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Profil bisnis tidak ditemukan atau bukan milik akun Anda.' };
    }

    // Find default settlement account for this profile to inherit automatically
    const [defaultAccount] = await db
      .select({ id: settlementAccounts.id })
      .from(settlementAccounts)
      .where(and(eq(settlementAccounts.businessProfileId, profile.id), eq(settlementAccounts.isDefault, true)))
      .limit(1);

    // Link
    await db
      .update(tenants)
      .set({
        businessProfileId: profile.id,
        settlementAccountId: defaultAccount?.id || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));

    await db.insert(verificationAuditLogs).values({
      businessProfileId: profile.id,
      tenantId: tenant.id,
      actorId: account.id,
      actorRole: membership.role,
      action: 'OUTLET_LINKED',
      metadata: { outletKey, outletName: tenant.name, inheritedSettlementAccountId: defaultAccount?.id || null },
    });

    revalidatePath(`/outlet/${outletKey}/verification`);
    return { success: true };
  } catch (err: any) {
    console.error('linkOutletToBusinessProfileAction error:', err);
    return { success: false, error: err.message || 'Gagal menghubungkan outlet.' };
  }
}

export interface VerificationDocumentInput {
  documentType: DocumentType;
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

/**
 * Submits Business Profile for verification (Tier 1 Legal Identity).
 */
export async function submitBusinessProfileVerificationAction(
  businessProfileId: string,
  documents: VerificationDocumentInput[]
) {
  try {
    const account = await getAuthenticatedAccount();

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(and(eq(businessProfiles.id, businessProfileId), eq(businessProfiles.accountId, account.id)))
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Profil bisnis tidak ditemukan.' };
    }

    if (!documents || documents.length === 0) {
      return { success: false, error: 'Harap lampirkan dokumen verifikasi yang diperlukan.' };
    }

    // State machine check
    const transition = decideBusinessVerificationTransition(
      profile.verificationStatus as BusinessProfileVerificationStatus,
      'SUBMIT',
      'MERCHANT'
    );

    if (!transition.success) {
      return { success: false, error: transition.error };
    }

    // Find previous attempts
    const [lastSubmission] = await db
      .select({ attemptNumber: verificationSubmissions.attemptNumber })
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.businessProfileId, profile.id))
      .orderBy(desc(verificationSubmissions.attemptNumber))
      .limit(1);

    const attemptNumber = (lastSubmission?.attemptNumber || 0) + 1;

    // Snapshot
    const snapshot = {
      profile: {
        id: profile.id,
        name: profile.name,
        entityType: profile.entityType,
        taxId: profile.taxId,
        businessLicenseNumber: profile.businessLicenseNumber,
        responsiblePersonName: profile.responsiblePersonName,
        responsiblePersonNik: profile.responsiblePersonNik,
        responsiblePersonContact: profile.responsiblePersonContact,
        bankName: profile.bankName,
        bankAccountNumber: profile.bankAccountNumber,
        bankAccountHolder: profile.bankAccountHolder,
      },
      documents: documents.map((d) => ({
        documentType: d.documentType,
        fileName: d.fileName,
        storageKey: d.storageKey,
      })),
    };

    // DB Transaction
    await db.transaction(async (tx) => {
      // 1. Update Profile Status
      await tx
        .update(businessProfiles)
        .set({
          verificationStatus: transition.nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(businessProfiles.id, profile.id));

      // 2. Insert Submission Record
      const [submission] = await tx
        .insert(verificationSubmissions)
        .values({
          businessProfileId: profile.id,
          submissionScope: 'BUSINESS_PROFILE',
          attemptNumber,
          status: transition.nextStatus,
          submissionSnapshot: snapshot,
        })
        .returning();

      // 3. Insert Documents
      for (const doc of documents) {
        await tx.insert(verificationDocuments).values({
          submissionId: submission.id,
          documentScope: 'BUSINESS_PROFILE',
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          fileName: doc.fileName,
          fileSizeBytes: doc.fileSizeBytes,
          mimeType: doc.mimeType,
          reviewStatus: 'PENDING',
        });
      }

      // 4. Audit Log
      await tx.insert(verificationAuditLogs).values({
        businessProfileId: profile.id,
        actorId: account.id,
        actorRole: 'MERCHANT',
        action: 'SUBMISSION_FILED',
        previousStatus: profile.verificationStatus,
        newStatus: transition.nextStatus,
        metadata: { submissionId: submission.id, attemptNumber, documentCount: documents.length },
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error('submitBusinessProfileVerificationAction error:', err);
    return { success: false, error: err.message || 'Gagal mengajukan verifikasi profil bisnis.' };
  }
}

/**
 * Submits Outlet Compliance for review (Tier 2 Physical Location & Proofs).
 */
export async function submitOutletComplianceAction(
  outletKey: string,
  rawComplianceInput: unknown,
  documents: VerificationDocumentInput[]
) {
  try {
    const account = await getAuthenticatedAccount();
    const validated = updateOutletComplianceSchema.parse(rawComplianceInput);

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) return { success: false, error: 'Outlet tidak ditemukan.' };

    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: 'Hanya Pemilik (Owner) yang berhak mengajukan kepatuhan lokasi outlet.' };
    }

    if (!tenant.businessProfileId) {
      return {
        success: false,
        error: 'Outlet harus dihubungkan dengan Profil Bisnis sebelum mengajukan kepatuhan lokasi.',
      };
    }

    // State machine check
    const transition = decideOutletComplianceTransition(
      tenant.outletComplianceStatus as OutletComplianceStatus,
      'SUBMIT_LOCATION',
      'MERCHANT'
    );

    if (!transition.success) {
      return { success: false, error: transition.error };
    }

    const snapshot = {
      tenantId: tenant.id,
      address: validated.address,
      city: validated.city,
      postalCode: validated.postalCode,
      latitude: validated.latitude,
      longitude: validated.longitude,
      storefrontPhotoUrl: validated.storefrontPhotoUrl,
      indoorPhotoUrl: validated.indoorPhotoUrl,
      mapsUrl: validated.mapsUrl,
      settlementAccountId: validated.settlementAccountId || tenant.settlementAccountId || null,
      documents: documents.map((d) => ({
        documentType: d.documentType,
        fileName: d.fileName,
        storageKey: d.storageKey,
      })),
    };

    await db.transaction(async (tx) => {
      // 1. Update Tenant Info & Status
      await tx
        .update(tenants)
        .set({
          address: validated.address,
          city: validated.city,
          postalCode: validated.postalCode,
          latitude: validated.latitude ? validated.latitude.toString() : null,
          longitude: validated.longitude ? validated.longitude.toString() : null,
          storefrontPhotoUrl: validated.storefrontPhotoUrl || null,
          indoorPhotoUrl: validated.indoorPhotoUrl || null,
          mapsUrl: validated.mapsUrl || null,
          settlementAccountId: validated.settlementAccountId || tenant.settlementAccountId || null,
          outletComplianceStatus: transition.nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      // 2. Insert Submission Record
      const [submission] = await tx
        .insert(verificationSubmissions)
        .values({
          businessProfileId: tenant.businessProfileId!,
          tenantId: tenant.id,
          submissionScope: 'OUTLET',
          attemptNumber: 1,
          status: transition.nextStatus,
          submissionSnapshot: snapshot,
        })
        .returning();

      // 3. Insert Documents
      for (const doc of documents) {
        await tx.insert(verificationDocuments).values({
          submissionId: submission.id,
          tenantId: tenant.id,
          documentScope: 'OUTLET',
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          fileName: doc.fileName,
          fileSizeBytes: doc.fileSizeBytes,
          mimeType: doc.mimeType,
          reviewStatus: 'PENDING',
        });
      }

      // 4. Audit Log
      await tx.insert(verificationAuditLogs).values({
        businessProfileId: tenant.businessProfileId!,
        tenantId: tenant.id,
        actorId: account.id,
        actorRole: membership.role,
        action: 'OUTLET_COMPLIANCE_SUBMITTED',
        previousStatus: tenant.outletComplianceStatus,
        newStatus: transition.nextStatus,
        metadata: { submissionId: submission.id },
      });
    });

    revalidatePath(`/outlet/${outletKey}/verification`);
    return { success: true };
  } catch (err: any) {
    console.error('submitOutletComplianceAction error:', err);
    return { success: false, error: err.message || 'Gagal mengajukan kepatuhan lokasi outlet.' };
  }
}

/**
 * Returns comprehensive verification status for an outlet:
 * 1. Business Profile (Pilar 1: status legalitas & detail)
 * 2. Settlement Accounts (Pilar 2: daftar rekening & rekening aktif)
 * 3. Outlet Compliance (Pilar 3: kepatuhan fisik lokasi gerai)
 * 4. DOKU Sub Account Status
 * 5. Overall Payment Readiness Evaluation
 * 6. Available Business Profiles under account
 */
export const getOutletVerificationOverview = cache(async (outletKey: string) => {
  let account;
  try {
    account = await getAuthenticatedAccount();
  } catch {
    return null;
  }

  // Step 1: Query tenant
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.outletKey, outletKey))
    .limit(1);

  if (!tenant) return null;

  // Step 2: Query caller membership in this tenant
  const [membership] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      status: memberships.status,
    })
    .from(memberships)
    .where(
      and(
        eq(memberships.tenantId, tenant.id),
        eq(memberships.accountId, account.id),
        eq(memberships.status, 'ACTIVE')
      )
    )
    .limit(1);

  const isOwner = membership?.role === 'OWNER';

  // Step 3: Available profiles to link (Strictly OWNER only)
  // Non-owners (e.g. MANAGER/CASHIER) cannot see or link business profiles
  const availableProfiles = isOwner
    ? await db
        .select({
          id: businessProfiles.id,
          name: businessProfiles.name,
          entityType: businessProfiles.entityType,
          taxId: businessProfiles.taxId,
          businessLicenseNumber: businessProfiles.businessLicenseNumber,
          responsiblePersonName: businessProfiles.responsiblePersonName,
          responsiblePersonNik: businessProfiles.responsiblePersonNik,
          responsiblePersonContact: businessProfiles.responsiblePersonContact,
          verificationStatus: businessProfiles.verificationStatus,
        })
        .from(businessProfiles)
        .where(eq(businessProfiles.accountId, account.id))
        .orderBy(desc(businessProfiles.createdAt))
    : [];

  let businessProfile = null;
  let settlementAccountsList: any[] = [];
  let activeSettlementAccount: any = null;
  let submissions: any[] = [];

  // Step 4: If businessProfileId is linked, query profile, settlement accounts, and submissions
  if (tenant.businessProfileId) {
    const [[bp], saList, subs] = await Promise.all([
      db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.id, tenant.businessProfileId))
        .limit(1),
      db
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
        .where(eq(settlementAccounts.businessProfileId, tenant.businessProfileId))
        .orderBy(desc(settlementAccounts.isDefault), desc(settlementAccounts.createdAt)),
      db
        .select()
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.businessProfileId, tenant.businessProfileId))
        .orderBy(
          desc(verificationSubmissions.attemptNumber),
          desc(verificationSubmissions.submittedAt),
          desc(verificationSubmissions.createdAt)
        )
        .limit(10),
    ]);

    if (bp) {
      // Defense-in-depth: Verify profile ownership against tenant's active owners
      const [ownerMembership] = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, tenant.id),
            eq(memberships.accountId, bp.accountId),
            eq(memberships.role, 'OWNER'),
            eq(memberships.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (ownerMembership) {
        businessProfile = bp;
        settlementAccountsList = saList;
        submissions = subs;

        // Resolve active settlement account for this outlet (specific override or default)
        if (tenant.settlementAccountId) {
          activeSettlementAccount =
            settlementAccountsList.find((a) => a.id === tenant.settlementAccountId) || null;
        }
        if (!activeSettlementAccount) {
          activeSettlementAccount =
            settlementAccountsList.find((a) => a.isDefault) || settlementAccountsList[0] || null;
        }
      } else {
        // Cross-tenant mismatch detected! Business profile does not belong to any owner of this tenant.
        // Self-heal/unlink the corrupt reference to avoid leaking sensitive data
        console.warn(
          `[Tenant Isolation] Unlinking unauthorized profile ${bp.id} from tenant ${tenant.id} (${tenant.name})`
        );
        await db
          .update(tenants)
          .set({ businessProfileId: null, settlementAccountId: null, updatedAt: new Date() })
          .where(eq(tenants.id, tenant.id));
      }
    }
  }

  // Query draft if any
  const [draftRecord] = await db
    .select()
    .from(verificationDrafts)
    .where(eq(verificationDrafts.tenantId, tenant.id))
    .limit(1);

  // Collect all submissions
  const allSubmissions = [...submissions];
  const tenantSubs = await db
    .select()
    .from(verificationSubmissions)
    .where(eq(verificationSubmissions.tenantId, tenant.id))
    .orderBy(
      desc(verificationSubmissions.attemptNumber),
      desc(verificationSubmissions.submittedAt),
      desc(verificationSubmissions.createdAt)
    )
    .limit(5);

  for (const ts of tenantSubs) {
    if (!allSubmissions.some((s) => s.id === ts.id)) {
      allSubmissions.push(ts);
    }
  }

  // Deterministic sorting: attemptNumber DESC, then submittedAt DESC, then createdAt DESC
  allSubmissions.sort((a, b) => {
    const attemptDiff = (b.attemptNumber || 0) - (a.attemptNumber || 0);
    if (attemptDiff !== 0) return attemptDiff;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  const latestSubmission = allSubmissions[0] || null;
  let latestDocuments: any[] = [];
  let latestSectionReviews: any[] = [];
  if (latestSubmission) {
    const [docsFromTable, sectionRevs] = await Promise.all([
      db
        .select()
        .from(verificationDocuments)
        .where(eq(verificationDocuments.submissionId, latestSubmission.id)),
      db
        .select()
        .from(verificationSectionReviews)
        .where(eq(verificationSectionReviews.submissionId, latestSubmission.id)),
    ]);

    latestDocuments = [...docsFromTable];
    latestSectionReviews = sectionRevs;

    // Merge any documents from snapshot if missing in verificationDocuments table
    const snapshotDocs = Array.isArray(latestSubmission.submissionSnapshot?.documents)
      ? latestSubmission.submissionSnapshot.documents
      : [];
    for (const snapDoc of snapshotDocs) {
      if (!latestDocuments.some((d) => d.documentType === snapDoc.documentType)) {
        latestDocuments.push({
          id: `snap_${snapDoc.documentType}`,
          submissionId: latestSubmission.id,
          documentType: snapDoc.documentType,
          storageKey: snapDoc.storageKey,
          fileName: snapDoc.fileName || `${snapDoc.documentType}.png`,
          fileSizeBytes: snapDoc.fileSizeBytes || 0,
          mimeType: snapDoc.mimeType || 'image/png',
          reviewStatus: 'PENDING',
          reviewNote: null,
          reviewedAt: null,
          createdAt: latestSubmission.submittedAt,
        });
      }
    }
  }

  // Resolve resolved photo URLs
  const resolvedStorefrontPhotoUrl =
    tenant.storefrontPhotoUrl ||
    latestDocuments.find((d) => d.documentType === 'FOTO_TAMPAK_DEPAN')?.storageKey ||
    latestSubmission?.submissionSnapshot?.outlet?.storefrontPhotoUrl ||
    null;

  const resolvedIndoorPhotoUrl =
    tenant.indoorPhotoUrl ||
    latestDocuments.find((d) => d.documentType === 'FOTO_KASIR')?.storageKey ||
    latestSubmission?.submissionSnapshot?.outlet?.indoorPhotoUrl ||
    null;

  // Evaluate 3-pillar readiness
  const readiness = evaluatePaymentReadiness({
    businessProfileStatus: (businessProfile?.verificationStatus || 'not_started') as BusinessProfileVerificationStatus,
    settlementAccountStatus: activeSettlementAccount?.verificationStatus,
    outletComplianceStatus: (tenant.outletComplianceStatus || 'incomplete') as OutletComplianceStatus,
    dokuSubAccountId: tenant.dokuSubAccountId,
    dokuSubAccountStatus: (tenant.dokuSubAccountStatus || 'NOT_PROVISIONED') as ProviderOnboardingStatus,
    onlinePaymentEnabled: tenant.onlinePaymentEnabled,
    isPlatformConfigured: Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY),
  });

  const sectionReviewsMap: Record<string, any> = {};
  for (const sr of latestSectionReviews) {
    sectionReviewsMap[sr.section] = sr;
  }

  const documentsMap: Record<string, any> = {};
  for (const d of latestDocuments) {
    documentsMap[d.documentType] = d;
  }

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      outletKey: tenant.outletKey,
      address: tenant.address,
      province: tenant.province,
      city: tenant.city,
      district: tenant.district,
      postalCode: tenant.postalCode,
      latitude: tenant.latitude,
      longitude: tenant.longitude,
      storefrontPhotoUrl: resolvedStorefrontPhotoUrl,
      indoorPhotoUrl: resolvedIndoorPhotoUrl,
      mapsUrl: tenant.mapsUrl,
      settlementAccountId: businessProfile ? tenant.settlementAccountId : null,
      outletComplianceStatus: tenant.outletComplianceStatus as OutletComplianceStatus,
      dokuSubAccountId: tenant.dokuSubAccountId,
      dokuSubAccountStatus: (tenant.dokuSubAccountStatus || 'NOT_PROVISIONED') as ProviderOnboardingStatus,
      onlinePaymentEnabled: tenant.onlinePaymentEnabled,
      businessProfileId: businessProfile ? tenant.businessProfileId : null,
    },
    businessProfile,
    settlementAccounts: settlementAccountsList,
    activeSettlementAccount,
    readiness,
    submissions: allSubmissions,
    latestSubmission: latestSubmission
      ? {
          ...latestSubmission,
          documents: latestDocuments,
          sectionReviews: latestSectionReviews,
        }
      : null,
    sectionReviewsMap,
    documentsMap,
    draft: draftRecord || null,
    availableProfiles,
    isOwner,
    userRole: membership?.role || 'VIEWER',
  };
});

/**
 * Saves in-progress verification draft per step.
 * Prevents loss of entered data on page refresh or mid-wizard navigation.
 */
export async function saveVerificationDraftAction(
  outletKey: string,
  currentStep: number,
  payload: Record<string, any>
) {
  try {
    const account = await getAuthenticatedAccount();
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) return { success: false, error: 'Outlet tidak ditemukan.' };

    const [membership] = await db
      .select({ id: memberships.id, role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'OWNER' && (membership.role as string) !== 'SYSTEM_ADMIN')) {
      return { success: false, error: 'Hanya Owner yang berhak menyimpan draft verifikasi.' };
    }

    const [draft] = await db
      .insert(verificationDrafts)
      .values({
        tenantId: tenant.id,
        accountId: account.id,
        currentStep,
        payload,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: verificationDrafts.tenantId,
        set: {
          currentStep,
          payload,
          updatedAt: new Date(),
        },
      })
      .returning();

    return { success: true, draft };
  } catch (err: any) {
    console.error('saveVerificationDraftAction error:', err);
    return { success: false, error: err.message || 'Gagal menyimpan draft verifikasi.' };
  }
}

export interface VerificationApplicationPayload {
  profile: {
    id?: string;
    isCreatingNew: boolean;
    name: string;
    entityType: EntityType;
    taxId?: string | null;
    businessLicenseNumber?: string | null;
  };
  representative: {
    responsiblePersonName: string;
    responsiblePersonPosition?: string | null;
    responsiblePersonNik: string;
    responsiblePersonPhone?: string | null;
    responsiblePersonContact?: string | null;
    responsiblePersonEmail?: string | null;
    responsiblePersonNationality?: string | null;
  };
  settlement: {
    isAddingNew: boolean;
    selectedAccountId?: string | null;
    bankName: string;
    customBankName?: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    isDefault?: boolean;
    proofDocumentKey?: string | null;
  };
  outlet: {
    address: string;
    province?: string | null;
    city: string;
    district?: string | null;
    postalCode: string;
    latitude?: number | null;
    longitude?: number | null;
    mapsUrl?: string | null;
    storefrontPhotoUrl?: string | null;
    indoorPhotoUrl?: string | null;
  };
  documents: VerificationDocumentInput[];
}

/**
 * Unified, atomic verification application submission.
 * Replaces the multi-step sequential client calls with a single ACID database transaction.
 */
export async function submitVerificationApplicationAction(
  outletKey: string,
  payload: VerificationApplicationPayload
) {
  try {
    const account = await getAuthenticatedAccount();

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) return { success: false, error: 'Outlet tidak ditemukan.' };

    const [membership] = await db
      .select({ id: memberships.id, role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'OWNER' && (membership.role as string) !== 'SYSTEM_ADMIN')) {
      return { success: false, error: 'Hanya Pemilik (Owner) yang berhak mengajukan verifikasi.' };
    }

    let targetBpId = payload.profile.id;

    await db.transaction(async (tx) => {
      // If targetBpId was specified, verify it exists in DB
      if (targetBpId && !payload.profile.isCreatingNew) {
        const [existingBp] = await tx
          .select({ id: businessProfiles.id })
          .from(businessProfiles)
          .where(eq(businessProfiles.id, targetBpId))
          .limit(1);
        if (!existingBp) {
          targetBpId = undefined;
        }
      }

      // 1. Business Profile: Create or Update
      if (payload.profile.isCreatingNew || !targetBpId) {
        const [createdProfile] = await tx
          .insert(businessProfiles)
          .values({
            accountId: account.id,
            name: payload.profile.name,
            entityType: payload.profile.entityType,
            taxId: payload.profile.taxId || null,
            businessLicenseNumber: payload.profile.businessLicenseNumber || null,
            responsiblePersonName: payload.representative.responsiblePersonName,
            responsiblePersonNik: payload.representative.responsiblePersonNik,
            responsiblePersonContact:
              payload.representative.responsiblePersonPhone ||
              payload.representative.responsiblePersonContact ||
              '',
            responsiblePersonPosition: payload.representative.responsiblePersonPosition || null,
            responsiblePersonEmail: payload.representative.responsiblePersonEmail || null,
            responsiblePersonNationality: payload.representative.responsiblePersonNationality || null,
            verificationStatus: 'submitted',
          })
          .returning();
        targetBpId = createdProfile.id;
      } else {
        await tx
          .update(businessProfiles)
          .set({
            name: payload.profile.name,
            entityType: payload.profile.entityType,
            taxId: payload.profile.taxId || null,
            businessLicenseNumber: payload.profile.businessLicenseNumber || null,
            responsiblePersonName: payload.representative.responsiblePersonName,
            responsiblePersonNik: payload.representative.responsiblePersonNik,
            responsiblePersonContact:
              payload.representative.responsiblePersonPhone ||
              payload.representative.responsiblePersonContact ||
              '',
            responsiblePersonPosition: payload.representative.responsiblePersonPosition || null,
            responsiblePersonEmail: payload.representative.responsiblePersonEmail || null,
            responsiblePersonNationality: payload.representative.responsiblePersonNationality || null,
            verificationStatus: 'submitted',
            updatedAt: new Date(),
          })
          .where(eq(businessProfiles.id, targetBpId));
      }

      // Link outlet to profile
      await tx
        .update(tenants)
        .set({
          businessProfileId: targetBpId,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      // 2. Settlement Account: Create or Link
      let finalAccountId = payload.settlement.selectedAccountId;
      if (finalAccountId) {
        const [existingAcc] = await tx
          .select({ id: settlementAccounts.id })
          .from(settlementAccounts)
          .where(eq(settlementAccounts.id, finalAccountId))
          .limit(1);
        if (!existingAcc) {
          finalAccountId = undefined;
        } else if (payload.settlement.bankAccountNumber && payload.settlement.bankAccountNumber.trim()) {
          const finalBank =
            payload.settlement.bankName === 'BANK LAINNYA'
              ? payload.settlement.customBankName?.trim() || 'BANK LAINNYA'
              : payload.settlement.bankName || 'BCA';

          const cleanNum = payload.settlement.bankAccountNumber.replace(/\s+/g, '');
          const last4 = cleanNum.slice(-4);
          const masked = cleanNum.length > 4 ? `•••••• ${last4}` : cleanNum;

          await tx
            .update(settlementAccounts)
            .set({
              bankName: finalBank.toUpperCase(),
              bankAccountNumber: cleanNum,
              bankAccountNumberMasked: masked,
              bankAccountHolder:
                payload.settlement.bankAccountHolder ||
                payload.representative.responsiblePersonName ||
                payload.profile.name,
              proofDocumentKey: payload.settlement.proofDocumentKey || null,
              verificationStatus: 'pending',
              verificationNotes: null,
              updatedAt: new Date(),
            })
            .where(eq(settlementAccounts.id, finalAccountId));
        }
      }

      if (payload.settlement.isAddingNew || !finalAccountId) {
        const finalBank =
          payload.settlement.bankName === 'BANK LAINNYA'
            ? payload.settlement.customBankName?.trim() || 'BANK LAINNYA'
            : payload.settlement.bankName || 'BCA';

        const cleanNum = (payload.settlement.bankAccountNumber || '').replace(/\s+/g, '');
        const last4 = cleanNum.slice(-4);
        const masked = cleanNum.length > 4 ? `•••••• ${last4}` : cleanNum;

        const [createdAcc] = await tx
          .insert(settlementAccounts)
          .values({
            businessProfileId: targetBpId!,
            bankName: finalBank.toUpperCase(),
            bankAccountNumber: cleanNum || '0000000000',
            bankAccountNumberMasked: masked || '•••••• 0000',
            bankAccountHolder:
              payload.settlement.bankAccountHolder ||
              payload.representative.responsiblePersonName ||
              payload.profile.name,
            proofDocumentKey: payload.settlement.proofDocumentKey || null,
            verificationStatus: 'pending',
            isDefault: payload.settlement.isDefault ?? true,
          })
          .returning();
        finalAccountId = createdAcc.id;
      }

      // 3. Update Tenant Outlet Details & Compliance Status
      const storefrontDoc = payload.documents.find((d) => d.documentType === 'FOTO_TAMPAK_DEPAN');
      const indoorDoc = payload.documents.find((d) => d.documentType === 'FOTO_KASIR');
      const finalStorefrontKey =
        payload.outlet.storefrontPhotoUrl || storefrontDoc?.storageKey || tenant.storefrontPhotoUrl || null;
      const finalIndoorKey =
        payload.outlet.indoorPhotoUrl || indoorDoc?.storageKey || tenant.indoorPhotoUrl || null;

      await tx
        .update(tenants)
        .set({
          address: payload.outlet.address,
          province: payload.outlet.province || null,
          city: payload.outlet.city,
          district: payload.outlet.district || null,
          postalCode: payload.outlet.postalCode,
          latitude: payload.outlet.latitude ? payload.outlet.latitude.toString() : null,
          longitude: payload.outlet.longitude ? payload.outlet.longitude.toString() : null,
          storefrontPhotoUrl: finalStorefrontKey,
          indoorPhotoUrl: finalIndoorKey,
          mapsUrl: payload.outlet.mapsUrl || null,
          settlementAccountId: finalAccountId || null,
          outletComplianceStatus: 'ready_for_review',
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      // 4. Determine Attempt Number
      const [lastSubmission] = await tx
        .select({ attemptNumber: verificationSubmissions.attemptNumber })
        .from(verificationSubmissions)
        .where(eq(verificationSubmissions.tenantId, tenant.id))
        .orderBy(desc(verificationSubmissions.attemptNumber))
        .limit(1);

      const attemptNumber = (lastSubmission?.attemptNumber || 0) + 1;

      // 5. Create Unified Verification Submission Record
      const snapshot = {
        profile: payload.profile,
        representative: payload.representative,
        settlement: {
          ...payload.settlement,
          finalAccountId,
        },
        outlet: {
          ...payload.outlet,
          storefrontPhotoUrl: finalStorefrontKey,
          indoorPhotoUrl: finalIndoorKey,
        },
        documents: payload.documents.map((d) => ({
          documentType: d.documentType,
          fileName: d.fileName,
          storageKey: d.storageKey,
        })),
      };

      const [submission] = await tx
        .insert(verificationSubmissions)
        .values({
          businessProfileId: targetBpId!,
          tenantId: tenant.id,
          submissionScope: 'APPLICATION',
          attemptNumber,
          status: 'submitted',
          submissionSnapshot: snapshot,
          submittedAt: new Date(),
        })
        .returning();

      // 6. Insert Documents
      for (const doc of payload.documents) {
        await tx.insert(verificationDocuments).values({
          submissionId: submission.id,
          tenantId: tenant.id,
          documentScope: ['KTP', 'NPWP', 'NIB', 'AKTA'].includes(doc.documentType)
            ? 'BUSINESS_PROFILE'
            : 'OUTLET',
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          fileName: doc.fileName,
          fileSizeBytes: doc.fileSizeBytes,
          mimeType: doc.mimeType,
          reviewStatus: 'PENDING',
        });
      }

      // 7. Insert Initial Section Reviews (Inherit previously approved sections on revision)
      const previousApprovedSections = new Set<string>();
      if (attemptNumber > 1) {
        const [prevSub] = await tx
          .select({ id: verificationSubmissions.id })
          .from(verificationSubmissions)
          .where(
            and(
              eq(verificationSubmissions.businessProfileId, targetBpId!),
              eq(verificationSubmissions.attemptNumber, attemptNumber - 1)
            )
          )
          .limit(1);

        if (prevSub) {
          const prevReviews = await tx
            .select()
            .from(verificationSectionReviews)
            .where(eq(verificationSectionReviews.submissionId, prevSub.id));

          for (const pr of prevReviews) {
            if (pr.status === 'APPROVED' || pr.status === 'INHERITED') {
              previousApprovedSections.add(pr.section);
            }
          }
        }
      }

      const sections = ['BUSINESS_PROFILE', 'REPRESENTATIVE', 'SETTLEMENT', 'OUTLET'] as const;
      for (const sec of sections) {
        const isInheritedApproved = previousApprovedSections.has(sec);
        await tx.insert(verificationSectionReviews).values({
          submissionId: submission.id,
          section: sec,
          status: isInheritedApproved ? 'APPROVED' : 'PENDING',
        });
      }

      // 8. Audit Log
      await tx.insert(verificationAuditLogs).values({
        businessProfileId: targetBpId!,
        tenantId: tenant.id,
        actorId: account.id,
        actorRole: membership.role,
        action: 'APPLICATION_SUBMITTED',
        previousStatus: tenant.outletComplianceStatus,
        newStatus: 'submitted',
        metadata: { submissionId: submission.id, attemptNumber, documentCount: payload.documents.length },
      });

      // 9. Clean up Draft
      await tx
        .delete(verificationDrafts)
        .where(eq(verificationDrafts.tenantId, tenant.id));
    });

    revalidatePath(`/outlet/${outletKey}/verification`);
    revalidatePath(`/outlet/${outletKey}/verification/onboarding`);
    revalidatePath(`/system-admin/verification`);

    return { success: true };
  } catch (err: any) {
    console.error('submitVerificationApplicationAction error:', err);
    return { success: false, error: err.message || 'Gagal mengajukan permohonan verifikasi.' };
  }
}

/**
 * Activates DOKU Sub-Account and enables online payments for the specified outlet.
 * Requires all 3 verification pillars to be verified.
 */
export async function activateOutletPaymentAction(outletKey: string) {
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

    // Verify membership / permissions (OWNER or MANAGER)
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: 'Hanya Pemilik (Owner) yang dapat mengaktifkan pembayaran outlet ini.' };
    }

    const result = await provisionDokuSubAccountForTenant(tenant.id, account.id);
    if (!result.success) {
      return { success: false, error: result.error || 'Gagal mengaktifkan akun pembayaran DOKU.' };
    }

    // Ensure online payment is enabled
    await db
      .update(tenants)
      .set({ onlinePaymentEnabled: true, updatedAt: new Date() })
      .where(eq(tenants.id, tenant.id));

    revalidatePath(`/outlet/${outletKey}/verification`);
    revalidatePath(`/outlet/${outletKey}/settings`);
    revalidatePath(`/outlet/${outletKey}`);

    return {
      success: true,
      subAccountId: result.subAccountId,
      message: 'Akun pembayaran DOKU Sub-Account berhasil diaktifkan! QRIS dinamis siap digunakan.',
    };
  } catch (err: any) {
    console.error('activateOutletPaymentAction error:', err);
    return { success: false, error: err.message || 'Gagal mengaktifkan akun pembayaran outlet.' };
  }
}

/**
 * Resets/clears all verification data and drafts associated with an outlet.
 * Allows the merchant or admin to restart the onboarding process from a clean slate.
 */
export async function resetOutletVerificationDataAction(outletKey: string) {
  try {
    const account = await getAuthenticatedAccount();
    if (!account) {
      return { success: false, error: 'Sesi login tidak valid.' };
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.outletKey, outletKey))
      .limit(1);

    if (!tenant) {
      return { success: false, error: 'Outlet tidak ditemukan.' };
    }

    // RBAC: Must be OWNER or SYSTEM_ADMIN
    const [membership] = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenant.id),
          eq(memberships.accountId, account.id),
          eq(memberships.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'OWNER' && (membership.role as string) !== 'SYSTEM_ADMIN')) {
      return { success: false, error: 'Hanya Pemilik (Owner) yang berhak mengatur ulang data outlet.' };
    }

    await db.transaction(async (tx) => {
      // 1. Delete verification drafts for this tenant
      await tx
        .delete(verificationDrafts)
        .where(eq(verificationDrafts.tenantId, tenant.id));

      // 2. Delete verification documents for this tenant
      await tx
        .delete(verificationDocuments)
        .where(eq(verificationDocuments.tenantId, tenant.id));

      // 3. Delete verification submissions for this tenant
      await tx
        .delete(verificationSubmissions)
        .where(eq(verificationSubmissions.tenantId, tenant.id));

      // 4. Delete provider onboardings for this tenant
      await tx
        .delete(providerOnboardings)
        .where(eq(providerOnboardings.tenantId, tenant.id));

      // 5. Reset tenant verification fields
      await tx
        .update(tenants)
        .set({
          businessProfileId: null,
          settlementAccountId: null,
          outletComplianceStatus: 'incomplete',
          address: null,
          province: null,
          city: null,
          district: null,
          postalCode: null,
          latitude: null,
          longitude: null,
          storefrontPhotoUrl: null,
          indoorPhotoUrl: null,
          mapsUrl: null,
          onlinePaymentEnabled: false,
          dokuSubAccountId: null,
          dokuSubAccountStatus: 'NOT_PROVISIONED',
          dokuQrisMerchantId: null,
          dokuQrisTerminalId: null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));
    });

    revalidatePath(`/outlet/${outletKey}/verification`);
    revalidatePath(`/outlet/${outletKey}/verification/onboarding`);
    revalidatePath(`/outlet/${outletKey}/settings`);
    revalidatePath(`/outlet/${outletKey}`);

    return { success: true, message: 'Data verifikasi outlet berhasil dikosongkan.' };
  } catch (err: any) {
    console.error('resetOutletVerificationDataAction error:', err);
    return { success: false, error: err.message || 'Gagal mengosongkan data verifikasi outlet.' };
  }
}


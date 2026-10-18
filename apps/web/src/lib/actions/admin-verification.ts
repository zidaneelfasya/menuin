'use server';

import { db } from '@/lib/db';
import {
  verificationSubmissions,
  verificationDocuments,
  businessProfiles,
  settlementAccounts,
  tenants,
  verificationAuditLogs,
  accounts,
  memberships,
  verificationSectionReviews,
} from '@/lib/db/schema';
import { eq, and, desc, sql, inArray, ne, gt, or } from 'drizzle-orm';
import { getAuthenticatedAccount } from './auth-context';
import { getCurrentUser } from './auth';
import {
  hasPermission,
  assertPermission,
  Role,
  VerificationPermissions,
  type RoleType,
} from '@menuin/permissions';
import {
  decideBusinessVerificationTransition,
  decideOutletComplianceTransition,
} from '@/lib/verification/state-machine';
import { adminReviewDecisionSchema } from '@menuin/validation';
import type {
  BusinessProfileVerificationStatus,
  DocumentReviewStatus,
  OutletComplianceStatus,
  VerificationSubmissionScope,
} from '@menuin/types';
import { revalidatePath } from 'next/cache';

/**
 * Returns current caller's administrative role.
 */
async function getAdminCaller() {
  const account = await getAuthenticatedAccount();
  
  // Platform Role takes precedence
  let role: RoleType = Role.STAFF;
  if (account.systemRole === 'SYSTEM_ADMIN' || account.systemRole === 'SUPERADMIN') {
    role = Role.SYSTEM_ADMIN;
  } else if (account.systemRole === 'VERIFICATION_ADMIN') {
    role = 'VERIFICATION_ADMIN';
  } else if (account.systemRole === 'CARE_AGENT') {
    role = 'CARE_AGENT';
  }

  return { account, role };
}

export interface VerificationQueueFilter {
  status?: string;
  scope?: VerificationSubmissionScope | 'ALL';
  search?: string;
}

/**
 * Fetches verification submissions queue for admin review.
 */
export async function getVerificationQueue(filters?: VerificationQueueFilter) {
  const { role } = await getAdminCaller();

  // Guard: Must have permission to view queue
  const isSuperOrSystem =
    role === Role.SYSTEM_ADMIN ||
    role === Role.SUPERADMIN ||
    (role as string) === 'VERIFICATION_ADMIN' ||
    role === Role.OWNER; // Dev fallback

  if (!isSuperOrSystem && !hasPermission(role, VerificationPermissions.VIEW_QUEUE)) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk melihat antrean verifikasi.');
  }

  const query = db
    .select({
      id: verificationSubmissions.id,
      submissionScope: verificationSubmissions.submissionScope,
      attemptNumber: verificationSubmissions.attemptNumber,
      status: verificationSubmissions.status,
      submittedAt: verificationSubmissions.submittedAt,
      createdAt: verificationSubmissions.createdAt,
      reviewedAt: verificationSubmissions.reviewedAt,
      reviewedBy: verificationSubmissions.reviewedBy,
      decisionReason: verificationSubmissions.decisionReason,
      businessProfileId: verificationSubmissions.businessProfileId,
      businessProfileName: businessProfiles.name,
      businessEntityType: businessProfiles.entityType,
      tenantId: verificationSubmissions.tenantId,
      tenantName: tenants.name,
      reviewerName: accounts.name,
    })
    .from(verificationSubmissions)
    .innerJoin(
      businessProfiles,
      eq(verificationSubmissions.businessProfileId, businessProfiles.id)
    )
    .leftJoin(tenants, eq(verificationSubmissions.tenantId, tenants.id))
    .leftJoin(accounts, eq(verificationSubmissions.reviewedBy, accounts.id))
    .orderBy(
      desc(verificationSubmissions.attemptNumber),
      desc(verificationSubmissions.submittedAt),
      desc(verificationSubmissions.createdAt)
    );

  const rawRows = await query;

  // Entity-Centric Deduplication: 1 Outlet / 1 Business Profile = 1 Row in Queue (Latest Attempt)
  const latestByEntity = new Map<string, typeof rawRows[0]>();
  for (const r of rawRows) {
    const entityKey = r.tenantId ? `tenant_${r.tenantId}` : `bp_${r.businessProfileId}`;
    if (!latestByEntity.has(entityKey)) {
      latestByEntity.set(entityKey, r);
    }
  }
  const rows = Array.from(latestByEntity.values());

  // Filter in memory for flexibility
  let filtered = rows;
  if (filters?.status && filters.status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === filters.status);
  }
  if (filters?.scope && filters.scope !== 'ALL') {
    filtered = filtered.filter((r) => r.submissionScope === filters.scope);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.businessProfileName?.toLowerCase().includes(s) ||
        r.tenantName?.toLowerCase().includes(s)
    );
  }

  // Fetch section reviews for queue rows
  const subIds = rows.map((r) => r.id);
  const allSectionReviews = subIds.length > 0
    ? await db
        .select()
        .from(verificationSectionReviews)
        .where(inArray(verificationSectionReviews.submissionId, subIds))
    : [];

  const sectionMap = new Map<string, any[]>();
  for (const sr of allSectionReviews) {
    const list = sectionMap.get(sr.submissionId) || [];
    list.push(sr);
    sectionMap.set(sr.submissionId, list);
  }

  const enriched = filtered.map((r) => ({
    ...r,
    sectionReviews: sectionMap.get(r.id) || [],
  }));

  // Queue counters (reflecting unique merchant entities in each state)
  const counts = {
    all: rows.length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    under_review: rows.filter((r) => r.status === 'under_review').length,
    action_required: rows.filter((r) => r.status === 'action_required').length,
    verified: rows.filter((r) => r.status === 'verified').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };

  return { queue: enriched, counts };
}

/**
 * Get detailed submission record for review console.
 */
export async function getVerificationSubmissionDetail(submissionId: string) {
  const { role } = await getAdminCaller();

  const isSuperOrSystem =
    role === Role.SYSTEM_ADMIN ||
    role === Role.SUPERADMIN ||
    (role as string) === 'VERIFICATION_ADMIN';

  if (!isSuperOrSystem && !hasPermission(role, VerificationPermissions.VIEW_DETAIL)) {
    throw new Error('Akses ditolak: Anda tidak memiliki izin untuk memeriksa dokumen verifikasi.');
  }

  const [submission] = await db
    .select({
      id: verificationSubmissions.id,
      submissionScope: verificationSubmissions.submissionScope,
      attemptNumber: verificationSubmissions.attemptNumber,
      status: verificationSubmissions.status,
      submissionSnapshot: verificationSubmissions.submissionSnapshot,
      submittedAt: verificationSubmissions.submittedAt,
      createdAt: verificationSubmissions.createdAt,
      reviewedAt: verificationSubmissions.reviewedAt,
      reviewedBy: verificationSubmissions.reviewedBy,
      decisionReason: verificationSubmissions.decisionReason,
      internalNotes: verificationSubmissions.internalNotes,
      businessProfileId: verificationSubmissions.businessProfileId,
      tenantId: verificationSubmissions.tenantId,
      businessProfileName: businessProfiles.name,
      businessEntityType: businessProfiles.entityType,
      businessVerificationStatus: businessProfiles.verificationStatus,
      businessProfileTaxId: businessProfiles.taxId,
      businessProfileLicenseNumber: businessProfiles.businessLicenseNumber,
      businessProfileResponsiblePersonName: businessProfiles.responsiblePersonName,
      businessProfileResponsiblePersonNik: businessProfiles.responsiblePersonNik,
      businessProfileResponsiblePersonContact: businessProfiles.responsiblePersonContact,
      tenantName: tenants.name,
      outletComplianceStatus: tenants.outletComplianceStatus,
      tenantAddress: tenants.address,
      tenantCity: tenants.city,
      tenantPostalCode: tenants.postalCode,
      tenantLatitude: tenants.latitude,
      tenantLongitude: tenants.longitude,
      tenantMapsUrl: tenants.mapsUrl,
      tenantStorefrontPhotoUrl: tenants.storefrontPhotoUrl,
      tenantIndoorPhotoUrl: tenants.indoorPhotoUrl,
      tenantSettlementAccountId: tenants.settlementAccountId,
    })
    .from(verificationSubmissions)
    .innerJoin(
      businessProfiles,
      eq(verificationSubmissions.businessProfileId, businessProfiles.id)
    )
    .leftJoin(tenants, eq(verificationSubmissions.tenantId, tenants.id))
    .where(eq(verificationSubmissions.id, submissionId))
    .limit(1);

  if (!submission) return null;

  const documents = await db
    .select()
    .from(verificationDocuments)
    .where(eq(verificationDocuments.submissionId, submissionId));

  const auditHistory = await db
    .select({
      id: verificationAuditLogs.id,
      action: verificationAuditLogs.action,
      actorRole: verificationAuditLogs.actorRole,
      previousStatus: verificationAuditLogs.previousStatus,
      newStatus: verificationAuditLogs.newStatus,
      reason: verificationAuditLogs.reason,
      createdAt: verificationAuditLogs.createdAt,
      actorName: accounts.name,
    })
    .from(verificationAuditLogs)
    .leftJoin(accounts, eq(verificationAuditLogs.actorId, accounts.id))
    .where(eq(verificationAuditLogs.businessProfileId, submission.businessProfileId))
    .orderBy(desc(verificationAuditLogs.createdAt))
    .limit(20);

  // Fetch settlement accounts for this business profile
  const profileSettlementAccounts = await db
    .select()
    .from(settlementAccounts)
    .where(eq(settlementAccounts.businessProfileId, submission.businessProfileId))
    .orderBy(desc(settlementAccounts.isDefault), desc(settlementAccounts.createdAt));

  // Fetch section reviews
  const sectionReviews = await db
    .select()
    .from(verificationSectionReviews)
    .where(eq(verificationSectionReviews.submissionId, submissionId));

  // Determine if a newer submission exists for this tenant / business profile
  const newerSubmissions = await db
    .select({
      id: verificationSubmissions.id,
      attemptNumber: verificationSubmissions.attemptNumber,
      status: verificationSubmissions.status,
      submittedAt: verificationSubmissions.submittedAt,
      createdAt: verificationSubmissions.createdAt,
    })
    .from(verificationSubmissions)
    .where(
      and(
        submission.tenantId
          ? eq(verificationSubmissions.tenantId, submission.tenantId)
          : eq(verificationSubmissions.businessProfileId, submission.businessProfileId),
        ne(verificationSubmissions.id, submission.id),
        or(
          gt(verificationSubmissions.attemptNumber, submission.attemptNumber),
          gt(verificationSubmissions.createdAt, submission.createdAt)
        )
      )
    )
    .orderBy(desc(verificationSubmissions.attemptNumber), desc(verificationSubmissions.createdAt))
    .limit(1);

  const isSuperseded = newerSubmissions.length > 0;
  const isDecisionIssued = ['action_required', 'verified', 'rejected'].includes(submission.status);

  return {
    submission,
    documents,
    sectionReviews,
    auditHistory,
    settlementAccounts: profileSettlementAccounts,
    isSuperseded,
    isDecisionIssued,
    newerSubmissionId: newerSubmissions[0]?.id || null,
    newerAttemptNumber: newerSubmissions[0]?.attemptNumber || null,
  };
}

/**
 * Review action specifically for a settlement bank account.
 */
export async function adminReviewSettlementAccountAction(
  accountId: string,
  decision: 'APPROVE' | 'REJECT',
  notes?: string
) {
  try {
    const { account: admin, role } = await getAdminCaller();

    const isSuperOrSystem =
      role === Role.SYSTEM_ADMIN ||
      role === Role.SUPERADMIN ||
      (role as string) === 'VERIFICATION_ADMIN' ||
      role === Role.OWNER;

    if (!isSuperOrSystem && !hasPermission(role, VerificationPermissions.REVIEW)) {
      throw new Error('Akses ditolak: Anda tidak memiliki izin untuk memverifikasi rekening settlement.');
    }

    const [targetAccount] = await db
      .select()
      .from(settlementAccounts)
      .where(eq(settlementAccounts.id, accountId))
      .limit(1);

    if (!targetAccount) {
      return { success: false, error: 'Rekening settlement tidak ditemukan.' };
    }

    const newStatus = decision === 'APPROVE' ? 'verified' : 'rejected';

    await db
      .update(settlementAccounts)
      .set({
        verificationStatus: newStatus,
        verificationNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(settlementAccounts.id, targetAccount.id));

    await db.insert(verificationAuditLogs).values({
      businessProfileId: targetAccount.businessProfileId,
      actorId: admin.id,
      actorRole: role,
      action: 'SETTLEMENT_ACCOUNT_REVIEWED',
      previousStatus: targetAccount.verificationStatus,
      newStatus,
      reason: notes || null,
      metadata: {
        accountId: targetAccount.id,
        bankName: targetAccount.bankName,
        accountHolder: targetAccount.bankAccountHolder,
        decision,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('adminReviewSettlementAccountAction error:', err);
    return { success: false, error: err.message || 'Gagal meninjau rekening settlement.' };
  }
}

/**
 * Claim submission to start review (transitions status to 'under_review').
 */
export async function claimVerificationReviewAction(submissionId: string) {
  try {
    const { account, role } = await getAdminCaller();

    const [sub] = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: 'Pengajuan tidak ditemukan.' };

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, sub.businessProfileId))
      .limit(1);

    if (!profile) return { success: false, error: 'Profil bisnis tidak ditemukan.' };

    // Transition profile state
    if (sub.submissionScope === 'BUSINESS_PROFILE') {
      const transition = decideBusinessVerificationTransition(
        profile.verificationStatus as BusinessProfileVerificationStatus,
        'CLAIM_REVIEW',
        'ADMIN'
      );
      if (transition.success) {
        await db
          .update(businessProfiles)
          .set({ verificationStatus: transition.nextStatus, updatedAt: new Date() })
          .where(eq(businessProfiles.id, profile.id));
      }
    }

    await db
      .update(verificationSubmissions)
      .set({
        status: 'under_review',
        reviewedBy: account.id,
        updatedAt: new Date(),
      })
      .where(eq(verificationSubmissions.id, submissionId));

    await db.insert(verificationAuditLogs).values({
      businessProfileId: sub.businessProfileId,
      tenantId: sub.tenantId,
      actorId: account.id,
      actorRole: role,
      action: 'CLAIMED_REVIEW',
      previousStatus: sub.status,
      newStatus: 'under_review',
      metadata: { submissionId },
    });

    revalidatePath('/system-admin/verification');
    revalidatePath(`/system-admin/verification/${submissionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('claimVerificationReviewAction error:', err);
    return { success: false, error: err.message || 'Gagal memulai peninjauan.' };
  }
}

/**
 * Submits Review Decision (APPROVE, REQUEST_CHANGES, REJECT)
 */
export async function submitVerificationDecisionAction(
  submissionId: string,
  rawDecisionInput: unknown
) {
  try {
    const { account, role } = await getAdminCaller();
    const validated = adminReviewDecisionSchema.parse(rawDecisionInput);

    const [sub] = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: 'Pengajuan tidak ditemukan.' };

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, sub.businessProfileId))
      .limit(1);

    if (!profile) return { success: false, error: 'Profil bisnis tidak ditemukan.' };

    // Immutability Guard: Reject if superseded by a newer submission
    const newerSubmissions = await db
      .select({
        id: verificationSubmissions.id,
        attemptNumber: verificationSubmissions.attemptNumber,
      })
      .from(verificationSubmissions)
      .where(
        and(
          sub.tenantId
            ? eq(verificationSubmissions.tenantId, sub.tenantId)
            : eq(verificationSubmissions.businessProfileId, sub.businessProfileId),
          ne(verificationSubmissions.id, sub.id),
          or(
            gt(verificationSubmissions.attemptNumber, sub.attemptNumber),
            gt(verificationSubmissions.createdAt, sub.createdAt)
          )
        )
      )
      .limit(1);

    if (newerSubmissions.length > 0) {
      return {
        success: false,
        error: `Pengajuan ini telah digantikan oleh pengajuan yang lebih baru (Ke-${newerSubmissions[0].attemptNumber}). Keputusan verifikasi hanya dapat diberikan pada pengajuan terkini.`,
      };
    }

    let tenant = null;
    if (sub.tenantId) {
      const [t] = await db.select().from(tenants).where(eq(tenants.id, sub.tenantId)).limit(1);
      tenant = t || null;
    }

    let nextSubmissionStatus: string = 'under_review';
    let nextProfileStatus: BusinessProfileVerificationStatus | undefined;
    let nextOutletStatus: OutletComplianceStatus | undefined;

    if (validated.decision === 'APPROVE') {
      nextSubmissionStatus = 'verified';
      nextProfileStatus = 'verified';
      if (tenant) {
        nextOutletStatus = 'verified';
      }
    } else if (validated.decision === 'REQUEST_CHANGES') {
      nextSubmissionStatus = 'action_required';
      // If sections are provided, check which entities need changes
      if (validated.sectionReviews && validated.sectionReviews.length > 0) {
        const bpChanges = validated.sectionReviews.some(
          (s) => (s.section === 'BUSINESS_PROFILE' || s.section === 'REPRESENTATIVE') && s.status === 'CHANGES_REQUESTED'
        );
        const outletChanges = validated.sectionReviews.some(
          (s) => s.section === 'OUTLET' && s.status === 'CHANGES_REQUESTED'
        );
        nextProfileStatus = bpChanges ? 'action_required' : (profile.verificationStatus as any);
        if (tenant) {
          nextOutletStatus = outletChanges ? 'action_required' : (tenant.outletComplianceStatus as any);
        }
      } else {
        nextProfileStatus = 'action_required';
        if (tenant) nextOutletStatus = 'action_required';
      }
    } else if (validated.decision === 'REJECT') {
      nextSubmissionStatus = 'rejected';
      nextProfileStatus = 'rejected';
      if (tenant) nextOutletStatus = 'action_required';
    }

    // DB Transaction
    await db.transaction(async (tx) => {
      // 1. Update Submission
      await tx
        .update(verificationSubmissions)
        .set({
          status: nextSubmissionStatus,
          decisionReason: validated.reason || null,
          internalNotes: validated.internalNotes || null,
          reviewedAt: new Date(),
          reviewedBy: account.id,
          updatedAt: new Date(),
        })
        .where(eq(verificationSubmissions.id, submissionId));

      // 2. Update Business Profile (if applicable)
      if (nextProfileStatus) {
        await tx
          .update(businessProfiles)
          .set({
            verificationStatus: nextProfileStatus,
            updatedAt: new Date(),
          })
          .where(eq(businessProfiles.id, profile.id));
      }

      // 3. Update Tenant Outlet Compliance (if applicable)
      if (nextOutletStatus && tenant) {
        await tx
          .update(tenants)
          .set({
            outletComplianceStatus: nextOutletStatus,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenant.id));
      }

      // 4. Update Document Review Statuses
      if (validated.documentReviews && validated.documentReviews.length > 0) {
        for (const docRev of validated.documentReviews) {
          await tx
            .update(verificationDocuments)
            .set({
              reviewStatus: docRev.status,
              reviewNote: docRev.note || null,
              reviewedAt: new Date(),
            })
            .where(eq(verificationDocuments.id, docRev.documentId));
        }
      }

      // 5. Upsert Section Reviews
      if (validated.sectionReviews && validated.sectionReviews.length > 0) {
        await tx
          .delete(verificationSectionReviews)
          .where(eq(verificationSectionReviews.submissionId, submissionId));

        for (const secRev of validated.sectionReviews) {
          await tx.insert(verificationSectionReviews).values({
            submissionId,
            section: secRev.section,
            status: secRev.status,
            note: secRev.note || null,
            flaggedFields: secRev.flaggedFields || null,
            reviewedBy: account.id,
            reviewedAt: new Date(),
          });
        }

        // Handle Settlement Section Review status
        const settlementSec = validated.sectionReviews.find((s) => s.section === 'SETTLEMENT');
        if (settlementSec) {
          const targetSaId = tenant?.settlementAccountId;
          if (targetSaId) {
            await tx
              .update(settlementAccounts)
              .set({
                verificationStatus: settlementSec.status === 'APPROVED' ? 'verified' : 'rejected',
                verificationNotes: settlementSec.note || null,
                updatedAt: new Date(),
              })
              .where(eq(settlementAccounts.id, targetSaId));
          }
        }
      }

      // 6. Audit Log
      await tx.insert(verificationAuditLogs).values({
        businessProfileId: profile.id,
        tenantId: sub.tenantId,
        actorId: account.id,
        actorRole: role,
        action: `DECISION_${validated.decision}`,
        previousStatus: sub.status,
        newStatus: nextSubmissionStatus,
        reason: validated.reason || null,
        metadata: {
          submissionId,
          internalNotes: validated.internalNotes || null,
          documentReviewsCount: validated.documentReviews?.length || 0,
          sectionReviewsCount: validated.sectionReviews?.length || 0,
        },
      });
    });

    revalidatePath('/system-admin/verification');
    revalidatePath(`/system-admin/verification/${submissionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('submitVerificationDecisionAction error:', err);
    return { success: false, error: err.message || 'Gagal menyimpan keputusan verifikasi.' };
  }
}

/**
 * Allows admin / CS to reopen a rejected or locked submission for merchant revision.
 */
export async function adminReopenVerificationAction(submissionId: string, note?: string) {
  try {
    const { account, role } = await getAdminCaller();
    const [sub] = await db
      .select()
      .from(verificationSubmissions)
      .where(eq(verificationSubmissions.id, submissionId))
      .limit(1);

    if (!sub) return { success: false, error: 'Pengajuan tidak ditemukan.' };

    await db.transaction(async (tx) => {
      await tx
        .update(verificationSubmissions)
        .set({
          status: 'action_required',
          decisionReason: note || 'Pengajuan dibuka kembali oleh admin kepatuhan untuk perbaikan merchant.',
          reviewedAt: new Date(),
          reviewedBy: account.id,
          updatedAt: new Date(),
        })
        .where(eq(verificationSubmissions.id, submissionId));

      await tx
        .update(businessProfiles)
        .set({ verificationStatus: 'action_required', updatedAt: new Date() })
        .where(eq(businessProfiles.id, sub.businessProfileId));

      if (sub.tenantId) {
        await tx
          .update(tenants)
          .set({ outletComplianceStatus: 'action_required', updatedAt: new Date() })
          .where(eq(tenants.id, sub.tenantId));
      }

      await tx.insert(verificationAuditLogs).values({
        businessProfileId: sub.businessProfileId,
        tenantId: sub.tenantId,
        actorId: account.id,
        actorRole: role,
        action: 'APPLICATION_REOPENED',
        previousStatus: sub.status,
        newStatus: 'action_required',
        reason: note || 'Buka kembali pengajuan oleh admin',
      });
    });

    revalidatePath('/system-admin/verification');
    revalidatePath(`/system-admin/verification/${submissionId}`);
    return { success: true };
  } catch (err: any) {
    console.error('adminReopenVerificationAction error:', err);
    return { success: false, error: err.message || 'Gagal membuka kembali pengajuan.' };
  }
}
